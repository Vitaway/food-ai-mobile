import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { palette, semanticColors } from '@/design-system/colors';
import { setLogMethodIntent } from '@/utils/logIntent';

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

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  analytics: 'bar-chart-outline',
  queue: 'clipboard-outline',
  log: 'add',
  chat: 'chatbubbles-outline',
  profile: 'person-outline',
  clients: 'people-outline',
};

const ACTIVE_ICON = semanticColors.primary;
const INACTIVE_ICON = palette['ash-grey'][500];
const FAB_BG = semanticColors.primary;
const FAB_ICON = '#ffffff';
const BAR_BG = 'rgba(255, 255, 255, 0.96)';
const BAR_LINE = palette['ash-grey'][300];

export const FLOATING_TAB_BAR_CLEARANCE = 96;

export function FloatingTabBar({
  state,
  navigation,
  notificationUnreadCount = 0,
  chatUnreadCount = 0,
  queueWaitingCount = 0,
}: FloatingTabBarProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const isCoachBar = state.routes.some((route) => route.name === 'clients');
  const visibleRoutes = state.routes.filter((route) => {
    if (route.name === 'chat' && isCoachBar) return false;
    return route.name in TAB_ICONS;
  });

  const labelFor = (routeName: string): string => {
    if (isCoachBar) {
      if (routeName === 'index') return t.tabs.home;
      if (routeName === 'queue') return 'Queue';
      if (routeName === 'clients') return 'Clients';
      if (routeName === 'profile') return t.tabs.profile;
      return routeName;
    }
    if (routeName === 'index') return t.tabs.home;
    if (routeName === 'analytics') return t.tabs.insights;
    if (routeName === 'log') return t.tabs.log;
    if (routeName === 'chat') return t.tabs.chat;
    if (routeName === 'profile') return t.tabs.profile;
    return routeName;
  };

  const formatBadge = (count: number) => (count > 9 ? '9+' : String(count));

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0"
      style={{ bottom: 0 }}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            backgroundColor: BAR_BG,
            borderTopWidth: 1,
            borderTopColor: BAR_LINE,
            paddingHorizontal: 8,
            paddingTop: 6,
            paddingBottom: bottomPad,
            minHeight: 56 + bottomPad,
          },
          Platform.select({
            ios: {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: { elevation: 8 },
          }),
        ]}>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((entry) => entry.key === route.key);
          const isFocused = state.index === routeIndex;
          const isFab = route.name === 'log' && !isCoachBar;
          const icon = TAB_ICONS[route.name] ?? 'ellipse-outline';
          const label = labelFor(route.name);

          const onPress = () => {
            if (isFab) {
              // Plus opens the method picker (camera / gallery / speak / barcode / …).
              setLogMethodIntent('method');
            }

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

          if (isFab) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={isFocused ? { selected: true } : {}}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View
                  style={[
                    {
                      width: 64,
                      height: 64,
                      marginTop: -28,
                      borderRadius: 32,
                      backgroundColor: FAB_BG,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 5,
                      borderColor: '#ffffff',
                    },
                    Platform.select({
                      ios: {
                        shadowColor: semanticColors.primary,
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.35,
                        shadowRadius: 16,
                      },
                      android: { elevation: 10 },
                    }),
                  ]}>
                  <Ionicons name={icon} size={28} color={FAB_ICON} />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={isFocused ? { selected: true } : {}}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                paddingVertical: 4,
                minHeight: 52,
              }}>
              <View className="relative items-center justify-center">
                <Ionicons
                  name={isFocused ? (icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : icon}
                  size={22}
                  color={isFocused ? ACTIVE_ICON : INACTIVE_ICON}
                />
                {showQueueBadge ? (
                  <View className="absolute -right-2.5 -top-1.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-400 px-1">
                    <Text className="font-sans-bold text-[10px] text-blue-spruce-900">
                      {queueBadgeLabel}
                    </Text>
                  </View>
                ) : null}
                {showHomeNotificationBadge ? (
                  <View className="absolute -right-2.5 -top-1.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-400 px-1">
                    <Text className="font-sans-bold text-[10px] text-blue-spruce-900">
                      {notificationBadgeLabel}
                    </Text>
                  </View>
                ) : null}
                {showChatBadge ? (
                  <View className="absolute -right-2.5 -top-1.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-400 px-1">
                    <Text className="font-sans-bold text-[10px] text-blue-spruce-900">
                      {chatBadgeLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                className={`font-sans-semibold text-[11px] leading-[14px] ${
                  isFocused ? 'text-blue-spruce-600' : 'text-ash-grey-500'
                }`}
                numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
