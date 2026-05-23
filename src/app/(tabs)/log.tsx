import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogAnalyzingStep } from '@/components/log/LogAnalyzingStep';
import { LogMethodStep } from '@/components/log/LogMethodStep';
import { LogResultsStep } from '@/components/log/LogResultsStep';
import { LogScanStep } from '@/components/log/LogScanStep';
import { LogTextStep } from '@/components/log/LogTextStep';
import { FLOATING_TAB_BAR_CLEARANCE } from '@/components/navigation/FloatingTabBar';
import { MEAL_TYPES, type MealTypeId } from '@/constants/mealTypes';
import type { LogStep } from '@/constants/logMock';
import { useMeals } from '@/context/MealsContext';
import { palette } from '@/design-system/colors';
import type { MealAnalysisPreview } from '@/types';

const LOG_GRADIENT = [
  palette['blue-spruce'][700],
  palette['blue-spruce'][500],
  palette['muted-teal'][400],
] as const;

export default function LogMealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { analyzeMeal, saveMealToDiary, meals } = useMeals();

  const [step, setStep] = useState<LogStep | 'text'>('method');
  const [selectedMethod, setSelectedMethod] = useState('camera');
  const [selectedMealType, setSelectedMealType] = useState<MealTypeId>(MEAL_TYPES[2].id);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysisPreview | null>(null);
  const [saving, setSaving] = useState(false);

  const bottomPadding = FLOATING_TAB_BAR_CLEARANCE + insets.bottom;
  const statusBarStyle = step === 'method' ? 'light' : 'dark';

  const resetFlow = useCallback(() => {
    setStep('method');
    setImageUri(null);
    setTextInput('');
    setAnalysis(null);
    setSaving(false);
  }, []);

  const runAnalysis = useCallback(async () => {
    setStep('analyzing');
    try {
      const result = await analyzeMeal({ imageUri: imageUri ?? undefined, text: textInput || undefined });
      setAnalysis(result);
      setStep('results');
    } catch {
      Alert.alert('Analysis failed', 'Please try again.');
      setStep(imageUri ? 'scan' : 'text');
    }
  }, [analyzeMeal, imageUri, textInput]);

  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `Allow ${source} access to log meals with photos.`);
      return null;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });

    if (result.canceled || !result.assets[0]?.uri) return null;
    return result.assets[0].uri;
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedMethod === 'text') {
      setStep('text');
      return;
    }

    if (selectedMethod === 'past') {
      const past = meals.find((meal) => meal.status === 'approved');
      if (!past) {
        Alert.alert('No past meals', 'Log your first meal to reuse it later.');
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
  }, [meals, pickImage, selectedMethod]);

  const handleSave = useCallback(async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const meal = await saveMealToDiary({
        mealType: selectedMealType,
        imageUrl: imageUri ?? undefined,
        textInput: textInput || undefined,
        analysis,
      });
      resetFlow();
      router.push(`/meal/${meal.id}`);
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [analysis, imageUri, resetFlow, router, saveMealToDiary, selectedMealType, textInput]);

  const renderStep = () => {
    if (step === 'text') {
      return (
        <View className="flex-1 bg-ash-grey-50" style={{ paddingTop: insets.top }}>
          <LogTextStep
            value={textInput}
            onChangeText={setTextInput}
            onBack={() => setStep('method')}
            onContinue={runAnalysis}
          />
        </View>
      );
    }

    if (step === 'scan' && imageUri) {
      return (
        <View className="flex-1 bg-ash-grey-50" style={{ paddingTop: insets.top }}>
          <LogScanStep
            bottomPadding={bottomPadding}
            imageUri={imageUri}
            preview={analysis}
            onBack={() => setStep('method')}
            onCapture={runAnalysis}
          />
        </View>
      );
    }

    if (step === 'analyzing') {
      return (
        <View className="flex-1 bg-ash-grey-50" style={{ paddingTop: insets.top }}>
          <LogAnalyzingStep bottomPadding={bottomPadding} />
        </View>
      );
    }

    if (step === 'results' && analysis) {
      return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
          <LogResultsStep
            bottomPadding={bottomPadding}
            analysis={analysis}
            imageUri={imageUri ?? undefined}
            saving={saving}
            onBack={() => setStep(imageUri ? 'scan' : 'text')}
            onSave={handleSave}
          />
        </View>
      );
    }

    return (
      <View className="flex-1" style={{ backgroundColor: palette['muted-teal'][400] }}>
        <LinearGradient colors={[...LOG_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: insets.top + 24,
              paddingBottom: bottomPadding + 16,
              paddingHorizontal: 24,
              flexGrow: 1,
            }}>
            <LogMethodStep
              selectedMethod={selectedMethod}
              selectedMealType={selectedMealType}
              onSelectMethod={setSelectedMethod}
              onSelectMealType={setSelectedMealType}
              onContinue={handleContinue}
            />
          </ScrollView>
        </LinearGradient>
      </View>
    );
  };

  return (
    <>
      {isFocused ? <StatusBar style={statusBarStyle} /> : null}
      {renderStep()}
    </>
  );
}
