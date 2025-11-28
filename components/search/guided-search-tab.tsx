import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { Search, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function GuidedSearchTab() {
  const router = useRouter();

  return (
    <View className="flex-1 p-4">
      <Card className="bg-card">
        <TouchableOpacity
          onPress={() => router.push('/(app)/chat-search?mode=guided' as any)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-4 p-6">
            <View className="rounded-full bg-primary/10 p-4">
              <Search size={32} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold mb-1">Ricerca Guidata</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                Trova rapidamente con filtri: compagnia, mood, budget e orario
              </Text>
            </View>
            <ChevronRight size={24} className="text-muted-foreground" />
          </View>
        </TouchableOpacity>
      </Card>

      {/* Suggerimenti */}
      <View className="mt-8">
        <Text className="text-sm font-semibold mb-4">Ricerche Consigliate</Text>
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => router.push('/(app)/chat-search?mode=guided' as any)}
            className="py-3 px-4 bg-muted/50 rounded-lg flex-row justify-between items-center"
          >
            <Text className="font-medium">Aperitivo stasera</Text>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(app)/chat-search?mode=guided' as any)}
            className="py-3 px-4 bg-muted/50 rounded-lg flex-row justify-between items-center"
          >
            <Text className="font-medium">Cena romantica</Text>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(app)/chat-search?mode=guided' as any)}
            className="py-3 px-4 bg-muted/50 rounded-lg flex-row justify-between items-center"
          >
            <Text className="font-medium">Musica dal vivo weekend</Text>
            <ChevronRight size={18} className="text-muted-foreground" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
