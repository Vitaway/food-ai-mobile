import { DashboardPanel } from '@/components/ui/DashboardPanel';
import { StatusPill } from '@/components/ui/StatusPill';
import { MacroBar } from '@/components/ui/MacroBar';
import { formatGoal, formatCoachPatientLabel } from '@/lib/utils';
import type { CoachClient } from '@/types';

const DEFAULT_MACRO_TARGETS = {
  proteinG: 120,
  carbsG: 200,
  fatG: 65,
};

/** Compact patient snapshot for meal review / client sidebar. */
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
    <DashboardPanel
      title="Patient snapshot"
      action={
        <StatusPill tone="info">{formatGoal(profile.goal)}</StatusPill>
      }>
      <div className="space-y-4 px-3 py-3">
        <div>
          <p className="font-semibold text-ash-grey-900">
            {formatCoachPatientLabel(patientId, profile.displayName)}
          </p>
          <p className="mt-0.5 text-xs text-ash-grey-500">{patientId}</p>
        </div>

        <table className="w-full text-left text-sm">
          <tbody>
            <SnapshotRow label="Age" value={profile.age != null ? String(profile.age) : '—'} />
            <SnapshotRow
              label="Weight"
              value={profile.weightKg != null ? `${profile.weightKg} kg` : '—'}
            />
            <SnapshotRow label="Streak" value={`${dashboard.streakDays ?? 0} days`} />
            <SnapshotRow label="Health score" value={String(dashboard.healthScore ?? 0)} />
          </tbody>
        </table>

        <div>
          <div className="mb-1 flex items-end justify-between text-sm">
            <span className="text-ash-grey-600">Today&apos;s calories</span>
            <span className="font-semibold text-blue-spruce-700">{caloriePct}%</span>
          </div>
          <p className="text-xs text-ash-grey-500">
            {dashboard.caloriesConsumed} / {dashboard.calorieTarget} kcal
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ash-grey-200">
            <div
              className="h-full rounded-full bg-cinnamon-wood-400"
              style={{ width: `${Math.min(100, caloriePct)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
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
          <div className="flex flex-wrap gap-1">
            {profile.allergies.map((a) => (
              <StatusPill key={a} tone="bad">
                {a}
              </StatusPill>
            ))}
          </div>
        ) : null}

        {showPreferences && profile.dietaryPreferences?.length ? (
          <div className="flex flex-wrap gap-1">
            {profile.dietaryPreferences.map((p) => (
              <StatusPill key={p} tone="info">
                {p}
              </StatusPill>
            ))}
          </div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-ash-grey-100 last:border-b-0">
      <td className="py-1.5 text-xs text-ash-grey-500">{label}</td>
      <td className="py-1.5 text-right text-sm font-semibold text-ash-grey-900">{value}</td>
    </tr>
  );
}

export function StatsGrid({
  stats,
}: {
  stats: {
    inReview: number;
    analyzing: number;
    approvedToday: number;
    flagged: number;
    avgReviewMinutes: number;
  };
}) {
  const items = [
    { label: 'In review', value: stats.inReview, warn: stats.inReview > 0 },
    { label: 'Analyzing', value: stats.analyzing },
    { label: 'Approved today', value: stats.approvedToday },
    { label: 'Flagged', value: stats.flagged, warn: stats.flagged > 0 },
    { label: 'Avg review', value: `${stats.avgReviewMinutes}m` },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[120px] flex-1 rounded-xl border border-ash-grey-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ash-grey-500">
            {item.label}
          </p>
          <p
            className={
              item.warn
                ? 'mt-1 text-2xl font-semibold text-red-600'
                : 'mt-1 text-2xl font-semibold text-ash-grey-900'
            }>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
