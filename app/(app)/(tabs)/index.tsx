import { SearchModeCard } from '../../../components/home/search-mode-card';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../lib/contexts/auth';
import { cn } from '../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions, Platform, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Utensils, Beer, Coffee, Wine, Music, Pizza } from 'lucide-react-native';
import { useMemo, useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { THEME } from '../../../lib/theme';
import { useSettings } from '../../../lib/contexts/settings';

// Conditional import for react-native-maps (not available on web)
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (e) {
    // Maps not available
  }
}
import { placesListService } from '../../../lib/services/places-list';
import type { Place } from '../../../lib/types/suggestion';
import { API_CONFIG } from '../../../lib/config';

import { CreateMenuSheet } from '../../../components/social/create-menu-sheet';
import { StoriesCarousel } from '../../../components/social/stories-carousel';

// Helper function to get appropriate icon based on place category
const getPlaceIcon = (category: string) => {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('ristorante') || categoryLower.includes('restaurant') || categoryLower.includes('cucina')) {
    return Utensils;
  }
  if (categoryLower.includes('pizza') || categoryLower.includes('pizzeria')) {
    return Pizza;
  }
  if (categoryLower.includes('bar') && categoryLower.includes('vino') || categoryLower.includes('wine')) {
    return Wine;
  }
  if (categoryLower.includes('caffè') || categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
    return Coffee;
  }
  if (categoryLower.includes('birra') || categoryLower.includes('pub') || categoryLower.includes('birreria')) {
    return Beer;
  }
  if (categoryLower.includes('club') || categoryLower.includes('discoteca') || categoryLower.includes('musica')) {
    return Music;
  }

  // Default icon
  return MapPin;
};

// Helper function to get icon color based on category
const getPlaceIconColor = (category: string) => {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('ristorante') || categoryLower.includes('restaurant') || categoryLower.includes('cucina')) {
    return '#ef4444'; // red
  }
  if (categoryLower.includes('pizza') || categoryLower.includes('pizzeria')) {
    return '#f97316'; // orange
  }
  if (categoryLower.includes('bar') && categoryLower.includes('vino') || categoryLower.includes('wine')) {
    return '#8b5cf6'; // purple
  }
  if (categoryLower.includes('caffè') || categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
    return '#a3a3a3'; // gray
  }
  if (categoryLower.includes('birra') || categoryLower.includes('pub') || categoryLower.includes('birreria')) {
    return '#eab308'; // yellow
  }
  if (categoryLower.includes('club') || categoryLower.includes('discoteca') || categoryLower.includes('musica')) {
    return '#ec4899'; // pink
  }

  // Default color
  return '#3b82f6'; // blue
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  // Get dynamic colors for icons - use settings theme if available, otherwise use colorScheme
  const effectiveTheme = settings?.theme === 'system' 
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storiesRefreshTrigger, setStoriesRefreshTrigger] = useState(0);

  const handleOpenCreateMenu = () => {
    setShowCreateMenu(true);
  };

  const handleCloseCreateMenu = () => {
    setShowCreateMenu(false);
  };

  // Memoized user name extraction with proper error handling
  const userName = useMemo(() => {
    try {
      if (user?.displayName?.trim()) {
        return user.displayName.split(' ')[0];
      }
      if (user?.email?.includes('@')) {
        return user.email.split('@')[0];
      }
    } catch (error) {
      console.warn('Error parsing user name:', error);
    }
    return 'Amico';
  }, [user]);




  // Fetch location and places
  const fetchPlaces = async () => {
    let mounted = true;
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      let userLocation: { lat: number; lon: number };

      if (status === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          userLocation = {
            lat: currentLocation.coords.latitude,
            lon: currentLocation.coords.longitude,
          };
        } catch (error) {
          console.warn('Error getting location:', error);
          // Fallback to default location
          userLocation = API_CONFIG.DEFAULT_LOCATION;
        }
      } else {
        // Fallback to default location if permission denied
        userLocation = API_CONFIG.DEFAULT_LOCATION;
      }

      if (!mounted) return;
      setLocation(userLocation);

      // Fetch places within 20km radius
      const { data, error } = await placesListService.getPlaces(
        { max_distance_km: 20 }, // filter places within 20km
        userLocation
      );

      if (!mounted) return;

      if (error) {
        console.error('Error fetching places:', error);
      } else if (data) {
        setPlaces(data.data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      if (mounted) {
        setIsLoadingPlaces(false);
      }
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setIsLoadingPlaces(true);
    // Trigger stories refresh first
    setStoriesRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('Incrementing stories refresh trigger:', newValue);
      return newValue;
    });
    await fetchPlaces();
    setRefreshing(false);
  };

  const mapRef = useRef<any>(null);

  // ... existing code ...

  // Animate to user location when available
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location]);

  return (
    <View className="flex-1 bg-background">
      {/* Full Screen Map - Only render on native platforms */}
      {MapView && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: location?.lat || API_CONFIG.DEFAULT_LOCATION.lat,
            longitude: location?.lon || API_CONFIG.DEFAULT_LOCATION.lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          customMapStyle={colorScheme === 'dark' ? DARK_MAP_STYLE : []}
        >
          {places.map((place) => {
            const IconComponent = getPlaceIcon(place.category);
            const iconColor = getPlaceIconColor(place.category);

            return (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={`${place.category} • ${place.address}`}
                onPress={() => router.push(`/place/${place.id}` as any)}
              >
                <View
                  className="rounded-full p-2 shadow-lg border-2 border-white"
                  style={{ backgroundColor: iconColor }}
                >
                  <IconComponent size={16} color="white" />
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Overlays */}
      <SafeAreaView className="flex-1" edges={['top']} pointerEvents="box-none">
        <View className="flex-1 justify-between" pointerEvents="box-none">
          {/* Top Section: Header & Stories with Pull-to-Refresh */}
          <ScrollView
            contentContainerStyle={{ 
              paddingBottom: 20,
            }}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={themeColors.foreground}
                colors={[themeColors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEnabled={true}
            style={{ maxHeight: 120 }}
            pointerEvents="box-none"
          >
            <View pointerEvents="box-none">
              {/* Header Background Gradient/Overlay */}
              <View
                className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-48 -z-10"
                pointerEvents="none"
              />

              {/* Stories */}
              <View className="pl-2" pointerEvents="auto">
                <StoriesCarousel 
                  onCreatePress={handleOpenCreateMenu}
                  refreshTrigger={storiesRefreshTrigger}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Create Menu Modal */}
      <CreateMenuSheet
        isOpen={showCreateMenu}
        onClose={handleCloseCreateMenu}
      />
    </View>
  );
}

const DARK_MAP_STYLE = [
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
