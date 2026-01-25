import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { MapPin } from 'lucide-react-native';
import { Linking, Platform, Alert } from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

interface MapLinkButtonProps {
  latitude: number;
  longitude: number;
  label?: string;
  address?: string;
}

export function MapLinkButton({ latitude, longitude, label, address }: MapLinkButtonProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  const openMaps = async () => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });

    const latLng = `${latitude},${longitude}`;
    const labelParam = label ? `?q=${encodeURIComponent(label)}` : '';

    const url = Platform.select({
      ios: `${scheme}${latLng}${labelParam}`,
      android: `${scheme}${latLng}${labelParam}`,
    });

    try {
      const supported = await Linking.canOpenURL(url!);
      if (supported) {
        await Linking.openURL(url!);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aprire la mappa');
    }
  };

  return (
    <Button variant="outline" onPress={openMaps} className="flex-row gap-2">
      <MapPin size={18} color={themeColors.foreground} />
      <Text>Ottieni indicazioni</Text>
    </Button>
  );
}
