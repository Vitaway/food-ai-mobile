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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success(
        `If an account exists for ${email.trim()}, we sent a 6-digit code.`,
        'Check your inbox',
      );
      router.push({
        pathname: '/auth/reset-password',
        params: { email: email.trim() },
      } as Href);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to send reset code'), 'Reset unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title="Reset password"
      actions={
        <Button
          label={loading ? 'Sending…' : 'Send reset code'}
          onPress={() => void handleSubmit()}
          disabled={loading || !email.trim()}
          fullWidth
          size="lg"
          variant="primary"
        />
      }
      footer={
        <Pressable onPress={() => router.replace('/auth/login' as Href)}>
          <Text className="text-center text-sm text-white/80">
            Remember your password? <Text className="font-sans-semibold text-white">Sign in</Text>
          </Text>
        </Pressable>
      }>
      <View className="gap-4">
        <FieldInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@vitaway.org"
          hint="We'll email a one-time code. Enter it in the app — no link needed."
        />
      </View>
    </AuthScreenShell>
  );
}
