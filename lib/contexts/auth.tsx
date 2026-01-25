import { useSegments, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  getBiometricCapabilities,
  promptBiometricAuth,
  resolvePrimaryBiometricType,
} from '../../lib/biometrics';
import { authService } from '../../lib/services/auth';
import { storage } from '../../lib/storage';
import { notificationsService } from '../../lib/services/notifications';
import type {
  BiometricPreference,
  SavedCredentials,
  Session,
  User,
} from '../../lib/types/auth';

// Refresh token 5 minutes before expiry
const REFRESH_THRESHOLD_SECONDS = 5 * 60;

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
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<{ success: boolean; session?: Session; user?: User }> | null>(null);

  // Refresh session using refresh token
  const refreshSession = useCallback(async (): Promise<{ success: boolean; session?: Session; user?: User }> => {
    // If a refresh is already in progress, return the existing promise
    if (refreshPromiseRef.current) {
      console.log('Refresh already in progress, returning existing promise...');
      return refreshPromiseRef.current;
    }

    // Create the refresh promise
    const doRefresh = async (): Promise<{ success: boolean; session?: Session; user?: User }> => {
      try {
        // Always read from storage as the single source of truth
        const currentSession = await storage.getSession();

        if (!currentSession?.refreshToken) {
          console.log('No refresh token in storage');
          return { success: false };
        }

        console.log('Attempting to refresh session...');
        const { data, error } = await authService.refreshToken(currentSession.refreshToken);

        if (error || !data) {
          // Check if this is an "already used" error - try to recover
          if (error?.message?.toLowerCase().includes('already used') ||
              error?.code === 'AUTH_REFRESH_FAILED') {
            console.log('Refresh token already used, checking for updated session...');
            // Another refresh may have succeeded - re-read storage
            const updatedSession = await storage.getSession();
            if (updatedSession && updatedSession.refreshToken !== currentSession.refreshToken) {
              // Storage was updated by another caller - return the new session
              const updatedUser = await storage.getUser();
              if (updatedUser) {
                console.log('Found updated session in storage, using it');
                return { success: true, session: updatedSession, user: updatedUser };
              }
            }
          }
          console.log('Session refresh failed:', error?.message);
          return { success: false };
        }

        console.log('Session refreshed successfully');

        // Save to storage immediately
        await Promise.all([
          storage.saveUser(data.user),
          storage.saveSession(data.session),
        ]);

        return {
          success: true,
          session: data.session,
          user: data.user,
        };
      } catch (error) {
        console.error('Error refreshing session:', error);
        return { success: false };
      } finally {
        // Clear the promise ref so future refreshes can proceed
        refreshPromiseRef.current = null;
      }
    };

    // Store the promise and return it
    refreshPromiseRef.current = doRefresh();
    return refreshPromiseRef.current;
  }, []);

  // Schedule proactive token refresh
  const scheduleTokenRefresh = useCallback((session: Session) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const now = Date.now() / 1000;
    const expiresIn = session.expiresAt - now;
    const refreshIn = expiresIn - REFRESH_THRESHOLD_SECONDS;

    if (refreshIn <= 0) {
      // Token already expired or about to expire, refresh immediately
      console.log('Token expired or expiring soon, refreshing now...');
      refreshSession().then((result) => {
        if (result.success && result.session && result.user) {
          setUser(result.user);
          setSession(result.session);
          scheduleTokenRefresh(result.session);
        } else {
          // Refresh failed, logout user
          console.log('Proactive refresh failed, logging out...');
          storage.clear();
          setUser(null);
          setSession(null);
        }
      });
      return;
    }

    console.log(`Scheduling token refresh in ${Math.round(refreshIn / 60)} minutes`);

    refreshTimerRef.current = setTimeout(async () => {
      const result = await refreshSession();
      if (result.success && result.session && result.user) {
        setUser(result.user);
        setSession(result.session);
        scheduleTokenRefresh(result.session);
      } else {
        console.log('Scheduled refresh failed, logging out...');
        await storage.clear();
        setUser(null);
        setSession(null);
      }
    }, refreshIn * 1000);
  }, [refreshSession]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - clear timer to avoid stale token usage
        if (refreshTimerRef.current) {
          console.log('App going to background, clearing refresh timer');
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        return;
      }

      if (nextAppState === 'active') {
        // App came to foreground - read fresh session from storage
        const currentSession = await storage.getSession();

        if (!currentSession?.refreshToken) {
          return;
        }

        const now = Date.now() / 1000;
        const expiresIn = currentSession.expiresAt - now;

        if (expiresIn <= REFRESH_THRESHOLD_SECONDS) {
          console.log('App resumed, token expiring soon, refreshing...');
          const result = await refreshSession();
          if (result.success && result.session && result.user) {
            setUser(result.user);
            setSession(result.session);
            scheduleTokenRefresh(result.session);
          } else {
            // Refresh failed, force logout
            await storage.clear();
            setUser(null);
            setSession(null);
          }
        } else {
          // Token still valid, update state and reschedule refresh
          console.log('App resumed with valid token, updating state from storage');
          const currentUser = await storage.getUser();
          if (currentUser) {
            console.log('Updating user and session state on resume');
            setUser(currentUser);
            setSession(currentSession);
          } else {
            console.warn('No user in storage but session exists - this should not happen!');
          }
          scheduleTokenRefresh(currentSession);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshSession, scheduleTokenRefresh]);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
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
        const now = Date.now() / 1000;
        const expiresIn = storedSession.expiresAt - now;

        if (expiresIn > REFRESH_THRESHOLD_SECONDS) {
          // Token is valid, use it and schedule refresh
          console.log('Session valid, scheduling refresh...');
          console.log('Setting user and session from storage - token expires in', Math.round(expiresIn / 60), 'minutes');
          setUser(storedUser);
          setSession(storedSession);
          scheduleTokenRefresh(storedSession);

          // Re-register push token on app startup (non-blocking)
          notificationsService.registerPushToken(storedSession.accessToken).catch((err) => {
            console.log('Failed to register push token on startup:', err);
          });
        } else if (storedSession.refreshToken) {
          // Token expired or expiring soon, try to refresh
          console.log('Session expired or expiring, attempting refresh...');
          const result = await refreshSession();

          if (result.success && result.session && result.user) {
            console.log('Session refreshed on app start');
            // Storage already saved by refreshSession
            setUser(result.user);
            setSession(result.session);
            scheduleTokenRefresh(result.session);
          } else {
            // Refresh failed, clear storage and force re-login
            console.log('Session refresh failed, clearing storage...');
            await storage.clear();
          }
        } else {
          // No refresh token, clear storage
          console.log('No refresh token available, clearing storage...');
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

  const persistBiometricState = async (email: string, userId: string, refreshToken: string) => {
    if (!refreshToken) {
      throw new Error('Missing refresh token for biometric login');
    }

    // SECURITY: We store only the refresh token (never the password)
    // Biometric unlock will use the refresh token to get a new access token
    const credentials: SavedCredentials = {
      email,
      userId,
      refreshToken,
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

    console.log('Biometric state saved successfully (refresh token only)');
  };

  const applyAuthenticatedState = async (authUser: User, authSession: Session) => {
    await Promise.all([storage.saveUser(authUser), storage.saveSession(authSession)]);
    setUser(authUser);
    setSession(authSession);
    // Schedule token refresh after successful login
    scheduleTokenRefresh(authSession);

    // Register push token for notifications (non-blocking)
    notificationsService.registerPushToken(authSession.accessToken).catch((err) => {
      console.log('Failed to register push token:', err);
    });
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
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

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

  const enableBiometrics = async (email?: string, password?: string) => {
    // Use current session if available, otherwise use provided credentials
    // New behavior: Store refresh token only (never password)

    if (!user) {
      return { error: 'Must be logged in to enable biometrics' };
    }

    if (!session?.refreshToken) {
      return { error: 'Invalid session. Please login again.' };
    }

    try {
      // SECURITY: Store only refresh token, never password
      await persistBiometricState(user.email, user.id, session.refreshToken);
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
    // Verify credentials have refresh token (not password)
    if (!savedCredentials?.email || !savedCredentials?.refreshToken) {
      console.log('No valid saved credentials available:', {
        hasEmail: !!savedCredentials?.email,
        hasRefreshToken: !!savedCredentials?.refreshToken,
      });

      return { error: 'No saved credentials available. Please login again and enable biometrics.' };
    }

    console.log('Attempting login with biometric saved credentials for:', savedCredentials.email);

    // Use refresh token to get new access token (NO password needed!)
    const { data, error } = await authService.refreshToken(savedCredentials.refreshToken);

    if (error) {
      console.error('Biometric login with refresh token failed:', error);
      return { error: error.message };
    }

    if (data) {
      await applyAuthenticatedState(data.user, data.session);
      console.log('Biometric login with refresh token successful');
      return {};
    }

    return { error: 'Unable to login with biometric credentials' };
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
