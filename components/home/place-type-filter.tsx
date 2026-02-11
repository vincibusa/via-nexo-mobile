/**
 * Place Type Filter - Container component connecting pills to Zustand store
 * Manages place type filtering for the home screen
 */

import React from 'react';
import { View } from 'react-native';
import { PlaceTypePills } from './place-type-pills';
import { useFiltersStore } from '../../lib/stores/filters-store';
import { PlaceTypeValue } from '../../lib/constants/place-types';

/**
 * PlaceTypeFilter Component
 * Connects PlaceTypePills to the Zustand filters store
 * Handles selection updates and store updates
 */
export const PlaceTypeFilter = React.memo(function PlaceTypeFilter() {
  const { placesFilters, setPlacesFilters } = useFiltersStore();

  const handleSelect = (value: PlaceTypeValue) => {
    // null means "Tutti" (all), so we set category to undefined
    if (value === null) {
      setPlacesFilters({ category: undefined });
    } else {
      setPlacesFilters({ category: value });
    }
  };

  // Get current selected value from store (or null if undefined)
  const selectedValue: PlaceTypeValue = (placesFilters.category as PlaceTypeValue) || null;

  return (
    <View className="bg-background border-b border-border">
      <PlaceTypePills selectedValue={selectedValue} onSelect={handleSelect} />
    </View>
  );
});

PlaceTypeFilter.displayName = 'PlaceTypeFilter';
