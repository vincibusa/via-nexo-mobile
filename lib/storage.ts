import * as SecureStore from 'expo-secure-store';
import type { Session, User } from './types/auth';

const KEYS = {
  SESSION: 'auth_session',
  USER: 'auth_user',
} as const;

export const storage = {
  // Session management
  async saveSession(session: Session): Promise<void> {
    await SecureStore.setItemAsync(KEYS.SESSION, JSON.stringify(session));
  },

  async getSession(): Promise<Session | null> {
    const session = await SecureStore.getItemAsync(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  async deleteSession(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.SESSION);
  },

  // User management
  async saveUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const user = await SecureStore.getItemAsync(KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  async deleteUser(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.USER);
  },

  // Clear all auth data
  async clear(): Promise<void> {
    await Promise.all([this.deleteSession(), this.deleteUser()]);
  },
};
