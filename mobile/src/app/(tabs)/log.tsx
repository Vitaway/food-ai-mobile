import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LogAnalyzingStep } from '@/components/log/LogAnalyzingStep';
import { LogMethodStep, type LogMethodId } from '@/components/log/LogMethodStep';
import { LogResultsStep } from '@/components/log/LogResultsStep';
import { LogScanStep } from '@/components/log/LogScanStep';
import { LogScreenShell } from '@/components/log/LogScreenShell';
import { LogTextStep } from '@/components/log/LogTextStep';
import { Button } from '@/components/ui/Button';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { isMealTypeId, suggestMealTypeForNow, type MealTypeId } from '@/constants/mealTypes';
import type { LogStep } from '@/constants/logMock';
import { useMeals } from '@/context/MealsContext';
import { useToast } from '@/context/ToastContext';
import { services } from '@/services';
import type { PlateContainerType } from '@/services/contracts/plateDetectionService';
import type { MealAnalysisPreview } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { getApiErrorMessage } from '@/utils/apiErrors';
import {
  consumeLogMealTypeIntent,
  consumeLogMethodIntent,
} from '@/utils/logIntent';
import {
  buildImageCaptureMetadata,
  type CapturedImage,
  type ImageCaptureMetadata,
} from '@/utils/imageCaptureMetadata';

type FlowStep = LogStep | 'text';

