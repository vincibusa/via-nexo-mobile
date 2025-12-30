/**
 * Voice Message Recorder Component
 * UI for recording, previewing, and sending voice messages
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Mic, Square, Play, Pause, Trash2, Send, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { useVoiceRecording } from '../../lib/hooks/useVoiceRecording';
import voiceMessageService from '../../lib/services/voice-message';

interface VoiceMessageRecorderProps {
  conversationId: string;
  onSend: (messageId: string) => void;
  onCancel: () => void;
  maxDuration?: number;
}

export function VoiceMessageRecorder({
  conversationId,
  onSend,
  onCancel,
  maxDuration = 120,
}: VoiceMessageRecorderProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];
  const isDark = effectiveTheme === 'dark';

  const {
    state,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    resumeRecording,
    stopPlayback,
    deleteRecording,
    getRecordingFile,
    cleanup,
  } = useVoiceRecording({ maxDuration });

  const [isUploading, setIsUploading] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate fake waveform data for visualization
  useEffect(() => {
    if (state.isRecording) {
      const interval = setInterval(() => {
        // Generate random amplitude for waveform visualization
        const amplitude = Math.random() * 0.8 + 0.2;
        setWaveformData(prev => {
          const newData = [...prev, amplitude];
          // Keep only last 50 points for performance
          return newData.slice(-50);
        });
      }, 100);

      return () => clearInterval(interval);
    } else if (!state.isRecording && waveformData.length > 0) {
      setWaveformData([]);
    }
  }, [state.isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      Alert.alert(
        'Permesso richiesto',
        'Concedi il permesso al microfono per registrare messaggi vocali.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleSend = async () => {
    if (!state.recordingUri || state.recordingDuration === 0) {
      Alert.alert('Errore', 'Nessuna registrazione da inviare');
      return;
    }

    if (state.recordingDuration < 1) {
      Alert.alert('Troppo breve', 'La registrazione deve durare almeno 1 secondo');
      return;
    }

    setIsUploading(true);
    try {
      const fileInfo = await getRecordingFile();
      if (!fileInfo) {
        throw new Error('Failed to get recording file');
      }

      const result = await voiceMessageService.sendVoiceMessage(
        conversationId,
        fileInfo.uri,
        state.recordingDuration,
        fileInfo.size
      );

      onSend(result.message_id);
    } catch (error) {
      console.error('[VoiceMessageRecorder] Error sending voice message:', error);
      Alert.alert(
        'Invio fallito',
        error instanceof Error ? error.message : 'Impossibile inviare il messaggio vocale'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Elimina registrazione',
      'Sei sicuro di voler eliminare questa registrazione?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            await deleteRecording();
            onCancel();
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording in progress
  if (state.isRecording) {
    return (
      <View
        className={`p-4 rounded-xl ${
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        } border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Registrazione...
          </Text>
          <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {formatDuration(state.duration)} / {formatDuration(maxDuration)}
          </Text>
        </View>

        {/* Waveform visualization */}
        <View className="h-12 mb-4 flex-row items-center justify-center">
          {waveformData.map((amplitude, index) => (
            <View
              key={index}
              className={`mx-0.5 rounded-full ${
                isDark ? 'bg-red-500' : 'bg-red-400'
              }`}
              style={{
                width: 3,
                height: Math.max(4, amplitude * 40),
              }}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-center">
          <TouchableOpacity
            onPress={handleStopRecording}
            className="p-3 rounded-full bg-destructive/10"
          >
            <Square size={24} color={themeColors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Recording completed, preview mode
  if (state.recordingUri) {
    return (
      <View className="p-4 rounded-xl bg-muted border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-medium text-foreground">
            Anteprima messaggio vocale
          </Text>
          <Text className="text-sm text-muted-foreground">
            {formatDuration(state.recordingDuration)}
          </Text>
        </View>

        {/* Playback controls */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              onPress={state.isPlaying ? pauseRecording : playRecording}
              disabled={isUploading}
              className={`p-2 rounded-full bg-secondary ${isUploading ? 'opacity-50' : ''}`}
            >
              {state.isPlaying ? (
                <Pause size={20} color={themeColors.foreground} />
              ) : (
                <Play size={20} color={themeColors.foreground} />
              )}
            </TouchableOpacity>

            <Text className="text-sm text-muted-foreground">
              {state.isPlaying ? 'Riproduzione...' : 'Tocca per riprodurre'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDelete}
            disabled={isUploading}
            className={`p-2 ${isUploading ? 'opacity-50' : ''}`}
          >
            <Trash2 size={20} color={themeColors.destructive} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View className="h-1 rounded-full mb-4 bg-muted">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${(state.duration / state.recordingDuration) * 100}%` }}
          />
        </View>

        {/* Action buttons */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onCancel}
            disabled={isUploading}
            className={`px-4 py-2 rounded-lg flex-row items-center bg-secondary ${isUploading ? 'opacity-50' : ''}`}
          >
            <X size={16} color={themeColors.foreground} className="mr-2" />
            <Text className="text-foreground">
              Annulla
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSend}
            disabled={isUploading || state.recordingDuration < 1}
            className={`px-4 py-2 rounded-lg flex-row items-center bg-primary ${
              isUploading || state.recordingDuration < 1 ? 'opacity-50' : ''
            }`}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size="small" color={themeColors.primaryForeground} className="mr-2" />
                <Text className="text-primary-foreground">Invio...</Text>
              </>
            ) : (
              <>
                <Send size={16} color={themeColors.primaryForeground} className="mr-2" />
                <Text className="text-primary-foreground">Invia</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Initial state - start recording button
  return (
    <View className="p-4 rounded-xl bg-muted border border-border">
      <Text className="text-sm font-medium mb-3 text-foreground">
        Registra messaggio vocale
      </Text>
      <Text className="text-xs mb-4 text-muted-foreground">
        Tieni premuto per registrare, rilascia per inviare. Massimo {maxDuration} secondi.
      </Text>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={onCancel}
          className="px-4 py-2 rounded-lg flex-row items-center bg-secondary"
        >
          <X size={16} color={themeColors.foreground} className="mr-2" />
          <Text className="text-foreground">
            Annulla
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleStartRecording}
          className="px-4 py-2 rounded-lg flex-row items-center bg-primary"
        >
          <Mic size={16} color={themeColors.primaryForeground} className="mr-2" />
          <Text className="text-primary-foreground">Inizia registrazione</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}