/**
 * Glass Effect Type Definitions
 *
 * TypeScript interfaces and types for the liquid glass system.
 */

import type { ViewProps, ViewStyle } from 'react-native';

// Platform capability detection
export type GlassCapability =
  | 'liquid-glass'  // iOS 26+ with @callstack/liquid-glass
  | 'glass-effect'  // iOS <26 with expo-glass-effect
  | 'blur'          // Android with standard blur
  | 'fallback';     // No glass support or accessibility mode

// Glass intensity levels
export type GlassIntensity = 'light' | 'medium' | 'regular' | 'dark' | 'prominent' | 'ultraDark';

// Glass tint styles
export type GlassTint = 'light' | 'dark' | 'extraLight' | 'prominent';

// Base GlassView component props
export interface GlassViewProps extends ViewProps {
  /** Glass effect intensity */
  intensity?: GlassIntensity;

  /** Tint style for the glass effect */
  tint?: GlassTint;

  /** Whether the glass view should respond to touches */
  isInteractive?: boolean;

  /** Child components */
  children?: React.ReactNode;

  /** Additional styles */
  style?: ViewStyle;
}

// GlassSurface component props (for sheets, bars, cards)
export interface GlassSurfaceProps extends GlassViewProps {
  /** Surface variant type */
  variant?: 'sheet' | 'bar' | 'card' | 'modal';

  /** Whether the surface should appear dimmed */
  dimmed?: boolean;
}

// GlassButton component props
export interface GlassButtonProps extends Omit<GlassViewProps, 'isInteractive'> {
  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Press handler */
  onPress?: () => void;

  /** Whether the button is disabled */
  disabled?: boolean;

  /** Button label (for accessibility) */
  label?: string;
}

// Hook return type for useGlassCapability
export interface UseGlassCapabilityReturn {
  /** Detected capability level */
  capability: GlassCapability;

  /** Whether @callstack/liquid-glass is available and supported */
  hasLiquidGlass: boolean;

  /** Whether expo-glass-effect is available */
  hasGlassEffect: boolean;

  /** Whether standard blur is supported */
  hasBlur: boolean;

  /** Whether fallback mode is required */
  isFallback: boolean;

  /** Whether reduce transparency is enabled (accessibility) */
  isReduceTransparencyEnabled: boolean;

  /** Platform OS */
  platform: 'ios' | 'android' | 'web' | 'unknown';

  /** iOS version (if applicable) */
  iosVersion?: number;
}
