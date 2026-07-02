import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { MacroBarRow } from '@/hooks/useInsightsData';

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

type InsightsMacroPanelProps = {
  macros: MacroBarRow[];
  hasData: boolean;
};

export function InsightsMacroPanel({ macros, hasData }: InsightsMacroPanelProps) {
  return (
    <View className="rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Macro balance (daily avg)</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">Compared to your personal targets</Text>

      <View className="mt-4 gap-4">
        {macros.map((macro) => {
          const ratio = macro.target > 0 ? Math.min(macro.value / macro.target, 1) : 0;
          const pct = Math.round(ratio * 100);
          return (
            <View key={macro.label}>
              <View className="mb-1.5 flex-row items-end justify-between">
                <Text className="font-sans-medium text-sm text-neutral-700">{macro.label}</Text>
                <Text className="font-sans-semibold text-sm text-neutral-900">
                  {hasData ? `${Math.round(macro.value)}g` : '0g'} / {macro.target}g
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-ash-grey-100">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${hasData ? pct : 0}%`, backgroundColor: macro.hex }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
