import { View, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/text';
import { useFavorites } from '../../lib/contexts/favorites';
import { PlaceCard } from '../../components/places/place-card';
import { EventCard } from '../../components/events/event-card';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { Heart } from 'lucide-react-native';

export default function FavoritesScreen() {
  const { places, events, isLoading, removeFavorite, refreshFavorites } = useFavorites();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'places' | 'events'>('places');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFavorites();
    setRefreshing(false);
  };

  // Transform favorites to match card component props
  const transformedPlaces = places.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    description: place.description,
    address: place.address,
    city: place.city,
    latitude: place.latitude,
    longitude: place.longitude,
    cover_image: place.cover_image,
    price_range: place.price_range,
    verified: place.verified,
    is_published: true,
    is_listed: true,
  }));

  const transformedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    start_datetime: event.start_datetime,
    end_datetime: event.end_datetime,
    cover_image: event.cover_image,
    ticket_price_min: event.ticket_price_min,
    ticket_price_max: event.ticket_price_max,
    place: event.place ? {
      id: event.place.id,
      name: event.place.name,
      category: '',
      address: event.place.address,
      city: event.place.city,
      latitude: 0,
      longitude: 0,
      verified: false,
    } : undefined,
  }));

  const renderEmptyState = (type: 'places' | 'events') => (
    <View className="flex-1 items-center justify-center p-8">
      <Heart className="text-muted-foreground mb-4" size={64} />
      <Text className="text-lg font-semibold text-center mb-2">
        Nessun {type === 'places' ? 'locale' : 'evento'} salvato
      </Text>
      <Text className="text-sm text-muted-foreground text-center mb-6">
        {type === 'places'
          ? 'Inizia a salvare i tuoi locali preferiti per trovarli facilmente'
          : 'Salva gli eventi che ti interessano per non perderteli'}
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/' as any)}
        className="bg-primary px-6 py-3 rounded-lg"
      >
        <Text className="text-primary-foreground font-medium">
          {type === 'places' ? 'Esplora Locali' : 'Scopri Eventi'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'I Miei Preferiti',
          headerBackTitle: ' ',
        }}
      />
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        {/* Tabs */}
        <View className="flex-row border-b border-border">
          <TouchableOpacity
            onPress={() => setActiveTab('places')}
            className={`flex-1 py-4 items-center ${
              activeTab === 'places' ? 'border-b-2 border-primary' : ''
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === 'places' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Locali ({places.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('events')}
            className={`flex-1 py-4 items-center ${
              activeTab === 'events' ? 'border-b-2 border-primary' : ''
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === 'events' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Eventi ({events.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="p-4">
            {activeTab === 'places' ? (
              places.length > 0 ? (
                transformedPlaces.map((place) => <PlaceCard key={place.id} place={place} />)
              ) : (
                renderEmptyState('places')
              )
            ) : events.length > 0 ? (
              transformedEvents.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              renderEmptyState('events')
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
