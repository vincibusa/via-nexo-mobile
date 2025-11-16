import { SignInForm } from '../../components/sign-in-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';
import { cn } from '../../lib/utils';

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName={cn("flex-1 justify-center p-6", colorScheme === 'dark' ? 'bg-background' : 'bg-background')}
        keyboardShouldPersistTaps="handled"
      >
        <SignInForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
