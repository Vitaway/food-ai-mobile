import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { PasscodePad } from '@/components/security/PasscodePad';
import { Button } from '@/components/ui/Button';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import { useAppLock } from '@/context/AppLockContext';

type Step = 'overview' | 'create' | 'confirm' | 'disable' | 'change-current' | 'change-new' | 'change-confirm';

const STEP_TITLES: Record<Step, string> = {
  overview: 'Security',
  create: 'New passcode',
  confirm: 'Confirm',
  disable: 'Turn off',
  'change-current': 'Current passcode',
  'change-new': 'New passcode',
  'change-confirm': 'Confirm',
};

export default function SecurityScreen() {
  const router = useRouter();
  const {
    isEnabled,
    biometricsEnabled,
    biometricsAvailable,
    biometricLabel,
    enableLock,
    disableLock,
    changePasscode,
    verifyPasscode,
    setBiometricsEnabled,
  } = useAppLock();
  const [step, setStep] = useState<Step>('overview');
  const [pin, setPin] = useState('');
  const [draftPin, setDraftPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    setPin('');
    setPinError('');
  }, [step]);

  const finishEnable = async (confirmed: string) => {
    if (confirmed !== draftPin) {
      Alert.alert('Passcodes do not match');
      setStep('create');
      setDraftPin('');
      setPin('');
      return;
    }
    await enableLock(confirmed);
    setStep('overview');
    setDraftPin('');
  };

  const handleCreateComplete = () => {
    if (pin.length < 4) return;
    setDraftPin(pin);
    setStep('confirm');
    setPin('');
  };

  const handleConfirmComplete = () => {
    if (pin.length < 4) return;
    finishEnable(pin);
  };

  const handleDisableComplete = async () => {
    if (pin.length < 4) return;
    const ok = await disableLock(pin);
    if (!ok) {
      setPinError('Incorrect passcode');
      setPin('');
      return;
    }
    setStep('overview');
  };

  const handleChangeCurrent = async () => {
    if (pin.length < 4) return;
    const valid = await verifyPasscode(pin);
    if (!valid) {
      setPinError('Incorrect passcode');
      setPin('');
      return;
    }
    setCurrentPin(pin);
    setPinError('');
    setStep('change-new');
    setPin('');
  };

  const handleChangeNew = () => {
    if (pin.length < 4) return;
    setDraftPin(pin);
    setStep('change-confirm');
    setPin('');
  };

  const handleChangeConfirm = async () => {
    if (pin.length < 4) return;
    if (pin !== draftPin) {
      setStep('change-new');
      setDraftPin('');
      setPin('');
      return;
    }
    const ok = await changePasscode(currentPin, pin);
    if (!ok) {
      setPinError('Incorrect passcode');
      setStep('change-current');
      setCurrentPin('');
      setPin('');
      return;
    }
    setStep('overview');
    setDraftPin('');
    setCurrentPin('');
  };

  const handleToggleBiometrics = async () => {
    if (bioLoading) return;
    setBioLoading(true);
    try {
      const next = !biometricsEnabled;
      const ok = await setBiometricsEnabled(next);
      if (!ok && next) {
        Alert.alert(`${biometricLabel} not verified`, 'Try again or keep passcode only.');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'overview') router.back();
    else setStep('overview');
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenTopBar title={STEP_TITLES[step]} onBack={handleBack} />

      <StackScreenBody>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          {step === 'overview' ? (
            <>
              <View className="flex-row items-center justify-between rounded-2xl border border-ash-grey-100 px-4 py-4">
                <Text className="font-sans-semibold text-neutral-900">Passcode</Text>
                <Text className={`font-sans-semibold ${isEnabled ? 'text-shamrock-700' : 'text-neutral-400'}`}>
                  {isEnabled ? 'On' : 'Off'}
                </Text>
              </View>

              {isEnabled && biometricsAvailable ? (
                <Pressable
                  onPress={handleToggleBiometrics}
                  disabled={bioLoading}
                  className="flex-row items-center justify-between rounded-2xl border border-ash-grey-100 px-4 py-4">
                  <Text className="font-sans-semibold text-neutral-900">{biometricLabel}</Text>
                  <Text
                    className={`font-sans-semibold ${
                      biometricsEnabled ? 'text-shamrock-700' : 'text-neutral-400'
                    }`}>
                    {bioLoading ? '…' : biometricsEnabled ? 'On' : 'Off'}
                  </Text>
                </Pressable>
              ) : null}

              {!isEnabled ? (
                <Button label="Enable passcode" onPress={() => setStep('create')} />
              ) : (
                <View className="gap-3">
                  <Button label="Change passcode" variant="outline" onPress={() => setStep('change-current')} />
                  <Button label="Turn off" variant="ghost" onPress={() => setStep('disable')} />
                </View>
              )}
            </>
          ) : (
            <View className="rounded-2xl border border-ash-grey-100 px-3 py-6">
              {pinError ? (
                <Text className="mb-4 text-center text-sm text-cinnamon-wood-600">{pinError}</Text>
              ) : null}
              <PasscodePad
                value={pin}
                onChange={(value) => {
                  setPin(value);
                  if (pinError) setPinError('');
                }}
              />
              {pin.length === 4 ? (
                <View className="mt-6 px-1">
                  <Button
                    label="Continue"
                    onPress={() => {
                      if (step === 'create') handleCreateComplete();
                      else if (step === 'confirm') handleConfirmComplete();
                      else if (step === 'disable') handleDisableComplete();
                      else if (step === 'change-current') handleChangeCurrent();
                      else if (step === 'change-new') handleChangeNew();
                      else if (step === 'change-confirm') handleChangeConfirm();
                    }}
                  />
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </StackScreenBody>
    </View>
  );
}
