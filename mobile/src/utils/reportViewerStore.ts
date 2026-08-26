import type { ConsumerReportSnapshot } from '@/services/remote/consumerApi';

/** Holds a report briefly while navigating to the in-app viewer. */
let pendingReport: ConsumerReportSnapshot | null = null;

export function setPendingReport(report: ConsumerReportSnapshot) {
  pendingReport = report;
}

export function consumePendingReport(): ConsumerReportSnapshot | null {
  const next = pendingReport;
  pendingReport = null;
  return next;
}

export function peekPendingReport(): ConsumerReportSnapshot | null {
  return pendingReport;
}
