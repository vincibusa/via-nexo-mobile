/**
 * Hook for Profile Screen data and logic
 * Extended to fetch reservations and stories
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/auth';
import { API_CONFIG } from '../config';
import { profileService } from '../services/profile';
import type { EventReservation, UserStory } from '../types/profile';

export interface ProfileDataState {
  refreshing: boolean;
  error: string | null;
  reservations: EventReservation[];
  stories: UserStory[];
  isLoadingReservations: boolean;
  isLoadingStories: boolean;
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
    reservations: [],
    stories: [],
    isLoadingReservations: false,
    isLoadingStories: false,
  });

  const fetchReservations = useCallback(async () => {
    if (!session?.accessToken) return;

    setState(prev => ({ ...prev, isLoadingReservations: true }));
    try {
      const { data, error } = await profileService.getMyReservations(session.accessToken);

      if (error) {
        console.error('Error fetching reservations:', error);
        setState(prev => ({ ...prev, isLoadingReservations: false }));
      } else {
        setState(prev => ({
          ...prev,
          reservations: data || [],
          isLoadingReservations: false
        }));
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setState(prev => ({ ...prev, isLoadingReservations: false }));
    }
  }, [session?.accessToken]);

  const fetchStories = useCallback(async () => {
    if (!session?.accessToken || !user?.id) return;

    setState(prev => ({ ...prev, isLoadingStories: true }));
    try {
      const { data, error } = await profileService.getUserStories(
        session.accessToken,
        user.id,
        true // Include expired stories for archive
      );

      if (error) {
        console.error('Error fetching stories:', error);
        setState(prev => ({ ...prev, isLoadingStories: false }));
      } else {
        setState(prev => ({
          ...prev,
          stories: data || [],
          isLoadingStories: false
        }));
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setState(prev => ({ ...prev, isLoadingStories: false }));
    }
  }, [session?.accessToken, user?.id]);

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
          updateUserProfile(profileData.user);
        }

        // Fetch reservations and stories in parallel
        await Promise.all([
          fetchReservations(),
          fetchStories(),
        ]);
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
  }, [user?.id, updateUserProfile, session?.accessToken, fetchReservations, fetchStories]);

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
