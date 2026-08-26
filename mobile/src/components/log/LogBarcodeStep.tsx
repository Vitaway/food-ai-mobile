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
import {
  cartKeyForFood,
  lookupNutritionBarcode,
  searchPackagedProducts,
  type BarcodeCartItem,
  type NutritionFoodLookup,
} from '@/services/remote/nutritionApi';
import {
  extractScannedBarcode,
  isLikelyBarcode,
  isValidProductBarcode,
  normalizeScannedBarcode,
} from '@/utils/barcode';

const SCAN_COOLDOWN_MS = 1200;
const SCAN_CONSENSUS_WINDOW_MS = 2500;
const MAX_CART_ITEMS = 12;

type LogBarcodeStepProps = {
  loading?: boolean;
  onContinue: (cart: BarcodeCartItem[]) => void;
  onBack: () => void;
};

export function LogBarcodeStep({ loading = false, onContinue, onBack }: LogBarcodeStepProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [query, setQuery] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [results, setResults] = useState<NutritionFoodLookup[]>([]);
  const [cart, setCart] = useState<BarcodeCartItem[]>([]);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [pendingScan, setPendingScan] = useState<string | null>(null);

  const lastScanRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const flashToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

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

  const addToCart = useCallback(
    (product: NutritionFoodLookup, code?: string) => {
      const barcode = code || product.barcode || product.id;
      const key = cartKeyForFood(product, barcode);
      setCart((prev) => {
        if (prev.some((item) => item.key === key)) {
          flashToast('Already in your meal');
          return prev;
        }
        if (prev.length >= MAX_CART_ITEMS) {
          flashToast(`You can add up to ${MAX_CART_ITEMS} items`);
          return prev;
        }
        flashToast(`Added ${product.name}`);
        return [...prev, { key, food: product, barcode }];
      });
    },
    [flashToast],
  );

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const toggleProduct = useCallback(
    (product: NutritionFoodLookup) => {
      const key = cartKeyForFood(product, product.barcode ?? undefined);
      setCart((prev) => {
        if (prev.some((item) => item.key === key)) {
          return prev.filter((item) => item.key !== key);
        }
        if (prev.length >= MAX_CART_ITEMS) {
          flashToast(`You can add up to ${MAX_CART_ITEMS} items`);
          return prev;
        }
        return [...prev, { key, food: product, barcode: product.barcode || product.id }];
      });
    },
    [flashToast],
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
        addToCart(food, food.barcode ?? trimmed);
      } catch {
        setError('Lookup failed. Check your connection and try again.');
      } finally {
        setSearching(false);
        busyRef.current = false;
      }
    },
    [addToCart, beginCooldown, loading],
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
        (checkValid && consensus.count >= 1) || (!checkValid && consensus.count >= 2);

      if (!confirmed) return;
      if (lastScanRef.current === code) return;

      consensusRef.current = { code: null, count: 0, at: 0 };
      setPendingScan(null);
      void lookupCode(code);
    },
    [loading, lookupCode, scanEnabled, searching],
  );

  const cameraReady = Boolean(permission?.granted);
  const selectedKeys = new Set(cart.map((item) => item.key));

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
                <Text className="font-sans-bold text-base text-white">Scan barcodes</Text>
                <Text className="text-xs text-white/65">
                  Add multiple products to one meal — tap search results or keep scanning.
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
            {toast ? <Text className="mt-2 text-sm text-emerald-300">{toast}</Text> : null}
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
                Center the barcode in the frame. Keep scanning to add more items.
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-4" pointerEvents="box-none">
          <BarcodeViewfinder />
          {cameraReady && !searching && !pendingScan ? (
            <Text className="mt-4 text-center text-xs text-white/55">
              Align the bars horizontally inside the frame
            </Text>
          ) : null}
        </View>

        {results.length ? (
          <Animated.View
            entering={FadeInDown.springify().damping(16)}
            className="max-h-48 px-4 pb-2">
            <View className="overflow-hidden rounded-[24px] bg-black/85 px-3 py-3">
              <Text className="mb-2 px-1 text-xs font-sans-semibold uppercase tracking-wide text-white/50">
                Tap to add · {results.length} product{results.length === 1 ? '' : 's'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {results.map((product) => {
                  const key = cartKeyForFood(product, product.barcode ?? undefined);
                  return (
                    <PackagedProductCard
                      key={product.id}
                      product={product}
                      selected={selectedKeys.has(key)}
                      onPress={() => toggleProduct(product)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        ) : null}

        {cart.length ? (
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            className="border-t border-white/10 bg-black/90 px-4 pt-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {cart.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => removeFromCart(item.key)}
                  className="max-w-[160px] flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                  <Text className="flex-1 text-xs font-sans-semibold text-white" numberOfLines={1}>
                    {item.food.name}
                  </Text>
                  <Ionicons name="close" size={14} color="rgba(255,255,255,0.7)" />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              disabled={loading}
              onPress={() => onContinue(cart)}
              className="h-12 items-center justify-center rounded-2xl bg-blue-spruce-700">
              <Text className="font-sans-semibold text-[15px] text-white">
                Continue ({cart.length})
              </Text>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
