import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';

type StatTile = {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  tint: string;
  color: string;
};

type InsightsStatTilesProps = {
  mealsCount: number;
  avgCalories: number;
  hydrationRate: number;
  avgWaterCups: number;
  waterTargetCups: number;
};

export function InsightsStatTiles({
  mealsCount,
  avgCalories,
  hydrationRate,
  avgWaterCups,
  waterTargetCups,
}: InsightsStatTilesProps) {
  const tiles: StatTile[] = [
    {
      label: 'Meals',
      value: String(mealsCount),
      icon: 'restaurant-outline',
      tint: 'bg-shamrock-50',
      color: '#1D9E75',
    },
    {
      label: 'Avg kcal',
      value: String(avgCalories),
      icon: 'flame-outline',
      tint: 'bg-cinnamon-wood-50',
      color: semanticColors.accentOrange,
    },
    {
      label: 'Hydration',
      value: `${hydrationRate}%`,
      icon: 'water-outline',
      tint: 'bg-blue-spruce-50',
      color: '#023459',
    },
  ];

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {tiles.map((tile) => (
          <View
            key={tile.label}
            className="flex-1 rounded-2xl border border-ash-grey-100 bg-white p-3"
            style={{
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 1,
            }}>
            <View className={`mb-2 h-9 w-9 items-center justify-center rounded-xl ${tile.tint}`}>
              <Ionicons name={tile.icon} size={18} color={tile.color} />
            </View>
            <Text className="text-xs text-neutral-500">{tile.label}</Text>
            <Text className="mt-0.5 font-sans-bold text-xl text-neutral-900">{tile.value}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center gap-3 rounded-2xl bg-blue-spruce-50 px-4 py-3">
        <Ionicons name="water" size={20} color="#023459" />
        <Text className="flex-1 text-sm text-blue-spruce-900">
          Avg <Text className="font-sans-bold">{avgWaterCups}</Text> cups/day · goal {waterTargetCups} cups
        </Text>
      </View>
    </View>
  );
}
