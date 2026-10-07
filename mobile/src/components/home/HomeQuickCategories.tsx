import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { semanticColors } from '@/design-system/colors';

type Category = {
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgClass: string;
  featured?: boolean;
  onPress: () => void;
};

type HomeQuickCategoriesProps = {
  onScan: () => void;
  onSpeak: () => void;
  onSearch: () => void;
  onBarcode: () => void;
};

/** Prototype quick row: Scan · Speak · Search · Barcode */
export function HomeQuickCategories({
  onScan,
  onSpeak,
  onSearch,
  onBarcode,
}: HomeQuickCategoriesProps) {
  const { t } = useI18n();
  const categories: Category[] = [
    {
      id: 'scan',
      label: t.home.quickScanPlate,
      icon: 'camera-outline',
      color: '#ffffff',
      bgClass: 'bg-blue-spruce-600',
      featured: true,
      onPress: onScan,
    },
    {
      id: 'speak',
      label: t.home.quickSpeak,
      icon: 'mic-outline',
      color: semanticColors.primary,
      bgClass: 'bg-white',
      onPress: onSpeak,
    },
    {
      id: 'search',
      label: t.home.quickSearch,
      icon: 'search-outline',
      color: semanticColors.primary,
      bgClass: 'bg-white',
      onPress: onSearch,
    },
    {
      id: 'barcode',
      label: t.home.quickBarcode,
      icon: 'barcode-outline',
      color: semanticColors.primary,
      bgClass: 'bg-white',
      onPress: onBarcode,
    },
  ];

  return (
    <View className="mb-2 flex-row gap-2 px-1">
      {categories.map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          className={`flex-1 items-center gap-1.5 rounded-[22px] px-1.5 py-3 active:opacity-85 ${
            item.featured ? 'bg-blue-spruce-600' : 'bg-white'
          }`}
          style={
            item.featured
              ? undefined
              : {
                  shadowColor: '#1a1c17',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 2,
                }
          }>
          <View
            className={`h-9 w-9 items-center justify-center rounded-[14px] ${
              item.featured ? 'bg-white/20' : 'bg-ash-grey-100'
            }`}>
            <Ionicons name={item.icon} size={20} color={item.color} />
          </View>
          <Text
            className={`text-center font-sans-bold text-[11px] ${
              item.featured ? 'text-white' : 'text-blue-spruce-700'
            }`}
            numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
