import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  FavoritePlace, 
  FavoriteEvent, 
  favoritesService,
  AddFavoriteParams 
} from '../services/favorites';
import { useAuth } from './auth';

interface FavoritesContextType {
  places: FavoritePlace[];
  events: FavoriteEvent[];
  isLoading: boolean;
  addFavorite: (params: AddFavoriteParams) => Promise<void>;
  removeFavorite: (favoriteId: string, resourceType: 'place' | 'event') => Promise<void>;
  isFavorite: (resourceType: 'place' | 'event', resourceId: string) => boolean;
  getFavoriteId: (resourceType: 'place' | 'event', resourceId: string) => string | null;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [places, setPlaces] = useState<FavoritePlace[]>([]);
  const [events, setEvents] = useState<FavoriteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount and when session changes
  useEffect(() => {
    if (session?.accessToken) {
      loadFavorites();
    } else {
      // Clear favorites when logged out
      setPlaces([]);
      setEvents([]);
      setIsLoading(false);
    }
  }, [session]);

  const loadFavorites = async () => {
    if (!session?.accessToken) return;

    try {
      setIsLoading(true);
      const data = await favoritesService.getFavorites(session.accessToken);
      setPlaces(data.places);
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFavorite = async (params: AddFavoriteParams) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Optimistic update: add temporary favorite
      const tempId = `temp-${Date.now()}`;
      
      if (params.resource_type === 'place') {
        const tempPlace: FavoritePlace = {
          favorite_id: tempId,
          created_at: new Date().toISOString(),
          id: params.resource_id,
          name: 'Loading...',
          category: '',
          address: '',
          city: '',
          latitude: 0,
          longitude: 0,
          verified: false,
        };
        setPlaces(prev => [tempPlace, ...prev]);
      } else {
        const tempEvent: FavoriteEvent = {
          favorite_id: tempId,
          created_at: new Date().toISOString(),
          id: params.resource_id,
          title: 'Loading...',
          event_type: '',
          start_datetime: new Date().toISOString(),
          end_datetime: new Date().toISOString(),
        };
        setEvents(prev => [tempEvent, ...prev]);
      }

      // Add to server
      await favoritesService.addFavorite(params, session.accessToken);

      // Refresh to get full data
      await loadFavorites();
    } catch (error) {
      // Rollback on error
      await loadFavorites();
      throw error;
    }
  };

  const removeFavorite = async (favoriteId: string, resourceType: 'place' | 'event') => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    // Store for rollback
    const previousPlaces = [...places];
    const previousEvents = [...events];

    try {
      // Optimistic update: remove immediately
      if (resourceType === 'place') {
        setPlaces(prev => prev.filter(p => p.favorite_id !== favoriteId));
      } else {
        setEvents(prev => prev.filter(e => e.favorite_id !== favoriteId));
      }

      // Remove from server
      await favoritesService.removeFavorite(favoriteId, session.accessToken);
    } catch (error) {
      // Rollback on error
      setPlaces(previousPlaces);
      setEvents(previousEvents);
      throw error;
    }
  };

  const isFavorite = useCallback((resourceType: 'place' | 'event', resourceId: string): boolean => {
    if (resourceType === 'place') {
      return places.some(p => p.id === resourceId);
    } else {
      return events.some(e => e.id === resourceId);
    }
  }, [places, events]);

  const getFavoriteId = useCallback((resourceType: 'place' | 'event', resourceId: string): string | null => {
    if (resourceType === 'place') {
      const place = places.find(p => p.id === resourceId);
      return place?.favorite_id || null;
    } else {
      const event = events.find(e => e.id === resourceId);
      return event?.favorite_id || null;
    }
  }, [places, events]);

  const refreshFavorites = async () => {
    await loadFavorites();
  };

  return (
    <FavoritesContext.Provider
      value={{
        places,
        events,
        isLoading,
        addFavorite,
        removeFavorite,
        isFavorite,
        getFavoriteId,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
