import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { getAuthenticatedClient } from '../supabase/client';
import { storage } from '../storage';
import MessagingService from './messaging';
import type { Message } from '../types/messaging';

const STORAGE_BUCKET = 'chat-media';
const MAX_IMAGE_DIMENSION = 1200;
const IMAGE_QUALITY = 0.7;
const THUMBNAIL_SIZE = 150;
const THUMBNAIL_QUALITY = 0.6;

interface ImageUploadResult {
  media_url: string;
  thumbnail_url: string;
  media_size: number;
}

interface CompressedImage {
  uri: string;
  width: number;
  height: number;
}

class ImageMessageService {
  /**
   * Compress an image to reduce file size
   */
  async compressImage(uri: string, quality: number = IMAGE_QUALITY): Promise<CompressedImage> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_IMAGE_DIMENSION } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Impossibile comprimere l\'immagine');
    }
  }

  /**
   * Create a thumbnail from an image
   */
  async createThumbnail(uri: string, size: number = THUMBNAIL_SIZE): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: size, height: size } }],
        {
          compress: THUMBNAIL_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new Error('Impossibile creare la miniatura');
    }
  }

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(
    conversationId: string,
    imageUri: string
  ): Promise<ImageUploadResult> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        throw new Error('Sessione non valida');
      }

      const supabase = getAuthenticatedClient(session.accessToken);

      // Compress the main image
      const compressed = await this.compressImage(imageUri);

      // Create thumbnail
      const thumbnailUri = await this.createThumbnail(imageUri);

      // Generate unique filenames
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const mainFilename = `images/${conversationId}/${timestamp}_${random}.jpg`;
      const thumbFilename = `images/${conversationId}/thumb_${timestamp}_${random}.jpg`;

      // Read files as base64
      const mainBase64 = await FileSystem.readAsStringAsync(compressed.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const thumbBase64 = await FileSystem.readAsStringAsync(thumbnailUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get file size
      const mainFileInfo = await FileSystem.getInfoAsync(compressed.uri);
      const mediaSize = mainFileInfo.exists ? (mainFileInfo as any).size || 0 : 0;

      // Upload main image
      const { error: mainError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(mainFilename, decode(mainBase64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (mainError) {
        console.error('Error uploading main image:', mainError);
        throw new Error('Impossibile caricare l\'immagine');
      }

      // Upload thumbnail
      const { error: thumbError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(thumbFilename, decode(thumbBase64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (thumbError) {
        console.error('Error uploading thumbnail:', thumbError);
        // Don't fail if thumbnail upload fails, continue with main image
      }

      // Get public URLs
      const { data: mainUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(mainFilename);

      const { data: thumbUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(thumbFilename);

      // Cleanup temporary files
      try {
        await FileSystem.deleteAsync(compressed.uri, { idempotent: true });
        await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }

      return {
        media_url: mainUrlData.publicUrl,
        thumbnail_url: thumbUrlData.publicUrl,
        media_size: mediaSize,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Send a single image message
   */
  async sendImageMessage(
    conversationId: string,
    imageUri: string
  ): Promise<Message> {
    try {
      const uploadResult = await this.uploadImage(conversationId, imageUri);

      const response = await MessagingService.sendMessage(conversationId, {
        message_type: 'image',
        media_url: uploadResult.media_url,
        media_thumbnail_url: uploadResult.thumbnail_url,
        media_size: uploadResult.media_size,
      });

      return response.message;
    } catch (error) {
      console.error('Error sending image message:', error);
      throw new Error('Impossibile inviare l\'immagine');
    }
  }

  /**
   * Send multiple image messages
   */
  async sendImageMessages(
    conversationId: string,
    imageUris: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Message[]> {
    const messages: Message[] = [];
    const total = imageUris.length;

    for (let i = 0; i < imageUris.length; i++) {
      try {
        const message = await this.sendImageMessage(conversationId, imageUris[i]);
        messages.push(message);
        onProgress?.(i + 1, total);
      } catch (error) {
        console.error(`Error sending image ${i + 1}/${total}:`, error);
        // Continue with other images even if one fails
      }
    }

    if (messages.length === 0) {
      throw new Error('Impossibile inviare le immagini');
    }

    return messages;
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(mediaUrl: string): Promise<void> {
    try {
      const session = await storage.getSession();
      if (!session?.accessToken) {
        throw new Error('Sessione non valida');
      }

      const supabase = getAuthenticatedClient(session.accessToken);

      // Extract path from URL
      const url = new URL(mediaUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/chat-media\/(.+)/);

      if (!pathMatch) {
        console.warn('Could not extract path from URL:', mediaUrl);
        return;
      }

      const filePath = pathMatch[1];

      // Delete main image
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
      }

      // Try to delete thumbnail too
      const thumbPath = filePath.replace(/\/([^/]+)\.jpg$/, '/thumb_$1.jpg');
      await supabase.storage.from(STORAGE_BUCKET).remove([thumbPath]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}

export const imageMessageService = new ImageMessageService();
export default imageMessageService;
