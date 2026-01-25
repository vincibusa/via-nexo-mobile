/**
 * Manager Stack Layout
 * Stack navigation for manager-specific screens
 * Protected by role-based access control (manager, admin only)
 */

import { Stack } from 'expo-router';
import { ProtectedRoute } from '../../../lib/components/ProtectedRoute';

export default function ManagerLayout() {
  return (
    <ProtectedRoute allowedRoles={['manager', 'admin']}>
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
    </ProtectedRoute>
  );
}
