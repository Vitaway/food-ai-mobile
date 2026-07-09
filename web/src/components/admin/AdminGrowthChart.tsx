type GrowthPoint = {
  date: string;
  registrations: number;
};

export function AdminGrowthChart({ points }: { points: GrowthPoint[] }) {
  const max = Math.max(...points.map((p) => p.registrations), 1);

  return (
    <div className="rounded-2xl border border-ash-grey-100 bg-white p-4">
      <h3 className="text-sm font-semibold text-ash-grey-900">Registration growth</h3>
      <p className="mt-1 text-xs text-ash-grey-500">Daily signups over the last {points.length} days</p>
      <div className="mt-4 flex h-32 items-end gap-1">
        {points.map((point) => {
          const height = point.registrations > 0 ? Math.max((point.registrations / max) * 100, 10) : 4;
          return (
            <div key={point.date} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t-md bg-blue-spruce-500"
                style={{ height: `${height}%`, minHeight: point.registrations > 0 ? 8 : 4, opacity: point.registrations ? 1 : 0.35 }}
                title={`${point.registrations} on ${point.date}`}
              />
              <span className="mt-1 text-[9px] text-ash-grey-400">
                {new Date(`${point.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
