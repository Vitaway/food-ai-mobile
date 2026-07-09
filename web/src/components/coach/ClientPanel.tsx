import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { MacroBar } from '@/components/ui/MacroBar';
import { formatGoal, formatCoachPatientLabel, cn } from '@/lib/utils';
import type { CoachClient } from '@/types';

const DEFAULT_MACRO_TARGETS = {
  proteinG: 120,
  carbsG: 200,
  fatG: 65,
};

export function ClientPanel({
  client,
  showPreferences = false,
}: {
  client: CoachClient;
  showPreferences?: boolean;
}) {
  const { profile, dashboard, patientId } = client;
  const macroTargets = profile.macroTargets ?? DEFAULT_MACRO_TARGETS;
  const macrosConsumed = dashboard.macrosConsumed ?? {
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  };
  const calorieTarget = dashboard.calorieTarget || 1;
  const caloriePct = Math.round((dashboard.caloriesConsumed / calorieTarget) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-spruce-100 text-lg font-bold text-blue-spruce-700">
            {profile.displayName?.charAt(0) ?? '?'}
          </div>
          <div>
            <h3 className="font-bold text-ash-grey-900">
              {formatCoachPatientLabel(patientId, profile.displayName)}
            </h3>
            <p className="text-sm capitalize text-ash-grey-500">{formatGoal(profile.goal)}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Age" value={profile.age != null ? `${profile.age}` : '—'} />
          <Stat label="Weight" value={profile.weightKg != null ? `${profile.weightKg} kg` : '—'} />
          <Stat label="Streak" value={`${dashboard.streakDays ?? 0} days`} />
          <Stat label="Health score" value={`${dashboard.healthScore ?? 0}`} />
        </div>

        <div className="rounded-2xl bg-ash-grey-50 p-4">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm font-medium text-ash-grey-600">Today&apos;s calories</span>
            <span className="text-2xl font-bold text-blue-spruce-700">{caloriePct}%</span>
          </div>
          <p className="text-sm text-ash-grey-500">
            {dashboard.caloriesConsumed} / {dashboard.calorieTarget} kcal
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ash-grey-200">
            <div
              className="h-full rounded-full bg-cinnamon-wood-400"
              style={{ width: `${Math.min(100, caloriePct)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <MacroBar
            label="Protein"
            value={macrosConsumed.proteinG}
            target={macroTargets.proteinG}
            colorClass="bg-shamrock-500"
          />
          <MacroBar
            label="Carbs"
            value={macrosConsumed.carbsG}
            target={macroTargets.carbsG}
            colorClass="bg-blue-spruce-500"
          />
          <MacroBar
            label="Fats"
            value={macrosConsumed.fatG}
            target={macroTargets.fatG}
            colorClass="bg-cinnamon-wood-400"
          />
        </div>

        {profile.allergies?.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a) => (
                <span key={a} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  {a}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {showPreferences && profile.dietaryPreferences?.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
              Dietary preferences
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.dietaryPreferences.map((p) => (
                <span key={p} className="rounded-full bg-blue-spruce-50 px-3 py-1 text-xs font-medium text-blue-spruce-800">
                  {p}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ash-grey-50 px-3 py-2">
      <p className="text-xs text-ash-grey-500">{label}</p>
      <p className="font-semibold text-ash-grey-900">{value}</p>
    </div>
  );
}

export function StatsGrid({
  stats,
}: {
  stats: { inReview: number; analyzing: number; approvedToday: number; flagged: number; avgReviewMinutes: number };
}) {
  const items = [
    { label: 'In review', value: stats.inReview, accent: 'text-cinnamon-wood-600' },
    { label: 'Analyzing', value: stats.analyzing, accent: 'text-blue-spruce-600' },
    { label: 'Approved today', value: stats.approvedToday, accent: 'text-shamrock-600' },
    { label: 'Flagged', value: stats.flagged, accent: 'text-red-600' },
    { label: 'Avg review', value: `${stats.avgReviewMinutes}m`, accent: 'text-ash-grey-700' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardBody>
            <p className="text-sm text-ash-grey-500">{item.label}</p>
            <p className={cn('mt-1 text-3xl font-normal', item.accent)}>{item.value}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
