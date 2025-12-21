/**
 * Hook for Home Screen data and logic
 * Extracted from the monolithic HomeScreen component
 */

import { useState, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import { placesListService } from '../services/places-list';
import type { Place } from '../types/suggestion';
import { API_CONFIG } from '../config';
import { useAuth } from '../contexts/auth';

export interface HomeDataState {
  places: Place[];
  isLoadingPlaces: boolean;
  location: { lat: number; lon: number } | null;
  refreshing: boolean;
  storiesRefreshTrigger: number;
  showCreateMenu: boolean;
  error: string | null;
}

export interface UseHomeDataReturn extends HomeDataState {
  userName: string;
  fetchPlaces: () => Promise<void>;
  onRefresh: () => Promise<void>;
  handleOpenCreateMenu: () => void;
  handleCloseCreateMenu: () => void;
  incrementStoriesRefresh: () => void;
}

/**
 * Hook for Home Screen data management
 */
export function useHomeData(): UseHomeDataReturn {
  const { user } = useAuth();

  const [state, setState] = useState<HomeDataState>({
    places: [],
    isLoadingPlaces: true,
    location: null,
    refreshing: false,
    storiesRefreshTrigger: 0,
    showCreateMenu: false,
    error: null,
  });

  // Memoized user name extraction with proper error handling
  const userName = useMemo(() => {
    try {
      if (user?.displayName?.trim()) {
        return user.displayName.split(' ')[0];
      }
      if (user?.email?.includes('@')) {
        return user.email.split('@')[0];
      }
    } catch (error) {
      console.warn('Error parsing user name:', error);
    }
    return 'Amico';
  }, [user]);

  // Fetch location and places
  const fetchPlaces = async () => {
    let mounted = true;
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      let userLocation: { lat: number; lon: number };

      if (status === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          userLocation = {
            lat: currentLocation.coords.latitude,
            lon: currentLocation.coords.longitude,
          };
        } catch (error) {
          console.warn('Error getting location:', error);
          // Fallback to default location
          userLocation = API_CONFIG.DEFAULT_LOCATION;
        }
      } else {
        // Fallback to default location if permission denied
        userLocation = API_CONFIG.DEFAULT_LOCATION;
      }

      if (!mounted) return;
      setState(prev => ({ ...prev, location: userLocation }));

      // Fetch places within 20km radius
      const { data, error } = await placesListService.getPlaces(
        { max_distance_km: 20 }, // filter places within 20km
        userLocation
      );

      if (!mounted) return;

      if (error) {
        console.error('Error fetching places:', error);
        setState(prev => ({ ...prev, error: error.message }));
      } else if (data) {
        setState(prev => ({ ...prev, places: data.data || [] }));
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      if (mounted) {
        setState(prev => ({ ...prev, isLoadingPlaces: false }));
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPlaces();
  }, []);

  const onRefresh = async () => {
    setState(prev => ({ ...prev, refreshing: true, isLoadingPlaces: true }));

    // Trigger stories refresh
    setState(prev => ({
      ...prev,
      storiesRefreshTrigger: prev.storiesRefreshTrigger + 1,
    }));

    await fetchPlaces();

    setState(prev => ({ ...prev, refreshing: false }));
  };

  const handleOpenCreateMenu = () => {
    setState(prev => ({ ...prev, showCreateMenu: true }));
  };

  const handleCloseCreateMenu = () => {
    setState(prev => ({ ...prev, showCreateMenu: false }));
  };

  const incrementStoriesRefresh = () => {
    setState(prev => ({
      ...prev,
      storiesRefreshTrigger: prev.storiesRefreshTrigger + 1,
    }));
  };

  return {
    ...state,
    userName,
    fetchPlaces,
    onRefresh,
    handleOpenCreateMenu,
    handleCloseCreateMenu,
    incrementStoriesRefresh,
  };
}