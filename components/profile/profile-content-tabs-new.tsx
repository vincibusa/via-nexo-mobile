/**
 * Profile Content Tabs - Following the mockup
 * Pill-style tabs with 2-column grid content
 * Fetches real data from reservations and stories APIs
 */

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import {
  View,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  Animated,
  InteractionManager,
  Platform,
  StyleSheet,
} from 'react-native'
import { Text } from '../ui/text'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import { useFocusEffect, useRouter } from 'expo-router'
import { reservationsService, Reservation } from '../../lib/services/reservations'
import { managerService } from '../../lib/services/manager'
import { API_CONFIG } from '../../lib/config'
import { useAuth } from '../../lib/contexts/auth'
import { Calendar, Clock, MapPin, Ticket, Image as ImageIcon, Bell } from 'lucide-react-native'
import { isEventPast } from '../../lib/utils/date'
import { ProfileRequestsTab } from './profile-requests-tab'
import { useColorScheme } from 'nativewind'
import { GlassSurface } from '../glass'
import { GlassView } from '../glass/glass-view'
import { GlassView as ExpoGlassView } from 'expo-glass-effect'
import { TINT_COLORS_BY_THEME } from '../../lib/glass/constants'
import type { ManagerEvent } from '../../lib/types/manager'

interface Story {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url?: string
  text_overlay?: string
  created_at: string
}

interface GridItem {
  id: string
  image?: string
  title?: string
  subtitle?: string
  type: 'reservation' | 'story' | 'event'
  dateInfo?: {
    day: number
    month: string
    time: string
  }
  event?: {
    start_datetime: string
    place?: {
      name: string
    }
  }
  isPast?: boolean
}

interface ProfileContentTabsNewProps {
  userId?: string // If provided, show external user's profile; otherwise show current user's
}


