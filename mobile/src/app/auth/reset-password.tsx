import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/context/ToastContext';
import { resetPasswordWithToken } from '@/services/remote/authApi';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { isPasswordAcceptable } from '@/utils/passwordStrength';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>();
  const resetToken = useMemo(() => {
    const raw = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
    return raw?.trim() ?? '';
  }, [tokenParam]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!resetToken) {
      toast.error('This reset link is invalid. Request a new one.', 'Invalid link');
      return;
    }
    if (!isPasswordAcceptable(password)) {
      toast.error('Choose a stronger password (8+ characters with mixed case and a number).');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithToken(resetToken, password);
      setDone(true);
      toast.success('You can sign in with your new password.', 'Password updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to reset password'), 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthScreenShell
        title="Invalid reset link"
        actions={
          <Button
            label="Request a new link"
            onPress={() => router.replace('/auth/forgot-password' as Href)}
            fullWidth
            size="lg"
            variant="primary"
          />
        }
        footer={
          <Pressable onPress={() => router.replace('/auth/login' as Href)}>
            <Text className="text-center text-sm text-white/80">
              Back to <Text className="font-sans-semibold text-white">sign in</Text>
            </Text>
          </Pressable>
        }>
        <View className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-5">
          <Text className="text-sm leading-6 text-orange-900">
            This password reset link is missing or expired. Request a new one from the sign-in screen.
          </Text>
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title="Choose a new password"
      actions={
        done ? (
          <Button
            label="Sign in"
            onPress={() => router.replace('/auth/login' as Href)}
            fullWidth
            size="lg"
            variant="primary"
          />
        ) : (
          <Button
            label={loading ? 'Updating…' : 'Update password'}
            onPress={handleSubmit}
            disabled={loading || !password || !confirmPassword}
            fullWidth
            size="lg"
            variant="primary"
          />
        )
      }
      footer={
        !done ? (
          <Pressable onPress={() => router.replace('/auth/forgot-password' as Href)}>
            <Text className="text-center text-sm text-white/80">
              Need a new link? <Text className="font-sans-semibold text-white">Request reset</Text>
            </Text>
          </Pressable>
        ) : null
      }>
      {done ? (
        <View className="rounded-2xl border border-shamrock-200 bg-shamrock-50 px-5 py-5">
          <Text className="font-sans-medium text-base text-shamrock-900">Password updated</Text>
          <Text className="mt-2 text-sm leading-6 text-shamrock-800">
            Your password has been changed. Sign in to continue.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          <PasswordField
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            textContentType="newPassword"
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />
          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            textContentType="newPassword"
            autoComplete="new-password"
          />
        </View>
      )}
    </AuthScreenShell>
  );
}
