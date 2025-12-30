/**
 * Enhanced Chat Input Component
 * Supports text, images, and voice messages with WhatsApp-style interactions
 */

import { useState, useCallback } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { Send, ImagePlus, Camera, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';
import { WhatsAppVoiceRecorder } from './WhatsAppVoiceRecorder';
import { ImagePickerPreview } from './ImagePickerPreview';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const MAX_IMAGES = 10;

interface EnhancedChatInputProps {
  onSendText: (message: string) => void;
  onSendImages: (imageUris: string[]) => Promise<void>;
  onSendVoice: (uri: string, duration: number) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function EnhancedChatInput({
  onSendText,
  onSendImages,
  onSendVoice,
  placeholder = 'Scrivi un messaggio...',
  disabled = false,
}: EnhancedChatInputProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSendingImages, setIsSendingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState<{ completed: number; total: number } | undefined>();
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const hasText = message.trim().length > 0;
  const hasImages = selectedImages.length > 0;

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsVoiceRecording(recording);
    if (recording) {
      setShowMediaOptions(false); // Hide media options when recording
    }
  }, []);

  const handleSendText = useCallback(() => {
    if (hasText && !disabled) {
      onSendText(message.trim());
      setMessage('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [message, disabled, onSendText, hasText]);

  const handlePickImages = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permesso richiesto',
          'Concedi il permesso alla galleria per inviare immagini.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - selectedImages.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => {
          const combined = [...prev, ...newImages];
          return combined.slice(0, MAX_IMAGES);
        });
        setShowMediaOptions(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('[EnhancedChatInput] Error picking images:', error);
      Alert.alert('Errore', 'Impossibile accedere alla galleria');
    }
  }, [selectedImages.length]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permesso richiesto',
          'Concedi il permesso alla fotocamera per scattare foto.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedImages(prev => {
          if (prev.length >= MAX_IMAGES) {
            Alert.alert('Limite raggiunto', `Puoi inviare massimo ${MAX_IMAGES} immagini alla volta.`);
            return prev;
          }
          return [...prev, result.assets[0].uri];
        });
        setShowMediaOptions(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('[EnhancedChatInput] Error taking photo:', error);
      Alert.alert('Errore', 'Impossibile accedere alla fotocamera');
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCancelImages = useCallback(() => {
    setSelectedImages([]);
    setShowMediaOptions(false);
  }, []);

  const handleSendImages = useCallback(async () => {
    if (selectedImages.length === 0 || isSendingImages) return;

    setIsSendingImages(true);
    setImageProgress({ completed: 0, total: selectedImages.length });

    try {
      await onSendImages(selectedImages);
      setSelectedImages([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[EnhancedChatInput] Error sending images:', error);
      Alert.alert('Errore', 'Impossibile inviare le immagini. Riprova.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSendingImages(false);
      setImageProgress(undefined);
    }
  }, [selectedImages, isSendingImages, onSendImages]);

  const handleVoiceRecordingComplete = useCallback(async (uri: string, duration: number) => {
    try {
      await onSendVoice(uri, duration);
    } catch (error) {
      console.error('[EnhancedChatInput] Error sending voice:', error);
      Alert.alert('Errore', 'Impossibile inviare il messaggio vocale. Riprova.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [onSendVoice]);

  const handleVoiceRecordingCancel = useCallback(() => {
    // Recording was cancelled, nothing to do
  }, []);

  const toggleMediaOptions = useCallback(() => {
    setShowMediaOptions(prev => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // If images are selected, show the image preview
  if (hasImages) {
    return (
      <ImagePickerPreview
        images={selectedImages}
        onRemove={handleRemoveImage}
        onCancel={handleCancelImages}
        onSend={handleSendImages}
        isSending={isSendingImages}
        progress={imageProgress}
      />
    );
  }

  return (
    <View className="border-t border-border bg-background">
      {/* Media options overlay */}
      {showMediaOptions && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className="flex-row gap-4 px-4 py-3 border-b border-border"
        >
          <Pressable
            onPress={handleTakePhoto}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-primary"
          >
            <Camera size={18} color={themeColors.primaryForeground} />
          </Pressable>
          <Pressable
            onPress={handlePickImages}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-secondary"
          >
            <ImagePlus size={18} color={themeColors.foreground} />
          </Pressable>
          <View className="flex-1" />
          <Pressable
            onPress={toggleMediaOptions}
            className="p-2"
          >
            <X size={20} color={themeColors.mutedForeground} />
          </Pressable>
        </Animated.View>
      )}

      {/* Main input row */}
      <View className="flex-row items-center gap-2 p-4">
        {/* Media button - hidden when recording */}
        {!isVoiceRecording && (
          <Pressable
            onPress={toggleMediaOptions}
            disabled={disabled}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              showMediaOptions ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <ImagePlus
              size={20}
              color={showMediaOptions ? themeColors.primaryForeground : themeColors.foreground}
            />
          </Pressable>
        )}

        {/* Text input - hidden when recording */}
        {!isVoiceRecording && (
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={themeColors.mutedForeground}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-base text-foreground"
            multiline
            maxLength={500}
            editable={!disabled}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
          />
        )}

        {/* Send button - visible only when has text AND not recording */}
        {hasText && !isVoiceRecording && (
          <Pressable
            onPress={handleSendText}
            disabled={disabled}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary"
          >
            <Send size={20} color={themeColors.primaryForeground} />
          </Pressable>
        )}

        {/* Voice recorder - ALWAYS in the same position, visible when no text OR recording */}
        {!hasText && (
          <WhatsAppVoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onRecordingCancel={handleVoiceRecordingCancel}
            onRecordingStateChange={handleRecordingStateChange}
            disabled={disabled}
          />
        )}
      </View>
    </View>
  );
}
