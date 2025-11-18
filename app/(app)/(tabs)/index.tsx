import { SearchModeCard } from '../../../components/home/search-mode-card';
import { Text } from '../../../components/ui/text';
import { useAuth } from '../../../lib/contexts/auth';
import { cn } from '../../../lib/utils';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageCircle, MapPin, Utensils, Beer, Coffee, Wine, Music, Pizza } from 'lucide-react-native';
import { useMemo, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { placesListService } from '../../../lib/services/places-list';
import type { Place } from '../../../lib/types/suggestion';
import { API_CONFIG } from '../../../lib/config';

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
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

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

  // Memoized time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) {
      return `Ciao ${userName} ☀️, cosa facciamo oggi?`;
    }
    if (hour >= 12 && hour < 18) {
      return `Ciao ${userName} 👋, cosa organizziamo per stasera?`;
    }
    if (hour >= 18 && hour < 24) {
      return `Ciao ${userName} 🌙, la serata è tua!`;
    }
    return `Ciao ${userName} 🌃, ancora in giro?`;
  }, [userName]);


  // Fetch location and places
  useEffect(() => {
    let mounted = true;

    const fetchPlaces = async () => {
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

    fetchPlaces();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')} edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="gap-3 p-6">
          <Text
            className="text-2xl font-bold leading-tight"
            accessibilityRole="header"
          >
            {greeting}
          </Text>
          <Text className="text-base text-muted-foreground leading-relaxed">
            Scegli come cercare il tuo locale o evento perfetto
          </Text>
        </View>

        {/* Search Mode Cards */}
        <View className="gap-6 px-6">
          {/* Ricerca Guidata */}
          <SearchModeCard
            icon={Search}
            title="Ricerca Guidata"
            description="Trova rapidamente con filtri: compagnia, mood, budget e orario"
            onPress={() => router.push('/(app)/chat-search?mode=guided' as any)}
          />

          {/* Ricerca Libera (Chat) */}
          <SearchModeCard
            icon={MessageCircle}
            title="Ricerca Libera (Chat)"
            description="Descrivi la tua serata ideale e il nostro AI ti aiuterà"
            onPress={() => router.push('/(app)/chat-search?mode=free' as any)}
          />
        </View>

        {/* Places Map Section */}
        <View className="mt-8 gap-4 pb-6">
          <View className="px-6">
            <Text
              className="text-lg font-semibold"
              accessibilityRole="header"
            >
              Locali entro 20km
            </Text>
          </View>

          {isLoadingPlaces ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" />
              <Text className="mt-4 text-sm text-muted-foreground">
                Caricamento locali...
              </Text>
            </View>
          ) : places.length > 0 ? (
            <View className="mx-6">
              <MapView
                style={{ height: 300, borderRadius: 12 }}
                initialRegion={{
                  latitude: location?.lat || API_CONFIG.DEFAULT_LOCATION.lat,
                  longitude: location?.lon || API_CONFIG.DEFAULT_LOCATION.lon,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={false}
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
            </View>
          ) : (
            <View className="mx-6 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8">
              <Text className="text-center text-sm text-muted-foreground leading-relaxed">
                Nessun locale disponibile{'\n'}nella tua zona al momento
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
