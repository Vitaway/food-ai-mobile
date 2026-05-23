import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgeStepper } from '@/components/onboarding/AgeStepper';
import { OnboardingIllustration } from '@/components/onboarding/OnboardingIllustration';
import { OnboardingNavButton, OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SexSelector } from '@/components/onboarding/SexSelector';
import { Text } from '@/components/ui/Text';
import {
  ACTIVITY_LEVELS,
  DIETARY_PREFERENCES,
  HEALTH_GOALS,
} from '@/constants/profileOptions';
import { useProfile } from '@/context/ProfileContext';
import type { ActivityLevel, HealthGoal, UserSex } from '@/types';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';

const STEPS = ['intro', 'profile', 'sex', 'body', 'goals', 'activity', 'preferences', 'summary'] as const;
type Step = (typeof STEPS)[number];

function MetricStepper({
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-3xl bg-ash-grey-50 px-5 py-4">
      <View className="flex-1">
        <Text className="text-sm text-neutral-500">{label}</Text>
        <View className="mt-1 flex-row items-baseline gap-1">
          <Text className="font-sans-bold text-3xl text-neutral-900">{value}</Text>
          <Text className="font-sans-medium text-base text-neutral-500">{unit}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <Text className="font-sans-bold text-xl text-blue-spruce-700">−</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
          style={{
            shadowColor: '#1a1c17',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
          <Text className="font-sans-bold text-xl text-blue-spruce-700">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveProfile, profile } = useProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState(28);
  const [sex, setSex] = useState<UserSex>(null);
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(65);
  const [goal, setGoal] = useState<HealthGoal>('lose_weight');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? '');
    setAge(profile.age);
    setSex(profile.sex);
    setHeightCm(profile.heightCm);
    setWeightKg(profile.weightKg);
    setGoal(profile.goal);
    setActivityLevel(profile.activityLevel);
    setDietaryPreferences(profile.dietaryPreferences);
  }, [profile]);

  const step = STEPS[stepIndex];
  const isLastStep = step === 'summary';

  const preview = useMemo(() => {
    const { bmr, tdee, macroTargets } = calculateMacroTargets(
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal,
    );
    return { bmr, tdee, macroTargets, waterTargetMl: calculateWaterTargetMl(weightKg) };
  }, [activityLevel, age, goal, heightCm, sex, weightKg]);

  const togglePreference = (pref: string) => {
    setDietaryPreferences((current) =>
      current.includes(pref) ? current.filter((item) => item !== pref) : [...current, pref],
    );
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((value) => value + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((value) => value - 1);
  };

  const handleSkipSex = () => {
    setSex(null);
    goNext();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveProfile({
        displayName: displayName.trim() || undefined,
        age,
        sex,
        heightCm,
        weightKg,
        goal,
        activityLevel,
        dietaryPreferences,
      });
      router.replace('/(tabs)' as Href);
    } finally {
      setSaving(false);
    }
  };

  const stepMeta: Record<Step, { title: string; description: string }> = {
    intro: {
      title: 'Smart nutrition, simplified',
      description: 'Snap a meal, get instant insights, and track your health goals — all powered by AI.',
    },
    profile: {
      title: 'Tell us about you',
      description: 'A few basics help us personalize your calorie and macro targets.',
    },
    sex: {
      title: 'How do you identify?',
      description: 'Optional — used only to refine your metabolic estimates. You can skip this step.',
    },
    body: {
      title: 'Your body metrics',
      description: 'Height and weight help us calculate your BMR and daily energy needs.',
    },
    goals: {
      title: 'What is your goal?',
      description: 'Choose the outcome that best matches what you want to achieve.',
    },
    activity: {
      title: 'How active are you?',
      description: 'Your activity level adjusts your daily calorie target.',
    },
    preferences: {
      title: 'Dietary preferences',
      description: 'Optional — select any that apply to your lifestyle.',
    },
    summary: {
      title: 'Your plan is ready',
      description: 'Based on your profile, here are your personalized daily targets.',
    },
  };

  const renderFormContent = () => {
    if (step === 'profile') {
      return (
        <View className="gap-5">
          <View>
            <Text className="mb-2 font-sans-medium text-sm text-neutral-600">What should we call you?</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#848a75"
              className="rounded-3xl bg-ash-grey-50 px-5 py-4 text-base text-neutral-900"
            />
          </View>
          <AgeStepper value={age} onChange={setAge} />
        </View>
      );
    }

    if (step === 'sex') return <SexSelector value={sex} onChange={setSex} />;

    if (step === 'body') {
      return (
        <View className="gap-4">
          <MetricStepper label="Height" value={heightCm} unit="cm" step={1} min={120} max={230} onChange={setHeightCm} />
          <MetricStepper label="Weight" value={weightKg} unit="kg" step={0.5} min={35} max={250} onChange={setWeightKg} />
        </View>
      );
    }

    if (step === 'goals') {
      return (
        <View className="gap-3">
          {HEALTH_GOALS.map((item) => {
            const selected = goal === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setGoal(item.id)}
                className={`rounded-3xl border px-5 py-4 ${
                  selected ? 'border-blue-spruce-500 bg-blue-spruce-50' : 'border-ash-grey-200 bg-ash-grey-50'
                }`}>
                <Text className={`font-sans-semibold text-base ${selected ? 'text-blue-spruce-800' : 'text-neutral-900'}`}>
                  {item.label}
                </Text>
                <Text className={`mt-1 text-sm ${selected ? 'text-blue-spruce-600' : 'text-neutral-500'}`}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (step === 'activity') {
      return (
        <View className="gap-3">
          {ACTIVITY_LEVELS.map((item) => {
            const selected = activityLevel === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setActivityLevel(item.id)}
                className={`rounded-3xl border px-5 py-4 ${
                  selected ? 'border-blue-spruce-500 bg-blue-spruce-50' : 'border-ash-grey-200 bg-ash-grey-50'
                }`}>
                <Text className={`font-sans-semibold text-base ${selected ? 'text-blue-spruce-800' : 'text-neutral-900'}`}>
                  {item.label}
                </Text>
                <Text className={`mt-1 text-sm ${selected ? 'text-blue-spruce-600' : 'text-neutral-500'}`}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (step === 'preferences') {
      return (
        <View className="flex-row flex-wrap gap-2">
          {DIETARY_PREFERENCES.map((pref) => {
            const selected = dietaryPreferences.includes(pref);
            return (
              <Pressable
                key={pref}
                onPress={() => togglePreference(pref)}
                className={`rounded-full border px-4 py-2.5 ${
                  selected ? 'border-blue-spruce-500 bg-blue-spruce-50' : 'border-ash-grey-200 bg-ash-grey-50'
                }`}>
                <Text className={`text-sm font-sans-medium ${selected ? 'text-blue-spruce-800' : 'text-neutral-700'}`}>
                  {pref}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (step === 'summary') {
      return (
        <View>
          <View className="rounded-3xl bg-blue-spruce-50 p-5">
            <Text className="font-sans-medium text-sm text-blue-spruce-700">Daily calories</Text>
            <Text className="mt-1 font-sans-bold text-4xl text-blue-spruce-900">{preview.macroTargets.calories} kcal</Text>
            <Text className="mt-3 text-sm text-blue-spruce-700">
              BMR {preview.bmr} · TDEE {preview.tdee} · Water {preview.waterTargetMl} ml
            </Text>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {[
              { label: 'Protein', value: `${preview.macroTargets.proteinG}g` },
              { label: 'Carbs', value: `${preview.macroTargets.carbsG}g` },
              { label: 'Fat', value: `${preview.macroTargets.fatG}g` },
              { label: 'Fiber', value: `${preview.macroTargets.fiberG}g` },
            ].map((macro) => (
              <View key={macro.label} className="rounded-2xl bg-ash-grey-50 px-4 py-3">
                <Text className="text-xs text-neutral-500">{macro.label}</Text>
                <Text className="font-sans-semibold text-neutral-900">{macro.value}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  const renderHero = () => {
    if (step === 'intro') {
      return (
        <>
          <OnboardingIllustration variant="intro" />
          <Text className="text-center font-sans-bold text-2xl leading-8 text-neutral-900">{stepMeta.intro.title}</Text>
          <Text className="mt-3 text-center text-base leading-6 text-neutral-500">{stepMeta.intro.description}</Text>
        </>
      );
    }

    return (
      <>
        <OnboardingIllustration variant={step} />
        <Text className="text-center font-sans-bold text-2xl leading-8 text-neutral-900">{stepMeta[step].title}</Text>
        <Text className="mt-2 text-center text-base leading-6 text-neutral-500">{stepMeta[step].description}</Text>
      </>
    );
  };

  const renderStepContent = () => {
    if (step === 'intro') {
      return <View className="flex-1 justify-center">{renderHero()}</View>;
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}>
        {renderFormContent()}
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <OnboardingShell
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
        showHeader={step !== 'intro'}
        showBack={stepIndex > 0}
        showSkip={step === 'sex' || step === 'preferences'}
        onBack={goBack}
        onSkip={step === 'sex' ? handleSkipSex : goNext}
        footerLayout={isLastStep ? 'stacked' : 'inline'}
        hero={step !== 'intro' ? renderHero() : undefined}
        footer={
          isLastStep ? (
            <OnboardingNavButton label="Get started" variant="finish" onPress={handleFinish} loading={saving} />
          ) : (
            <OnboardingNavButton label="Next" onPress={goNext} />
          )
        }>
        {renderStepContent()}
      </OnboardingShell>
    </View>
  );
}
