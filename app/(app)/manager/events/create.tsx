/**
 * Create Event Screen
 * Form for creating a new event
 */

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { EventForm } from '../../../../components/manager/event-form';
import { managerService } from '../../../../lib/services/manager';
import type { EventFormData } from '../../../../lib/types/manager';

export default function CreateEventScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: EventFormData) => {
    try {
      setIsLoading(true);

      const { data: createdEvent, error } = await managerService.createEvent(data);

      if (error) {
        Alert.alert('Errore', error);
        return;
      }

      if (createdEvent) {
        Alert.alert(
          'Successo',
          'Evento creato con successo!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Create event error:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la creazione dell\'evento');
    } finally {
      setIsLoading(false);
    }
  };

  return <EventForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
