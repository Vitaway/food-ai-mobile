import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';
import { formatCups } from '@/utils/waterUnits';

const CARD_SHADOW = {
  shadowColor: '#1a1c17',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

const QUICK_CUP_AMOUNTS = [0.5, 1, 2] as const;

type WaterQuickLogProps = {
  logging: boolean;
  cupsLogged: number;
  onAdd: (cups: number) => void;
  onRemove: (cups: number) => void;
};

export function WaterQuickLog({ logging, cupsLogged, onAdd, onRemove }: WaterQuickLogProps) {
  const canSubtract = cupsLogged > 0;

  return (
    <View className="rounded-3xl bg-white p-5" style={CARD_SHADOW}>
      <Text className="font-sans-semibold text-base text-neutral-900">Quick log</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">
        Tap to add a glass of water — undo mistakes in today&apos;s log
      </Text>

      <View className="mt-4 flex-row gap-3">
        {QUICK_CUP_AMOUNTS.map((cups) => (
          <Pressable
            key={`add-${cups}`}
            disabled={logging}
            onPress={() => onAdd(cups)}
            className="flex-1 items-center rounded-2xl border border-cinnamon-wood-100 bg-cinnamon-wood-50 px-2 py-4 active:opacity-85">
            <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-white">
              <Ionicons name="add" size={22} color={semanticColors.accentOrange} />
            </View>
            <Text className="font-sans-bold text-xl text-cinnamon-wood-500">+{formatCups(cups)}</Text>
            <Text className="mt-0.5 text-xs text-neutral-500">{cups === 1 ? 'glass' : 'glasses'}</Text>
          </Pressable>
        ))}
      </View>

      {canSubtract ? (
        <View className="mt-4 border-t border-ash-grey-100 pt-4">
          <Text className="mb-3 text-xs font-sans-medium uppercase tracking-wide text-neutral-400">
            Remove by mistake
          </Text>
          <View className="flex-row gap-2">
            {QUICK_CUP_AMOUNTS.map((cups) => {
              const disabled = logging || cupsLogged < cups;
              return (
                <Pressable
                  key={`remove-${cups}`}
                  disabled={disabled}
                  onPress={() => onRemove(cups)}
                  className={`flex-1 items-center rounded-xl px-2 py-2.5 ${
                    disabled ? 'bg-ash-grey-50 opacity-45' : 'bg-ash-grey-50 active:opacity-80'
                  }`}>
                  <Text
                    className={`font-sans-semibold text-sm ${
                      disabled ? 'text-neutral-400' : 'text-blue-spruce-700'
                    }`}>
                    −{formatCups(cups)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
