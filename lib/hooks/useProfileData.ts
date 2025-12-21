/**
 * Hook for Profile Screen data and logic
 * Extended to fetch posts, highlights, and complete stats
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/auth';
import { API_CONFIG } from '../config';
import { GridItem } from '../../components/profile/content-grid';

export interface ProfileDataState {
  refreshing: boolean;
  error: string | null;
  posts: GridItem[];
  isLoadingPosts: boolean;
}

export interface UseProfileDataReturn extends ProfileDataState {
  refreshProfile: () => Promise<void>;
}

/**
 * Hook for Profile Screen data management
 */
export function useProfileData(): UseProfileDataReturn {
  const { user, updateUserProfile, session } = useAuth();
  const [state, setState] = useState<ProfileDataState>({
    refreshing: false,
    error: null,
    posts: [],
    isLoadingPosts: false,
  });

  const fetchPosts = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoadingPosts: true }));
    try {
      // Fetch user's favorites to use as posts
      // In a real app, this would be a dedicated posts endpoint
      const favoritesResponse = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        const posts: GridItem[] = [];

        // Convert favorite places to grid items
        if (favoritesData.places) {
          favoritesData.places.forEach((place: any) => {
            posts.push({
              id: place.id,
              imageUrl: place.cover_image || place.gallery_images?.[0] || '',
              type: 'place',
              title: place.name,
            });
          });
        }

        // Convert favorite events to grid items
        if (favoritesData.events) {
          favoritesData.events.forEach((event: any) => {
            posts.push({
              id: event.id,
              imageUrl: event.cover_image || event.image_url || '',
              type: 'event',
              title: event.title,
            });
          });
        }

        setState(prev => ({ ...prev, posts, isLoadingPosts: false }));
      } else {
        setState(prev => ({ ...prev, isLoadingPosts: false }));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setState(prev => ({ ...prev, isLoadingPosts: false }));
    }
  }, [session?.accessToken]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, refreshing: true, error: null }));

    try {
      // Fetch profile data
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/social/profiles/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      
      if (response.ok) {
        const profileData = await response.json();
        console.log('Refreshed profile data:', profileData);

        // Update context with fresh data
        if (profileData.user) {
          // Ensure all Instagram-like fields are present
          const updatedUser = {
            ...profileData.user,
            postsCount: profileData.user.postsCount ?? profileData.postsCount ?? 0,
            followersCount: profileData.user.followersCount ?? profileData.followersCount ?? 0,
            followingCount: profileData.user.followingCount ?? profileData.followingCount ?? 0,
            bio: profileData.user.bio ?? profileData.bio,
            website: profileData.user.website ?? profileData.website,
            isVerified: profileData.user.isVerified ?? profileData.isVerified ?? false,
          };
          updateUserProfile(updatedUser);
        }

        // Fetch posts in parallel
        await fetchPosts(user.id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to refresh profile');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh profile',
      }));
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [user?.id, updateUserProfile, session?.accessToken, fetchPosts]);

  // Load initial profile data when user is available
  useEffect(() => {
    if (user?.id && session?.accessToken) {
      refreshProfile();
    }
  }, [user?.id, session?.accessToken, refreshProfile]);

  return {
    ...state,
    refreshProfile,
  };
}
