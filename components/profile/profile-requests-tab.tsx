/**
 * Profile Requests Tab
 * Shows pending join requests for user's open tables
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { reservationsService } from '../../lib/services/reservations';
import type { JoinRequestWithReservation } from '../../lib/types/reservations';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { formatDateTime } from '../../lib/utils/date';
import { GlassSurface } from '../glass';

export function ProfileRequestsTab() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  const effectiveTheme =
    settings?.theme === 'system'
      ? colorScheme === 'dark'
        ? 'dark'
        : 'light'
      : settings?.theme === 'dark'
        ? 'dark'
        : 'light';
  const themeColors = THEME[effectiveTheme];

  const [requests, setRequests] = useState<JoinRequestWithReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await reservationsService.getMyPendingRequests();
      if (!error && data) {
        setRequests(data);
      } else {
        if (error && error !== 'Not authenticated') {
          console.error('Error loading requests:', error);
        }
        setRequests([]);
      }
    } catch (error) {
      console.error('Load requests error:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (reservationId: string, requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { error } = await reservationsService.approveJoinRequest(
        reservationId,
        requestId
      );

      if (error) {
        Alert.alert('Errore', error);
      } else {
        Alert.alert('Successo', 'Richiesta approvata!');
        loadRequests();
      }
    } catch (error) {
      console.error('Approve request error:', error);
      Alert.alert('Errore', 'Errore imprevisto');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (reservationId: string, requestId: string) => {
    Alert.alert(
      'Conferma',
      'Sei sicuro di voler rifiutare questa richiesta?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rifiuta',
          style: 'destructive',
          onPress: async () => {
            setProcessingRequest(requestId);
            try {
              const { error } = await reservationsService.rejectJoinRequest(
                reservationId,
                requestId
              );

              if (error) {
                Alert.alert('Errore', error);
              } else {
                Alert.alert('Richiesta rifiutata');
                loadRequests();
              }
            } catch (error) {
              console.error('Reject request error:', error);
              Alert.alert('Errore', 'Errore imprevisto');
            } finally {
              setProcessingRequest(null);
            }
          },
        },
      ]
    );
  };

  const handleViewReservation = (reservationId: string) => {
    router.push(`/(app)/reservations/${reservationId}/requests` as any);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-4 py-12">
        <Users size={48} color={themeColors.mutedForeground} />
        <Text
          className="text-muted-foreground text-center mt-4"
          style={{ color: themeColors.mutedForeground }}
        >
          Nessuna richiesta in attesa
        </Text>
        <Text
          className="text-sm text-muted-foreground text-center mt-2"
          style={{ color: themeColors.mutedForeground }}
        >
          Le richieste di partecipazione ai tuoi tavoli appariranno qui
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      scrollEnabled={false}
      nestedScrollEnabled={false}
      renderItem={({ item }) => {
        const reservation = item.reservation;
        const event = reservation?.event;

        return (
          <GlassSurface
            variant="card"
            intensity={effectiveTheme === 'dark' ? 'regular' : 'light'}
            tint={effectiveTheme === 'dark' ? 'dark' : 'light'}
            style={{
              marginBottom: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.2)',
              padding: 16,
            }}
          >
              {/* Event Info Header */}
              {event && (
                <Pressable
                  onPress={() =>
                    reservation && handleViewReservation(reservation.id)
                  }
                  className="mb-3 pb-3 border-b border-border"
                >
                  <View className="flex-row items-start gap-3">
                    {event.cover_image_url ? (
                      <Image
                        source={{ uri: event.cover_image_url }}
                        className="w-16 h-16 rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        className="w-16 h-16 rounded-lg items-center justify-center bg-muted"
                        style={{ backgroundColor: themeColors.muted }}
                      >
                        <Calendar
                          size={24}
                          color={themeColors.mutedForeground}
                        />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text
                        className="font-semibold text-foreground mb-1"
                        numberOfLines={2}
                      >
                        {event.title}
                      </Text>
                      {event.start_datetime && (
                        <View className="flex-row items-center mb-1">
                          <Calendar
                            size={12}
                            color={themeColors.mutedForeground}
                          />
                          <Text
                            className="text-xs text-muted-foreground ml-1"
                            style={{ color: themeColors.mutedForeground }}
                          >
                            {formatDateTime(event.start_datetime)}
                          </Text>
                        </View>
                      )}
                      {event.place && (
                        <View className="flex-row items-center">
                          <MapPin
                            size={12}
                            color={themeColors.mutedForeground}
                          />
                          <Text
                            className="text-xs text-muted-foreground ml-1"
                            numberOfLines={1}
                            style={{ color: themeColors.mutedForeground }}
                          >
                            {event.place.name}
                            {event.place.city && `, ${event.place.city}`}
                          </Text>
                        </View>
                      )}
                      {reservation?.reservation_type && (
                        <View className="mt-1">
                          <View
                            className={`px-2 py-1 rounded-full self-start ${
                              reservation.reservation_type === 'prive'
                                ? 'bg-purple-500/20'
                                : 'bg-green-500/20'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                reservation.reservation_type === 'prive'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {reservation.reservation_type === 'prive'
                                ? 'PRIVÉ'
                                : 'PISTA'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}

              {/* Requester Info */}
              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-full bg-muted mr-3 justify-center items-center"
                  style={{ backgroundColor: themeColors.muted }}
                >
                  {item.requester.avatar_url ? (
                    <Image
                      source={{ uri: item.requester.avatar_url }}
                      className="w-full h-full rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      className="text-foreground font-semibold"
                      style={{ color: themeColors.foreground }}
                    >
                      {item.requester.display_name[0]?.toUpperCase()}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className="font-semibold text-foreground"
                    style={{ color: themeColors.foreground }}
                  >
                    {item.requester.display_name}
                  </Text>
                  {item.requester.bio && (
                    <Text
                      className="text-xs text-muted-foreground"
                      numberOfLines={1}
                      style={{ color: themeColors.mutedForeground }}
                    >
                      {item.requester.bio}
                    </Text>
                  )}
                </View>
              </View>

              {/* Message */}
              {item.message && (
                <View
                  className="mb-3 p-3 bg-muted rounded-lg"
                  style={{ backgroundColor: themeColors.muted }}
                >
                  <Text
                    className="text-sm text-foreground"
                    style={{ color: themeColors.foreground }}
                  >
                    {item.message}
                  </Text>
                </View>
              )}

              {/* Available Spots Info */}
              {reservation?.open_table_available_spots !== undefined &&
                reservation.open_table_available_spots > 0 && (
                  <View className="mb-3 flex-row items-center">
                    <Users size={14} color={themeColors.mutedForeground} />
                    <Text
                      className="text-xs text-muted-foreground ml-1"
                      style={{ color: themeColors.mutedForeground }}
                    >
                      {reservation.open_table_available_spots} posti disponibili
                    </Text>
                  </View>
                )}

              {/* Timestamp */}
              <Text
                className="text-xs text-muted-foreground mb-3"
                style={{ color: themeColors.mutedForeground }}
              >
                {new Date(item.created_at).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              {/* Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() =>
                    reservation &&
                    handleReject(reservation.id, item.id)
                  }
                  disabled={processingRequest === item.id}
                  className={`flex-1 py-3 rounded-lg border border-destructive items-center ${
                    processingRequest === item.id ? 'opacity-50' : ''
                  }`}
                  style={{
                    borderColor: themeColors.destructive,
                  }}
                >
                  <Text
                    className="font-semibold text-destructive"
                    style={{ color: themeColors.destructive }}
                  >
                    Rifiuta
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    reservation &&
                    handleApprove(reservation.id, item.id)
                  }
                  disabled={processingRequest === item.id}
                  className={`flex-1 py-3 rounded-lg bg-primary items-center ${
                    processingRequest === item.id ? 'opacity-50' : ''
                  }`}
                  style={{ backgroundColor: themeColors.primary }}
                >
                  {processingRequest === item.id ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColors.primaryForeground}
                    />
                  ) : (
                    <Text
                      className="font-semibold text-primary-foreground"
                      style={{ color: themeColors.primaryForeground }}
                    >
                      Approva
                    </Text>
                  )}
                </Pressable>
              </View>
          </GlassSurface>
        );
      }}
    />
  );
}
