import { Text } from '../../../components/ui/text'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { ExpandableText } from '../../../components/common/expandable-text'
import { MapLinkButton } from '../../../components/common/map-link-button'
import { placesService, type PlaceDetail } from '../../../lib/services/places'
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
import {
  Heart,
  Phone,
  Globe,
  Instagram,
  Facebook,
  MapPin,
  ChevronLeft,
  Share2,
} from 'lucide-react-native'
import * as Location from 'expo-location'
import { API_CONFIG } from '../../../lib/config'
import { THEME } from '../../../lib/theme'
import { useSettings } from '../../../lib/contexts/settings'
import { useColorScheme } from 'nativewind'

export default function PlaceDetailScreen() {
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
  const aiReason = params.ai_reason as string | undefined

  const [place, setPlace] = useState<PlaceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const isPlaceFavorite = isFavorite('place', id)
  const favoriteId = getFavoriteId('place', id)

  const heroHeight = screenHeight * 0.35
  const THUMBNAIL_WIDTH = 116
  const THUMBNAIL_ASPECT = 0.65
  const thumbnailHeight = THUMBNAIL_WIDTH / THUMBNAIL_ASPECT

  useEffect(() => {
    loadPlace()
  }, [id])

  const loadPlace = async () => {
    setLoading(true)
    setError(null)

    let userLocation: { lat: number; lon: number } | undefined
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({})
          userLocation = {
            lat: currentLocation.coords.latitude,
            lon: currentLocation.coords.longitude,
          }
        } catch (err) {
          userLocation = API_CONFIG.DEFAULT_LOCATION
        }
      } else {
        userLocation = API_CONFIG.DEFAULT_LOCATION
      }
      setLocation(userLocation)
    } catch (err) {
      console.log('Could not get location for distance calculation')
    }

    const { data, error: err } = await placesService.getPlaceById(id, userLocation)

    if (err) {
      setError(err)
    } else if (data) {
      setPlace(data)
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
      if (isPlaceFavorite && favoriteId) {
        await removeFavorite(favoriteId, 'place')
      } else {
        await addFavorite({ resource_type: 'place', resource_id: id })
      }
    } catch (err) {
      Alert.alert('Errore', 'Impossibile aggiornare i preferiti')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleShare = async () => {
    if (!place) return
    try {
      await Share.share({
        message: `Guarda questo locale: ${place.name}`,
        title: place.name,
        url: place.website
      })
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      }
    } catch (err) {
      console.error('Error opening link:', err)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadPlace()
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

  if (error || !place) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-center text-lg text-muted-foreground">
            {error || 'Locale non trovato'}
          </Text>
          <Button onPress={() => router.back()} className="mt-4">
            <Text>Torna indietro</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const images =
    place.gallery_images && place.gallery_images.length > 0
      ? place.gallery_images
      : place.cover_image
      ? [place.cover_image]
      : []
  const coverImage = images[0]
  const thumbnailImage = coverImage

  const addressFormatted = [
    place.address,
    place.city && `, ${place.city}`,
    place.postal_code && ` ${place.postal_code}`,
  ]
    .filter(Boolean)
    .join('')

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



        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {place.name}
            </Text>
            <Text style={styles.heroSubtitle}>{addressFormatted}</Text>
            {aiReason && (
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {aiReason}
              </Text>
            )}
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
          Informazioni
        </Text>
        <Card className="mb-4 py-4">
          <CardContent className="gap-4 pt-0">
            <View className="flex-row items-start gap-3">
              <MapPin size={20} color={themeColors.mutedForeground} />
              <View className="flex-1">
                <Text className="font-medium">Indirizzo</Text>
                <Text className="text-sm text-muted-foreground">{addressFormatted}</Text>
              </View>
            </View>

            {place.ambience_tags && place.ambience_tags.length > 0 && (
              <View className="flex-row items-start gap-3">
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

            {place.music_genre && place.music_genre.length > 0 && (
              <View className="flex-row items-start gap-3">
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

            {place.capacity && (
              <View className="flex-row items-start gap-3">
                <View className="flex-1">
                  <Text className="font-medium">Capienza</Text>
                  <Text className="text-sm text-muted-foreground">
                    {place.capacity} persone
                  </Text>
                </View>
              </View>
            )}

            {place.distance_km != null && typeof place.distance_km === 'number' && (
              <View className="flex-row items-start gap-3">
                <View className="flex-1">
                  <Text className="font-medium">Distanza</Text>
                  <Text className="text-sm text-muted-foreground">
                    {place.distance_km.toFixed(1)} km da te
                  </Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {place.description && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Descrizione</Text>
            <View className="mb-4">
              <ExpandableText text={place.description} numberOfLines={3} />
            </View>
          </>
        )}

        {(place.phone || place.website || place.instagram || place.facebook) && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Contatti</Text>
            <Card className="mb-4 py-4">
              <CardContent className="gap-3 pt-0">
                {place.phone && (
                  <Pressable
                    onPress={() => openLink(`tel:${place.phone}`)}
                    className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                  >
                    <Phone size={20} color={themeColors.foreground} />
                    <Text className="flex-1">{place.phone}</Text>
                  </Pressable>
                )}
                {place.website && (
                  <Pressable
                    onPress={() => openLink(place.website!)}
                    className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                  >
                    <Globe size={20} color={themeColors.foreground} />
                    <Text className="flex-1 text-primary">Visita sito web</Text>
                  </Pressable>
                )}
                {place.instagram && (
                  <Pressable
                    onPress={() =>
                      openLink(`https://instagram.com/${place.instagram!.replace('@', '')}`)
                    }
                    className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                  >
                    <Instagram size={20} color={themeColors.foreground} />
                    <Text className="flex-1">{place.instagram}</Text>
                  </Pressable>
                )}
                {place.facebook && (
                  <Pressable
                    onPress={() => openLink(place.facebook!)}
                    className="flex-row items-center gap-3 rounded-lg bg-muted/30 p-3"
                  >
                    <Facebook size={20} color={themeColors.foreground} />
                    <Text className="flex-1 text-primary">Facebook</Text>
                  </Pressable>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Text className="text-lg font-semibold text-foreground mb-3">Come arrivare</Text>
        <Card className="mb-4 py-4">
          <CardContent className="pt-0">
            <MapLinkButton
              latitude={place.latitude}
              longitude={place.longitude}
              label={place.name}
              address={place.address}
            />
          </CardContent>
        </Card>

        {place.events && place.events.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Eventi in programma
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-4 mb-4"
            >
              <View className="flex-row gap-3 px-4">
                {place.events.map((evt) => (
                  <Pressable
                    key={evt.id}
                    onPress={() => router.push(`/event/${evt.id}` as any)}
                    className="w-64 overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {evt.cover_image ? (
                      <Image
                        source={{ uri: evt.cover_image }}
                        className="h-32 w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-32 w-full bg-muted items-center justify-center" />
                    )}
                    <View className="p-3">
                      <Text className="font-semibold" numberOfLines={2}>
                        {evt.title}
                      </Text>
                      <Text className="mt-1 text-xs text-muted-foreground">
                        {new Date(evt.start_datetime).toLocaleDateString('it-IT', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        {evt.start_datetime &&
                          ` • ${new Date(evt.start_datetime).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </Text>
                      {evt.ticket_price_min !== undefined && (
                        <Text className="mt-2 text-xs font-medium text-primary">
                          Da {evt.ticket_price_min}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
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
                  fill={isPlaceFavorite ? themeColors.primaryForeground : 'none'}
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
  badgesRow: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
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
