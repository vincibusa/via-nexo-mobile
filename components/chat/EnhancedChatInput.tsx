/**
 * Enhanced Chat Input Component
 * Liquid Glass style come l'header - paperclip, emoji, mic/send
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable, Alert, StyleSheet, Platform, Text, Dimensions } from 'react-native';
import { Send, Paperclip, Camera, ImagePlus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { TINT_COLORS_BY_THEME } from '../../lib/glass/constants';
import { GlassView } from '../glass/glass-view';
import { GlassView as ExpoGlassView } from 'expo-glass-effect';
import { WhatsAppVoiceRecorder } from './WhatsAppVoiceRecorder';
import { ImagePickerPreview } from './ImagePickerPreview';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const MAX_IMAGES = 10;

function InputPill ({
  children,
  glassTintColor,
}: {
  children: React.ReactNode;
  glassTintColor: string;
}) {
  return Platform.OS === 'ios' ? (
    <ExpoGlassView
      glassEffectStyle="regular"
      tintColor={glassTintColor}
      isInteractive
      style={styles.pill}
    >
      {children}
    </ExpoGlassView>
  ) : (
    <GlassView intensity="regular" tint="extraLight" isInteractive style={styles.pill}>
      {children}
    </GlassView>
  );
}

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
  const { settings } = useSettings();
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : settings?.theme === 'dark'
    ? 'dark'
    : 'light';
  const themeColors = THEME[effectiveTheme];
  const glassTintColor = TINT_COLORS_BY_THEME[effectiveTheme].extraLight.regular;

  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSendingImages, setIsSendingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState<{ completed: number; total: number } | undefined>();
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);

  const hasText = message.trim().length > 0;
  const hasImages = selectedImages.length > 0;

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsVoiceRecording(recording);
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

  const openAttachmentDropdown = useCallback(() => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachmentDropdown(true);
  }, [disabled]);

  const closeAttachmentDropdown = useCallback(() => {
    setShowAttachmentDropdown(false);
  }, []);

  const handlePickImagesFromDropdown = useCallback(() => {
    closeAttachmentDropdown();
    handlePickImages();
  }, [closeAttachmentDropdown, handlePickImages]);

  const handleTakePhotoFromDropdown = useCallback(() => {
    closeAttachmentDropdown();
    handleTakePhoto();
  }, [closeAttachmentDropdown, handleTakePhoto]);

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
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Dropdown overlay */}
      {showAttachmentDropdown && (
        <>
          <Pressable
            onPress={closeAttachmentDropdown}
            style={styles.dropdownBackdrop}
            pointerEvents="auto"
          />
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            style={styles.dropdown}
          >
            {Platform.OS === 'ios' ? (
              <ExpoGlassView
                glassEffectStyle="regular"
                tintColor={glassTintColor}
                isInteractive
                style={styles.dropdownGlass}
              >
                <Pressable
                  onPress={handlePickImagesFromDropdown}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    styles.dropdownItemFirst,
                    pressed && { backgroundColor: themeColors.muted },
                  ]}
                >
                  <View style={[styles.dropdownItemIconWrap, { backgroundColor: themeColors.muted }]}>
                    <ImagePlus size={20} color={themeColors.foreground} />
                  </View>
                  <Text style={[styles.dropdownItemText, { color: themeColors.foreground }]}>
                    Libreria foto
                  </Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: themeColors.border }]} />
                <Pressable
                  onPress={handleTakePhotoFromDropdown}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    styles.dropdownItemLast,
                    pressed && { backgroundColor: themeColors.muted },
                  ]}
                >
                  <View style={[styles.dropdownItemIconWrap, { backgroundColor: themeColors.muted }]}>
                    <Camera size={20} color={themeColors.foreground} />
                  </View>
                  <Text style={[styles.dropdownItemText, { color: themeColors.foreground }]}>
                    Scatta foto
                  </Text>
                </Pressable>
              </ExpoGlassView>
            ) : (
              <GlassView intensity="regular" tint="extraLight" isInteractive style={styles.dropdownGlass}>
                <Pressable
                  onPress={handlePickImagesFromDropdown}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    styles.dropdownItemFirst,
                    pressed && { backgroundColor: themeColors.muted },
                  ]}
                >
                  <View style={[styles.dropdownItemIconWrap, { backgroundColor: themeColors.muted }]}>
                    <ImagePlus size={20} color={themeColors.foreground} />
                  </View>
                  <Text style={[styles.dropdownItemText, { color: themeColors.foreground }]}>
                    Libreria foto
                  </Text>
                </Pressable>
                <View style={[styles.dropdownDivider, { backgroundColor: themeColors.border }]} />
                <Pressable
                  onPress={handleTakePhotoFromDropdown}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    styles.dropdownItemLast,
                    pressed && { backgroundColor: themeColors.muted },
                  ]}
                >
                  <View style={[styles.dropdownItemIconWrap, { backgroundColor: themeColors.muted }]}>
                    <Camera size={20} color={themeColors.foreground} />
                  </View>
                  <Text style={[styles.dropdownItemText, { color: themeColors.foreground }]}>
                    Scatta foto
                  </Text>
                </Pressable>
              </GlassView>
            )}
          </Animated.View>
        </>
      )}

      {/* Liquid Glass pill - come header */}
      <InputPill glassTintColor={glassTintColor}>
        {!isVoiceRecording && (
          <Pressable
            onPress={openAttachmentDropdown}
            disabled={disabled}
            style={styles.iconButton}
          >
            <Paperclip size={22} color={themeColors.mutedForeground} />
          </Pressable>
        )}

        {!isVoiceRecording && (
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={themeColors.mutedForeground}
            style={[styles.input, { color: themeColors.foreground }]}
            multiline
            maxLength={500}
            editable={!disabled}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
          />
        )}

        {hasText && !isVoiceRecording && (
          <Pressable
            onPress={handleSendText}
            disabled={disabled}
            style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
          >
            <Send size={20} color={themeColors.primaryForeground} />
          </Pressable>
        )}

        {!hasText && (
          <WhatsAppVoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onRecordingCancel={handleVoiceRecordingCancel}
            onRecordingStateChange={handleRecordingStateChange}
            disabled={disabled}
          />
        )}
      </InputPill>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -Dimensions.get('window').height,
    left: -Dimensions.get('window').width,
    width: Dimensions.get('window').width * 2,
    height: Dimensions.get('window').height * 2,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    width: 220,
    overflow: 'hidden',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  dropdownGlass: {
    overflow: 'hidden',
    borderRadius: 20,
    padding: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  dropdownItemFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  dropdownItemLast: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  dropdownItemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 9,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 120,
  },
});
