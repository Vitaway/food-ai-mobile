import { useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, View } from 'react-native';

import { AppTextInput } from '@/components/ui/AppTextInput';

import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { AgeStepper, MetricStepper } from '@/components/onboarding/MetricStepper';
import { OnboardingIllustration } from '@/components/onboarding/OnboardingIllustration';
import { OnboardingNavButton, OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SexSelector } from '@/components/onboarding/SexSelector';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import {
  onboardingOptionCard,
  onboardingOptionChip,
  onboardingOptionChipText,
  onboardingOptionSubtitle,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import {
  ACTIVITY_LEVELS,
  COMMON_ALLERGIES,
  DIETARY_PREFERENCES,
  GOAL_PACE_OPTIONS,
  HEALTH_GOALS,
  MEALS_PER_DAY_OPTIONS,
} from '@/constants/profileOptions';
import { useProfile } from '@/context/ProfileContext';
import type { ActivityLevel, GoalPace, HealthGoal, UserSex } from '@/types';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';

const STEPS = [
  'intro',
  'profile',
  'sex',
  'body',
  'goals',
  'target',
  'activity',
  'habits',
  'preferences',
  'allergies',
  'summary',
] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const router = useRouter();
  const { saveProfile, profile } = useProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState(28);
  const [sex, setSex] = useState<UserSex>(null);
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(65);
  const [goal, setGoal] = useState<HealthGoal>('lose_weight');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [targetWeightKg, setTargetWeightKg] = useState(65);
  const [goalPace, setGoalPace] = useState<GoalPace>('moderate');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? '');
    setAge(profile.age);
    setSex(profile.sex);
    setHeightCm(profile.heightCm);
    setWeightKg(profile.weightKg);
    setTargetWeightKg(profile.targetWeightKg ?? profile.weightKg);
    setGoal(profile.goal);
    setGoalPace(profile.goalPace ?? 'moderate');
    setActivityLevel(profile.activityLevel);
    setMealsPerDay(profile.mealsPerDay ?? 3);
    setDietaryPreferences(profile.dietaryPreferences);
    setAllergies(profile.allergies ?? []);
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

  const toggleAllergy = (allergy: string) => {
    setAllergies((current) =>
      current.includes(allergy) ? current.filter((item) => item !== allergy) : [...current, allergy],
    );
  };

  const goNext = () => {
    Keyboard.dismiss();
    if (stepIndex < STEPS.length - 1) setStepIndex((value) => value + 1);
  };

  const goBack = () => {
    if (stepIndex <= 0) return;
    Keyboard.dismiss();
    setStepIndex((value) => value - 1);
  };

  const handleSkipSex = () => {
    Keyboard.dismiss();
    setSex(null);
    goNext();
  };

  const handleFinish = async () => {
    Keyboard.dismiss();
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile({
        displayName: displayName.trim() || undefined,
        age,
        sex,
        heightCm,
        weightKg,
        goal,
        targetWeightKg,
        goalPace,
        activityLevel,
        mealsPerDay,
        dietaryPreferences,
        allergies,
      });
      router.replace('/(tabs)' as Href);
    } finally {
      setSaving(false);
    }
  };

  const stepMeta: Record<Step, { title: string; description: string }> = {
    intro: {
      title: 'Eat smarter, Live better',
      description: 'Snap a meal, get instant insights, and track your health goals, all powered by AI.',
    },
    profile: {
      title: 'Tell us about you',
      description: 'A few basics help us personalize your calorie and macro targets.',
    },
    sex: {
      title: 'How do you identify?',
      description: '(Optional) Used only to refine your metabolic estimates. You can skip this step.',
    },
    body: {
      title: 'Your body metrics',
      description: 'Height and weight help us calculate your BMR and daily energy needs.',
    },
    goals: {
      title: 'What is your goal?',
      description: 'Choose the outcome that best matches what you want to achieve.',
    },
    target: {
      title: 'Target weight & pace',
      description: 'Optional targets help us tune recommendations (calories still use your current weight).',
    },
    activity: {
      title: 'How active are you?',
      description: 'Your activity level adjusts your daily calorie target.',
    },
    habits: {
      title: 'Eating rhythm',
      description: 'How many meals do you usually eat per day?',
    },
    preferences: {
      title: 'Dietary preferences',
      description: '(Optional) Select any that apply to your lifestyle.',
    },
    allergies: {
      title: 'Allergies',
      description: '(Optional) We use these to filter meal suggestions.',
    },
    summary: {
      title: 'Your plan is ready',
      description: 'Based on your profile, here are your personalized daily targets.',
    },
  };

  const renderFormContent = () => {
    if (step === 'profile') {
      return (
        <View className="gap-4">
          <OnboardingCard className="border-blue-spruce-100">
            <Text className="mb-2 font-sans-medium text-sm text-blue-spruce-700">What should we call you?</Text>
            <AppTextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              className="rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4"
            />
          </OnboardingCard>
          <AgeStepper value={age} onChange={setAge} />
        </View>
      );
    }

    if (step === 'sex') return <SexSelector value={sex} onChange={setSex} />;

    if (step === 'body') {
      return (
        <View className="gap-4">
          <MetricStepper
            label="Height"
            value={heightCm}
            unit="cm"
            step={1}
            min={120}
            max={230}
            decimals={0}
            maxLength={3}
            onChange={setHeightCm}
          />
          <MetricStepper
            label="Weight"
            value={weightKg}
            unit="kg"
            step={0.5}
            min={35}
            max={250}
            decimals={1}
            maxLength={5}
            onChange={setWeightKg}
          />
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
                className={onboardingOptionCard(selected, 'green')}>
                <Text className={`font-sans-semibold text-base ${onboardingOptionTitle(selected, 'green')}`}>
                  {item.label}
                </Text>
                <Text className={`mt-1 text-sm ${onboardingOptionSubtitle(selected, 'green')}`}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (step === 'target') {
      return (
        <View className="gap-4">
          <MetricStepper
            label="Target weight"
            value={targetWeightKg}
            unit="kg"
            step={0.5}
            min={35}
            max={250}
            decimals={1}
            maxLength={5}
            onChange={setTargetWeightKg}
          />
          <View className="gap-3">
            <Text className="font-sans-medium text-sm text-neutral-600">Goal pace</Text>
            {GOAL_PACE_OPTIONS.map((item) => {
              const selected = goalPace === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setGoalPace(item.id)}
                  className={onboardingOptionCard(selected, 'green')}>
                  <Text className={`font-sans-semibold text-base ${onboardingOptionTitle(selected, 'green')}`}>
                    {item.label}
                  </Text>
                  <Text className={`mt-1 text-sm ${onboardingOptionSubtitle(selected, 'green')}`}>
                    {item.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
                className={onboardingOptionCard(selected, 'green')}>
                <Text className={`font-sans-semibold text-base ${onboardingOptionTitle(selected, 'green')}`}>
                  {item.label}
                </Text>
                <Text className={`mt-1 text-sm ${onboardingOptionSubtitle(selected, 'green')}`}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (step === 'habits') {
      return (
        <View className="flex-row flex-wrap gap-2">
          {MEALS_PER_DAY_OPTIONS.map((count) => {
            const selected = mealsPerDay === count;
            return (
              <Pressable
                key={count}
                onPress={() => setMealsPerDay(count)}
                className={`min-w-[72px] ${onboardingOptionChip(selected, 'orange')} px-5 py-3`}>
                <Text className={`text-center font-sans-semibold ${onboardingOptionTitle(selected, 'orange')}`}>
                  {count}
                </Text>
                <Text className={`text-center text-xs ${onboardingOptionSubtitle(selected, 'orange')}`}>meals</Text>
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
                  selected ? 'border-shamrock-500 bg-shamrock-50' : 'border-ash-grey-200 bg-ash-grey-50'
                }`}>
                <Text className={`text-sm font-sans-medium ${selected ? 'text-shamrock-800' : 'text-neutral-700'}`}>
                  {pref}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (step === 'allergies') {
      return (
        <View className="flex-row flex-wrap gap-2">
          {COMMON_ALLERGIES.map((allergy) => {
            const selected = allergies.includes(allergy);
            return (
              <Pressable
                key={allergy}
                onPress={() => toggleAllergy(allergy)}
                className={onboardingOptionChip(selected, 'orange')}>
                <Text className={`text-sm font-sans-medium ${onboardingOptionChipText(selected, 'orange')}`}>
                  {allergy}
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
          <OnboardingCard className="border-shamrock-200 bg-shamrock-50">
            <Text className="font-sans-medium text-sm text-shamrock-700">Daily calories</Text>
            <Text className="mt-1 font-sans-bold text-4xl text-cinnamon-wood-500">
              {preview.macroTargets.calories} kcal
            </Text>
            <Text className="mt-3 text-sm text-shamrock-800">
              BMR {preview.bmr} · TDEE {preview.tdee} · Water {preview.waterTargetMl} ml
            </Text>
            {targetWeightKg !== weightKg ? (
              <Text className="mt-2 text-sm text-shamrock-700">
                Target {targetWeightKg} kg · {goalPace} pace · {mealsPerDay} meals/day
              </Text>
            ) : null}
          </OnboardingCard>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {[
              { label: 'Protein', value: `${preview.macroTargets.proteinG}g` },
              { label: 'Carbs', value: `${preview.macroTargets.carbsG}g` },
              { label: 'Fat', value: `${preview.macroTargets.fatG}g` },
              { label: 'Fiber', value: `${preview.macroTargets.fiberG}g` },
            ].map((macro, index) => (
              <View
                key={macro.label}
                className={`rounded-2xl px-4 py-3 ${index === 0 ? 'bg-shamrock-50' : index === 2 ? 'bg-cinnamon-wood-50' : 'bg-ash-grey-50'}`}>
                <Text className="text-xs text-neutral-500">{macro.label}</Text>
                <Text
                  className={`font-sans-semibold ${index === 0 ? 'text-shamrock-800' : index === 2 ? 'text-cinnamon-wood-800' : 'text-neutral-900'}`}>
                  {macro.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  const headerTitle = step === 'intro' ? APP_NAME : stepMeta[step].title;

  const renderHero = () => (
  <>
    <OnboardingIllustration variant={step} />
    <Text className="mt-3 text-center text-base leading-6 text-neutral-600">{stepMeta[step].description}</Text>
  </>
  );

  const renderStepContent = () => {
    if (step === 'intro') {
      return <View className="flex-1" />;
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
    <>
      <StatusBar style="light" />
      <OnboardingShell
        headerTitle={headerTitle}
        intro={step === 'intro'}
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
        showBack={stepIndex > 0}
        showSkip={step === 'sex' || step === 'preferences' || step === 'allergies'}
        onBack={goBack}
        onSkip={step === 'sex' ? handleSkipSex : goNext}
        footerLayout={isLastStep ? 'stacked' : 'inline'}
        hero={renderHero()}
        footer={
          isLastStep ? (
            <OnboardingNavButton label="Get started" variant="finish" onPress={handleFinish} loading={saving} />
          ) : (
            <OnboardingNavButton label={step === 'intro' ? 'Get started' : 'Next'} onPress={goNext} />
          )
        }>
        {renderStepContent()}
      </OnboardingShell>
    </>
  );
}
