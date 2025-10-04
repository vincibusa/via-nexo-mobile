import { SignUpForm } from '../../components/sign-up-form';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function SignupScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <SignUpForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
