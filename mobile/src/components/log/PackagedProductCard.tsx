import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { NutritionFoodLookup } from '@/services/remote/nutritionApi';

function ScorePill({ label, grade }: { label: string; grade?: string | null }) {
  if (!grade) return null;
  const value = grade.toUpperCase();
  return (
    <View className="rounded-md bg-white/10 px-2 py-1">
      <Text className="text-[10px] font-sans-semibold uppercase tracking-wide text-white/80">
        {label} {value}
      </Text>
    </View>
  );
}

export function PackagedProductCard({
  product,
  onPress,
}: {
  product: NutritionFoodLookup;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl bg-[#1c1c1e] px-3 py-3 active:opacity-85">
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} className="h-16 w-16 rounded-2xl bg-white/10" />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <Ionicons name="nutrition-outline" size={22} color="#f97316" />
        </View>
      )}
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-base text-white" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="mt-0.5 text-sm text-white/55" numberOfLines={1}>
          {product.brand || product.quantity || product.category}
        </Text>
        <View className="mt-2 flex-row gap-2">
          <ScorePill label="Nutri" grade={product.nutriscoreGrade} />
          <ScorePill label="Green" grade={product.ecoscoreGrade} />
          {product.source === 'openfoodfacts' ? (
            <View className="rounded-md bg-orange-500/20 px-2 py-1">
              <Text className="text-[10px] font-sans-semibold text-orange-300">Open Food Facts</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
    </Pressable>
  );
}
