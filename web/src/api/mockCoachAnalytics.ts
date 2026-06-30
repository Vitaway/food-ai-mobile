import type { CoachAnalytics } from '@/components/coach/DashboardCharts';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchCoachAnalytics(): Promise<CoachAnalytics> {
  await delay(300);
  return {
    reviewsThisWeek: [
      { label: 'Mon', value: 8 },
      { label: 'Tue', value: 12 },
      { label: 'Wed', value: 6 },
      { label: 'Thu', value: 14 },
      { label: 'Fri', value: 10 },
      { label: 'Sat', value: 4 },
      { label: 'Sun', value: 7 },
    ],
    approvalTrend: [
      { label: 'Mon', value: 88 },
      { label: 'Tue', value: 91 },
      { label: 'Wed', value: 85 },
      { label: 'Thu', value: 94 },
      { label: 'Fri', value: 92 },
      { label: 'Sat', value: 90 },
      { label: 'Sun', value: 93 },
    ],
    queueBreakdown: [
      { label: 'In review', value: 3, color: '#ff6f32' },
      { label: 'Analyzing', value: 1, color: '#023459' },
      { label: 'Approved', value: 12, color: '#1d9e75' },
      { label: 'Flagged', value: 2, color: '#b54e24' },
    ],
    reviewsByMealType: [
      { label: 'Breakfast', value: 18 },
      { label: 'Lunch', value: 32 },
      { label: 'Dinner', value: 28 },
      { label: 'Snacks', value: 14 },
    ],
    coachStats: {
      totalReviews: 248,
      activeClients: 12,
      approvalRate: 91,
      avgReviewMinutes: 4.2,
    },
  };
}
