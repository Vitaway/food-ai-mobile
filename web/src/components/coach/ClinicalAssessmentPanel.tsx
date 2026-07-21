import { useEffect, useState } from 'react';
import type { ClinicalAssessmentData } from '@/api/coachApi';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  ACTIVITY_LEVEL_OPTIONS,
  CKD_STAGE_OPTIONS,
  COMMON_ALLERGY_OPTIONS,
  DIABETES_TYPE_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  GOAL_PACE_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  MEALS_PER_DAY_OPTIONS,
  OCCUPATION_OPTIONS,
  SLEEP_HOURS_OPTIONS,
  sanitizeClinicalAssessmentData,
} from '@/lib/clinicalAssessment';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import {
  useClinicalAssessment,
  useConfirmClinicalAssessment,
  useSaveClinicalAssessment,
} from '@/hooks/useCoachQueries';
import {
  useAdminClinicalAssessment,
  useConfirmAdminClinicalAssessment,
  useSaveAdminClinicalAssessment,
} from '@/features/admin/hooks/useAdminQueries';
import { cn } from '@/lib/utils';

const CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Kidney Disease',
  'Heart Disease',
  'High Cholesterol',
  'Thyroid Disease',
  'PCOS',
  'IBS / Gastritis',
  'Food Allergies',
] as const;

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function conditionKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function ageFromDateOfBirth(value: string | undefined) {
  if (!value) return null;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function toggleListValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ChipMultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ash-grey-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(toggleListValue(values, option))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                selected
                  ? 'border-blue-spruce-600 bg-blue-spruce-600 text-white'
                  : 'border-ash-grey-200 bg-white text-ash-grey-700 hover:border-ash-grey-300',
              )}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ClinicalAssessmentPanel({
  clientId,
  adminUserId,
}: {
  clientId: string;
  adminUserId?: string;
}) {
  const coachAssessment = useClinicalAssessment(adminUserId ? null : clientId);
  const adminAssessment = useAdminClinicalAssessment(adminUserId ?? null);
  const assessment = adminUserId ? adminAssessment.data : coachAssessment.data;
  const isLoading = adminUserId ? adminAssessment.isLoading : coachAssessment.isLoading;
  const saveMutationCoach = useSaveClinicalAssessment(clientId);
  const saveMutationAdmin = useSaveAdminClinicalAssessment(adminUserId ?? '');
  const confirmMutationCoach = useConfirmClinicalAssessment(clientId);
  const confirmMutationAdmin = useConfirmAdminClinicalAssessment(adminUserId ?? '');
  const saveMutation = adminUserId ? saveMutationAdmin : saveMutationCoach;
  const confirmMutation = adminUserId ? confirmMutationAdmin : confirmMutationCoach;
  const { confirm, dialog } = useConfirmDialog();
  const toast = useToast();
  const [form, setForm] = useState<ClinicalAssessmentData>({});

  useEffect(() => {
    if (!assessment) return;
    const submittedAllergies = assessment.patientBasics.allergies ?? [];
    const initialConditions =
      assessment.data.conditions ??
      (submittedAllergies.length > 0 ? ['Food Allergies'] : []);
    const initialConditionDetails =
      assessment.data.conditionDetails ??
      (submittedAllergies.length > 0
        ? { food_allergies: { reportedAllergies: submittedAllergies } }
        : {});
    setForm(
      sanitizeClinicalAssessmentData({
        verifiedDateOfBirth:
          assessment.data.verifiedDateOfBirth ?? assessment.patientBasics.dateOfBirth ?? undefined,
        verifiedAge: assessment.data.verifiedAge,
        verifiedSex:
          assessment.data.verifiedSex ??
          (assessment.patientBasics.sex === 'male' || assessment.patientBasics.sex === 'female'
            ? assessment.patientBasics.sex
            : undefined),
        verifiedHeightCm:
          assessment.data.verifiedHeightCm ?? assessment.patientBasics.heightCm ?? undefined,
        verifiedWeightKg:
          assessment.data.verifiedWeightKg ?? assessment.patientBasics.weightKg ?? undefined,
        pregnant: assessment.data.pregnant ?? false,
        trimester: assessment.data.trimester ?? null,
        numberOfBabies: assessment.data.numberOfBabies ?? null,
        prePregnancyWeightKg: assessment.data.prePregnancyWeightKg ?? null,
        lactating: assessment.data.lactating ?? false,
        conditions: initialConditions,
        conditionDetails: initialConditionDetails,
        fluidRestriction: assessment.data.fluidRestriction ?? false,
        occupation: assessment.data.occupation ?? '',
        exercise: assessment.data.exercise ?? {},
        smoking: assessment.data.smoking ?? {},
        alcohol: assessment.data.alcohol ?? {},
        sleepHours: assessment.data.sleepHours,
        stressLevel: assessment.data.stressLevel,
        coachNotes: assessment.data.coachNotes ?? '',
        goal: assessment.patientBasics.goal ?? undefined,
        goalPace:
          assessment.patientBasics.goalPace === 'slow' ||
          assessment.patientBasics.goalPace === 'moderate' ||
          assessment.patientBasics.goalPace === 'aggressive'
            ? assessment.patientBasics.goalPace
            : undefined,
        targetWeightKg: assessment.patientBasics.targetWeightKg,
        activityLevel: assessment.patientBasics.activityLevel ?? undefined,
        mealsPerDay: assessment.patientBasics.mealsPerDay,
        dietaryPreferences: assessment.patientBasics.dietaryPreferences ?? [],
        allergies: assessment.patientBasics.allergies ?? [],
      }),
    );
  }, [assessment]);

  function patchForm(patch: Partial<ClinicalAssessmentData>) {
    setForm((current) => sanitizeClinicalAssessmentData({ ...current, ...patch }));
  }

  function toggleCondition(condition: string) {
    setForm((current) => {
      const conditions = current.conditions ?? [];
      const nextConditions = conditions.includes(condition)
        ? conditions.filter((item) => item !== condition)
        : [...conditions, condition];
      return sanitizeClinicalAssessmentData({
        ...current,
        conditions: nextConditions,
      });
    });
  }

  function updateConditionDetail(condition: string, field: string, value: unknown) {
    setForm((current) => {
      const details = { ...(current.conditionDetails ?? {}) };
      const key = conditionKey(condition);
      const currentCondition =
        typeof details[key] === 'object' && details[key] !== null
          ? (details[key] as Record<string, unknown>)
          : {};
      return sanitizeClinicalAssessmentData({
        ...current,
        conditionDetails: {
          ...details,
          [key]: { ...currentCondition, [field]: value },
        },
      });
    });
  }

  async function saveDraft() {
    try {
      await saveMutation.mutateAsync(sanitizeClinicalAssessmentData(form));
      toast.success('Clinical assessment draft saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save the clinical assessment'));
    }
  }

  async function confirmAssessment() {
    const ok = await confirm({
      title: 'Confirm this clinical assessment?',
      description:
        'MiraFood will recalculate the patient’s calorie, macro, and hydration targets from these verified details.',
      confirmLabel: 'Confirm and calculate',
    });
    if (!ok) return;
    try {
      await saveMutation.mutateAsync(sanitizeClinicalAssessmentData(form));
      await confirmMutation.mutateAsync({});
      toast.success('Clinical profile confirmed and targets recalculated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not confirm the clinical assessment'));
    }
  }

  if (isLoading || !assessment) {
    return <p className="text-sm text-ash-grey-500">Loading clinical assessment…</p>;
  }

  const isFemaleAdult =
    form.verifiedSex === 'female' &&
    (ageFromDateOfBirth(form.verifiedDateOfBirth) ?? assessment.patientBasics.age ?? 0) >= 18;
  const calculatedAge = ageFromDateOfBirth(form.verifiedDateOfBirth);
  const target = assessment.targetSnapshot;
  const diabetesDetails = form.conditionDetails?.diabetes as Record<string, unknown> | undefined;
  const kidneyDetails = form.conditionDetails?.kidney_disease as Record<string, unknown> | undefined;

  return (
    <div className="space-y-5">
      <DashboardPanel
        title="Clinical assessment"
        action={
          <StatusPill
            tone={
              assessment.status === 'confirmed'
                ? 'good'
                : assessment.status === 'draft'
                  ? 'warn'
                  : 'info'
            }>
            {assessment.status}
          </StatusPill>
        }>
        <div className="space-y-6 px-4 py-4">
          <p className="text-sm text-ash-grey-600">
            Ask the patient these questions by phone or in person. Verify facts before confirming;
            MiraFood calculates the targets on the server.
          </p>

          <section className="rounded-2xl border border-blue-spruce-100 bg-blue-spruce-50/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-ash-grey-900">Patient-submitted details</h3>
              <span className="text-xs text-ash-grey-500">Editable — updates the patient profile</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField
                label="Goal"
                value={form.goal ?? ''}
                onChange={(e) => patchForm({ goal: e.target.value || undefined })}>
                <option value="">Select</option>
                {HEALTH_GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Goal pace"
                value={form.goalPace ?? ''}
                onChange={(e) =>
                  patchForm({
                    goalPace: (e.target.value || undefined) as ClinicalAssessmentData['goalPace'],
                  })
                }>
                <option value="">Select</option>
                {GOAL_PACE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Target weight (kg)"
                type="number"
                value={form.targetWeightKg ?? ''}
                onChange={(e) =>
                  patchForm({ targetWeightKg: optionalNumber(e.target.value) ?? null })
                }
              />
              <SelectField
                label="Activity"
                value={form.activityLevel ?? ''}
                onChange={(e) => patchForm({ activityLevel: e.target.value || undefined })}>
                <option value="">Select</option>
                {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Meals per day"
                value={form.mealsPerDay != null ? String(form.mealsPerDay) : ''}
                onChange={(e) =>
                  patchForm({ mealsPerDay: optionalNumber(e.target.value) ?? null })
                }>
                <option value="">Select</option>
                {MEALS_PER_DAY_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ChipMultiSelect
                label="Diet preferences"
                options={DIETARY_PREFERENCE_OPTIONS}
                values={form.dietaryPreferences ?? []}
                onChange={(dietaryPreferences) => patchForm({ dietaryPreferences })}
              />
              <ChipMultiSelect
                label="Allergies"
                options={COMMON_ALLERGY_OPTIONS}
                values={form.allergies ?? []}
                onChange={(allergies) => patchForm({ allergies })}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-semibold text-ash-grey-900">1. Verify patient basics</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                label="Date of birth"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.verifiedDateOfBirth ?? ''}
                hint={
                  calculatedAge != null
                    ? `Age ${calculatedAge}, calculated automatically`
                    : 'Required for an accurate, age-adjusted calculation'
                }
                onChange={(event) =>
                  patchForm({
                    verifiedDateOfBirth: event.target.value || undefined,
                    verifiedAge: undefined,
                  })
                }
              />
              <SelectField
                label="Calculation sex"
                value={form.verifiedSex ?? ''}
                onChange={(event) =>
                  patchForm({
                    verifiedSex: event.target.value as ClinicalAssessmentData['verifiedSex'],
                  })
                }>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </SelectField>
              <TextField
                label="Height (cm)"
                type="number"
                value={form.verifiedHeightCm ?? ''}
                onChange={(event) =>
                  patchForm({ verifiedHeightCm: optionalNumber(event.target.value) })
                }
              />
              <TextField
                label="Weight (kg)"
                type="number"
                value={form.verifiedWeightKg ?? ''}
                onChange={(event) =>
                  patchForm({ verifiedWeightKg: optionalNumber(event.target.value) })
                }
              />
            </div>
          </section>

          {isFemaleAdult ? (
            <section>
              <h3 className="mb-3 font-semibold text-ash-grey-900">
                2. Pregnancy and breastfeeding
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField
                  label="Pregnant?"
                  value={form.pregnant ? 'yes' : 'no'}
                  onChange={(event) => patchForm({ pregnant: event.target.value === 'yes' })}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
                {form.pregnant ? (
                  <>
                    <SelectField
                      label="Trimester"
                      value={form.trimester ?? ''}
                      onChange={(event) =>
                        patchForm({
                          trimester: optionalNumber(event.target.value) as 1 | 2 | 3 | undefined,
                        })
                      }>
                      <option value="">Select</option>
                      <option value="1">First</option>
                      <option value="2">Second</option>
                      <option value="3">Third</option>
                    </SelectField>
                    <SelectField
                      label="Number of babies"
                      value={form.numberOfBabies ?? ''}
                      onChange={(event) =>
                        patchForm({
                          numberOfBabies: optionalNumber(event.target.value) as 1 | 2 | undefined,
                        })
                      }>
                      <option value="">Select</option>
                      <option value="1">One</option>
                      <option value="2">Twins</option>
                    </SelectField>
                    <TextField
                      label="Pre-pregnancy weight (kg)"
                      type="number"
                      value={form.prePregnancyWeightKg ?? ''}
                      onChange={(event) =>
                        patchForm({
                          prePregnancyWeightKg: optionalNumber(event.target.value) ?? null,
                        })
                      }
                    />
                  </>
                ) : (
                  <SelectField
                    label="Breastfeeding?"
                    value={form.lactating ? 'yes' : 'no'}
                    onChange={(event) => patchForm({ lactating: event.target.value === 'yes' })}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </SelectField>
                )}
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-3 font-semibold text-ash-grey-900">
              {isFemaleAdult ? '3' : '2'}. Diagnosed conditions
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CONDITIONS.map((condition) => (
                <label
                  key={condition}
                  className="flex items-center gap-2 rounded-xl border border-ash-grey-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(form.conditions ?? []).includes(condition)}
                    onChange={() => toggleCondition(condition)}
                  />
                  {condition}
                </label>
              ))}
            </div>

            {(form.conditions ?? []).includes('Diabetes') ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <SelectField
                  label="Diabetes type"
                  value={String(diabetesDetails?.type ?? '')}
                  onChange={(event) =>
                    updateConditionDetail('Diabetes', 'type', event.target.value || undefined)
                  }>
                  <option value="">Select</option>
                  {DIABETES_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label="Most recent HbA1c (%)"
                  type="number"
                  step="0.1"
                  value={String(diabetesDetails?.hba1c ?? '')}
                  onChange={(event) =>
                    updateConditionDetail('Diabetes', 'hba1c', optionalNumber(event.target.value))
                  }
                />
                <SelectField
                  label="On insulin?"
                  value={diabetesDetails?.onInsulin === true ? 'yes' : 'no'}
                  onChange={(event) =>
                    updateConditionDetail('Diabetes', 'onInsulin', event.target.value === 'yes')
                  }>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>
            ) : null}

            {(form.conditions ?? []).includes('Kidney Disease') ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <SelectField
                  label="CKD stage"
                  value={String(kidneyDetails?.stage ?? '')}
                  onChange={(event) =>
                    updateConditionDetail(
                      'Kidney Disease',
                      'stage',
                      event.target.value || undefined,
                    )
                  }>
                  <option value="">Select</option>
                  {CKD_STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="On dialysis?"
                  value={kidneyDetails?.dialysis === true ? 'yes' : 'no'}
                  onChange={(event) =>
                    updateConditionDetail(
                      'Kidney Disease',
                      'dialysis',
                      event.target.value === 'yes',
                    )
                  }>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
                <SelectField
                  label="Fluid restriction?"
                  value={form.fluidRestriction ? 'yes' : 'no'}
                  onChange={(event) =>
                    patchForm({ fluidRestriction: event.target.value === 'yes' })
                  }>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 font-semibold text-ash-grey-900">
              {isFemaleAdult ? '4' : '3'}. Lifestyle and coach notes
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField
                label="Occupation / daily movement"
                value={form.occupation ?? ''}
                onChange={(event) => patchForm({ occupation: event.target.value || undefined })}>
                <option value="">Select</option>
                {OCCUPATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Average sleep (hours)"
                value={form.sleepHours != null ? String(form.sleepHours) : ''}
                onChange={(event) =>
                  patchForm({ sleepHours: optionalNumber(event.target.value) })
                }>
                <option value="">Select</option>
                {SLEEP_HOURS_OPTIONS.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours === 10 ? '10+' : hours} hours
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Stress level"
                value={form.stressLevel ?? ''}
                onChange={(event) =>
                  patchForm({
                    stressLevel: event.target.value as ClinicalAssessmentData['stressLevel'],
                  })
                }>
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </SelectField>
            </div>
            <div className="mt-3">
              <TextAreaField
                label="Coach notes"
                value={form.coachNotes ?? ''}
                onChange={(event) => patchForm({ coachNotes: event.target.value })}
                placeholder="Medication, recent changes, safety concerns, or follow-up needed."
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-ash-grey-100 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={() => void saveDraft()}>
              {saveMutation.isPending ? 'Saving…' : 'Save draft'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={confirmMutation.isPending || saveMutation.isPending}
              onClick={() => void confirmAssessment()}>
              {confirmMutation.isPending ? 'Calculating…' : 'Confirm and calculate'}
            </Button>
          </div>
        </div>
      </DashboardPanel>

      {target ? (
        <DashboardPanel title="Nutrition Calculation Engine preview">
          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Population', target.population.replaceAll('_', ' ')],
                ['BMR', `${target.bmr} kcal`],
                ['TDEE', `${target.tdee} kcal`],
                ['Daily target', `${target.calorieTarget} kcal`],
                ['Protein', `${target.macroTargets.proteinG} g`],
                ['Carbohydrate', `${target.macroTargets.carbsG} g`],
                ['Fat', `${target.macroTargets.fatG} g`],
                ['Water', `${target.waterTargetMl} ml`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-ash-grey-50 px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-ash-grey-500">{label}</p>
                  <p className="mt-1 font-semibold capitalize text-ash-grey-900">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-ash-grey-500">
              Equation: {target.equationUsed.replaceAll('_', ' ')} · NCE {target.nceVersion}
            </p>
            {target.warnings.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                {target.warnings.map((warning) => (
                  <p key={warning}>• {warning}</p>
                ))}
              </div>
            ) : null}
          </div>
        </DashboardPanel>
      ) : null}

      {dialog}
    </div>
  );
}
