export const API_CONFIG = {
  // Cambia con l'URL del tuo backend in produzione
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://via-nexo-new-vq5d.vercel.app/',
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',

    // Suggestions (AI)
    SUGGEST: '/api/suggest',

    // Places
    PLACES: '/api/places',
    PLACES_NEARBY: '/api/places/nearby',
    PLACES_BATCH: '/api/places/batch',
    PLACE_BY_ID: (id: string) => `/api/places/${id}`,

    // Events
    EVENTS: '/api/events',
    EVENTS_BATCH: '/api/events/batch',
    EVENT_BY_ID: (id: string) => `/api/events/${id}`,

    // Favorites
    FAVORITES: '/api/favorites',
    FAVORITES_CHECK: '/api/favorites/check',
    FAVORITE_BY_ID: (id: string) => `/api/favorites/${id}`,

    // User Settings
    USER_SETTINGS: '/api/user/settings',

    // Notifications
    NOTIFICATIONS_REGISTER: '/api/notifications/register',
  },
} as const;
