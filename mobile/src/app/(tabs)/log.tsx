import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { LogBarcodeStep } from '@/components/log/LogBarcodeStep';
import { LogBarcodePortionStep } from '@/components/log/LogBarcodePortionStep';
import { LogMethodStep, type LogMethodId } from '@/components/log/LogMethodStep';
import { canRepeatMeal, LogPastMealsStep } from '@/components/log/LogPastMealsStep';
import { LogResultsStep } from '@/components/log/LogResultsStep';
import { LogScanStep } from '@/components/log/LogScanStep';
import { LogScreenShell } from '@/components/log/LogScreenShell';
import { LogTextStep } from '@/components/log/LogTextStep';
import { LogAnalyzingStep } from '@/components/log/LogAnalyzingStep';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { semanticColors } from '@/design-system/colors';
import { isMealTypeId, suggestMealTypeForNow, type MealTypeId } from '@/constants/mealTypes';
import type { LogStep } from '@/constants/logFlow';
import { useMeals } from '@/context/MealsContext';
import { useI18n } from '@/context/LocaleContext';
import { useToast } from '@/context/ToastContext';
import type { MealAnalysisPreview, MealSubmission } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useRequirePaid } from '@/hooks/useRequirePaid';
import { getApiErrorMessage, isSubscriptionRequiredError } from '@/utils/apiErrors';
import {
  consumeLogMealTypeIntent,
  consumeLogMethodIntent,
} from '@/utils/logIntent';
import {
  buildBarcodeCartNote,
  mealAnalysisFromPortions,
  mergeCartIntoPortions,
  type BarcodePortionState,
} from '@/services/remote/nutritionApi';
import {
  analysisPreviewFromPastMeal,
  createCoachReviewStub,
} from '@/services/local/mealAnalysis';
import { services } from '@/services';
import {
  buildImageCaptureMetadata,
  type CapturedImage,
} from '@/utils/imageCaptureMetadata';

type FlowStep = LogStep | 'text' | 'barcode' | 'barcode-portion' | 'past';

