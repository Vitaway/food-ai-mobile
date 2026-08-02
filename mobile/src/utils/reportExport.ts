import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import type { ConsumerReportSnapshot } from '@/services/remote/consumerApi';

type ExpoSharingModule = typeof import('expo-sharing');

/** Lazy load — older dev clients may not include the ExpoSharing native module. */
function tryGetSharing(): ExpoSharingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sharing') as ExpoSharingModule;
  } catch {
    return null;
  }
}

async function shareFile(uri: string, options: {
  mimeType: string;
  dialogTitle: string;
  UTI?: string;
}): Promise<boolean> {
  const Sharing = tryGetSharing();
  if (Sharing) {
    const canShare = await Sharing.isAvailableAsync().catch(() => false);
    if (canShare) {
      await Sharing.shareAsync(uri, options);
      return true;
    }
  }

  await Share.share({
    url: Platform.OS === 'ios' ? uri : uri.startsWith('file://') ? uri : `file://${uri}`,
    title: options.dialogTitle,
    message: options.dialogTitle,
  });
  return true;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function metricPath(metrics: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = metrics;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function str(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
  return String(value);
}

function periodLabel(period: string): string {
  if (period === 'custom') return 'Custom range';
  if (period === 'monthly') return 'Monthly';
  return 'Weekly';
}

function flattenMetrics(
  obj: Record<string, unknown>,
  prefix = '',
): Array<{ section: string; metric: string; value: string }> {
  const rows: Array<{ section: string; metric: string; value: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      if (value.length && typeof value[0] === 'object') continue;
      rows.push({ section: prefix || 'Summary', metric: formatLabel(key), value: str(value) });
    } else if (value && typeof value === 'object') {
      rows.push(...flattenMetrics(value as Record<string, unknown>, fullKey));
    } else {
      const section = prefix ? formatLabel(prefix.split('.').pop() ?? prefix) : 'Summary';
      rows.push({ section, metric: formatLabel(key), value: str(value) });
    }
  }
  return rows;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** MiraFood-only patient report HTML — no Vitaway logo or partner branding. */
export function buildConsumerReportHtml(report: ConsumerReportSnapshot): string {
  const kpis = [
    { label: 'Health score', value: str(metricPath(report.metrics, ['currentHealthScore'])) },
    { label: 'Meals logged', value: str(metricPath(report.metrics, ['adherence', 'mealsLogged'])) },
    { label: 'Days logged', value: str(metricPath(report.metrics, ['adherence', 'daysLogged'])) },
    {
      label: 'Calories',
      value: str(metricPath(report.metrics, ['nutritionSummary', 'caloriesConsumed'])),
    },
  ];

  const detailRows = flattenMetrics(report.metrics);
  const trend = report.metrics.healthScoreTrend;
  const trendRowsHtml =
    Array.isArray(trend) && trend.length
      ? trend
          .map((row) => {
            const item = row as Record<string, unknown>;
            return `<tr>
              <td>${escapeHtml(str(item.date))}</td>
              <td>${escapeHtml(str(item.totalScore))}</td>
              <td>${escapeHtml(str(item.nutrientScore))}</td>
              <td>${escapeHtml(str(item.macroScore))}</td>
              <td>${escapeHtml(str(item.calorieScore))}</td>
            </tr>`;
          })
          .join('')
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 24px; }
    .header { background: #023459; color: #fff; padding: 18px 20px; border-radius: 12px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 6px 0 0; font-size: 12px; opacity: 0.9; }
    .kpis { display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0; }
    .kpi { flex: 1 1 120px; background: #eef4f8; border-radius: 10px; padding: 12px; border-top: 3px solid #1d9e75; }
    .kpi .label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.04em; }
    .kpi .value { font-size: 20px; font-weight: 700; color: #023459; margin-top: 4px; }
    h2 { font-size: 15px; color: #023459; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
    th { background: #023459; color: #fff; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 24px; font-size: 10px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MiraFood</h1>
    <p>Patient Nutrition Report · ${escapeHtml(periodLabel(report.period))} · ${escapeHtml(formatDate(report.periodStart))} – ${escapeHtml(formatDate(report.periodEnd))}</p>
  </div>

  <div class="kpis">
    ${kpis
      .map(
        (kpi) =>
          `<div class="kpi"><div class="label">${escapeHtml(kpi.label)}</div><div class="value">${escapeHtml(kpi.value)}</div></div>`,
      )
      .join('')}
  </div>

  <h2>Detailed metrics</h2>
  <table>
    <thead><tr><th>Section</th><th>Metric</th><th>Value</th></tr></thead>
    <tbody>
      ${
        detailRows.length
          ? detailRows
              .map(
                (row) =>
                  `<tr><td>${escapeHtml(row.section)}</td><td>${escapeHtml(row.metric)}</td><td>${escapeHtml(row.value)}</td></tr>`,
              )
              .join('')
          : '<tr><td colspan="3">No metrics recorded</td></tr>'
      }
    </tbody>
  </table>

  ${
    trendRowsHtml
      ? `<h2>Health score trend</h2>
  <table>
    <thead><tr><th>Date</th><th>Total</th><th>Nutrient</th><th>Macro</th><th>Calorie</th></tr></thead>
    <tbody>${trendRowsHtml}</tbody>
  </table>`
      : ''
  }

  <p class="footer">Generated ${escapeHtml(new Date(report.createdAt).toLocaleString())} · MiraFood · Confidential</p>
</body>
</html>`;
}

async function tryPrintToPdf(html: string): Promise<string | null> {
  try {
    // Lazy require — avoids crash when ExpoPrint native module is missing from the binary.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Print = require('expo-print') as typeof import('expo-print');
    if (!Print?.printToFileAsync) return null;
    const file = await Print.printToFileAsync({ html, base64: false });
    return file?.uri ?? null;
  } catch {
    return null;
  }
}

async function shareHtmlFallback(html: string, title: string): Promise<void> {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) {
    await Share.share({ message: title, title });
    throw new Error('Could not save report file on this device');
  }
  const path = `${dir}mirafood-report-${Date.now()}.html`;
  await FileSystem.writeAsStringAsync(path, html);
  await shareFile(path, {
    mimeType: 'text/html',
    dialogTitle: title,
    UTI: 'public.html',
  });
}

export async function shareConsumerReportPdf(report: ConsumerReportSnapshot): Promise<void> {
  const html = buildConsumerReportHtml(report);
  const pdfUri = await tryPrintToPdf(html);

  if (pdfUri) {
    await shareFile(pdfUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Download nutrition report',
    });
    return;
  }

  // Dev client without ExpoPrint: share HTML report so the app still works.
  await shareHtmlFallback(html, 'Download nutrition report');
}
