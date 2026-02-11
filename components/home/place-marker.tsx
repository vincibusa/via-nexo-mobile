/**
 * Place Marker Component
 * Individual marker for places on the map
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';
import type { Place } from '../../lib/types/suggestion';
import { MapPin, Utensils, Beer, Coffee, Wine, Music, Pizza } from 'lucide-react-native';

interface PlaceMarkerProps {
  place: Place;
  isSelected?: boolean;
}

// Helper function to get appropriate icon based on place category
const getPlaceIcon = (category: string) => {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('ristorante') || categoryLower.includes('restaurant') || categoryLower.includes('cucina')) {
    return Utensils;
  }
  if (categoryLower.includes('pizza') || categoryLower.includes('pizzeria')) {
    return Pizza;
  }
  if (categoryLower.includes('bar') && categoryLower.includes('vino') || categoryLower.includes('wine')) {
    return Wine;
  }
  if (categoryLower.includes('caffè') || categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
    return Coffee;
  }
  if (categoryLower.includes('birra') || categoryLower.includes('pub') || categoryLower.includes('birreria')) {
    return Beer;
  }
  if (categoryLower.includes('club') || categoryLower.includes('discoteca') || categoryLower.includes('musica')) {
    return Music;
  }

  // Default icon
  return MapPin;
};

// Helper function to get icon color based on category
// Uses theme-aware colors while maintaining category distinction
const getPlaceIconColor = (category: string, primaryColor: string) => {
  const categoryLower = category.toLowerCase();

  // Use primary color variations for different categories
  // This maintains visual distinction while respecting theme
  if (categoryLower.includes('ristorante') || categoryLower.includes('restaurant') || categoryLower.includes('cucina')) {
    return primaryColor; // Use primary for restaurants
  }
  if (categoryLower.includes('pizza') || categoryLower.includes('pizzeria')) {
    return primaryColor; // Use primary for pizza
  }
  if (categoryLower.includes('bar') && categoryLower.includes('vino') || categoryLower.includes('wine')) {
    return primaryColor; // Use primary for wine bars
  }
  if (categoryLower.includes('caffè') || categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
    return primaryColor; // Use primary for cafes
  }
  if (categoryLower.includes('birra') || categoryLower.includes('pub') || categoryLower.includes('birreria')) {
    return primaryColor; // Use primary for pubs
  }
  if (categoryLower.includes('club') || categoryLower.includes('discoteca') || categoryLower.includes('musica')) {
    return primaryColor; // Use primary for clubs
  }

  // Default color - use primary
  return primaryColor;
};

export function PlaceMarker({ place, isSelected = false }: PlaceMarkerProps) {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  
  const themeColors = THEME[effectiveTheme];
  
  const Icon = getPlaceIcon(place.category);
  const iconColor = getPlaceIconColor(place.category, themeColors.primary);

  return (
    <View className="items-center">
      {/* Marker */}
      <View
        className={`items-center justify-center rounded-full border-2 ${
          isSelected ? 'border-primary' : 'border-background'
        }`}
        style={{
          backgroundColor: iconColor,
          width: isSelected ? 44 : 36,
          height: isSelected ? 44 : 36,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Icon size={isSelected ? 20 : 16} color={themeColors.primaryForeground} />
      </View>

      {/* Place name (shown on selection) */}
      {isSelected && (
        <View
          className="mt-1 px-2 py-1 rounded-md bg-card border border-border"
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
            elevation: 2,
          }}
        >
          <Text className="text-xs font-medium text-card-foreground max-w-[120px] text-center">
            {place.name}
          </Text>
        </View>
      )}
    </View>
  );
}
