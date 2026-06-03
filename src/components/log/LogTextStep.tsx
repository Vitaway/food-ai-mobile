import { View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

type LogTextStepProps = {
  value: string;
  loading?: boolean;
  bottomPadding: number;
  onChangeText: (text: string) => void;
  onContinue: () => void;
};

export function LogTextStep({
  value,
  loading = false,
  bottomPadding,
  onChangeText,
  onContinue,
}: LogTextStepProps) {
  const canContinue = value.trim().length >= 3;

  return (
    <View className="flex-1">
      <LogCard className="flex-1">
        <Text className="font-sans-semibold text-lg text-neutral-900">What did you eat?</Text>
        <Text className="mt-1 text-sm text-neutral-500">Separate items with commas for better results</Text>
        <AppTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Chicken, rice, salad…"
          placeholderTextColor="#9ca3af"
          multiline
          autoFocus
          className="mt-4 min-h-[180px] flex-1 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4"
        />
      </LogCard>

      <View className="mt-4" style={{ paddingBottom: bottomPadding }}>
        <Button
          label={loading ? 'Analyzing…' : 'Analyze meal'}
          variant="secondary"
          onPress={onContinue}
          disabled={!canContinue || loading}
        />
      </View>
    </View>
  );
}
