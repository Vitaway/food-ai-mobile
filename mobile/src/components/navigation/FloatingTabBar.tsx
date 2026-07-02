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
  notificationUnreadCount?: number;
};

const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'home-outline', label: 'Home' },
  log: { icon: 'add', label: 'Log' },
  analytics: { icon: 'bar-chart-outline', label: 'Insights' },
  profile: { icon: 'person-outline', label: 'Profile' },
};

const ACTIVE_ICON = palette['blue-spruce'][800];
const INACTIVE_ICON = 'rgba(255, 255, 255, 0.65)';

export const FLOATING_TAB_BAR_CLEARANCE = 112;

export function FloatingTabBar({ state, navigation, notificationUnreadCount = 0 }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom - 4, 10);

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
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? { icon: 'ellipse-outline' as const, label: route.name };

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
                  {route.name === 'index' && notificationUnreadCount > 0 ? (
                    <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">
                        {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                      </Text>
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
                  {route.name === 'index' && notificationUnreadCount > 0 ? (
                    <View className="absolute -right-0.5 -top-0.5 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnamon-wood-500 px-1">
                      <Text className="font-sans-bold text-[10px] text-white">
                        {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                      </Text>
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
