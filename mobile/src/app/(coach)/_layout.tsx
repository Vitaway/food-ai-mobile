import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar, type FloatingTabBarProps } from '@/components/navigation/FloatingTabBar';
import { useCoachQueueWaitingCount } from '@/hooks/useCoachQueueWaitingCount';
import { useChatUnreadCount } from '@/hooks/useChatUnreadCount';

export default function CoachTabLayout() {
  const queueWaitingCount = useCoachQueueWaitingCount();
  const chatUnread = useChatUnreadCount();

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar
            state={props.state}
            navigation={props.navigation as FloatingTabBarProps['navigation']}
            queueWaitingCount={queueWaitingCount}
            chatUnreadCount={chatUnread}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          sceneStyle: { backgroundColor: '#F3F6F8' },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}
