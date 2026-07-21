import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export type ChartPoint = { label: string; value: number };

const BRAND_COLORS = ['#023459', '#1d9e75', '#ff6f32', '#5ca375', '#6798bf', '#b54e24'];

function softCardClassName(className?: string) {
  return cn(
    'rounded-[1.75rem] border border-ash-grey-100/90 bg-white/95 shadow-[0_12px_32px_rgba(2,52,89,0.06)]',
    className,
  );
}

function BarChart({ data, maxHeight = 120 }: { data: ChartPoint[]; maxHeight?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
      {data.map((point, i) => {
        const h = Math.max(8, (point.value / max) * maxHeight);
        return (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold text-ash-grey-700">{point.value}</span>
            <div
              className="w-full max-w-10 rounded-t-2xl transition-all"
              style={{ height: h, backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}
            />
            <span className="text-center text-[10px] font-medium text-ash-grey-500 sm:text-xs">
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 420;
  const h = 160;
  const pad = 12;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return { x, y, label: d.label, value: d.value };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full">
        <defs>
          <linearGradient id="overviewLineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d9e75" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1d9e75" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={pad}
            x2={w - pad}
            y1={pad + (h - pad * 2) * ratio}
            y2={pad + (h - pad * 2) * ratio}
            stroke="#e8ece9"
            strokeDasharray="4 6"
          />
        ))}
        <polygon
          fill="url(#overviewLineFill)"
          points={`${pad},${h - pad} ${polyline} ${w - pad},${h - pad}`}
        />
        <polyline
          fill="none"
          stroke="#1d9e75"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
        />
        {points.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="4.5"
            fill="#1d9e75"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>
      {peak ? (
        <div
          className="pointer-events-none absolute rounded-2xl bg-blue-spruce-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{
            left: `min(calc(${(peak.x / w) * 100}% - 2rem), calc(100% - 7rem))`,
            top: `max(0.25rem, calc(${(peak.y / h) * 100}% - 2.75rem))`,
          }}>
          {peak.label} · {peak.value}%
        </div>
      ) : null}
    </div>
  );
}

function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  centerValue?: string;
  centerLabel?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const r = 46;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg viewBox="0 0 120 120" className="h-44 w-44">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#eef2f0" strokeWidth="14" />
          {segments.map((seg) => {
            const dash = (seg.value / total) * c;
            const circle = (
              <circle
                key={seg.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-sans text-3xl font-semibold tracking-tight text-ash-grey-900">
            {centerValue ?? total}
          </p>
          <p className="mt-0.5 text-xs font-medium text-ash-grey-500">{centerLabel ?? 'total'}</p>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="min-w-0 flex-1 truncate text-ash-grey-600">{seg.label}</span>
            <span className="font-semibold tabular-nums text-ash-grey-900">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3.5">
      {data.map((item, i) => (
        <div key={item.label}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-ash-grey-700">{item.label}</span>
            <span className="font-semibold tabular-nums text-ash-grey-900">{item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ash-grey-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export type CoachAnalytics = {
  reviewsThisWeek: ChartPoint[];
  approvalTrend: ChartPoint[];
  queueBreakdown: { label: string; value: number; color: string }[];
  reviewsByMealType: ChartPoint[];
  coachStats: {
    totalReviews: number;
    activeClients: number;
    approvalRate: number;
    avgReviewMinutes: number;
  };
};

/** Featured Thrive-style chart row: activity line + goals/queue donut. */
export function DashboardCharts({ analytics }: { analytics: CoachAnalytics }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
      <Card className={softCardClassName()}>
        <CardHeader className="border-0 pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-sans text-lg font-semibold text-ash-grey-900">Review activity</h3>
              <p className="mt-0.5 text-sm text-ash-grey-500">Approval rate over the last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-shamrock-700">
                <span className="h-2 w-2 rounded-full bg-shamrock-500" /> This week
              </span>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          <LineChart data={analytics.approvalTrend} />
          <div className="mt-1 flex justify-between px-1 text-xs text-ash-grey-500">
            {analytics.approvalTrend.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className={softCardClassName()}>
        <CardHeader className="border-0 pb-0">
          <h3 className="font-sans text-lg font-semibold text-ash-grey-900">Queue breakdown</h3>
          <p className="mt-0.5 text-sm text-ash-grey-500">Where meals sit right now</p>
        </CardHeader>
        <CardBody>
          <DonutChart
            segments={analytics.queueBreakdown}
            centerValue={`${analytics.coachStats.approvalRate}%`}
            centerLabel="on track"
          />
        </CardBody>
      </Card>

      <Card className={softCardClassName()}>
        <CardHeader className="border-0 pb-0">
          <h3 className="font-sans text-lg font-semibold text-ash-grey-900">Reviews this week</h3>
          <p className="mt-0.5 text-sm text-ash-grey-500">Daily meal reviews completed</p>
        </CardHeader>
        <CardBody>
          <BarChart data={analytics.reviewsThisWeek} />
        </CardBody>
      </Card>

      <Card className={softCardClassName()}>
        <CardHeader className="border-0 pb-0">
          <h3 className="font-sans text-lg font-semibold text-ash-grey-900">Reviews by meal type</h3>
          <p className="mt-0.5 text-sm text-ash-grey-500">This month</p>
        </CardHeader>
        <CardBody>
          <HorizontalBars data={analytics.reviewsByMealType} />
        </CardBody>
      </Card>
    </div>
  );
}

export function CoachStatPills({
  stats,
}: {
  stats: CoachAnalytics['coachStats'];
}) {
  const items = [
    { label: 'Total reviews', value: stats.totalReviews, tone: 'info' as const },
    { label: 'Active clients', value: stats.activeClients, tone: 'success' as const },
    { label: 'Approval rate', value: `${stats.approvalRate}%`, tone: 'accent' as const },
    { label: 'Avg review', value: `${stats.avgReviewMinutes}m`, tone: 'default' as const },
  ];

  const tones = {
    info: 'bg-[#e7f0f7] text-blue-spruce-700',
    success: 'bg-[#e8f6ef] text-shamrock-700',
    accent: 'bg-[#ffe8dc] text-cinnamon-wood-700',
    default: 'bg-ash-grey-50 text-ash-grey-800',
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-[1.5rem] px-4 py-4 shadow-[0_8px_24px_rgba(2,52,89,0.04)]',
            tones[item.tone],
          )}>
          <p className="font-sans text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
          <p className="mt-1 text-sm text-ash-grey-600">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
