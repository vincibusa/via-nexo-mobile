import { SignInForm } from '../../components/sign-in-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function LoginScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="bg-background"
        contentContainerClassName="flex-1 justify-center bg-background p-6"
        keyboardShouldPersistTaps="handled"
      >
        <SignInForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
