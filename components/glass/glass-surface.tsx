/**
 * GlassSurface - Preset glass surface component
 *
 * Provides common surface patterns with predefined styles for sheets, bars,
 * and cards. Most commonly used for bottom tab bars.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GlassView } from './glass-view';
import type { GlassSurfaceProps } from '../../lib/glass/types';

/**
 * GlassSurface Component
 *
 * Wrapper around GlassView with preset styles for common UI patterns.
 * Perfect for bottom tab bars, modal sheets, and card surfaces.
 *
 * @example
 * ```tsx
 * // Bottom tab bar
 * <GlassSurface variant="bar" dimmed={isModalOpen}>
 *   <TabItems />
 * </GlassSurface>
 *
 * // Modal sheet
 * <GlassSurface variant="sheet" intensity="dark">
 *   <SheetContent />
 * </GlassSurface>
 * ```
 */
export function GlassSurface({
  variant = 'bar',
  dimmed = false,
  intensity,
  tint,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  // Set defaults based on variant
  // Modal uses iOS Control Center style (prominent glassmorphism)
  const defaultIntensity = intensity || (variant === 'modal' ? 'prominent' : 'light');
  const defaultTint = tint || (variant === 'modal' ? 'prominent' : 'extraLight');

  // Apply dimmed opacity if requested
  const surfaceStyle = [
    variantStyles[variant],
    dimmed && styles.dimmed,
    style,
  ];

  return (
    <GlassView
      intensity={defaultIntensity}
      tint={defaultTint}
      isInteractive={true}
      style={surfaceStyle}
      {...rest}
    >
      {children}
    </GlassView>
  );
}

/**
 * Preset styles for each surface variant
 */
const variantStyles = StyleSheet.create({
  /**
   * Bar variant - Perfect for bottom tab bars
   * Fixed height with horizontal padding
   * Capsule shape (borderRadius: 999) for iOS App Store-like appearance
   */
  bar: {
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
  },

  /**
   * Sheet variant - Perfect for bottom sheets and modals
   * Capsule shape matching the bottom bar style
   */
  sheet: {
    flex: 1,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },

  /**
   * Modal variant - iOS Control Center style
   * Intense glassmorphism with rounded corners on ALL sides
   * Prominent shadow and border
   */
  modal: {
    flex: 1,
    borderRadius: 44, // Tutti i bordi arrotondati (iOS style)
    borderWidth: 1.5, // Border più visibile
    borderColor: 'rgba(255, 255, 255, 0.22)', // Border più chiaro
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.44,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },

  /**
   * Card variant - Perfect for floating cards
   * Moderate padding with shadow
   */
  card: {
    borderRadius: 16,
    padding: 12,
  },
});

/**
 * Shared styles
 */
const styles = StyleSheet.create({
  /**
   * Dimmed state - Reduces opacity significantly when modals are open
   * to put full focus on the modal content
   */
  dimmed: {
    opacity: 0.25,
  },
});
