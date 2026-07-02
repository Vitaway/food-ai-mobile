import { TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type InsightPeriodToggleProps = {
  value: 7 | 30;
  onChange: (days: 7 | 30) => void;
};

const PERIODS = [7, 30] as const;

export function InsightPeriodToggle({ value, onChange }: InsightPeriodToggleProps) {
  return (
    <View className="flex-row rounded-full bg-ash-grey-100 p-1">
      {PERIODS.map((days) => {
        const selected = value === days;
        return (
          <TouchableOpacity
            key={days}
            activeOpacity={0.85}
            onPress={() => onChange(days)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{ flex: 1 }}>
            <View
              className={`items-center rounded-full py-2 ${selected ? 'bg-white' : ''}`}
              style={
                selected
                  ? {
                      shadowColor: '#051f1c',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 3,
                      elevation: 2,
                    }
                  : undefined
              }>
              <Text
                className={`font-sans-semibold text-sm ${
                  selected ? 'text-blue-spruce-800' : 'text-neutral-500'
                }`}>
                {days} days
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
