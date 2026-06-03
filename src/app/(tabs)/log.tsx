import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
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
import type { MealAnalysisPreview } from '@/types';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { consumeLogMealTypeIntent } from '@/utils/logIntent';

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
    setAnalysis(null);
    setAnalyzing(false);
    setSaving(false);
  }, [resolveInitialMealType]);

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

  const runAnalysis = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setStep('analyzing');
    try {
      const result = await analyzeMeal({ imageUri: imageUri ?? undefined, text: textInput || undefined });
      setAnalysis(result);
      setStep('results');
    } catch {
      Alert.alert('Analysis failed', 'Try again.');
      setStep(imageUri ? 'scan' : 'text');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, analyzeMeal, imageUri, textInput]);

  const handlePermissionDenied = useCallback((source: 'camera' | 'gallery', canAskAgain: boolean) => {
    const label = source === 'camera' ? 'camera' : 'photos';
    Alert.alert('Permission needed', canAskAgain ? `Allow ${label} access.` : `Enable ${label} in Settings.`);
  }, []);

  const pickImage = useCallback(
    async (source: 'camera' | 'gallery') => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        handlePermissionDenied(source, permission.canAskAgain);
        return null;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });

      if (result.canceled || !result.assets[0]?.uri) return null;
      return result.assets[0].uri;
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

    const uri = await pickImage(selectedMethod === 'camera' ? 'camera' : 'gallery');
    if (!uri) return;
    setImageUri(uri);
    setStep('scan');
  }, [analyzing, meals, pickImage, saving, selectedMealType, selectedMethod]);

  const handleSave = useCallback(async () => {
    if (!analysis || saving || !selectedMealType) return;
    setSaving(true);
    try {
      const meal = await saveMealToDiary({
        mealType: selectedMealType,
        imageUrl: imageUri ?? undefined,
        textInput: textInput || undefined,
        analysis,
      });
      resetFlow();
      push(`/meal/${meal.id}`);
    } catch {
      Alert.alert('Could not save', 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [analysis, imageUri, push, resetFlow, saveMealToDiary, selectedMealType, textInput]);

  const handleBack = useCallback(() => {
    if (step === 'text' || step === 'scan') setStep('method');
    else if (step === 'results') setStep(imageUri ? 'scan' : 'text');
  }, [imageUri, step]);

  const showBack = step !== 'method' && step !== 'analyzing';
  const useScroll = step === 'method' || step === 'results' || step === 'analyzing';

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
          loading={analyzing}
          bottomPadding={bottomPadding}
          onCapture={runAnalysis}
        />
      );
    }
    if (step === 'analyzing') {
      return <LogAnalyzingStep />;
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
    handleContinue,
    handleSave,
    imageUri,
    runAnalysis,
    saving,
    selectedMealType,
    selectedMethod,
    bottomPadding,
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
