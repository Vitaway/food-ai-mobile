import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, View } from 'react-native';

import { MacroSummaryCards } from '@/components/log/MacroSummaryCards';
import { ScanFrameOverlay } from '@/components/log/ScanFrameOverlay';
import { Text } from '@/components/ui/Text';
import type { MealAnalysisPreview } from '@/types';

type LogScanStepProps = {
  bottomPadding: number;
  imageUri: string;
  preview?: MealAnalysisPreview | null;
  onBack: () => void;
  onCapture: () => void;
};

export function LogScanStep({ bottomPadding, imageUri, preview, onBack, onCapture }: LogScanStepProps) {
  const macros = preview
    ? [
        {
          label: 'Protein',
          value: `${preview.totalNutrition.proteinG}g`,
          icon: 'barbell-outline' as const,
          color: '#50af73',
          bg: '#eef7f1',
        },
        {
          label: 'Carbs',
          value: `${preview.totalNutrition.carbsG}g`,
          icon: 'nutrition-outline' as const,
          color: '#168376',
          bg: '#e8f5f3',
        },
        {
          label: 'Fat',
          value: `${preview.totalNutrition.fatG}g`,
          icon: 'water-outline' as const,
          color: '#c4846e',
          bg: '#f8f0ed',
        },
      ]
    : [];

  return (
    <View className="flex-1 bg-ash-grey-50">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <Ionicons name="arrow-back" size={20} color="#4f5346" />
        </Pressable>
        <Text className="font-sans-semibold text-base text-neutral-800">Scan meal</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="mx-5 mt-2 overflow-hidden rounded-[28px] bg-white">
        <View className="relative h-[280px]">
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          <ScanFrameOverlay />
        </View>
      </View>

      <View className="mt-6 items-center px-5">
        <Text className="font-sans-bold text-2xl text-neutral-900">
          {preview?.mealName ?? 'Ready to analyze'}
        </Text>
        <Text className="mt-1 text-base text-neutral-500">
          {preview ? `${preview.totalWeightG} g` : 'Tap below to run AI analysis'}
        </Text>
      </View>

      {preview ? (
        <View className="mt-6 px-5">
          <MacroSummaryCards macros={macros} />
        </View>
      ) : null}

      <View className="flex-1" />

      <View className="items-center" style={{ paddingBottom: bottomPadding }}>
        <Pressable
          onPress={onCapture}
          className="h-[72px] w-[72px] items-center justify-center rounded-full bg-blue-spruce-950"
          style={Platform.select({
            ios: {
              shadowColor: '#051f1c',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: { elevation: 10 },
          })}>
          <View className="h-[58px] w-[58px] rounded-full border-2 border-white/20" />
        </Pressable>
        <Text className="mt-3 text-sm text-neutral-500">Tap to analyze meal</Text>
      </View>
    </View>
  );
}
