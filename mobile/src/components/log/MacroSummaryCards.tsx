import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type MacroCard = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

type MacroSummaryCardsProps = {
  macros: MacroCard[];
};

export function MacroSummaryCards({ macros }: MacroSummaryCardsProps) {
  return (
    <View className="flex-row gap-3">
      {macros.map((macro) => (
        <View
          key={macro.label}
          className="flex-1 items-center rounded-3xl bg-white px-3 py-4"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
          <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: macro.bg }}>
            <Ionicons name={macro.icon} size={20} color={macro.color} />
          </View>
          <Text className="mt-2 font-sans-bold text-lg text-neutral-900">{macro.value}</Text>
          <Text className="mt-0.5 text-xs text-neutral-500">{macro.label}</Text>
        </View>
      ))}
    </View>
  );
}
