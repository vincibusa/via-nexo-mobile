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
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Eye, EyeOff, Check } from 'lucide-react-native';
import { PasswordStrengthIndicator } from './password-strength-indicator';
import DateTimePicker from '@react-native-community/datetimepicker';

export function SignUpForm() {
  const { colorScheme } = useColorScheme();
  const { signup } = useAuth();
  const router = useRouter();
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  function onDisplayNameSubmitEditing() {
    emailInputRef.current?.focus();
  }

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  function onPasswordSubmitEditing() {
    confirmPasswordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!email || !password || !confirmPassword) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    if (!gender) {
      setError('Seleziona il tuo sesso');
      return;
    }

    if (!dateOfBirth) {
      setError('Inserisci la tua data di nascita');
      return;
    }

    // Validate age >= 18
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError('Devi essere maggiorenne per registrarti');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await signup(email, password, displayName || undefined, gender, dateOfBirth.toISOString());
      if (result.error) {
        setError(result.error);
      } else {
        Alert.alert(
          'Fatto!',
          'Account creato con successo. Controlla la tua email per verificare l\'account.',
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

  // Colore icone basato sul tema
  const iconColor = colorScheme === 'dark' ? '#a3a3a3' : '#737373';

  return (
    <View className="gap-6">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Crea il tuo account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Benvenuto! Compila i dati per iniziare.
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
              <Label htmlFor="displayName">Nome visualizzato (Opzionale)</Label>
              <Input
                id="displayName"
                placeholder="Il tuo nome"
                autoCapitalize="words"
                value={displayName}
                onChangeText={setDisplayName}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={onDisplayNameSubmitEditing}
              />
            </View>
            {/* Gender Selection */}
            <View className="gap-1.5">
              <Label>Sesso</Label>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setGender('Maschio')}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-xl border ${
                    gender === 'Maschio'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted'
                  }`}
                >
                  <Text
                    className={`text-center ${
                      gender === 'Maschio' ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    Maschio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setGender('Femmina')}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-xl border ${
                    gender === 'Femmina'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted'
                  }`}
                >
                  <Text
                    className={`text-center ${
                      gender === 'Femmina' ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    Femmina
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Date of Birth */}
            <View className="gap-1.5">
              <Label>Data di nascita</Label>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                disabled={isLoading}
                className="bg-muted px-4 py-3.5 rounded-xl"
              >
                <Text className={dateOfBirth ? 'text-foreground' : 'text-muted-foreground'}>
                  {dateOfBirth
                    ? new Date(dateOfBirth).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Tocca per selezionare'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDateOfBirth(selectedDate);
                    }
                  }}
                />
              )}
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
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
              <Label htmlFor="password">Password</Label>
              <View className="relative">
                <Input
                  ref={passwordInputRef}
                  id="password"
                  placeholder="Almeno 8 caratteri"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={onPasswordSubmitEditing}
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
              {password.length > 0 && <PasswordStrengthIndicator password={password} />}
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="confirmPassword">Conferma Password</Label>
                {passwordsMatch && (
                  <View className="ml-2">
                    <Check size={16} color="#22c55e" strokeWidth={2} />
                  </View>
                )}
              </View>
              <View className="relative">
                <Input
                  ref={confirmPasswordInputRef}
                  id="confirmPassword"
                  placeholder="Reinserisci la password"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  className="pr-11"
                />
                <Pressable
                  className="absolute right-0 top-0 bottom-0 px-3 justify-center"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showConfirmPassword ? (
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
                  <Text>Creazione in corso...</Text>
                </View>
              ) : (
                <Text>Continua</Text>
              )}
            </Button>
          </View>
          <View className="flex-row items-center justify-center">
            <Text className="text-center text-sm">Hai già un account? </Text>
            <Pressable
              onPress={() => {
                router.push('/(auth)/login');
              }}
              disabled={isLoading}>
              <Text className="text-sm underline underline-offset-4">Accedi</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