export function ProfileContentTabsNew({ userId }: ProfileContentTabsNewProps = {}) {
  // Determine initial tab based on user role (will be updated after user is loaded)
  const [activeTab, setActiveTab] = useState<'reservations' | 'stories' | 'requests' | 'events'>('reservations')
  const { width } = useWindowDimensions()
  const { settings } = useSettings()
  const { colorScheme } = useColorScheme()
  const { user, session } = useAuth()
  const router = useRouter()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [managerEvents, setManagerEvents] = useState<ManagerEvent[]>([])
  const [isLoadingReservations, setIsLoadingReservations] = useState(true)
  const [isLoadingStories, setIsLoadingStories] = useState(true)
  const [isLoadingManagerEvents, setIsLoadingManagerEvents] = useState(true)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)


  // Check if viewing external profile
  const isExternalProfile = !!userId
  const isManager = user?.role === 'manager' && !isExternalProfile

  // Load pending requests count (only for current user, not external profiles)
  const loadPendingRequestsCount = useCallback(async () => {
    if (isExternalProfile || !user) return

    try {
      const { data, error } = await reservationsService.getMyPendingRequests()
      if (!error && data) {
        setPendingRequestsCount(data.length)
      } else {
        setPendingRequestsCount(0)
      }
    } catch (error) {
      console.error('Error loading pending requests count:', error)
      setPendingRequestsCount(0)
    }
  }, [isExternalProfile, user])

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

  // Calculate grid dimensions (2 columns) - rectangular squircle-style cards
  const horizontalPadding = 16
  const gap = 12
  const itemWidth = (width - horizontalPadding * 2 - gap) / 2
  const itemHeight = itemWidth * (16 / 9) // 9:16 portrait

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    setIsLoadingReservations(true)
    try {
      // If userId provided, fetch that user's reservations; otherwise fetch current user's
      // includePast defaults to true to show all events (past and future)
      const { data, error } = userId
        ? await reservationsService.getUserReservations(userId, 0, 50, true)
        : await reservationsService.getMyReservations(0, 50, true)

      if (!error && data) {
        setReservations(data)
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoadingReservations(false)
    }
  }, [userId])

  // Fetch manager events
  const fetchManagerEvents = useCallback(async () => {
    if (!isManager) return
    setIsLoadingManagerEvents(true)
    try {
      const { data, error } = await managerService.getMyEvents(1, 50, 'upcoming')
      if (!error && data?.events) {
        setManagerEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching manager events:', error)
    } finally {
      setIsLoadingManagerEvents(false)
    }
  }, [isManager])

  // Fetch stories (including expired ones for archive)
  const fetchStories = useCallback(async () => {
    if (!session?.accessToken) return

    // Use external userId if provided, otherwise use current user
    const targetUserId = userId || user?.id
    if (!targetUserId) return

    setIsLoadingStories(true)
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/social/stories?user_id=${targetUserId}&include_expired=true`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setStories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setIsLoadingStories(false)
    }
  }, [userId, user?.id, session?.accessToken])

  // Set default tab to 'events' for managers
  useEffect(() => {
    if (isManager && activeTab === 'reservations') {
      setActiveTab('events')
    }
  }, [isManager])

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchReservations()
      fetchStories()
      fetchManagerEvents()
      loadPendingRequestsCount()
    }, [fetchReservations, fetchStories, fetchManagerEvents, loadPendingRequestsCount])
  )

  // Format date helper
  const formatDate = (datetime: string) => {
    const date = new Date(datetime)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('it-IT', { month: 'short' }),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  // Transform reservations to GridItem format
  const reservationItems: GridItem[] = reservations.map((r) => {
    const dateInfo = r.event?.start_datetime ? formatDate(r.event.start_datetime) : undefined
    const isPast = r.event?.start_datetime ? isEventPast(r.event.start_datetime) : false
    return {
      id: r.id,
      image: r.event?.cover_image_url,
      title: r.event?.title,
      subtitle: r.event?.place?.name,
      type: 'reservation',
      dateInfo,
      event: r.event,
      isPast,
    }
  })

  // Transform stories to GridItem format
  const storyItems: GridItem[] = stories.map((s) => ({
    id: s.id,
    image: s.thumbnail_url || s.media_url,
    title: s.text_overlay,
    subtitle: new Date(s.created_at).toLocaleDateString('it-IT'),
    type: 'story',
  }))

  // Transform manager events to GridItem format
  const managerEventItems: GridItem[] = managerEvents.map((e) => {
    const dateInfo = e.start_datetime ? formatDate(e.start_datetime) : undefined
    const isPast = e.start_datetime ? isEventPast(e.start_datetime) : false
    return {
      id: e.id,
      image: e.cover_image_url,
      title: e.title,
      subtitle: e.place?.name,
      type: 'event',
      dateInfo,
      event: {
        start_datetime: e.start_datetime,
        place: e.place,
      },
      isPast,
    }
  })

  // Memoize items to ensure they update when activeTab changes
  const items = useMemo(() => {
    if (activeTab === 'reservations') return reservationItems
    if (activeTab === 'events') return managerEventItems
    return storyItems
  }, [activeTab, reservationItems, storyItems, managerEventItems])

  const isLoading =
    activeTab === 'reservations'
      ? isLoadingReservations
      : activeTab === 'events'
        ? isLoadingManagerEvents
        : isLoadingStories

  const handleItemPress = (item: GridItem) => {
    // Disable navigation for external profiles (security - no QR code access)
    if (isExternalProfile) return

    if (item.type === 'reservation') {
      router.push(`/(app)/reservations/${item.id}` as any)
    } else if (item.type === 'event') {
      router.push(`/(app)/event/${item.id}` as any)
    }
    // Stories could navigate to a story viewer
  }

  const renderGridItem = ({ item }: { item: GridItem }) => {
    const isReservationOrEvent = item.type === 'reservation' || item.type === 'event'

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        activeOpacity={isExternalProfile ? 1 : 0.8}
        disabled={isExternalProfile}
        style={{
          width: itemWidth,
          height: itemHeight,
          marginBottom: gap,
        }}
      >
        <View style={{ flex: 1, position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
          <GlassCard
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.2)',
                overflow: 'hidden',
              },
            ]}
          >
            <View />
          </GlassCard>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: themeColors.muted },
              ]}
            />
          )}
          {item.dateInfo && isReservationOrEvent && (
            <View
              className="absolute top-2 left-2 rounded-md px-2 py-1 items-center z-10"
              style={{ backgroundColor: themeColors.background + 'E6' }}
            >
              <Text
                className="text-sm font-bold leading-tight"
                style={{ color: themeColors.foreground }}
              >
                {item.dateInfo.day}
              </Text>
              <Text
                className="text-[8px] uppercase leading-tight"
                style={{ color: themeColors.mutedForeground }}
              >
                {item.dateInfo.month}
              </Text>
            </View>
          )}
          {item.isPast && (
            <View
              className="absolute top-2 right-2 rounded-md px-2 py-1 z-10"
              style={{ backgroundColor: themeColors.muted + 'E6' }}
            >
              <Text
                className="text-[8px] font-semibold uppercase"
                style={{ color: themeColors.mutedForeground }}
              >
                Passato
              </Text>
            </View>
          )}
          {isReservationOrEvent && (
            <View
              pointerEvents="none"
              className="absolute bottom-0 left-0 right-0 h-16"
              style={{
                backgroundColor: themeColors.background,
                opacity: 0.75,
              }}
            />
          )}
          <View
            className="absolute bottom-0 left-0 right-0 z-10"
            style={{ paddingTop: 8, paddingBottom: 8, paddingHorizontal: 8 }}
          >
            {item.title && (
              <Text
                className="text-xs font-semibold mb-1"
                style={{ color: themeColors.foreground }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            )}
            <View className="gap-1">
              {item.dateInfo && (
                <View className="flex-row items-center">
                  <Clock size={10} color={themeColors.mutedForeground} />
                  <Text
                    className="text-[10px] ml-1"
                    style={{ color: themeColors.mutedForeground }}
                  >
                    {item.dateInfo.time}
                  </Text>
                </View>
              )}
              {item.subtitle && (
                <View className="flex-row items-center">
                  <MapPin size={10} color={themeColors.mutedForeground} />
                  <Text
                    className="text-[10px] ml-1 flex-1"
                    style={{ color: themeColors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Text className="text-muted-foreground text-center">
        {activeTab === 'reservations'
          ? 'Nessuna prenotazione'
          : activeTab === 'events'
            ? 'Nessun evento creato'
            : 'Nessuna storia pubblicata'}
      </Text>
    </View>
  )

  // Tab configuration - memoized to prevent recreation on every render
  const tabs = useMemo(() => [
    isManager
      ? {
          id: 'events' as const,
          label: 'Eventi',
          icon: Calendar,
          count: managerEvents.length,
        }
      : {
          id: 'reservations' as const,
          label: 'Prenotazioni',
          icon: Ticket,
          count: reservations.length,
        },
    {
      id: 'stories' as const,
      label: 'Storie',
      icon: ImageIcon,
      count: stories.length,
    },
    ...(!isExternalProfile
      ? [
          {
            id: 'requests' as const,
            label: 'Richieste',
            icon: Bell,
            count: pendingRequestsCount,
            badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          },
        ]
      : []),
  ], [
    isManager,
    managerEvents.length,
    reservations.length,
    stories.length,
    pendingRequestsCount,
    isExternalProfile,
  ])

  // Calculate tab width - memoized
  const tabWidth = useMemo(() => (width - 32) / tabs.length, [width, tabs.length])


  return (
    <View className="mt-6">
      {/* Modern Segmented Control Style Tabs */}
      <GlassSurface
        variant="card"
        intensity={isDark ? 'light' : 'light'}
        tint={isDark ? 'extraLight' : 'light'}
        style={{
          marginHorizontal: 16,
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          padding: 4,
        }}
      >
        <View className="flex-row">
          {/* Tab Buttons - Inline with direct style props */}
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isTabActive = activeTab === tab.id
            const iconColor = isTabActive ? themeColors.foreground : themeColors.mutedForeground
            const textColor = isTabActive ? themeColors.foreground : themeColors.mutedForeground
            const badgeColor = isTabActive ? themeColors.primary : themeColors.destructive
            
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  minHeight: 44,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon
                    size={16}
                    color={iconColor}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: textColor,
                    }}
                  >
                    {tab.label}
                  </Text>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <View
                      style={{
                        marginLeft: 4,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                        backgroundColor: badgeColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: '#fff',
                        }}
                      >
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </GlassSurface>

      {/* Content */}
      {activeTab === 'requests' ? (
        <ProfileRequestsTab />
      ) : isLoading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          key={activeTab} // Force re-render when tab changes
          data={items}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
          }}
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
        />
      )}
    </View>
  )
}
