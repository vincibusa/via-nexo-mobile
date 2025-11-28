import { useSegments, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getBiometricCapabilities,
  promptBiometricAuth,
  resolvePrimaryBiometricType,
} from '../../lib/biometrics';
import { authService } from '../../lib/services/auth';
import { storage } from '../../lib/storage';
import type {
  BiometricPreference,
  SavedCredentials,
  Session,
  User,
} from '../../lib/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  savedCredentials: SavedCredentials | null;
  biometricPreference: BiometricPreference | null;
  biometricSupported: boolean;
  biometricType: 'face' | 'fingerprint' | 'iris' | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  enableBiometrics: (email: string, password: string) => Promise<{ error?: string }>;
  disableBiometrics: () => Promise<void>;
  refreshBiometricStatus: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  loginWithSavedCredentials: () => Promise<{ error?: string }>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCredentials, setSavedCredentials] = useState<SavedCredentials | null>(null);
  const [biometricPreference, setBiometricPreferenceState] = useState<BiometricPreference | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'iris' | null>(null);
  const segments = useSegments();
  const router = useRouter();

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  useEffect(() => {
    refreshBiometricStatus();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to app tabs after login
      router.replace('/(app)/(tabs)');
    }
  }, [user, segments, isLoading]);

  const loadAuthState = async () => {
    try {
      const [storedUser, storedSession, storedCredentials, storedPreference] = await Promise.all([
        storage.getUser(),
        storage.getSession(),
        storage.getCredentials(),
        storage.getBiometricPreference(),
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

      if (storedCredentials) {
        // Migrazione: se le credenziali hanno refreshToken invece di password, cancellale
        if ('refreshToken' in storedCredentials && !('password' in storedCredentials)) {
          console.log('Found old credentials format with refreshToken, clearing...');
          await Promise.all([
            storage.deleteCredentials(),
            storage.deleteBiometricPreference(),
          ]);
          setSavedCredentials(null);
          setBiometricPreferenceState(null);
        } else if ('password' in storedCredentials) {
          setSavedCredentials(storedCredentials);
          console.log('Loaded saved credentials for biometric login');
        } else {
          // Formato non valido, cancella
          console.log('Invalid credentials format, clearing...');
          await Promise.all([
            storage.deleteCredentials(),
            storage.deleteBiometricPreference(),
          ]);
          setSavedCredentials(null);
          setBiometricPreferenceState(null);
        }
      }

      if (storedPreference) {
        setBiometricPreferenceState(storedPreference);
        console.log('Loaded biometric preference:', storedPreference.enabled);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBiometricStatus = async () => {
    try {
      const capabilities = await getBiometricCapabilities();
      setBiometricSupported(
        capabilities.hasHardware &&
          capabilities.isEnrolled &&
          capabilities.supportedTypes.length > 0
      );
      setBiometricType(resolvePrimaryBiometricType(capabilities.supportedTypes));
    } catch (error) {
      console.error('Failed to fetch biometric capabilities:', error);
      setBiometricSupported(false);
      setBiometricType(null);
    }
  };

  const persistBiometricState = async (email: string, password: string) => {
    if (!password) {
      throw new Error('Missing password for biometric login');
    }

    const credentials: SavedCredentials = {
      email,
      password,
      createdAt: Date.now(),
    };

    const preference: BiometricPreference = {
      enabled: true,
      lastUpdatedAt: Date.now(),
    };

    await Promise.all([
      storage.saveCredentials(credentials),
      storage.saveBiometricPreference(preference),
    ]);

    setSavedCredentials(credentials);
    setBiometricPreferenceState(preference);
    
    console.log('Biometric credentials saved successfully');
  };

  const applyAuthenticatedState = async (authUser: User, authSession: Session) => {
    await Promise.all([storage.saveUser(authUser), storage.saveSession(authSession)]);
    setUser(authUser);
    setSession(authSession);
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await authService.login(email, password);

      if (error) {
        return { error: error.message };
      }

      if (data) {
        await applyAuthenticatedState(data.user, data.session);
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

  const enableBiometrics = async (email: string, password: string) => {
    if (!email || !password) {
      return { error: 'Email and password are required to enable biometrics' };
    }

    try {
      await persistBiometricState(email, password);
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to enable biometrics';
      return { error: message };
    }
  };

  const disableBiometrics = async () => {
    await Promise.all([storage.deleteCredentials(), storage.deleteBiometricPreference()]);
    setSavedCredentials(null);
    setBiometricPreferenceState(null);
  };

  const loginWithSavedCredentials = async () => {
    // Verifica che le credenziali siano nel formato corretto
    if (!savedCredentials?.email || !('password' in savedCredentials) || !savedCredentials.password) {
      console.log('No valid saved credentials available:', { 
        hasEmail: !!savedCredentials?.email,
        hasPassword: savedCredentials && 'password' in savedCredentials,
        credentials: savedCredentials 
      });
      
      // Se ci sono credenziali nel formato vecchio, cancellale
      if (savedCredentials && 'refreshToken' in savedCredentials) {
        console.log('Clearing old credentials format...');
        await Promise.all([
          storage.deleteCredentials(),
          storage.deleteBiometricPreference(),
        ]);
        setSavedCredentials(null);
        setBiometricPreferenceState(null);
      }
      
      return { error: 'No saved credentials available. Please login again and enable biometrics.' };
    }

    console.log('Attempting login with saved credentials for:', savedCredentials.email);
    const { data, error } = await authService.login(
      savedCredentials.email,
      savedCredentials.password
    );

    if (error) {
      console.error('Login with saved credentials failed:', error);
      return { error: error.message };
    }

    if (data) {
      await applyAuthenticatedState(data.user, data.session);
      console.log('Login with saved credentials successful');
      return {};
    }

    return { error: 'Unable to login with saved credentials' };
  };

  const authenticateWithBiometrics = async () => {
    const result = await promptBiometricAuth();
    if (!result.success) {
      return { success: false, error: result.error || 'Biometric authentication failed' };
    }
    return { success: true };
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    console.log('updateUserProfile called with:', updates);
    const updatedUser = { ...user, ...updates };
    console.log('updatedUser:', updatedUser);

    await Promise.all([storage.saveUser(updatedUser), session && storage.saveSession(session)]);
    setUser(updatedUser);

    console.log('User updated in context and storage');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        savedCredentials,
        biometricPreference,
        biometricSupported,
        biometricType,
        login,
        signup,
        logout,
        enableBiometrics,
        disableBiometrics,
        refreshBiometricStatus,
        authenticateWithBiometrics,
        loginWithSavedCredentials,
        updateUserProfile,
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
