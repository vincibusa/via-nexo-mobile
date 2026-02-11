/**
 * Home Map Component
 * Map view with places markers
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Platform, Text } from 'react-native';
import type { Place } from '../../lib/types/suggestion';
import { PlaceMarker } from './place-marker';

// Conditional import for react-native-maps (not available on web)
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps;
    Marker = maps.Marker || (MapView && MapView.Marker);
  } catch (e) {
    // Maps not available
  }
}

interface HomeMapProps {
  places: Place[];
  location: { lat: number; lon: number } | null;
  onPlacePress: (place: Place) => void;
  selectedPlaceId?: string;
  isDark: boolean;
  onMapRefReady?: (ref: any) => void;
}

// Map style for dark/light mode
const getMapStyle = (isDark: boolean) => {
  if (isDark) {
    return [
      {
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#242f3e"
          }
        ]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#746855"
          }
        ]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#242f3e"
          }
        ]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#d59563"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#d59563"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#263c3f"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#6b9a76"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#38414e"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#212a37"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#9ca5b3"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#746855"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#1f2835"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#f3d19c"
          }
        ]
      },
      {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#2f3948"
          }
        ]
      },
      {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#d59563"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#17263c"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#515c6d"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#17263c"
          }
        ]
      }
    ];
  }

  // Light mode style
  return [];
};

export function HomeMap({
  places,
  location,
  onPlacePress,
  selectedPlaceId,
  isDark,
  onMapRefReady,
}: HomeMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);

  // Expose map ref to parent
  useEffect(() => {
    if (onMapRefReady && mapRef.current) {
      onMapRefReady(mapRef.current);
    }
  }, [mapReady, onMapRefReady]);

  // If maps are not available (web platform), show fallback
  if (!MapView || !Marker) {
    return (
      <View className="flex-1 bg-muted items-center justify-center">
        <View className="p-4 rounded-lg bg-card">
          <Text className="text-card-foreground text-center">
            Map not available on this platform
          </Text>
          <Text className="text-muted-foreground text-sm text-center mt-2">
            {places.length} places found near you
          </Text>
        </View>
      </View>
    );
  }

  // Default to Rome coordinates if no location
  const defaultRegion = {
    latitude: location?.lat || 41.9028,
    longitude: location?.lon || 12.4964,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const centerOnUserLocation = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lon,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 500);
    }
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={defaultRegion}
        customMapStyle={getMapStyle(isDark)}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {/* Place markers */}
        {mapReady && places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => onPlacePress(place)}
          >
            <PlaceMarker
              place={place}
              isSelected={selectedPlaceId === place.id}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
