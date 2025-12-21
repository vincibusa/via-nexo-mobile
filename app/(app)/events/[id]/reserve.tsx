import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../../../lib/contexts/settings';
import { THEME } from '../../../../lib/theme';
import { ChevronLeft } from 'lucide-react-native';
import { eventsService, type EventDetail } from '../../../../lib/services/events';
import { followersService } from '../../../../lib/services/followers';
import { reservationsService } from '../../../../lib/services/reservations';
import { type Follower } from '../../../../components/reservations/follower-selector-modal';
import { Card, CardContent } from '../../../../components/ui/card';

export default function ReservationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [showFollowerModal, setShowFollowerModal] = useState(false);
  const [tempSelectedFollowers, setTempSelectedFollowers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvent = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await eventsService.getEventById(id);
      if (!error && data) {
        setEvent(data);
      }
    } catch (error) {
      console.error('Load event error:', error);
    } finally {
      setIsLoadingEvent(false);
    }
  }, [id]);

  const loadFollowers = useCallback(async () => {
    setIsLoadingFollowers(true);
    try {
      console.log('Loading followers...');
      const { data, error } = await followersService.getMyFollowers(0, 100);
      console.log('Followers response:', { data, error });
      if (!error && data) {
        console.log('Setting followers:', data.length, 'followers');
        setFollowers(data);
      } else {
        console.log('Error loading followers:', error);
        setFollowers([]);
      }
    } catch (error) {
      console.error('Load followers error:', error);
      setFollowers([]);
    } finally {
      setIsLoadingFollowers(false);
    }
  }, []);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Reload followers when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Reserve screen focused, loading followers');
      loadFollowers();
    }, [loadFollowers])
  );

  const handleSelectFollowers = (followerIds: string[]) => {
    setSelectedFollowers(followerIds);
  };

  const handleReserve = async () => {
    if (!event) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await reservationsService.createReservation(
        event.id,
        selectedFollowers
      );

      if (error) {
        // Handle overlap errors with user-friendly messages
        if (error.includes('overlapping')) {
          Alert.alert(
            'Eventi sovrapposti',
            'Tu o uno dei tuoi ospiti avete già una prenotazione per un evento che si svolge nello stesso orario.',
            [{ text: 'OK' }]
          );
        } else if (error.includes('already have')) {
          Alert.alert(
            'Prenotazione esistente',
            'Hai già una prenotazione per questo evento.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Errore', error || 'Errore durante la prenotazione');
        }
        return;
      }

      if (data) {
        Alert.alert(
          'Prenotazione confermata!',
          `Prenotazione completata per ${data.total || 1} persona/e`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Reserve error:', error);
      Alert.alert('Errore', 'Errore imprevisto durante la prenotazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ChevronLeft size={24} color={themeColors.foreground} />
          </Pressable>
          <Text className="flex-1 text-xl font-bold text-foreground">
            Errore
          </Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-muted-foreground">
            Evento non trovato
          </Text>
        </View>
      </View>
    );
  }

  const maxGuests = 5; // Default max guests per reservation
  const totalPeople = selectedFollowers.length + 1; // +1 for owner

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          Prenota Lista
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        <FlatList
        data={[]} // No items, using as layout
        renderItem={() => null}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={
          <>
            {/* Event Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  {event.title}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  📅{' '}
                  {new Date(event.start_datetime).toLocaleDateString(
                    'it-IT',
                    {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    }
                  )}{' '}
                  -{' '}
                  {new Date(event.start_datetime).toLocaleTimeString(
                    'it-IT',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </Text>
              </CardContent>
            </Card>

            {/* Guest Count */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <Text className="text-sm text-muted-foreground mb-2">
                  Numero di persone nel gruppo
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-3xl font-bold text-primary">
                    {totalPeople}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Max {maxGuests}
                  </Text>
                </View>

                {totalPeople > maxGuests && (
                  <View className="mt-3 p-2 bg-destructive/10 rounded">
                    <Text className="text-xs text-destructive">
                      Hai superato il limite massimo di ospiti
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Followers Selection */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Aggiungi ospiti
              </Text>
              <Text className="text-xs text-muted-foreground mb-2">
                (Debug: {isLoadingFollowers ? 'Caricamento...' : `${followers.length} follower caricati`})
              </Text>

              {isLoadingFollowers ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color={themeColors.foreground} />
                </View>
              ) : followers.length === 0 ? (
                <Card>
                  <CardContent className="p-4 items-center">
                    <Text className="text-muted-foreground text-center">
                      Non hai follower. Aggiungi persone che ti seguono per
                      aggiungerle alla lista!
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                <Pressable
                  onPress={() => {
                    console.log('Opening follower selector modal');
                    setTempSelectedFollowers(new Set(selectedFollowers));
                    setShowFollowerModal(true);
                  }}
                  className="border-2 border-primary rounded-lg p-4 bg-primary/5 active:bg-primary/10"
                >
                  {selectedFollowers.length === 0 ? (
                    <>
                      <Text className="font-semibold text-foreground mb-1">
                        🎉 Aggiungi ospiti
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Tocca qui per selezionare tra i tuoi {followers.length} follower
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="font-semibold text-foreground mb-1">
                        ✓ {selectedFollowers.length} ospite
                        {selectedFollowers.length > 1 ? 'i' : ''} selezionato
                        {selectedFollowers.length > 1 ? 'i' : ''}
                      </Text>
                      <Text className="text-sm text-primary">
                        Tocca per modificare
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {/* Info Box */}
            <Card className="mb-6 border-primary/30 bg-primary/10">
              <CardContent className="p-4">
                <Text className="text-xs font-semibold text-primary mb-2">
                  Come funziona
                </Text>
                <Text className="text-xs text-foreground leading-5">
                  • Verrai aggiunto automaticamente alla lista{'\n'}
                  • Riceverai un QR code da mostrare al locale{'\n'}
                  • I tuoi ospiti verranno aggiunti al tuo gruppo
                </Text>
              </CardContent>
            </Card>
          </>
        }
        ListFooterComponent={
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 py-3 rounded-lg border border-input items-center"
            >
              <Text className="font-semibold text-foreground">Annulla</Text>
            </Pressable>
            <Pressable
              onPress={handleReserve}
              disabled={isSubmitting || totalPeople > maxGuests}
              className={`flex-1 py-3 rounded-lg items-center bg-primary ${
                isSubmitting || totalPeople > maxGuests ? 'opacity-50' : ''
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={themeColors.primaryForeground} />
              ) : (
                <Text className="font-semibold text-primary-foreground">
                  Prenota
                </Text>
              )}
            </Pressable>
          </View>
        }
        />
      </View>

      {/* Follower Selector Modal */}
      <Modal
        visible={showFollowerModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowFollowerModal(false);
          setSearchQuery('');
        }}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <View className="flex-1 px-4">
            {/* Header with Search */}
            <View className="pb-4 border-b border-border">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-foreground flex-1">
                  Aggiungi ospiti ({tempSelectedFollowers.size}/{maxGuests - 1})
                </Text>
                <Pressable
                  onPress={() => {
                    setShowFollowerModal(false);
                    setSearchQuery('');
                  }}
                  hitSlop={10}
                >
                  <Text className="text-lg text-primary">✕</Text>
                </Pressable>
              </View>

              {/* Search Input */}
              <TextInput
                placeholder="Cerca tra i follower..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="border border-border rounded-lg px-3 py-2 text-foreground"
                placeholderTextColor={themeColors.mutedForeground}
              />
            </View>

            {/* Followers List */}
            <FlatList
              data={followers.filter((f) =>
                f.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              className="flex-1"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    const newSelected = new Set(tempSelectedFollowers);
                    if (newSelected.has(item.id)) {
                      newSelected.delete(item.id);
                    } else if (newSelected.size < maxGuests - 1) {
                      newSelected.add(item.id);
                    }
                    setTempSelectedFollowers(newSelected);
                  }}
                  className="flex-row items-center py-3 border-b border-border"
                >
                  <View className="w-10 h-10 rounded-full bg-muted mr-3 justify-center items-center">
                    <Text className="text-foreground font-semibold text-sm">
                      {item.display_name[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {item.display_name}
                    </Text>
                    {item.bio && (
                      <Text className="text-xs text-muted-foreground">
                        {item.bio}
                      </Text>
                    )}
                  </View>
                  {tempSelectedFollowers.has(item.id) && (
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center ml-3">
                      <Text className="text-primary-foreground font-bold text-sm">✓</Text>
                    </View>
                  )}
                </Pressable>
              )}
            />

            {/* Action Buttons */}
            <View className="flex-row gap-3 pt-4 border-t border-border">
              <Pressable
                onPress={() => {
                  setShowFollowerModal(false);
                  setSearchQuery('');
                }}
                className="flex-1 py-3 rounded-lg border border-input items-center"
              >
                <Text className="font-semibold text-foreground">Annulla</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  handleSelectFollowers(Array.from(tempSelectedFollowers));
                  setShowFollowerModal(false);
                  setSearchQuery('');
                }}
                className="flex-1 py-3 rounded-lg bg-primary items-center"
              >
                <Text className="font-semibold text-primary-foreground">
                  Aggiungi ({tempSelectedFollowers.size})
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
