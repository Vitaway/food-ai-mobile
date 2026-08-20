import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { KeyboardSafeScreen } from '@/components/ui/KeyboardSafeScreen';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { useToast } from '@/context/ToastContext';
import { useCoachProfileBack } from '@/hooks/useCoachProfileBack';
import { changeCoachPassword } from '@/services/remote/coachApi';

export default function CoachSecurityScreen() {
  const handleBack = useCoachProfileBack();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const handleChangePassword = async () => {
    if (passwordBusy) return;
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New password confirmation does not match.');
      return;
    }

    setPasswordBusy(true);
    try {
      await changeCoachPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated.', 'Saved');
      handleBack();
    } catch (error) {
      toast.error(String(error));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={8}>
      <View className="flex-1 bg-white">
        <ScreenTopBar title="Security" onBack={handleBack} />

        <StackScreenBody>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 px-5 pb-10 pt-5">
            <FieldInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••"
            />
            <FieldInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="At least 8 characters"
            />
            <FieldInput
              label="Confirm new password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              placeholder="Repeat new password"
            />
            <Button
              label={passwordBusy ? 'Updating…' : 'Update password'}
              onPress={() => void handleChangePassword()}
              disabled={passwordBusy}
              fullWidth
              variant="secondary"
            />
          </ScrollView>
        </StackScreenBody>
      </View>
    </KeyboardSafeScreen>
  );
}
