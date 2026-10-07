import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar, type FloatingTabBarProps } from '@/components/navigation/FloatingTabBar';
import { semanticColors } from '@/design-system/colors';
import { useNotificationUnreadCount } from '@/hooks/useAppNotifications';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';

export default function TabLayout() {
  const notificationUnread = useNotificationUnreadCount();
  const chatUnread = useChatUnreadCount();

  return (
    <View className="flex-1" style={{ backgroundColor: semanticColors.background }}>
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar
            state={props.state}
            navigation={props.navigation as FloatingTabBarProps['navigation']}
            notificationUnreadCount={notificationUnread}
            chatUnreadCount={chatUnread}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: semanticColors.background },
        }}>
        {/* Order matches prototype: Today · Insights · Scan · Coach · Profile */}
        <Tabs.Screen name="index" options={{ title: 'Today' }} />
        <Tabs.Screen name="analytics" options={{ title: 'Insights' }} />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            sceneStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <Tabs.Screen name="chat" options={{ title: 'Coach' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}
