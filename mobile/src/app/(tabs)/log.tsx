import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { LogAnalyzingStep } from '@/components/log/LogAnalyzingStep';
import { LogMethodStep } from '@/components/log/LogMethodStep';
import { LogResultsStep } from '@/components/log/LogResultsStep';
import { LogScanStep } from '@/components/log/LogScanStep';
import { LogScreenShell } from '@/components/log/LogScreenShell';
import { LogTextStep } from '@/components/log/LogTextStep';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { isMealTypeId, suggestMealTypeForNow, type MealTypeId } from '@/constants/mealTypes';
import type { LogStep } from '@/constants/logMock';
import { useMeals } from '@/context/MealsContext';
import { services } from '@/services';
import type { PlateContainerType } from '@/services/contracts/plateDetectionService';
import type { MealAnalysisPreview } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { consumeLogMealTypeIntent } from '@/utils/logIntent';
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
  const isFocused = useIsFocused();
  const { mealType: mealTypeParam } = useLocalSearchParams<{ mealType?: string }>();
  const { analyzeMeal, saveMealToDiary, meals } = useMeals();

  const [step, setStep] = useState<FlowStep>('method');
  const [selectedMethod, setSelectedMethod] = useState('camera');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId | null>(() => suggestMealTypeForNow());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
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
    setAnalysis(null);
    setAnalyzing(false);
    setSaving(false);
    resetPlateDetection();
  }, [resolveInitialMealType, resetPlateDetection]);

  const applyMealTypeFromNavigation = useCallback(() => {
    const fromIntent = consumeLogMealTypeIntent();
    const nextType =
      fromIntent ?? (mealTypeParam && isMealTypeId(mealTypeParam) ? mealTypeParam : null);
    if (!nextType) return;
    setSelectedMealType(nextType);
    setStep('method');
  }, [mealTypeParam]);

  useFocusEffect(
    useCallback(() => {
      applyMealTypeFromNavigation();
    }, [applyMealTypeFromNavigation]),
  );

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

  const runAnalysis = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setStep('analyzing');
    try {
      const result = await analyzeMeal({
        imageUri: imageUri ?? undefined,
        text: textInput || undefined,
        plateDiameterCm: plateDiameterCm ?? undefined,
      });
      setAnalysis(result);
      setStep('results');
    } catch {
      Alert.alert('Analysis failed', 'Try again.');
      setStep(imageUri ? 'scan' : 'text');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, analyzeMeal, imageUri, plateDiameterCm, textInput]);

  const handlePermissionDenied = useCallback((source: 'camera' | 'gallery', canAskAgain: boolean) => {
    const label = source === 'camera' ? 'camera' : 'photos';
    Alert.alert('Permission needed', canAskAgain ? `Allow ${label} access.` : `Enable ${label} in Settings.`);
  }, []);

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
        // Keep full frame for diameter measurement — cropping skews rim detection.
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

  const handleContinue = useCallback(async () => {
    if (analyzing || saving) return;

    if (!selectedMealType) {
      Alert.alert('Select a meal type', 'Choose what meal this is, or tap Continue after selecting.');
      return;
    }

    if (selectedMethod === 'text') {
      setStep('text');
      return;
    }

    if (selectedMethod === 'past') {
      const past = meals.find((meal) => meal.status === 'approved');
      if (!past) {
        Alert.alert('No past meals', 'Log a meal first.');
        return;
      }
      setSelectedMealType(past.mealType);
      setImageUri(past.imageUrl ?? null);
      setTextInput(past.textInput ?? past.mealName ?? '');
      setStep('text');
      return;
    }

    const captured = await pickImage(selectedMethod === 'camera' ? 'camera' : 'gallery');
    if (!captured) return;
    resetPlateDetection();
    setImageUri(captured.uri);
    setCaptureMetadata(captured.metadata);
    setStep('scan');
  }, [analyzing, meals, pickImage, resetPlateDetection, saving, selectedMealType, selectedMethod]);

  const handleRetakePhoto = useCallback(async () => {
    if (analyzing || saving) return;

    const source = selectedMethod === 'gallery' ? 'gallery' : 'camera';
    const captured = await pickImage(source);
    if (!captured) return;

    resetPlateDetection();
    setAnalysis(null);
    setImageUri(captured.uri);
    setCaptureMetadata(captured.metadata);
    setStep('scan');
  }, [analyzing, pickImage, resetPlateDetection, saving, selectedMethod]);

  const handleSave = useCallback(async () => {
    if (!analysis || saving || !selectedMealType) return;
    setSaving(true);
    try {
      const meal = await saveMealToDiary({
        mealType: selectedMealType,
        imageUrl: imageUri ?? undefined,
        textInput: textInput || undefined,
        plateDiameterCm: analysis.plateDiameterCm ?? plateDiameterCm,
        analysis,
      });
      resetFlow();
      push(`/meal/${meal.id}`);
    } catch {
      Alert.alert('Could not save', 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [analysis, imageUri, plateDiameterCm, push, resetFlow, saveMealToDiary, selectedMealType, textInput]);

  const handleBack = useCallback(() => {
    if (step === 'text' || step === 'scan') setStep('method');
    else if (step === 'results') setStep(imageUri ? 'scan' : 'text');
  }, [imageUri, step]);

  const showBack = step !== 'method' && step !== 'analyzing';
  const useScroll = step === 'method' || step === 'results' || step === 'analyzing' || step === 'scan';

  const content = useMemo(() => {
    if (step === 'method') {
      return (
        <LogMethodStep
          selectedMethod={selectedMethod}
          selectedMealType={selectedMealType}
          loading={analyzing || saving}
          onSelectMethod={setSelectedMethod}
          onSelectMealType={setSelectedMealType}
          onContinue={handleContinue}
        />
      );
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
          saving={saving}
          onSave={handleSave}
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
    handleContinue,
    handleRetakePhoto,
    handleSave,
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
        bottomPadding={bottomPadding}>
        {content}
      </LogScreenShell>
    </>
  );
}
