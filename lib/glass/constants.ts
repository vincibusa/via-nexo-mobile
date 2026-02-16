/**
 * Glass Effect Constants
 *
 * Blur intensities, tint colors, animation configurations, and accessibility
 * fallbacks for the liquid glass system.
 */

// Blur intensity levels (iOS blur radius values)
export const BLUR_INTENSITY = {
  light: 8,
  medium: 12,
  regular: 16,
  dark: 20,
  prominent: 30,    // iOS Control Center style
  ultraDark: 50,    // Maximum blur for backdrops
} as const;

// Tint colors as rgba values for each intensity level (dark mode palette)
export const TINT_COLORS = {
  light: {
    light: 'rgba(50, 52, 58, 0.3)',
    medium: 'rgba(40, 42, 48, 0.35)',
    regular: 'rgba(24, 26, 32, 0.4)',
    dark: 'rgba(10, 10, 12, 0.5)',
    prominent: 'rgba(10, 10, 12, 0.6)',
    ultraDark: 'rgba(8, 8, 10, 0.7)',
  },
  dark: {
    light: 'rgba(10, 10, 12, 0.5)',
    medium: 'rgba(10, 10, 12, 0.7)',
    regular: 'rgba(10, 10, 12, 0.9)',
    dark: 'rgba(8, 8, 10, 0.95)',
    prominent: 'rgba(8, 8, 10, 0.97)',
    ultraDark: 'rgba(6, 6, 8, 0.98)',
  },
  extraLight: {
    light: 'rgba(80, 82, 88, 0.12)',
    medium: 'rgba(70, 72, 78, 0.18)',
    regular: 'rgba(60, 62, 68, 0.22)',
    dark: 'rgba(50, 52, 58, 0.28)',
    prominent: 'rgba(40, 42, 48, 0.32)',
    ultraDark: 'rgba(30, 32, 38, 0.38)',
  },
  // iOS Control Center style - glassmorphism intenso
  prominent: {
    light: 'rgba(28, 28, 30, 0.78)',
    medium: 'rgba(28, 28, 30, 0.84)',
    regular: 'rgba(28, 28, 30, 0.88)',
    dark: 'rgba(28, 28, 30, 0.92)',
    prominent: 'rgba(28, 28, 30, 0.94)',
    ultraDark: 'rgba(28, 28, 30, 0.96)',
  },
} as const;

// Light mode palette for glass tinting
export const TINT_COLORS_LIGHT = {
  light: {
    light: 'rgba(246, 250, 255, 0.14)',
    medium: 'rgba(246, 250, 255, 0.2)',
    regular: 'rgba(246, 250, 255, 0.26)',
    dark: 'rgba(246, 250, 255, 0.32)',
    prominent: 'rgba(246, 250, 255, 0.38)',
    ultraDark: 'rgba(246, 250, 255, 0.44)',
  },
  dark: {
    light: 'rgba(20, 26, 36, 0.09)',
    medium: 'rgba(20, 26, 36, 0.13)',
    regular: 'rgba(20, 26, 36, 0.17)',
    dark: 'rgba(20, 26, 36, 0.22)',
    prominent: 'rgba(20, 26, 36, 0.27)',
    ultraDark: 'rgba(20, 26, 36, 0.32)',
  },
  extraLight: {
    light: 'rgba(255, 255, 255, 0.2)',
    medium: 'rgba(255, 255, 255, 0.26)',
    regular: 'rgba(255, 255, 255, 0.32)',
    dark: 'rgba(255, 255, 255, 0.38)',
    prominent: 'rgba(255, 255, 255, 0.44)',
    ultraDark: 'rgba(255, 255, 255, 0.5)',
  },
  prominent: {
    light: 'rgba(232, 237, 244, 0.28)',
    medium: 'rgba(232, 237, 244, 0.36)',
    regular: 'rgba(232, 237, 244, 0.44)',
    dark: 'rgba(232, 237, 244, 0.52)',
    prominent: 'rgba(232, 237, 244, 0.6)',
    ultraDark: 'rgba(232, 237, 244, 0.66)',
  },
} as const;

export const TINT_COLORS_BY_THEME = {
  dark: TINT_COLORS,
  light: TINT_COLORS_LIGHT,
} as const;

// iOS-style spring configuration for animations (matches existing pattern from _layout.tsx)
export const APPLE_SPRING_CONFIG = {
  mass: 1,
  damping: 16,
  stiffness: 250,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

// Animation timing configurations
export const ANIMATION_TIMING = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// Accessibility fallback opacity values (when reduce transparency is enabled)
export const ACCESSIBILITY_FALLBACK = {
  light: 0.95,
  medium: 0.97,
  regular: 0.98,
  dark: 1.0,
} as const;

// Fallback background colors for non-glass platforms
export const FALLBACK_COLORS = {
  light: 'rgba(24, 26, 32, 0.4)',
  medium: 'rgba(20, 22, 28, 0.5)',
  regular: 'rgba(16, 18, 24, 0.6)',
  dark: 'rgba(10, 10, 12, 0.8)',
} as const;

export const FALLBACK_COLORS_LIGHT = {
  light: 'rgba(255, 255, 255, 0.26)',
  medium: 'rgba(255, 255, 255, 0.32)',
  regular: 'rgba(255, 255, 255, 0.38)',
  dark: 'rgba(246, 248, 252, 0.46)',
} as const;

export const FALLBACK_COLORS_BY_THEME = {
  dark: FALLBACK_COLORS,
  light: FALLBACK_COLORS_LIGHT,
} as const;

// Border styling for fallback mode
export const FALLBACK_BORDER = {
  width: 1,
  color: 'rgba(255, 255, 255, 0.12)',
} as const;

export const FALLBACK_BORDER_LIGHT = {
  width: 1,
  color: 'rgba(15, 23, 42, 0.2)',
} as const;

export const FALLBACK_BORDER_BY_THEME = {
  dark: FALLBACK_BORDER,
  light: FALLBACK_BORDER_LIGHT,
} as const;

// Shadow configuration for fallback mode
export const FALLBACK_SHADOW = {
  color: '#000',
  offset: { width: 0, height: 8 },
  opacity: 0.25,
  radius: 16,
  elevation: 16,
} as const;

// iOS Control Center style backdrop (very dark, heavily blurred)
export const IOS_MODAL_BACKDROP = {
  blurIntensity: 90,           // Very strong blur
  blurTint: 'dark' as const,
  overlayColor: 'rgba(0, 0, 0, 0.75)',  // Dark semi-transparent overlay
} as const;

// iOS Control Center modal glass effect
export const IOS_MODAL_GLASS = {
  backgroundColor: 'rgba(28, 28, 30, 0.88)',  // iOS dark glass background
  borderColor: 'rgba(255, 255, 255, 0.18)',    // Subtle white border
  borderWidth: 1,
  borderRadius: 44,  // iOS-style rounded corners (not capsule)
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.44,
  shadowRadius: 24,
  elevation: 24,
} as const;
