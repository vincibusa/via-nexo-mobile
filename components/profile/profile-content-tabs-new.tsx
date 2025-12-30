/**
 * Profile Content Tabs - Following the mockup
 * Pill-style tabs with 2-column grid content
 * Fetches real data from reservations and stories APIs
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Text } from '../ui/text'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import { useFocusEffect, useRouter } from 'expo-router'
import { reservationsService, Reservation } from '../../lib/services/reservations'
import { API_CONFIG } from '../../lib/config'
import { useAuth } from '../../lib/contexts/auth'
import { Calendar, Clock, MapPin } from 'lucide-react-native'

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
  type: 'reservation' | 'story'
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
}

interface ProfileContentTabsNewProps {
  userId?: string // If provided, show external user's profile; otherwise show current user's
}

export function ProfileContentTabsNew({ userId }: ProfileContentTabsNewProps = {}) {
  const [activeTab, setActiveTab] = useState<'reservations' | 'stories'>('reservations')
  const { width } = useWindowDimensions()
  const { settings } = useSettings()
  const { user, session } = useAuth()
  const router = useRouter()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [isLoadingReservations, setIsLoadingReservations] = useState(true)
  const [isLoadingStories, setIsLoadingStories] = useState(true)

  // Check if viewing external profile
  const isExternalProfile = !!userId

  const effectiveTheme = settings?.theme === 'system' ? 'dark' : settings?.theme || 'dark'
  const themeColors = THEME[effectiveTheme]

  // Calculate grid dimensions (2 columns with padding)
  const horizontalPadding = 16
  const gap = 12
  const itemWidth = (width - horizontalPadding * 2 - gap) / 2
  const itemHeight = itemWidth * 0.75

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    setIsLoadingReservations(true)
    try {
      // If userId provided, fetch that user's reservations; otherwise fetch current user's
      const { data, error } = userId
        ? await reservationsService.getUserReservations(userId, 0, 50)
        : await reservationsService.getMyReservations(0, 50)

      if (!error && data) {
        setReservations(data)
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoadingReservations(false)
    }
  }, [userId])

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

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchReservations()
      fetchStories()
    }, [fetchReservations, fetchStories])
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
    return {
      id: r.id,
      image: r.event?.cover_image_url,
      title: r.event?.title,
      subtitle: r.event?.place?.name,
      type: 'reservation',
      dateInfo,
      event: r.event,
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

  const items = activeTab === 'reservations' ? reservationItems : storyItems
  const isLoading = activeTab === 'reservations' ? isLoadingReservations : isLoadingStories

  const handleItemPress = (item: GridItem) => {
    // Disable navigation for external profiles (security - no QR code access)
    if (isExternalProfile) return

    if (item.type === 'reservation') {
      router.push(`/(app)/reservations/${item.id}` as any)
    }
    // Stories could navigate to a story viewer
  }

  const renderGridItem = ({ item }: { item: GridItem }) => {
    const isReservation = item.type === 'reservation'

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
        <View
          className="flex-1 rounded-xl border overflow-hidden relative"
          style={{
            borderColor: themeColors.border,
            backgroundColor: themeColors.card,
          }}
        >
          {/* Full image background */}
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="absolute inset-0 items-center justify-center bg-muted">
              <Calendar size={32} color={themeColors.mutedForeground} />
            </View>
          )}

          {/* Date badge overlay in top-left for reservations */}
          {isReservation && item.dateInfo && (
            <View
              className="absolute top-2 left-2 rounded-md px-2 py-1 items-center z-10"
              style={{
                backgroundColor: themeColors.background + 'E6', // 90% opacity
              }}
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

          {/* Gradient overlay at bottom for text readability */}
          {isReservation && (
            <>
              {/* Gradient overlay using multiple Views for smooth transition */}
              <View
                className="absolute bottom-0 left-0 right-0 h-20"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                {/* Gradient layers */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 20,
                    backgroundColor: themeColors.background,
                    opacity: 0.9,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 0,
                    right: 0,
                    height: 20,
                    backgroundColor: themeColors.background,
                    opacity: 0.7,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    left: 0,
                    right: 0,
                    height: 20,
                    backgroundColor: themeColors.background,
                    opacity: 0.4,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 60,
                    left: 0,
                    right: 0,
                    height: 20,
                    backgroundColor: themeColors.background,
                    opacity: 0.1,
                  }}
                />
              </View>

              {/* Content overlay */}
              <View
                className="absolute bottom-0 left-0 right-0"
                style={{
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingHorizontal: 8,
                }}
              >
                {/* Title */}
                {item.title && (
                  <Text
                    className="text-xs font-semibold mb-1"
                    style={{ color: themeColors.foreground }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                )}

                {/* Details row */}
                <View className="gap-1">
                  {/* Time */}
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

                  {/* Place */}
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
            </>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Text className="text-muted-foreground text-center">
        {activeTab === 'reservations'
          ? 'Nessuna prenotazione'
          : 'Nessuna storia pubblicata'}
      </Text>
    </View>
  )

  return (
    <View className="mt-4">
      {/* Pill Tabs */}
      <View className="flex-row px-4 mb-4 gap-3">
        {/* Eventi Prenotati Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('reservations')}
          className="flex-1 py-3 rounded-full border-2 items-center"
          style={{
            borderColor: activeTab === 'reservations' ? themeColors.primary : themeColors.border,
            backgroundColor: 'transparent',
          }}
        >
          <Text
            className="text-sm font-semibold uppercase tracking-wide"
            style={{
              color: activeTab === 'reservations' ? themeColors.primary : themeColors.mutedForeground,
            }}
          >
            Eventi Prenotati
          </Text>
        </TouchableOpacity>

        {/* Archivio Storie Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('stories')}
          className="flex-1 py-3 rounded-full border-2 items-center"
          style={{
            borderColor: activeTab === 'stories' ? themeColors.primary : themeColors.border,
            backgroundColor: 'transparent',
          }}
        >
          <Text
            className="text-sm font-semibold uppercase tracking-wide"
            style={{
              color: activeTab === 'stories' ? themeColors.primary : themeColors.mutedForeground,
            }}
          >
            Archivio Storie
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Grid */}
      {isLoading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={items}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
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
