/**
 * RAVE ID Header - Profile redesign with ExpoGlassView
 * Card 1: Avatar + user info (nome, genere, età, bio)
 * Card 2: RaveScore con progress bar e stat pillole
 */

import React from 'react'
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native'
import { SquircleAvatar } from '../ui/squircle-avatar'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { Bell, Settings, MessageCircle } from 'lucide-react-native'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import { Progress } from '../ui/progress'
import { cn } from '../../lib/utils'
import { useColorScheme } from 'nativewind'
import { GlassView } from '../glass/glass-view'
import { GlassView as ExpoGlassView } from 'expo-glass-effect'
import { TINT_COLORS_BY_THEME } from '../../lib/glass/constants'
import type { User } from '../../lib/types/auth'
import type { RaveScore } from '../../lib/types/rave-score'
import {
  translatePresenceLabel,
  translateTrustLabel,
  translateCrewLabel,
} from '../../lib/i18n/rave-score-labels'

interface RaveIdHeaderProps {
  user: User | null
  raveScore: RaveScore | null
  variant?: 'own' | 'external'
  isFollowing?: boolean
  onSettingsPress?: () => void
  onNotificationsPress?: () => void
  onFollowPress?: () => void
  onMessagePress?: () => void
  unreadNotificationsCount?: number
}

function getLevel(score: number): { level: number; progress: number; nextLevel: number } {
  if (score < 25) return { level: 1, progress: (score / 25) * 100, nextLevel: 2 }
  if (score < 50) return { level: 2, progress: ((score - 25) / 25) * 100, nextLevel: 3 }
  if (score < 75) return { level: 3, progress: ((score - 50) / 25) * 100, nextLevel: 4 }
  return { level: 4, progress: ((score - 75) / 25) * 100, nextLevel: 5 }
}

function formatGender(gender?: string): string | null {
  if (!gender || !gender.trim()) return null
  const g = gender.toLowerCase()
  if (g === 'm' || g === 'male' || g === 'maschio') return 'Maschio'
  if (g === 'f' || g === 'female' || g === 'femmina') return 'Femmina'
  if (g === 'nb' || g === 'non-binary') return 'Non binary'
  return gender
}

