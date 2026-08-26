import { Image, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';

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
  const { t } = useI18n();
  const charCount = mealDescription.length;

  return (
    <>
      <View className="overflow-hidden rounded-3xl bg-ash-grey-100">
        <Image source={{ uri: imageUri }} className="h-[240px] w-full" resizeMode="cover" />
      </View>

      <LogCard>
        <Text className="font-sans-semibold text-base text-neutral-900">{t.log.whatDidYouEat}</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">{t.log.scanNoteHint}</Text>
        <AppTextInput
          value={mealDescription}
          onChangeText={(text) => onMealDescriptionChange?.(text.slice(0, DESCRIPTION_MAX))}
          placeholder={t.log.scanNotePlaceholder}
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

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            label={t.log.retake}
            variant="outline"
            fullWidth
            onPress={onRetake}
            disabled={loading}
          />
        </View>
        <View className="flex-1">
          <Button
            label={loading ? t.log.preparing : t.log.continue}
            variant="primary"
            fullWidth
            onPress={onContinue}
            disabled={loading}
          />
        </View>
      </View>
    </>
  );
}