export default function LogMealScreen() {
  const { t } = useI18n();
  const { push } = useNavigateOnce();
  const toast = useToast();
  const isFocused = useIsFocused();
  const { mealType: mealTypeParam } = useLocalSearchParams<{ mealType?: string }>();
  const { saveMealToDiary, meals } = useMeals();
  const requirePaid = useRequirePaid();

  const [step, setStep] = useState<FlowStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<LogMethodId>('camera');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId | null>(() => suggestMealTypeForNow());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [openingCapture, setOpeningCapture] = useState(false);
  const [fromBarcode, setFromBarcode] = useState(false);
  const [fromPastMeal, setFromPastMeal] = useState(false);
  const [awaitingCoachConfirm, setAwaitingCoachConfirm] = useState(false);
  const [barcodePortions, setBarcodePortions] = useState<BarcodePortionState[]>([]);

  const bottomPadding = FLOATING_TAB_BAR_CLEARANCE;
  const stepTitles = useMemo(
    (): Record<FlowStep, string> => ({
      method: t.log.title,
      text: t.log.stepDescribe,
      barcode: t.log.stepBarcode,
      'barcode-portion': t.log.stepAmount,
      past: t.log.stepRepeat,
      scan: t.log.stepPhoto,
      analyzing: t.log.stepNaming,
      results: t.log.stepReview,
    }),
    [t],
  );
  const stepTitle = stepTitles[step];

  const resolveInitialMealType = useCallback((): MealTypeId | null => {
    if (mealTypeParam && isMealTypeId(mealTypeParam)) return mealTypeParam;
    return suggestMealTypeForNow();
  }, [mealTypeParam]);

  const resetFlow = useCallback(() => {
    setStep('method');
    setSelectedMealType(resolveInitialMealType());
    setImageUri(null);
    setTextInput('');
    setMealDescription('');
    setAnalysis(null);
    setSaving(false);
    setFromBarcode(false);
    setFromPastMeal(false);
    setAwaitingCoachConfirm(false);
    setBarcodePortions([]);
  }, [resolveInitialMealType]);

  const prepareCoachSubmit = useCallback(
    async (description: string) => {
      const cleaned = description.trim();
      setSaving(true);
      setStep('analyzing');
      setAwaitingCoachConfirm(true);

      let title = cleaned;
      if (cleaned) {
        try {
          title = await services.mealAnalysis.suggestMealTitle(cleaned);
        } catch {
          title = cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned;
        }
      } else {
        title = 'Logged meal';
      }

      const stub = createCoachReviewStub(cleaned || 'Meal photo');
      setAnalysis({ ...stub, mealName: title });
      setStep('results');
      setSaving(false);
    },
    [],
  );

  const handlePermissionDenied = useCallback(
    (source: 'camera' | 'gallery', canAskAgain: boolean) => {
      const label = source === 'camera' ? 'camera' : 'photos';
      toast.error(canAskAgain ? `Allow ${label} access to continue.` : `Enable ${label} in Settings.`);
    },
    [toast],
  );

  const pickImage = useCallback(
    async (source: 'camera' | 'gallery'): Promise<CapturedImage | null> => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        handlePermissionDenied(source, permission.canAskAgain);
        return null;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        quality: 0.8,
        allowsEditing: false,
        exif: true,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets[0]?.uri) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        metadata: buildImageCaptureMetadata(asset, source),
      };
    },
    [handlePermissionDenied],
  );

  const openPhotoFlow = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (saving || openingCapture) return;
      setSelectedMethod(source);
      setMealDescription('');
      setFromBarcode(false);
      setBarcodePortions([]);
      setOpeningCapture(true);
      try {
        const captured = await pickImage(source);
        if (!captured) {
          setStep('method');
          return;
        }
        setAnalysis(null);
        setAwaitingCoachConfirm(false);
        setImageUri(captured.uri);
        setStep('scan');
      } finally {
        setOpeningCapture(false);
      }
    },
    [openingCapture, pickImage, saving],
  );

  const handleMethodSelect = useCallback(
    async (method: LogMethodId) => {
      if (saving) return;
      setSelectedMethod(method);

      if (method === 'camera') {
        await openPhotoFlow('camera');
        return;
      }

      if (method === 'gallery') {
        await openPhotoFlow('gallery');
        return;
      }

      if (method === 'text') {
        setFromBarcode(false);
        setStep('text');
        return;
      }

      if (method === 'barcode') {
        setFromBarcode(false);
        setImageUri(null);
        setAnalysis(null);
        setAwaitingCoachConfirm(false);
        setStep('barcode');
        return;
      }

      setFromBarcode(false);
      setFromPastMeal(false);
      setStep('past');
    },
    [openPhotoFlow, saving],
  );

  const handleSelectPastMeal = useCallback(
    (meal: MealSubmission) => {
      if (saving || !canRepeatMeal(meal)) return;
      try {
        const preview = analysisPreviewFromPastMeal(meal);
        const description =
          meal.note?.trim() ||
          meal.textInput?.trim() ||
          meal.mealName?.trim() ||
          preview.mealName;
        setFromBarcode(false);
        setFromPastMeal(true);
        setSelectedMealType(meal.mealType);
        setImageUri(meal.imageUrl ?? null);
        setTextInput(description);
        setMealDescription(description);
        // Coach-first: send a stub; coach confirms nutrition (past macros are a hint only via note).
        setAnalysis(createCoachReviewStub(description));
        setAwaitingCoachConfirm(true);
        setStep('results');
      } catch {
        toast.error('Could not load that meal. Try another one.');
      }
    },
    [saving, toast],
  );

  const resetToMethodStep = useCallback(() => {
    setStep('method');
    setImageUri(null);
    setTextInput('');
    setMealDescription('');
    setAnalysis(null);
    setFromBarcode(false);
    setFromPastMeal(false);
    setAwaitingCoachConfirm(false);
    setBarcodePortions([]);
  }, []);

  const applyNavigationIntents = useCallback(() => {
    const fromMealType = consumeLogMealTypeIntent();
    const fromMethod = consumeLogMethodIntent();

    if (fromMealType) {
      setSelectedMealType(fromMealType);
    } else if (mealTypeParam && isMealTypeId(mealTypeParam)) {
      setSelectedMealType(mealTypeParam);
    }

    if (!fromMethod) return;

    if (fromMethod === 'method') {
      resetToMethodStep();
      return;
    }
    if (fromMethod === 'camera') {
      setSelectedMethod('camera');
      setMealDescription('');
      setFromBarcode(false);
      setBarcodePortions([]);
      void openPhotoFlow('camera');
      return;
    }
    if (fromMethod === 'gallery') {
      setSelectedMethod('gallery');
      setMealDescription('');
      setFromBarcode(false);
      setBarcodePortions([]);
      void openPhotoFlow('gallery');
      return;
    }
    if (fromMethod === 'describe') {
      setSelectedMethod('text');
      setFromBarcode(false);
      setFromPastMeal(false);
      setImageUri(null);
      setAnalysis(null);
      setAwaitingCoachConfirm(false);
      setTextInput('');
      setMealDescription('');
      setStep('text');
      return;
    }
    if (fromMethod === 'barcode') {
      setSelectedMethod('barcode');
      setFromBarcode(false);
      setFromPastMeal(false);
      setImageUri(null);
      setAnalysis(null);
      setAwaitingCoachConfirm(false);
      setBarcodePortions([]);
      setStep('barcode');
    }
  }, [mealTypeParam, openPhotoFlow, resetToMethodStep]);

  useFocusEffect(
    useCallback(() => {
      applyNavigationIntents();
    }, [applyNavigationIntents]),
  );

  const handleRetakePhoto = useCallback(async () => {
    if (saving) return;
    const source = selectedMethod === 'gallery' ? 'gallery' : 'camera';
    await openPhotoFlow(source);
  }, [openPhotoFlow, saving, selectedMethod]);

  const handlePhotoContinue = useCallback(async () => {
    if (saving) return;
    // Description is optional for photo logs; photo alone is enough to submit to coach.
    await prepareCoachSubmit(mealDescription.trim());
  }, [mealDescription, prepareCoachSubmit, saving]);

  const handleTextContinue = useCallback(async () => {
    if (saving) return;
    const description = textInput.trim();
    if (description.length < 3) {
      toast.error('Describe what you ate before continuing.');
      return;
    }
    setMealDescription(description);
    await prepareCoachSubmit(description);
  }, [prepareCoachSubmit, saving, textInput, toast]);

  const handleBarcodePortionContinue = useCallback(() => {
    if (saving || !barcodePortions.length) return;
    if (barcodePortions.some((row) => row.grams < 1)) {
      toast.error('Set an amount for each item.');
      return;
    }
    const nextAnalysis = mealAnalysisFromPortions(
      barcodePortions.map((row) => ({
        food: row.food,
        grams: row.grams,
        serving:
          row.food.servings.find((serving) => serving.id === row.servingId) ??
          row.food.servings.find((serving) => serving.isDefault) ??
          row.food.servings[0] ??
          null,
      })),
    );
    const note = buildBarcodeCartNote(barcodePortions);
    const summary =
      barcodePortions.length === 1
        ? `${barcodePortions[0]!.food.name} · ${barcodePortions[0]!.grams}g`
        : `${barcodePortions.length} packaged items · ${nextAnalysis.totalWeightG}g`;
    setFromBarcode(true);
    setFromPastMeal(false);
    setAnalysis(nextAnalysis);
    setMealDescription(note);
    setTextInput(summary);
    setImageUri(barcodePortions.find((row) => row.food.imageUrl)?.food.imageUrl ?? null);
    setAwaitingCoachConfirm(false);
    setStep('results');
  }, [barcodePortions, saving, toast]);

  const handleSave = useCallback(async () => {
    if (!analysis || saving || !selectedMealType) {
      if (!selectedMealType) {
        toast.error('Pick a meal type before submitting.');
      }
      return;
    }
    if (!requirePaid('meal')) return;

    setSaving(true);
    try {
      const meal = await saveMealToDiary({
        mealType: selectedMealType,
        imageUrl: imageUri ?? undefined,
        textInput: (fromBarcode ? textInput : imageUri ? mealDescription : textInput).trim() || undefined,
        note: mealDescription.trim() || undefined,
        analysis,
      });
      resetFlow();
      toast.success('Sent to your coach for review.', 'Submitted');
      push(`/meal/${meal.id}`);
    } catch (error) {
      if (isSubscriptionRequiredError(error)) {
        // Soft paywall — avoid a second toast; requirePaid already prompted when possible.
        push('/paywall');
      } else {
        toast.error(getApiErrorMessage(error, 'Could not save this meal. Try again.'));
      }
    } finally {
      setSaving(false);
    }
  }, [
    analysis,
    fromBarcode,
    imageUri,
    mealDescription,
    push,
    requirePaid,
    resetFlow,
    saveMealToDiary,
    selectedMealType,
    saving,
    textInput,
    toast,
  ]);

  const handleBack = useCallback(() => {
    if (step === 'text' || step === 'scan' || step === 'barcode' || step === 'past') {
      setStep('method');
      return;
    }
    if (step === 'barcode-portion') {
      setStep('barcode');
      return;
    }
    if (step === 'results') {
      if (fromPastMeal) {
        setAnalysis(null);
        setFromPastMeal(false);
        setAwaitingCoachConfirm(false);
        setStep('past');
        return;
      }
      if (fromBarcode) {
        setAwaitingCoachConfirm(false);
        setStep('barcode-portion');
        return;
      }
      setStep(imageUri ? 'scan' : 'text');
    }
  }, [fromBarcode, fromPastMeal, imageUri, step]);

  const showBack = step !== 'method' && step !== 'analyzing' && step !== 'barcode';
  const useScroll =
    step === 'method' ||
    step === 'results' ||
    step === 'scan' ||
    step === 'text' ||
    step === 'past' ||
    step === 'barcode-portion';
  const keyboardAvoid = step === 'text' || step === 'scan';

  const footer = useMemo(() => {
    if (step === 'results' && analysis) {
      return (
        <Button
          label={saving ? t.log.submitting : t.log.submitMeal}
          variant="primary"
          onPress={handleSave}
          disabled={saving || !selectedMealType}
          fullWidth
        />
      );
    }
    return null;
  }, [analysis, handleSave, saving, selectedMealType, step, t]);

  const content = useMemo(() => {
    if (openingCapture) {
      return (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={semanticColors.primary} />
          <Text className="mt-4 text-sm text-neutral-500">
            {selectedMethod === 'gallery' ? t.log.openingGallery : t.log.openingCamera}
          </Text>
        </View>
      );
    }
    if (step === 'method') {
      return <LogMethodStep loading={saving} onSelectMethod={handleMethodSelect} />;
    }
    if (step === 'text') {
      return (
        <LogTextStep
          value={textInput}
          loading={saving}
          onChangeText={setTextInput}
          onContinue={handleTextContinue}
        />
      );
    }
    if (step === 'barcode') {
      return (
        <LogBarcodeStep
          loading={saving}
          initialCart={barcodePortions.map((row) => ({
            key: row.key,
            food: row.food,
            barcode: row.barcode,
          }))}
          onBack={() => setStep('method')}
          onContinue={(cart) => {
            if (!cart.length) return;
            setFromBarcode(true);
            setFromPastMeal(false);
            setBarcodePortions((prev) => mergeCartIntoPortions(prev, cart));
            setAnalysis(null);
            setAwaitingCoachConfirm(false);
            setStep('barcode-portion');
          }}
        />
      );
    }
    if (step === 'barcode-portion' && barcodePortions.length) {
      return (
        <LogBarcodePortionStep
          portions={barcodePortions}
          loading={saving}
          onChange={setBarcodePortions}
          onBack={() => setStep('barcode')}
          onContinue={handleBarcodePortionContinue}
        />
      );
    }
    if (step === 'past') {
      return (
        <LogPastMealsStep
          meals={meals}
          loading={saving}
          onSelect={handleSelectPastMeal}
        />
      );
    }
    if (step === 'scan' && imageUri) {
      return (
        <LogScanStep
          imageUri={imageUri}
          mealDescription={mealDescription}
          onMealDescriptionChange={setMealDescription}
          loading={saving}
          onRetake={handleRetakePhoto}
          onContinue={handlePhotoContinue}
        />
      );
    }
    if (step === 'analyzing') {
      return <LogAnalyzingStep variant="title" />;
    }
    if (step === 'results' && analysis) {
      return (
        <LogResultsStep
          analysis={analysis}
          imageUri={imageUri ?? undefined}
          selectedMealType={selectedMealType}
          onSelectMealType={setSelectedMealType}
          awaitingCoachConfirm={awaitingCoachConfirm}
        />
      );
    }
    return null;
  }, [
    analysis,
    awaitingCoachConfirm,
    barcodePortions,
    handleBarcodePortionContinue,
    handleMethodSelect,
    handlePhotoContinue,
    handleRetakePhoto,
    handleSelectPastMeal,
    handleTextContinue,
    imageUri,
    mealDescription,
    meals,
    openingCapture,
    saving,
    selectedMealType,
    selectedMethod,
    step,
    t,
    textInput,
  ]);

  return (
    <>
      {isFocused ? <StatusBar style={step === 'barcode' ? 'light' : 'light'} /> : null}
      {step === 'barcode' ? (
        content
      ) : (
        <LogScreenShell
          title={stepTitle}
          onBack={showBack ? handleBack : undefined}
          scroll={useScroll}
          keyboardAvoid={keyboardAvoid}
          bottomPadding={bottomPadding}
          footer={footer}>
          {content}
        </LogScreenShell>
      )}
    </>
  );
}
