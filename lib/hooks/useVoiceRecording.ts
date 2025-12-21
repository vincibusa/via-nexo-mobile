/**
 * Hook for voice message recording using expo-av
 * Supports recording, playback preview, and audio processing
 */

import { useState, useRef, useCallback } from 'react';
import { Audio, Recording, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  recordingUri: string | null;
  recordingDuration: number; // in seconds
  recordingSize: number; // in bytes
  error: string | null;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // maximum recording duration in seconds (default: 120)
  audioQuality?: Audio.RecordingOptions['android']['extension'];
  sampleRate?: number;
  bitRate?: number;
}

/**
 * Hook for voice message recording functionality
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   startRecording,
 *   stopRecording,
 *   playRecording,
 *   pauseRecording,
 *   deleteRecording,
 *   getRecordingFile
 * } = useVoiceRecording();
 * ```
 */
export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const {
    maxDuration = 120, // 2 minutes max
    audioQuality = 'm4a',
    sampleRate = 44100,
    bitRate = 128000,
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPlaying: false,
    isPaused: false,
    duration: 0,
    recordingUri: null,
    recordingDuration: 0,
    recordingSize: 0,
    error: null,
  });

  const recordingRef = useRef<Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Request audio permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setState(prev => ({ ...prev, error: 'Audio recording permission denied' }));
        return false;
      }
      return true;
    } catch (error) {
      console.error('[VoiceRecording] Error requesting permissions:', error);
      setState(prev => ({ ...prev, error: 'Failed to request audio permissions' }));
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Request permissions if not already granted
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Stop any existing recording
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // Configure recording options
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: audioQuality,
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate,
          numberOfChannels: 1,
          bitRate,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate,
          numberOfChannels: 1,
          bitRate,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      recordingRef.current = recording;
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: elapsed }));

        // Auto-stop if max duration reached
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPlaying: false,
        isPaused: false,
        duration: 0,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('[VoiceRecording] Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
      return false;
    }
  }, [requestPermissions, maxDuration, audioQuality, sampleRate, bitRate]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) {
        return null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();

      // Get recording URI
      const uri = recordingRef.current.getURI();

      // Get file info
      let fileInfo = null;
      if (uri) {
        fileInfo = await FileSystem.getInfoAsync(uri);
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingDuration = state.duration;
      const recordingSize = fileInfo?.size || 0;

      setState(prev => ({
        ...prev,
        isRecording: false,
        recordingUri: uri,
        recordingDuration,
        recordingSize,
      }));

      recordingRef.current = null;
      return uri;
    } catch (error) {
      console.error('[VoiceRecording] Error stopping recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
        isRecording: false,
      }));
      return null;
    }
  }, [state.duration]);

  // Play recording preview
  const playRecording = useCallback(async (): Promise<boolean> => {
    try {
      if (!state.recordingUri) {
        setState(prev => ({ ...prev, error: 'No recording to play' }));
        return false;
      }

      // Stop any existing playback
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: state.recordingUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
          }
        }
      });

      setState(prev => ({ ...prev, isPlaying: true, isPaused: false, error: null }));
      return true;
    } catch (error) {
      console.error('[VoiceRecording] Error playing recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to play recording',
      }));
      return false;
    }
  }, [state.recordingUri]);

  // Pause playback
  const pauseRecording = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current && state.isPlaying) {
        await soundRef.current.pauseAsync();
        setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
      }
    } catch (error) {
      console.error('[VoiceRecording] Error pausing recording:', error);
    }
  }, [state.isPlaying]);

  // Resume playback
  const resumeRecording = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current && state.isPaused) {
        await soundRef.current.playAsync();
        setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      }
    } catch (error) {
      console.error('[VoiceRecording] Error resuming recording:', error);
    }
  }, [state.isPaused]);

  // Stop playback
  const stopPlayback = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    } catch (error) {
      console.error('[VoiceRecording] Error stopping playback:', error);
    }
  }, []);

  // Delete recording
  const deleteRecording = useCallback(async (): Promise<void> => {
    try {
      // Stop any playback
      await stopPlayback();

      // Delete file if exists
      if (state.recordingUri) {
        await FileSystem.deleteAsync(state.recordingUri, { idempotent: true });
      }

      // Clear interval if still running
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Reset state
      setState({
        isRecording: false,
        isPlaying: false,
        isPaused: false,
        duration: 0,
        recordingUri: null,
        recordingDuration: 0,
        recordingSize: 0,
        error: null,
      });

      recordingRef.current = null;
      soundRef.current = null;
    } catch (error) {
      console.error('[VoiceRecording] Error deleting recording:', error);
    }
  }, [state.recordingUri, stopPlayback]);

  // Get recording file info
  const getRecordingFile = useCallback(async (): Promise<{
    uri: string;
    duration: number;
    size: number;
    mimeType: string;
  } | null> => {
    if (!state.recordingUri) {
      return null;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(state.recordingUri);
      if (!fileInfo.exists) {
        return null;
      }

      return {
        uri: state.recordingUri,
        duration: state.recordingDuration,
        size: fileInfo.size,
        mimeType: 'audio/m4a',
      };
    } catch (error) {
      console.error('[VoiceRecording] Error getting file info:', error);
      return null;
    }
  }, [state.recordingUri, state.recordingDuration]);

  // Cleanup on unmount
  const cleanup = useCallback(async () => {
    try {
      // Stop recording if active
      if (recordingRef.current && state.isRecording) {
        await recordingRef.current.stopAndUnloadAsync();
      }

      // Stop playback if active
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Clear interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Delete temporary file
      if (state.recordingUri) {
        await FileSystem.deleteAsync(state.recordingUri, { idempotent: true });
      }
    } catch (error) {
      console.error('[VoiceRecording] Error during cleanup:', error);
    }
  }, [state.isRecording, state.recordingUri]);

  return {
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
  };
}