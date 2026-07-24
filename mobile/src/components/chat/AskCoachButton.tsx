import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { ensurePatientConversation } from '@/services/remote/chatApi';

export function AskCoachButton({ mealId, label }: { mealId: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openChat() {
    setLoading(true);
    setError(null);
    try {
      const conv = await ensurePatientConversation();
      router.push({
        pathname: '/chat/[id]',
        params: { id: conv.id, mealId, title: conv.title, peerAvatarUrl: conv.peerAvatarUrl ?? '' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open chat';
      setError(
        /route not found/i.test(message)
          ? 'Chat is not available on this server yet. Restart API with latest code.'
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-2">
      <Button
        label={loading ? 'Opening chat…' : label ?? 'Ask coach about this meal'}
        variant="secondary"
        onPress={() => void openChat()}
        disabled={loading}
      />
      {loading ? (
        <ActivityIndicator color={semanticColors.primary} className="self-center" />
      ) : null}
      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}

export function useOpenCoachChat() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setLoading(false);
  }, []);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const conv = await ensurePatientConversation();
      router.push({
        pathname: '/chat/[id]',
        params: { id: conv.id, title: conv.title, peerAvatarUrl: conv.peerAvatarUrl ?? '' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open chat';
      setError(
        /route not found/i.test(message)
          ? 'Chat is not available on this server yet. Restart API with latest code.'
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return { open, loading, error };
}
