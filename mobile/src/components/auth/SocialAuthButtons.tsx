import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WrongAppRoleError } from '@/utils/authErrors';
import { getApiErrorMessage } from '@/utils/apiErrors';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_G_LOGO = require('../../../assets/images/google-g.png');

type SocialAuthButtonsProps = {
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

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '';
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';

function isGoogleReadyForPlatform(): boolean {
  if (Platform.OS === 'ios') return Boolean(googleIosClientId);
  if (Platform.OS === 'android') return Boolean(googleAndroidClientId || googleWebClientId);
  return Boolean(googleWebClientId);
}

type GoogleAuthSuccess = Extract<
  Awaited<ReturnType<ReturnType<typeof Google.useIdTokenAuthRequest>[2]>>,
  { type: 'success' }
>;

function googleIdentityTokenFromResult(
  result: {
    type: string;
    params?: Record<string, string>;
    authentication?: { idToken?: string | null } | null;
  } | null,
): string | null {
  if (!result || result.type !== 'success') return null;
  const fromParams =
    typeof result.params?.id_token === 'string' ? result.params.id_token.trim() : '';
  if (fromParams) return fromParams;
  const fromAuth =
    typeof result.authentication?.idToken === 'string' ? result.authentication.idToken.trim() : '';
  return fromAuth || null;
}

type SharedSocialProps = {
  disabled?: boolean;
  loading: 'apple' | 'google' | null;
  setLoading: (value: 'apple' | 'google' | null) => void;
};

function GoogleSignInButton({ disabled, loading, setLoading }: SharedSocialProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const handledTokenRef = useRef<string | null>(null);
  const promptingRef = useRef(false);

  // Do not set selectAccount / consent — that forces a fresh grant and Google security emails.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleIosClientId || undefined,
    androidClientId: googleAndroidClientId || undefined,
    webClientId: googleWebClientId || undefined,
  });

  useEffect(() => {
    if (!response || response.type !== 'success') return;

    const identityToken = googleIdentityTokenFromResult(response);
    if (!identityToken) {
      if (response.params?.code && !response.authentication) return;
      toast.error('Google did not return a sign-in token. Please try again.', 'Google');
      setLoading(null);
      promptingRef.current = false;
      return;
    }
    if (handledTokenRef.current === identityToken) return;
    handledTokenRef.current = identityToken;

    let cancelled = false;
    (async () => {
      setLoading('google');
      try {
        await loginWithGoogle({ identityToken });
        if (!cancelled) toast.success('Welcome!', 'Signed in');
      } catch (err) {
        if (cancelled) return;
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') return;
        if (err instanceof WrongAppRoleError) {
          router.push(`/auth/wrong-app?role=${encodeURIComponent(err.role)}` as Href);
          return;
        }
        toast.error(getApiErrorMessage(err, 'Google sign-in failed'), 'Google');
      } finally {
        if (!cancelled) {
          setLoading(null);
          promptingRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [response, loginWithGoogle, router, setLoading, toast]);

  const handleGoogle = async () => {
    if (loading || disabled || promptingRef.current) return;
    promptingRef.current = true;
    handledTokenRef.current = null;
    setLoading('google');
    try {
      // Shared cookies (not ephemeral) let Google reuse a prior grant instead of re-consenting.
      const result = await promptAsync({ preferEphemeralSession: false });
      if (result.type !== 'success') {
        setLoading(null);
        promptingRef.current = false;
        return;
      }
      const identityToken = googleIdentityTokenFromResult(result as GoogleAuthSuccess);
      if (identityToken) return;
      if (result.params?.code) return;
      toast.error('Google did not return a sign-in token. Please try again.', 'Google');
      setLoading(null);
      promptingRef.current = false;
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
        setLoading(null);
        promptingRef.current = false;
        return;
      }
      toast.error(getApiErrorMessage(err, 'Google sign-in failed'), 'Google');
      setLoading(null);
      promptingRef.current = false;
    }
  };

  const busy = Boolean(loading) || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      disabled={busy || !request}
      onPress={handleGoogle}
      className="h-14 w-full flex-row items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4"
      style={{ opacity: busy && loading !== 'google' ? 0.5 : 1 }}>
      {loading === 'google' ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <Image source={GOOGLE_G_LOGO} style={{ width: 22, height: 22 }} resizeMode="contain" />
          <Text className="font-sans-semibold text-[15px] text-neutral-900">Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

function GooglePlaceholderButton() {
  const toast = useToast();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      onPress={() =>
        toast.error('Google sign-in is not set up yet. Use email for now.', 'Google')
      }
      className="h-14 w-full flex-row items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4">
      <Image source={GOOGLE_G_LOGO} style={{ width: 22, height: 22 }} resizeMode="contain" />
      <Text className="font-sans-semibold text-[15px] text-neutral-900">Continue with Google</Text>
    </Pressable>
  );
}

export function SocialAuthButtons({
  dividerLabel = 'Or continue with',
  disabled = false,
}: SocialAuthButtonsProps) {
  const router = useRouter();
  const { loginWithApple } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const googleReady = isGoogleReadyForPlatform();

  const handleApple = async () => {
    if (loading || disabled) return;
    if (Platform.OS !== 'ios') {
      toast.error('Apple sign-in is only available on iPhone.', 'Apple');
      return;
    }
    setLoading('apple');
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        toast.error('Apple sign-in is not available on this device.', 'Apple');
        return;
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        toast.error('Apple did not return a sign-in token. Please try again.', 'Apple');
        return;
      }
      await loginWithApple({
        identityToken: credential.identityToken,
        fullName: formatAppleFullName(credential.fullName),
        email: credential.email ?? undefined,
      });
      toast.success('Welcome!', 'Signed in');
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') return;
      if (err instanceof WrongAppRoleError) {
        router.push(`/auth/wrong-app?role=${encodeURIComponent(err.role)}` as Href);
        return;
      }
      toast.error(getApiErrorMessage(err, 'Apple sign-in failed'), 'Apple');
    } finally {
      setLoading(null);
    }
  };

  const showApple = Platform.OS === 'ios';
  const busy = Boolean(loading) || disabled;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-neutral-200" />
        <Text className="text-xs font-sans-medium text-neutral-400">{dividerLabel}</Text>
        <View className="h-px flex-1 bg-neutral-200" />
      </View>

      <View className="gap-3">
        {googleReady ? (
          <GoogleSignInButton disabled={disabled} loading={loading} setLoading={setLoading} />
        ) : (
          <GooglePlaceholderButton />
        )}

        {showApple ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
            disabled={busy}
            onPress={handleApple}
            className="h-14 w-full flex-row items-center justify-center gap-3 rounded-2xl bg-neutral-950 px-4"
            style={{ opacity: busy && loading !== 'apple' ? 0.5 : 1 }}>
            {loading === 'apple' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <Text className="font-sans-semibold text-[15px] text-white">Continue with Apple</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
