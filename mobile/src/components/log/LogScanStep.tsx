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

export function LogScanStep({
  imageUri,
  mealDescription = '',
  onMealDescriptionChange,
  loading = false,
  onRetake,
  onContinue,
}: LogScanStepProps) {
  const descriptionReady = mealDescription.trim().length >= 3;

  return (
    <>
      <LogCard className="overflow-hidden p-0">
        <View className="relative h-[220px]">
          <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
          <ScanFrameOverlay />
        </View>
        <View className="px-5 pb-5 pt-4">
          <Text className="text-center font-sans-semibold text-lg text-neutral-900">Send to your coach</Text>
          <Text className="mt-1 text-center text-sm leading-5 text-neutral-500">
            Add a short description of what you ate. Your coach will confirm nutrition from this photo.
          </Text>
        </View>
      </LogCard>

      <LogCard>
        <Text className="font-sans-semibold text-base text-neutral-900">What did you eat?</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">
          Portions, sauces, drinks, or how it was prepared help your coach review accurately.
        </Text>
        <AppTextInput
          value={mealDescription}
          onChangeText={onMealDescriptionChange}
          placeholder="e.g. Grilled chicken, rice, and cabbage…"
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          className="mt-3 min-h-[88px] rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
        />
      </LogCard>

      <View className="gap-3">
        <Button
          label={loading ? 'Preparing…' : 'Continue'}
          variant="secondary"
          onPress={onContinue}
          disabled={loading || !descriptionReady}
        />
        {!descriptionReady ? (
          <Text className="text-center text-xs text-neutral-500">
            Add a short description (at least a few words) to continue.
          </Text>
        ) : null}
        <Button label="Retake photo" variant="outline" onPress={onRetake} disabled={loading} />
      </View>
    </>
  );
}
