import React from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { Text } from '../ui/text'
import { Progress } from '../ui/progress'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import type { RaveScore } from '../../lib/types/rave-score'

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 mb-6"
      contentContainerStyle={{ gap: 12 }}
    >
      {/* Presence Card */}
      <TouchableOpacity
        onPress={onPresencePress}
        activeOpacity={0.7}
        style={{
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }}
        className="rounded-3xl border p-5 w-32 justify-between"
      >
        <View>
          <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Presence
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

          <Text className="text-xs font-semibold text-blue-400 mt-2">{score.presence.label}</Text>
        </View>
      </TouchableOpacity>

      {/* Trust Card */}
      <TouchableOpacity
        onPress={onTrustPress}
        activeOpacity={0.7}
        style={{
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }}
        className="rounded-3xl border p-5 w-32 justify-between"
      >
        <View>
          <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Trust
          </Text>

          <Text className="text-2xl font-bold text-foreground mb-1">
            {score.trust.rate !== null ? Math.round(score.trust.rate) : '-'}%
          </Text>

          <Text className="text-xs text-muted-foreground mb-3">
            {score.trust.breakdown.shows} show
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
            {score.trust.label}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Crew Card */}
      <TouchableOpacity
        onPress={onCrewPress}
        activeOpacity={0.7}
        style={{
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        }}
        className="rounded-3xl border p-5 w-32 justify-between"
      >
        <View>
          <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
            Crew
          </Text>

          <Text className="text-xl font-bold text-foreground mb-1">{score.crew.label}</Text>

          <Text className="text-xs text-muted-foreground mb-3">
            {score.crew.hostedShows} persone
          </Text>

          <Text className="text-xs font-semibold text-purple-400">
            {score.crew.showRate !== null ? Math.round(score.crew.showRate) : '-'}%
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  )
}
