type GrowthPoint = {
  date: string;
  registrations: number;
};

export function AdminGrowthChart({ points }: { points: GrowthPoint[] }) {
  const max = Math.max(...points.map((p) => p.registrations), 1);

  return (
    <div>
      <h3 className="font-sans text-lg font-semibold text-ash-grey-900">Registration growth</h3>
      <p className="mt-1 text-sm text-ash-grey-500">
        Daily signups over the last {points.length} days
      </p>
      <div className="mt-5 flex h-40 items-end gap-1.5">
        {points.map((point) => {
          const height = point.registrations > 0 ? Math.max((point.registrations / max) * 100, 12) : 6;
          return (
            <div key={point.date} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-blue-spruce-600 to-shamrock-400"
                style={{
                  height: `${height}%`,
                  minHeight: point.registrations > 0 ? 10 : 4,
                  opacity: point.registrations ? 1 : 0.35,
                }}
                title={`${point.registrations} on ${point.date}`}
              />
              <span className="mt-2 text-[9px] text-ash-grey-400">
                {new Date(`${point.date}T12:00:00`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
