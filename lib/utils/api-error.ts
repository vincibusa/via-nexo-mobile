/**
 * API Error Handler Standardizzato
 * SICUREZZA: Gestione coerente degli errori tra tutti i service
 */

export interface APIError {
  code: string
  message: string
  statusCode?: number
  details?: any
}

/**
 * SYNCHRONIZED: Error codes match web backend (/lib/error-handler.ts)
 * Ensures consistent error handling across mobile and web
 */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Credenziali non valide',
    statusCode: 401,
  },
  AUTH_MISSING_FIELDS: {
    code: 'AUTH_MISSING_FIELDS',
    message: 'Campi obbligatori mancanti',
    statusCode: 400,
  },
  AUTH_ACCESS_DENIED: {
    code: 'AUTH_ACCESS_DENIED',
    message: 'Accesso negato',
    statusCode: 403,
  },
  AUTH_PROFILE_NOT_FOUND: {
    code: 'AUTH_PROFILE_NOT_FOUND',
    message: 'Profilo utente non trovato',
    statusCode: 404,
  },

  // Validation
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Dati non validi',
    statusCode: 400,
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Troppi tentativi. Riprova più tardi',
    statusCode: 429,
  },

  // Network/Client
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection failed',
    statusCode: 0,
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    message: 'Request timeout',
    statusCode: 0,
  },

  // Database
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Errore del database',
    statusCode: 500,
  },

  // AI Services
  AI_SERVICE_ERROR: {
    code: 'AI_SERVICE_ERROR',
    message: 'Servizio AI temporaneamente non disponibile',
    statusCode: 503,
  },

  // Generic
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Errore interno del server',
    statusCode: 500,
  },

  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Risorsa non trovata',
    statusCode: 404,
  },
} as const

/**
 * Parse API error response into standardized format
 */
export function parseAPIError(error: any, defaultCode = 'INTERNAL_ERROR'): APIError {
  // Network/fetch errors
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      details: error,
    }
  }

  // Timeout
  if (error?.code === 'TIMEOUT_ERROR' || error?.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout',
      details: error,
    }
  }

  // JSON response with error object
  if (error?.error?.code) {
    const errorCode = error.error.code as keyof typeof ERROR_CODES
    const baseError = ERROR_CODES[errorCode] || ERROR_CODES[defaultCode as keyof typeof ERROR_CODES]

    return {
      ...baseError,
      message: error.error.message || baseError.message,
      details: error.error,
    }
  }

  // HTTP status codes
  if (error?.statusCode) {
    const statusCode = error.statusCode

    if (statusCode === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: error.message || 'Unauthorized',
        statusCode,
        details: error,
      }
    }

    if (statusCode === 403) {
      return {
        code: 'FORBIDDEN',
        message: error.message || 'Access denied',
        statusCode,
        details: error,
      }
    }

    if (statusCode === 404) {
      return {
        code: 'NOT_FOUND',
        message: error.message || 'Resource not found',
        statusCode,
        details: error,
      }
    }

    if (statusCode === 429) {
      return {
        code: 'RATE_LIMIT',
        message: error.message || 'Too many requests',
        statusCode,
        details: error,
      }
    }

    if (statusCode >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: error.message || 'Server error',
        statusCode,
        details: error,
      }
    }

    if (statusCode >= 400) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Validation failed',
        statusCode,
        details: error,
      }
    }
  }

  // Generic error object
  if (error?.message) {
    return {
      code: error.code || defaultCode,
      message: error.message,
      statusCode: error.statusCode,
      details: error,
    }
  }

  // Fallback
  return {
    code: defaultCode,
    message: String(error) || 'An unexpected error occurred',
    details: error,
  }
}

/**
 * Create a standardized API error
 */
export function createAPIError(
  code: keyof typeof ERROR_CODES,
  customMessage?: string
): APIError {
  const baseError = ERROR_CODES[code]

  return {
    ...baseError,
    message: customMessage || baseError.message,
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: APIError): boolean {
  const retryableCodes = ['TIMEOUT_ERROR', 'NETWORK_ERROR', 'SERVICE_UNAVAILABLE', 'RATE_LIMIT']
  return retryableCodes.includes(error.code)
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: APIError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Check your internet connection and try again'
    case 'TIMEOUT_ERROR':
      return 'Request took too long. Please try again'
    case 'UNAUTHORIZED':
    case 'AUTH_FAILED':
      return 'Please log in again'
    case 'INSUFFICIENT_PERMISSIONS':
      return 'You do not have permission to perform this action'
    case 'RATE_LIMIT':
      return 'Too many requests. Please wait a moment and try again'
    case 'SERVICE_UNAVAILABLE':
      return 'Service is temporarily unavailable. Please try again later'
    default:
      return error.message || 'An error occurred. Please try again'
  }
}
