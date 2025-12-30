/**
 * Voice Message Player Component - WhatsApp Style
 * Clean, modern UI for playing voice messages with waveform visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Play, Pause } from 'lucide-react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

interface VoiceMessagePlayerProps {
  mediaUrl: string;
  duration?: number; // in seconds
  isOwnMessage: boolean;
  isDark: boolean;
}

// Waveform component
function Waveform({
  isPlaying,
  progress,
  isOwnMessage,
  themeColors
}: {
  isPlaying: boolean;
  progress: number;
  isOwnMessage: boolean;
  themeColors: any;
}) {
  // Generate 30 bars with varying heights (simulating audio waveform)
  const bars = Array.from({ length: 30 }, (_, i) => {
    // Create a wave pattern
    const height = Math.sin(i * 0.5) * 6 + 8 + Math.random() * 4;
    return Math.max(4, Math.min(16, height));
  });

  const activeColor = isOwnMessage ? 'rgba(255, 255, 255, 0.9)' : themeColors.primary;
  const inactiveColor = isOwnMessage ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)';

  return (
    <View className="flex-row items-center gap-0.5 h-4 flex-1 mx-2">
      {bars.map((height, index) => {
        const barProgress = (index / bars.length) * 100;
        const isActive = barProgress <= progress;

        return (
          <View
            key={index}
            className="flex-1 rounded-full"
            style={{
              height,
              backgroundColor: isActive ? activeColor : inactiveColor,
              opacity: isPlaying && isActive ? 1 : 0.8,
            }}
          />
        );
      })}
    </View>
  );
}

export function VoiceMessagePlayer({
  mediaUrl,
  duration = 0,
  isOwnMessage,
  isDark,
}: VoiceMessagePlayerProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();

  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  const themeColors = THEME[effectiveTheme];

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState(0); // in milliseconds
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Download and cache audio file locally
  useEffect(() => {
    const downloadAndCacheAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Generate cache filename
        const filename = mediaUrl.split('/').pop() || `voice-${Date.now()}.m4a`;
        const localPath = `${FileSystem.cacheDirectory}voice-messages/${filename}`;

        // Check if already cached
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          setLocalUri(localPath);
          setIsLoading(false);
          return;
        }

        // Ensure directory exists
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.cacheDirectory}voice-messages`,
          { intermediates: true }
        );

        // Download file
        const downloadResult = await FileSystem.downloadAsync(mediaUrl, localPath);
        setLocalUri(downloadResult.uri);
        setIsLoading(false);
      } catch (err) {
        console.error('[VoiceMessagePlayer] Error downloading audio:', err);
        setError('Impossibile caricare l\'audio');
        setIsLoading(false);
      }
    };

    downloadAndCacheAudio();

    return () => {
      // Cleanup on unmount
      if (sound) {
        sound.unloadAsync();
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [mediaUrl]);

  // Load and play audio
  const loadAndPlayAudio = async () => {
    if (!localUri || isLoading) {
      return;
    }

    try {
      // Stop any existing playback
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: localUri },
        {
          shouldPlay: true,
          rate: playbackRate,
          shouldCorrectPitch: true,
          volume: 1.0,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsPaused(false);

      // Start position update interval
      startPositionUpdate();
    } catch (err) {
      console.error('[VoiceMessagePlayer] Error loading audio:', err);
      setError('Impossibile riprodurre l\'audio');
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setIsPaused(false);
        setPosition(0);
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
          positionIntervalRef.current = null;
        }
      }
    }
  };

  const startPositionUpdate = () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
    }

    positionIntervalRef.current = setInterval(() => {
      if (sound && isPlaying) {
        sound.getStatusAsync().then(status => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
          }
        });
      }
    }, 100); // Update more frequently for smoother waveform
  };

  const togglePlayPause = async () => {
    if (!sound) {
      await loadAndPlayAudio();
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      setIsPaused(true);
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
    } else if (isPaused) {
      await sound.playAsync();
      setIsPlaying(true);
      setIsPaused(false);
      startPositionUpdate();
    } else {
      await loadAndPlayAudio();
    }
  };

  const cyclePlaybackRate = async () => {
    const rates = [1.0, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];

    setPlaybackRate(newRate);

    if (sound) {
      await sound.setRateAsync(newRate, true);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0
    ? (position / (duration * 1000)) * 100
    : 0;

  // Calculate remaining time
  const remainingTime = duration > 0 ? (duration * 1000) - position : 0;

  // Icon colors
  const iconColor = isOwnMessage ? 'white' : themeColors.foreground;

  if (error) {
    return (
      <View className="flex-row items-center py-1">
        <View className={`h-10 w-10 rounded-full items-center justify-center ${
          isOwnMessage ? 'bg-white/20' : 'bg-muted'
        }`}>
          <Play size={20} color={iconColor} />
        </View>
        <Text className={`text-sm ml-3 ${isOwnMessage ? 'text-white/80' : 'text-muted-foreground'}`}>
          Errore caricamento audio
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-row items-center py-1">
        <View className={`h-10 w-10 rounded-full items-center justify-center ${
          isOwnMessage ? 'bg-white/20' : 'bg-muted'
        }`}>
          <ActivityIndicator size="small" color={iconColor} />
        </View>
        <Text className={`text-sm ml-3 ${isOwnMessage ? 'text-white/80' : 'text-muted-foreground'}`}>
          Caricamento...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center py-1 min-w-[240px]">
      {/* Play/Pause Button - WhatsApp Style */}
      <TouchableOpacity
        onPress={togglePlayPause}
        className={`h-10 w-10 rounded-full items-center justify-center ${
          isOwnMessage ? 'bg-white/20' : 'bg-primary/10'
        }`}
        activeOpacity={0.7}
      >
        {isPlaying ? (
          <Pause size={20} color={iconColor} fill={iconColor} />
        ) : (
          <Play size={20} color={iconColor} fill={iconColor} />
        )}
      </TouchableOpacity>

      {/* Waveform */}
      <Waveform
        isPlaying={isPlaying}
        progress={progressPercentage}
        isOwnMessage={isOwnMessage}
        themeColors={themeColors}
      />

      {/* Time Display */}
      <Text className={`text-xs font-mono ml-2 min-w-[38px] ${
        isOwnMessage ? 'text-white/90' : 'text-foreground'
      }`}>
        {isPlaying || isPaused ? formatTime(remainingTime) : formatTime(duration * 1000)}
      </Text>

      {/* Playback Speed - Only show when playing */}
      {(isPlaying || isPaused) && playbackRate !== 1.0 && (
        <TouchableOpacity
          onPress={cyclePlaybackRate}
          className={`ml-2 h-6 w-6 rounded-full items-center justify-center ${
            isOwnMessage ? 'bg-white/20' : 'bg-muted'
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-[10px] font-semibold ${
            isOwnMessage ? 'text-white' : 'text-foreground'
          }`}>
            {playbackRate.toFixed(1)}x
          </Text>
        </TouchableOpacity>
      )}

      {/* Speed button when not playing */}
      {!isPlaying && !isPaused && (
        <TouchableOpacity
          onPress={cyclePlaybackRate}
          className="ml-2 px-1"
          activeOpacity={0.7}
        >
          <Text className={`text-[10px] font-medium ${
            isOwnMessage ? 'text-white/60' : 'text-muted-foreground'
          }`}>
            {playbackRate.toFixed(1)}x
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
