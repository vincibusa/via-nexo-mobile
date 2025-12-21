import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  Linking,
} from 'react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/contexts/auth';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Camera,
  AlertCircle,
  Type,
  Palette,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { uploadService, UploadProgress } from '../../lib/services/upload';
import { API_CONFIG } from '../../lib/config';

const { height, width } = Dimensions.get('window');

// Text overlay types
type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
};

// Filter types
type Filter = {
  id: string;
  name: string;
  style: {
    opacity?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    sepia?: number;
    grayscale?: number;
  };
};

const FILTERS: Filter[] = [
  { id: 'normal', name: 'Normale', style: {} },
  { id: 'clarendon', name: 'Clarendon', style: { opacity: 1.1, contrast: 1.2, saturate: 1.1 } },
  { id: 'gingham', name: 'Gingham', style: { sepia: 0.3, opacity: 1.05 } },
  { id: 'moon', name: 'Luna', style: { grayscale: 1, opacity: 1.1, contrast: 1.1 } },
  { id: 'lark', name: 'Allodola', style: { opacity: 1.1, saturate: 1.2 } },
  { id: 'reyes', name: 'Reyes', style: { sepia: 0.4, opacity: 1.1, contrast: 0.9 } },
];

const FONT_FAMILIES = [
  { id: 'system', name: 'Normale' },
  { id: 'serif', name: 'Serif' },
  { id: 'monospace', name: 'Mono' },
  { id: 'cursive', name: 'Corsivo' },
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

export default function CreateStoryScreen() {
  const { user, session } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [activeTextOverlay, setActiveTextOverlay] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('system');

  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permesso richiesto',
        'Per selezionare immagini dalla galleria, Nexo ha bisogno dell\'accesso alla tua libreria fotografica.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Apri Impostazioni', onPress: () => Linking.openURL('app-settings:') }
        ]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permesso richiesto',
        'Per scattare foto, Nexo ha bisogno dell\'accesso alla fotocamera.',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Apri Impostazioni', onPress: () => Linking.openURL('app-settings:') }
        ]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      setError(null);

      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        aspect: undefined,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        resetEditor();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Errore durante la selezione dell\'immagine');
    }
  };

  const openCamera = async () => {
    try {
      setError(null);

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: undefined,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        resetEditor();
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      setError('Errore durante l\'uso della fotocamera');
    }
  };

  const resetEditor = () => {
    setTextOverlays([]);
    setActiveTextOverlay(null);
    setSelectedFilter('normal');
    setShowTextEditor(false);
    setShowFilters(false);
    setCurrentText('');
    setTextColor('#FFFFFF');
    setTextSize(24);
    setFontFamily('system');
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: width / 2 - 100,
      y: height / 2 - 20,
      fontSize: textSize,
      color: textColor,
      fontFamily,
      rotation: 0,
    };

    setTextOverlays([...textOverlays, newOverlay]);
    setActiveTextOverlay(newOverlay.id);
    setCurrentText('');
    setShowTextEditor(false);
  };


  const deleteTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(overlay => overlay.id !== id));
    if (activeTextOverlay === id) {
      setActiveTextOverlay(null);
    }
  };

  const handlePost = async () => {
    if (!image) return;

    if (!session?.accessToken) {
      setError('Accesso non autorizzato. Effettua il login.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create file object from image URI
      const fileName = `story-${Date.now()}.jpg`;
      const file = {
        uri: image,
        name: fileName,
        type: 'image/jpeg',
      };

      // Upload image to Supabase Storage
      const uploadResponse = await uploadService.uploadStoryMedia(
        file,
        session.accessToken,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      // Create story record with text overlays
      const storyUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORIES_CREATE}`;
      console.log('Creating story at:', storyUrl);

      const response = await fetch(storyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          media_url: uploadResponse.url,
          media_type: 'image',
          text_overlay: textOverlays.length > 0 ? JSON.stringify(textOverlays) : null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Story creation failed:', response.status, errorText);

        let errorMessage = `Errore HTTP ${response.status} durante la creazione della storia`;
        try {
          const errorData = JSON.parse(errorText || '{}');
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Show success message
      Alert.alert(
        'Storia pubblicata!',
        'La tua storia è stata pubblicata con successo e sarà visibile per 24 ore.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setError(errorMessage);
      Alert.alert(
        'Errore',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const getFilterStyle = (filterId: string) => {
    const filter = FILTERS.find(f => f.id === filterId);
    if (!filter) return {};

    const style: any = {};

    // Map filter properties to React Native styles
    if (filter.style.opacity !== undefined) {
      style.opacity = filter.style.opacity;
    }
    if (filter.style.brightness !== undefined) {
      // React Native doesn't have brightness, use opacity as approximation
      style.opacity = filter.style.brightness;
    }
    if (filter.style.contrast !== undefined) {
      // React Native doesn't have contrast, use opacity as approximation
      style.opacity = (style.opacity || 1) * filter.style.contrast;
    }
    if (filter.style.saturate !== undefined) {
      // React Native doesn't have saturation, use opacity as approximation
      style.opacity = (style.opacity || 1) * filter.style.saturate;
    }
    if (filter.style.sepia !== undefined) {
      // React Native doesn't have sepia, use opacity as approximation
      style.opacity = (style.opacity || 1) * (1 - filter.style.sepia * 0.3);
    }
    if (filter.style.grayscale !== undefined) {
      // React Native doesn't have grayscale, use opacity as approximation
      style.opacity = (style.opacity || 1) * (1 - filter.style.grayscale * 0.2);
    }

    return style;
  };

  const getFontFamilyStyle = (fontFamily: string) => {
    switch (fontFamily) {
      case 'serif': return { fontFamily: 'Georgia' };
      case 'monospace': return { fontFamily: 'Courier New' };
      case 'cursive': return { fontFamily: 'cursive' };
      default: return { fontFamily: 'System' };
    }
  };

  // Render text editor modal
  const renderTextEditor = () => (
    <Modal
      visible={showTextEditor}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <TouchableOpacity onPress={() => setShowTextEditor(false)}>
            <X size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Aggiungi testo</Text>
          <TouchableOpacity onPress={addTextOverlay}>
            <Check size={24} className="text-primary" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-4">
          <TextInput
            value={currentText}
            onChangeText={setCurrentText}
            placeholder="Scrivi qualcosa..."
            className="text-2xl text-center mb-6 text-foreground"
            style={getFontFamilyStyle(fontFamily)}
            multiline
            autoFocus
            placeholderTextColor={themeColors.mutedForeground}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {FONT_FAMILIES.map(font => (
              <TouchableOpacity
                key={font.id}
                onPress={() => setFontFamily(font.id)}
                className={cn(
                  'px-4 py-2 mx-1 rounded-lg border',
                  fontFamily === font.id ? 'bg-primary border-primary' : 'bg-muted border-border'
                )}
              >
                <Text className={cn(
                  fontFamily === font.id ? 'text-primary-foreground' : 'text-foreground'
                )}>
                  {font.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {TEXT_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setTextColor(color)}
                className={cn(
                  'w-10 h-10 mx-1 rounded-full border-2',
                  textColor === color ? 'border-primary' : 'border-border'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </ScrollView>

          <View className="flex-row items-center justify-between">
            <Text className="text-foreground">Dimensione testo</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => setTextSize(Math.max(16, textSize - 4))}
                className="w-8 h-8 items-center justify-center rounded-full bg-muted"
              >
                <Text className="text-foreground">A</Text>
              </TouchableOpacity>
              <Text className="text-foreground">{textSize}px</Text>
              <TouchableOpacity
                onPress={() => setTextSize(Math.min(48, textSize + 4))}
                className="w-8 h-8 items-center justify-center rounded-full bg-muted"
              >
                <Text className="text-foreground text-lg">A</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Render filters modal
  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <X size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Filtri</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1">
          <View className="h-64 bg-black items-center justify-center">
            {image && (
              <Image
                source={{ uri: image }}
                style={{
                  width: '100%',
                  height: '100%',
                  resizeMode: 'contain',
                  ...getFilterStyle(selectedFilter),
                }}
                resizeMode="contain"
              />
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-4">
            {FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                className="mr-4"
              >
                <View className="h-20 w-20 rounded-lg overflow-hidden bg-black">
                  {image && (
                    <Image
                      source={{ uri: image }}
                      style={{
                        width: 80,
                        height: 80,
                        resizeMode: 'cover',
                        ...getFilterStyle(filter.id),
                      }}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <Text className="text-center mt-2 text-sm text-foreground">
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (image) {
    return (
      <SafeAreaView
        className={cn('flex-1 bg-black', colorScheme === 'dark' ? 'dark' : '')}
        edges={['top']}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between p-4">
            <TouchableOpacity onPress={() => setImage(null)}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text className="font-semibold text-white">
              La tua storia
            </Text>
            <View className="w-6" />
          </View>

          {/* Image Preview with Filter */}
          <View className="flex-1 items-center justify-center bg-black">
            {image && (
              <Image
                source={{ uri: image }}
                style={{
                  width: width,
                  height: height * 0.7,
                  resizeMode: 'contain',
                  ...getFilterStyle(selectedFilter),
                }}
                resizeMode="contain"
              />
            )}

            {/* Text Overlays */}
            {textOverlays.map(overlay => (
              <TouchableOpacity
                key={overlay.id}
                style={{
                  position: 'absolute',
                  left: overlay.x,
                  top: overlay.y,
                  transform: [{ rotate: `${overlay.rotation}deg` }],
                }}
                onPress={() => setActiveTextOverlay(overlay.id)}
              >
                <Text
                  style={{
                    fontSize: overlay.fontSize,
                    color: overlay.color,
                    textShadowColor: 'rgba(0,0,0,0.8)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3,
                    ...getFontFamilyStyle(overlay.fontFamily),
                  }}
                >
                  {overlay.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <View className="absolute top-20 left-4 right-4">
              <View className="bg-black/50 rounded-full p-1">
                <View
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
              <Text className="text-white text-center text-xs mt-1">
                Caricamento: {uploadProgress}%
              </Text>
            </View>
          )}

          {/* Editor Tools */}
          <View className="absolute bottom-20 left-0 right-0 flex-row justify-center gap-4">
            <TouchableOpacity
              onPress={() => setShowTextEditor(true)}
              className="w-12 h-12 rounded-full bg-white/20 items-center justify-center"
            >
              <Type size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              className="w-12 h-12 rounded-full bg-white/20 items-center justify-center"
            >
              <Palette size={24} color="white" />
            </TouchableOpacity>

            {activeTextOverlay && (
              <TouchableOpacity
                onPress={() => deleteTextOverlay(activeTextOverlay)}
                className="w-12 h-12 rounded-full bg-red-500/80 items-center justify-center"
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Footer Actions */}
          <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 bg-black/80 p-4">
            <TouchableOpacity
              onPress={() => setImage(null)}
              className="flex-1"
              disabled={isLoading}
            >
              <Text className="text-center font-medium text-white">
                Scarta
              </Text>
            </TouchableOpacity>
            <Button
              onPress={handlePost}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-center font-semibold text-white">
                  Condividi
                </Text>
              )}
            </Button>
          </View>
        </View>

        {renderTextEditor()}
        {renderFiltersModal()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', colorScheme === 'dark' ? 'dark' : '')}
      edges={['top']}
    >
      <View className="flex-1 flex-col">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Nuova Storia</Text>
          <View className="w-6" />
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-center gap-6 px-6">
          {/* Error Display */}
          {error && (
            <View className="w-full flex-row items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle size={20} className="text-red-500" />
              <Text className="flex-1 text-sm text-red-700">
                {error}
              </Text>
            </View>
          )}

          {/* Camera Option */}
          <TouchableOpacity
            onPress={openCamera}
            className="w-full flex-row items-center gap-4 rounded-lg border border-border bg-muted/30 p-6"
          >
            <Camera size={24} className="text-foreground" />
            <View className="flex-1">
              <Text className="text-base font-semibold">
                Scatta una foto
              </Text>
              <Text className="text-sm text-muted-foreground">
                Usa la fotocamera del tuo telefono
              </Text>
            </View>
          </TouchableOpacity>

          {/* Gallery Option */}
          <TouchableOpacity
            onPress={pickImage}
            className="w-full flex-row items-center gap-4 rounded-lg border border-border bg-muted/30 p-6"
          >
            <View className="h-6 w-6 items-center justify-center rounded bg-primary">
              <Text className="text-xs font-bold text-primary-foreground">
                📁
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold">
                Scegli dalla galleria
              </Text>
              <Text className="text-sm text-muted-foreground">
                Seleziona una foto dal tuo dispositivo
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info */}
          <View className="mt-6 rounded-lg bg-muted/30 p-4">
            <Text className="text-center text-xs text-muted-foreground leading-relaxed">
              Le storie scompaiono dopo 24 ore.{'\n'}
              Solo i tuoi follower potranno vederle.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}