import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../../lib/contexts/settings';
import { THEME } from '../../../lib/theme';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Trash, Share2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { Reservation, reservationsService } from '../../../lib/services/reservations';
import { formatDateTime } from '../../../lib/utils/date';
import { MapLinkButton } from '../../../components/common/map-link-button';
import { placesService } from '../../../lib/services/places';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default function ReservationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  const { colorScheme } = useColorScheme();

  // Get effective theme based on user settings
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : settings?.theme === 'dark'
    ? 'dark'
    : 'light';
  const themeColors = THEME[effectiveTheme];
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [placeCoordinates, setPlaceCoordinates] = useState<{ latitude: number; longitude: number; name: string; address: string } | null>(null);

  const loadReservation = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await reservationsService.getReservation(id);
      if (!error && data) {
        setReservation(data);
        
        // Load place coordinates if place ID is available
        if (data.event?.place?.id) {
          try {
            const { data: placeData, error: placeError } = await placesService.getPlaceById(data.event.place.id);
            if (!placeError && placeData && placeData.latitude && placeData.longitude) {
              setPlaceCoordinates({
                latitude: placeData.latitude,
                longitude: placeData.longitude,
                name: placeData.name,
                address: placeData.address,
              });
            }
          } catch (placeErr) {
            console.error('Error loading place coordinates:', placeErr);
          }
        }
      }
    } catch (error) {
      console.error('Load reservation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadReservation();
    }, [loadReservation])
  );

  const handleShare = useCallback(async () => {
    if (!reservation) return
    try {
      await Share.share({
        message: `Unisciti a me all'evento "${reservation.event?.title}"!\n\nData: ${
          reservation.event?.start_datetime
            ? formatDateTime(reservation.event.start_datetime)
            : 'Data non specificata'
        }\nLuogo: ${reservation.event?.place?.name || 'Location'}`,
        title: `Invito - ${reservation.event?.title}`,
      })
    } catch (err) {
      console.error('Share error:', err)
    }
  }, [reservation])

  const handleCancelReservation = () => {
    if (!reservation) return;

    Alert.alert(
      'Cancella prenotazione',
      `Sei sicuro di voler cancellare la prenotazione per "${reservation.event?.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sì, cancella',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await reservationsService.cancelReservation(
                reservation.id
              );
              if (error) {
                Alert.alert(
                  'Errore',
                  error || 'Impossibile cancellare la prenotazione'
                );
              } else {
                // Success - show confirmation and navigate back
                Alert.alert(
                  'Prenotazione cancellata',
                  'La prenotazione è stata cancellata con successo',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              }
            } catch (error) {
              console.error('Cancel reservation error:', error);
              Alert.alert(
                'Errore',
                'Si è verificato un errore durante la cancellazione della prenotazione'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background" edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </SafeAreaView>
    );
  }

  if (!reservation) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <View style={{ width: 24 }}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <ChevronLeft size={24} color={themeColors.foreground} />
            </Pressable>
          </View>
          <Text className="flex-1 text-xl font-bold text-foreground text-center">
            Prenotazione non trovata
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">
            Questa prenotazione non esiste più
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const eventStatus =
    reservation.event?.start_datetime &&
    new Date(reservation.event.start_datetime) > new Date()
      ? 'upcoming'
      : 'past';

  const heroHeight = screenHeight * 0.35;
  const THUMBNAIL_WIDTH = 116;
  const THUMBNAIL_ASPECT = 0.65;
  const thumbnailHeight = THUMBNAIL_WIDTH / THUMBNAIL_ASPECT;
  const coverImage = reservation.event?.cover_image_url;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={[]}>
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
        {/* Back button floating */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[
            styles.backButton,
            { top: insets.top + 12 },
          ]}
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        {/* Badge stato evento top-right */}
        <View style={[styles.badge, { top: insets.top + 12 }]}>
          <Text style={styles.badgeText}>
            {eventStatus === 'upcoming' ? 'Prossimo' : 'Passato'}
          </Text>
        </View>
        {/* Overlay: titolo, venue, data */}
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {reservation.event?.title || 'Evento'}
            </Text>
            {reservation.event?.place?.name && (
              <Text style={styles.heroSubtitle}>
                {reservation.event.place.name}
              </Text>
            )}
            {reservation.event?.start_datetime && (
              <Text style={styles.heroSubtitle}>
                {formatDateTime(reservation.event.start_datetime)}
              </Text>
            )}
          </View>
          {coverImage && <View style={{ width: THUMBNAIL_WIDTH + 8, flexShrink: 0, backgroundColor: 'transparent' }} />}
        </View>
      </View>

      {/* Thumbnail a cavallo tra hero e content card */}
      {coverImage && (
        <View
          style={[
            styles.thumbnailStraddle,
            {
              top: heroHeight - thumbnailHeight * 0.9,
              right: 16,
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={{ uri: coverImage }}
            style={[styles.thumbnailPoster, { width: THUMBNAIL_WIDTH, aspectRatio: THUMBNAIL_ASPECT }]}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content card con borderTopRadius, sovrapposta all'hero */}
      <ScrollView
        className="flex-1"
        style={[styles.contentCard, { backgroundColor: themeColors.background }]}
        contentContainerStyle={[
          styles.contentCardInner,
          {
            paddingBottom: insets.bottom + 24,
            paddingTop: coverImage ? thumbnailHeight * 0.1 : 4,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Titolo attaccato al bordo superiore */}
        <View
          style={{
            paddingBottom: 10,
            paddingLeft: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text className="text-lg font-semibold text-foreground flex-1 mr-3">
            Dettagli prenotazione
          </Text>
          {coverImage && <View style={{ width: THUMBNAIL_WIDTH }} />}
        </View>
        <Card className="mb-4 py-4">
          <CardContent className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Stato</Text>
              <Text className="font-semibold text-foreground capitalize">
                {reservation.status === 'confirmed'
                  ? 'Confermata'
                  : reservation.status === 'checked_in'
                  ? 'Registrato'
                  : reservation.status}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Persone nel gruppo</Text>
              <Text className="font-semibold text-foreground">
                {reservation.total_guests}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Data prenotazione</Text>
              <Text className="font-semibold text-foreground">
                {reservation.created_at
                  ? new Date(reservation.created_at).toLocaleDateString('it-IT')
                  : '-'}
              </Text>
            </View>
            {reservation.reservation_type && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Tipo</Text>
                <Text className="font-semibold text-foreground capitalize">
                  {reservation.reservation_type === 'prive'
                    ? 'Privé'
                    : reservation.reservation_type === 'pista'
                    ? 'Pista'
                    : 'Standard'}
                </Text>
              </View>
            )}
            {reservation.is_open_table &&
              reservation.open_table_available_spots !== undefined && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Posti disponibili</Text>
                  <Text className="font-semibold text-foreground">
                    {reservation.open_table_available_spots}
                  </Text>
                </View>
              )}
          </CardContent>
        </Card>

        {/* Card: QR Code */}
        <Card className="mb-4 py-3">
          <CardHeader className="pb-0 flex-row items-center justify-between">
            <CardTitle className="text-foreground">Il tuo QR code</CardTitle>
            <Pressable
              onPress={handleShare}
              className="p-2 rounded-lg"
              hitSlop={8}
            >
              <Share2 size={20} color={themeColors.foreground} />
            </Pressable>
          </CardHeader>
          <CardContent className="items-center pt-0">
            {reservation.qr_code_token ? (
              <View className="p-2 rounded-xl bg-background">
                <QRCode
                  value={JSON.stringify({
                    type: 'nexo_reservation',
                    token: reservation.qr_code_token,
                    reservation_type: reservation.reservation_type || 'pista',
                    v: 2,
                  })}
                  size={260}
                  color={themeColors.foreground}
                  backgroundColor={themeColors.background}
                />
              </View>
            ) : (
              <Text className="text-muted-foreground text-center py-4">
                QR code non disponibile
              </Text>
            )}
            <Text className="text-xs text-muted-foreground text-center mt-2 px-2">
              Mostra questo QR code al personale per il check-in. Mantieni lo schermo luminoso.
            </Text>
          </CardContent>
        </Card>

        {/* Card: Mappa */}
        {placeCoordinates && (
          <Card className="mb-4 py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Come arrivare</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <MapLinkButton
                latitude={placeCoordinates.latitude}
                longitude={placeCoordinates.longitude}
                label={placeCoordinates.name}
                address={placeCoordinates.address}
              />
            </CardContent>
          </Card>
        )}

        {/* Cancella prenotazione */}
        {eventStatus === 'upcoming' && (
          <Pressable
            onPress={handleCancelReservation}
            disabled={isDeleting}
            className="w-full py-3 rounded-xl border border-destructive/30 bg-destructive/10 items-center flex-row justify-center gap-2"
          >
            <Trash size={18} color={themeColors.destructive} />
            <Text className="font-semibold text-destructive">
              Cancella prenotazione
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  thumbnailStraddle: {
    position: 'absolute',
    zIndex: 10,
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
    paddingTop: 20,
  },
});
