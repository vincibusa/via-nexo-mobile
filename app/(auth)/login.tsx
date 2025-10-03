import { SignInForm } from '@/components/sign-in-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function LoginScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <SignInForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
