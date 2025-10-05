import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Share2 } from 'lucide-react-native';
import { Share, Alert } from 'react-native';

interface ShareButtonProps {
  title: string;
  message: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function ShareButton({ title, message, url, variant = 'outline', className }: ShareButtonProps) {
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
      <Share2 size={18} />
      <Text>Condividi</Text>
    </Button>
  );
}
