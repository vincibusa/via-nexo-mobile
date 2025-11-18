// Funzione per ottenere l'IP locale del computer di sviluppo
const getLocalIP = (): string => {
  // In produzione, usa l'URL di produzione
  if (!__DEV__) return 'https://via-nexo-new.vercel.app';
  
  // In sviluppo, usa l'IP locale del computer
  // Puoi ottenere il tuo IP locale con: ipconfig (Windows) o ifconfig (Mac/Linux)
  // Sostituisci con il tuo IP locale
  return 'http://192.168.1.70:3000';
};

export const API_CONFIG = {
  // Cambia con l'URL del tuo backend in produzione
  // In sviluppo usa l'IP locale del computer invece di localhost
  BASE_URL: getLocalIP(),
  
  // Default location fallback (Rome center)
  DEFAULT_LOCATION: {
    lat: 41.9028,
    lon: 12.4964
  },
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',

    // Suggestions (AI)
    SUGGEST: '/api/suggest',
    SUGGEST_STREAM: '/api/suggest/stream',

    // Chat (AI)
    CHAT_SUGGEST: '/api/chat/suggest',
    CHAT_SUGGEST_STREAM: '/api/chat/suggest-stream',

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

    // Chat History
    CHAT_CONVERSATIONS: '/api/chat/conversations',
    CHAT_CONVERSATION_BY_ID: (id: string) => `/api/chat/conversations/${id}`,
    CHAT_CONVERSATION_MESSAGES: (id: string) => `/api/chat/conversations/${id}/messages`,
  },
} as const;
