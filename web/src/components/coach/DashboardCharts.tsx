import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export type ChartPoint = { label: string; value: number };

const BRAND_COLORS = ['#023459', '#1d9e75', '#ff6f32', '#5ca375', '#6798bf', '#b54e24'];

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
              className="w-full max-w-10 rounded-t-xl transition-all"
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
  const w = 280;
  const h = 100;
  const pad = 8;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d9e75" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1d9e75" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#lineFill)"
        points={`${pad},${h - pad} ${points.join(' ')} ${w - pad},${h - pad}`}
      />
      <polyline
        fill="none"
        stroke="#1d9e75"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
      {data.map((d, i) => {
        const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - (d.value / max) * (h - pad * 2);
        return <circle key={d.label} cx={x} cy={y} r="4" fill="#1d9e75" stroke="#fff" strokeWidth="2" />;
      })}
    </svg>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const r = 42;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0">
        {segments.map((seg) => {
          const dash = (seg.value / total) * c;
          const circle = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="50" y="48" textAnchor="middle" className="fill-ash-grey-900 text-[18px] font-bold">
          {total}
        </text>
        <text x="50" y="60" textAnchor="middle" className="fill-ash-grey-500 text-[8px]">
          total
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-ash-grey-600">{seg.label}</span>
            <span className="ml-auto font-semibold text-ash-grey-900">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-ash-grey-700">{item.label}</span>
            <span className="font-semibold text-ash-grey-900">{item.value}</span>
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

export function DashboardCharts({ analytics }: { analytics: CoachAnalytics }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Reviews this week</h3>
          <p className="mt-0.5 text-sm text-ash-grey-500">Daily meal reviews completed</p>
        </CardHeader>
        <CardBody>
          <BarChart data={analytics.reviewsThisWeek} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Approval rate</h3>
          <p className="mt-0.5 text-sm text-ash-grey-500">Last 7 days trend</p>
        </CardHeader>
        <CardBody>
          <LineChart data={analytics.approvalTrend} />
          <div className="mt-2 flex justify-between text-xs text-ash-grey-500">
            {analytics.approvalTrend.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Queue breakdown</h3>
          <p className="mt-0.5 text-sm text-ash-grey-500">Current pipeline status</p>
        </CardHeader>
        <CardBody>
          <DonutChart segments={analytics.queueBreakdown} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-bold text-ash-grey-900">Reviews by meal type</h3>
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
    { label: 'Total reviews', value: stats.totalReviews, color: 'text-blue-spruce-600' },
    { label: 'Active clients', value: stats.activeClients, color: 'text-shamrock-600' },
    { label: 'Approval rate', value: `${stats.approvalRate}%`, color: 'text-cinnamon-wood-600' },
    { label: 'Avg review', value: `${stats.avgReviewMinutes}m`, color: 'text-ash-grey-700' },
  ];

  return (
    <div className="flex flex-wrap gap-6 sm:gap-10">
      {items.map((item) => (
        <div key={item.label} className="text-center sm:text-left">
            <p className={cn('text-2xl font-normal', item.color)}>{item.value}</p>
          <p className="text-sm text-ash-grey-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
