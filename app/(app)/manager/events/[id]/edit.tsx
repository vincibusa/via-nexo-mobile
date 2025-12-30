/**
 * Edit Event Screen
 * Form for editing an existing event
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { EventForm } from '../../../../../components/manager/event-form';
import { managerService } from '../../../../../lib/services/manager';
import type { EventFormData, ManagerEvent } from '../../../../../lib/types/manager';

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<ManagerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load event data
  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      console.log('[Edit Event] Loading event with ID:', id);
      const { data, error } = await managerService.getEvent(id);

      if (error) {
        console.error('[Edit Event] Error loading event:', error);
        Alert.alert('Errore', error);
        router.back();
        return;
      }

      if (data) {
        console.log('[Edit Event] Event loaded successfully:', data.title);
        setEvent(data);
      } else {
        console.warn('[Edit Event] No data returned from API');
      }
    } catch (error) {
      console.error('Load event error:', error);
      Alert.alert('Errore', 'Impossibile caricare l\'evento');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      const { data: updatedEvent, error } = await managerService.updateEvent(id, data);

      if (error) {
        Alert.alert('Errore', error);
        return;
      }

      if (updatedEvent) {
        Alert.alert(
          'Successo',
          'Evento aggiornato con successo!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Update event error:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'aggiornamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina Evento',
      'Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      const { error } = await managerService.deleteEvent(id);

      if (error) {
        Alert.alert('Errore', error);
        return;
      }

      Alert.alert(
        'Successo',
        'Evento eliminato con successo',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(app)/manager' as any),
          },
        ]
      );
    } catch (error) {
      console.error('Delete event error:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-muted-foreground mt-4">
            Caricamento evento...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-foreground text-lg mb-2">Evento non trovato</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-lg mt-4"
          >
            <Text className="text-primary-foreground font-semibold">
              Torna Indietro
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <EventForm
        initialData={{
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime,
          doors_open_time: event.doors_open_time,
          place_id: event.place_id,
          is_published: event.is_published,
          is_listed: event.is_listed,
          cover_image_url: event.cover_image_url,
          promo_video_url: event.promo_video_url,
          genre: event.genre,
          lineup: event.lineup,
          ticket_url: event.ticket_url,
          ticket_price_min: event.ticket_price_min,
          ticket_price_max: event.ticket_price_max,
          tickets_available: event.tickets_available,
          capacity: event.capacity,
          lista_nominativa_enabled: event.lista_nominativa_enabled,
          max_guests_per_reservation: event.max_guests_per_reservation,
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Delete Button */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className="bg-red-500 py-4 rounded-lg flex-row items-center justify-center active:opacity-70"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Trash2 size={20} color="white" className="mr-2" />
              <Text className="text-white font-semibold text-lg">
                Elimina Evento
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
