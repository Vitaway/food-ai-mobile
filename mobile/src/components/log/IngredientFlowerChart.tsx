import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type Petal = {
  label: string;
  percent: number;
  color: string;
};

type IngredientFlowerChartProps = {
  imageUri?: string;
  petals: Petal[];
};

const PETAL_POSITIONS: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
  { top: 0, left: 96 },
  { top: 36, right: 0 },
  { bottom: 36, right: 0 },
  { bottom: 0, left: 96 },
  { bottom: 36, left: 0 },
  { top: 36, left: 0 },
];

export function IngredientFlowerChart({ imageUri, petals }: IngredientFlowerChartProps) {
  return (
    <View className="h-[300px] items-center justify-center">
      <View className="h-[280px] w-[280px]">
        {petals.map((petal, index) => {
          const position = PETAL_POSITIONS[index % PETAL_POSITIONS.length];

          return (
            <View
              key={petal.label}
              className="absolute min-w-[88px] items-center rounded-2xl px-3 py-2"
              style={[
                position,
                {
                  backgroundColor: `${petal.color}22`,
                  borderWidth: 1,
                  borderColor: `${petal.color}55`,
                },
              ]}>
              <Text className="font-sans-bold text-sm" style={{ color: petal.color }}>
                {petal.percent}%
              </Text>
              <Text className="text-xs text-neutral-600">{petal.label}</Text>
            </View>
          );
        })}

        <View className="absolute left-[90px] top-[90px] h-[100px] w-[100px] overflow-hidden rounded-full border-4 border-white bg-shamrock-100">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-3xl">🍽️</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
