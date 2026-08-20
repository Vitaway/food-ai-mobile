import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { AppleAuthButtons } from '@/components/auth/AppleAuthButtons';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MfaRequiredError, WrongAppRoleError } from '@/utils/authErrors';
import { getApiErrorMessage } from '@/utils/apiErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { login, completeMfaLogin } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfa, setMfa] = useState<{
    challengeToken: string;
    email: string;
    debugCode?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mfa) {
        await completeMfaLogin(mfa.challengeToken, mfaCode);
        toast.success('Welcome back!', 'Signed in');
        return;
      }
      await login(email, password);
      toast.success('Welcome back!', 'Signed in');
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfa({
          challengeToken: err.challengeToken,
          email: err.email,
          debugCode: err.debugCode,
        });
        toast.success('We emailed a 6-digit code to confirm it is you.', 'Check your inbox');
        return;
      }
      if (err instanceof WrongAppRoleError) {
        router.push(`/auth/wrong-app?role=${encodeURIComponent(err.role)}` as Href);
        return;
      }
      toast.error(getApiErrorMessage(err, 'Sign in failed'), 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title={mfa ? 'Verify your sign in' : `Sign in to ${APP_NAME}`}
      subtitle={
        mfa
          ? `Enter the code we sent to ${mfa.email}. Coaches use this extra step to protect patient reviews.`
          : undefined
      }
      actions={
        <Button
          label={loading ? (mfa ? 'Verifying…' : 'Signing in…') : mfa ? 'Verify code' : 'Sign in'}
          onPress={handleSubmit}
          disabled={
            loading ||
            (mfa ? mfaCode.trim().length < 6 : !email.trim() || !password)
          }
          fullWidth
          size="lg"
          variant="primary"
        />
      }
      footer={
        mfa ? (
          <Pressable
            onPress={() => {
              setMfa(null);
              setMfaCode('');
            }}>
            <Text className="text-center text-sm text-white/80">
              Use a different account? <Text className="font-sans-semibold text-white">Back to sign in</Text>
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/auth/register' as Href)}>
            <Text className="text-center text-sm text-white/80">
              New here? <Text className="font-sans-semibold text-white">Create account</Text>
            </Text>
          </Pressable>
        )
      }>
      <View className="gap-4">
        {mfa ? (
          <>
            <FieldInput
              label="Verification code"
              value={mfaCode}
              onChangeText={(text) => setMfaCode(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoFocus
              placeholder="123456"
              hint={mfa.debugCode ? `Dev code: ${mfa.debugCode}` : undefined}
            />
          </>
        ) : (
          <>
            <FieldInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@vitaway.org"
            />
            <FieldInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Your password"
            />
            <Pressable
              onPress={() => router.push('/auth/forgot-password' as Href)}
              className="-mt-1 self-end">
              <Text className="text-sm text-blue-spruce-600">Forgot password?</Text>
            </Pressable>
            <AppleAuthButtons disabled={loading} />
          </>
        )}
      </View>
    </AuthScreenShell>
  );
}
