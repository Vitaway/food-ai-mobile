import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';

import { LogAnalyzingStep, type MealAnalyzePhase } from '@/components/log/LogAnalyzingStep';
import { LogBarcodeStep } from '@/components/log/LogBarcodeStep';
import { LogMethodStep, type LogMethodId } from '@/components/log/LogMethodStep';
import { canRepeatMeal, LogPastMealsStep } from '@/components/log/LogPastMealsStep';
import { LogResultsStep } from '@/components/log/LogResultsStep';
import { LogScanStep } from '@/components/log/LogScanStep';
import { LogScreenShell } from '@/components/log/LogScreenShell';
import { LogTextStep } from '@/components/log/LogTextStep';
import { Button } from '@/components/ui/Button';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { isMealTypeId, suggestMealTypeForNow, type MealTypeId } from '@/constants/mealTypes';
import type { LogStep } from '@/constants/logFlow';
import { useMeals } from '@/context/MealsContext';
import { useToast } from '@/context/ToastContext';
import { services } from '@/services';
import type { PlateContainerType } from '@/services/contracts/plateDetectionService';
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
import {
  buildImageCaptureMetadata,
  type CapturedImage,
  type ImageCaptureMetadata,
} from '@/utils/imageCaptureMetadata';

type FlowStep = LogStep | 'text' | 'barcode' | 'past';

const STEP_TITLES: Record<FlowStep, string> = {
  method: 'Log meal',
  text: 'Describe',
  barcode: 'Barcode',
  past: 'Repeat',
  scan: 'Photo',
  analyzing: 'AI analysis',
  results: 'Review & submit',
};

/** Label for coach-only stubs when AI is unavailable — never use marketing/status copy here. */
function stubMealLabel(opts: { imageUri?: string | null; mealDescription?: string; textInput?: string }) {
  const described = opts.mealDescription?.trim() || opts.textInput?.trim();
  if (described) return described;
  return opts.imageUri ? 'Meal photo' : 'Meal';
}

