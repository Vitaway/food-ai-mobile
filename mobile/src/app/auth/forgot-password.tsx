import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/context/ToastContext';
import { requestPasswordReset } from '@/services/remote/authApi';
import { getApiErrorMessage } from '@/utils/apiErrors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success(
        `If an account exists for ${email.trim()}, we sent reset instructions.`,
        'Check your inbox',
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to send reset link'), 'Reset unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title="Reset password"
      actions={
        sent ? null : (
          <Button
            label={loading ? 'Sending…' : 'Send reset link'}
            onPress={handleSubmit}
            disabled={loading || !email.trim()}
            fullWidth
            size="lg"
            variant="primary"
          />
        )
      }
      footer={
        <Pressable onPress={() => router.replace('/auth/login' as Href)}>
          <Text className="text-center text-sm text-white/80">
            Remember your password? <Text className="font-sans-semibold text-white">Sign in</Text>
          </Text>
        </Pressable>
      }>
      {sent ? (
        <View className="rounded-2xl border border-shamrock-200 bg-shamrock-50 px-5 py-5">
          <Text className="font-sans-medium text-base text-shamrock-900">Check your inbox</Text>
          <Text className="mt-2 text-sm leading-6 text-shamrock-800">
            If an account exists for {email.trim()}, we sent password reset instructions. Open the link in
            the email on this phone to reset your password in the app.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          <FieldInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@vitaway.org"
            hint="We'll send a reset link if this email is registered."
          />
        </View>
      )}
    </AuthScreenShell>
  );
}
