import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LogCard } from '@/components/log/LogScreenShell';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { MealAnalysisPreview } from '@/types';
import { lookupNutritionBarcode, mealAnalysisFromNutritionFood } from '@/services/remote/nutritionApi';

type LogBarcodeStepProps = {
  loading?: boolean;
  onFound: (analysis: MealAnalysisPreview, barcode: string) => void;
  onBack: () => void;
};

export function LogBarcodeStep({ loading = false, onFound, onBack }: LogBarcodeStepProps) {
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed || searching || loading) return;

    setSearching(true);
    setError(null);
    try {
      const food = await lookupNutritionBarcode(trimmed);
      if (!food) {
        setError('No food found for this barcode. Try another code or log manually.');
        return;
      }
      onFound(mealAnalysisFromNutritionFood(food), trimmed);
    } catch {
      setError('Lookup failed. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <View className="gap-4">
      <LogCard className="border border-blue-spruce-100 bg-blue-spruce-50/40">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-lg text-neutral-900">Scan barcode</Text>
          <Pressable onPress={onBack} hitSlop={8}>
            <Text className="text-sm font-sans-semibold text-blue-spruce-700">Back</Text>
          </Pressable>
        </View>
        <Text className="mt-1 text-sm leading-5 text-neutral-600">
          Enter the product barcode from packaged food. We'll pull nutrition from the database.
        </Text>
      </LogCard>

      <View className="rounded-3xl bg-white p-4">
        <View className="flex-row items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3">
          <Ionicons name="barcode-outline" size={22} color="#848a75" />
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. 6001068270123"
            keyboardType="number-pad"
            autoCapitalize="none"
            className="flex-1 py-3 text-base text-neutral-900"
            editable={!searching && !loading}
            onSubmitEditing={() => void handleLookup()}
          />
        </View>

        {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}

        <Button
          label={searching ? 'Looking up…' : 'Find food'}
          onPress={() => void handleLookup()}
          disabled={!code.trim() || searching || loading}
          fullWidth
          className="mt-4"
        />

        {searching ? (
          <View className="mt-3 items-center">
            <ActivityIndicator />
          </View>
        ) : null}
      </View>
    </View>
  );
}
