import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export const BIOMETRIC_PROMPT_TITLES: Record<number, string> = {
  [LocalAuthentication.AuthenticationType.FINGERPRINT]: 'Authenticate with fingerprint',
  [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: 'Authenticate with Face ID',
  [LocalAuthentication.AuthenticationType.IRIS]: 'Authenticate with biometrics',
};

export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  return {
    hasHardware,
    isEnrolled,
    supportedTypes,
  };
}

export async function promptBiometricAuth(promptMessage?: string) {
  const capabilities = await getBiometricCapabilities();

  if (!capabilities.hasHardware || !capabilities.isEnrolled || capabilities.supportedTypes.length === 0) {
    return {
      success: false,
      error: 'Biometric authentication is not available on this device',
    };
  }

  const defaultPrompt =
    BIOMETRIC_PROMPT_TITLES[capabilities.supportedTypes[0]] || 'Authenticate to continue';

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage || defaultPrompt,
    fallbackLabel: 'Use device passcode',
    disableDeviceFallback: false,
  });

  return {
    success: result.success,
    ...(result.success === false && { error: result.error }),
  };
}

export function resolvePrimaryBiometricType(
  supportedTypes: LocalAuthentication.AuthenticationType[]
): 'face' | 'fingerprint' | 'iris' | null {
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }

  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }

  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }

  return null;
}


