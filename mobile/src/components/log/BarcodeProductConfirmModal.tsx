import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import type { NutritionFoodLookup } from '@/services/remote/nutritionApi';

type BarcodeProductConfirmModalProps = {
  visible: boolean;
  product: NutritionFoodLookup | null;
  onConfirm: () => void;
  onSkip: () => void;
};

export function BarcodeProductConfirmModal({
  visible,
  product,
  onConfirm,
  onSkip,
}: BarcodeProductConfirmModalProps) {
  const { t } = useI18n();
  if (!product) return null;

  const subtitle = [product.brand, product.quantity, product.category].filter(Boolean).join(' · ');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <Pressable className="absolute inset-0" onPress={onSkip} />
        <View className="w-full max-w-[360px] overflow-hidden rounded-[28px] bg-white">
          <View className="items-center bg-ash-grey-50 px-5 pt-6 pb-4">
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                className="h-36 w-36 rounded-[28px] bg-white"
                resizeMode="contain"
              />
            ) : (
              <View className="h-36 w-36 items-center justify-center rounded-[28px] bg-white">
                <Ionicons name="nutrition-outline" size={44} color="#023459" />
              </View>
            )}
            <Text className="mt-4 text-center font-sans-bold text-xl text-blue-spruce-900">
              {t.log.barcodeConfirmTitle}
            </Text>
            <Text className="mt-2 text-center font-sans-semibold text-base text-neutral-900" numberOfLines={3}>
              {product.name}
            </Text>
            {subtitle ? (
              <Text className="mt-1 text-center text-sm text-neutral-500" numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-3 px-4 py-4">
            <Pressable
              accessibilityRole="button"
              onPress={onSkip}
              className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-ash-grey-200 bg-ash-grey-50 active:opacity-85">
              <Text className="font-sans-semibold text-[15px] text-blue-spruce-900">{t.log.barcodeSkip}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-blue-spruce-700 px-3 active:opacity-85">
              <Text className="text-center font-sans-semibold text-[15px] text-white">{t.log.barcodeAdd}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
