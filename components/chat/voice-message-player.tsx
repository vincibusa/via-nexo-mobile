/**
 * Voice Message Player Component
 * UI for playing voice messages with seek bar and speed control
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import { Play, Pause, RotateCcw, FastForward, Gauge } from 'lucide-react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface VoiceMessagePlayerProps {
  mediaUrl: string;
  duration?: number; // in seconds
  isOwnMessage: boolean;
  isDark: boolean;
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

  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        setError('Failed to load audio');
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
      setError('Failed to play audio');
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
    }, 250);
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

  const seekForward = async () => {
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.min(
        status.positionMillis + 10000, // 10 seconds forward
        status.durationMillis || 0
      );
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    }
  };

  const seekBackward = async () => {
    if (!sound) return;

    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.max(status.positionMillis - 5000, 0); // 5 seconds back
      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
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

  // Message bubble colors
  const bubbleBg = isOwnMessage
    ? isDark ? 'bg-blue-600' : 'bg-blue-500'
    : isDark ? 'bg-slate-700' : 'bg-slate-200';

  const textColor = isOwnMessage ? 'text-primary-foreground' : 'text-foreground';
  const iconColor = isOwnMessage ? themeColors.primaryForeground : themeColors.foreground;
  const progressBg = isOwnMessage
    ? isDark ? 'bg-blue-400' : 'bg-blue-300'
    : isDark ? 'bg-slate-500' : 'bg-slate-400';

  if (error) {
    return (
      <View className={`px-3 py-2 rounded-lg ${bubbleBg}`}>
        <Text className={`text-sm ${textColor}`}>
          Failed to load voice message
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className={`px-3 py-2 rounded-lg ${bubbleBg} flex-row items-center`}>
        <ActivityIndicator size="small" color={iconColor} />
        <Text className={`text-sm ml-2 ${textColor}`}>
          Loading voice message...
        </Text>
      </View>
    );
  }

  return (
    <View className={`px-3 py-2 rounded-lg ${bubbleBg}`}>
      {/* Playback controls */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={togglePlayPause}
            className="p-1"
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause size={20} color={iconColor} />
            ) : (
              <Play size={20} color={iconColor} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={seekBackward}
            className="p-1"
            disabled={isLoading || !sound}
          >
            <RotateCcw size={16} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={seekForward}
            className="p-1"
            disabled={isLoading || !sound}
          >
            <FastForward size={16} color={iconColor} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cyclePlaybackRate}
            className="p-1"
            disabled={isLoading || !sound}
          >
            <View className="flex-row items-center">
              <Gauge size={14} color={iconColor} />
              <Text className={`text-xs ml-1 ${textColor}`}>
                {playbackRate.toFixed(1)}x
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text className={`text-xs ${textColor}`}>
          {formatTime(position)} / {duration > 0 ? formatTime(duration * 1000) : '--:--'}
        </Text>
      </View>

      {/* Progress bar */}
      <View className={`h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}>
        <View
          className={`h-full rounded-full ${progressBg}`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </View>

      {/* Duration info */}
      {duration > 0 && (
        <Text className={`text-xs mt-1 ${textColor} opacity-75`}>
          {duration >= 60
            ? `${Math.floor(duration / 60)} min ${Math.floor(duration % 60)} sec`
            : `${Math.floor(duration)} seconds`}
        </Text>
      )}
    </View>
  );
}