const STEP_TITLES: Record<FlowStep, string> = {
  method: 'Log meal',
  text: 'Describe',
  scan: 'Photo',
  analyzing: 'Analyzing',
  results: 'Results',
};

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
  const [galleryNote, setGalleryNote] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisPreview | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [captureMetadata, setCaptureMetadata] = useState<ImageCaptureMetadata | null>(null);
  const [detectingPlate, setDetectingPlate] = useState(false);
  const [plateDetected, setPlateDetected] = useState(false);
  const [containerType, setContainerType] = useState<PlateContainerType | null>(null);
  const [plateDiameterCm, setPlateDiameterCm] = useState<number | null>(null);
  const [plateConfidence, setPlateConfidence] = useState<number | null>(null);
  const [plateDetectionError, setPlateDetectionError] = useState<string | null>(null);

  const bottomPadding = FLOATING_TAB_BAR_CLEARANCE;
  const stepTitle = STEP_TITLES[step];

  const resolveInitialMealType = useCallback((): MealTypeId | null => {
    if (mealTypeParam && isMealTypeId(mealTypeParam)) return mealTypeParam;
    return suggestMealTypeForNow();
  }, [mealTypeParam]);

  const resetPlateDetection = useCallback(() => {
    setCaptureMetadata(null);
    setDetectingPlate(false);
    setPlateDetected(false);
    setContainerType(null);
    setPlateDiameterCm(null);
    setPlateConfidence(null);
    setPlateDetectionError(null);
  }, []);

  const resetFlow = useCallback(() => {
    setStep('method');
    setSelectedMealType(resolveInitialMealType());
    setImageUri(null);
    setTextInput('');
    setGalleryNote('');
    setAnalysis(null);
    setAnalyzing(false);
    setSaving(false);
    resetPlateDetection();
    handledIntentRef.current = false;
  }, [resolveInitialMealType, resetPlateDetection]);

  const detectPlateFromPhoto = useCallback(async (uri: string, metadata: ImageCaptureMetadata) => {
    setDetectingPlate(true);
    setPlateDetected(false);
    setContainerType(null);
    setPlateDiameterCm(null);
    setPlateConfidence(null);
    setPlateDetectionError(null);

    try {
      const result = await services.plateDetection.detectPlate({ imageUri: uri, metadata });
      setPlateDetected(result.detected);
      setContainerType(result.containerType);
      setPlateDiameterCm(result.diameterCm);
      setPlateConfidence(result.confidence);
    } catch (error) {
      setPlateDetected(false);
      setContainerType(null);
      setPlateDiameterCm(null);
      setPlateConfidence(null);
      setPlateDetectionError(
        error instanceof Error ? error.message : 'Plate detection failed. Check the API server.',
      );
    } finally {
      setDetectingPlate(false);
    }
  }, []);

  useEffect(() => {
    if (!imageUri || !captureMetadata || step !== 'scan') return;
    detectPlateFromPhoto(imageUri, captureMetadata);
  }, [captureMetadata, detectPlateFromPhoto, imageUri, step]);

  const combinedTextInput = useMemo(() => {
    const parts = [textInput.trim(), galleryNote.trim()].filter(Boolean);
    return parts.join('. ');
  }, [galleryNote, textInput]);

  const runAnalysis = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setStep('analyzing');
    try {
      const result = await analyzeMeal({
        imageUri: imageUri ?? undefined,
        text: combinedTextInput || undefined,
        plateDiameterCm: plateDiameterCm ?? undefined,
      });
      setAnalysis(result);
      setStep('results');
    } catch {
      toast.error('Could not analyze this meal. Try again.');
      setStep(imageUri ? 'scan' : 'text');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, analyzeMeal, combinedTextInput, imageUri, plateDiameterCm, toast]);

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
        quality: 0.92,
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
      setGalleryNote('');
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
        setStep('text');
        return;
      }

      const past = meals.find((meal) => meal.status === 'approved');
      if (!past) {
        toast.info('Log a meal first, then you can repeat it here.');
        return;
      }
      setSelectedMealType(past.mealType);
      setImageUri(past.imageUrl ?? null);
      setTextInput(past.textInput ?? past.mealName ?? '');
      setGalleryNote('');
      setStep('text');
    },
    [analyzing, meals, openPhotoFlow, saving, toast],
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
        textInput: combinedTextInput || undefined,
        note: galleryNote.trim() || undefined,
        plateDiameterCm: analysis.plateDiameterCm ?? plateDiameterCm,
        analysis,
      });
      resetFlow();
      toast.success('Meal sent for coach review.', 'Submitted');
      push(`/meal/${meal.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save this meal. Try again.'));
    } finally {
      setSaving(false);
    }
  }, [
    analysis,
    combinedTextInput,
    galleryNote,
    imageUri,
    plateDiameterCm,
    push,
    resetFlow,
    saveMealToDiary,
    selectedMealType,
    saving,
    toast,
  ]);

  const handleBack = useCallback(() => {
    if (step === 'text' || step === 'scan') setStep('method');
    else if (step === 'results') setStep(imageUri ? 'scan' : 'text');
  }, [imageUri, step]);

  const showBack = step !== 'method' && step !== 'analyzing';
  const useScroll = step === 'method' || step === 'results' || step === 'analyzing' || step === 'scan';

  const footer = useMemo(() => {
    if (step === 'results' && analysis) {
      return (
        <Button
          label={saving ? 'Submitting…' : 'Submit for review'}
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
          bottomPadding={bottomPadding}
          onChangeText={setTextInput}
          onContinue={runAnalysis}
        />
      );
    }
    if (step === 'scan' && imageUri) {
      return (
        <LogScanStep
          imageUri={imageUri}
          preview={analysis}
          detectingPlate={detectingPlate}
          plateDetected={plateDetected}
          containerType={containerType}
          plateDiameterCm={plateDiameterCm}
          plateConfidence={plateConfidence}
          plateDetectionError={plateDetectionError}
          showGalleryNote={selectedMethod === 'gallery'}
          galleryNote={galleryNote}
          onGalleryNoteChange={setGalleryNote}
          loading={analyzing}
          bottomPadding={bottomPadding}
          onRetake={handleRetakePhoto}
          onCapture={runAnalysis}
        />
      );
    }
    if (step === 'analyzing') {
      return (
        <LogAnalyzingStep
          detectingPlate={detectingPlate}
          plateDetected={plateDetected}
          containerType={containerType}
          plateDiameterCm={plateDiameterCm}
          plateConfidence={plateConfidence}
        />
      );
    }
    if (step === 'results' && analysis) {
      return (
        <LogResultsStep
          analysis={analysis}
          imageUri={imageUri ?? undefined}
          selectedMealType={selectedMealType}
          onSelectMealType={setSelectedMealType}
        />
      );
    }
    return null;
  }, [
    analysis,
    analyzing,
    bottomPadding,
    containerType,
    detectingPlate,
    galleryNote,
    handleMethodSelect,
    handleRetakePhoto,
    imageUri,
    plateConfidence,
    plateDetected,
    plateDetectionError,
    plateDiameterCm,
    runAnalysis,
    saving,
    selectedMealType,
    selectedMethod,
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
        bottomPadding={bottomPadding}
        footer={footer}>
        {content}
      </LogScreenShell>
    </>
  );
}
