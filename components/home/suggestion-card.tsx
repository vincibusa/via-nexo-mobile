import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Text } from '../../components/ui/text';
import type { SuggestedPlace } from '../../lib/types/suggestion';
import { useRouter } from 'expo-router';
import { Heart, Share2, MapPin, Clock } from 'lucide-react-native';
import { View, Image, Pressable } from 'react-native';

interface SuggestionCardProps {
  place: SuggestedPlace;
}

export function SuggestionCard({ place }: SuggestionCardProps) {
  const router = useRouter();

  const handleDetails = () => {
    router.push(`/place/${place.id}` as any);
  };

  const handleSave = () => {
    // TODO: Implement favorite toggle
    console.log('Save place:', place.id);
  };

  const handleShare = () => {
    // TODO: Implement share
    console.log('Share place:', place.id);
  };

  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <Pressable onPress={handleDetails}>
        {place.cover_image ? (
          <Image
            source={{ uri: place.cover_image }}
            className="h-48 w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-48 w-full bg-muted" />
        )}
      </Pressable>

      <CardHeader className="gap-2">
        {/* Title & Category */}
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-lg font-bold">{place.name}</Text>
          <Badge variant="secondary">
            <Text className="text-xs">{place.category}</Text>
          </Badge>
        </View>

        {/* Distance & Price */}
        <View className="flex-row items-center gap-4">
          {place.distance_km && (
            <View className="flex-row items-center gap-1">
              <MapPin size={14} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">
                {place.distance_km.toFixed(1)} km
              </Text>
            </View>
          )}
          {place.price_range && (
            <Badge variant="outline">
              <Text className="text-xs">{place.price_range}</Text>
            </Badge>
          )}
          {place.verified && (
            <Badge variant="default">
              <Text className="text-xs">✓ Verificato</Text>
            </Badge>
          )}
        </View>
      </CardHeader>

      <CardContent className="gap-4">
        {/* AI Reason - Highlight principale */}
        <View className="rounded-lg bg-primary/10 p-3">
          <Text className="text-sm font-medium text-primary">💡 {place.ai_reason}</Text>
        </View>

        {/* Description preview */}
        {place.description && (
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {place.description}
          </Text>
        )}

        {/* Actions */}
        <View className="flex-row gap-2">
          <Button onPress={handleDetails} className="flex-1">
            <Text>Dettagli</Text>
          </Button>
          <Button variant="outline" size="icon" onPress={handleSave}>
            <Heart size={18} />
          </Button>
          <Button variant="ghost" size="icon" onPress={handleShare}>
            <Share2 size={18} />
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}
