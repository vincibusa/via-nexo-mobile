import { useSegments, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/lib/services/auth';
import { storage } from '@/lib/storage';
import type { User, Session } from '@/lib/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to app if authenticated
      router.replace('/(app)');
    }
  }, [user, segments, isLoading]);

  const loadAuthState = async () => {
    try {
      const [storedUser, storedSession] = await Promise.all([
        storage.getUser(),
        storage.getSession(),
      ]);

      if (storedUser && storedSession) {
        // Check if token is expired
        if (storedSession.expiresAt > Date.now() / 1000) {
          setUser(storedUser);
          setSession(storedSession);
        } else {
          // Token expired, clear storage
          await storage.clear();
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await authService.login(email, password);

      if (error) {
        return { error: error.message };
      }

      if (data) {
        await storage.saveUser(data.user);
        await storage.saveSession(data.session);
        setUser(data.user);
        setSession(data.session);
        return {};
      }

      return { error: 'Login failed' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await authService.signup(email, password, displayName);

      if (error) {
        return { error: error.message };
      }

      if (data) {
        // Signup successful, redirect to login
        return {};
      }

      return { error: 'Signup failed' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  };

  const logout = async () => {
    try {
      if (session?.accessToken) {
        await authService.logout(session.accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.clear();
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
