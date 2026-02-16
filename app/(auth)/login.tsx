import { SignInForm } from '../../components/sign-in-form';
import { GlassSurface } from '../../components/glass';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useColorScheme } from 'nativewind';

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const authSurfaceStyle = isDark
    ? styles.authSurface
    : { ...styles.authSurface, ...styles.authSurfaceLight };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 bg-background">
        <View
          pointerEvents="none"
          style={[
            styles.topGlow,
            { backgroundColor: isDark ? 'rgba(77, 167, 255, 0.14)' : 'rgba(77, 167, 255, 0.10)' },
          ]}
        />
        <ScrollView
          className="bg-background"
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <GlassSurface
            variant="card"
            intensity={isDark ? 'regular' : 'light'}
            tint={isDark ? 'prominent' : 'light'}
            style={authSurfaceStyle}
          >
            <SignInForm />
          </GlassSurface>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  authSurface: {
    borderRadius: 28,
    padding: 8,
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 24,
    elevation: 18,
  },
  authSurfaceLight: {
    borderColor: 'rgba(15, 23, 42, 0.10)',
    shadowOpacity: 0.12,
  },
  topGlow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 999,
  },
});
