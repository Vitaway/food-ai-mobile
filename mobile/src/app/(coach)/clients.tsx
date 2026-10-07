import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { enteringCard } from '@/components/ui/motion';
import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import { fetchCoachClients } from '@/services/remote/coachApi';
import type { CoachQueueClient } from '@/types/coach';
import { formatRelativeTime } from '@/utils/time';

function ClientCard({
  client,
  index,
  onPress,
}: {
  client: CoachQueueClient;
  index: number;
  onPress: () => void;
}) {
  const name = client.profile?.displayName?.trim() || client.patientId || 'Patient';
  const initial = name.slice(0, 1).toUpperCase();
  const avatarUrl = client.profile?.avatarUrl;
  const waiting = client.inReviewCount ?? 0;
  const unread = client.unreadMessages ?? 0;
  const allergies = client.profile?.allergies?.length ?? 0;

  return (
    <Animated.View entering={enteringCard(index)}>
      <Pressable
        onPress={onPress}
        className="overflow-hidden rounded-[28px] bg-white active:opacity-95"
        style={{
          shadowColor: '#1a3a2a',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.06,
          shadowRadius: 18,
          elevation: 3,
        }}>
        <View className="flex-row items-center gap-3.5 p-3.5">
          <View className="h-[64px] w-[64px] overflow-hidden rounded-full border-[3px] border-ash-grey-50 bg-ash-grey-100">
            <ResolvedImage
              uri={avatarUrl}
              className="h-full w-full"
              resizeMode="cover"
              fallback={
                <View className="h-full w-full items-center justify-center bg-blue-spruce-600">
                  <Text className="font-sans-bold text-xl text-white">{initial}</Text>
                </View>
              }
            />
          </View>

          <View className="min-w-0 flex-1 py-0.5">
            <Text className="font-sans-bold text-[17px] text-blue-spruce-900" numberOfLines={1}>
              {name}
            </Text>
            <Text className="mt-0.5 text-sm text-ash-grey-500" numberOfLines={1}>
              {waiting > 0
                ? `${waiting} meal${waiting === 1 ? '' : 's'} in review`
                : 'No meals waiting'}
              {unread > 0 ? ` · ${unread} unread` : ''}
            </Text>
            <Text className="mt-1 text-[12px] text-ash-grey-400">
              Last meal · {formatRelativeTime(client.lastMealAt)}
            </Text>

            <View className="mt-2.5 flex-row flex-wrap gap-1.5">
              {client.membershipTier ? (
                <View className="rounded-full bg-blue-spruce-50 px-2.5 py-1">
                  <Text className="text-[11px] font-sans-semibold text-blue-spruce-700">
                    {client.membershipTier === 'pro' ? 'Pro' : 'Standard'}
                  </Text>
                </View>
              ) : null}
              {client.adherenceTrend ? (
                <View className="rounded-full bg-ash-grey-100 px-2.5 py-1">
                  <Text className="text-[11px] text-ash-grey-600">
                    {String(client.adherenceTrend).replace('_', ' ')}
                  </Text>
                </View>
              ) : null}
              {allergies > 0 ? (
                <View className="rounded-full bg-red-50 px-2.5 py-1">
                  <Text className="text-[11px] font-sans-semibold text-red-700">
                    {allergies} allerg{allergies === 1 ? 'y' : 'ies'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="h-9 w-9 items-center justify-center rounded-full bg-ash-grey-50">
            <Ionicons name="chevron-forward" size={18} color={palette['blue-spruce'][600]} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CoachClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<CoachQueueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setClients(await fetchCoachClients());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <GradientHeader>
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 pr-3">
            <GradientHeaderTitle>Clients</GradientHeaderTitle>
            <Text className="mt-1 text-sm text-white/80">
              {clients.length === 0
                ? 'No one on your caseload yet'
                : `${clients.length} on your caseload`}
            </Text>
          </View>
          <CoachHeaderActions />
        </View>
      </GradientHeader>

      <ContentSheet className="flex-1 pt-4">
        {loading && clients.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette['blue-spruce'][700]} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load();
                }}
              />
            }
            contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: 12 }}>
            {clients.length === 0 ? (
              <View className="items-center rounded-[28px] bg-ash-grey-50 px-6 py-12">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-spruce-50">
                  <Ionicons name="people-outline" size={26} color={palette['blue-spruce'][600]} />
                </View>
                <Text className="mt-4 font-sans-bold text-lg text-blue-spruce-900">No clients yet</Text>
                <Text className="mt-1 text-center text-sm leading-5 text-ash-grey-500">
                  Assigned patients will show up here as they start logging meals.
                </Text>
              </View>
            ) : (
              clients.map((client, index) => {
                const patientId = client.patientId;
                if (!patientId) return null;
                return (
                  <ClientCard
                    key={patientId}
                    client={client}
                    index={index}
                    onPress={() => router.push(`/coach/client/${patientId}` as Href)}
                  />
                );
              })
            )}
          </ScrollView>
        )}
      </ContentSheet>
    </View>
  );
}
