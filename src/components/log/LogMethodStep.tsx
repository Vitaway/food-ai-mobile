import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { MealTypePicker } from '@/components/log/MealTypePicker';
import { LogCard } from '@/components/log/LogScreenShell';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { MealTypeId } from '@/constants/mealTypes';

type MethodId = 'camera' | 'gallery' | 'text' | 'past';

const INPUT_METHODS: Array<{
  id: MethodId;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  tintClass: string;
}> = [
  { id: 'camera', label: 'Camera', icon: 'camera-outline', color: '#1D9E75', tintClass: 'bg-shamrock-50' },
  { id: 'gallery', label: 'Gallery', icon: 'images-outline', color: '#023459', tintClass: 'bg-blue-spruce-50' },
  { id: 'text', label: 'Describe', icon: 'create-outline', color: '#023459', tintClass: 'bg-blue-spruce-50' },
  { id: 'past', label: 'Past meal', icon: 'time-outline', color: '#023459', tintClass: 'bg-blue-spruce-50' },
];

type LogMethodStepProps = {
  selectedMethod: string;
  selectedMealType: MealTypeId | null;
  loading?: boolean;
  onSelectMethod: (id: string) => void;
  onSelectMealType: (id: MealTypeId | null) => void;
  onContinue: () => void;
};

export function LogMethodStep({
  selectedMethod,
  selectedMealType,
  loading = false,
  onSelectMethod,
  onSelectMealType,
  onContinue,
}: LogMethodStepProps) {
  return (
    <>
      <LogCard>
        <Text className="font-sans-semibold text-lg text-neutral-900">How are you logging?</Text>
        <Text className="mt-1 text-sm text-neutral-500">Choose a method below</Text>

        <View className="mt-5 flex-row justify-between px-1">
          {INPUT_METHODS.map((method) => {
            const selected = selectedMethod === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => onSelectMethod(method.id)}
                disabled={loading}
                className="items-center gap-2 active:opacity-85">
                <View
                  className={`h-14 w-14 items-center justify-center rounded-full bg-white ${method.tintClass} ${
                    selected ? 'border-2 border-blue-spruce-500' : ''
                  }`}
                  style={{
                    shadowColor: '#1a1c17',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: selected ? 0.1 : 0.06,
                    shadowRadius: 10,
                    elevation: 2,
                  }}>
                  <Ionicons name={method.icon} size={24} color={selected ? '#023459' : method.color} />
                </View>
                <Text
                  className={`font-sans-medium text-xs ${selected ? 'text-blue-spruce-700' : 'text-neutral-600'}`}>
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LogCard>

      <LogCard>
        <Text className="font-sans-semibold text-lg text-neutral-900">What meal is this?</Text>
        <Text className="mt-1 text-sm text-neutral-500">Pick the slot that best matches</Text>
        <View className="mt-4">
          <MealTypePicker
            selected={selectedMealType}
            disabled={loading}
            onSelect={onSelectMealType}
          />
        </View>
      </LogCard>

      <Button
        label={loading ? 'Opening…' : 'Continue'}
        variant="secondary"
        onPress={onContinue}
        disabled={loading || !selectedMealType}
      />
    </>
  );
}
