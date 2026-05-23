import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type WeekDaySelectorProps = {
  selectedIndex?: number;
  onSelect?: (index: number) => void;
};

export function WeekDaySelector({ selectedIndex = 2, onSelect }: WeekDaySelectorProps) {
  return (
    <View className="mt-6 flex-row justify-between px-1">
      {DAYS.map((day, index) => {
        const isSelected = index === selectedIndex;

        return (
          <Pressable
            key={`${day}-${index}`}
            onPress={() => onSelect?.(index)}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              isSelected ? 'bg-white' : 'border border-white/30 bg-white/10'
            }`}>
            <Text className={`font-sans-semibold text-sm ${isSelected ? 'text-blue-spruce-800' : 'text-white/90'}`}>
              {day}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
