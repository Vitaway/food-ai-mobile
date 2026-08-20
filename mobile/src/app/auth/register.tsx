import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { PasswordField } from '@/components/auth/PasswordField';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { isRegisterFormValid } from '@/utils/authForm';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { isPasswordAcceptable } from '@/utils/passwordStrength';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = isRegisterFormValid({ displayName, email, password, confirmPassword });

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!isPasswordAcceptable(password)) {
      toast.error('Use 8+ characters with mixed case and a number.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(
        email,
        password,
        displayName.trim(),
        referralCode.trim() || undefined,
        'individual',
      );
      toast.success('Account created — finish your health profile next.', 'Welcome');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create account'), 'Sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title="Sign Up"
      subtitle="Create your MiraFood account in a minute."
      actions={
        <Button
          label={loading ? 'Creating…' : 'Create account'}
          onPress={handleSubmit}
          disabled={loading || !canSubmit}
          fullWidth
          size="lg"
          variant="primary"
        />
      }
      footer={
        <Pressable onPress={() => router.back()}>
          <Text className="text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Text className="font-sans-semibold text-blue-spruce-700">Log In</Text>
          </Text>
        </Pressable>
      }>
      <View className="gap-4">
        <FieldInput
          label="Full name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          placeholder="Your name"
        />
        <FieldInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@email.com"
        />
        <PasswordField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          textContentType="newPassword"
          autoComplete="password-new"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
          textContentType="newPassword"
          autoComplete="password-new"
        />
        <FieldInput
          label="Referral code (optional)"
          value={referralCode}
          onChangeText={setReferralCode}
          autoCapitalize="characters"
          placeholder="MIRA-XXXXXX"
        />
        <SocialAuthButtons dividerLabel="Or sign up with" disabled={loading} />
      </View>
    </AuthScreenShell>
  );
}
