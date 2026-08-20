import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar, type FloatingTabBarProps } from '@/components/navigation/FloatingTabBar';
import { useNotificationUnreadCount } from '@/hooks/useAppNotifications';

export default function CoachTabLayout() {
  const notificationUnread = useNotificationUnreadCount();

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar
            state={props.state}
            navigation={props.navigation as FloatingTabBarProps['navigation']}
            notificationUnreadCount={notificationUnread}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: '#ffffff' },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}
