import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Share2 } from 'lucide-react-native';
import { Share, Alert } from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

interface ShareButtonProps {
  title: string;
  message: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function ShareButton({ title, message, url, variant = 'outline', className }: ShareButtonProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  // Determine icon color based on button variant
  const getIconColor = () => {
    switch (variant) {
      case 'default':
        return themeColors.primaryForeground;
      case 'destructive':
        return themeColors.destructiveForeground;
      case 'secondary':
        return themeColors.secondaryForeground;
      case 'outline':
      case 'ghost':
      default:
        return themeColors.foreground;
    }
  };

  const handleShare = async () => {
    try {
      const shareContent: any = {
        title,
        message: url ? `${message}\n\n${url}` : message,
      };

      if (url) {
        shareContent.url = url;
      }

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile condividere');
    }
  };

  return (
    <Button variant={variant} onPress={handleShare} className={`flex-row gap-2 ${className || ''}`}>
      <Share2 size={18} color={getIconColor()} />
      <Text>Condividi</Text>
    </Button>
  );
}
