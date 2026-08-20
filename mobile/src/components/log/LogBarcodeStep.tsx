import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BarcodeViewfinder } from '@/components/log/BarcodeViewfinder';
import { PackagedProductCard } from '@/components/log/PackagedProductCard';
import { Text } from '@/components/ui/Text';
import { APP_LOGO } from '@/constants/brand';
import type { MealAnalysisPreview } from '@/types';
import {
  lookupNutritionBarcode,
  mealAnalysisFromNutritionFood,
  searchPackagedProducts,
  type NutritionFoodLookup,
} from '@/services/remote/nutritionApi';
import {
  extractScannedBarcode,
  isLikelyBarcode,
  isValidProductBarcode,
  normalizeScannedBarcode,
} from '@/utils/barcode';

const SCAN_COOLDOWN_MS = 1200;
/** Matching reads within this window count toward confirmation. */
const SCAN_CONSENSUS_WINDOW_MS = 2500;

type LogBarcodeStepProps = {
  loading?: boolean;
  onFound: (
    analysis: MealAnalysisPreview,
    barcode: string,
    imageUrl: string | null | undefined,
    food: NutritionFoodLookup,
  ) => void;
  onBack: () => void;
};

export function LogBarcodeStep({ loading = false, onFound, onBack }: LogBarcodeStepProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [query, setQuery] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NutritionFoodLookup[]>([]);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [pendingScan, setPendingScan] = useState<string | null>(null);

  const lastScanRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consensusRef = useRef<{ code: string | null; count: number; at: number }>({
    code: null,
    count: 0,
    at: 0,
  });

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(
    () => () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    },
    [],
  );

  const beginCooldown = useCallback((code?: string) => {
    setScanEnabled(false);
    if (code) lastScanRef.current = code;
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      lastScanRef.current = null;
      consensusRef.current = { code: null, count: 0, at: 0 };
      setScanEnabled(true);
    }, SCAN_COOLDOWN_MS);
  }, []);

  const selectProduct = useCallback(
    (product: NutritionFoodLookup, code?: string) => {
      onFound(
        mealAnalysisFromNutritionFood(product),
        code || product.barcode || product.id,
        product.imageUrl,
        product,
      );
    },
    [onFound],
  );

  const lookupCode = useCallback(
    async (code: string) => {
      const trimmed = normalizeScannedBarcode(code.trim());
      if (!trimmed || busyRef.current || loading) return;

      busyRef.current = true;
      setSearching(true);
      setError(null);
      setResults([]);
      setPendingScan(null);
      beginCooldown(trimmed);

      try {
        const food = await lookupNutritionBarcode(trimmed);
        if (!food) {
          setError(
            'No product found for this barcode. Check the number on the package (not a screen), edit it above, or search by product name.',
          );
          return;
        }
        selectProduct(food, food.barcode ?? trimmed);
      } catch {
        setError('Lookup failed. Check your connection and try again.');
      } finally {
        setSearching(false);
        busyRef.current = false;
      }
    },
    [beginCooldown, loading, selectProduct],
  );

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || busyRef.current || loading) return;

    if (isLikelyBarcode(trimmed)) {
      await lookupCode(trimmed);
      return;
    }

    busyRef.current = true;
    setSearching(true);
    setError(null);
    setResults([]);
    setScanEnabled(false);

    try {
      const products = await searchPackagedProducts(trimmed);
      setResults(products);
      if (!products.length) {
        setError('No products matched that search. Try a brand name or barcode.');
      }
    } catch {
      setError('Search failed. Check your connection and try again.');
    } finally {
      setSearching(false);
      busyRef.current = false;
      setScanEnabled(true);
    }
  }, [loading, lookupCode, query]);

  const confirmPendingScan = useCallback(() => {
    if (!pendingScan || busyRef.current || loading || searching) return;
    consensusRef.current = { code: null, count: 0, at: 0 };
    void lookupCode(pendingScan);
  }, [loading, lookupCode, pendingScan, searching]);

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!scanEnabled || busyRef.current || loading || searching) return;

      const code = extractScannedBarcode(result);
      if (!code) return;

      const now = Date.now();
      const consensus = consensusRef.current;
      if (consensus.code === code && now - consensus.at <= SCAN_CONSENSUS_WINDOW_MS) {
        consensus.count += 1;
      } else {
        consensus.code = code;
        consensus.count = 1;
      }
      consensus.at = now;

      setQuery(code);
      setPendingScan(code);
      setError(null);

      const checkValid = isValidProductBarcode(code);
      const confirmed =
        (checkValid && consensus.count >= 1) ||
        (!checkValid && consensus.count >= 2);

      if (!confirmed) return;
      if (lastScanRef.current === code) return;

      consensusRef.current = { code: null, count: 0, at: 0 };
      setPendingScan(null);
      void lookupCode(code);
    },
    [loading, lookupCode, scanEnabled, searching],
  );

  const cameraReady = Boolean(permission?.granted);

  return (
    <View className="flex-1 bg-black">
      {cameraReady ? (
        <CameraView
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'itf14'],
          }}
          onBarcodeScanned={onBarcodeScanned}
        />
      ) : (
        <View className="absolute inset-0 bg-[#111]" />
      )}

      <View className="absolute inset-0 bg-black/35" pointerEvents="none" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none">
        {/* Top bar + search */}
        <View style={{ paddingTop: insets.top + 8 }} className="px-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={onBack}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/50">
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            {cameraReady ? (
              <Pressable
                onPress={() => setTorchOn((value) => !value)}
                className="h-11 w-11 items-center justify-center rounded-full bg-black/50">
                <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={20} color="#ffffff" />
              </Pressable>
            ) : (
              <View className="h-11 w-11" />
            )}
          </View>

          <View className="mt-3 rounded-[24px] bg-black/75 px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Image source={APP_LOGO} className="h-9 w-9" resizeMode="contain" />
              <View className="flex-1">
                <Text className="font-sans-bold text-base text-white">Scan a barcode</Text>
                <Text className="text-xs text-white/65">
                  Point at the barcode on the physical package — not a photo or screen.
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center rounded-full bg-white pl-3 pr-1.5">
              <Ionicons name="search-outline" size={18} color="#023459" />
              <TextInput
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  if (error) setError(null);
                  if (pendingScan) setPendingScan(null);
                }}
                placeholder="Product name or barcode"
                placeholderTextColor="#9ca3af"
                className="flex-1 px-3 py-3 text-base text-neutral-900"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                editable={!searching && !loading}
                onSubmitEditing={() => void handleSearch()}
              />
              <Pressable
                onPress={() => void handleSearch()}
                disabled={!query.trim() || searching || loading}
                className="h-10 w-10 items-center justify-center rounded-full bg-blue-spruce-700">
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                )}
              </Pressable>
            </View>

            {error ? <Text className="mt-2 text-sm text-red-300">{error}</Text> : null}
            {!permission?.granted ? (
              <Pressable onPress={() => void requestPermission()} className="mt-2">
                <Text className="text-sm text-orange-300">Allow camera access to scan barcodes live.</Text>
              </Pressable>
            ) : searching ? (
              <Text className="mt-2 text-xs text-white/60">Looking up product…</Text>
            ) : pendingScan ? (
              <Pressable onPress={confirmPendingScan} className="mt-2 flex-row items-center gap-2">
                <Text className="text-xs text-white/70">
                  Detected {pendingScan}
                  {isValidProductBarcode(pendingScan) ? '' : ' — hold steady or tap to confirm'}
                </Text>
                {!isValidProductBarcode(pendingScan) ? (
                  <View className="rounded-full bg-white/15 px-2 py-0.5">
                    <Text className="text-[10px] font-sans-semibold text-white">Use this</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : cameraReady ? (
              <Text className="mt-2 text-xs text-white/60">
                Center the barcode in the frame below. Good lighting helps.
              </Text>
            ) : null}
          </View>
        </View>

        {/* Viewfinder — centered in remaining space */}
        <View className="flex-1 items-center justify-center px-4" pointerEvents="box-none">
          <BarcodeViewfinder />
          {cameraReady && !searching && !pendingScan ? (
            <Text className="mt-4 text-center text-xs text-white/55">
              Align the bars horizontally inside the frame
            </Text>
          ) : null}
        </View>

        {/* Search results anchored to bottom */}
        {results.length ? (
          <Animated.View
            entering={FadeInDown.springify().damping(16)}
            style={{ paddingBottom: insets.bottom + 12 }}
            className="max-h-56 px-4 pb-2">
            <View className="overflow-hidden rounded-[24px] bg-black/85 px-3 py-3">
              <Text className="mb-2 px-1 text-xs font-sans-semibold uppercase tracking-wide text-white/50">
                {results.length} product{results.length === 1 ? '' : 's'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {results.map((product) => (
                  <PackagedProductCard
                    key={product.id}
                    product={product}
                    onPress={() => selectProduct(product)}
                  />
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
