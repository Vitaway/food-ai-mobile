import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar, type FloatingTabBarProps } from '@/components/navigation/FloatingTabBar';
import { useNotificationUnreadCount } from '@/hooks/useAppNotifications';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';

export default function TabLayout() {
  const notificationUnread = useNotificationUnreadCount();
  const chatUnread = useChatUnreadCount();

  return (
    <View className="flex-1">
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
          sceneStyle: { backgroundColor: '#ffffff' },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            sceneStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <Tabs.Screen name="chat" options={{ title: 'Coach chat' }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}
