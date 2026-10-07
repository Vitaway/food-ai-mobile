import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import { useI18n } from '@/context/LocaleContext';

export type ScanModeId = 'photo' | 'barcode' | 'speak';

type ScanModeTabsProps = {
  active: ScanModeId;
  onChange: (mode: ScanModeId) => void;
  disabled?: boolean;
};

const MODES: Array<{
  id: ScanModeId;
  icon: ComponentProps<typeof Ionicons>['name'];
  labelKey: 'scanModePhoto' | 'scanModeBarcode' | 'scanModeSpeak';
}> = [
  { id: 'photo', icon: 'camera-outline', labelKey: 'scanModePhoto' },
  { id: 'barcode', icon: 'barcode-outline', labelKey: 'scanModeBarcode' },
  { id: 'speak', icon: 'mic-outline', labelKey: 'scanModeSpeak' },
];

export function ScanModeTabs({ active, onChange, disabled }: ScanModeTabsProps) {
  const { t } = useI18n();

  return (
    <View className="flex-row gap-2 rounded-[22px] border border-ash-grey-100 bg-white p-1.5">
      {MODES.map((mode) => {
        const selected = mode.id === active;
        return (
          <Pressable
            key={mode.id}
            disabled={disabled}
            onPress={() => onChange(mode.id)}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: !!disabled }}
            className={`min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-[16px] px-2 py-2.5 ${
              selected ? 'bg-blue-spruce-800' : 'bg-transparent'
            }`}>
            <Ionicons
              name={mode.icon}
              size={16}
              color={selected ? '#ffffff' : palette['ash-grey'][500]}
            />
            <Text
              className={`text-[12px] font-sans-semibold ${
                selected ? 'text-white' : 'text-ash-grey-600'
              }`}>
              {t.log[mode.labelKey]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
