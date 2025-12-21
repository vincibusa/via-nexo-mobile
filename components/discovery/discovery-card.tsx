import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Text } from '../ui/text';
import { Heart, MessageCircle, Share2, Info } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import type { DiscoveryItem } from '../../lib/types/discovery';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import { CommentsSheet } from './comments-sheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DiscoveryCardProps {
  item: DiscoveryItem;
  isActive: boolean;
  onLike: () => void;
  onView: () => void;
}

export function DiscoveryCard({ item, isActive, onLike, onView }: DiscoveryCardProps) {
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const themeColors = THEME.dark;

  useEffect(() => {
    if (item.media_type === 'video') {
      if (isActive && !isPlaying) {
        videoRef.current?.playAsync();
        setIsPlaying(true);
        onView();
      } else if (!isActive && isPlaying) {
        videoRef.current?.pauseAsync();
        setIsPlaying(false);
      }
    } else if (isActive) {
      onView();
    }
  }, [isActive, item.media_type]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoReady(true);
    }
  };

  const handleShare = async () => {
    try {
      if (item.event) {
        await Share.share({
          message: `Guarda questo evento: ${item.event.title}`,
          title: item.event.title,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleInfoPress = () => {
    if (item.event_id) {
      router.push(`/(app)/event/${item.event_id}` as any);
    }
  };

  const handleCommentsPress = () => {
    setCommentsOpen(true);
  };

  return (
    <View style={styles.container}>
      {/* Media */}
      <View style={styles.mediaContainer}>
        {item.media_type === 'video' ? (
          <>
            {!isVideoReady && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.foreground} />
              </View>
            )}
            <Video
              ref={videoRef}
              source={{ uri: item.media_url }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isActive}
              isLooping
              isMuted={false}
              volume={1.0}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
          </>
        ) : (
          <Image
            source={{ uri: item.media_url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

      </View>

      {/* Info Button - Top Right */}
      <Pressable
        onPress={handleInfoPress}
        style={styles.topInfoButton}
      >
        <Info size={24} color="white" />
      </Pressable>

      {/* Bottom Info */}
      <View style={styles.bottomInfo} pointerEvents="box-none">
        {item.event && (
          <View style={styles.eventInfo} pointerEvents="box-none">
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.event.title}
            </Text>
            {item.event.place?.name && (
              <Text style={styles.placeName} numberOfLines={1}>
                📍 {item.event.place.name}
              </Text>
            )}
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.statsRow} pointerEvents="box-none">
              <Text style={styles.statsText}>
                👁️ {item.views_count.toLocaleString()}
              </Text>
              <Text style={styles.statsText}>
                ❤️ {item.likes_count.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions} pointerEvents="box-none">
        <Pressable onPress={onLike} style={styles.actionButton}>
          <Heart
            size={32}
            color="white"
            fill={item.is_liked ? 'red' : 'transparent'}
          />
          <Text style={styles.actionLabel}>
            {item.likes_count > 0 ? item.likes_count.toLocaleString() : ''}
          </Text>
        </Pressable>

        <Pressable onPress={handleCommentsPress} style={styles.actionButton}>
          <MessageCircle size={32} color="white" />
          <Text style={styles.actionLabel}>Commenti</Text>
        </Pressable>

        <Pressable onPress={handleShare} style={styles.actionButton}>
          <Share2 size={32} color="white" />
          <Text style={styles.actionLabel}>Condividi</Text>
        </Pressable>
      </View>

      {/* Comments Bottom Sheet */}
      <CommentsSheet
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        discoveryItemId={item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  topInfoButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    padding: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80,
    padding: 20,
    paddingBottom: 40,
  },
  eventInfo: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

