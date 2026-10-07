import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Href } from 'expo-router';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { useI18n } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { MfaRequiredError, WrongAppRoleError } from '@/utils/authErrors';
import { getApiErrorMessage } from '@/utils/apiErrors';
import {
  authenticateWithBiometrics,
  enableBiometricLogin,
  getBiometricKind,
  getStoredBiometricCreds,
  isBiometricsEnabled,
  type BiometricKind,
} from '@/utils/biometrics';

export default function LoginScreen() {
  const { push, replace } = useNavigateOnce();
  const { login, completeMfaLogin } = useAuth();
  const { t } = useI18n();
  const { confirm } = useConfirmDialog();
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
  const [loadingSource, setLoadingSource] = useState<'email' | 'biometric' | null>(null);
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('none');
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [kind, enabled, creds] = await Promise.all([
        getBiometricKind(),
        isBiometricsEnabled(),
        getStoredBiometricCreds(),
      ]);
      if (!active) return;
      setBiometricKind(kind);
      setCanUseBiometrics(kind !== 'none' && enabled && Boolean(creds));
      if (creds?.email) setEmail(creds.email);
    })();
    return () => {
      active = false;
    };
  }, []);

  const biometricLabel =
    biometricKind === 'face'
      ? t.auth.useFaceId
      : biometricKind === 'fingerprint'
        ? t.auth.useTouchId
        : t.auth.useBiometrics;

  const maybeEnableBiometrics = async (nextEmail: string, nextPassword: string) => {
    if ((await getBiometricKind()) === 'none') return;
    if (await isBiometricsEnabled()) return;
    const ok = await confirm({
      title: t.auth.enableBiometricsTitle,
      message: t.auth.enableBiometricsBody,
      confirmLabel: t.auth.enableBiometricsConfirm,
    });
    if (!ok) return;
    const enabled = await enableBiometricLogin({ email: nextEmail, password: nextPassword });
    if (enabled) toast.success(t.profile.biometricsEnabled);
  };

  const finishPasswordLogin = async (nextEmail: string, nextPassword: string) => {
    await login(nextEmail, nextPassword);
    toast.success(t.auth.welcomeBack, t.auth.signedIn);
    await maybeEnableBiometrics(nextEmail, nextPassword);
  };

  const handleBiometricLogin = async () => {
    if (loading) return;
    setLoading(true);
    setLoadingSource('biometric');
    try {
      const creds = await authenticateWithBiometrics(biometricLabel);
      if (!creds) {
        toast.error(t.auth.biometricsFailed);
        setLoading(false);
        setLoadingSource(null);
        return;
      }
      await finishPasswordLogin(creds.email, creds.password);
      // Keep overlay until AuthGuard routes away.
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfa({
          challengeToken: err.challengeToken,
          email: err.email,
          debugCode: err.debugCode,
        });
        toast.success(t.auth.mfaSent, t.auth.checkInbox);
        setLoading(false);
        setLoadingSource(null);
        return;
      }
      toast.error(getApiErrorMessage(err, t.auth.signInFailed), t.auth.signIn);
      setLoading(false);
      setLoadingSource(null);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setLoadingSource('email');
    try {
      if (mfa) {
        await completeMfaLogin(mfa.challengeToken, mfaCode);
        toast.success(t.auth.welcomeBack, t.auth.signedIn);
        return;
      }
      await finishPasswordLogin(email, password);
      // Keep overlay until AuthGuard routes away.
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfa({
          challengeToken: err.challengeToken,
          email: err.email,
          debugCode: err.debugCode,
        });
        toast.success(t.auth.mfaSent, t.auth.checkInbox);
        setLoading(false);
        setLoadingSource(null);
        return;
      }
      if (err instanceof WrongAppRoleError) {
        setLoading(false);
        setLoadingSource(null);
        push(`/auth/wrong-app?role=${encodeURIComponent(err.role)}` as Href);
        return;
      }
      toast.error(getApiErrorMessage(err, t.auth.signInFailed), t.auth.signIn);
      setLoading(false);
      setLoadingSource(null);
    }
  };

  return (
    <AuthScreenShell
      title={mfa ? t.auth.verifySignIn : t.auth.login}
      dismissible={!loading}
      footer={
        mfa ? (
          <Pressable
            onPress={() => {
              setMfa(null);
              setMfaCode('');
            }}
            disabled={loading}>
            <Text className="text-center text-sm text-neutral-500">
              {t.auth.differentAccount}{' '}
              <Text className="font-sans-semibold text-blue-spruce-700">{t.common.back}</Text>
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => replace('/auth/register' as Href)} disabled={loading}>
            <Text className="text-center text-sm text-neutral-500">
              {t.auth.noAccount}{' '}
              <Text className="font-sans-semibold text-blue-spruce-700">{t.auth.signUp}</Text>
            </Text>
          </Pressable>
        )
      }>
      <View className="gap-4">
        {mfa ? (
          <>
            <FieldInput
              label={t.auth.verificationCode}
              value={mfaCode}
              onChangeText={(text) => setMfaCode(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoFocus
              placeholder="123456"
              hint={mfa.debugCode ? `Dev code: ${mfa.debugCode}` : undefined}
              editable={!loading}
            />
            <Button
              label={t.auth.verifyCode}
              onPress={handleSubmit}
              disabled={loading || mfaCode.trim().length < 6}
              loading={loading}
              loadingLabel={t.auth.verifying}
              fullWidth
              size="lg"
              variant="primary"
            />
          </>
        ) : (
          <>
            {canUseBiometrics ? (
              <Button
                label={biometricLabel}
                onPress={() => void handleBiometricLogin()}
                disabled={loading}
                loading={loadingSource === 'biometric'}
                loadingLabel={t.auth.signingIn}
                fullWidth
                size="lg"
                variant="outline"
              />
            ) : null}
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
              placeholder={t.auth.passwordPlaceholder}
              editable={!loading}
            />
            <Pressable
              onPress={() => push('/auth/forgot-password' as Href)}
              className="-mt-1 self-end"
              disabled={loading}>
              <Text className="text-sm font-sans-medium text-blue-spruce-700">{t.auth.forgotPassword}</Text>
            </Pressable>
            <Button
              label={t.auth.logIn}
              onPress={handleSubmit}
              disabled={loading || !email.trim() || !password}
              loading={loadingSource === 'email'}
              loadingLabel={t.auth.loggingIn}
              fullWidth
              size="lg"
              variant="primary"
            />
            <View className="mt-4">
              <SocialAuthButtons disabled={loading} dividerLabel={t.auth.continueWith} />
            </View>
          </>
        )}
      </View>
    </AuthScreenShell>
  );
}
