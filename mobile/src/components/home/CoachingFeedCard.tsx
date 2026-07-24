import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Text } from '@/components/ui/Text';
import { fetchCoachingFeed, type CoachingFeedItem } from '@/services/remote/consumerApi';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useProfile } from '@/context/ProfileContext';

const TYPE_STYLES: Record<
  CoachingFeedItem['type'],
  { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }
> = {
  tip: { icon: 'bulb-outline', bg: 'bg-blue-spruce-50', color: '#023459' },
  celebration: { icon: 'trophy-outline', bg: 'bg-shamrock-50', color: '#1D9E75' },
  reminder: { icon: 'notifications-outline', bg: 'bg-cinnamon-wood-50', color: '#C45A11' },
  coach_note: { icon: 'chatbubble-ellipses-outline', bg: 'bg-blue-spruce-50', color: '#023459' },
  trend: { icon: 'trending-up-outline', bg: 'bg-shamrock-50', color: '#1D9E75' },
};

export function CoachingFeedCard() {
  const { push } = useNavigateOnce();
  const { profile } = useProfile();
  const [data, setData] = useState<CoachingFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);
      void fetchCoachingFeed()
        .then((items) => {
          if (active) setData(items);
        })
        .catch(() => {
          if (active) setData([]);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
      return () => {
        active = false;
      };
    }, [profile?.macroTargets?.proteinG, profile?.waterTargetMl, profile?.updatedAt]),
  );

  if (isLoading) {
    return (
      <View className="rounded-3xl bg-white p-5">
        <Text className="font-sans-semibold text-base text-neutral-900">Coaching insights</Text>
        <Text className="mt-2 text-sm text-neutral-500">Loading personalized tips…</Text>
      </View>
    );
  }

  if (!data.length) {
    return (
      <View className="rounded-3xl bg-white p-5">
        <Text className="font-sans-semibold text-base text-neutral-900">Coaching insights</Text>
        <Text className="mt-2 text-sm leading-5 text-neutral-500">
          Tips from your coach and personalized reminders will show up here as you log meals.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="rounded-3xl bg-white p-5"
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2,
      }}>
      <Text className="font-sans-semibold text-base text-neutral-900">Coaching insights</Text>
      <Text className="mt-1 text-sm text-neutral-500">Personalized tips based on your recent logs</Text>

      <View className="mt-4 gap-3">
        {data.slice(0, 4).map((item) => {
          const style = TYPE_STYLES[item.type];
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (item.actionRoute) push(item.actionRoute as never);
              }}
              className="flex-row gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-3 active:opacity-90">
              <View className={`h-10 w-10 items-center justify-center rounded-xl ${style.bg}`}>
                <Ionicons name={style.icon} size={20} color={style.color} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-semibold text-sm text-neutral-900">{item.title}</Text>
                <Text className="mt-0.5 text-sm leading-5 text-neutral-600">{item.body}</Text>
                {item.actionLabel ? (
                  <Text className="mt-1 text-xs font-sans-semibold text-blue-spruce-700">{item.actionLabel}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
