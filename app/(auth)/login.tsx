import { useState } from 'react';
import { View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/contexts/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold">Welcome Back</Text>
            <Text className="text-muted-foreground">
              Sign in to your account to continue
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="rounded-lg bg-destructive/10 p-3">
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium">Email</Text>
              <Input
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">Password</Text>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
              />
            </View>

            <Button onPress={handleLogin} disabled={isLoading} className="mt-2">
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text>Sign In</Text>
              )}
            </Button>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-muted-foreground">Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <Button variant="link" size="sm">
                <Text>Sign Up</Text>
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
