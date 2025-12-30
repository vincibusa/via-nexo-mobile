import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { Text } from '../ui/text';
import { Mic, Trash2 } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';

const CANCEL_THRESHOLD = -100;
const MAX_DURATION = 120; // 2 minutes

interface WhatsAppVoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onRecordingCancel: () => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  disabled?: boolean;
}

// Waveform bars component
function WaveformBars({ isActive }: { isActive: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <View className="flex-row items-center gap-0.5 h-8">
      {bars.map((_, index) => {
        const height = isActive
          ? Math.random() * 24 + 8
          : 4;
        return (
          <View
            key={index}
            className="w-1 rounded-full bg-primary"
            style={{ height: Math.max(4, height) }}
          />
        );
      })}
    </View>
  );
}

export function WhatsAppVoiceRecorder({
  onRecordingComplete,
  onRecordingCancel,
  onRecordingStateChange,
  disabled = false,
}: WhatsAppVoiceRecorderProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [waveformKey, setWaveformKey] = useState(0);

  // Use refs for JS-side state tracking
  const durationRef = useRef(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use shared value for state accessed in worklets (UI thread)
  const isRecordingShared = useSharedValue(false);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keep shared value in sync with state (for worklet access)
  useEffect(() => {
    isRecordingShared.value = isRecording;
  }, [isRecording, isRecordingShared]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  const startRecording = useCallback(async () => {
    if (isRecordingShared.value) return true; // Already recording

    try {
      // Cleanup any existing recording first
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
        recordingRef.current = null;
      }

      // Request permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      isRecordingShared.value = true;
      setIsRecording(true);
      setDuration(0);
      durationRef.current = 0;

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          durationRef.current = newDuration;
          if (newDuration >= MAX_DURATION) {
            stopRecording(false);
          }
          return newDuration;
        });
      }, 1000);

      // Start waveform animation
      waveformInterval.current = setInterval(() => {
        setWaveformKey(prev => prev + 1);
      }, 150);

      // Start pulse animation for recording indicator
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [isRecordingShared, pulseScale]);

  const stopRecording = useCallback(async (cancelled: boolean) => {
    if (!isRecordingShared.value && !recordingRef.current) return;

    try {
      // Clear intervals
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      if (waveformInterval.current) {
        clearInterval(waveformInterval.current);
        waveformInterval.current = null;
      }

      // Stop pulse animation
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 100 });

      if (!recordingRef.current) {
        isRecordingShared.value = false;
        setIsRecording(false);
        return;
      }

      const recording = recordingRef.current;
      recordingRef.current = null;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const currentDuration = durationRef.current;

      isRecordingShared.value = false;
      setIsRecording(false);

      if (cancelled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onRecordingCancel();
      } else {
        const uri = recording.getURI();
        if (uri && currentDuration > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onRecordingComplete(uri, currentDuration);
        }
      }

      // Reset
      setDuration(0);
      durationRef.current = 0;
      setIsCancelling(false);
      translateX.value = withSpring(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      isRecordingShared.value = false;
      setIsRecording(false);
      setDuration(0);
      durationRef.current = 0;
    }
  }, [onRecordingComplete, onRecordingCancel, pulseScale, translateX, isRecordingShared]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (waveformInterval.current) {
        clearInterval(waveformInterval.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  // Gesture handlers use refs to avoid stale closures
  const handleLongPressStart = useCallback(async () => {
    if (disabled) return;
    await startRecording();
    scale.value = withSpring(1.2);
  }, [disabled, startRecording, scale]);

  const handleLongPressEnd = useCallback(() => {
    if (!isRecordingShared.value) return;

    if (translateX.value < CANCEL_THRESHOLD) {
      stopRecording(true);
    } else {
      stopRecording(false);
    }
    scale.value = withSpring(1);
  }, [stopRecording, translateX, scale, isRecordingShared]);

  const handlePanUpdate = useCallback((translationX: number) => {
    const clampedX = Math.min(0, translationX);
    translateX.value = clampedX;

    if (clampedX < CANCEL_THRESHOLD && !isCancelling) {
      setIsCancelling(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (clampedX >= CANCEL_THRESHOLD && isCancelling) {
      setIsCancelling(false);
    }
  }, [isCancelling, translateX]);

  const handlePanEnd = useCallback(() => {
    if (translateX.value < CANCEL_THRESHOLD) {
      stopRecording(true);
    }
    translateX.value = withSpring(0);
  }, [stopRecording, translateX]);

  // Create gesture - must be stable (no dependencies that change during recording)
  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(handleLongPressStart)();
    })
    .onEnd(() => {
      runOnJS(handleLongPressEnd)();
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((event, stateManager) => {
      'worklet';
      // Only activate pan if we're recording (using shared value for UI thread access)
      if (isRecordingShared.value) {
        stateManager.activate();
      }
    })
    .onUpdate((event) => {
      runOnJS(handlePanUpdate)(event.translationX);
    })
    .onEnd(() => {
      runOnJS(handlePanEnd)();
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const cancelIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, CANCEL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, CANCEL_THRESHOLD],
          [0.5, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const barSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Single stable GestureDetector that wraps everything
  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View className={isRecording ? "flex-1" : ""}>
        {isRecording ? (
          // Recording bar UI
          <Animated.View
            style={barSlideStyle}
            className="flex-row items-center bg-muted rounded-full px-3 py-2"
          >
            {/* Cancel indicator (left side) */}
            <Animated.View
              style={cancelIndicatorStyle}
              className="flex-row items-center mr-3"
            >
              <Trash2 size={20} color={themeColors.destructive} />
            </Animated.View>

            {/* Recording indicator (pulsing red dot) */}
            <View className="flex-row items-center gap-2 mr-3">
              <Animated.View
                style={pulseStyle}
                className="w-3 h-3 rounded-full bg-red-500"
              />
              <Text className="text-foreground font-mono text-sm font-medium">
                {formatDuration(duration)}
              </Text>
            </View>

            {/* Waveform */}
            <View className="flex-1 mx-2">
              <WaveformBars key={waveformKey} isActive={isRecording} />
            </View>

            {/* Slide hint */}
            {!isCancelling && (
              <Text className="text-muted-foreground text-xs mr-2">
                ← Scorri
              </Text>
            )}

            {/* Mic button */}
            <Animated.View style={buttonStyle}>
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  isCancelling ? 'bg-destructive' : 'bg-primary'
                }`}
              >
                {isCancelling ? (
                  <Trash2 size={18} color="white" />
                ) : (
                  <Mic size={18} color={themeColors.primaryForeground} />
                )}
              </View>
            </Animated.View>
          </Animated.View>
        ) : (
          // Default mic button
          <Animated.View style={buttonStyle}>
            <View
              className={`h-12 w-12 items-center justify-center rounded-full ${
                disabled ? 'bg-muted' : 'bg-primary'
              }`}
            >
              <Mic
                size={20}
                color={disabled ? themeColors.mutedForeground : themeColors.primaryForeground}
              />
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
