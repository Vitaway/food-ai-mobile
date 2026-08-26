import { Image, Pressable, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  defaultServingForFood,
  resolvePortionGrams,
  type BarcodePortionMultiplier,
  type BarcodePortionState,
} from '@/services/remote/nutritionApi';

type LogBarcodePortionStepProps = {
  portions: BarcodePortionState[];
  loading?: boolean;
  onChange: (next: BarcodePortionState[]) => void;
  onBack: () => void;
  onContinue: () => void;
};

const MULTIPLIERS: Array<{ value: BarcodePortionMultiplier; label: string }> = [
  { value: 0.5, label: '½' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
];

function PortionRow({
  portion,
  onUpdate,
}: {
  portion: BarcodePortionState;
  onUpdate: (next: BarcodePortionState) => void;
}) {
  const servings = portion.food.servings.length
    ? portion.food.servings
    : [
        {
          id: 'default-g',
          unit: 'g',
          amount: portion.grams,
          gramsEquivalent: portion.grams,
          isDefault: true,
        },
      ];
  const activeServing =
    servings.find((row) => row.id === portion.servingId) ?? defaultServingForFood(portion.food);

  const setMultiplier = (multiplier: BarcodePortionMultiplier) => {
    const grams = resolvePortionGrams(portion.food, portion.servingId, multiplier);
    onUpdate({ ...portion, multiplier, grams });
  };

  const setServing = (servingId: string) => {
    const grams = resolvePortionGrams(portion.food, servingId, portion.multiplier);
    onUpdate({ ...portion, servingId, grams });
  };

  const nudgeGrams = (delta: number) => {
    onUpdate({
      ...portion,
      grams: Math.max(1, Math.min(2000, portion.grams + delta)),
    });
  };

  return (
    <LogCard>
      <View className="flex-row gap-3">
        {portion.food.imageUrl ? (
          <Image
            source={{ uri: portion.food.imageUrl }}
            className="h-16 w-16 rounded-2xl bg-ash-grey-100"
            resizeMode="cover"
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-ash-grey-100">
            <Text className="text-xl">📦</Text>
          </View>
        )}
        <View className="min-w-0 flex-1 justify-center">
          <Text className="font-sans-bold text-base leading-5 text-neutral-900" numberOfLines={2}>
            {portion.food.name}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500" numberOfLines={1}>
            {portion.food.brand || portion.food.category} · {portion.grams} g
          </Text>
        </View>
      </View>

      {servings.length > 1 ? (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {servings.map((serving) => {
            const selected = (activeServing?.id ?? portion.servingId) === serving.id;
            return (
              <Pressable
                key={serving.id}
                onPress={() => setServing(serving.id)}
                className={`rounded-full px-3 py-2 ${
                  selected ? 'bg-blue-spruce-700' : 'bg-ash-grey-100'
                }`}>
                <Text
                  className={`text-xs font-sans-semibold ${
                    selected ? 'text-white' : 'text-neutral-700'
                  }`}>
                  {serving.amount} {serving.unit}
                  {serving.gramsEquivalent ? ` · ${Math.round(serving.gramsEquivalent)}g` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-2">
        {MULTIPLIERS.map((chip) => {
          const selected = portion.multiplier === chip.value;
          return (
            <Pressable
              key={chip.value}
              onPress={() => setMultiplier(chip.value)}
              className={`h-11 flex-1 items-center justify-center rounded-2xl ${
                selected ? 'bg-blue-spruce-700' : 'bg-ash-grey-100'
              }`}>
              <Text
                className={`font-sans-semibold text-[15px] ${
                  selected ? 'text-white' : 'text-neutral-800'
                }`}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-ash-grey-50 px-3 py-2">
        <Pressable
          onPress={() => nudgeGrams(-10)}
          className="h-10 w-10 items-center justify-center rounded-xl bg-white">
          <Text className="font-sans-bold text-lg text-neutral-800">−</Text>
        </Pressable>
        <Text className="font-sans-semibold text-sm text-neutral-700">{portion.grams} g eaten</Text>
        <Pressable
          onPress={() => nudgeGrams(10)}
          className="h-10 w-10 items-center justify-center rounded-xl bg-white">
          <Text className="font-sans-bold text-lg text-neutral-800">+</Text>
        </Pressable>
      </View>
    </LogCard>
  );
}

export function LogBarcodePortionStep({
  portions,
  loading = false,
  onChange,
  onBack,
  onContinue,
}: LogBarcodePortionStepProps) {
  const canContinue = portions.length > 0 && portions.every((row) => row.grams >= 1);

  return (
    <>
      <LogCard>
        <Text className="font-sans-semibold text-lg text-neutral-900">How much did you have?</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">
          Tap a serving size — no typing needed. Adjust each item before continuing.
        </Text>
      </LogCard>

      {portions.map((portion) => (
        <PortionRow
          key={portion.key}
          portion={portion}
          onUpdate={(next) =>
            onChange(portions.map((row) => (row.key === next.key ? next : row)))
          }
        />
      ))}

      <View className="gap-3">
        <Button
          label={loading ? 'Preparing…' : 'Continue'}
          variant="primary"
          onPress={onContinue}
          disabled={!canContinue || loading}
        />
        <Button label="Add more items" variant="outline" onPress={onBack} disabled={loading} />
      </View>
    </>
  );
}
