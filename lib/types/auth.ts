export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'manager';
  displayName?: string;
  avatarUrl?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
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
