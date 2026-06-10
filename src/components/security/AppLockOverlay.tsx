import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PasscodePad } from '@/components/security/PasscodePad';
import { AppLogo } from '@/components/ui/AppLogo';
import { Text } from '@/components/ui/Text';
import { BRAND_NAVY } from '@/constants/brand';
import { APP_NAME } from '@/constants/site';
import { useAppLock } from '@/context/AppLockContext';
import { palette } from '@/design-system/colors';

export function AppLockOverlay() {
  const insets = useSafeAreaInsets();
  const {
    isReady,
    isEnabled,
    isLocked,
    biometricsEnabled,
    biometricLabel,
    unlock,
    unlockWithBiometrics,
  } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!isLocked) {
      setPin('');
      setError('');
      promptedRef.current = false;
    }
  }, [isLocked]);

  const tryBiometricUnlock = useCallback(async () => {
    if (!biometricsEnabled) return;
    const success = await unlockWithBiometrics();
    if (!success) {
      setError(`Use your passcode or try ${biometricLabel} again.`);
    }
  }, [biometricLabel, biometricsEnabled, unlockWithBiometrics]);

  useEffect(() => {
    if (!isLocked || !biometricsEnabled || promptedRef.current) return;
    promptedRef.current = true;
    const timer = setTimeout(() => {
      tryBiometricUnlock();
    }, 400);
    return () => clearTimeout(timer);
  }, [isLocked, biometricsEnabled, tryBiometricUnlock]);

  useEffect(() => {
    if (pin.length < 4) return;

    unlock(pin).then((valid) => {
      if (!valid) {
        setError('Incorrect passcode. Try again.');
        setPin('');
      }
    });
  }, [pin, unlock]);

  if (!isReady || !isEnabled || !isLocked) return null;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen">
      <LinearGradient
        colors={[BRAND_NAVY, '#1A3A5C', '#21466B']}
        style={{ flex: 1, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
        <View className="flex-1">
          <AppLogo size={72} className="mb-6" />
          <Text className="font-sans-bold text-3xl text-white">{APP_NAME} is locked</Text>
          <Text className="mt-2 text-base text-white/80">
            {biometricsEnabled ? `Use ${biometricLabel} or your passcode` : 'Enter your passcode'}
          </Text>

          <View className="mt-12 flex-1 justify-center rounded-3xl bg-white px-5 py-8">
            {error ? <Text className="mb-4 text-center text-sm text-cinnamon-wood-600">{error}</Text> : null}

            {biometricsEnabled ? (
              <Pressable
                onPress={tryBiometricUnlock}
                className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-spruce-50 py-3.5">
                <Ionicons name="finger-print-outline" size={22} color={palette['blue-spruce'][700]} />
                <Text className="font-sans-semibold text-blue-spruce-800">Unlock with {biometricLabel}</Text>
              </Pressable>
            ) : null}

            <PasscodePad value={pin} onChange={setPin} />
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}
