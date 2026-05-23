import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type MacroPillProps = {
  label: string;
  value: string;
  colorClass: string;
};

export function MacroPills({ macros }: { macros: MacroPillProps[] }) {
  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {macros.map((macro) => (
        <View key={macro.label} className="flex-row items-center gap-2 rounded-full bg-ash-grey-50 px-3 py-2">
          <View className={`h-2 w-2 rounded-full ${macro.colorClass}`} />
          <Text className="text-xs text-neutral-500">{macro.label}</Text>
          <Text className="font-sans-semibold text-xs text-neutral-800">{macro.value}</Text>
        </View>
      ))}
    </View>
  );
}

type PillOptionProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  selected?: boolean;
};

export function PillOption({ label, icon, onPress, selected }: PillOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-center gap-2 rounded-full border border-dashed px-6 py-4 ${
        selected ? 'border-blue-spruce-400 bg-white/20' : 'border-white/50 bg-white/10'
      }`}>
      <Ionicons name={icon} size={18} color={selected ? '#d3f8f3' : '#ffffff'} />
      <Text className={`font-sans-medium text-base ${selected ? 'text-white' : 'text-white/90'}`}>{label}</Text>
    </Pressable>
  );
}
