import { Text } from '../../../components/ui/text';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { ImageGallery } from '../../../components/common/image-gallery';
import { ExpandableText } from '../../../components/common/expandable-text';
import { ShareButton } from '../../../components/common/share-button';
import { MapLinkButton } from '../../../components/common/map-link-button';
import { placesService, type PlaceDetail } from '../../../lib/services/places';
import { useFavorites } from '../../../lib/contexts/favorites';
import { useAuth } from '../../../lib/contexts/auth';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Linking, Pressable, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Phone, Globe, Instagram, Facebook, MapPin, Clock, Euro } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function PlaceDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const { isFavorite, getFavoriteId, addFavorite, removeFavorite } = useFavorites();
  
  const id = params.id as string;
  const aiReason = params.ai_reason as string | undefined;

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  const isPlaceFavorite = isFavorite('place', id);
  const favoriteId = getFavoriteId('place', id);

  useEffect(() => {
    loadPlace();
  }, [id]);

  const loadPlace = async () => {
    setLoading(true);
    setError(null);

    // Try to get user location for distance calculation
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: currentLocation.coords.latitude,
          lon: currentLocation.coords.longitude,
        });
      }
    } catch (err) {
      console.log('Could not get location for distance calculation');
    }

    const { data, error: err } = await placesService.getPlaceById(id, location || undefined);

    if (err) {
      setError(err);
    } else if (data) {
      setPlace(data);
    }

    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!session) {
      Alert.alert('Login Richiesto', 'Devi effettuare il login per salvare i preferiti');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isPlaceFavorite && favoriteId) {
        await removeFavorite(favoriteId, 'place');
      } else {
        await addFavorite({ resource_type: 'place', resource_id: id });
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare i preferiti');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Dettaglio', headerShown: true, headerBackTitle: ' ' }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !place) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Errore', headerShown: true, headerBackTitle: ' ' }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-lg text-muted-foreground">
            {error || 'Locale non trovato'}
          </Text>
          <Button onPress={() => router.back()} className="mt-4">
            <Text>Torna indietro</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const images = place.gallery_images && place.gallery_images.length > 0
    ? place.gallery_images
    : place.cover_image
    ? [place.cover_image]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: place.name,
          headerShown: true,
          headerBackTitle: ' ',
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ImageGallery images={images} height={300} />

        <View className="p-4 gap-6">
          {/* Header */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-2xl font-bold">{place.name}</Text>
              {place.verified && (
                <Badge variant="default" className="ml-2">
                  <Text className="text-xs">✓ Verificato</Text>
                </Badge>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              <Badge variant="secondary">
                <Text className="text-xs">{place.category}</Text>
              </Badge>
              {place.price_range && (
                <Badge variant="outline">
                  <Text className="text-xs">{place.price_range}</Text>
                </Badge>
              )}
              {place.distance_km !== undefined && (
                <Badge variant="outline">
                  <Text className="text-xs">{place.distance_km.toFixed(1)} km</Text>
                </Badge>
              )}
            </View>
          </View>

          {/* AI Reason Highlight */}
          {aiReason && (
            <Card className="border-l-4 border-primary">
              <CardContent className="p-4">
                <Text className="text-sm font-semibold text-primary">💡 Perfetto per te</Text>
                <Text className="mt-2 text-sm leading-relaxed">{aiReason}</Text>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {place.description && (
            <View>
              <Text className="mb-2 text-lg font-semibold">Descrizione</Text>
              <ExpandableText text={place.description} numberOfLines={3} />
            </View>
          )}

          {/* Quick Info Grid */}
          <View className="gap-4">
            <Text className="text-lg font-semibold">Informazioni</Text>

            {/* Address */}
            <View className="flex-row items-start gap-3">
              <MapPin size={20} className="mt-1 text-muted-foreground" />
              <View className="flex-1">
                <Text className="font-medium">Indirizzo</Text>
                <Text className="text-sm text-muted-foreground">
                  {place.address}
                  {place.city && `, ${place.city}`}
                  {place.postal_code && ` ${place.postal_code}`}
                </Text>
              </View>
            </View>

            {/* Ambience Tags */}
            {place.ambience_tags && place.ambience_tags.length > 0 && (
              <View className="flex-row items-start gap-3">
                <View className="mt-1">
                  <Text>🎭</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium">Atmosfera</Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {place.ambience_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <Text className="text-xs">{tag}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Music Genre */}
            {place.music_genre && place.music_genre.length > 0 && (
              <View className="flex-row items-start gap-3">
                <View className="mt-1">
                  <Text>🎵</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium">Genere Musicale</Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {place.music_genre.map((genre, index) => (
                      <Badge key={index} variant="outline">
                        <Text className="text-xs">{genre}</Text>
                      </Badge>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Capacity */}
            {place.capacity && (
              <View className="flex-row items-start gap-3">
                <View className="mt-1">
                  <Text>👥</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium">Capienza</Text>
                  <Text className="text-sm text-muted-foreground">
                    {place.capacity} persone
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Contact Section */}
          <View className="gap-4">
            <Text className="text-lg font-semibold">Contatti</Text>
            <View className="gap-3">
              {place.phone && (
                <Pressable
                  onPress={() => openLink(`tel:${place.phone}`)}
                  className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <Phone size={20} />
                  <Text className="flex-1">{place.phone}</Text>
                </Pressable>
              )}

              {place.website && (
                <Pressable
                  onPress={() => openLink(place.website!)}
                  className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <Globe size={20} />
                  <Text className="flex-1 text-primary">Visita sito web</Text>
                </Pressable>
              )}

              {place.instagram && (
                <Pressable
                  onPress={() => openLink(`https://instagram.com/${place.instagram!.replace('@', '')}`)}
                  className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <Instagram size={20} />
                  <Text className="flex-1">{place.instagram}</Text>
                </Pressable>
              )}

              {place.facebook && (
                <Pressable
                  onPress={() => openLink(place.facebook!)}
                  className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <Facebook size={20} />
                  <Text className="flex-1 text-primary">Facebook</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Map Button */}
          <MapLinkButton
            latitude={place.latitude}
            longitude={place.longitude}
            label={place.name}
            address={place.address}
          />

          {/* Related Events */}
          {place.events && place.events.length > 0 && (
            <View className="gap-4">
              <Text className="text-lg font-semibold">Eventi in programma</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4">
                <View className="flex-row gap-3 px-4">
                  {place.events.map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => router.push(`/event/${event.id}` as any)}
                      className="w-64 overflow-hidden rounded-xl border border-border bg-card"
                    >
                      {event.cover_image && (
                        <View className="h-32 w-full bg-muted">
                          {/* Image would go here */}
                        </View>
                      )}
                      <View className="p-3">
                        <Text className="font-semibold" numberOfLines={2}>
                          {event.title}
                        </Text>
                        <Text className="mt-1 text-xs text-muted-foreground">
                          {new Date(event.start_datetime).toLocaleDateString('it-IT', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {event.start_datetime && ` • ${new Date(event.start_datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
                        </Text>
                        {event.ticket_price_min !== undefined && (
                          <Text className="mt-2 text-xs font-medium text-primary">
                            Da €{event.ticket_price_min}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Bottom Actions */}
          <View className="flex-row gap-3 pb-4">
            <Button 
              className="flex-1 flex-row gap-2" 
              variant="default"
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                <ActivityIndicator size="small" />
              ) : (
                <>
                  <Heart 
                    size={18} 
                    fill={isPlaceFavorite ? "currentColor" : "none"}
                  />
                  <Text>Salva</Text>
                </>
              )}
            </Button>
            <ShareButton
              className="flex-1"
              variant="outline"
              title={place.name}
              message={`Guarda questo locale: ${place.name}`}
              url={place.website}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
