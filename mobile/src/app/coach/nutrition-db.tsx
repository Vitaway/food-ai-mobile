import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PackagedProductCard } from '@/components/log/PackagedProductCard';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { ScreenTopBar, StackScreenBody } from '@/components/ui/ScreenTopBar';
import { Text } from '@/components/ui/Text';
import {
  lookupNutritionBarcode,
  searchPackagedProducts,
  type NutritionFoodLookup,
} from '@/services/remote/nutritionApi';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { isLikelyBarcode } from '@/utils/barcode';

export default function CoachNutritionDbScreen() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NutritionFoodLookup[]>([]);
  const [searched, setSearched] = useState(false);

  const canSearch = query.trim().length >= 2;

  const handleSearch = async () => {
    if (!canSearch || loading) return;
    const trimmed = query.trim();
    setLoading(true);
    setSearched(true);
    try {
      if (isLikelyBarcode(trimmed)) {
        const product = await lookupNutritionBarcode(trimmed);
        setResults(product ? [product] : []);
        if (!product) {
          toast.error('No product found for that barcode.');
        }
        return;
      }

      const list = await searchPackagedProducts(trimmed);
      setResults(list);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not search Nutrition DB.'));
    } finally {
      setLoading(false);
    }
  };

  const caption = useMemo(() => {
    if (!searched) return 'Search local nutrition + Open Food Facts by name or barcode.';
    if (loading) return 'Searching…';
    return `${results.length} result${results.length === 1 ? '' : 's'}`;
  }, [loading, results.length, searched]);

  return (
    <View className="flex-1 bg-ash-grey-50">
      <ScreenTopBar title="Nutrition DB" onBack={() => router.back()} />

      <StackScreenBody>
        <View className="border-b border-ash-grey-100 bg-white px-5 pb-4 pt-3">
          <Text className="text-sm text-neutral-500">{caption}</Text>
          <View className="mt-3 flex-row items-center gap-2 rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-3">
            <Ionicons name="search-outline" size={20} color="#023459" />
            <View className="flex-1">
              <AppTextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Food, brand, or barcode"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => void handleSearch()}
                className="min-h-[48px] border-0 bg-transparent px-0"
              />
            </View>
            <Pressable
              onPress={() => void handleSearch()}
              disabled={!canSearch || loading}
              className={`rounded-xl px-3 py-2 ${canSearch ? 'bg-blue-spruce-700' : 'bg-ash-grey-200'}`}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="arrow-forward" size={18} color={canSearch ? '#fff' : '#848a75'} />
              )}
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}>
            {!searched ? (
              <View className="rounded-3xl bg-white px-5 py-8">
                <Text className="font-sans-semibold text-base text-neutral-900">Search at the top</Text>
                <Text className="mt-1 text-sm text-neutral-500">
                  Enter a product name, brand, or barcode number and tap search.
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View className="rounded-3xl bg-white px-5 py-8">
                <Text className="font-sans-semibold text-base text-neutral-900">No products found</Text>
                <Text className="mt-1 text-sm text-neutral-500">
                  Try a different spelling, brand name, or barcode.
                </Text>
              </View>
            ) : (
              results.map((item) => (
                <PackagedProductCard
                  key={item.id}
                  product={item}
                  onPress={() => {
                    const details = `${item.name}${item.brand ? ` (${item.brand})` : ''}`;
                    toast.success(details, 'Product found');
                  }}
                />
              ))
            )}
          </ScrollView>
        )}
      </StackScreenBody>
    </View>
  );
}
