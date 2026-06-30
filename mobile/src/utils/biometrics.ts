import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricSupport = {
  available: boolean;
  label: string;
};

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  const available = hasHardware && isEnrolled;
  let label = 'Biometrics';

  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    label = 'Face ID';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    label = 'Touch ID';
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    label = 'Iris';
  }

  return { available, label };
}

export async function authenticateWithBiometrics(promptMessage: string) {
  const { available } = await getBiometricSupport();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Use passcode',
    disableDeviceFallback: true,
  });

  return result.success;
}
