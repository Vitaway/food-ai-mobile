import { Tabs } from 'expo-router';

import { FloatingTabBar, type FloatingTabBarProps } from '@/components/navigation/FloatingTabBar';

export default function TabLayout() {
  return (
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
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="log" options={{ title: 'Log' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Insights' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
