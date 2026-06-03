import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, View } from 'react-native';

import { MacroSummaryCards } from '@/components/log/MacroSummaryCards';
import { LogCard } from '@/components/log/LogScreenShell';
import { ScanFrameOverlay } from '@/components/log/ScanFrameOverlay';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { MealAnalysisPreview } from '@/types';

type LogScanStepProps = {
  imageUri: string;
  preview?: MealAnalysisPreview | null;
  loading?: boolean;
  bottomPadding: number;
  onCapture: () => void;
};

export function LogScanStep({
  imageUri,
  preview,
  loading = false,
  bottomPadding,
  onCapture,
}: LogScanStepProps) {
  const macros = preview
    ? [
        {
          label: 'Protein',
          value: `${preview.totalNutrition.proteinG}g`,
          icon: 'barbell-outline' as const,
          color: '#1D9E75',
          bg: '#eef7f1',
        },
        {
          label: 'Carbs',
          value: `${preview.totalNutrition.carbsG}g`,
          icon: 'nutrition-outline' as const,
          color: '#023459',
          bg: '#e8eef3',
        },
        {
          label: 'Fat',
          value: `${preview.totalNutrition.fatG}g`,
          icon: 'water-outline' as const,
          color: '#023459',
          bg: '#e8eef3',
        },
      ]
    : [];

  return (
    <View className="flex-1">
      <LogCard className="overflow-hidden p-0">
        <View className="relative h-[240px]">
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          <ScanFrameOverlay />
        </View>
        <View className="px-5 pb-5 pt-4">
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">
            {preview?.mealName ?? 'Ready to analyze'}
          </Text>
          {preview ? (
            <Text className="mt-1 text-center text-sm text-neutral-500">
              {preview.totalWeightG} g · {preview.totalNutrition.caloriesKcal} kcal
            </Text>
          ) : (
            <Text className="mt-1 text-center text-sm text-neutral-500">Tap analyze when your plate is in frame</Text>
          )}
        </View>
      </LogCard>

      {preview ? (
        <View className="mt-4">
          <MacroSummaryCards macros={macros} />
        </View>
      ) : null}

      <View className="mt-auto items-center pt-6" style={{ paddingBottom: bottomPadding }}>
        <Pressable
          onPress={onCapture}
          disabled={loading}
          className="h-[68px] w-[68px] items-center justify-center rounded-full bg-shamrock-500"
          style={Platform.select({
            ios: {
              shadowColor: '#1D9E75',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: { elevation: 8 },
          })}>
          <Ionicons name="scan-outline" size={30} color="#ffffff" />
        </Pressable>
        {!preview ? (
          <View className="mt-5 w-full">
            <Button
              label={loading ? 'Analyzing…' : 'Analyze photo'}
              variant="secondary"
              onPress={onCapture}
              disabled={loading}
            />
          </View>
        ) : (
          <View className="mt-5 w-full">
            <Button label={loading ? 'Analyzing…' : 'Re-analyze'} variant="outline" onPress={onCapture} disabled={loading} />
          </View>
        )}
      </View>
    </View>
  );
}
