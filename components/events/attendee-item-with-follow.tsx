import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useRouter } from 'expo-router';

interface Attendee {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  status?: 'going' | 'interested' | 'not_going';
  isFollowing?: boolean;
}

interface AttendeeItemWithFollowProps {
  attendee: Attendee;
  onFollow?: (userId: string) => Promise<void>;
  showStatus?: boolean;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'going':
      return 'text-green-600';
    case 'interested':
      return 'text-blue-600';
    case 'not_going':
      return 'text-red-600';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'going':
      return 'Partecipa';
    case 'interested':
      return 'Interessato';
    case 'not_going':
      return 'Non partecipa';
    default:
      return '';
  }
};

export function AttendeeItemWithFollow({
  attendee,
  onFollow,
  showStatus = true,
}: AttendeeItemWithFollowProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/profile/${attendee.id}` as any)}
      className="flex-row items-center justify-between px-4 py-3 border-b border-border"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage source={{ uri: attendee.avatar_url || '' }} />
          <AvatarFallback>
            <Text className="text-xs font-semibold">
              {attendee.username.charAt(0).toUpperCase()}
            </Text>
          </AvatarFallback>
        </Avatar>

        <View className="flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {attendee.full_name || attendee.username}
          </Text>
          {showStatus && attendee.status && (
            <Text className={`text-xs font-medium ${getStatusColor(attendee.status)}`}>
              {getStatusLabel(attendee.status)}
            </Text>
          )}
        </View>
      </View>

      <Button
        variant={attendee.isFollowing ? 'outline' : 'default'}
        onPress={() => onFollow?.(attendee.id)}
        className="px-3"
        size="sm"
      >
        <Text
          className={`text-xs font-medium ${
            attendee.isFollowing ? '' : 'text-primary-foreground'
          }`}
        >
          {attendee.isFollowing ? 'Seguendo' : 'Segui'}
        </Text>
      </Button>
    </TouchableOpacity>
  );
}
