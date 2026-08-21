import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
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
      toast.error(getApiErrorMessage(err, 'Sign in failed'), 'Sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title={mfa ? 'Verify sign-in' : 'Login'}
      subtitle={
        mfa
          ? `Enter the code we sent to ${mfa.email}`
          : 'Enter your email and password to log in.'
      }
      footer={
        mfa ? (
          <Pressable
            onPress={() => {
              setMfa(null);
              setMfaCode('');
            }}>
            <Text className="text-center text-sm text-neutral-500">
              Use a different account?{' '}
              <Text className="font-sans-semibold text-blue-spruce-700">Back</Text>
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/auth/register' as Href)}>
            <Text className="text-center text-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <Text className="font-sans-semibold text-blue-spruce-700">Sign Up</Text>
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
            <Button
              label={loading ? 'Verifying…' : 'Verify code'}
              onPress={handleSubmit}
              disabled={loading || mfaCode.trim().length < 6}
              fullWidth
              size="lg"
              variant="primary"
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
              placeholder="you@email.com"
            />
            <PasswordField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
            />
            <Pressable
              onPress={() => router.push('/auth/forgot-password' as Href)}
              className="-mt-1 self-end">
              <Text className="text-sm font-sans-medium text-blue-spruce-700">Forgot Password?</Text>
            </Pressable>
            <Button
              label={loading ? 'Logging in…' : 'Log In'}
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password}
              fullWidth
              size="lg"
              variant="primary"
            />
            <SocialAuthButtons disabled={loading} />
          </>
        )}
      </View>
    </AuthScreenShell>
  );
}
