/**
 * RAVE ID Header - Redesigned following the mockup
 * Compact profile card with avatar, stats, and level progress
 * Supports both own profile and external profile views
 */

import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { Bell, Settings, MessageCircle } from 'lucide-react-native'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import { Progress } from '../ui/progress'
import { cn } from '../../lib/utils'
import { useColorScheme } from 'nativewind'
import { GlassSurface } from '../glass'
import type { User } from '../../lib/types/auth'
import type { RaveScore } from '../../lib/types/rave-score'

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

// Calculate level from total score
function getLevel(score: number): { level: number; progress: number; nextLevel: number } {
  if (score < 25) return { level: 1, progress: (score / 25) * 100, nextLevel: 2 }
  if (score < 50) return { level: 2, progress: ((score - 25) / 25) * 100, nextLevel: 3 }
  if (score < 75) return { level: 3, progress: ((score - 50) / 25) * 100, nextLevel: 4 }
  return { level: 4, progress: ((score - 75) / 25) * 100, nextLevel: 5 }
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

  return (
    <View className="px-4 pt-4 pb-4">
      {/* Username Bar */}
      <View className="flex-row items-center justify-between mb-4 px-2">
        {/* Username */}
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-foreground">{getUserName()}</Text>
        </View>

        {/* Icons - Only for own profile */}
        {variant === 'own' && (
          <View className="flex-row items-center gap-4">
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
      </View>

      {/* Profile Card */}
      <GlassSurface
        variant="card"
        intensity={isDark ? 'regular' : 'light'}
        tint={isDark ? 'dark' : 'light'}
        style={{
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.2)',
        }}
      >
        <View className="flex-row items-center">
          {/* Avatar Section - 4:3 aspect ratio */}
          <View className="items-center mr-4">
            {/* Gold bordered avatar */}
            <View
              className="rounded-lg p-1"
              style={{
                borderWidth: 1,
                borderColor: '#FFFFFF', // Gold color
                backgroundColor: 'transparent',
                width: 72,
                height: 96, // 4:3 aspect ratio (96 * 3/4 = 72)
              }}
            >
              <View className="w-full h-full rounded-md overflow-hidden">
                {user?.avatarUrl ? (
                  <Avatar alt={getUserName()} className="w-full h-full rounded-none">
                    <AvatarImage
                      source={{ uri: user.avatarUrl }}
                      className="w-full h-full"
                      style={{ resizeMode: 'cover' }}
                    />
                    <AvatarFallback className="bg-muted rounded-none">
                      <Text className="text-xl font-bold text-muted-foreground">{getUserInitials()}</Text>
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <View className="w-full h-full bg-muted items-center justify-center">
                    <Text className="text-xl font-bold text-muted-foreground">{getUserInitials()}</Text>
                  </View>
                )}
              </View>
            </View>
            {/* Level Label */}
            <Text className="text-xs font-bold text-foreground mt-1 uppercase tracking-wider">
              LEVEL {levelInfo.level}
            </Text>
          </View>

          {/* Stats Section */}
          <View className="flex-1">
            {/* Name */}


            {/* Stats Row */}
            <View className="flex-row justify-between mt-2">
              <View className="flex items-center">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider">TOTALE EVENTI</Text>
                <Text className="text-2xl font-bold text-foreground ">{totalEvents}</Text>
              </View>
              <View className="flex ">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider">AFFIDABILITÀ</Text>
                <Text className="text-2xl font-bold text-foreground">{Math.round(trustRate)}%</Text>
              </View>
            </View>

            {/* Level Progress */}
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider">NEXT LEVEL</Text>
                <Text className="text-xs text-muted-foreground">
                  {Math.round(levelInfo.progress)}% + LEVEL {levelInfo.nextLevel}
                </Text>
              </View>
              <Progress
                value={levelInfo.progress}
                max={100}
                className="h-2.5"
                barClassName="bg-primary"
              />
            </View>
          </View>
        </View>
      </GlassSurface>

      {/* Action Buttons - Only for external profiles */}
      {variant === 'external' && (
        <View className="flex-row gap-2 px-4 mt-4">
          <GlassSurface
            variant="card"
            intensity={isDark ? 'light' : 'light'}
            tint={isDark ? 'extraLight' : 'light'}
            style={{ borderRadius: 12, flex: 1, padding: 0 }}
          >
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onPress={onFollowPress}
              className="flex-1"
            >
              <Text className={cn(
                'font-semibold',
                isFollowing ? 'text-foreground' : 'text-primary-foreground'
              )}>
                {isFollowing ? 'Seguendo' : 'Segui'}
              </Text>
            </Button>
          </GlassSurface>

          <GlassSurface
            variant="card"
            intensity={isDark ? 'light' : 'light'}
            tint={isDark ? 'extraLight' : 'light'}
            style={{ borderRadius: 12, flex: 1, padding: 0 }}
          >
            <Button
              variant="outline"
              className="flex-1"
              onPress={onMessagePress}
            >
              <MessageCircle size={16} color={themeColors.foreground} style={{ marginRight: 4 }} />
              <Text className="font-semibold">Messaggio</Text>
            </Button>
          </GlassSurface>
        </View>
      )}
    </View>
  )
}
