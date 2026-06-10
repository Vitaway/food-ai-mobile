import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Pressable, View } from 'react-native';

import { MacroSummaryCards } from '@/components/log/MacroSummaryCards';
import { PlateSizeCard } from '@/components/log/PlateSizeCard';
import { LogCard } from '@/components/log/LogScreenShell';
import { ScanFrameOverlay } from '@/components/log/ScanFrameOverlay';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { PlateContainerType } from '@/services/contracts/plateDetectionService';
import type { MealAnalysisPreview } from '@/types';
import { formatDiameterCm } from '@/utils/formatDiameter';

type LogScanStepProps = {
  imageUri: string;
  preview?: MealAnalysisPreview | null;
  detectingPlate?: boolean;
  plateDetected?: boolean;
  containerType?: PlateContainerType | null;
  plateDiameterCm?: number | null;
  plateConfidence?: number | null;
  plateDetectionError?: string | null;
  loading?: boolean;
  bottomPadding: number;
  onRetake: () => void;
  onCapture: () => void;
};

function badgeLabel(containerType: PlateContainerType | null | undefined, diameterCm: number): string {
  const prefix = containerType === 'bowl' ? 'Bowl' : containerType === 'plate' ? 'Plate' : 'Dish';
  return `${prefix} ${formatDiameterCm(diameterCm)}`;
}

export function LogScanStep({
  imageUri,
  preview,
  detectingPlate = false,
  plateDetected = false,
  containerType = null,
  plateDiameterCm = null,
  plateConfidence = null,
  plateDetectionError = null,
  loading = false,
  bottomPadding,
  onRetake,
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

  const showPlateBadge = plateDetected && plateDiameterCm != null && !detectingPlate;

  return (
    <View className="flex-1">
      <LogCard className="overflow-hidden p-0">
        <View className="relative h-[240px]">
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          <ScanFrameOverlay />
          {showPlateBadge ? (
            <View className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1.5">
              <Text className="font-sans-semibold text-xs text-white">
                {badgeLabel(containerType, plateDiameterCm!)}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="px-5 pb-5 pt-4">
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">
            {preview?.mealName ?? 'Photo captured'}
          </Text>
          {preview ? (
            <Text className="mt-1 text-center text-sm text-neutral-500">
              {preview.totalWeightG} g · {preview.totalNutrition.caloriesKcal} kcal
              {preview.plateDiameterCm ? ` · Plate ${formatDiameterCm(preview.plateDiameterCm)}` : ''}
            </Text>
          ) : (
            <Text className="mt-1 text-center text-sm text-neutral-500">
              Hold your phone at arm&apos;s length (30–40 cm) for the most accurate plate size.
            </Text>
          )}
        </View>
      </LogCard>

      <PlateSizeCard
        compact
        detecting={detectingPlate}
        detected={plateDetected}
        containerType={containerType}
        plateDiameterCm={plateDiameterCm}
        confidence={plateConfidence}
        errorMessage={plateDetectionError}
      />

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
        <View className="mt-5 w-full gap-3">
          <Button
            label={loading ? 'Analyzing…' : preview ? 'Re-analyze' : 'Analyze photo'}
            variant="secondary"
            onPress={onCapture}
            disabled={loading}
          />
          <Button
            label="Retake photo"
            variant="outline"
            onPress={onRetake}
            disabled={loading}
          />
        </View>
      </View>
    </View>
  );
}
