type TrendPoint = { date: string; totalScore: number };

type HealthScoreTrendSparklineProps = {
  trend: TrendPoint[];
  className?: string;
};

export function HealthScoreTrendSparkline({ trend, className = '' }: HealthScoreTrendSparklineProps) {
  const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-14);
  if (!recent.length) return null;

  const max = Math.max(...recent.map((row) => row.totalScore), 100);
  const width = 280;
  const height = 72;
  const padding = 4;
  const step = recent.length > 1 ? (width - padding * 2) / (recent.length - 1) : 0;

  const points = recent
    .map((row, index) => {
      const x = padding + index * step;
      const y = height - padding - (row.totalScore / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const latest = recent[recent.length - 1]?.totalScore ?? 0;
  const first = recent[0]?.totalScore ?? 0;
  const delta = latest - first;

  return (
    <div className={className}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ash-grey-500">Health score trend</p>
          <p className="text-2xl font-bold text-ash-grey-900">{latest}</p>
        </div>
        <p className={`text-sm font-semibold ${delta >= 0 ? 'text-shamrock-700' : 'text-red-600'}`}>
          {delta >= 0 ? '+' : ''}
          {delta} vs start
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke="#1D9E75"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ash-grey-400">
        <span>{recent[0]?.date.slice(5)}</span>
        <span>{recent[recent.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
