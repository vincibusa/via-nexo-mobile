import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../../../lib/contexts/settings';
import { THEME } from '../../../../lib/theme';
import { ChevronLeft } from 'lucide-react-native';
import { reservationsService } from '../../../../lib/services/reservations';
import type { OpenTable } from '../../../../lib/types/reservations';
import { Card, CardContent } from '../../../../components/ui/card';

export default function OpenTablesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [openTables, setOpenTables] = useState<OpenTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<OpenTable | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOpenTables = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data, error } = await reservationsService.getOpenTables(id);
      if (!error && data) {
        setOpenTables(data);
      } else {
        Alert.alert('Errore', error || 'Errore nel caricamento dei tavoli');
      }
    } catch (error) {
      console.error('Load open tables error:', error);
      Alert.alert('Errore', 'Errore imprevisto');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOpenTables();
  }, [loadOpenTables]);

  const handleRequestJoin = (table: OpenTable) => {
    setSelectedTable(table);
    setShowRequestModal(true);
    setRequestMessage('');
  };

  const handleSubmitRequest = async () => {
    if (!selectedTable) return;

    setIsSubmitting(true);
    try {
      const { error } = await reservationsService.sendJoinRequest(
        selectedTable.id,
        requestMessage || undefined
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
                setShowRequestModal(false);
                setSelectedTable(null);
                setRequestMessage('');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Submit request error:', error);
      Alert.alert('Errore', 'Errore imprevisto durante l\'invio della richiesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          Tavoli Aperti
        </Text>
      </View>

      {/* Content */}
      {openTables.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-muted-foreground text-center">
            Nessun tavolo aperto disponibile per questo evento
          </Text>
        </View>
      ) : (
        <FlatList
          data={openTables}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <CardContent className="p-4">
                {/* Owner Info */}
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-muted mr-3 justify-center items-center">
                    {item.owner.avatar_url ? (
                      <Text className="text-foreground">IMG</Text>
                    ) : (
                      <Text className="text-foreground font-semibold text-sm">
                        {item.owner.display_name[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {item.owner.display_name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Proprietario del tavolo
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {item.description && (
                  <View className="mb-3">
                    <Text className="text-sm text-foreground">
                      {item.description}
                    </Text>
                  </View>
                )}

                {/* Details */}
                <View className="flex-row flex-wrap gap-3 mb-3">
                  {item.min_budget && (
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-xs text-primary font-semibold">
                        Min €{item.min_budget}
                      </Text>
                    </View>
                  )}
                  <View className="bg-muted px-3 py-1 rounded-full">
                    <Text className="text-xs text-foreground">
                      {item.available_spots} posti disponibili
                    </Text>
                  </View>
                  <View className="bg-muted px-3 py-1 rounded-full">
                    <Text className="text-xs text-foreground">
                      {item.total_members} membri
                    </Text>
                  </View>
                </View>

                {/* Join Button */}
                <Pressable
                  onPress={() => handleRequestJoin(item)}
                  className="bg-primary py-3 rounded-lg items-center mt-2"
                >
                  <Text className="font-semibold text-primary-foreground">
                    Richiedi di unirti
                  </Text>
                </Pressable>
              </CardContent>
            </Card>
          )}
        />
      )}

      {/* Request Modal */}
      {showRequestModal && selectedTable && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-4">
              <Text className="text-lg font-semibold text-foreground mb-2">
                Richiedi di unirti al tavolo
              </Text>
              <Text className="text-sm text-muted-foreground mb-4">
                Invia un messaggio a {selectedTable.owner.display_name} per richiedere di unirti al suo tavolo.
              </Text>

              <TextInput
                placeholder="Messaggio (opzionale)"
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                numberOfLines={4}
                className="border border-border rounded-lg px-3 py-2 text-foreground min-h-[100px] mb-4"
                placeholderTextColor={themeColors.mutedForeground}
                textAlignVertical="top"
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowRequestModal(false);
                    setSelectedTable(null);
                    setRequestMessage('');
                  }}
                  className="flex-1 py-3 rounded-lg border border-border items-center"
                >
                  <Text className="font-semibold text-foreground">Annulla</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmitRequest}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-lg bg-primary items-center ${
                    isSubmitting ? 'opacity-50' : ''
                  }`}
                >
                  {isSubmitting ? (
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
      )}
    </SafeAreaView>
  );
}
