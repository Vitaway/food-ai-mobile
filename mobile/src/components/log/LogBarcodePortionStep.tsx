import { Image, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { MealAnalysisPreview } from '@/types';

type LogBarcodePortionStepProps = {
  analysis: MealAnalysisPreview;
  imageUri?: string | null;
  value: string;
  loading?: boolean;
  onChangeText: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

const DESCRIPTION_MAX = 280;

export function LogBarcodePortionStep({
  analysis,
  imageUri,
  value,
  loading = false,
  onChangeText,
  onBack,
  onContinue,
}: LogBarcodePortionStepProps) {
  const canContinue = value.trim().length >= 3;
  const charCount = value.length;

  return (
    <>
      <LogCard>
        <View className="flex-row gap-4">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="h-20 w-20 rounded-2xl bg-ash-grey-100" resizeMode="cover" />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-2xl bg-ash-grey-100">
              <Text className="text-2xl">📦</Text>
            </View>
          )}
          <View className="min-w-0 flex-1 justify-center">
            <Text className="font-sans-bold text-lg leading-6 text-neutral-900" numberOfLines={2}>
              {analysis.mealName}
            </Text>
            <Text className="mt-1 text-sm text-neutral-500">
              {analysis.totalWeightG} g label serving · {analysis.totalNutrition.caloriesKcal} kcal estimated
            </Text>
          </View>
        </View>
      </LogCard>

      <LogCard>
        <Text className="font-sans-semibold text-lg text-neutral-900">How much did you have?</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">
          Describe the amount you ate — your coach uses this with the label data to confirm nutrition.
        </Text>
        <AppTextInput
          value={value}
          onChangeText={(text) => onChangeText(text.slice(0, DESCRIPTION_MAX))}
          placeholder="e.g. 2 squares, half the bar, 50 g, one cup…"
          placeholderTextColor="#9ca3af"
          multiline
          autoFocus
          textAlignVertical="top"
          maxLength={DESCRIPTION_MAX}
          className="mt-4 min-h-[120px] rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
        />
        <Text className="mt-2 text-right text-xs text-neutral-400">
          {charCount}/{DESCRIPTION_MAX}
        </Text>
      </LogCard>

      <View className="gap-3">
        <Button
          label={loading ? 'Preparing…' : 'Continue'}
          variant="primary"
          onPress={onContinue}
          disabled={!canContinue || loading}
        />
        <Button label="Scan again" variant="outline" onPress={onBack} disabled={loading} />
      </View>
    </>
  );
}
