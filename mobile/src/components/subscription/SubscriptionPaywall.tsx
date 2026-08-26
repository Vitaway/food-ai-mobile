import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { palette } from '@/design-system/colors';
import type { TranslationTree } from '@/i18n/en';
import type { SubscriptionPlan } from '@/services/remote/consumerApi';

type Props = {
  plans: SubscriptionPlan[];
  selectedPlanCode: string;
  checkingOut: boolean;
  refreshing: boolean;
  error: string | null;
  isLoading: boolean;
  /** When set, free users can leave the paywall and keep browsing. */
  onDismiss?: () => void;
  onSelectPlan: (code: string) => void;
  onSubscribe: (plan: SubscriptionPlan) => void;
  onRefresh: () => void;
};

function planPeriodLabel(
  plan: Pick<SubscriptionPlan, 'intervalDays'>,
  t: TranslationTree,
): string {
  if (plan.intervalDays === 7) return t.subscription.perWeek;
  if (plan.intervalDays === 30 || !plan.intervalDays) return t.subscription.perMonth;
  return `${plan.intervalDays} days`;
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

function monthlyEquivalent(plan: SubscriptionPlan): number | null {
  if (!plan.intervalDays || plan.intervalDays <= 0) return null;
  return Math.round((plan.amount / plan.intervalDays) * 30);
}

function featuresFor(plan: SubscriptionPlan, t: TranslationTree): readonly string[] {
  if (plan.subscriptionType === 'family') {
    return [
      t.subscription.featureEverythingMonthly,
      t.subscription.featureSixMembers,
      t.subscription.featureSharedCoaching,
      t.subscription.featureOneBill,
    ];
  }
  return [
    t.subscription.featureAiLogging,
    t.subscription.featureMacros,
    t.subscription.featureCoachPlan,
    t.subscription.featureWaterInsights,
  ];
}

function subtitleFor(plan: SubscriptionPlan, t: TranslationTree): string {
  if (plan.subscriptionType === 'family') return t.subscription.upTo6Members;
  if (plan.intervalDays === 7) return t.subscription.cancelAnytime;
  return t.subscription.bestValue;
}

export function SubscriptionPaywall({
  plans,
  selectedPlanCode,
  checkingOut,
  refreshing,
  error,
  isLoading,
  onDismiss,
  onSelectPlan,
  onSubscribe,
  onRefresh,
}: Props) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const selected = plans.find((p) => p.code === selectedPlanCode) ?? plans[0] ?? null;
  const navy = palette['blue-spruce'];
  const maxHeight = Math.round(Dimensions.get('window').height * 0.68);

  const dismiss = () => {
    onDismiss?.();
  };

  return (
    <View className="flex-1 justify-end" style={{ backgroundColor: 'transparent' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.close}
        onPress={dismiss}
        disabled={!onDismiss}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(5, 31, 28, 0.38)' }}
      />

      <View
        className="w-full overflow-hidden rounded-t-[32px] bg-white px-6 pt-3"
        style={{
          maxHeight,
          paddingBottom: Math.max(insets.bottom, 16),
          borderCurve: 'continuous',
          shadowColor: navy[900],
          shadowOpacity: 0.22,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: -8 },
          elevation: 18,
        }}>
        <LinearGradient
          pointerEvents="none"
          colors={[palette['blue-spruce'][50], '#ffffff', '#ffffff']}
          locations={[0, 0.22, 1]}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }}
        />

        <Pressable onPress={dismiss} disabled={!onDismiss} hitSlop={8} className="mb-3 items-center py-1">
          <View className="h-1.5 w-12 rounded-full bg-ash-grey-200" />
        </Pressable>

        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color={navy[700]} size="large" />
          </View>
        ) : (
          <>
            <View className="mb-4">
              <Text className="text-center font-sans-bold text-[28px] text-neutral-900">
                {t.subscription.choosePlan}
              </Text>
              <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">
                {t.subscription.choosePlanBody}
              </Text>
              {error ? (
                <Text className="mt-2 text-center text-sm text-cinnamon-wood-600">{error}</Text>
              ) : null}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}>
              <View className="gap-2.5">
                {plans.map((plan) => {
                  const isSelected = plan.code === selected?.code;
                  const isBest = plan.code === 'individual_monthly';
                  const isFamily = plan.subscriptionType === 'family';
                  const perMonth = monthlyEquivalent(plan);
                  const features = featuresFor(plan, t);

                  return (
                    <Pressable
                      key={plan.code}
                      onPress={() => onSelectPlan(plan.code)}
                      disabled={checkingOut}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      className="overflow-hidden rounded-[20px] bg-white"
                      style={{
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? navy[700] : navy[100],
                      }}>
                      {isBest ? (
                        <View
                          className="self-start rounded-full px-2.5 py-0.5"
                          style={{
                            backgroundColor: navy[700],
                            marginLeft: 14,
                            marginTop: 12,
                          }}>
                          <Text className="text-[10px] font-sans-bold uppercase tracking-wide text-white">
                            {t.subscription.bestValue}
                          </Text>
                        </View>
                      ) : null}

                      <View className={`px-3.5 pb-3.5 ${isBest ? 'pt-2' : 'pt-3.5'}`}>
                        <View className="flex-row items-start gap-3">
                          <View
                            className="mt-0.5 h-5 w-5 items-center justify-center rounded-full"
                            style={{
                              borderWidth: 2,
                              borderColor: isSelected ? navy[700] : palette['ash-grey'][300],
                              backgroundColor: isSelected ? navy[700] : 'transparent',
                            }}>
                            {isSelected ? (
                              <Ionicons name="checkmark" size={12} color="#fff" />
                            ) : null}
                          </View>

                          <View className="min-w-0 flex-1">
                            <View className="flex-row items-start justify-between gap-2">
                              <View className="min-w-0 flex-1 pr-2">
                                <View className="flex-row flex-wrap items-center gap-2">
                                  <Text className="font-sans-bold text-[16px] text-blue-spruce-900">
                                    {plan.label}
                                  </Text>
                                  {isFamily ? (
                                    <View
                                      className="rounded-full px-2 py-0.5"
                                      style={{ backgroundColor: navy[50] }}>
                                      <Text
                                        className="text-[10px] font-sans-bold uppercase tracking-wide"
                                        style={{ color: navy[700] }}>
                                        {t.subscription.family}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text className="mt-0.5 text-[12px] text-ash-grey-500">
                                  {subtitleFor(plan, t)}
                                </Text>
                              </View>

                              <View className="items-end">
                                <Text className="font-sans-bold text-[16px] text-blue-spruce-900">
                                  {formatMoney(plan.amount, plan.currency)}
                                </Text>
                                <Text className="text-[11px] text-ash-grey-500">
                                  / {planPeriodLabel(plan, t)}
                                </Text>
                                {perMonth != null && plan.intervalDays === 7 ? (
                                  <Text className="mt-0.5 text-[10px] text-ash-grey-400">
                                    ≈ {formatMoney(perMonth, plan.currency)}/mo
                                  </Text>
                                ) : null}
                              </View>
                            </View>

                            {isSelected ? (
                              <View
                                className="mt-3 gap-1.5 border-t pt-3"
                                style={{ borderTopColor: navy[50] }}>
                                {features.map((feature) => (
                                  <View key={feature} className="flex-row items-center gap-2">
                                    <View
                                      className="h-4 w-4 items-center justify-center rounded-full"
                                      style={{ backgroundColor: navy[700] }}>
                                      <Ionicons name="checkmark" size={10} color="#fff" />
                                    </View>
                                    <Text className="flex-1 text-[12px] text-ash-grey-800">
                                      {feature}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View className="mt-4">
              <Pressable
                onPress={() => {
                  if (selected) onSubscribe(selected);
                }}
                disabled={checkingOut || !selected}
                className="items-center rounded-full active:opacity-90"
                style={{
                  backgroundColor: navy[800],
                  paddingVertical: 16,
                  opacity: checkingOut || !selected ? 0.65 : 1,
                }}>
                {checkingOut ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[16px] font-sans-bold text-white">
                    {t.subscription.subscribeNow}
                    {selected ? ` · ${formatMoney(selected.amount, selected.currency)}` : ''}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={onRefresh}
                disabled={refreshing || checkingOut}
                className="mt-3 items-center py-1">
                <Text className="text-[14px] font-sans-semibold text-blue-spruce-700">
                  {refreshing ? t.subscription.checking : t.subscription.alreadyPaidRefresh}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
