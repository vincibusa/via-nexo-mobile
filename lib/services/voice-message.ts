/**
 * Voice Message Service
 * Handles upload to Supabase Storage and message creation
 */

import { storage } from '../storage';
import messagingService from './messaging';
import { supabase } from '../supabase/client';
import * as FileSystem from 'expo-file-system';

export interface VoiceMessageUploadOptions {
  conversationId: string;
  recordingUri: string;
  duration: number; // in seconds
  size: number; // in bytes
  mimeType?: string;
}

export interface VoiceMessageUploadResult {
  media_url: string;
  media_size: number;
  media_duration: number;
  message_id: string;
}

/**
 * Service for handling voice message uploads and sending
 */
class VoiceMessageService {
  private async getAuthHeaders() {
    const session = await storage.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    return {
      Authorization: `Bearer ${session.accessToken}`,
    };
  }

  /**
   * Upload voice recording to Supabase Storage
   */
  async uploadRecording(
    options: VoiceMessageUploadOptions
  ): Promise<{ media_url: string; media_size: number }> {
    try {
      const { conversationId, recordingUri, duration, size, mimeType = 'audio/m4a' } = options;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const filename = `voice-${timestamp}-${random}.m4a`;
      const filePath = `voice-messages/${conversationId}/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, this.base64ToBlob(base64, mimeType), {
          contentType: mimeType,
          upsert: false,
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      return {
        media_url: urlData.publicUrl,
        media_size: size,
      };
    } catch (error) {
      console.error('[VoiceMessageService] Error uploading recording:', error);
      throw error;
    }
  }

  /**
   * Send voice message to conversation
   */
  async sendVoiceMessage(
    conversationId: string,
    recordingUri: string,
    duration: number,
    size: number
  ): Promise<VoiceMessageUploadResult> {
    try {
      // Upload recording to storage
      const uploadResult = await this.uploadRecording({
        conversationId,
        recordingUri,
        duration,
        size,
      });

      // Send message via messaging service
      const response = await messagingService.sendMessage(conversationId, {
        message_type: 'voice',
        media_url: uploadResult.media_url,
        media_size: uploadResult.media_size,
        media_duration: duration,
        content: 'Voice message', // Fallback content for notifications
      });

      return {
        media_url: uploadResult.media_url,
        media_size: uploadResult.media_size,
        media_duration: duration,
        message_id: response.message.id,
      };
    } catch (error) {
      console.error('[VoiceMessageService] Error sending voice message:', error);
      throw error;
    }
  }

  /**
   * Delete voice message from storage
   */
  async deleteVoiceMessage(mediaUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(mediaUrl);
      const pathParts = url.pathname.split('/');
      const bucket = pathParts[2]; // chat-media
      const filePath = pathParts.slice(3).join('/'); // voice-messages/...

      if (bucket !== 'chat-media') {
        console.warn('[VoiceMessageService] Attempted to delete from non-chat-media bucket:', bucket);
        return;
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('[VoiceMessageService] Error deleting voice message:', error);
      }
    } catch (error) {
      console.error('[VoiceMessageService] Error parsing media URL:', error);
    }
  }

  /**
   * Convert base64 to Blob for Supabase upload
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  /**
   * Get voice message duration from file
   */
  async getAudioDuration(uri: string): Promise<number> {
    try {
      // For now, we'll use the duration from the recording hook
      // In a real implementation, you might use expo-av to get duration
      return 0; // Placeholder - actual implementation would use Audio.getDurationAsync()
    } catch (error) {
      console.error('[VoiceMessageService] Error getting audio duration:', error);
      return 0;
    }
  }

  /**
   * Compress audio file if needed
   */
  async compressAudioIfNeeded(
    uri: string,
    maxSizeBytes: number = 10 * 1024 * 1024 // 10MB
  ): Promise<{ uri: string; size: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // If file is already under max size, return as-is
      if (fileInfo.size <= maxSizeBytes) {
        return { uri, size: fileInfo.size };
      }

      // TODO: Implement audio compression
      // This would require a native module or server-side processing
      console.warn('[VoiceMessageService] Audio compression not implemented, file may be too large');

      return { uri, size: fileInfo.size };
    } catch (error) {
      console.error('[VoiceMessageService] Error checking file size:', error);
      return { uri, size: 0 };
    }
  }
}

export default new VoiceMessageService();