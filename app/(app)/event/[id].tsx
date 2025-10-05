import { Text } from '../../../components/ui/text';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { ExpandableText } from '../../../components/common/expandable-text';
import { ShareButton } from '../../../components/common/share-button';
import { eventsService, type EventDetail } from '../../../lib/services/events';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Image, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Calendar, Clock, MapPin, Music, Ticket } from 'lucide-react-native';

export default function EventDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await eventsService.getEventById(id);

    if (err) {
      setError(err);
    } else if (data) {
      setEvent(data);
    }

    setLoading(false);
  };

  const getTimeUntilEvent = (startDatetime: string) => {
    const eventDateTime = new Date(startDatetime);
    const now = new Date();
    const diff = eventDateTime.getTime() - now.getTime();

    if (diff < 0) return 'Evento passato';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Tra ${days} giorni`;
    if (hours > 0) return `Tra ${hours} ore`;
    return 'Inizia a breve!';
  };

  const openTicketLink = async () => {
    if (!event?.ticket_url) return;

    try {
      const supported = await Linking.canOpenURL(event.ticket_url);
      if (supported) {
        await Linking.openURL(event.ticket_url);
      }
    } catch (error) {
      console.error('Error opening ticket link:', error);
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

  if (error || !event) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Errore', headerShown: true, headerBackTitle: ' ' }} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-lg text-muted-foreground">
            {error || 'Evento non trovato'}
          </Text>
          <Button onPress={() => router.back()} className="mt-4">
            <Text>Torna indietro</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const eventIsPast = new Date(event.start_datetime) < new Date();
  const isSoldOut = event.ticket_availability === 'sold_out';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: event.title,
          headerShown: true,
          headerBackTitle: ' ',
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {event.cover_image ? (
          <View className="relative h-80 w-full">
            <Image
              source={{ uri: event.cover_image }}
              className="h-full w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            {eventIsPast && (
              <View className="absolute right-4 top-4 rounded-full bg-muted px-4 py-2">
                <Text className="text-sm font-bold">Evento concluso</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="h-80 w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Text className="text-6xl opacity-30">🎉</Text>
          </View>
        )}

        <View className="p-4 gap-6">
          {/* Header */}
          <View className="gap-3">
            <Text className="text-2xl font-bold">{event.title}</Text>
            <View className="flex-row items-center gap-2">
              <Badge variant="secondary">
                <Text className="text-xs">{event.event_type}</Text>
              </Badge>
              {isSoldOut && (
                <Badge variant="destructive">
                  <Text className="text-xs">Sold Out</Text>
                </Badge>
              )}
              {event.ticket_availability === 'limited' && (
                <Badge variant="default">
                  <Text className="text-xs">Ultimi biglietti</Text>
                </Badge>
              )}
            </View>
          </View>

          {/* Date/Time Card */}
          <Card>
            <CardContent className="p-4 gap-3">
              <View className="flex-row items-center gap-3">
                <Calendar size={20} />
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground">Data</Text>
                  <Text className="font-semibold">
                    {new Date(event.start_datetime).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Clock size={20} />
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground">Orario</Text>
                  <Text className="font-semibold">
                    {new Date(event.start_datetime).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {!eventIsPast && (
                <View className="mt-2 rounded-lg bg-primary/10 p-3">
                  <Text className="text-center font-semibold text-primary">
                    {getTimeUntilEvent(event.start_datetime)}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Venue Card */}
          {event.place && (
            <Pressable
              onPress={() => router.push(`/place/${event.place!.id}` as any)}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <View className="flex-row">
                {event.place.cover_image && (
                  <Image
                    source={{ uri: event.place.cover_image }}
                    className="h-24 w-24"
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1 p-3">
                  <View className="flex-row items-center gap-2">
                    <MapPin size={16} />
                    <Text className="text-xs text-muted-foreground">Locale</Text>
                  </View>
                  <Text className="mt-1 font-semibold">{event.place.name}</Text>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    {event.place.address}, {event.place.city}
                  </Text>
                  {event.place.verified && (
                    <Badge variant="default" className="mt-2 self-start">
                      <Text className="text-xs">✓ Verificato</Text>
                    </Badge>
                  )}
                </View>
              </View>
            </Pressable>
          )}

          {/* Description */}
          {event.description && (
            <View>
              <Text className="mb-2 text-lg font-semibold">Descrizione</Text>
              <ExpandableText text={event.description} numberOfLines={3} />
            </View>
          )}

          {/* Lineup */}
          {event.lineup && event.lineup.length > 0 && (
            <View>
              <Text className="mb-3 text-lg font-semibold">Lineup</Text>
              <View className="gap-2">
                {event.lineup.map((performer, index) => (
                  <View key={index} className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Music size={18} />
                    <Text className="flex-1">{performer}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Music Genre */}
          {event.music_genre && event.music_genre.length > 0 && (
            <View>
              <Text className="mb-3 text-lg font-semibold">Genere Musicale</Text>
              <View className="flex-row flex-wrap gap-2">
                {event.music_genre.map((genre, index) => (
                  <Badge key={index} variant="outline">
                    <Text className="text-xs">{genre}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {/* Ticket Info */}
          <Card>
            <CardContent className="p-4 gap-3">
              <View className="flex-row items-center gap-2">
                <Ticket size={20} />
                <Text className="text-lg font-semibold">Biglietti</Text>
              </View>

              {event.ticket_price_min !== undefined && event.ticket_price_max !== undefined && (
                <View>
                  <Text className="text-sm text-muted-foreground">Prezzo</Text>
                  <Text className="text-xl font-bold text-primary">
                    €{event.ticket_price_min}
                    {event.ticket_price_max > event.ticket_price_min && ` - €${event.ticket_price_max}`}
                  </Text>
                </View>
              )}

              {event.ticket_url && !isSoldOut && !eventIsPast && (
                <Button onPress={openTicketLink} className="mt-2">
                  <Text>Acquista Biglietto</Text>
                </Button>
              )}

              {isSoldOut && (
                <View className="rounded-lg bg-destructive/10 p-3">
                  <Text className="text-center font-semibold text-destructive">
                    Biglietti esauriti
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <View className="flex-row gap-3 pb-4">
            <Button className="flex-1 flex-row gap-2" variant="default">
              <Heart size={18} />
              <Text>Salva</Text>
            </Button>
            <ShareButton
              className="flex-1"
              variant="outline"
              title={event.title}
              message={`Guarda questo evento: ${event.title}`}
              url={event.ticket_url}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
