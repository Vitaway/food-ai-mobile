import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';

export type FloatingTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: {
      type: string;
      target?: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
  /** Patient home badge — unread notifications. */
  notificationUnreadCount?: number;
  chatUnreadCount?: number;
  /** Coach queue tab badge — meals waiting for review. */
  queueWaitingCount?: number;
};

const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'home-outline', label: 'Home' },
  queue: { icon: 'clipboard-outline', label: 'Queue' },
  log: { icon: 'add', label: 'Log' },
  chat: { icon: 'chatbubbles-outline', label: 'Chat' },
  profile: { icon: 'person-outline', label: 'Profile' },
  clients: { icon: 'people-outline', label: 'Clients' },
};

const COACH_TAB_LABELS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'home-outline', label: 'Home' },
  queue: { icon: 'clipboard-outline', label: 'Queue' },
  clients: { icon: 'people-outline', label: 'Clients' },
  profile: { icon: 'person-outline', label: 'Profile' },
};

const ACTIVE_ICON = palette['blue-spruce'][800];
const INACTIVE_ICON = 'rgba(255, 255, 255, 0.65)';

export const FLOATING_TAB_BAR_CLEARANCE = 112;

export function FloatingTabBar({
  state,
  navigation,
  notificationUnreadCount = 0,
  chatUnreadCount = 0,
  queueWaitingCount = 0,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom - 4, 10);
  const isCoachBar = state.routes.some((route) => route.name === 'clients');
  const visibleRoutes = state.routes.filter((route) => {
    if (route.name === 'chat' && isCoachBar) return false;
    return route.name in TAB_CONFIG || route.name in COACH_TAB_LABELS;
  });

  const formatBadge = (count: number) => (count > 9 ? '9+' : String(count));

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ bottom: bottomOffset }}>
      <View
        style={[
          {
            width: '92%',
            maxWidth: 380,
            minHeight: 60,
            borderRadius: 9999,
            paddingHorizontal: 8,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: BRAND_HEADER_COLOR,
          },
          Platform.select({
            ios: {
              shadowColor: palette['blue-spruce'][900],
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.32,
              shadowRadius: 22,
            },
            android: { elevation: 14 },
          }),
        ]}>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((entry) => entry.key === route.key);
          const isFocused = state.index === routeIndex;
          const override = isCoachBar ? COACH_TAB_LABELS[route.name] : undefined;
          const config = override ?? TAB_CONFIG[route.name] ?? { icon: 'ellipse-outline' as const, label: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const showQueueBadge =
            isCoachBar && route.name === 'queue' && queueWaitingCount > 0;
          const showHomeNotificationBadge =
            !isCoachBar && route.name === 'index' && notificationUnreadCount > 0;
          const showChatBadge = route.name === 'chat' && chatUnreadCount > 0;
          const queueBadgeLabel = formatBadge(queueWaitingCount);
          const notificationBadgeLabel = formatBadge(notificationUnreadCount);
          const chatBadgeLabel = formatBadge(chatUnreadCount);

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={config.label}
              accessibilityState={isFocused ? { selected: true } : {}}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {isFocused ? (
                <View
                  className="relative flex-row items-center gap-2 rounded-full bg-white px-4 py-2.5"
                  style={Platform.select({
                    ios: {
                      shadowColor: '#1a1c17',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                    },
                    android: { elevation: 4 },
                  })}>
                  <Ionicons
                    name={config.icon}
                    size={config.icon === 'add' ? 22 : 20}
                    color={ACTIVE_ICON}
                  />
                  <Text className="font-sans-semibold text-sm text-neutral-900">{config.label}</Text>
                  {showQueueBadge ? (
                    <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">{queueBadgeLabel}</Text>
                    </View>
                  ) : null}
                  {showHomeNotificationBadge ? (
                    <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">
                        {notificationBadgeLabel}
                      </Text>
                    </View>
                  ) : null}
                  {showChatBadge ? (
                    <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">{chatBadgeLabel}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <Ionicons
                    name={config.icon}
                    size={config.icon === 'add' ? 24 : 22}
                    color={INACTIVE_ICON}
                  />
                  {showQueueBadge ? (
                    <View className="absolute -right-0.5 -top-0.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">{queueBadgeLabel}</Text>
                    </View>
                  ) : null}
                  {showHomeNotificationBadge ? (
                    <View className="absolute -right-0.5 -top-0.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">
                        {notificationBadgeLabel}
                      </Text>
                    </View>
                  ) : null}
                  {showChatBadge ? (
                    <View className="absolute -right-0.5 -top-0.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">{chatBadgeLabel}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
