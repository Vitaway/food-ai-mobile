import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, ScrollView, View } from 'react-native';
import { Plus } from 'iconoir-react-native';

import { OnboardingCard } from '@/components/onboarding/OnboardingCard';
import { HealthGoalPicker } from '@/components/onboarding/HealthGoalPicker';
import { MealsPerDayPicker } from '@/components/onboarding/MealsPerDayPicker';
import { OnboardingPlanSummary } from '@/components/onboarding/OnboardingPlanSummary';
import { OnboardingStepHero } from '@/components/onboarding/OnboardingStepHero';
import { MetricStepper } from '@/components/onboarding/MetricStepper';
import { DateOfBirthInput } from '@/components/onboarding/DateOfBirthInput';
import { OnboardingNavButton, OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OnboardingRequiredBanner } from '@/components/onboarding/OnboardingRequiredBanner';
import { SexSelector } from '@/components/onboarding/SexSelector';
import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { PhotoSourceMenu } from '@/components/ui/PhotoSourceMenu';
import { Text } from '@/components/ui/Text';
import { APP_NAME } from '@/constants/site';
import { getOnboardingStepHero } from '@/constants/onboardingStepImages';
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
} from '@/constants/profileOptions';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import type { ActivityLevel, GoalPace, HealthGoal, UserSex } from '@/types';
import {
  getInitialOnboardingStepIndex,
  getMinimumOnboardingStepIndex,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from '@/utils/onboardingResume';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';
import { ageFromDateOfBirth, isValidDateOfBirth } from '@/utils/dateOfBirth';
import { getApiErrorMessage } from '@/utils/apiErrors';

const STEPS = ONBOARDING_STEPS;

export default function OnboardingScreen() {
  const { session, isAuthenticated } = useAuth();
  const { saveProfile, profile } = useProfile();

  const minStepIndex = getMinimumOnboardingStepIndex(isAuthenticated);
  const [stepIndex, setStepIndex] = useState(() => getInitialOnboardingStepIndex({ isAuthenticated }));
  const [hasSetInitialStep, setHasSetInitialStep] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
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
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const hydratedFromProfileRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasSetInitialStep) return;
    setStepIndex(getInitialOnboardingStepIndex({ isAuthenticated }));
    setHasSetInitialStep(true);
  }, [isAuthenticated, hasSetInitialStep]);

  useEffect(() => {
    if (!profile || hydratedFromProfileRef.current) return;
    hydratedFromProfileRef.current = true;
    setDisplayName(profile.displayName ?? session?.user.displayName ?? '');
    setAvatarUrl(profile.avatarUrl);
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
  }, [profile, session?.user.displayName]);

  useEffect(() => {
    if (session?.user.displayName && !displayName) {
      setDisplayName(session.user.displayName);
    }
  }, [session?.user.displayName, displayName]);

  const pickProfilePhoto = async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const label = source === 'camera' ? 'camera' : 'photos';
      Alert.alert(
        'Permission needed',
        permission.canAskAgain ? `Allow ${label} access to add a profile picture.` : `Enable ${label} in Settings.`,
      );
      return;
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const step = STEPS[stepIndex];
  const isLastStep = step === 'summary';
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
    Keyboard.dismiss();
    if (stepIndex < STEPS.length - 1) setStepIndex((value) => value + 1);
  };

  const goBack = () => {
    if (stepIndex <= minStepIndex) return;
    Keyboard.dismiss();
    setStepIndex((value) => value - 1);
  };

  const handleFinish = async () => {
    Keyboard.dismiss();
    if (saving) return;
    if (!hasValidDateOfBirth) {
      Alert.alert('Date of birth required', 'Enter a valid birth date before finishing.');
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        displayName: displayName.trim() || session?.user.displayName,
        avatarUrl,
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
      // AuthGuard navigates to tabs / push prompt once onboarding is marked complete.
    } catch (err) {
      Alert.alert(
        'Could not save profile',
        getApiErrorMessage(err, 'Something went wrong saving your plan. Please try again.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const stepMeta: Record<OnboardingStep, { title: string; description: string }> = {
    intro: {
      title: APP_NAME,
      description: 'Snap a meal, get instant insights, and track your health goals, all powered by AI.',
    },
    photo: {
      title: 'Add a profile photo',
      description: 'Optional — helps your coach recognize you. You can add one later.',
    },
    profile: {
      title: 'Tell us about you',
      description: 'Your birth date keeps age-based nutrition calculations accurate over time.',
    },
    sex: {
      title: 'How do you identify?',
      description: 'Optional — used only to refine your metabolic estimates.',
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
      description: 'Optional targets help us tune recommendations.',
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
      description: 'Optional — select any that apply to your lifestyle.',
    },
    allergies: {
      title: 'Allergies',
      description: 'Optional — we use these to filter meal suggestions.',
    },
    summary: {
      title: 'Your plan is ready',
      description: 'Based on your profile, here are your personalized daily targets.',
    },
  };

  const renderFormContent = () => {
    if (step === 'photo') {
      const initial = (displayName || session?.user.displayName || '?').slice(0, 1).toUpperCase();
      return (
        <View className="items-center gap-5">
          <Pressable
            onPress={() => setPhotoMenuOpen(true)}
            className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-blue-spruce-200 bg-blue-spruce-50">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-4xl font-sans-bold text-blue-spruce-700">{initial}</Text>
            )}
          </Pressable>
          <Button
            label="Add photo"
            leadingIcon={Plus}
            onPress={() => setPhotoMenuOpen(true)}
            variant="secondary"
          />
          {avatarUrl ? (
            <Button label="Remove photo" variant="outline" onPress={() => setAvatarUrl(undefined)} />
          ) : null}
          <PhotoSourceMenu
            visible={photoMenuOpen}
            onClose={() => setPhotoMenuOpen(false)}
            onSelectCamera={() => pickProfilePhoto('camera')}
            onSelectGallery={() => pickProfilePhoto('gallery')}
          />
          {displayName ? (
            <Text className="text-center text-base text-neutral-600">
              Setting up for <Text className="font-sans-semibold text-neutral-900">{displayName}</Text>
            </Text>
          ) : null}
        </View>
      );
    }

    if (step === 'profile') {
      return (
        <View className="gap-4">
          {displayName ? (
            <OnboardingCard className="border-blue-spruce-100 bg-blue-spruce-50">
              <Text className="text-sm text-blue-spruce-700">Signed in as</Text>
              <Text className="mt-1 font-sans-semibold text-lg text-blue-spruce-900">{displayName}</Text>
            </OnboardingCard>
          ) : null}
          <DateOfBirthInput value={dateOfBirth} onChange={setDateOfBirth} />
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
      return <HealthGoalPicker value={goal} onChange={setGoal} />;
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
      return <MealsPerDayPicker value={mealsPerDay} onChange={setMealsPerDay} sex={sex} />;
    }

    if (step === 'preferences') {
      return (
        <View>
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
          <OnboardingStepHero source={getOnboardingStepHero('preferences', sex)} placement="below" />
        </View>
      );
    }

    if (step === 'allergies') {
      return (
        <View>
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
          <OnboardingStepHero source={getOnboardingStepHero('allergies', sex)} placement="below" />
        </View>
      );
    }

    if (step === 'summary') {
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
    }

    return null;
  };

  const renderStepLead = () => (
    <Text className="mb-5 text-base leading-6 text-neutral-600">{stepMeta[step].description}</Text>
  );

  const renderStepContent = () => {
    if (step === 'intro') {
      return (
        <View className="flex-1 items-center justify-center px-4 pb-8">
          <AppLogo size={120} />
          <Text className="mt-5 font-display text-3xl normal-case text-neutral-900">{APP_NAME}</Text>
          <Text className="mt-4 text-center text-base leading-6 text-neutral-600">
            {stepMeta.intro.description}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}>
        {renderStepLead()}
        {renderFormContent()}
      </ScrollView>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <OnboardingShell
        headerTitle={step === 'intro' ? undefined : stepMeta[step].title}
        intro={step === 'intro'}
        stepIndex={stepIndex}
        totalSteps={STEPS.length}
        showBack={stepIndex > minStepIndex}
        onBack={goBack}
        footerLayout={isLastStep ? 'stacked' : 'inline'}
        banner={isAuthenticated ? <OnboardingRequiredBanner /> : undefined}
        footer={
          isLastStep ? (
            <OnboardingNavButton label="Get started" variant="finish" onPress={handleFinish} loading={saving} />
          ) : (
            <OnboardingNavButton
              label={step === 'intro' ? 'Get started' : 'Next'}
              onPress={goNext}
              disabled={step === 'profile' && !hasValidDateOfBirth}
            />
          )
        }>
        {renderStepContent()}
      </OnboardingShell>
    </>
  );
}
