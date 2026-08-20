import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WrongAppRoleError } from '@/utils/authErrors';
import { getApiErrorMessage } from '@/utils/apiErrors';

type AppleAuthButtonsProps = {
  /** Shown above the Apple button (e.g. on login vs register). */
  dividerLabel?: string;
  disabled?: boolean;
};

function formatAppleFullName(
  name: AppleAuthentication.AppleAuthenticationFullName | null | undefined,
): string | undefined {
  if (!name) return undefined;
  const parts = [name.givenName, name.middleName, name.familyName]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

export function AppleAuthButtons({
  dividerLabel = 'Or continue with',
  disabled = false,
}: AppleAuthButtonsProps) {
  const router = useRouter();
  const { loginWithApple } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  if (Platform.OS !== 'ios' || !available) {
    return null;
  }

  const handleApple = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        toast.error('Apple did not return an identity token. Try again.', 'Apple Sign In');
        return;
      }

      await loginWithApple({
        identityToken: credential.identityToken,
        fullName: formatAppleFullName(credential.fullName),
        email: credential.email ?? undefined,
      });
      toast.success('Welcome!', 'Signed in with Apple');
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      if (err instanceof WrongAppRoleError) {
        router.push(`/auth/wrong-app?role=${encodeURIComponent(err.role)}` as Href);
        return;
      }
      toast.error(getApiErrorMessage(err, 'Apple Sign In failed'), 'Apple Sign In');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mt-5 gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-ink/10" />
        <Text className="text-xs font-sans-medium uppercase tracking-wide text-ink/45">
          {dividerLabel}
        </Text>
        <View className="h-px flex-1 bg-ink/10" />
      </View>

      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={14}
        style={{ width: '100%', height: 48, opacity: loading || disabled ? 0.55 : 1 }}
        onPress={handleApple}
      />
    </View>
  );
}
