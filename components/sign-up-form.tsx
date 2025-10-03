import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/contexts/auth';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';

export function SignUpForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onPasswordSubmitEditing() {
    confirmPasswordInputRef.current?.focus();
  }

  async function onSubmit() {
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
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          {error ? (
            <View className="rounded-lg bg-destructive/10 p-3">
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          ) : null}
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                autoCapitalize="words"
                value={displayName}
                onChangeText={setDisplayName}
                editable={!isLoading}
                returnKeyType="next"
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordInputRef}
                id="password"
                placeholder="At least 8 characters"
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={onPasswordSubmitEditing}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                ref={confirmPasswordInputRef}
                id="confirmPassword"
                placeholder="Re-enter your password"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text>Continue</Text>}
            </Button>
          </View>
          <View className="flex-row items-center justify-center">
            <Text className="text-center text-sm">Already have an account? </Text>
            <Pressable
              onPress={() => {
                router.push('/(auth)/login');
              }}
              disabled={isLoading}>
              <Text className="text-sm underline underline-offset-4">Sign in</Text>
            </Pressable>
          </View>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
