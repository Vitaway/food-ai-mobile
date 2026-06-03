import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar, type FloatingTabBarProps } from '@/components/navigation/FloatingTabBar';

export default function TabLayout() {
  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar
            state={props.state}
            navigation={props.navigation as FloatingTabBarProps['navigation']}
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
        <Tabs.Screen name="analytics" options={{ title: 'Insights' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}
