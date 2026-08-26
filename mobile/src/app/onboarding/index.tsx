import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Plus } from 'iconoir-react-native';
import { Ionicons } from '@expo/vector-icons';

import { HealthGoalPicker } from '@/components/onboarding/HealthGoalPicker';
import { MealsPerDayPicker } from '@/components/onboarding/MealsPerDayPicker';
import { DietaryPreferencePicker } from '@/components/onboarding/DietaryPreferencePicker';
import { AllergyPicker } from '@/components/onboarding/AllergyPicker';
import { OnboardingPlanSummary } from '@/components/onboarding/OnboardingPlanSummary';
import { MetricStepper } from '@/components/onboarding/MetricStepper';
import { DateOfBirthInput } from '@/components/onboarding/DateOfBirthInput';
import { OnboardingNavButton, OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SexSelector } from '@/components/onboarding/SexSelector';
import { Button } from '@/components/ui/Button';
import { FieldInput } from '@/components/ui/FieldInput';
import { PhotoSourceMenu } from '@/components/ui/PhotoSourceMenu';
import { Text } from '@/components/ui/Text';
import { getOnboardingStepHero } from '@/constants/onboardingStepImages';
import {
  onboardingOptionCard,
  onboardingOptionSubtitle,
  onboardingOptionTitle,
} from '@/constants/onboardingStyles';
import {
  ACTIVITY_LEVELS,
  defaultAllergiesFromPreferences,
  defaultDietaryPreferencesForGoal,
  GOAL_PACE_OPTIONS,
} from '@/constants/profileOptions';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { useI18n } from '@/context/LocaleContext';
import type { ActivityLevel, GoalPace, HealthGoal, UserSex } from '@/types';
import {
  getMinimumOnboardingStepIndex,
  getResumeOnboardingStepIndex,
  onboardingStepPercent,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from '@/utils/onboardingResume';
import {
  loadReachedOnboardingStep,
  saveReachedOnboardingStep,
  clearReachedOnboardingStep,
} from '@/utils/onboardingProgressStorage';
import {
  guessHeightCm,
  guessTargetWeightKg,
  guessWeightKg,
} from '@/utils/onboardingDefaults';
import { calculateMacroTargets, calculateWaterTargetMl } from '@/utils/nutrition';
import { ageFromDateOfBirth, isValidDateOfBirth } from '@/utils/dateOfBirth';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { applyReferralCode } from '@/services/remote/consumerApi';

const STEPS = ONBOARDING_STEPS;

export default function OnboardingScreen() {
  const { session, isAuthenticated } = useAuth();
  const { saveProfile, saveOnboardingDraft, profile, isBootstrapReady } = useProfile();
  const { alert } = useConfirmDialog();
  const { t } = useI18n();

  const minStepIndex = getMinimumOnboardingStepIndex(isAuthenticated);
  const progressUserId = session?.user.id ?? session?.user.patientId ?? null;
  const [stepIndex, setStepIndex] = useState(0);
  /** Furthest step opened — drives % and never decreases on Back. */
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);
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
  const [referralCode, setReferralCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const hydratedFromProfileRef = useRef(false);
  const metricsTouchedRef = useRef({ height: false, weight: false, target: false });
  const prefsSeededRef = useRef(false);
  const allergiesSeededRef = useRef(false);
  const draftSavingRef = useRef(false);

  const bumpReached = (index: number) => {
    setMaxReachedStepIndex((prev) => {
      const next = Math.max(prev, Math.max(0, Math.min(index, STEPS.length - 1)));
      if (next !== prev) {
        void saveReachedOnboardingStep(progressUserId, next);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isBootstrapReady || hydratedFromProfileRef.current) return;

    let cancelled = false;

    async function hydrate() {
      const stored = await loadReachedOnboardingStep(progressUserId);

      if (!profile) {
        hydratedFromProfileRef.current = true;
        if (!cancelled) {
          // Fresh install / no profile: start at 0% unless we already saved a watermark.
          setStepIndex(stored ?? 0);
          setMaxReachedStepIndex(stored ?? 0);
        }
        return;
      }

      hydratedFromProfileRef.current = true;
      setDisplayName(profile.displayName ?? session?.user.displayName ?? '');
      setAvatarUrl(profile.avatarUrl);
      setDateOfBirth(profile.dateOfBirth ?? '');
      setSex(profile.sex);

      const heightOk = typeof profile.heightCm === 'number' && profile.heightCm >= 120;
      const weightOk = typeof profile.weightKg === 'number' && profile.weightKg >= 35;
      const targetOk =
        typeof profile.targetWeightKg === 'number' && profile.targetWeightKg >= 35;

      if (heightOk) setHeightCm(profile.heightCm);
      if (weightOk) setWeightKg(profile.weightKg);
      if (targetOk) setTargetWeightKg(profile.targetWeightKg!);
      else if (weightOk) setTargetWeightKg(profile.weightKg);

      if (profile.goal) setGoal(profile.goal);
      if (profile.goalPace) setGoalPace(profile.goalPace);
      if (profile.activityLevel) setActivityLevel(profile.activityLevel);
      if (typeof profile.mealsPerDay === 'number' && profile.mealsPerDay >= 1) {
        setMealsPerDay(profile.mealsPerDay);
      }
      if (profile.dietaryPreferences?.length) {
        setDietaryPreferences(profile.dietaryPreferences);
        prefsSeededRef.current = true;
      }
      if (profile.allergies?.length) {
        setAllergies(profile.allergies);
        allergiesSeededRef.current = true;
      } else {
        setAllergies([]);
      }
      metricsTouchedRef.current = {
        height: heightOk,
        weight: weightOk,
        target: targetOk,
      };

      const inferred = getResumeOnboardingStepIndex(profile);
      // Resume on the furthest meaningful step; % comes from the local watermark.
      const resumeAt = stored != null ? Math.max(inferred, stored) : inferred;
      const watermark = Math.max(stored ?? 0, resumeAt);
      if (!cancelled) {
        setStepIndex(resumeAt);
        setMaxReachedStepIndex(watermark);
        void saveReachedOnboardingStep(progressUserId, watermark);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [isBootstrapReady, profile, session?.user.displayName, progressUserId]);

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
      await alert({
        title: 'Permission needed',
        message: permission.canAskAgain
          ? `Allow ${label} access to add a profile picture.`
          : `Enable ${label} in Settings.`,
      });
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

  // Autocomplete body/target only when the user reaches those steps.
  useEffect(() => {
    if (!hasValidDateOfBirth) return;
    if (step === 'body') {
      if (!metricsTouchedRef.current.height) {
        setHeightCm(guessHeightCm(age, sex));
      }
      if (!metricsTouchedRef.current.weight) {
        const h = metricsTouchedRef.current.height ? heightCm : guessHeightCm(age, sex);
        setWeightKg(guessWeightKg(age, sex, h));
      }
    }
    if (step === 'target' && !metricsTouchedRef.current.target) {
      const w = weightKg >= 35 ? weightKg : guessWeightKg(age, sex, heightCm);
      setTargetWeightKg(guessTargetWeightKg({ weightKg: w, goal, age, sex }));
    }
  }, [step, hasValidDateOfBirth, age, sex, heightCm, weightKg, goal]);

  useEffect(() => {
    if (step !== 'preferences') return;
    if (prefsSeededRef.current) return;
    prefsSeededRef.current = true;
    setDietaryPreferences(defaultDietaryPreferencesForGoal(goal));
  }, [step, goal]);

  // Auto-select allergies from saved profile or from dietary prefs when landing here.
  useEffect(() => {
    if (step !== 'allergies') return;
    if (allergiesSeededRef.current) return;
    allergiesSeededRef.current = true;
    if (allergies.length > 0) return;
    const suggested = defaultAllergiesFromPreferences(dietaryPreferences);
    if (suggested.length) setAllergies(suggested);
  }, [step, dietaryPreferences, allergies.length]);

  const fillPercent = onboardingStepPercent(maxReachedStepIndex, STEPS.length);

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

  const togglePreference = (next: string[]) => {
    prefsSeededRef.current = true;
    setDietaryPreferences(next);
  };

  const setAllergiesSelection = (next: string[]) => {
    allergiesSeededRef.current = true;
    setAllergies(next);
  };

  const persistDraftAfterStep = async (completedStep: OnboardingStep) => {
    if (draftSavingRef.current) return;
    draftSavingRef.current = true;
    try {
      const draft: Parameters<typeof saveOnboardingDraft>[0] = {};
      if (completedStep === 'photo' || STEPS.indexOf(completedStep) > STEPS.indexOf('photo')) {
        draft.displayName = displayName.trim();
        if (avatarUrl) draft.avatarUrl = avatarUrl;
      }
      if (completedStep === 'profile' || STEPS.indexOf(completedStep) > STEPS.indexOf('profile')) {
        if (hasValidDateOfBirth) {
          draft.dateOfBirth = dateOfBirth;
          draft.age = age;
        }
      }
      if (completedStep === 'sex' || STEPS.indexOf(completedStep) > STEPS.indexOf('sex')) {
        if (sex != null) draft.sex = sex;
      }
      if (completedStep === 'body' || STEPS.indexOf(completedStep) > STEPS.indexOf('body')) {
        draft.heightCm = heightCm;
        draft.weightKg = weightKg;
      }
      if (completedStep === 'goals' || STEPS.indexOf(completedStep) > STEPS.indexOf('goals')) {
        draft.goal = goal;
      }
      if (completedStep === 'target' || STEPS.indexOf(completedStep) > STEPS.indexOf('target')) {
        draft.targetWeightKg = targetWeightKg;
        draft.goalPace = goalPace;
      }
      if (completedStep === 'activity' || STEPS.indexOf(completedStep) > STEPS.indexOf('activity')) {
        draft.activityLevel = activityLevel;
      }
      if (completedStep === 'habits' || STEPS.indexOf(completedStep) > STEPS.indexOf('habits')) {
        draft.mealsPerDay = mealsPerDay;
      }
      if (
        completedStep === 'preferences' ||
        STEPS.indexOf(completedStep) > STEPS.indexOf('preferences')
      ) {
        draft.dietaryPreferences = dietaryPreferences;
      }
      if (completedStep === 'allergies' || STEPS.indexOf(completedStep) > STEPS.indexOf('allergies')) {
        draft.allergies = allergies;
      }
      if (Object.keys(draft).length === 0) return;
      await saveOnboardingDraft(draft);
    } catch {
      // Non-blocking — finish will retry a full save.
    } finally {
      draftSavingRef.current = false;
    }
  };

  const goNext = () => {
    Keyboard.dismiss();
    if (step === 'photo' && displayName.trim().length < 2) {
      void alert({ title: 'Your name', message: 'Enter your name to continue.' });
      return;
    }
    if (step === 'profile' && !hasValidDateOfBirth) {
      void alert({
        title: 'Date of birth',
        message: 'Enter a valid birth date to continue.',
      });
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      const completed = step;
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      // Mark progress for the step we just reached — never shrinks on Back.
      bumpReached(nextIndex);
      if (completed !== 'intro' && completed !== 'summary') {
        void persistDraftAfterStep(completed);
      }
    }
  };

  const goBack = () => {
    if (stepIndex <= minStepIndex) return;
    Keyboard.dismiss();
    // Navigate back only — keep maxReachedStepIndex / % unchanged.
    setStepIndex((value) => value - 1);
  };

  const handleFinish = async () => {
    Keyboard.dismiss();
    if (saving) return;
    if (displayName.trim().length < 2) {
      await alert({ title: 'Your name', message: 'Enter your name before finishing.' });
      return;
    }
    if (!hasValidDateOfBirth) {
      await alert({
        title: 'Date of birth required',
        message: 'Enter a valid birth date before finishing.',
      });
      return;
    }
    setSaving(true);
    try {
      if (referralCode.trim()) {
        try {
          await applyReferralCode(referralCode.trim());
        } catch (err) {
          await alert({
            title: 'Referral code',
            message: getApiErrorMessage(err, 'That referral code could not be applied. You can skip it.'),
          });
          setSaving(false);
          return;
        }
      }
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
      await clearReachedOnboardingStep(progressUserId);
      // AuthGuard navigates to tabs / push prompt once onboarding is marked complete.
    } catch (err) {
      await alert({
        title: 'Could not save profile',
        message: getApiErrorMessage(err, 'Something went wrong saving your plan. Please try again.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const stepMeta: Record<OnboardingStep, { title: string; description: string }> = {
    intro: {
      title: t.onboarding.welcomeTitle,
      description: t.onboarding.welcomeBody,
    },
    photo: {
      title: t.onboarding.photoName,
      description: t.onboarding.photoNameBody,
    },
    profile: {
      title: t.onboarding.aboutYou,
      description: t.onboarding.aboutYouBody,
    },
    sex: {
      title: t.onboarding.sex,
      description: t.onboarding.sexBody,
    },
    body: {
      title: t.onboarding.metrics,
      description: t.onboarding.metricsBody,
    },
    goals: {
      title: t.onboarding.goal,
      description: t.onboarding.goalBody,
    },
    target: {
      title: t.onboarding.targetPace,
      description: t.onboarding.targetPaceBody,
    },
    activity: {
      title: t.onboarding.activity,
      description: t.onboarding.activityBody,
    },
    habits: {
      title: t.onboarding.eatingRhythm,
      description: t.onboarding.eatingRhythmBody,
    },
    preferences: {
      title: t.onboarding.dietPrefs,
      description: t.onboarding.dietPrefsBody,
    },
    allergies: {
      title: t.onboarding.allergies,
      description: t.onboarding.allergiesBody,
    },
    summary: {
      title: '',
      description: '',
    },
  };

  const renderFormContent = () => {
    if (step === 'photo') {
      return (
        <View className="w-full gap-5">
          <FieldInput
            label={t.onboarding.yourName}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder={t.onboarding.namePlaceholder}
          />
          <View className="flex-row items-center gap-3">
            <View className="min-w-0 flex-1 gap-2">
              <Button
                label={avatarUrl ? 'Change photo' : 'Add photo'}
                leadingIcon={Plus}
                onPress={() => setPhotoMenuOpen(true)}
                variant="secondary"
                fullWidth
              />
              {avatarUrl ? (
                <Pressable onPress={() => setAvatarUrl(undefined)}>
                  <Text className="text-center text-sm font-sans-semibold text-neutral-500">
                    Remove photo
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => setPhotoMenuOpen(true)}
              className="h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-blue-spruce-200 bg-blue-spruce-50">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={36} color="#1f3a56" />
              )}
            </Pressable>
          </View>
          <PhotoSourceMenu
            visible={photoMenuOpen}
            onClose={() => setPhotoMenuOpen(false)}
            onSelectCamera={() => pickProfilePhoto('camera')}
            onSelectGallery={() => pickProfilePhoto('gallery')}
          />
        </View>
      );
    }

    if (step === 'profile') {
      return (
        <View className="gap-4">
          <DateOfBirthInput value={dateOfBirth} onChange={setDateOfBirth} />
          <FieldInput
            label={t.onboarding.referralOptional}
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="MIRA-XXXXXX"
          />
        </View>
      );
    }

    if (step === 'sex') return <SexSelector value={sex} onChange={setSex} />;

    if (step === 'body') {
      return (
        <View className="gap-4">
          <MetricStepper
            label={t.onboarding.height}
            value={heightCm}
            unit="cm"
            step={1}
            min={120}
            max={230}
            decimals={0}
            maxLength={3}
            onChange={(next) => {
              metricsTouchedRef.current.height = true;
              setHeightCm(next);
            }}
          />
          <MetricStepper
            label={t.onboarding.weight}
            value={weightKg}
            unit="kg"
            step={0.5}
            min={35}
            max={250}
            decimals={1}
            maxLength={5}
            onChange={(next) => {
              metricsTouchedRef.current.weight = true;
              setWeightKg(next);
            }}
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
            label={t.onboarding.targetWeight}
            value={targetWeightKg}
            unit="kg"
            step={0.5}
            min={35}
            max={250}
            decimals={1}
            maxLength={5}
            onChange={(next) => {
              metricsTouchedRef.current.target = true;
              setTargetWeightKg(next);
            }}
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
        <DietaryPreferencePicker value={dietaryPreferences} onChange={togglePreference} />
      );
    }

    if (step === 'allergies') {
      return <AllergyPicker value={allergies} onChange={setAllergiesSelection} />;
    }

    if (step === 'summary') {
      return (
        <OnboardingPlanSummary
          displayName={displayName}
          avatarUrl={avatarUrl}
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

  const renderStepLead = () => {
    if (step === 'summary') return null;
    return (
      <Text className="mb-4 text-center text-[15px] leading-6 text-neutral-500">
        {stepMeta[step].description}
      </Text>
    );
  };

  const renderStepContent = () => {
    if (step === 'intro') {
      return (
        <View className="flex-1 items-center justify-center px-4 pb-2">
          <Animated.View entering={FadeIn.duration(400)} className="w-full items-center">
            <Image
              source={getOnboardingStepHero('intro', sex)}
              className="h-[250px] w-[250px]"
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(80).duration(380)} className="mt-2 w-full items-center">
            <Text className="text-center text-[13px] font-sans-semibold uppercase tracking-widest text-blue-spruce-600">
              Welcome to MiraFood
            </Text>
            <Text className="mt-3 text-center font-sans-bold text-[28px] leading-9 text-neutral-900">
              {stepMeta.intro.title}
            </Text>
            <Text className="mt-3 text-center text-[16px] leading-6 text-neutral-500">
              {stepMeta.intro.description}
            </Text>
          </Animated.View>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}>
        {step !== 'summary' ? (
          <View className="mb-3 w-full items-center">
            <Image
              source={getOnboardingStepHero(step, sex)}
              style={{ width: '100%', height: 168 }}
              resizeMode="contain"
            />
          </View>
        ) : null}
        {renderStepLead()}
        {renderFormContent()}
      </ScrollView>
    );
  };

  return (
    <OnboardingShell
      headerTitle={step === 'intro' || step === 'summary' ? undefined : stepMeta[step].title}
      intro={step === 'intro'}
      fillPercent={fillPercent}
      showBack={stepIndex > minStepIndex}
      onBack={goBack}
      footer={
        isLastStep ? (
          <OnboardingNavButton label={t.onboarding.getStarted} variant="finish" onPress={handleFinish} loading={saving} />
        ) : (
          <OnboardingNavButton
            label={step === 'intro' ? t.onboarding.letsGo : t.common.next}
            onPress={goNext}
            disabled={
              (step === 'photo' && displayName.trim().length < 2) ||
              (step === 'profile' && !hasValidDateOfBirth)
            }
          />
        )
      }>
      {renderStepContent()}
    </OnboardingShell>
  );
}
