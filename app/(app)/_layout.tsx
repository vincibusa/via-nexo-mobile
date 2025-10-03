import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: ''
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: ''
        }}
      />
    </Stack>
  );
}
