/**
 * Squircle Avatar - ispirato a supercircle_squircle.svg.
 * Forma quadrata con angoli arrotondati come lo squircle (200×200 in viewBox 220×220).
 * borderRadius calibrato per approssimare la curvatura del path SVG.
 */

import React from 'react'
import { View, Image, StyleSheet } from 'react-native'

// Da supercircle_squircle.svg: path 10→210 su 220 canvas → curva ~22% del lato
const SQUIRCLE_RATIO = 0.22

function getSquircleRadius(width: number, height: number): number {
  return Math.round(Math.min(width, height) * SQUIRCLE_RATIO)
}

interface SquircleAvatarProps {
  size?: number
  width?: number
  height?: number
  source?: { uri: string } | number | object
  fallback?: React.ReactNode
  backgroundColor?: string
}

export function SquircleAvatar({
  size = 36,
  width: propWidth,
  height: propHeight,
  source,
  fallback,
  backgroundColor = '#2CA5E0',
}: SquircleAvatarProps) {
  const side =
    propWidth !== undefined && propHeight !== undefined
      ? Math.min(propWidth, propHeight)
      : (propWidth ?? propHeight ?? size)
  const radius = getSquircleRadius(side, side)
  const sizeStyle = { width: side, height: side, borderRadius: radius }

  return (
    <View style={[styles.container, sizeStyle]}>
      {source ? (
        <Image
          source={
            typeof source === 'number'
              ? source
              : typeof source === 'object' && source && 'uri' in source
                ? (source as { uri: string })
                : { uri: String(source) }
          }
          style={[styles.image, sizeStyle]}
          resizeMode="cover"
        />
      ) : fallback ? (
        <View style={[styles.fallback, sizeStyle, { backgroundColor }]}>
          {fallback}
        </View>
      ) : (
        <View style={[styles.fallback, sizeStyle, { backgroundColor }]} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    padding: 0,
  },
  image: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
