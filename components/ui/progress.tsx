import React from 'react'
import { View } from 'react-native'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  animated?: boolean
}

export function Progress({
  value,
  max = 100,
  className = '',
  barClassName = 'bg-primary',
  animated = false,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <View className={`bg-muted rounded-full overflow-hidden h-2 ${className}`}>
      <View
        className={`h-full ${barClassName} ${animated ? '' : ''}`}
        style={{
          width: `${percentage}%`,
        }}
      />
    </View>
  )
}
