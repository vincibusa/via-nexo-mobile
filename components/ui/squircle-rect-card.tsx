/**
 * SquircleRectCard - Card rettangolare con forma squircle dal path supercircle_squircle.svg.
 * Stira il path quadrato al rettangolo via preserveAspectRatio="none".
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Defs, ClipPath, Path, G } from 'react-native-svg'
import { SQUIRCLE_PATH } from '../../lib/squircle-path'

interface SquircleRectCardProps {
  width: number
  height: number
  clipPathId: string
  children: React.ReactNode
}

export function SquircleRectCard({
  width,
  height,
  clipPathId,
  children,
}: SquircleRectCardProps) {
  return (
    <View style={[styles.container, { width, height }]} collapsable={false}>
      <Svg
        width={width}
        height={height}
        viewBox="0 0 220 220"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <ClipPath id={clipPathId}>
            {/* Scale Y e centra per squircle rettangolare (path quadrato 220x220) */}
            <Path
              d={SQUIRCLE_PATH}
              transform={`scale(1, ${height / width}) translate(0, ${(220 - 220 * (height / width)) / 2})`}
            />
          </ClipPath>
        </Defs>
        <G clipPath={`#${clipPathId}`}>
          {children}
        </G>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
})
