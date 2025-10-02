export const API_CONFIG = {
  // Cambia con l'URL del tuo backend in produzione
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://your-production-url.com',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
} as const;
