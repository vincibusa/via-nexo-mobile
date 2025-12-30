import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, ActivityIndicator } from 'react-native'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'
import { Text } from '../ui/text'
import { useSettings } from '../../lib/contexts/settings'
import { THEME } from '../../lib/theme'
import { raveScoreService } from '../../lib/services/rave-score'
import type { RaveScoreType, RaveScoreEvent } from '../../lib/types/rave-score'

interface RaveScoreDetailSheetProps {
  isOpen: boolean
  type: RaveScoreType | null
  userId: string | null
  onClose: () => void
}

const EXPLANATIONS: Record<RaveScoreType, { title: string; description: string }> = {
  presence: {
    title: 'Presence Score',
    description:
      'Il punteggio Presence misura la tua partecipazione reale agli eventi. Solo i check-in verificati tramite QR contano. Gli eventi recenti valgono di più, mentre i vecchi pesano meno per evitare che chi esce ogni giorno schiacci tutti.',
  },
  trust: {
    title: 'Trust Score',
    description:
      "Il punteggio Trust misura l'affidabilità sulle tue prenotazioni personali. Ottenere punti per le presentazioni, nessuna penalità per cancellazioni anticipate (>24h), penalità per cancellazioni tardive e penalità forte per no-show.",
  },
  crew: {
    title: 'Crew Bonus',
    description:
      'Il Crew Bonus premia la capacità di portare persone che entrano davvero. Ogni ospite invitato ha un QR individuale e il merito si assegna solo su check-in verificati. Max 10 punti.',
  },
}

export function RaveScoreDetailSheet({
  isOpen,
  type,
  userId,
  onClose,
}: RaveScoreDetailSheetProps) {
  const { settings } = useSettings()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [events, setEvents] = useState<RaveScoreEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const effectiveTheme = settings?.theme === 'system' ? 'dark' : settings?.theme || 'dark'
  const themeColors = THEME[effectiveTheme]

  const snapPoints = useMemo(() => ['60%', '90%'], [])

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand()
      setEvents([])
      setOffset(0)
      loadEvents(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isOpen, type, userId])

  const loadEvents = async (off: number) => {
    if (!userId || !type) return

    setLoading(true)
    const { data, hasMore: more, error } = await raveScoreService.getEvents(
      userId,
      type,
      20,
      off
    )

    if (!error && data) {
      if (off === 0) {
        setEvents(data)
      } else {
        setEvents((prev) => [...prev, ...data])
      }
      setHasMore(more || false)
      setOffset(off + 20)
    }

    setLoading(false)
  }

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose()
      }
    },
    [onClose]
  )

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadEvents(offset)
    }
  }

  const renderEventItem = ({ item }: { item: RaveScoreEvent }) => {
    const getEventIcon = (eventType: string) => {
      switch (eventType) {
        case 'check_in':
          return '✓'
        case 'show':
          return '✓'
        case 'early_cancel':
          return '⟲'
        case 'late_cancel':
          return '⟳'
        case 'no_show':
          return '✗'
        case 'hosted_guest_show':
          return '+'
        default:
          return '•'
      }
    }

    const getPointsColor = (points: number | null) => {
      if (points === null) return themeColors.mutedForeground
      return points > 0 ? '#4ade80' : '#ef4444'
    }

    return (
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Text
          className="text-lg font-bold mr-3 w-8 text-center"
          style={{ color: getPointsColor(item.pointsImpact) }}
        >
          {getEventIcon(item.type)}
        </Text>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{item.eventTitle || 'Evento'}</Text>

          <Text className="text-xs text-muted-foreground mt-1">
            {item.eventDate
              ? new Date(item.eventDate).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Data non disponibile'}
          </Text>
        </View>

        {item.pointsImpact !== null && (
          <Text
            className="text-sm font-semibold ml-3 w-12 text-right"
            style={{ color: getPointsColor(item.pointsImpact) }}
          >
            {item.pointsImpact > 0 ? '+' : ''}{Math.round(item.pointsImpact * 10) / 10}
          </Text>
        )}
      </View>
    )
  }

  if (!type) return null

  const explanation = EXPLANATIONS[type]

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onAnimate={handleSheetChange}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      animateOnMount
    >
      <BottomSheetView
        style={{
          backgroundColor: themeColors.background,
          flex: 1,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-lg font-bold text-foreground">{explanation.title}</Text>

          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Explanation */}
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-sm text-muted-foreground leading-5">{explanation.description}</Text>
        </View>

        {/* Events List */}
        {loading && events.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={themeColors.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-8">
                <Text className="text-sm text-muted-foreground">Nessun evento registrato</Text>
              </View>
            }
            ListFooterComponent={
              loading && events.length > 0 ? (
                <View className="py-4 items-center">
                  <ActivityIndicator color={themeColors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  )
}
