import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type Category = {
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgClass: string;
  onPress: () => void;
};

type HomeQuickCategoriesProps = {
  onScan: () => void;
  onDescribe: () => void;
  onWater: () => void;
  onInsights: () => void;
};

export function HomeQuickCategories({ onScan, onDescribe, onWater, onInsights }: HomeQuickCategoriesProps) {
  const categories: Category[] = [
    { id: 'scan', label: 'Scan', icon: 'camera-outline', color: '#1D9E75', bgClass: 'bg-shamrock-50', onPress: onScan },
    { id: 'text', label: 'Describe', icon: 'create-outline', color: '#023459', bgClass: 'bg-blue-spruce-50', onPress: onDescribe },
    { id: 'water', label: 'Water', icon: 'water-outline', color: '#023459', bgClass: 'bg-blue-spruce-50', onPress: onWater },
    { id: 'insights', label: 'Insights', icon: 'stats-chart-outline', color: '#FF6F32', bgClass: 'bg-cinnamon-wood-50', onPress: onInsights },
  ];

  return (
    <View className="mb-6 flex-row justify-between px-1">
      {categories.map((item) => (
        <Pressable key={item.id} onPress={item.onPress} className="items-center gap-2 active:opacity-85">
          <View
            className={`h-14 w-14 items-center justify-center rounded-full bg-white ${item.bgClass}`}
            style={{
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <Text className="font-sans-medium text-xs text-neutral-600">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
