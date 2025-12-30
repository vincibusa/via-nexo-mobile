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
import { Text } from '../components/ui/text';
import { useAuth } from '../lib/contexts/auth';
import { cn } from '../lib/utils';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, type TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Eye, EyeOff } from 'lucide-react-native';

export function SignInForm() {
  const { colorScheme } = useColorScheme();
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

  const [showPassword, setShowPassword] = React.useState(false);

  const biometricLabel =
    biometricType === 'face'
      ? 'Face ID'
      : biometricType === 'fingerprint'
        ? 'impronta digitale'
        : 'autenticazione biometrica';
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
      setError('Compila tutti i campi');
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
        setError(authResult.error ?? 'Autenticazione biometrica fallita');
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

  // Colore icone basato sul tema
  const iconColor = colorScheme === 'dark' ? '#a3a3a3' : '#737373';

  return (
    <View className="gap-6">
      <Card className={cn("border-border/0 sm:border-border shadow-none sm:shadow-sm", colorScheme === 'dark' ? 'sm:shadow-white/5' : 'sm:shadow-black/5')}>
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Accedi al tuo account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Bentornato! Accedi per continuare
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          {error ? (
            <View className="rounded-lg bg-destructive/10 p-3">
              <Text className="text-destructive text-sm">{error}</Text>
            </View>
          ) : null}
          <View className="gap-5">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="mario@esempio.com"
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
                  <Text className="font-normal leading-4">Password dimenticata?</Text>
                </Button>
              </View>
              <View className="relative">
                <Input
                  ref={passwordInputRef}
                  id="password"
                  secureTextEntry={!showPassword}
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  className="pr-11"
                />
                <Pressable
                  className="absolute right-0 top-0 bottom-0 px-3 justify-center"
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={iconColor} strokeWidth={1.5} />
                  ) : (
                    <Eye size={20} color={iconColor} strokeWidth={1.5} />
                  )}
                </Pressable>
              </View>
            </View>
            <Button className="w-full" onPress={onSubmit} disabled={isLoading}>
              {isLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="white" size="small" />
                  <Text>Accesso in corso...</Text>
                </View>
              ) : (
                <Text>Continua</Text>
              )}
            </Button>
            {hasBiometricShortcut ? (
              <View className="gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onPress={onBiometricUnlock}
                  disabled={isBiometricLoading}
                >
                  {isBiometricLoading ? (
                    <ActivityIndicator />
                  ) : (
                    <Text>Sblocca con {biometricLabel}</Text>
                  )}
                </Button>
                <Pressable onPress={onDisableBiometrics} disabled={isBiometricLoading}>
                  <Text className="text-center text-xs text-muted-foreground underline">
                    Disattiva accesso con {biometricLabel}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center justify-center">
            <Text className="text-center text-sm">Non hai un account? </Text>
            <Pressable
              onPress={() => {
                router.push('/(auth)/signup');
              }}
              disabled={isLoading}>
              <Text className="text-sm underline underline-offset-4">Registrati</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
