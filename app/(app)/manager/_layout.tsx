/**
 * Manager Stack Layout
 * Stack navigation for manager-specific screens
 */

import { Stack } from 'expo-router';

export default function ManagerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'I Miei Eventi',
          headerBackTitle: 'Indietro',
        }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          title: 'Scanner Check-in',
          headerBackTitle: 'Indietro',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="events/create"
        options={{
          title: 'Nuovo Evento',
          headerBackTitle: 'Annulla',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="events/[id]/edit"
        options={{
          title: 'Modifica Evento',
          headerBackTitle: 'Annulla',
        }}
      />
    </Stack>
  );
}
