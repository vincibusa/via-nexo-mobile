/**
 * GlassView - Core glass effect abstraction component
 *
 * Automatically selects the best glass implementation based on platform
 * capabilities. Routes between liquid-glass, glass-effect, blur, or fallback.
 */

import React from 'react';
import { View, Platform } from 'react-native';
import { GlassView as ExpoGlassView } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { useGlassCapability } from '../../lib/glass/use-glass-capability';
import { BLUR_INTENSITY, TINT_COLORS, FALLBACK_COLORS, FALLBACK_BORDER, FALLBACK_SHADOW } from '../../lib/glass/constants';
import type { GlassViewProps, GlassIntensity, GlassTint } from '../../lib/glass/types';

/**
 * Map intensity levels to blur amounts for different implementations
 */
function getBlurAmount(intensity: GlassIntensity): number {
  return BLUR_INTENSITY[intensity];
}

/**
 * Get tint color for the glass effect
 */
function getTintColor(tint: GlassTint, intensity: GlassIntensity): string {
  return TINT_COLORS[tint][intensity];
}

/**
 * Get fallback background color
 */
function getFallbackColor(intensity: GlassIntensity): string {
  return FALLBACK_COLORS[intensity];
}

/**
 * Map our intensity to expo-glass-effect's glassEffectStyle
 * expo-glass-effect only supports 'clear' | 'regular'
 */
function mapToGlassEffectStyle(intensity: GlassIntensity): 'clear' | 'regular' {
  switch (intensity) {
    case 'light':
      return 'clear';
    case 'medium':
      return 'regular';
    case 'regular':
      return 'regular';
    case 'dark':
      return 'regular';
    default:
      return 'regular';
  }
}

/**
 * GlassView Component
 *
 * Core abstraction that automatically selects the best glass implementation
 * based on platform capabilities and user accessibility settings.
 *
 * @example
 * ```tsx
 * <GlassView intensity="regular" tint="dark" style={styles.container}>
 *   <Text>Content</Text>
 * </GlassView>
 * ```
 */
export function GlassView({
  intensity = 'regular',
  tint = 'dark',
  isInteractive = false,
  children,
  style,
  ...rest
}: GlassViewProps) {
  const { capability } = useGlassCapability();

  // Route to appropriate implementation based on capability
  switch (capability) {
    case 'liquid-glass': {
      // Future: Use @callstack/liquid-glass when iOS 26+ is available
      // For now, fall through to glass-effect
      // This is a placeholder for future implementation
      // return <LiquidGlassView ... />;

      // Fallback to glass-effect for now
      const glassEffectStyle = mapToGlassEffectStyle(intensity);
      const tintColor = getTintColor(tint, intensity);

      return (
        <ExpoGlassView
          style={style}
          glassEffectStyle={glassEffectStyle}
          tintColor={tintColor}
          isInteractive={isInteractive}
          {...rest}
        >
          {children}
        </ExpoGlassView>
      );
    }

    case 'glass-effect': {
      // Use expo-glass-effect (current iOS implementation)
      const glassEffectStyle = mapToGlassEffectStyle(intensity);
      const tintColor = getTintColor(tint, intensity);

      return (
        <ExpoGlassView
          style={style}
          glassEffectStyle={glassEffectStyle}
          tintColor={tintColor}
          isInteractive={isInteractive}
          {...rest}
        >
          {children}
        </ExpoGlassView>
      );
    }

    case 'blur': {
      // Use expo-blur for Android
      const blurAmount = getBlurAmount(intensity);
      const tintColor = getTintColor(tint, intensity);

      return (
        <BlurView
          intensity={blurAmount}
          tint={tint === 'light' ? 'light' : 'dark'}
          style={[
            style,
            {
              backgroundColor: tintColor,
            },
          ]}
          {...rest}
        >
          {children}
        </BlurView>
      );
    }

    case 'fallback':
    default: {
      // Fallback for non-supported platforms or accessibility mode
      const backgroundColor = getFallbackColor(intensity);

      return (
        <View
          style={[
            {
              backgroundColor,
              borderWidth: FALLBACK_BORDER.width,
              borderColor: FALLBACK_BORDER.color,
              ...Platform.select({
                ios: {
                  shadowColor: FALLBACK_SHADOW.color,
                  shadowOffset: FALLBACK_SHADOW.offset,
                  shadowOpacity: FALLBACK_SHADOW.opacity,
                  shadowRadius: FALLBACK_SHADOW.radius,
                },
                android: {
                  elevation: FALLBACK_SHADOW.elevation,
                },
              }),
            },
            style,
          ]}
          {...rest}
        >
          {children}
        </View>
      );
    }
  }
}
