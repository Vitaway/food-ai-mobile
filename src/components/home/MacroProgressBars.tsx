import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

type MacroBar = {
  label: string;
  consumed: number;
  target: number;
  colorClass: string;
};

type MacroProgressBarsProps = {
  macros: MacroBar[];
};

export function MacroProgressBars({ macros }: MacroProgressBarsProps) {
  return (
    <View className="gap-4 rounded-3xl bg-white p-5 shadow-sm">
      <Text className="font-sans-semibold text-lg text-neutral-900">Macros</Text>
      {macros.map((macro) => {
        const progress = macro.target > 0 ? Math.min(macro.consumed / macro.target, 1) : 0;

        return (
          <View key={macro.label} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-medium text-neutral-700">{macro.label}</Text>
              <Text className="text-sm text-neutral-500">
                {macro.consumed}g / {macro.target}g
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
              <View className={`h-full rounded-full ${macro.colorClass}`} style={{ width: `${progress * 100}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
