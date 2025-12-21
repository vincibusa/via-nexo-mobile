export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  isPrivate?: boolean;
  isVerified?: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SavedCredentials {
  email: string;
  password: string;
  createdAt: number;
}

export interface BiometricPreference {
  enabled: boolean;
  lastUpdatedAt: number;
}

export interface LoginResponse {
  user: User;
  session: Session;
  message: string;
}

export interface SignupResponse {
  user: User;
  message: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: AuthError;
}
