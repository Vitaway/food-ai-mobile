import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CoachHeaderActions } from '@/components/coach/CoachHeaderActions';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { ContentSheet, GradientHeader, GradientHeaderTitle } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { enteringCard } from '@/components/ui/motion';
import { fetchCoachClients } from '@/services/remote/coachApi';
import type { CoachQueueClient } from '@/types/coach';
import { formatRelativeTime } from '@/utils/time';

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
          <View className="flex-1 pr-3">
            <GradientHeaderTitle>Clients</GradientHeaderTitle>
            <Text className="mt-1 text-sm text-white/80">{clients.length} on your caseload</Text>
          </View>
          <CoachHeaderActions />
        </View>
      </GradientHeader>
      <ContentSheet className="flex-1 pt-4">
        {loading && clients.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
            }
            contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: 10 }}>
            {clients.length === 0 ? (
              <View className="items-center rounded-3xl bg-ash-grey-50 px-6 py-10">
                <Text className="font-sans-semibold text-base text-neutral-900">No clients yet</Text>
                <Text className="mt-1 text-center text-sm text-neutral-500">
                  Assigned patients will show up here as they start logging meals.
                </Text>
              </View>
            ) : (
              clients.map((client, index) => {
                const name = client.profile?.displayName?.trim() || client.patientId || 'Patient';
                const patientId = client.patientId;
                const canOpen = Boolean(patientId);
                return (
                  <Pressable
                    key={client.patientId ?? `${name}-${index}`}
                    disabled={!canOpen}
                    onPress={() => {
                      if (!patientId) return;
                      router.push(`/coach/client/${patientId}` as Href);
                    }}>
                    <Animated.View
                      entering={enteringCard(index)}
                      className="rounded-3xl bg-white px-4 py-4"
                      style={{
                        shadowColor: '#1a1c17',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 2,
                      }}>
                      <Text className="font-sans-semibold text-base text-neutral-900">{name}</Text>
                      <Text className="mt-1 text-sm text-neutral-500">
                        {client.inReviewCount
                          ? `${client.inReviewCount} meal${client.inReviewCount === 1 ? '' : 's'} in review`
                          : 'No meals waiting'}
                        {client.unreadMessages ? ` · ${client.unreadMessages} unread` : ''}
                      </Text>
                      <Text className="mt-1 text-xs text-neutral-500">
                        Last meal: {formatRelativeTime(client.lastMealAt)}
                      </Text>
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {client.membershipTier ? (
                          <View className="rounded-full bg-blue-spruce-50 px-2.5 py-1">
                            <Text className="text-[11px] font-sans-semibold text-blue-spruce-700">
                              {client.membershipTier === 'pro' ? 'Pro' : 'Standard'} plan
                            </Text>
                          </View>
                        ) : null}
                        {client.adherenceTrend ? (
                          <View className="rounded-full bg-ash-grey-100 px-2.5 py-1">
                            <Text className="text-[11px] text-neutral-600">
                              Trend: {client.adherenceTrend.replace('_', ' ')}
                            </Text>
                          </View>
                        ) : null}
                        {client.profile?.allergies?.length ? (
                          <View className="rounded-full bg-red-50 px-2.5 py-1">
                            <Text className="text-[11px] font-sans-semibold text-red-700">
                              {client.profile.allergies.length} allerg{client.profile.allergies.length === 1 ? 'y' : 'ies'}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </Animated.View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}
      </ContentSheet>
    </View>
  );
}
