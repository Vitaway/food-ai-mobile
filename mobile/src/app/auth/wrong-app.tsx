import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

import { MIRAFOOD_WEB_URL } from '@/constants/site';

const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? (__DEV__ ? 'http://localhost:5173' : MIRAFOOD_WEB_URL);

function roleCopy(role: string | undefined) {
  if (role === 'admin') {
    return {
      title: 'Admin accounts use the web dashboard',
      body: 'Platform admin tools are not available in the mobile app. Sign in on the web to manage coaches, users, and system settings.',
      cta: 'Open admin dashboard',
      path: '/login',
    };
  }

  return {
    title: 'Coach accounts use the web dashboard',
    body: 'Meal review, client queue, and coach tools live on the MiraFood web dashboard — not in the consumer mobile app.',
    cta: 'Open coach dashboard',
    path: '/login',
  };
}

export default function WrongAppScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const copy = roleCopy(role);
  const webUrl = `${WEB_APP_URL.replace(/\/$/, '')}${copy.path}`;

  const openWeb = () => {
    void Linking.openURL(webUrl);
  };

  return (
    <AuthScreenShell
      title={copy.title}
      actions={
        <View className="gap-3">
          <Button label={copy.cta} onPress={openWeb} fullWidth size="lg" variant="primary" />
          <Button
            label="Back to consumer sign in"
            onPress={() => router.replace('/auth/login' as Href)}
            fullWidth
            size="lg"
            variant="outline-light"
          />
        </View>
      }
      footer={
        <Pressable onPress={() => router.replace('/auth/register' as Href)}>
          <Text className="text-center text-sm text-white/80">
            Need a consumer account? <Text className="font-sans-semibold text-white">Create one</Text>
          </Text>
        </Pressable>
      }>
      <View className="items-center rounded-2xl border border-white/20 bg-white/10 px-5 py-6">
        <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Ionicons name="laptop-outline" size={30} color="#ffffff" />
        </View>
        <Text className="text-center text-sm leading-6 text-white/85">{copy.body}</Text>
      </View>
    </AuthScreenShell>
  );
}
