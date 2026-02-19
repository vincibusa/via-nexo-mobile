import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Text } from '../ui/text'
import { Progress } from '../ui/progress'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import type { RaveScore } from '../../lib/types/rave-score'
import {
  translatePresenceLabel,
  translateTrustLabel,
  translateCrewLabel,
} from '../../lib/i18n/rave-score-labels'

interface RaveScoreCardsProps {
  score: RaveScore | null
  isDark?: boolean
  onPresencePress?: () => void
  onTrustPress?: () => void
  onCrewPress?: () => void
}

export function RaveScoreCards({
  score,
  isDark = true,
  onPresencePress,
  onTrustPress,
  onCrewPress,
}: RaveScoreCardsProps) {
  const { settings } = useSettings()
  const effectiveTheme = settings?.theme === 'system' ? 'dark' : settings?.theme || 'dark'
  const themeColors = THEME[effectiveTheme]

  if (!score) {
    return (
      <View className="px-4 py-4">
        <Text className="text-sm text-muted-foreground text-center">Caricamento punteggi...</Text>
      </View>
    )
  }

  return (
    <View className="px-4 mb-6 flex-row gap-3">
      {/* Presenza */}
      <TouchableOpacity
        onPress={onPresencePress}
        activeOpacity={0.7}
        style={{
          flex: 1,
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }}
        className="rounded-3xl border p-4 justify-between"
      >
        <View>
          <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Presenza
          </Text>

          <Progress
            value={score.presence.score}
            max={score.presence.maxScore}
            className="mb-3"
            barClassName="bg-blue-500"
          />

          <Text className="text-lg font-bold text-foreground mb-1">
            {Math.round(score.presence.score)}/{score.presence.maxScore}
          </Text>

          <Text className="text-xs text-muted-foreground">{score.presence.checkIns90d} check-in</Text>

          <Text className="text-xs font-semibold text-blue-400 mt-2">
            {translatePresenceLabel(score.presence.label)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Fiducia */}
      <TouchableOpacity
        onPress={onTrustPress}
        activeOpacity={0.7}
        style={{
          flex: 1,
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }}
        className="rounded-3xl border p-4 justify-between"
      >
        <View>
          <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Fiducia
          </Text>

          <Text className="text-2xl font-bold text-foreground mb-1">
            {score.trust.rate !== null ? Math.round(score.trust.rate) : '-'}%
          </Text>

          <Text className="text-xs text-muted-foreground mb-3">
            {score.trust.breakdown.shows} presenze
          </Text>

          <Text
            className="text-xs font-semibold"
            style={{
              color:
                score.trust.label === 'Reliable'
                  ? '#4ade80'
                  : score.trust.label === 'Risk'
                    ? '#facc15'
                    : '#ef4444',
            }}
          >
            {translateTrustLabel(score.trust.label)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Gruppo */}
      <TouchableOpacity
        onPress={onCrewPress}
        activeOpacity={0.7}
        style={{
          flex: 1,
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }}
        className="rounded-3xl border p-4 justify-between"
      >
        <View>
          <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Gruppo
          </Text>

          <Text className="text-xl font-bold text-foreground mb-1">
            {translateCrewLabel(score.crew.label)}
          </Text>

          <Text className="text-xs text-muted-foreground mb-3">
            {score.crew.hostedShows} persone
          </Text>

          <Text className="text-xs font-semibold text-purple-400">
            {score.crew.showRate !== null ? Math.round(score.crew.showRate) : '-'}%
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}