export function RaveIdHeader({
  user,
  raveScore,
  variant = 'own',
  isFollowing = false,
  onSettingsPress,
  onNotificationsPress,
  onFollowPress,
  onMessagePress,
  unreadNotificationsCount = 0,
}: RaveIdHeaderProps) {
  const { settings } = useSettings()
  const { colorScheme } = useColorScheme()
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light')
  const themeColors = THEME[effectiveTheme]
  const isDark = effectiveTheme === 'dark'

  const glassTintColor = TINT_COLORS_BY_THEME[effectiveTheme].extraLight.regular
  const GlassCard = ({ children, style }: { children: React.ReactNode; style?: object }) =>
    Platform.OS === 'ios' ? (
      <ExpoGlassView
        glassEffectStyle="regular"
        tintColor={glassTintColor}
        isInteractive
        style={style}
      >
        {children}
      </ExpoGlassView>
    ) : (
      <GlassView intensity="regular" tint="extraLight" isInteractive style={style}>
        {children}
      </GlassView>
    )

  const getUserInitials = () => {
    if (!user?.displayName) return 'U'
    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserName = () => {
    if (user?.displayName) return user.displayName
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const totalScore = raveScore?.totalScore ?? 0
  const totalEvents = raveScore?.presence.checkIns90d ?? 0
  const trustRate = raveScore?.trust.rate ?? 0
  const levelInfo = getLevel(totalScore)
  const genderLabel = formatGender(user?.gender)
  const hasGenderOrAge = genderLabel || (user?.age != null && user.age > 0)

  return (
    <View className="px-4 pt-4 pb-4">
      {/* Notifiche e Impostazioni sopra le card (solo profilo proprio) */}
      {variant === 'own' && (onNotificationsPress || onSettingsPress) && (
        <View className="flex-row items-center justify-end gap-4 mb-3">
          {onNotificationsPress && (
            <TouchableOpacity onPress={onNotificationsPress} className="relative">
              <Bell size={24} color={themeColors.foreground} strokeWidth={1.5} />
              {unreadNotificationsCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-destructive rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {onSettingsPress && (
            <TouchableOpacity onPress={onSettingsPress}>
              <Settings size={24} color={themeColors.foreground} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Card 1 - Avatar + user info */}
      <GlassCard style={[styles.card, cardBorder(isDark)]}>
        <View className="flex-row items-start">
          <View className="items-center mr-4">
            <SquircleAvatar
              width={96}
              height={96}
              source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
              fallback={
                <Text className="text-xl font-bold text-muted-foreground">{getUserInitials()}</Text>
              }
              backgroundColor={themeColors.muted}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{getUserName()}</Text>
            {hasGenderOrAge && (
              <Text className="text-sm text-muted-foreground mt-1">
                {[genderLabel, user?.age ? `${user.age} anni` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
            {user?.bio ? (
              <Text
                className="text-sm text-muted-foreground mt-2"
                numberOfLines={4}
              >
                {user.bio}
              </Text>
            ) : null}
          </View>
        </View>
      </GlassCard>

      {/* Card 2 - RaveScore */}
      <GlassCard style={[styles.card, styles.card2, cardBorder(isDark)]}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Punteggio Rave
          </Text>
          <View
            className="px-2.5 py-1 rounded-md"
            style={{ backgroundColor: themeColors.primary + '24' }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: themeColors.primary }}
            >
              ★ Livello {levelInfo.level}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider">
              Prossimo livello
            </Text>
            <Text className="text-xs text-muted-foreground">
              {Math.round(levelInfo.progress)}% → Livello {levelInfo.nextLevel}
            </Text>
          </View>
          <Progress
            value={levelInfo.progress}
            max={100}
            className="h-2.5"
            barClassName="bg-primary"
          />
        </View>

        <View className="flex-row gap-3 mb-2">
          <View className="flex-1 rounded-xl py-3 items-center" style={pillBg(isDark)}>
            <Text className="text-xs text-muted-foreground uppercase tracking-wider">Eventi</Text>
            <Text className="text-xl font-bold text-foreground mt-0.5">{totalEvents}</Text>
          </View>
          <View className="flex-1 rounded-xl py-3 items-center" style={pillBg(isDark)}>
            <Text className="text-xs text-muted-foreground uppercase tracking-wider">
              Affidabilità
            </Text>
            <Text className="text-xl font-bold text-foreground mt-0.5">
              {Math.round(trustRate)}%
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-x-3 gap-y-1">
          {raveScore?.presence?.label && (
            <Text className="text-xs text-muted-foreground">
              Presenza: {translatePresenceLabel(raveScore.presence.label)}
            </Text>
          )}
          {raveScore?.trust?.label && (
            <Text className="text-xs text-muted-foreground">
              Fiducia: {translateTrustLabel(raveScore.trust.label)}
            </Text>
          )}
          {raveScore?.crew?.label && (
            <Text className="text-xs text-muted-foreground">
              Gruppo: {translateCrewLabel(raveScore.crew.label)}
            </Text>
          )}
        </View>
      </GlassCard>

      {/* Action Buttons - external profiles only */}
      {variant === 'external' && (
        <View className="flex-row gap-2 mt-4">
          <GlassCard style={[styles.actionButton, cardBorder(isDark)]}>
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onPress={onFollowPress}
              className="flex-1"
            >
              <Text
                className={cn(
                  'font-semibold',
                  isFollowing ? 'text-foreground' : 'text-primary-foreground'
                )}
              >
                {isFollowing ? 'Seguendo' : 'Segui'}
              </Text>
            </Button>
          </GlassCard>
          <GlassCard style={[styles.actionButton, cardBorder(isDark)]}>
            <Button variant="outline" className="flex-1" onPress={onMessagePress}>
              <MessageCircle size={16} color={themeColors.foreground} style={{ marginRight: 4 }} />
              <Text className="font-semibold">Messaggio</Text>
            </Button>
          </GlassCard>
        </View>
      )}
    </View>
  )
}

function cardBorder(isDark: boolean) {
  return {
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.2)',
  }
}

function pillBg(isDark: boolean) {
  return {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  card2: {
    marginBottom: 4,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
})
