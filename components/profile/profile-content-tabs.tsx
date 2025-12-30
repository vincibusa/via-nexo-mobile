/**
 * Profile Content Tabs Component - Instagram Style
 * Tab navigation with Posts/Saved/Visited sections
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { ContentGrid, GridItem } from './content-grid';
import { Grid3x3, Bookmark, MapPin } from 'lucide-react-native';
import { useFavorites } from '../../lib/contexts/favorites';
import { useAuth } from '../../lib/contexts/auth';

interface ProfileContentTabsProps {
  posts?: GridItem[];
  isLoading?: boolean;
}

export function ProfileContentTabs({ posts = [], isLoading = false }: ProfileContentTabsProps) {
  const { places, events } = useFavorites();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');

  // Convert favorites to grid items
  const savedItems: GridItem[] = [
    ...places.map((place) => ({
      id: place.id,
      imageUrl: place.cover_image || '',
      type: 'place' as const,
      title: place.name,
    })),
    ...events.map((event) => ({
      id: event.id,
      imageUrl: '', // Events might not have images
      type: 'event' as const,
      title: event.title,
    })),
  ];

  // For visited places, we'll use favorites for now
  // In a real app, this would come from a separate "visited" API
  const visitedItems: GridItem[] = places
    .filter((place) => place.verified) // Use verified as proxy for visited
    .map((place) => ({
      id: place.id,
      imageUrl: place.cover_image || '',
      type: 'place' as const,
      title: place.name,
    }));

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-around mb-2">
        <TabsTrigger value="posts" className="flex-1">
          <Grid3x3 size={18} />
        </TabsTrigger>
        <TabsTrigger value="saved" className="flex-1">
          <Bookmark size={18} />
        </TabsTrigger>
        <TabsTrigger value="visited" className="flex-1">
          <MapPin size={18} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-0">
        <ContentGrid items={posts} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="saved" className="mt-0">
        <ContentGrid items={savedItems} isLoading={false} />
      </TabsContent>

      <TabsContent value="visited" className="mt-0">
        <ContentGrid items={visitedItems} isLoading={false} />
      </TabsContent>
    </Tabs>
  );
}










