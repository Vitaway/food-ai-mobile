import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';

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
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { isMealTypeId, suggestMealTypeForNow, type MealTypeId } from '@/constants/mealTypes';
import type { LogStep } from '@/constants/logFlow';
import { useMeals } from '@/context/MealsContext';
import { useToast } from '@/context/ToastContext';
import type { MealAnalysisPreview, MealSubmission } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { getApiErrorMessage, isSubscriptionRequiredError } from '@/utils/apiErrors';
import {
  consumeLogMealTypeIntent,
  consumeLogMethodIntent,
} from '@/utils/logIntent';
import {
  buildBarcodeMealNote,
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

const STEP_TITLES: Record<FlowStep, string> = {
  method: 'Log meal',
  text: 'Describe',
  barcode: 'Barcode',
  'barcode-portion': 'Amount eaten',
  past: 'Repeat',
  scan: 'Photo',
  analyzing: 'Naming meal',
  results: 'Review & submit',
};

export default function LogMealScreen() {
  const { push } = useNavigateOnce();
  const toast = useToast();
  const isFocused = useIsFocused();
  const { mealType: mealTypeParam } = useLocalSearchParams<{ mealType?: string }>();
  const { saveMealToDiary, meals } = useMeals();

  const [step, setStep] = useState<FlowStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<LogMethodId>('camera');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId | null>(() => suggestMealTypeForNow());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [fromBarcode, setFromBarcode] = useState(false);
  const [fromPastMeal, setFromPastMeal] = useState(false);
  const [awaitingCoachConfirm, setAwaitingCoachConfirm] = useState(false);
  const [barcodeProductNote, setBarcodeProductNote] = useState('');

  const bottomPadding = FLOATING_TAB_BAR_CLEARANCE;
  const stepTitle = STEP_TITLES[step];

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
    setBarcodeProductNote('');
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
      if (saving) return;
      setSelectedMethod(source);
      setMealDescription('');
      setFromBarcode(false);
      setBarcodeProductNote('');
      const captured = await pickImage(source);
      if (!captured) {
        setStep('method');
        return;
      }
      setAnalysis(null);
      setAwaitingCoachConfirm(false);
      setImageUri(captured.uri);
      setStep('scan');
    },
    [pickImage, saving],
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
    setBarcodeProductNote('');
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
      resetToMethodStep();
      void openPhotoFlow('camera');
      return;
    }
    if (fromMethod === 'gallery') {
      resetToMethodStep();
      void openPhotoFlow('gallery');
      return;
    }
    if (fromMethod === 'describe') {
      resetToMethodStep();
      setStep('text');
      return;
    }
    if (fromMethod === 'barcode') {
      resetToMethodStep();
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
    // Description is optional for photo logs — photo alone is enough to submit to coach.
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
    if (saving || !analysis) return;
    const portion = mealDescription.trim();
    if (portion.length < 3) {
      toast.error('Describe how much you ate before continuing.');
      return;
    }
    const combined = barcodeProductNote ? `${portion}. ${barcodeProductNote}` : portion;
    setMealDescription(combined);
    setTextInput(portion);
    setStep('results');
  }, [analysis, barcodeProductNote, mealDescription, saving, toast]);

  const handleSave = useCallback(async () => {
    if (!analysis || saving || !selectedMealType) {
      if (!selectedMealType) {
        toast.error('Pick a meal type before submitting.');
      }
      return;
    }

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
        toast.error(getApiErrorMessage(error), 'Subscription needed');
        push('/profile/subscription');
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
      setMealDescription('');
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
        setMealDescription('');
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
  const keyboardAvoid = step === 'text' || step === 'scan' || step === 'barcode-portion';

  const footer = useMemo(() => {
    if (step === 'results' && analysis) {
      return (
        <Button
          label={saving ? 'Submitting…' : 'Submit meal'}
          variant="primary"
          onPress={handleSave}
          disabled={saving || !selectedMealType}
          fullWidth
        />
      );
    }
    return null;
  }, [analysis, handleSave, saving, selectedMealType, step]);

  const content = useMemo(() => {
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
          onBack={() => setStep('method')}
          onFound={(nextAnalysis, barcode, imageUrl, food) => {
            setFromBarcode(true);
            setFromPastMeal(false);
            setImageUri(imageUrl ?? null);
            const label = nextAnalysis.mealName || `Barcode ${barcode}`;
            setTextInput(label);
            setBarcodeProductNote(buildBarcodeMealNote(food, barcode));
            setMealDescription('');
            setAnalysis(nextAnalysis);
            setAwaitingCoachConfirm(false);
            setStep('barcode-portion');
          }}
        />
      );
    }
    if (step === 'barcode-portion' && analysis) {
      return (
        <LogBarcodePortionStep
          analysis={analysis}
          imageUri={imageUri}
          value={mealDescription}
          loading={saving}
          onChangeText={setMealDescription}
          onBack={() => {
            setMealDescription('');
            setStep('barcode');
          }}
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
          onAnalysisChange={setAnalysis}
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
    handleBarcodePortionContinue,
    handleMethodSelect,
    handlePhotoContinue,
    handleRetakePhoto,
    handleSelectPastMeal,
    handleTextContinue,
    imageUri,
    mealDescription,
    meals,
    saving,
    selectedMealType,
    step,
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
