import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/auth';
import type { User } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: User['role'][];
  fallbackRoute?: string;
}

/**
 * ProtectedRoute component that enforces role-based access control
 *
 * Usage:
 * <ProtectedRoute allowedRoles={['manager', 'admin']}>
 *   <ManagerScreen />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackRoute = '/(app)/(tabs)',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if user is not authorized
  useEffect(() => {
    if (!isLoading) {
      if (!user || !allowedRoles.includes(user.role)) {
        router.replace(fallbackRoute);
      }
    }
  }, [user, isLoading, allowedRoles, fallbackRoute, router]);

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Show nothing while redirecting (will be replaced by fallback route)
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  // User is authorized, render children
  return <>{children}</>;
}
