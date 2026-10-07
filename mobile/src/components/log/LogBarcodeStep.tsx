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

import { BarcodeLookupIssueModal, type BarcodeLookupIssue } from '@/components/log/BarcodeLookupIssueModal';
import { BarcodeProductConfirmModal } from '@/components/log/BarcodeProductConfirmModal';
import { BarcodeViewfinder } from '@/components/log/BarcodeViewfinder';
import { PackagedProductCard } from '@/components/log/PackagedProductCard';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { Text } from '@/components/ui/Text';
import { APP_LOGO } from '@/constants/brand';
import { fonts } from '@/constants/fonts';
import { tf, useI18n } from '@/context/LocaleContext';
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

type PendingProduct = {
  food: NutritionFoodLookup;
  barcode: string;
};

type LogBarcodeStepProps = {
  loading?: boolean;
  initialCart?: BarcodeCartItem[];
  onContinue: (cart: BarcodeCartItem[]) => void;
  onBack: () => void;
};

export function LogBarcodeStep({
  loading = false,
  initialCart,
  onContinue,
  onBack,
}: LogBarcodeStepProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [query, setQuery] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [results, setResults] = useState<NutritionFoodLookup[]>([]);
  const [cart, setCart] = useState<BarcodeCartItem[]>(() => initialCart ?? []);
  const [scanEnabled, setScanEnabled] = useState(true);
  const [pendingScan, setPendingScan] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<PendingProduct | null>(null);
  const [lookupIssue, setLookupIssue] = useState<BarcodeLookupIssue | null>(null);

  const lastScanRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consensusRef = useRef<{ code: string | null; count: number; at: number }>({
    code: null,
    count: 0,
    at: 0,
  });
  const cartRef = useRef(cart);
  cartRef.current = cart;

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

  const pauseScanning = useCallback((code?: string) => {
    setScanEnabled(false);
    if (code) lastScanRef.current = code;
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
  }, []);

  const cartHasKey = useCallback((key: string) => cartRef.current.some((item) => item.key === key), []);

  const offerProduct = useCallback(
    (product: NutritionFoodLookup, code?: string) => {
      const barcode = code || product.barcode || product.id;
      const key = cartKeyForFood(product, barcode);
      if (cartHasKey(key)) {
        flashToast(t.log.barcodeAlreadyInMeal);
        beginCooldown(barcode);
        return;
      }
      if (cartRef.current.length >= MAX_CART_ITEMS) {
        flashToast(tf(t.log.barcodeCartMax, { count: MAX_CART_ITEMS }));
        beginCooldown(barcode);
        return;
      }
      pauseScanning(barcode);
      setPendingProduct({ food: product, barcode });
    },
    [beginCooldown, cartHasKey, flashToast, pauseScanning, t.log.barcodeAlreadyInMeal, t.log.barcodeCartMax],
  );

  const addToCart = useCallback(
    (product: NutritionFoodLookup, code?: string) => {
      const barcode = code || product.barcode || product.id;
      const key = cartKeyForFood(product, barcode);
      setCart((prev) => {
        if (prev.some((item) => item.key === key)) return prev;
        if (prev.length >= MAX_CART_ITEMS) return prev;
        return [...prev, { key, food: product, barcode }];
      });
    },
    [],
  );

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const confirmPendingProduct = useCallback(() => {
    if (!pendingProduct) return;
    addToCart(pendingProduct.food, pendingProduct.barcode);
    setPendingProduct(null);
    beginCooldown(pendingProduct.barcode);
  }, [addToCart, beginCooldown, pendingProduct]);

  const skipPendingProduct = useCallback(() => {
    const code = pendingProduct?.barcode;
    setPendingProduct(null);
    beginCooldown(code);
  }, [beginCooldown, pendingProduct]);

  const lookupCode = useCallback(
    async (code: string) => {
      const trimmed = normalizeScannedBarcode(code.trim());
      if (!trimmed || busyRef.current || loading || pendingProduct || lookupIssue) return;

      busyRef.current = true;
      setSearching(true);
      setError(null);
      setLookupIssue(null);
      setResults([]);
      setPendingScan(null);
      pauseScanning(trimmed);

      try {
        const food = await lookupNutritionBarcode(trimmed);
        if (!food) {
          setLookupIssue({ type: 'not_found', code: trimmed });
          pauseScanning(trimmed);
          return;
        }
        offerProduct(food, food.barcode ?? trimmed);
      } catch {
        setLookupIssue({ type: 'lookup_failed', code: trimmed });
        pauseScanning(trimmed);
      } finally {
        setSearching(false);
        busyRef.current = false;
      }
    },
    [loading, offerProduct, pauseScanning, pendingProduct, lookupIssue],
  );

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || busyRef.current || loading || pendingProduct || lookupIssue) return;

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
        setError(t.log.barcodeNoSearch);
      }
    } catch {
      setError(t.log.barcodeSearchFailed);
    } finally {
      setSearching(false);
      busyRef.current = false;
      setScanEnabled(true);
    }
  }, [loading, lookupCode, lookupIssue, pendingProduct, query, t.log.barcodeNoSearch, t.log.barcodeSearchFailed]);

  const dismissLookupIssue = useCallback(() => {
    const code = lookupIssue?.code;
    setLookupIssue(null);
    beginCooldown(code);
  }, [beginCooldown, lookupIssue]);

  const searchAfterIssue = useCallback(() => {
    setQuery('');
    setLookupIssue(null);
    beginCooldown();
  }, [beginCooldown]);

  const confirmPendingScan = useCallback(() => {
    if (!pendingScan || busyRef.current || loading || searching || pendingProduct || lookupIssue) return;
    consensusRef.current = { code: null, count: 0, at: 0 };
    void lookupCode(pendingScan);
  }, [loading, lookupCode, lookupIssue, pendingProduct, pendingScan, searching]);

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!scanEnabled || busyRef.current || loading || searching || pendingProduct || lookupIssue) return;

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
    [loading, lookupCode, lookupIssue, pendingProduct, scanEnabled, searching],
  );

  const cameraReady = Boolean(permission?.granted);
  const selectedKeys = new Set(cart.map((item) => item.key));
  const confirmOpen = Boolean(pendingProduct);
  const canLog = cart.length > 0 && !loading;

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
                <Text className="font-sans-bold text-base text-white">{t.log.barcodeTitle}</Text>
                <Text className="text-xs text-white/65">{t.log.barcodeHint}</Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center rounded-full bg-white pl-3 pr-1.5">
              <Ionicons name="search-outline" size={18} color="#1a3a2a" />
              <TextInput
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  if (error) setError(null);
                  if (pendingScan) setPendingScan(null);
                }}
                placeholder={t.log.barcodePlaceholder}
                placeholderTextColor="#9ca3af"
                className="flex-1 px-3 py-3 text-base text-neutral-900"
                style={{ fontFamily: fonts.sans }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                editable={!searching && !loading && !confirmOpen}
                onSubmitEditing={() => void handleSearch()}
              />
              <Pressable
                onPress={() => void handleSearch()}
                disabled={!query.trim() || searching || loading || confirmOpen}
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
                <Text className="text-sm text-orange-300">{t.log.barcodeCameraPermission}</Text>
              </Pressable>
            ) : searching ? (
              <Text className="mt-2 text-xs text-white/60">{t.log.barcodeLookingUp}</Text>
            ) : pendingScan ? (
              <Pressable onPress={confirmPendingScan} className="mt-2 flex-row items-center gap-2">
                <Text className="text-xs text-white/70">
                  {tf(t.log.barcodeDetected, { code: pendingScan })}
                  {isValidProductBarcode(pendingScan) ? '' : t.log.barcodeHoldSteady}
                </Text>
                {!isValidProductBarcode(pendingScan) ? (
                  <View className="rounded-full bg-white/15 px-2 py-0.5">
                    <Text className="text-[10px] font-sans-semibold text-white">{t.log.barcodeUseThis}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : cameraReady ? (
              <Text className="mt-2 text-xs text-white/60">{t.log.barcodeCenterHint}</Text>
            ) : null}
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-4" pointerEvents="box-none">
          <BarcodeViewfinder />
          {cameraReady && searching ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-full bg-black/70 px-4 py-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-xs text-white/80">{t.log.barcodeLookingUp}</Text>
            </View>
          ) : cameraReady && !pendingScan ? (
            <Text className="mt-4 text-center text-xs text-white/55">{t.log.barcodeAlign}</Text>
          ) : null}
        </View>

        {results.length && !confirmOpen ? (
          <Animated.View
            entering={FadeInDown.springify().damping(16)}
            className="max-h-48 px-4 pb-2">
            <View className="overflow-hidden rounded-[24px] bg-black/85 px-3 py-3">
              <Text className="mb-2 px-1 text-xs font-sans-semibold uppercase tracking-wide text-white/50">
                {results.length === 1
                  ? t.log.barcodeSearchTapOne
                  : tf(t.log.barcodeSearchTap, { count: results.length })}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {results.map((product) => {
                  const key = cartKeyForFood(product, product.barcode ?? undefined);
                  return (
                    <PackagedProductCard
                      key={product.id}
                      product={product}
                      selected={selectedKeys.has(key)}
                      onPress={() => {
                        if (selectedKeys.has(key)) {
                          removeFromCart(key);
                          return;
                        }
                        offerProduct(product, product.barcode ?? product.id);
                      }}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        ) : null}

        {cart.length ? (
          <View
            style={{ marginBottom: FLOATING_TAB_BAR_CLEARANCE }}
            className="border-t border-white/10 bg-black/92 px-4 pt-3 pb-3">
            <View className="flex-row items-end gap-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-1"
                contentContainerStyle={{ gap: 10, paddingVertical: 4, minHeight: 108 }}>
                {cart.map((item) => (
                  <View key={item.key} className="w-[88px]">
                    <View className="relative">
                      {item.food.imageUrl ? (
                        <Image
                          source={{ uri: item.food.imageUrl }}
                          className="h-[72px] w-[88px] rounded-2xl bg-white/10"
                        />
                      ) : (
                        <View className="h-[72px] w-[88px] items-center justify-center rounded-2xl bg-white/10">
                          <Ionicons name="nutrition-outline" size={26} color="#f97316" />
                        </View>
                      )}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={tf(t.log.barcodeRemoveA11y, { name: item.food.name })}
                        onPress={() => removeFromCart(item.key)}
                        hitSlop={8}
                        className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-black/80">
                        <Ionicons name="close" size={14} color="#fff" />
                      </Pressable>
                    </View>
                    <Text className="mt-1.5 text-center text-[11px] font-sans-semibold text-white" numberOfLines={2}>
                      {item.food.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tf(t.log.barcodeLogA11y, { count: cart.length })}
                disabled={!canLog}
                onPress={() => onContinue(cart)}
                className="h-[88px] w-[76px] items-center justify-center rounded-[24px] bg-white">
                <Ionicons name="checkmark" size={26} color="#1a3a2a" />
                <Text className="mt-0.5 font-sans-bold text-[13px] text-blue-spruce-900">{t.log.barcodeLog}</Text>
                <View className="mt-1 min-w-[22px] items-center rounded-full bg-blue-spruce-700 px-1.5 py-0.5">
                  <Text className="font-sans-bold text-[11px] text-white">{cart.length}</Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <BarcodeProductConfirmModal
        visible={confirmOpen}
        product={pendingProduct?.food ?? null}
        onConfirm={confirmPendingProduct}
        onSkip={skipPendingProduct}
      />
      <BarcodeLookupIssueModal
        issue={lookupIssue}
        onSearchByName={searchAfterIssue}
        onRetry={dismissLookupIssue}
      />
    </View>
  );
}
