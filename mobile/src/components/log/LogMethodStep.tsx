import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedScalePressable, enteringCard } from '@/components/ui/motion';
import { Text } from '@/components/ui/Text';
import { LOG_METHOD_IMAGES } from '@/constants/logMethodImages';
import { useI18n } from '@/context/LocaleContext';
import { semanticColors } from '@/design-system/colors';

export type LogMethodId = 'camera' | 'gallery' | 'text' | 'past' | 'barcode' | 'speak' | 'water';

type LogMethodStepProps = {
  loading?: boolean;
  onSelectMethod: (id: LogMethodId) => void;
};

export function LogMethodStep({ loading = false, onSelectMethod }: LogMethodStepProps) {
  const { t } = useI18n();

  const methods: Array<{
    id: LogMethodId;
    title: string;
    subtitle: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    tintClass: string;
    iconColor: string;
    image?: number;
  }> = [
    {
      id: 'camera',
      title: t.log.methodScan,
      subtitle: t.log.methodScanHint,
      icon: 'camera-outline',
      tintClass: 'bg-shamrock-50',
      iconColor: '#1D9E75',
      image: LOG_METHOD_IMAGES.camera,
    },
    {
      id: 'gallery',
      title: t.log.methodGallery,
      subtitle: t.log.methodGalleryHint,
      icon: 'images-outline',
      tintClass: 'bg-blue-spruce-50',
      iconColor: '#1a3a2a',
      image: LOG_METHOD_IMAGES.gallery,
    },
    {
      id: 'text',
      title: t.log.methodDescribe,
      subtitle: t.log.methodDescribeHint,
      icon: 'create-outline',
      tintClass: 'bg-blue-spruce-50',
      iconColor: '#1a3a2a',
      image: LOG_METHOD_IMAGES.text,
    },
    {
      id: 'barcode',
      title: t.log.methodBarcode,
      subtitle: t.log.methodBarcodeHint,
      icon: 'barcode-outline',
      tintClass: 'bg-shamrock-50',
      iconColor: '#1D9E75',
      image: LOG_METHOD_IMAGES.gallery,
    },
    {
      id: 'speak',
      title: t.log.methodSpeak,
      subtitle: t.log.methodSpeakHint,
      icon: 'mic-outline',
      tintClass: 'bg-cinnamon-wood-50',
      iconColor: semanticColors.accentOrange,
      image: LOG_METHOD_IMAGES.text,
    },
    {
      id: 'water',
      title: t.log.methodWater,
      subtitle: t.log.methodWaterHint,
      icon: 'water-outline',
      tintClass: 'bg-blue-spruce-50',
      iconColor: '#1a3a2a',
    },
    {
      id: 'past',
      title: t.log.methodRepeat,
      subtitle: t.log.methodRepeatHint,
      icon: 'time-outline',
      tintClass: 'bg-cinnamon-wood-50',
      iconColor: semanticColors.accentOrange,
      image: LOG_METHOD_IMAGES.past,
    },
  ];

  return (
    <View className="gap-3">
      {methods.map((method, index) => (
        <Animated.View key={method.id} entering={enteringCard(index)}>
          <AnimatedScalePressable
            disabled={loading}
            onPress={() => onSelectMethod(method.id)}
            className="overflow-hidden rounded-3xl bg-white"
            style={{
              shadowColor: '#1a1c17',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.06,
              shadowRadius: 14,
              elevation: 2,
            }}>
            <View className="flex-row items-center gap-3 p-4">
              <View
                className={`h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${method.tintClass}`}>
                {method.image != null ? (
                  <Image source={method.image} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Ionicons name={method.icon} size={28} color={method.iconColor} />
                )}
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-semibold text-base text-neutral-900">{method.title}</Text>
                <Text className="mt-0.5 text-sm leading-5 text-neutral-500">{method.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#848a75" />
            </View>
          </AnimatedScalePressable>
        </Animated.View>
      ))}
    </View>
  );
}
