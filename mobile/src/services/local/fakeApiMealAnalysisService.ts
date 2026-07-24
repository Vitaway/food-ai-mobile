import type { AnalyzeMealInput, MealAnalysisService } from '@/services/contracts/mealAnalysisService';
import { mockAnalyzeMeal } from '@/services/local/mealAnalysis';
import { delay } from '@/utils/dates';

type AnalysisJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

type AnalysisJob = {
  status: AnalysisJobStatus;
  input: AnalyzeMealInput;
  result?: Awaited<ReturnType<typeof mockAnalyzeMeal>>;
  error?: string;
};

const jobs = new Map<string, AnalysisJob>();

function createJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function runAnalysisJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'queued') return;

  job.status = 'processing';
  await delay(500);

  try {
    job.result = mockAnalyzeMeal(job.input);
    job.status = 'completed';
  } catch {
    job.status = 'failed';
    job.error = 'Analysis failed';
  }
}

export const fakeApiMealAnalysisService: MealAnalysisService = {
  async suggestMealTitle(description: string) {
    await delay(350);
    const cleaned = description.trim() || 'Custom meal';
    return cleaned
      .split(/\s+/)
      .slice(0, 6)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  async analyzeMeal(input) {
    const jobId = createJobId();
    jobs.set(jobId, { status: 'queued', input });
    void runAnalysisJob(jobId);

    const pollIntervalMs = 350;
    const maxAttempts = 40;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const job = jobs.get(jobId);
      if (!job) throw new Error('Analysis job not found');

      if (job.status === 'completed' && job.result) {
        jobs.delete(jobId);
        return job.result;
      }

      if (job.status === 'failed') {
        jobs.delete(jobId);
        throw new Error(job.error ?? 'Analysis failed');
      }

      await delay(pollIntervalMs);
    }

    jobs.delete(jobId);
    throw new Error('Analysis timed out');
  },
};

/** Mirrors future GET /analysis/:jobId/status */
export function getFakeAnalysisJobStatus(jobId: string): AnalysisJobStatus | null {
  return jobs.get(jobId)?.status ?? null;
}
