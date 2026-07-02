import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/utils/apiErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!', 'Signed in');
      router.replace('/' as Href);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Sign in failed'), 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title={`Sign in to ${APP_NAME}`}
      subtitle="Enter your email and password to open your Vitaway file"
      actions={
        <Button
          label={loading ? 'Signing in…' : 'Sign in'}
          onPress={handleSubmit}
          disabled={loading || !email.trim() || !password}
          fullWidth
          size="lg"
          variant="primary"
        />
      }
      footer={
        <Pressable onPress={() => router.push('/auth/register' as Href)}>
          <Text className="text-center text-sm text-white/80">
            New here? <Text className="font-sans-semibold text-white">Create account</Text>
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
          placeholder="you@vitaway.com"
        />
        <FieldInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Your password"
        />
      </View>
    </AuthScreenShell>
  );
}