export default function LogMealScreen() {
  const { push } = useNavigateOnce();
  const toast = useToast();
  const isFocused = useIsFocused();
  const { mealType: mealTypeParam } = useLocalSearchParams<{ mealType?: string }>();
  const { analyzeMeal, saveMealToDiary, meals } = useMeals();
  const handledIntentRef = useRef(false);

  const [step, setStep] = useState<FlowStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<LogMethodId>('camera');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId | null>(() => suggestMealTypeForNow());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisPreview | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [captureMetadata, setCaptureMetadata] = useState<ImageCaptureMetadata | null>(null);
  const [plateDetected, setPlateDetected] = useState(false);
  const [containerType, setContainerType] = useState<PlateContainerType | null>(null);
  const [plateDiameterCm, setPlateDiameterCm] = useState<number | null>(null);
  const [plateConfidence, setPlateConfidence] = useState<number | null>(null);
  const [plateDetectionError, setPlateDetectionError] = useState<string | null>(null);
  const [analyzePhase, setAnalyzePhase] = useState<MealAnalyzePhase | null>(null);
  const [fromBarcode, setFromBarcode] = useState(false);
  const [fromPastMeal, setFromPastMeal] = useState(false);

  const bottomPadding = FLOATING_TAB_BAR_CLEARANCE;
  const stepTitle = STEP_TITLES[step];

  const resolveInitialMealType = useCallback((): MealTypeId | null => {
    if (mealTypeParam && isMealTypeId(mealTypeParam)) return mealTypeParam;
    return suggestMealTypeForNow();
  }, [mealTypeParam]);

  const resetPlateResults = useCallback(() => {
    setPlateDetected(false);
    setContainerType(null);
    setPlateDiameterCm(null);
    setPlateConfidence(null);
    setPlateDetectionError(null);
  }, []);

  const resetPlateDetection = useCallback(() => {
    setCaptureMetadata(null);
    resetPlateResults();
    setAnalyzePhase(null);
  }, [resetPlateResults]);

  const resetFlow = useCallback(() => {
    setStep('method');
    setSelectedMealType(resolveInitialMealType());
    setImageUri(null);
    setTextInput('');
    setMealDescription('');
    setAnalysis(null);
    setAnalyzing(false);
    setSaving(false);
    setFromBarcode(false);
    setFromPastMeal(false);
    resetPlateDetection();
    handledIntentRef.current = false;
  }, [resolveInitialMealType, resetPlateDetection]);

  const detectPlateFromPhoto = useCallback(async (uri: string, metadata: ImageCaptureMetadata) => {
    setPlateDetectionError(null);

    try {
      const result = await services.plateDetection.detectPlate({ imageUri: uri, metadata });
      setPlateDetected(result.detected);
      setContainerType(result.containerType);
      setPlateDiameterCm(result.diameterCm);
      setPlateConfidence(result.confidence);
      return result;
    } catch (error) {
      setPlateDetected(false);
      setContainerType(null);
      setPlateDiameterCm(null);
      setPlateConfidence(null);
      const message =
        error instanceof Error ? error.message : 'Plate detection failed. Check the API server.';
      setPlateDetectionError(message);
      return null;
    }
  }, []);

  const runPhotoAnalysis = useCallback(async () => {
    if (analyzing || !imageUri || !captureMetadata) return;

    setAnalyzing(true);
    setStep('analyzing');
    setAnalyzePhase('plate');
    resetPlateResults();

    let resolvedDiameter: number | null = null;
    const plateResult = await detectPlateFromPhoto(imageUri, captureMetadata);
    if (plateResult?.detected && plateResult.diameterCm != null) {
      resolvedDiameter = plateResult.diameterCm;
    }

    setAnalyzePhase('food');
    try {
      const result = await analyzeMeal({
        imageUri,
        note: mealDescription.trim() || undefined,
        plateDiameterCm: resolvedDiameter ?? undefined,
      });
      setAnalysis(result);
      setStep('results');
    } catch (error) {
      const fallback = createCoachReviewStub(
        stubMealLabel({ imageUri, mealDescription }),
      );
      setAnalysis(fallback);
      setStep('results');
      toast.info('Instant insights are unavailable right now. You can still submit this meal.');
    } finally {
      setAnalyzing(false);
      setAnalyzePhase(null);
    }
  }, [
    analyzing,
    analyzeMeal,
    captureMetadata,
    detectPlateFromPhoto,
    imageUri,
    mealDescription,
    resetPlateResults,
    toast,
  ]);

  const runTextAnalysis = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setStep('analyzing');
    setAnalyzePhase('food');
    try {
      const result = await analyzeMeal({
        text: textInput.trim() || undefined,
      });
      setAnalysis(result);
      setStep('results');
    } catch (error) {
      const fallback = createCoachReviewStub(
        stubMealLabel({ textInput }),
      );
      setAnalysis(fallback);
      setStep('results');
      toast.info('Instant insights are unavailable right now. You can still submit this meal.');
    } finally {
      setAnalyzing(false);
      setAnalyzePhase(null);
    }
  }, [analyzing, analyzeMeal, textInput, toast]);

  const runAnalysis = useCallback(async () => {
    if (imageUri) {
      await runPhotoAnalysis();
      return;
    }
    await runTextAnalysis();
  }, [imageUri, runPhotoAnalysis, runTextAnalysis]);

  const submitToCoachWithoutAi = useCallback(async () => {
    const description = mealDescription.trim();
    if (description.length < 3) {
      toast.error('Describe what you ate before submitting.');
      return;
    }
    if (analyzing || saving) return;

    setAnalyzing(true);
    setStep('analyzing');
    setAnalyzePhase('food');
    try {
      setAnalysis(createCoachReviewStub(description));
      setStep('results');
      toast.info('Nutrition will be confirmed from your photo and description.', 'Ready to submit');
    } finally {
      setAnalyzing(false);
      setAnalyzePhase(null);
    }
  }, [analyzing, mealDescription, saving, toast]);

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
      if (analyzing || saving) return;
      setSelectedMethod(source);
      setMealDescription('');
      const captured = await pickImage(source);
      if (!captured) {
        setStep('method');
        return;
      }
      resetPlateDetection();
      setAnalysis(null);
      setImageUri(captured.uri);
      setCaptureMetadata(captured.metadata);
      setStep('scan');
    },
    [analyzing, pickImage, resetPlateDetection, saving],
  );

  const handleMethodSelect = useCallback(
    async (method: LogMethodId) => {
      if (analyzing || saving) return;
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
        setStep('barcode');
        return;
      }

      setFromBarcode(false);
      setFromPastMeal(false);
      setStep('past');
    },
    [analyzing, openPhotoFlow, saving],
  );

  const handleSelectPastMeal = useCallback(
    (meal: MealSubmission) => {
      if (analyzing || saving || !canRepeatMeal(meal)) return;
      try {
        const preview = analysisPreviewFromPastMeal(meal);
        setFromBarcode(false);
        setFromPastMeal(true);
        setSelectedMealType(meal.mealType);
        setImageUri(meal.imageUrl ?? null);
        setTextInput(meal.textInput ?? meal.mealName ?? preview.mealName);
        setMealDescription(meal.note ?? '');
        setAnalysis(preview);
        setStep('results');
      } catch {
        toast.error('Could not load that meal. Try another one.');
      }
    },
    [analyzing, saving, toast],
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
    if (analyzing || saving) return;
    const source = selectedMethod === 'gallery' ? 'gallery' : 'camera';
    await openPhotoFlow(source);
  }, [analyzing, openPhotoFlow, saving, selectedMethod]);

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
        plateDiameterCm: analysis.plateDiameterCm ?? plateDiameterCm,
        analysis,
      });
      resetFlow();
      toast.success('Your meal was logged.', 'Saved');
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
    plateDiameterCm,
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
        setStep('past');
        return;
      }
      if (fromBarcode) {
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
    step === 'analyzing' ||
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
      return <LogMethodStep loading={analyzing || saving} onSelectMethod={handleMethodSelect} />;
    }
    if (step === 'text') {
      return (
        <LogTextStep
          value={textInput}
          loading={analyzing}
          onChangeText={setTextInput}
          onContinue={runAnalysis}
        />
      );
    }
    if (step === 'barcode') {
      return (
        <LogBarcodeStep
          loading={analyzing || saving}
          onBack={() => setStep('method')}
          onFound={(nextAnalysis) => {
            setFromBarcode(true);
            setFromPastMeal(false);
            setImageUri(null);
            setTextInput('');
            setMealDescription('');
            setAnalysis(nextAnalysis);
            setStep('results');
          }}
        />
      );
    }
    if (step === 'past') {
      return (
        <LogPastMealsStep
          meals={meals}
          loading={analyzing || saving}
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
          loading={analyzing}
          onRetake={handleRetakePhoto}
          onAnalyze={runAnalysis}
          onSubmitToCoach={submitToCoachWithoutAi}
        />
      );
    }
    if (step === 'analyzing') {
      return (
        <LogAnalyzingStep
          phase={analyzePhase ?? 'food'}
          variant={imageUri ? 'photo' : 'text'}
          plateDetected={plateDetected}
          containerType={containerType}
          plateDiameterCm={plateDiameterCm}
          plateDetectionError={plateDetectionError}
        />
      );
    }
    if (step === 'results' && analysis) {
      return (
        <LogResultsStep
          analysis={analysis}
          onAnalysisChange={setAnalysis}
          imageUri={imageUri ?? undefined}
          selectedMealType={selectedMealType}
          onSelectMealType={setSelectedMealType}
        />
      );
    }
    return null;
  }, [
    analysis,
    analyzePhase,
    analyzing,
    bottomPadding,
    containerType,
    handleMethodSelect,
    handleRetakePhoto,
    handleSelectPastMeal,
    imageUri,
    mealDescription,
    meals,
    plateDetected,
    plateDetectionError,
    plateDiameterCm,
    runAnalysis,
    submitToCoachWithoutAi,
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
