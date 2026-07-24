import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';

import { LogBarcodeStep } from '@/components/log/LogBarcodeStep';
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
import { getApiErrorMessage } from '@/utils/apiErrors';
import {
  consumeLogMealTypeIntent,
  consumeLogMethodIntent,
} from '@/utils/logIntent';
import {
  analysisPreviewFromPastMeal,
  createCoachReviewStub,
} from '@/services/local/mealAnalysis';
import { services } from '@/services';
import {
  buildImageCaptureMetadata,
  type CapturedImage,
} from '@/utils/imageCaptureMetadata';

type FlowStep = LogStep | 'text' | 'barcode' | 'past';

const STEP_TITLES: Record<FlowStep, string> = {
  method: 'Log meal',
  text: 'Describe',
  barcode: 'Barcode',
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
  const handledIntentRef = useRef(false);

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
    handledIntentRef.current = false;
  }, [resolveInitialMealType]);

  const prepareCoachSubmit = useCallback(
    async (description: string) => {
      const cleaned = description.trim();
      setSaving(true);
      setStep('analyzing');
      setAwaitingCoachConfirm(true);

      let title = cleaned;
      try {
        title = await services.mealAnalysis.suggestMealTitle(cleaned);
      } catch {
        title = cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned;
      }

      const stub = createCoachReviewStub(cleaned);
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

  const applyNavigationIntents = useCallback(() => {
    const fromMealType = consumeLogMealTypeIntent();
    const fromMethod = consumeLogMethodIntent();

    if (fromMealType) {
      setSelectedMealType(fromMealType);
    } else if (mealTypeParam && isMealTypeId(mealTypeParam)) {
      setSelectedMealType(mealTypeParam);
    }

    if (!fromMethod || handledIntentRef.current) return;
    handledIntentRef.current = true;

    if (fromMethod === 'camera') {
      void openPhotoFlow('camera');
      return;
    }
    if (fromMethod === 'gallery') {
      void openPhotoFlow('gallery');
      return;
    }
    if (fromMethod === 'describe') {
      setStep('text');
    }
  }, [mealTypeParam, openPhotoFlow]);

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
    const description = mealDescription.trim();
    if (description.length < 3) {
      toast.error('Describe what you ate before continuing.');
      return;
    }
    await prepareCoachSubmit(description);
  }, [mealDescription, prepareCoachSubmit, saving, toast]);

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
        textInput: (imageUri ? mealDescription : textInput).trim() || undefined,
        note: mealDescription.trim() || undefined,
        analysis,
      });
      resetFlow();
      toast.success('Sent to your coach for review.', 'Submitted');
      push(`/meal/${meal.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save this meal. Try again.'));
    } finally {
      setSaving(false);
    }
  }, [
    analysis,
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
        setStep('barcode');
        return;
      }
      setStep(imageUri ? 'scan' : 'text');
    }
  }, [fromBarcode, fromPastMeal, imageUri, step]);

  const showBack = step !== 'method' && step !== 'analyzing';
  const useScroll =
    step === 'method' ||
    step === 'results' ||
    step === 'scan' ||
    step === 'text' ||
    step === 'barcode' ||
    step === 'past';
  const keyboardAvoid = step === 'text' || step === 'scan';

  const footer = useMemo(() => {
    if (step === 'results' && analysis) {
      return (
        <Button
          label={saving ? 'Submitting…' : 'Submit meal'}
          variant="secondary"
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
          onFound={(nextAnalysis, barcode) => {
            setFromBarcode(true);
            setFromPastMeal(false);
            setImageUri(null);
            const label = nextAnalysis.mealName || `Barcode ${barcode}`;
            setTextInput(label);
            setMealDescription(
              `Barcode ${barcode}: ${label}. Product nutrition available in database for coach review.`,
            );
            // Coach-first: do not show DB macros to the patient before coach confirm.
            setAnalysis(createCoachReviewStub(label));
            setAwaitingCoachConfirm(true);
            setStep('results');
          }}
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
      {isFocused ? <StatusBar style="light" /> : null}
      <LogScreenShell
        title={stepTitle}
        onBack={showBack ? handleBack : undefined}
        scroll={useScroll}
        keyboardAvoid={keyboardAvoid}
        bottomPadding={bottomPadding}
        footer={footer}>
        {content}
      </LogScreenShell>
    </>
  );
}
