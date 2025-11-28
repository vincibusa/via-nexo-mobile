import { API_CONFIG } from '../config'

export interface UploadResponse {
  path: string
  url: string
  message: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class UploadService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  /**
   * Upload a story media file to the server
   */
  async uploadStoryMedia(
    file: File | { uri: string; name: string; type: string },
    token: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      if (!token) {
        throw new Error('Authentication required')
      }

      // Create form data
      const formData = new FormData()

      // Handle different file types (React Native File vs Expo ImagePicker result)
      if ('uri' in file) {
        // React Native file object from ImagePicker
        formData.append('file', {
          uri: file.uri,
          name: file.name || `story-${Date.now()}.jpg`,
          type: file.type || 'image/jpeg',
        } as any)
      } else {
        // Standard File object
        formData.append('file', file)
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100)
              }
              onProgress(progress)
            }
          })
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (error) {
              reject(new Error('Invalid response from server'))
            }
          } else {
            this.handleErrorResponse(xhr, reject)
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'))
        })

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'))
        })

        xhr.open('POST', `${this.baseUrl}/api/upload/story`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.timeout = 30000 // 30 seconds timeout
        xhr.send(formData)
      })
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  /**
   * Delete a story media file
   */
  async deleteStoryMedia(path: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`${this.baseUrl}/api/upload/story?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = typeof errorData === 'object' && errorData !== null && 'error' in errorData
          ? (errorData as { error: string }).error
          : `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      // Type guard to ensure response has the expected structure
      if (typeof responseData === 'object' && responseData !== null &&
          'success' in responseData && 'message' in responseData) {
        return responseData as { success: boolean; message: string }
      }

      throw new Error('Invalid response format from server')
    } catch (error) {
      throw this.normalizeError(error)
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: { size: number; type: string }): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Tipo file non supportato. Sono consentiti solo JPEG, PNG e WebP.'
      }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File troppo grande. Dimensione massima consentita: 5MB.'
      }
    }

    return { valid: true }
  }

  /**
   * Handle HTTP error responses
   */
  private handleErrorResponse(xhr: XMLHttpRequest, reject: (error: Error) => void) {
    try {
      const errorData = JSON.parse(xhr.responseText)
      const errorMessage = errorData.error || `HTTP ${xhr.status}: ${xhr.statusText}`

      switch (xhr.status) {
        case 400:
          reject(new Error(`Richiesta non valida: ${errorMessage}`))
          break
        case 401:
          reject(new Error('Accesso non autorizzato. Effettua il login.'))
          break
        case 403:
          reject(new Error('Accesso negato.'))
          break
        case 413:
          reject(new Error('File troppo grande.'))
          break
        case 500:
          reject(new Error('Errore del server. Riprova più tardi.'))
          break
        default:
          reject(new Error(errorMessage))
      }
    } catch {
      reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
    }
  }

  /**
   * Normalize different error types
   */
  private normalizeError(error: any): Error {
    if (error instanceof Error) {
      return error
    }
    if (typeof error === 'string') {
      return new Error(error)
    }
    return new Error('Errore sconosciuto durante l\'upload')
  }
}

// Export singleton instance
export const uploadService = new UploadService()