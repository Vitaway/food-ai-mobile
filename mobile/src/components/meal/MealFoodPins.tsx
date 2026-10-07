import { useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';
import type { DetectedFoodItem } from '@/types';
import { itemsHaveRealPins, resolveFoodPins, type FoodPinPoint } from '@/utils/foodPins';

type MealFoodPinsProps = {
  imageUri: string;
  items: DetectedFoodItem[];
  /** Prefer overlay pins; if none and forceChips, show stacked chips. */
  forceChips?: boolean;
  height?: number;
};

function PinCallout({ pin, selected }: { pin: FoodPinPoint; selected: boolean }) {
  return (
    <View
      className="max-w-[132px] rounded-2xl px-2.5 py-1.5"
      style={{
        backgroundColor: selected ? palette['blue-spruce'][800] : 'rgba(255,255,255,0.94)',
        borderWidth: 1,
        borderColor: selected ? palette['blue-spruce'][800] : 'rgba(26,58,42,0.12)',
        shadowColor: '#1a3a2a',
        shadowOpacity: 0.16,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}>
      <Text
        className={`text-[12px] font-sans-bold leading-4 ${selected ? 'text-white' : 'text-blue-spruce-900'}`}
        numberOfLines={1}>
        {pin.emoji ? `${pin.emoji} ` : ''}
        {pin.label}
      </Text>
      <Text
        className={`mt-0.5 text-[11px] ${selected ? 'text-white/85' : 'text-ash-grey-600'}`}
        numberOfLines={1}>
        ~{pin.grams} g · {pin.kcal} kcal
      </Text>
    </View>
  );
}

function PinDot({ selected }: { selected: boolean }) {
  return (
    <View
      className="h-3.5 w-3.5 rounded-full border-2 border-white"
      style={{
        backgroundColor: selected ? palette['cinnamon-wood'][500] : palette['blue-spruce'][700],
      }}
    />
  );
}

export function MealFoodPins({
  imageUri,
  items,
  forceChips = false,
  height = 280,
}: MealFoodPinsProps) {
  const pins = resolveFoodPins(items);
  const useOverlay = !forceChips && pins.length > 0 && (itemsHaveRealPins(items) || pins.length <= 5);
  const [selectedId, setSelectedId] = useState<string | null>(pins[0]?.id ?? null);
  const [size, setSize] = useState({ width: 0, height });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height: h } = event.nativeEvent.layout;
    setSize({ width, height: h });
  };

  if (!pins.length) {
    return (
      <View className="overflow-hidden rounded-[28px] bg-ash-grey-100" style={{ height }}>
        <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
      </View>
    );
  }

  if (!useOverlay) {
    return (
      <View className="overflow-hidden rounded-[28px] bg-ash-grey-100">
        <Image source={{ uri: imageUri }} style={{ height }} className="w-full" resizeMode="cover" />
        <View className="gap-2 bg-white px-3 py-3">
          {pins.map((pin) => (
            <View
              key={pin.id}
              className="flex-row items-center justify-between rounded-2xl bg-ash-grey-50 px-3 py-2.5">
              <Text className="min-w-0 flex-1 font-sans-semibold text-[13px] text-blue-spruce-900" numberOfLines={1}>
                {pin.emoji ? `${pin.emoji} ` : ''}
                {pin.label}
              </Text>
              <Text className="ml-2 text-[12px] text-ash-grey-600">
                ~{pin.grams} g · {pin.kcal} kcal
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View
      className="overflow-hidden rounded-[28px] bg-ash-grey-100"
      style={{ height }}
      onLayout={onLayout}>
      <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
      {size.width > 0
        ? pins.map((pin) => {
            const selected = pin.id === selectedId;
            const left = pin.x * size.width;
            const top = pin.y * size.height;
            const calloutAbove = pin.y > 0.55;
            return (
              <Pressable
                key={pin.id}
                onPress={() => setSelectedId(pin.id)}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  transform: [{ translateX: -12 }, { translateY: -12 }],
                  zIndex: selected ? 4 : 2,
                  alignItems: 'center',
                }}>
                <PinDot selected={selected} />
                <View
                  style={{
                    position: 'absolute',
                    top: calloutAbove ? undefined : 18,
                    bottom: calloutAbove ? 18 : undefined,
                    left: -60,
                    width: 132,
                    alignItems: 'center',
                  }}>
                  <PinCallout pin={pin} selected={selected} />
                </View>
              </Pressable>
            );
          })
        : null}
    </View>
  );
}
