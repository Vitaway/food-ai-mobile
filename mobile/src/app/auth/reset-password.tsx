import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/context/ToastContext';
import {
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyResetCode,
} from '@/services/remote/authApi';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { isPasswordAcceptable } from '@/utils/passwordStrength';

type Step = 'code' | 'password' | 'done';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const { email: emailParam } = useLocalSearchParams<{ email?: string | string[] }>();
  const email = useMemo(() => {
    const raw = Array.isArray(emailParam) ? emailParam[0] : emailParam;
    return raw?.trim() ?? '';
  }, [emailParam]);

  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <AuthScreenShell
        title="Request a code first"
        actions={
          <Button
            label="Send reset code"
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
            Start from the forgot-password screen so we can email you a one-time code.
          </Text>
        </View>
      </AuthScreenShell>
    );
  }

  const handleVerifyCode = async () => {
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6) {
      toast.error('Enter the 6-digit code from your email.', 'Invalid code');
      return;
    }
    setLoading(true);
    try {
      await verifyResetCode(email, normalized);
      setCode(normalized);
      setStep('password');
      toast.success('Code confirmed. Choose a new password.', 'Verified');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Invalid or expired code'), 'Code not accepted');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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
      await resetPasswordWithOtp(email, code, password);
      setStep('done');
      toast.success('You can sign in with your new password.', 'Password updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to reset password'), 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success('If an account exists, we sent a new code.', 'Code resent');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to resend code'), 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <AuthScreenShell
        title="Password updated"
        actions={
          <Button
            label="Sign in"
            onPress={() => router.replace('/auth/login' as Href)}
            fullWidth
            size="lg"
            variant="primary"
          />
        }>
        <View className="rounded-2xl border border-shamrock-200 bg-shamrock-50 px-5 py-5">
          <Text className="font-sans-medium text-base text-shamrock-900">All set</Text>
          <Text className="mt-2 text-sm leading-6 text-shamrock-800">
            Your password has been changed. Sign in to continue.
          </Text>
        </View>
      </AuthScreenShell>
    );
  }

  if (step === 'password') {
    return (
      <AuthScreenShell
        title="Choose a new password"
        actions={
          <Button
            label={loading ? 'Updating…' : 'Update password'}
            onPress={() => void handleResetPassword()}
            disabled={loading || !password || !confirmPassword}
            fullWidth
            size="lg"
            variant="primary"
          />
        }>
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
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title="Enter your code"
      actions={
        <Button
          label={loading ? 'Checking…' : 'Continue'}
          onPress={() => void handleVerifyCode()}
          disabled={loading || code.replace(/\D/g, '').length !== 6}
          fullWidth
          size="lg"
          variant="primary"
        />
      }
      footer={
        <View className="gap-3">
          <Pressable disabled={loading} onPress={() => void handleResend()}>
            <Text className="text-center text-sm text-white/80">
              Didn&apos;t get it? <Text className="font-sans-semibold text-white">Resend code</Text>
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/auth/forgot-password' as Href)}>
            <Text className="text-center text-sm text-white/80">
              Wrong email? <Text className="font-sans-semibold text-white">Start over</Text>
            </Text>
          </Pressable>
        </View>
      }>
      <View className="gap-4">
        <Text className="text-sm leading-6 text-white/80">
          We sent a 6-digit code to {email}. It expires in 10 minutes.
        </Text>
        <FieldInput
          label="Reset code"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          maxLength={6}
          hint="Check your inbox and spam folder."
        />
      </View>
    </AuthScreenShell>
  );
}
