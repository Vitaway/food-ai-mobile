import { Image, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { ScanFrameOverlay } from '@/components/log/ScanFrameOverlay';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

type LogScanStepProps = {
  imageUri: string;
  mealDescription?: string;
  onMealDescriptionChange?: (text: string) => void;
  loading?: boolean;
  onRetake: () => void;
  onContinue: () => void;
};

const DESCRIPTION_MAX = 280;

export function LogScanStep({
  imageUri,
  mealDescription = '',
  onMealDescriptionChange,
  loading = false,
  onRetake,
  onContinue,
}: LogScanStepProps) {
  const charCount = mealDescription.length;

  return (
    <>
      <View className="overflow-hidden rounded-3xl">
        <View className="relative h-[260px]">
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          <ScanFrameOverlay />
        </View>
      </View>

      <LogCard>
        <Text className="font-sans-semibold text-base text-neutral-900">What did you eat?</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">
          Optional — portions, sauces, or how it was prepared help your coach review accurately.
        </Text>
        <AppTextInput
          value={mealDescription}
          onChangeText={(text) => onMealDescriptionChange?.(text.slice(0, DESCRIPTION_MAX))}
          placeholder="e.g. Grilled chicken, rice, and cabbage…"
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          maxLength={DESCRIPTION_MAX}
          className="mt-3 min-h-[88px] rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
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
          disabled={loading}
        />
        <Button label="Retake photo" variant="outline" onPress={onRetake} disabled={loading} />
      </View>
    </>
  );
}
