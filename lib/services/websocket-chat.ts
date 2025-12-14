/**
 * WebSocket Chat Service for Real-Time Direct Messaging
 * FASE 3G: Integrare mobile app con WebSocket chat
 *
 * Fornisce connessione WebSocket per messaggi diretti in tempo reale
 */

import { API_CONFIG } from '../config';
import type { Message } from '../types/messaging';

class WebSocketChatService {
  private ws: WebSocket | null = null;
  private url: string;
  private conversationId: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Array<(message: Message) => void> = [];
  private connectionHandlers: Array<(connected: boolean) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];

  constructor() {
    // Extract WebSocket URL from API config (convert http/https to ws/wss)
    const baseUrl = API_CONFIG.BASE_URL;
    this.url = baseUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:');
  }

  /**
   * Connetti a una conversazione WebSocket
   */
  connect(
    conversationId: string,
    onMessage?: (message: Message) => void,
    onConnect?: (connected: boolean) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.conversationId = conversationId;

        // Register handlers
        if (onMessage) {
          this.messageHandlers.push(onMessage);
        }
        if (onConnect) {
          this.connectionHandlers.push(onConnect);
        }
        if (onError) {
          this.errorHandlers.push(onError);
        }

        // Build WebSocket URL
        const wsUrl = `${this.url}/api/chat/ws?conversation_id=${conversationId}`;

        console.log('[WebSocketChat] Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocketChat] Connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as Message;
            console.log('[WebSocketChat] Message received:', message);
            this.notifyMessageHandlers(message);
          } catch (error) {
            console.error('[WebSocketChat] Error parsing message:', error);
          }
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket error');
          console.error('[WebSocketChat] Error:', error);
          this.notifyErrorHandlers(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocketChat] Connection closed');
          this.notifyConnectionHandlers(false);
          this.attemptReconnect();
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        reject(err);
      }
    });
  }

  /**
   * Invia un messaggio attraverso WebSocket
   */
  sendMessage(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        const message = {
          type: 'message',
          conversation_id: this.conversationId,
          content,
          timestamp: new Date().toISOString(),
        };

        console.log('[WebSocketChat] Sending message:', message);
        this.ws.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnetti dalla conversazione WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('[WebSocketChat] Disconnecting');
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.errorHandlers = [];
  }

  /**
   * Controlla se è connesso
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Attendi la connessione
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketChat] Max reconnect attempts reached');
      const error = new Error('Failed to reconnect after max attempts');
      this.notifyErrorHandlers(error);
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocketChat] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (this.conversationId) {
        this.connect(this.conversationId).catch((error) => {
          console.error('[WebSocketChat] Reconnection failed:', error);
        });
      }
    }, this.reconnectDelay);
  }

  /**
   * Notifica tutti gli handler di messaggio
   */
  private notifyMessageHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('[WebSocketChat] Error in message handler:', error);
      }
    });
  }

  /**
   * Notifica tutti gli handler di connessione
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[WebSocketChat] Error in connection handler:', error);
      }
    });
  }

  /**
   * Notifica tutti gli handler di errore
   */
  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (e) {
        console.error('[WebSocketChat] Error in error handler:', e);
      }
    });
  }
}

export const webSocketChatService = new WebSocketChatService();
