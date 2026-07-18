import { useEffect, useState } from 'react';
import type { ClinicalAssessmentData } from '@/api/coachApi';
import { Button } from '@/components/ui/Button';
import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import {
  useClinicalAssessment,
  useConfirmClinicalAssessment,
  useSaveClinicalAssessment,
} from '@/hooks/useCoachQueries';

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

function readable(value: string | null | undefined) {
  if (!value) return 'Not provided';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export function ClinicalAssessmentPanel({ clientId }: { clientId: string }) {
  const { data: assessment, isLoading } = useClinicalAssessment(clientId);
  const saveMutation = useSaveClinicalAssessment(clientId);
  const confirmMutation = useConfirmClinicalAssessment(clientId);
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
    setForm({
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
    });
  }, [assessment]);

  function toggleCondition(condition: string) {
    setForm((current) => {
      const conditions = current.conditions ?? [];
      return {
        ...current,
        conditions: conditions.includes(condition)
          ? conditions.filter((item) => item !== condition)
          : [...conditions, condition],
      };
    });
  }

  function updateConditionDetail(condition: string, field: string, value: unknown) {
    setForm((current) => {
      const details = current.conditionDetails ?? {};
      const key = conditionKey(condition);
      const currentCondition =
        typeof details[key] === 'object' && details[key] !== null
          ? (details[key] as Record<string, unknown>)
          : {};
      return {
        ...current,
        conditionDetails: {
          ...details,
          [key]: { ...currentCondition, [field]: value },
        },
      };
    });
  }

  async function saveDraft() {
    try {
      await saveMutation.mutateAsync(form);
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
              <span className="text-xs text-ash-grey-500">
                Automatically carried from onboarding
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Goal', readable(assessment.patientBasics.goal)],
                ['Goal pace', readable(assessment.patientBasics.goalPace)],
                [
                  'Target weight',
                  assessment.patientBasics.targetWeightKg != null
                    ? `${assessment.patientBasics.targetWeightKg} kg`
                    : 'Not provided',
                ],
                ['Activity', readable(assessment.patientBasics.activityLevel)],
                [
                  'Meals per day',
                  assessment.patientBasics.mealsPerDay != null
                    ? String(assessment.patientBasics.mealsPerDay)
                    : 'Not provided',
                ],
                [
                  'Diet preferences',
                  assessment.patientBasics.dietaryPreferences.length
                    ? assessment.patientBasics.dietaryPreferences.join(', ')
                    : 'None reported',
                ],
                [
                  'Allergies',
                  assessment.patientBasics.allergies.length
                    ? assessment.patientBasics.allergies.join(', ')
                    : 'None reported',
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wide text-ash-grey-500">{label}</p>
                  <p className="mt-1 text-sm font-medium text-ash-grey-800">{value}</p>
                </div>
              ))}
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
                  setForm({
                    ...form,
                    verifiedDateOfBirth: event.target.value || undefined,
                    verifiedAge: undefined,
                  })
                }
              />
              <SelectField
                label="Calculation sex"
                value={form.verifiedSex ?? ''}
                onChange={(event) =>
                  setForm({
                    ...form,
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
                  setForm({ ...form, verifiedHeightCm: optionalNumber(event.target.value) })
                }
              />
              <TextField
                label="Weight (kg)"
                type="number"
                value={form.verifiedWeightKg ?? ''}
                onChange={(event) =>
                  setForm({ ...form, verifiedWeightKg: optionalNumber(event.target.value) })
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
                  onChange={(event) =>
                    setForm({ ...form, pregnant: event.target.value === 'yes' })
                  }>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
                {form.pregnant ? (
                  <>
                    <SelectField
                      label="Trimester"
                      value={form.trimester ?? ''}
                      onChange={(event) =>
                        setForm({
                          ...form,
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
                        setForm({
                          ...form,
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
                        setForm({
                          ...form,
                          prePregnancyWeightKg: optionalNumber(event.target.value) ?? null,
                        })
                      }
                    />
                  </>
                ) : (
                  <SelectField
                    label="Breastfeeding?"
                    value={form.lactating ? 'yes' : 'no'}
                    onChange={(event) =>
                      setForm({ ...form, lactating: event.target.value === 'yes' })
                    }>
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
                <TextField
                  label="Diabetes type"
                  placeholder="Type 1, Type 2, gestational"
                  value={
                    String(
                      (form.conditionDetails?.diabetes as Record<string, unknown> | undefined)
                        ?.type ?? '',
                    )
                  }
                  onChange={(event) =>
                    updateConditionDetail('Diabetes', 'type', event.target.value)
                  }
                />
                <TextField
                  label="Most recent HbA1c (%)"
                  type="number"
                  step="0.1"
                  value={
                    String(
                      (form.conditionDetails?.diabetes as Record<string, unknown> | undefined)
                        ?.hba1c ?? '',
                    )
                  }
                  onChange={(event) =>
                    updateConditionDetail('Diabetes', 'hba1c', optionalNumber(event.target.value))
                  }
                />
                <SelectField
                  label="On insulin?"
                  value={
                    (form.conditionDetails?.diabetes as Record<string, unknown> | undefined)
                      ?.onInsulin === true
                      ? 'yes'
                      : 'no'
                  }
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
                <TextField
                  label="CKD stage"
                  placeholder="e.g. Stage 3"
                  value={
                    String(
                      (form.conditionDetails?.kidney_disease as
                        | Record<string, unknown>
                        | undefined)?.stage ?? '',
                    )
                  }
                  onChange={(event) =>
                    updateConditionDetail('Kidney Disease', 'stage', event.target.value)
                  }
                />
                <SelectField
                  label="On dialysis?"
                  value={
                    (form.conditionDetails?.kidney_disease as
                      | Record<string, unknown>
                      | undefined)?.dialysis === true
                      ? 'yes'
                      : 'no'
                  }
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
                    setForm({ ...form, fluidRestriction: event.target.value === 'yes' })
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
              <TextField
                label="Occupation / daily movement"
                value={form.occupation ?? ''}
                onChange={(event) => setForm({ ...form, occupation: event.target.value })}
                placeholder="Desk job, on-feet, physical labor"
              />
              <TextField
                label="Average sleep (hours)"
                type="number"
                min={0}
                max={24}
                value={form.sleepHours ?? ''}
                onChange={(event) =>
                  setForm({ ...form, sleepHours: optionalNumber(event.target.value) })
                }
              />
              <SelectField
                label="Stress level"
                value={form.stressLevel ?? ''}
                onChange={(event) =>
                  setForm({
                    ...form,
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
                onChange={(event) => setForm({ ...form, coachNotes: event.target.value })}
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
              disabled={assessment.status === 'incomplete' || confirmMutation.isPending}
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
