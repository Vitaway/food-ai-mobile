import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { HealthGoalPicker } from '@/components/onboarding/HealthGoalPicker';
import { MealsPerDayPicker } from '@/components/onboarding/MealsPerDayPicker';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { EditHealthActionBar } from '@/components/profile/EditHealthActionBar';
import { OnboardingPlanSummary } from '@/components/onboarding/OnboardingPlanSummary';
import { MetricStepper } from '@/components/onboarding/MetricStepper';
import { DateOfBirthInput } from '@/components/onboarding/DateOfBirthInput';
import { SexSelector } from '@/components/onboarding/SexSelector';
import {
  onboardingOptionCard,
  onboardingOptionChip,
  onboardingOptionChipText,
  onboardingOptionSubtitle,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import { Text } from '@/components/ui/Text';
import {
  ACTIVITY_LEVELS,
  COMMON_ALLERGIES,
  DIETARY_PREFERENCES,
  GOAL_PACE_OPTIONS,
} from '@/constants/profileOptions';
import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/context/ToastContext';
import type { ActivityLevel, GoalPace, HealthGoal, UserSex } from '@/types';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';
import { ageFromDateOfBirth, isValidDateOfBirth } from '@/utils/dateOfBirth';

const STEPS = ['about', 'body', 'goals', 'activity', 'habits', 'diet', 'review'] as const;
type EditStep = (typeof STEPS)[number];

const STEP_META: Record<EditStep, { title: string; description: string }> = {
  about: {
    title: 'About you',
    description: 'Add your date of birth and sex. Age is calculated automatically for calorie and macro targets.',
  },
  body: {
    title: 'Body metrics',
    description: 'Height and weight are used to calculate your daily energy needs.',
  },
  goals: {
    title: 'Your goals',
    description: 'Pick what you want to achieve and how fast you want to get there.',
  },
  activity: {
    title: 'Activity level',
    description: 'How active you are adjusts your daily calorie target.',
  },
  habits: {
    title: 'Eating rhythm',
    description: 'How many meals you usually eat per day.',
  },
  diet: {
    title: 'Diet & allergies',
    description: 'Optional — we use these to tailor meal suggestions.',
  },
  review: {
    title: 'Your targets',
    description: 'Preview how your plan looks with these settings. Save when you are ready.',
  },
};

export default function EditHealthProfileScreen() {
  const router = useRouter();
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const toast = useToast();
  const { profile, updateHealthProfile } = useProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [dateOfBirth, setDateOfBirth] = useState('');
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

  const step = STEPS[stepIndex];
  const isLastStep = step === 'review';

  useEffect(() => {
    if (!stepParam) return;
    const index = STEPS.indexOf(stepParam as EditStep);
    if (index >= 0) setStepIndex(index);
  }, [stepParam]);

  useEffect(() => {
    if (!profile) return;
    setDateOfBirth(profile.dateOfBirth ?? '');
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

  const hasValidDateOfBirth = isValidDateOfBirth(dateOfBirth);
  const age = hasValidDateOfBirth ? ageFromDateOfBirth(dateOfBirth) : profile?.age ?? 28;

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
    if (step === 'about' && !hasValidDateOfBirth) {
      Alert.alert('Date of birth required', 'Enter a valid date of birth before continuing.');
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((value) => value + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((value) => value - 1);
      return;
    }
    router.back();
  };

  const handleSave = async (options?: { andClose?: boolean }): Promise<boolean> => {
    if (saving) return false;
    if (!hasValidDateOfBirth) {
      Alert.alert('Date of birth required', 'Enter a valid date of birth before saving.');
      return false;
    }
    setSaving(true);
    try {
      await updateHealthProfile({
        dateOfBirth,
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
      toast.success('Health profile updated', 'Saved');
      if (options?.andClose !== false) {
        router.back();
      }
      return true;
    } catch (error) {
      Alert.alert('Could not save', getApiErrorMessage(error, 'Please try again.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-neutral-500">Loading your profile…</Text>
      </View>
    );
  }

  const renderStepContent = () => {
    if (step === 'about') {
      return (
        <View className="gap-4">
          <DateOfBirthInput value={dateOfBirth} onChange={setDateOfBirth} />
          <SexSelector value={sex} onChange={setSex} />
        </View>
      );
    }

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
        <View className="gap-4">
          <HealthGoalPicker value={goal} onChange={setGoal} />
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
          <View className="gap-2">
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
        <View className="gap-2">
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
      return <MealsPerDayPicker value={mealsPerDay} onChange={setMealsPerDay} sex={sex} />;
    }

    if (step === 'diet') {
      return (
        <View className="gap-6">
          <View>
            <Text className="mb-3 font-sans-medium text-sm text-neutral-600">Dietary preferences</Text>
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
          </View>
          <View>
            <Text className="mb-3 font-sans-medium text-sm text-neutral-600">Allergies</Text>
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
          </View>
        </View>
      );
    }

    return (
      <OnboardingPlanSummary
        macroTargets={preview.macroTargets}
        bmr={preview.bmr}
        tdee={preview.tdee}
        waterTargetMl={preview.waterTargetMl}
        goal={goal}
        activityLevel={activityLevel}
        targetWeightKg={targetWeightKg}
        weightKg={weightKg}
        goalPace={goalPace}
        mealsPerDay={mealsPerDay}
        sex={sex}
      />
    );
  };

  return (
    <OnboardingShell
      headerTitle={STEP_META[step].title}
      stepIndex={stepIndex}
      totalSteps={STEPS.length}
      showBack
      onBack={goBack}
      footerLayout="stacked"
      footer={
        <EditHealthActionBar
          isLastStep={isLastStep}
          saving={saving}
          onSave={() => handleSave({ andClose: true })}
          onNext={goNext}
          onClose={handleClose}
        />
      }>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}>
        <Text className="mb-5 text-base leading-6 text-neutral-600">
          {STEP_META[step].description} Save anytime — you only need to update what changed.
        </Text>
        {renderStepContent()}
      </ScrollView>
    </OnboardingShell>
  );
}
