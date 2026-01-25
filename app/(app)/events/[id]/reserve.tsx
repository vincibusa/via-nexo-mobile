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
  Switch,
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
import type { OpenTable } from '../../../../lib/types/reservations';

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
  const [wantsGroupChat, setWantsGroupChat] = useState(false);
  const [reservationType, setReservationType] = useState<'pista' | 'prive'>('pista');
  const [priveMode, setPriveMode] = useState<'create' | 'join' | null>(null);
  const [isOpenTable, setIsOpenTable] = useState(false);
  const [openTableDescription, setOpenTableDescription] = useState('');
  const [openTableMinBudget, setOpenTableMinBudget] = useState('');
  const [openTableAvailableSpots, setOpenTableAvailableSpots] = useState('');
  const [openTables, setOpenTables] = useState<OpenTable[]>([]);
  const [isLoadingOpenTables, setIsLoadingOpenTables] = useState(false);
  const [selectedTableForJoin, setSelectedTableForJoin] = useState<string | null>(null);
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [isSendingJoinRequest, setIsSendingJoinRequest] = useState(false);

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

  const loadOpenTables = useCallback(async () => {
    if (!id) return;
    setIsLoadingOpenTables(true);
    try {
      const { data, error } = await reservationsService.getOpenTables(id);
      if (!error && data) {
        setOpenTables(data);
      }
    } catch (error) {
      console.error('Load open tables error:', error);
    } finally {
      setIsLoadingOpenTables(false);
    }
  }, [id]);

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

  const handleJoinTable = async (tableId: string) => {
    setIsSendingJoinRequest(true);
    try {
      const { error } = await reservationsService.sendJoinRequest(
        tableId,
        joinRequestMessage || undefined
      );

      if (error) {
        Alert.alert('Errore', error);
      } else {
        Alert.alert(
          'Richiesta inviata!',
          'La tua richiesta è stata inviata al proprietario del tavolo.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedTableForJoin(null);
                setJoinRequestMessage('');
                router.back();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Join table error:', error);
      Alert.alert('Errore', 'Errore imprevisto');
    } finally {
      setIsSendingJoinRequest(false);
    }
  };

  const handleReserve = async () => {
    if (!event) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await reservationsService.createReservation(
        event.id,
        selectedFollowers,
        undefined, // notes
        wantsGroupChat,
        reservationType,
        isOpenTable,
        openTableDescription || undefined,
        openTableMinBudget ? parseFloat(openTableMinBudget) : undefined,
        openTableAvailableSpots ? parseInt(openTableAvailableSpots, 10) : undefined
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

  // Determine max guests based on reservation type
  const maxGuests = reservationType === 'prive' 
    ? (event.prive_max_seats || 10)
    : (event.max_guests_per_reservation || 5);
  const totalPeople = selectedFollowers.length + 1; // +1 for owner
  
  // Check if prive is enabled for this event
  const priveEnabled = event.prive_enabled || false;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          {reservationType === 'prive' ? 'Prenota Privé' : 'Prenota Lista'}
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

            {/* Reservation Type Selection */}
            {priveEnabled && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <Text className="text-sm text-muted-foreground mb-3">
                    Tipo di prenotazione
                  </Text>
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        setReservationType('pista');
                        setIsOpenTable(false);
                      }}
                      className={`flex-1 py-3 rounded-lg border-2 items-center ${
                        reservationType === 'pista'
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <Text className={`font-semibold ${
                        reservationType === 'pista' ? 'text-primary' : 'text-foreground'
                      }`}>
                        Pista
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        Lista nominativa
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setReservationType('prive');
                        setPriveMode(null);
                        setIsOpenTable(false);
                      }}
                      className={`flex-1 py-3 rounded-lg border-2 items-center ${
                        reservationType === 'prive'
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <Text className={`font-semibold ${
                        reservationType === 'prive' ? 'text-primary' : 'text-foreground'
                      }`}>
                        Privé
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        Tavolo VIP
                      </Text>
                    </Pressable>
                  </View>
                </CardContent>
              </Card>
            )}

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

            {/* Prive Mode Selection */}
            {reservationType === 'prive' && !priveMode && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <Text className="text-sm text-muted-foreground mb-3">
                    Cosa vuoi fare?
                  </Text>
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        setPriveMode('create');
                        loadOpenTables();
                      }}
                      className="flex-1 py-4 rounded-lg border-2 border-primary bg-primary/10 items-center"
                    >
                      <Text className="font-semibold text-primary mb-1">
                        Crea il tuo tavolo
                      </Text>
                      <Text className="text-xs text-muted-foreground text-center">
                        Crea un nuovo tavolo privé
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setPriveMode('join');
                        loadOpenTables();
                      }}
                      className="flex-1 py-4 rounded-lg border-2 border-primary bg-primary/10 items-center"
                    >
                      <Text className="font-semibold text-primary mb-1">
                        Unisciti a un tavolo
                      </Text>
                      <Text className="text-xs text-muted-foreground text-center">
                        Richiedi di unirti a un tavolo esistente
                      </Text>
                    </Pressable>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Join Tables List */}
            {reservationType === 'prive' && priveMode === 'join' && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-foreground mb-3">
                  Tavoli Aperti Disponibili
                </Text>
                {isLoadingOpenTables ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="large" color={themeColors.foreground} />
                  </View>
                ) : openTables.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 items-center">
                      <Text className="text-muted-foreground text-center">
                        Nessun tavolo aperto disponibile per questo evento
                      </Text>
                      <Pressable
                        onPress={() => setPriveMode('create')}
                        className="mt-4 px-4 py-2 bg-primary rounded-lg"
                      >
                        <Text className="text-primary-foreground font-semibold">
                          Crea il tuo tavolo
                        </Text>
                      </Pressable>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {openTables.map((table) => (
                      <Card key={table.id} className="mb-3">
                        <CardContent className="p-4">
                          <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-full bg-muted mr-3 justify-center items-center">
                              {table.owner.avatar_url ? (
                                <Text className="text-foreground">IMG</Text>
                              ) : (
                                <Text className="text-foreground font-semibold text-sm">
                                  {table.owner.display_name[0]?.toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className="font-semibold text-foreground">
                                {table.owner.display_name}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {table.available_spots} posti disponibili
                              </Text>
                            </View>
                          </View>
                          {table.description && (
                            <Text className="text-sm text-foreground mb-2">
                              {table.description}
                            </Text>
                          )}
                          {table.min_budget && (
                            <Text className="text-xs text-muted-foreground mb-2">
                              Budget minimo: €{table.min_budget}
                            </Text>
                          )}
                          <Pressable
                            onPress={() => setSelectedTableForJoin(table.id)}
                            className="bg-primary py-2 rounded-lg items-center mt-2"
                          >
                            <Text className="font-semibold text-primary-foreground">
                              Richiedi di unirti
                            </Text>
                          </Pressable>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Create Table Options (only for Prive) */}
            {reservationType === 'prive' && priveMode === 'create' && (
              <>
                <Card className="mb-6">
                  <CardContent className="p-4 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                      <Text className="font-semibold text-foreground mb-1">
                        Tavolo Aperto
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Permetti ad altri di unirsi al tuo tavolo
                      </Text>
                    </View>
                    <Switch
                      value={isOpenTable}
                      onValueChange={setIsOpenTable}
                      trackColor={{ false: themeColors.mutedForeground + '40', true: themeColors.primary + '80' }}
                      thumbColor={isOpenTable ? themeColors.primary : themeColors.mutedForeground}
                    />
                  </CardContent>
                </Card>

                {isOpenTable && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <Text className="font-semibold text-foreground mb-4">
                        Configura Tavolo Aperto
                      </Text>

                      {/* Description */}
                      <View className="mb-4">
                        <Text className="text-sm text-muted-foreground mb-2">
                          Descrizione / Tema
                        </Text>
                        <TextInput
                          placeholder="Descrivi il tuo tavolo (opzionale)"
                          value={openTableDescription}
                          onChangeText={setOpenTableDescription}
                          multiline
                          numberOfLines={3}
                          className="border border-border rounded-lg px-3 py-2 text-foreground min-h-[80px]"
                          placeholderTextColor={themeColors.mutedForeground}
                          textAlignVertical="top"
                        />
                      </View>

                      {/* Min Budget */}
                      <View className="mb-4">
                        <Text className="text-sm text-muted-foreground mb-2">
                          Budget minimo (€)
                        </Text>
                        <TextInput
                          placeholder={event.prive_min_price ? `Minimo €${event.prive_min_price}` : 'Opzionale'}
                          value={openTableMinBudget}
                          onChangeText={setOpenTableMinBudget}
                          keyboardType="numeric"
                          className="border border-border rounded-lg px-3 py-2 text-foreground"
                          placeholderTextColor={themeColors.mutedForeground}
                        />
                        {event.prive_min_price && (
                          <Text className="text-xs text-muted-foreground mt-1">
                            Prezzo minimo richiesto: €{event.prive_min_price}
                          </Text>
                        )}
                      </View>

                      {/* Available Spots */}
                      <View>
                        <Text className="text-sm text-muted-foreground mb-2">
                          Posti disponibili
                        </Text>
                        <TextInput
                          placeholder="Quanti posti vuoi rendere disponibili?"
                          value={openTableAvailableSpots}
                          onChangeText={setOpenTableAvailableSpots}
                          keyboardType="numeric"
                          className="border border-border rounded-lg px-3 py-2 text-foreground"
                          placeholderTextColor={themeColors.mutedForeground}
                        />
                        <Text className="text-xs text-muted-foreground mt-1">
                          Massimo disponibile: {Math.max(0, maxGuests - totalPeople)}
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Group Chat Switch */}
            <Card className="mb-6">
              <CardContent className="p-4 flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="font-semibold text-foreground mb-1">
                    Chat di gruppo
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Partecipa alla chat con gli altri iscritti all'evento
                  </Text>
                </View>
                <Switch
                  value={wantsGroupChat}
                  onValueChange={setWantsGroupChat}
                  trackColor={{ false: themeColors.mutedForeground + '40', true: themeColors.primary + '80' }}
                  thumbColor={wantsGroupChat ? themeColors.primary : themeColors.mutedForeground}
                />
              </CardContent>
            </Card>

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
          reservationType === 'prive' && priveMode === 'join' ? (
            <Pressable
              onPress={() => setPriveMode(null)}
              className="py-3 rounded-lg border border-input items-center"
            >
              <Text className="font-semibold text-foreground">Indietro</Text>
            </Pressable>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  if (reservationType === 'prive' && priveMode === 'create') {
                    setPriveMode(null);
                  } else {
                    router.back();
                  }
                }}
                className="flex-1 py-3 rounded-lg border border-input items-center"
              >
                <Text className="font-semibold text-foreground">Annulla</Text>
              </Pressable>
              <Pressable
                onPress={handleReserve}
                disabled={isSubmitting || totalPeople > maxGuests || (reservationType === 'prive' && priveMode !== 'create')}
                className={`flex-1 py-3 rounded-lg items-center bg-primary ${
                  isSubmitting || totalPeople > maxGuests || (reservationType === 'prive' && priveMode !== 'create') ? 'opacity-50' : ''
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
          )
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

      {/* Join Request Modal */}
      {selectedTableForJoin && (
        <Modal
          visible={!!selectedTableForJoin}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setSelectedTableForJoin(null);
            setJoinRequestMessage('');
          }}
        >
          <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
            <View className="flex-1 px-4 justify-center">
              <Card>
                <CardContent className="p-4">
                  <Text className="text-lg font-semibold text-foreground mb-2">
                    Richiedi di unirti al tavolo
                  </Text>
                  <Text className="text-sm text-muted-foreground mb-4">
                    Invia un messaggio al proprietario del tavolo.
                  </Text>

                  <TextInput
                    placeholder="Messaggio (opzionale)"
                    value={joinRequestMessage}
                    onChangeText={setJoinRequestMessage}
                    multiline
                    numberOfLines={4}
                    className="border border-border rounded-lg px-3 py-2 text-foreground min-h-[100px] mb-4"
                    placeholderTextColor={themeColors.mutedForeground}
                    textAlignVertical="top"
                  />

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => {
                        setSelectedTableForJoin(null);
                        setJoinRequestMessage('');
                      }}
                      className="flex-1 py-3 rounded-lg border border-border items-center"
                    >
                      <Text className="font-semibold text-foreground">Annulla</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => selectedTableForJoin && handleJoinTable(selectedTableForJoin)}
                      disabled={isSendingJoinRequest}
                      className={`flex-1 py-3 rounded-lg bg-primary items-center ${
                        isSendingJoinRequest ? 'opacity-50' : ''
                      }`}
                    >
                      {isSendingJoinRequest ? (
                        <ActivityIndicator size="small" color={themeColors.primaryForeground} />
                      ) : (
                        <Text className="font-semibold text-primary-foreground">
                          Invia
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </CardContent>
              </Card>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
