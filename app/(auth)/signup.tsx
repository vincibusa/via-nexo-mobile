import { SignUpForm } from '../../components/sign-up-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function SignupScreen() {
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
        <SignUpForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
