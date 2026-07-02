import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Image, Pressable, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import { LOG_METHOD_IMAGES } from '@/constants/logMethodImages';
import { semanticColors } from '@/design-system/colors';

export type LogMethodId = 'camera' | 'gallery' | 'text' | 'past';

const METHODS: Array<{
  id: LogMethodId;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  tintClass: string;
  iconColor: string;
  image: number;
}> = [
  {
    id: 'camera',
    title: 'Scan your plate',
    subtitle: 'Opens camera right away — meal type comes later',
    icon: 'camera-outline',
    tintClass: 'bg-shamrock-50',
    iconColor: '#1D9E75',
    image: LOG_METHOD_IMAGES.camera,
  },
  {
    id: 'gallery',
    title: 'From gallery',
    subtitle: 'Pick a photo and add an optional note for your coach',
    icon: 'images-outline',
    tintClass: 'bg-blue-spruce-50',
    iconColor: '#023459',
    image: LOG_METHOD_IMAGES.gallery,
  },
  {
    id: 'text',
    title: 'Describe it',
    subtitle: 'Type what you ate in your own words',
    icon: 'create-outline',
    tintClass: 'bg-blue-spruce-50',
    iconColor: '#023459',
    image: LOG_METHOD_IMAGES.text,
  },
  {
    id: 'past',
    title: 'Repeat a meal',
    subtitle: 'Log something you ate before',
    icon: 'time-outline',
    tintClass: 'bg-cinnamon-wood-50',
    iconColor: semanticColors.accentOrange,
    image: LOG_METHOD_IMAGES.past,
  },
];

type LogMethodStepProps = {
  loading?: boolean;
  onSelectMethod: (id: LogMethodId) => void;
};

export function LogMethodStep({ loading = false, onSelectMethod }: LogMethodStepProps) {
  return (
    <View className="gap-3">
      <LogCard className="border border-blue-spruce-100 bg-blue-spruce-50/40">
        <Text className="font-sans-semibold text-lg text-neutral-900">Log a meal</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-600">
          Tap a method below. You can log as many meals as you want today — no fixed slots.
        </Text>
      </LogCard>

      {METHODS.map((method) => (
        <Pressable
          key={method.id}
          disabled={loading}
          onPress={() => onSelectMethod(method.id)}
          className="overflow-hidden rounded-3xl bg-white active:opacity-90"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 2,
          }}>
          <View className="flex-row items-center gap-3 p-4">
            <View className={`h-16 w-16 overflow-hidden rounded-2xl ${method.tintClass}`}>
              <Image source={method.image} className="h-full w-full" resizeMode="cover" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-sans-semibold text-base text-neutral-900">{method.title}</Text>
              <Text className="mt-0.5 text-sm leading-5 text-neutral-500">{method.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#848a75" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}
