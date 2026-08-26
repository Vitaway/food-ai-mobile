import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Href } from 'expo-router';

import { PasswordField } from '@/components/auth/PasswordField';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { isRegisterFormValid } from '@/utils/authForm';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { isPasswordAcceptable } from '@/utils/passwordStrength';

export default function RegisterScreen() {
  const { replace } = useNavigateOnce();
  const { register } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = isRegisterFormValid({ email, password });

  const handleSubmit = async () => {
    if (loading) return;
    if (!isPasswordAcceptable(password)) {
      toast.error(t.auth.passwordHint);
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      toast.success(t.auth.accountCreated, t.auth.welcome);
      // Keep overlay up until AuthGuard routes into onboarding.
    } catch (err) {
      setLoading(false);
      toast.error(getApiErrorMessage(err, t.auth.couldNotCreate), t.auth.signUp);
    }
  };

  return (
    <>
      <FullScreenLoader visible={loading} message={t.auth.creatingAccount} />
      <AuthScreenShell
        title={t.auth.signUp}
        dismissible={!loading}
        footer={
          <Pressable onPress={() => replace('/auth/login' as Href)} disabled={loading}>
            <Text className="text-center text-sm text-neutral-500">
              {t.auth.haveAccount}{' '}
              <Text className="font-sans-semibold text-blue-spruce-700">{t.auth.logIn}</Text>
            </Text>
          </Pressable>
        }>
        <View className="gap-4">
          <FieldInput
            label={t.auth.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t.auth.emailPlaceholder}
            editable={!loading}
          />
          <PasswordField
            label={t.auth.password}
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.createPasswordPlaceholder}
            textContentType="newPassword"
            autoComplete="password-new"
          />
          <Button
            label={t.auth.createAccount}
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            fullWidth
            size="lg"
            variant="primary"
          />
          <View className="mt-4">
            <SocialAuthButtons dividerLabel={t.auth.orSignUpWith} disabled={loading} />
          </View>
        </View>
      </AuthScreenShell>
    </>
  );
}
