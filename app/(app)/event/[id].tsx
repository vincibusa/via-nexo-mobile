import { Text } from '../../../components/ui/text'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { ExpandableText } from '../../../components/common/expandable-text'
import { MapLinkButton } from '../../../components/common/map-link-button'
import { eventsService, type EventDetail } from '../../../lib/services/events'
import { useFavorites } from '../../../lib/contexts/favorites'
import { useAuth } from '../../../lib/contexts/auth'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
  Alert,
  RefreshControl,
  StyleSheet,
  Share,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Heart, Calendar, Clock, MapPin, Music, Ticket, ChevronLeft, Share2 } from 'lucide-react-native'
import { THEME } from '../../../lib/theme'
import { useSettings } from '../../../lib/contexts/settings'
import { useColorScheme } from 'nativewind'

export default function EventDetailScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()
  const { session } = useAuth()
  const { isFavorite, getFavoriteId, addFavorite, removeFavorite } = useFavorites()
  const { settings } = useSettings()
  const { colorScheme } = useColorScheme()
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()

  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : settings?.theme === 'dark'
    ? 'dark'
    : 'light'
  const themeColors = THEME[effectiveTheme]

  const id = params.id as string
  const fromChat = params.fromChat === '1'

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const isEventFavorite = isFavorite('event', id)
  const favoriteId = getFavoriteId('event', id)

  const heroHeight = screenHeight * 0.35
  const THUMBNAIL_WIDTH = 116
  const THUMBNAIL_ASPECT = 0.65
  const thumbnailHeight = THUMBNAIL_WIDTH / THUMBNAIL_ASPECT
  const coverImage = event?.cover_image
  const thumbnailImage = event?.place?.cover_image || event?.cover_image

  useEffect(() => {
    loadEvent()
  }, [id])

  const loadEvent = async () => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await eventsService.getEventById(id)

    if (err) {
      setError(err)
    } else if (data) {
      setEvent(data)
    }

    setLoading(false)
  }

  const handleToggleFavorite = async () => {
    if (!session) {
      Alert.alert('Login Richiesto', 'Devi effettuare il login per salvare i preferiti')
      return
    }

    setFavoriteLoading(true)
    try {
      if (isEventFavorite && favoriteId) {
        await removeFavorite(favoriteId, 'event')
      } else {
        await addFavorite({ resource_type: 'event', resource_id: id })
      }
    } catch (err) {
      Alert.alert('Errore', 'Impossibile aggiornare i preferiti')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleShare = async () => {
    if (!event) return
    try {
      await Share.share({
        message: `Guarda questo evento: ${event.title}`,
        title: event.title,
        url: event.ticket_url
      })
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  const getTimeUntilEvent = (startDatetime: string) => {
    const eventDateTime = new Date(startDatetime)
    const now = new Date()
    const diff = eventDateTime.getTime() - now.getTime()

    if (diff < 0) return 'Evento passato'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `Tra ${days} giorni`
    if (hours > 0) return `Tra ${hours} ore`
    return 'Inizia a breve!'
  }

  const openTicketLink = async () => {
    if (!event?.ticket_url) return

    try {
      const supported = await Linking.canOpenURL(event.ticket_url)
      if (supported) {
        await Linking.openURL(event.ticket_url)
      }
    } catch (err) {
      console.error('Error opening ticket link:', err)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadEvent()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.foreground} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !event) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-center text-lg text-muted-foreground">
            {error || 'Evento non trovato'}
          </Text>
          <Button onPress={() => router.back()} className="mt-4">
            <Text>Torna indietro</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const eventIsPast = new Date(event.start_datetime) < new Date()
  const isSoldOut = event.ticket_availability === 'sold_out'

  const badgeLabel = eventIsPast
    ? 'Evento concluso'
    : isSoldOut
    ? 'Sold Out'
    : event.ticket_availability === 'limited'
    ? 'Ultimi biglietti'
    : 'Prossimo'

  const formattedDate = new Date(event.start_datetime).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = new Date(event.start_datetime).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero Section */}
      <View style={[styles.hero, { height: heroHeight }]}>
        {coverImage ? (
          <>
            <Image
              source={{ uri: coverImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          </>
        ) : (
          <LinearGradient
            colors={[themeColors.primary, themeColors.background]}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFillObject}
        />

        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.backButton, { top: insets.top + 12 }]}
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>

        <View style={[styles.badge, { top: insets.top + 12 }]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {event.title}
            </Text>
            {event.place?.name && (
              <Text style={styles.heroSubtitle}>{event.place.name}</Text>
            )}
            <Text style={styles.heroSubtitle}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
          {thumbnailImage && <View style={{ width: THUMBNAIL_WIDTH + 8, flexShrink: 0, backgroundColor: 'transparent' }} />}
        </View>
      </View>

      {thumbnailImage && (
        <View
          style={[
            styles.thumbnailStraddle,
            { top: heroHeight - thumbnailHeight * 0.9, right: 16 },
          ]}
          pointerEvents="none"
        >
          <Image
            source={{ uri: thumbnailImage }}
            style={[
              styles.thumbnailPoster,
              { width: THUMBNAIL_WIDTH, aspectRatio: THUMBNAIL_ASPECT },
            ]}
            resizeMode="cover"
          />
        </View>
      )}

      <ScrollView
        className="flex-1"
        style={[styles.contentCard, { backgroundColor: themeColors.background }]}
        contentContainerStyle={[
          styles.contentCardInner,
          {
            paddingBottom: insets.bottom + 24,
            paddingTop: thumbnailImage ? thumbnailHeight * 0.1 : 8,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.foreground}
            colors={[themeColors.primary]}
          />
        }
      >
        <Text className="text-lg font-semibold text-foreground mb-3" style={{ paddingLeft: 8 }}>
          Data evento
        </Text>
        <Card className="mb-4 py-4">
          <CardContent className="gap-3">
            <View className="flex-row items-center gap-3">
              <Calendar size={20} color={themeColors.foreground} />
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
              <Clock size={20} color={themeColors.foreground} />
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

        {event.place && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Locale</Text>
            <Pressable
              onPress={() => router.push(`/place/${event.place!.id}` as any)}
              className="mb-4 overflow-hidden rounded-xl border border-border bg-card"
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
                    <MapPin size={16} color={themeColors.foreground} />
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
          </>
        )}

        {event.place && event.place.latitude && event.place.longitude && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Come arrivare</Text>
            <Card className="mb-4 py-4">
              <CardContent className="pt-0">
                <MapLinkButton
                  latitude={event.place.latitude}
                  longitude={event.place.longitude}
                  label={event.place.name}
                  address={event.place.address}
                />
              </CardContent>
            </Card>
          </>
        )}

        {event.description && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Descrizione</Text>
            <View className="mb-4">
              <ExpandableText text={event.description} numberOfLines={3} />
            </View>
          </>
        )}

        {event.lineup && event.lineup.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Lineup</Text>
            <Card className="mb-4 py-4">
              <CardContent className="gap-2 pt-0">
                {event.lineup.map((performer, index) => (
                  <View
                    key={index}
                    className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                  >
                    <Music size={18} color={themeColors.foreground} />
                    <Text className="flex-1">{performer}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {event.music_genre && event.music_genre.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Genere Musicale</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {event.music_genre.map((genre, index) => (
                <Badge key={index} variant="outline">
                  <Text className="text-xs">{genre}</Text>
                </Badge>
              ))}
            </View>
          </>
        )}

        <Text className="text-lg font-semibold text-foreground mb-3">Biglietti</Text>
        <Card className="mb-4 py-4">
          <CardContent className="gap-3 pt-0">
            <View className="flex-row items-center gap-2">
              <Ticket size={20} color={themeColors.foreground} />
              <Text className="font-semibold">Prezzo</Text>
            </View>
            {event.ticket_price_min !== undefined && event.ticket_price_max !== undefined && (
              <Text className="text-xl font-bold text-primary">
                {event.ticket_price_min}
                {event.ticket_price_max > event.ticket_price_min &&
                  ` - ${event.ticket_price_max}`}
              </Text>
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

        {!eventIsPast && (
          <Button
            className="w-full mb-4"
            variant="default"
            onPress={() =>
              router.push({
                pathname: '/(app)/events/[id]/reserve' as any,
                params: { id },
              })
            }
          >
            <Text>Prenota Lista</Text>
          </Button>
        )}

        <View className="flex-row gap-3 pb-4">
          <Button
            className="flex-1 flex-row gap-2"
            variant="default"
            onPress={handleToggleFavorite}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator size="small" color={themeColors.primaryForeground} />
            ) : (
              <>
                <Heart
                  size={18}
                  color={themeColors.primaryForeground}
                  fill={isEventFavorite ? themeColors.primaryForeground : 'none'}
                />
                <Text>Salva</Text>
              </>
            )}
          </Button>
          <Pressable
            onPress={handleShare}
            className="p-2 rounded-lg items-center justify-center"
            hitSlop={8}
            style={{ minWidth: 48 }}
          >
            <Share2 size={20} color={themeColors.foreground} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroContent: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.15,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  thumbnailStraddle: {
    position: 'absolute',
    zIndex: 10,
  },
  thumbnailPoster: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  contentCard: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  contentCardInner: {
    paddingHorizontal: 16,
  },
})
