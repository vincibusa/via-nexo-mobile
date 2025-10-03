import * as Location from 'expo-location';

// Default location: Roma centro
const DEFAULT_LOCATION = {
  lat: 41.9028,
  lon: 12.4964,
};

let cachedLocation: { lat: number; lon: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCurrentLocation(): Promise<{ lat: number; lon: number }> {
  // Check cache
  if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_DURATION) {
    return { lat: cachedLocation.lat, lon: cachedLocation.lon };
  }

  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Location permission denied, using default location');
      return DEFAULT_LOCATION;
    }

    // Get current location with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coords = {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    };

    // Cache location
    cachedLocation = {
      ...coords,
      timestamp: Date.now(),
    };

    return coords;
  } catch (error) {
    console.error('Error getting location:', error);
    return DEFAULT_LOCATION;
  }
}

export function clearLocationCache() {
  cachedLocation = null;
}
