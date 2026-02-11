/**
 * Glass Capability Detection Hook
 *
 * Detects platform capabilities for glass effects and determines the best
 * rendering strategy based on device support and accessibility settings.
 */

import { useState, useEffect } from 'react';
import { Platform, AccessibilityInfo } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import type { GlassCapability, UseGlassCapabilityReturn } from './types';

/**
 * Check if glass effect API is available
 * Uses expo-glass-effect's built-in detection for iOS liquid glass API
 */
function checkLiquidGlassAvailable(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/**
 * Extract iOS version number from Platform.Version
 * Platform.Version on iOS is a string like "15.0" or "16.2"
 */
function getIOSVersion(): number | undefined {
  if (Platform.OS !== 'ios') {
    return undefined;
  }

  const version = Platform.Version;
  if (typeof version === 'string') {
    const major = parseInt(version.split('.')[0], 10);
    return isNaN(major) ? undefined : major;
  }

  return undefined;
}

/**
 * Determine the glass capability level based on platform and settings
 */
function determineCapability(
  isReduceTransparencyEnabled: boolean,
  iosVersion: number | undefined,
  hasLiquidGlass: boolean
): GlassCapability {
  // If reduce transparency is enabled, always use fallback
  if (isReduceTransparencyEnabled) {
    return 'fallback';
  }

  // iOS 26+ with @callstack/liquid-glass available
  if (Platform.OS === 'ios' && iosVersion && iosVersion >= 26 && hasLiquidGlass) {
    return 'liquid-glass';
  }

  // iOS <26 with expo-glass-effect
  if (Platform.OS === 'ios' && iosVersion && iosVersion < 26) {
    return 'glass-effect';
  }

  // iOS 26+ without @callstack/liquid-glass falls back to glass-effect
  if (Platform.OS === 'ios') {
    return 'glass-effect';
  }

  // Android uses standard blur
  if (Platform.OS === 'android') {
    return 'blur';
  }

  // All other platforms use fallback
  return 'fallback';
}

/**
 * Hook to detect glass effect capabilities
 *
 * @returns Glass capability information and helper booleans
 *
 * @example
 * ```tsx
 * const { capability, hasLiquidGlass, isFallback } = useGlassCapability();
 *
 * if (hasLiquidGlass) {
 *   return <LiquidGlass />;
 * } else if (isFallback) {
 *   return <OpaqueBackground />;
 * }
 * ```
 */
export function useGlassCapability(): UseGlassCapabilityReturn {
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then(setIsReduceTransparencyEnabled)
      .catch(() => setIsReduceTransparencyEnabled(false));

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setIsReduceTransparencyEnabled
    );

    return () => subscription.remove();
  }, []);

  const hasLiquidGlass = checkLiquidGlassAvailable();
  const iosVersion = getIOSVersion();
  const capability = determineCapability(isReduceTransparencyEnabled, iosVersion, hasLiquidGlass);

  const platform =
    Platform.OS === 'ios' ? 'ios' :
    Platform.OS === 'android' ? 'android' :
    Platform.OS === 'web' ? 'web' :
    'unknown';

  return {
    capability,
    hasLiquidGlass: capability === 'liquid-glass',
    hasGlassEffect: capability === 'glass-effect',
    hasBlur: capability === 'blur',
    isFallback: capability === 'fallback',
    isReduceTransparencyEnabled,
    platform,
    iosVersion,
  };
}
