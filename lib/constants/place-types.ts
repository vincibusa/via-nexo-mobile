/**
 * Place type constants with emoji and labels for UI display
 */

export const PLACE_TYPES = [
  { value: null, label: 'Tutti', emoji: '🎯' },
  { value: 'bar', label: 'Bar', emoji: '🍸' },
  { value: 'club', label: 'Club', emoji: '🪩' },
  { value: 'restaurant', label: 'Ristoranti', emoji: '🍕' },
  { value: 'pub', label: 'Pub', emoji: '🍺' },
  { value: 'lounge', label: 'Lounge', emoji: '🛋️' },
  { value: 'cafe', label: 'Caffè', emoji: '☕' },
  { value: 'other', label: 'Altro', emoji: '📍' },
] as const;

export type PlaceTypeValue = typeof PLACE_TYPES[number]['value'];

/**
 * Get label and emoji for a place type
 */
export function getPlaceTypeLabel(value: PlaceTypeValue): { label: string; emoji: string } {
  const type = PLACE_TYPES.find(t => t.value === value);
  if (!type) {
    return { label: 'Sconosciuto', emoji: '❓' };
  }
  return { label: type.label, emoji: type.emoji };
}
