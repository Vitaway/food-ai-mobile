import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
};

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'calendar-outline',
  log: 'add',
  analytics: 'bar-chart-outline',
  profile: 'person-outline',
};

export const FLOATING_TAB_BAR_CLEARANCE = 120;

export function FloatingTabBar({ state, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center"
      style={{ bottom: insets.bottom + 12 }}>
      <View
        className="mx-6 flex-row items-end justify-around rounded-full bg-blue-spruce-950 px-3 py-3"
        style={[
          { width: '88%', maxWidth: 360, minHeight: 64 },
          Platform.select({
            ios: {
              shadowColor: palette['blue-spruce'][950],
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.45,
              shadowRadius: 24,
            },
            android: { elevation: 16 },
          }),
        ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isLogTab = route.name === 'log';

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

          const iconName = TAB_ICONS[route.name] ?? 'ellipse-outline';
          const activeColor = '#ffffff';
          const inactiveColor = palette['blue-spruce'][300];

          if (isLogTab) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Log meal"
                className="-mt-8 h-14 w-14 items-center justify-center rounded-full bg-white"
                style={Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                  },
                  android: { elevation: 10 },
                })}>
                <Ionicons name="add" size={28} color={palette['blue-spruce'][800]} />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              className="min-w-[52px] items-center justify-center py-1">
              <Ionicons name={iconName} size={24} color={isFocused ? activeColor : inactiveColor} />
              {isFocused ? <View className="mt-1.5 h-1 w-1 rounded-full bg-white" /> : <View className="mt-1.5 h-1 w-1" />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
