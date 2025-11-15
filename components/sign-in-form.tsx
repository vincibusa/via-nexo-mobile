import { SocialConnections } from '../components/social-connections';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Text } from '../components/ui/text';
import { useAuth } from '../lib/contexts/auth';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, type TextInput, View } from 'react-native';

export function SignInForm() {
  const {
    login,
    savedCredentials,
    biometricPreference,
    biometricSupported,
    biometricType,
    authenticateWithBiometrics,
    loginWithSavedCredentials,
    disableBiometrics,
    enableBiometrics,
  } = useAuth();
  const router = useRouter();
  const passwordInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = React.useState(false);
  const biometricPromptedRef = React.useRef(false);
  const lastLoginCredentialsRef = React.useRef<{ email: string; password: string } | null>(null);

  const biometricLabel =
    biometricType === 'face'
      ? 'Face ID'
      : biometricType === 'fingerprint'
        ? 'fingerprint'
        : 'biometric authentication';
  const hasBiometricShortcut =
    Boolean(biometricPreference?.enabled && savedCredentials && biometricSupported);

  React.useEffect(() => {
    if (biometricPreference?.enabled && savedCredentials) {
      console.log('Biometric shortcut available:', {
        hasPreference: !!biometricPreference,
        hasCredentials: !!savedCredentials,
        biometricSupported,
        hasShortcut: hasBiometricShortcut,
      });
    }
  }, [biometricPreference, savedCredentials, biometricSupported, hasBiometricShortcut]);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);
    biometricPromptedRef.current = false;
    
    // Salva le credenziali prima del login per usarle dopo
    lastLoginCredentialsRef.current = { email, password };

    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
        lastLoginCredentialsRef.current = null;
        return;
      }

      // Aspetta un po' per assicurarsi che lo stato sia aggiornato
      setTimeout(() => {
        maybePromptBiometricPermission();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }

  function maybePromptBiometricPermission() {
    if (
      biometricPromptedRef.current ||
      !biometricSupported ||
      biometricPreference?.enabled
    ) {
      return;
    }

    const credentials = lastLoginCredentialsRef.current;
    if (!credentials || !credentials.password) {
      return;
    }

    biometricPromptedRef.current = true;

    Alert.alert(
      `Attiva ${biometricLabel}`,
      `Vuoi usare ${biometricLabel} per accedere più rapidamente la prossima volta?`,
      [
        {
          text: 'Non ora',
          style: 'cancel',
          onPress: () => {
            lastLoginCredentialsRef.current = null;
          },
        },
        {
          text: 'Attiva',
          onPress: async () => {
            const result = await enableBiometrics(credentials.email, credentials.password);
            if (result.error) {
              setError(result.error);
            }
            lastLoginCredentialsRef.current = null;
          },
        },
      ]
    );
  }

  async function onBiometricUnlock() {
    setError('');
    setIsBiometricLoading(true);
    try {
      const authResult = await authenticateWithBiometrics();
      if (!authResult.success) {
        setError(authResult.error ?? 'Biometric authentication failed');
        return;
      }

      const loginResult = await loginWithSavedCredentials();
      if (loginResult.error) {
        setError(loginResult.error);
      }
    } finally {
      setIsBiometricLoading(false);
    }
  }

  async function onDisableBiometrics() {
    await disableBiometrics();
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Sign in to your app</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome back! Please sign in to continue
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
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="web:h-fit ml-auto h-4 px-1 py-0 sm:h-4"
                  disabled={isLoading}
                  onPress={() => {
                    // TODO: Navigate to forgot password screen
                  }}>
                  <Text className="font-normal leading-4">Forgot your password?</Text>
                </Button>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text>Continue</Text>}
            </Button>
            {hasBiometricShortcut ? (
              <View className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onPress={onBiometricUnlock}
                  disabled={isBiometricLoading}
                >
                  {isBiometricLoading ? (
                    <ActivityIndicator />
                  ) : (
                    <Text>Unlock with {biometricLabel}</Text>
                  )}
                </Button>
                <Pressable onPress={onDisableBiometrics} disabled={isBiometricLoading}>
                  <Text className="text-center text-xs text-muted-foreground underline">
                    Disable {biometricLabel} login
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center justify-center">
            <Text className="text-center text-sm">Don&apos;t have an account? </Text>
            <Pressable
              onPress={() => {
                router.push('/(auth)/signup');
              }}
              disabled={isLoading}>
              <Text className="text-sm underline underline-offset-4">Sign up</Text>
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
