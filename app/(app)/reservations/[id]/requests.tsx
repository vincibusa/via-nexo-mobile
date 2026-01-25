import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../../../lib/contexts/settings';
import { THEME } from '../../../../lib/theme';
import { ChevronLeft } from 'lucide-react-native';
import { reservationsService } from '../../../../lib/services/reservations';
import type { JoinRequest } from '../../../../lib/types/reservations';
import { Card, CardContent } from '../../../../components/ui/card';

export default function JoinRequestsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const loadJoinRequests = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const { data, error } = await reservationsService.getJoinRequests(id, status);
      if (!error && data) {
        setJoinRequests(data);
      } else {
        Alert.alert('Errore', error || 'Errore nel caricamento delle richieste');
      }
    } catch (error) {
      console.error('Load join requests error:', error);
      Alert.alert('Errore', 'Errore imprevisto');
    } finally {
      setIsLoading(false);
    }
  }, [id, filter]);

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  const handleApprove = async (requestId: string) => {
    if (!id) return;

    setProcessingRequest(requestId);
    try {
      const { error } = await reservationsService.approveJoinRequest(id, requestId);

      if (error) {
        Alert.alert('Errore', error);
      } else {
        Alert.alert('Successo', 'Richiesta approvata!');
        loadJoinRequests();
      }
    } catch (error) {
      console.error('Approve request error:', error);
      Alert.alert('Errore', 'Errore imprevisto');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!id) return;

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
              const { error } = await reservationsService.rejectJoinRequest(id, requestId);

              if (error) {
                Alert.alert('Errore', error);
              } else {
                Alert.alert('Richiesta rifiutata');
                loadJoinRequests();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-600';
      case 'rejected':
        return 'bg-red-500/20 text-red-600';
      default:
        return 'bg-yellow-500/20 text-yellow-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approvata';
      case 'rejected':
        return 'Rifiutata';
      default:
        return 'In attesa';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color={themeColors.foreground} />
      </View>
    );
  }

  const filteredRequests = filter === 'all' 
    ? joinRequests 
    : joinRequests.filter(r => r.status === filter);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={24} color={themeColors.foreground} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground">
          Richieste Tavolo
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-4 py-3 border-b border-border gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${
              filter === f ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text className={`text-sm font-semibold ${
              filter === f ? 'text-primary-foreground' : 'text-foreground'
            }`}>
              {f === 'pending' ? 'In attesa' : f === 'approved' ? 'Approvate' : f === 'rejected' ? 'Rifiutate' : 'Tutte'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {filteredRequests.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-muted-foreground text-center">
            {filter === 'all' 
              ? 'Nessuna richiesta' 
              : `Nessuna richiesta ${filter === 'pending' ? 'in attesa' : filter === 'approved' ? 'approvata' : 'rifiutata'}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Card className="mb-4">
              <CardContent className="p-4">
                {/* Requester Info */}
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-full bg-muted mr-3 justify-center items-center">
                    {item.requester.avatar_url ? (
                      <Text className="text-foreground">IMG</Text>
                    ) : (
                      <Text className="text-foreground font-semibold">
                        {item.requester.display_name[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {item.requester.display_name}
                    </Text>
                    {item.requester.bio && (
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {item.requester.bio}
                      </Text>
                    )}
                  </View>
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-semibold">
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                {/* Message */}
                {item.message && (
                  <View className="mb-3 p-3 bg-muted rounded-lg">
                    <Text className="text-sm text-foreground">
                      {item.message}
                    </Text>
                  </View>
                )}

                {/* Timestamp */}
                <Text className="text-xs text-muted-foreground mb-3">
                  {new Date(item.created_at).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>

                {/* Actions (only for pending) */}
                {item.status === 'pending' && (
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => handleReject(item.id)}
                      disabled={processingRequest === item.id}
                      className={`flex-1 py-3 rounded-lg border border-destructive items-center ${
                        processingRequest === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      <Text className="font-semibold text-destructive">
                        Rifiuta
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApprove(item.id)}
                      disabled={processingRequest === item.id}
                      className={`flex-1 py-3 rounded-lg bg-primary items-center ${
                        processingRequest === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      {processingRequest === item.id ? (
                        <ActivityIndicator size="small" color={themeColors.primaryForeground} />
                      ) : (
                        <Text className="font-semibold text-primary-foreground">
                          Approva
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </CardContent>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
