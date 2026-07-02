import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import type { WaterLogEntry } from '@/types';
import { formatTime } from '@/utils/dates';
import { formatCupsLabel } from '@/utils/waterUnits';

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

type WaterLogListProps = {
  entries: WaterLogEntry[];
  logging: boolean;
  onRemove: (entryId: string, cups: number) => void;
};

export function WaterLogList({ entries, logging, onRemove }: WaterLogListProps) {
  if (entries.length === 0) {
    return (
      <View className="rounded-3xl border border-dashed border-ash-grey-200 bg-ash-grey-50 px-5 py-8" style={CARD_SHADOW}>
        <Text className="text-center font-sans-semibold text-neutral-700">No water logged yet</Text>
        <Text className="mt-1 text-center text-sm text-neutral-500">
          Your entries will show up here so you can undo mistakes.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Today&apos;s log</Text>

      <View className="gap-2">
        {entries.map((entry, index) => (
          <View
            key={entry.id}
            className={`flex-row items-center justify-between py-3 ${
              index < entries.length - 1 ? 'border-b border-ash-grey-100' : ''
            }`}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-cinnamon-wood-50">
                <Ionicons
                  name={entry.amountMl >= 0 ? 'water' : 'water-outline'}
                  size={18}
                  color={semanticColors.accentOrange}
                />
              </View>
              <View>
                <Text className="font-sans-semibold text-neutral-900">
                  {entry.amountMl >= 0 ? '+' : '−'}
                  {formatCupsLabel(Math.abs(entry.cups))}
                </Text>
                <Text className="mt-0.5 text-xs text-neutral-400">
                  {formatTime(entry.loggedAt)} · {Math.abs(entry.amountMl)} ml
                </Text>
              </View>
            </View>

            <Pressable
              disabled={logging}
              onPress={() => onRemove(entry.id, entry.cups)}
              accessibilityLabel="Remove entry"
              className="h-9 w-9 items-center justify-center rounded-full bg-ash-grey-100 active:opacity-80">
              <Ionicons name="trash-outline" size={17} color="#848a75" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
