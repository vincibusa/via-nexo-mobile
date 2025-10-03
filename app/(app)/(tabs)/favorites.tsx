import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <Text className="text-4xl">❤️</Text>
        <Text className="text-2xl font-bold">Preferiti</Text>
        <Text className="text-center text-muted-foreground">
          Questa schermata sarà implementata nella prossima fase
        </Text>
      </View>
    </SafeAreaView>
  );
}
