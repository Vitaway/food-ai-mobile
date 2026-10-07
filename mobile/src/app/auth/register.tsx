import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Href } from 'expo-router';

import { PasswordField } from '@/components/auth/PasswordField';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { isRegisterFormValid } from '@/utils/authForm';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { isPasswordAcceptable, passwordRequirementStatus } from '@/utils/passwordStrength';

function RuleTick({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`h-4 w-4 items-center justify-center rounded-full ${
          ok ? 'bg-shamrock-500' : 'bg-ash-grey-200'
        }`}>
        {ok ? <Text className="text-[9px] font-sans-bold text-white">✓</Text> : null}
      </View>
      <Text className={`text-xs ${ok ? 'font-sans-semibold text-shamrock-700' : 'text-neutral-500'}`}>
        {label}
      </Text>
    </View>
  );
}

export default function RegisterScreen() {
  const { replace } = useNavigateOnce();
  const { register } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [existsError, setExistsError] = useState(false);

  const rules = useMemo(() => passwordRequirementStatus(password), [password]);
  const canSubmit = isRegisterFormValid({ email, password }) && isPasswordAcceptable(password);

  const handleSubmit = async () => {
    if (loading) return;
    if (!isPasswordAcceptable(password)) {
      toast.error(t.auth.passwordHint);
      return;
    }

    setLoading(true);
    setExistsError(false);
    try {
      await register(email, password);
      toast.success(t.auth.accountCreated, t.auth.welcome);
      // Keep loading until AuthGuard routes into onboarding.
    } catch (err) {
      setLoading(false);
      const message = getApiErrorMessage(err, t.auth.couldNotCreate);
      if (/network|offline|failed to fetch|internet/i.test(message)) {
        toast.error(t.auth.offlineHint);
        return;
      }
      if (/already|exists|registered/i.test(message)) {
        setExistsError(true);
        return;
      }
      toast.error(message, t.auth.signUp);
    }
  };

  return (
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
          onChangeText={(v) => {
            setEmail(v);
            setExistsError(false);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t.auth.emailPlaceholder}
          editable={!loading}
        />
        <View>
          <PasswordField
            label={t.auth.password}
            value={password}
            onChangeText={setPassword}
            placeholder={t.auth.createPasswordPlaceholder}
            disableStrongPassword
            editable={!loading}
          />
          <View className="mt-3 gap-1.5 px-0.5">
            <RuleTick ok={rules.length} label={t.auth.ruleLength} />
            <RuleTick ok={rules.number} label={t.auth.ruleNumber} />
            <RuleTick ok={rules.mixedCase} label={t.auth.ruleLetter} />
          </View>
        </View>

        {existsError ? (
          <View className="rounded-2xl border border-cinnamon-wood-200 bg-cinnamon-wood-50 px-4 py-3">
            <Text className="font-sans-bold text-sm text-blue-spruce-900">
              {t.auth.accountExistsTitle}
            </Text>
            <Text className="mt-1 text-sm text-neutral-600">{t.auth.accountExistsBody}</Text>
            <View className="mt-3 flex-row gap-2">
              <Button
                label={t.auth.logIn}
                size="sm"
                variant="primary"
                onPress={() => replace('/auth/login' as Href)}
              />
              <Button
                label={t.auth.resetPassword}
                size="sm"
                variant="outline"
                onPress={() => replace('/auth/forgot-password' as Href)}
              />
            </View>
          </View>
        ) : null}

        <Button
          label={t.auth.createAccount}
          onPress={handleSubmit}
          disabled={loading || !canSubmit}
          loading={loading}
          loadingLabel={t.auth.creatingAccount}
          fullWidth
          size="lg"
          variant="primary"
        />
        <View className="mt-2">
          <SocialAuthButtons dividerLabel={t.auth.orSignUpWith} disabled={loading} />
        </View>
      </View>
    </AuthScreenShell>
  );
}
