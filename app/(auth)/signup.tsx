import { useState } from 'react';
import { View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/contexts/auth';

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signup(email, password, displayName || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        // Show success message
        Alert.alert(
          'Success!',
          'Account created successfully. Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
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
            <Text className="text-3xl font-bold">Create Account</Text>
            <Text className="text-muted-foreground">
              Sign up to get started with NEXO
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
              <Text className="text-sm font-medium">Display Name (Optional)</Text>
              <Input
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

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
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isLoading}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">Confirm Password</Text>
              <Input
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isLoading}
              />
            </View>

            <Button onPress={handleSignup} disabled={isLoading} className="mt-2">
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text>Create Account</Text>
              )}
            </Button>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-muted-foreground">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Button variant="link" size="sm">
                <Text>Sign In</Text>
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
