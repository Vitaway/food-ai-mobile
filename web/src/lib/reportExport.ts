import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ExportableReport } from '@/types/reports';

const BRAND = {
  primaryRgb: [2, 52, 89] as [number, number, number],
  accentRgb: [29, 158, 117] as [number, number, number],
  warmRgb: [226, 98, 45] as [number, number, number],
  lightRgb: [238, 244, 248] as [number, number, number],
  softGreen: [232, 248, 241] as [number, number, number],
  softOrange: [254, 243, 234] as [number, number, number],
  text: '#1f2937',
  muted: [107, 114, 128] as [number, number, number],
};

type Kpi = { label: string; value: string; accent?: 'green' | 'blue' | 'orange' };

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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function reportTitle(variant: ExportableReport['variant']): string {
  if (variant === 'admin') return 'Platform Operations Report';
  if (variant === 'consumer') return 'Patient Nutrition Report';
  return 'Coach Performance Report';
}

function periodLabel(period: string): string {
  if (period === 'custom') return 'Custom range';
  if (period === 'weekly') return 'Weekly';
  if (period === 'monthly') return 'Monthly';
  return period;
}

function buildKpis(report: ExportableReport): Kpi[] {
  const { metrics, variant } = report;
  if (variant === 'coach') {
    return [
      {
        label: 'Reviews completed',
        value: str(metricPath(metrics, ['coachActivity', 'reviewsCompleted'])),
        accent: 'blue',
      },
      {
        label: 'Meals approved',
        value: str(metricPath(metrics, ['coachActivity', 'mealsApproved'])),
        accent: 'green',
      },
      {
        label: 'In review queue',
        value: str(metricPath(metrics, ['coachActivity', 'mealsInQueue'])),
        accent: 'orange',
      },
    ];
  }
  if (variant === 'admin') {
    const usage = metrics.platformUsage as Record<string, unknown> | undefined;
    return [
      { label: 'Meals logged', value: str(metrics.mealCount), accent: 'blue' },
      { label: 'Approved', value: str(metrics.approvedMeals), accent: 'green' },
      {
        label: 'Approval rate',
        value: `${str(metrics.approvalRatePct ?? 0)}%`,
        accent: 'green',
      },
      { label: 'Active clients', value: str(usage?.uniqueClientsLogging), accent: 'orange' },
      { label: 'Coaches', value: str(metrics.coaches), accent: 'blue' },
      { label: 'Adherence', value: `${str(metrics.clientAdherencePct)}%`, accent: 'orange' },
    ];
  }
  return [
    {
      label: 'Health score',
      value: str(metricPath(metrics, ['currentHealthScore'])),
      accent: 'green',
    },
    {
      label: 'Meals logged',
      value: str(metricPath(metrics, ['adherence', 'mealsLogged'])),
      accent: 'blue',
    },
    {
      label: 'Days logged',
      value: str(metricPath(metrics, ['adherence', 'daysLogged'])),
      accent: 'orange',
    },
    {
      label: 'Calories consumed',
      value: str(metricPath(metrics, ['nutritionSummary', 'caloriesConsumed'])),
      accent: 'blue',
    },
  ];
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

function healthTrendRows(metrics: Record<string, unknown>) {
  const trend = metrics.healthScoreTrend;
  if (!Array.isArray(trend)) return [];
  return trend.map((row) => {
    const item = row as Record<string, unknown>;
    return [
      str(item.date),
      str(item.totalScore),
      str(item.nutrientScore),
      str(item.macroScore),
      str(item.calorieScore),
      str(item.consistencyScore),
      str(item.varietyScore),
    ];
  });
}

async function loadImageDataUrl(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function kpiAccentRgb(accent?: Kpi['accent']): [number, number, number] {
  if (accent === 'green') return BRAND.accentRgb;
  if (accent === 'orange') return BRAND.warmRgb;
  return BRAND.primaryRgb;
}

function fileSlug(report: ExportableReport): string {
  const start = report.periodStart.slice(0, 10);
  const end = report.periodEnd.slice(0, 10);
  return `mirafood-${report.variant}-${report.period}-${start}-to-${end}`;
}

type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } };

function drawHeader(doc: jsPDF, report: ExportableReport, miraLogo: string | null, vitawayLogo: string | null) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(...BRAND.primaryRgb);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setFillColor(...BRAND.accentRgb);
  doc.rect(0, 28, pageW, 1.4, 'F');

  if (miraLogo) doc.addImage(miraLogo, 'PNG', margin, 6, 14, 14);
  if (vitawayLogo) doc.addImage(vitawayLogo, 'PNG', margin + 17, 7.5, 28, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MiraFood', margin + 48, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('BY VITAWAY', margin + 48, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(reportTitle(report.variant).toUpperCase(), pageW - margin, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `${periodLabel(report.period)} · ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`,
    pageW - margin,
    18,
    { align: 'right' },
  );
}

function drawKpis(doc: jsPDF, kpis: Kpi[], startY: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 3.5;
  const cols = Math.min(kpis.length, 6);
  const kpiW = (pageW - margin * 2 - (cols - 1) * gap) / cols;
  const rowH = 22;

  kpis.forEach((kpi, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = margin + col * (kpiW + gap);
    const y = startY + row * (rowH + gap);
    doc.setFillColor(...BRAND.lightRgb);
    doc.roundedRect(x, y, kpiW, rowH, 2, 2, 'F');
    doc.setDrawColor(...kpiAccentRgb(kpi.accent));
    doc.setLineWidth(0.7);
    doc.line(x, y, x + kpiW, y);
    doc.setTextColor(...BRAND.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(kpi.label.toUpperCase(), x + 3.5, y + 7.5);
    doc.setTextColor(...BRAND.primaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(kpi.value, x + 3.5, y + 16.5);
  });

  const rows = Math.ceil(kpis.length / cols);
  return startY + rows * (rowH + gap) + 2;
}

function drawAdminInsights(doc: jsPDF, report: ExportableReport, startY: number): number {
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const metrics = report.metrics;
  const usage = (metrics.platformUsage as Record<string, unknown> | undefined) ?? {};

  const mealCount = num(metrics.mealCount);
  const approved = num(metrics.approvedMeals);
  const inReview = num(metrics.inReviewMeals);
  const rejected = num(metrics.rejectedMeals);
  const days = num(metrics.daysInPeriod) || 1;
  const avgPerDay = num(metrics.avgMealsPerDay);
  const approvalRate = num(metrics.approvalRatePct);
  const activeClients = num(usage.uniqueClientsLogging);
  const patients = num(metrics.consumers);
  const coaches = num(metrics.coaches);
  const adherence = num(metrics.clientAdherencePct);
  const activeShare = num(usage.activeClientSharePct);

  let y = startY;
  doc.setTextColor(...BRAND.primaryRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Period overview', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const overview = [
    `Coverage: ${formatDate(report.periodStart)} to ${formatDate(report.periodEnd)} (${days} day${days === 1 ? '' : 's'}).`,
    `${mealCount} meals were logged in this window (avg ${avgPerDay}/day). ${approved} approved, ${inReview} still in review, ${rejected} rejected.`,
    `Platform reach: ${activeClients} active clients of ${patients} patients (${activeShare}% active), supported by ${coaches} coaches. Client adherence sits at ${adherence}%.`,
  ];
  overview.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4.2 + 1.5;
  });

  y += 3;
  doc.setTextColor(...BRAND.primaryRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Meal pipeline', margin, y);
  y += 4;

  const barMaxW = pageW - margin * 2 - 70;
  const segments = [
    { label: 'Approved', value: approved, color: BRAND.accentRgb },
    { label: 'In review', value: inReview, color: BRAND.warmRgb },
    { label: 'Rejected', value: rejected, color: [185, 28, 28] as [number, number, number] },
  ];
  const total = Math.max(mealCount, 1);

  segments.forEach((seg, idx) => {
    const rowY = y + idx * 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(seg.label, margin, rowY + 3.5);
    doc.setFillColor(...BRAND.lightRgb);
    doc.roundedRect(margin + 28, rowY, barMaxW, 5, 1, 1, 'F');
    const fillW = Math.max(1.5, (seg.value / total) * barMaxW);
    doc.setFillColor(...seg.color);
    doc.roundedRect(margin + 28, rowY, fillW, 5, 1, 1, 'F');
    doc.setTextColor(...BRAND.primaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.text(String(seg.value), margin + 32 + barMaxW, rowY + 3.5);
  });

  y += segments.length * 8 + 4;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Notes']],
    body: [
      ['Approval rate', `${approvalRate}%`, 'Share of logged meals approved in range'],
      ['Avg meals / day', str(avgPerDay), 'Total meals divided by days in range'],
      ['Active client share', `${activeShare}%`, 'Clients who logged at least one meal'],
      ['Client adherence', `${adherence}%`, 'Patients with an active logging streak'],
      ['In review', String(inReview), 'Meals awaiting coach decision'],
      ['Rejected', String(rejected), 'Meals declined in this period'],
    ],
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.5,
      textColor: BRAND.text,
    },
    headStyles: {
      fillColor: BRAND.primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: BRAND.lightRgb },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 28 },
    },
  });

  return ((doc as AutoTableDoc).lastAutoTable?.finalY ?? y) + 8;
}

function drawFooters(doc: jsPDF, report: ExportableReport) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFillColor(...BRAND.lightRgb);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `Generated ${formatDateTime(report.createdAt)} · MiraFood by Vitaway · Confidential`,
      margin,
      pageH - 4,
    );
    doc.text(`Page ${page} of ${pageCount}`, pageW - margin, pageH - 4, { align: 'right' });
  }
}

export async function downloadReportPdf(report: ExportableReport): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin = 14;

  const [miraLogo, vitawayLogo] = await Promise.all([
    loadImageDataUrl('/mirafood-logo.png'),
    loadImageDataUrl('/partner-logos/vitaway.png'),
  ]);

  drawHeader(doc, report, miraLogo, vitawayLogo);

  let y = 36;
  doc.setTextColor(...BRAND.primaryRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Executive summary', margin, y);
  y += 5;

  y = drawKpis(doc, buildKpis(report), y);

  const org = metricPath(report.metrics, ['organization']);
  if (org) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text(`Organization: ${str(org)}`, margin, y);
    y += 6;
  }

  if (report.variant === 'admin') {
    y = drawAdminInsights(doc, report, y);

    doc.setTextColor(...BRAND.primaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Full metrics appendix', margin, y);

    const detailRows = flattenMetrics(report.metrics).map((row) => [row.section, row.metric, row.value]);
    autoTable(doc, {
      startY: y + 3,
      head: [['Section', 'Metric', 'Value']],
      body: detailRows.length ? detailRows : [['—', 'No metrics recorded', '—']],
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.2,
        textColor: BRAND.text,
      },
      headStyles: {
        fillColor: BRAND.primaryRgb,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: BRAND.lightRgb },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 72 },
      },
    });
  } else {
    doc.setTextColor(...BRAND.primaryRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Detailed metrics', margin, y);

    const detailRows = flattenMetrics(report.metrics).map((row) => [row.section, row.metric, row.value]);
    autoTable(doc, {
      startY: y + 4,
      head: [['Section', 'Metric', 'Value']],
      body: detailRows.length ? detailRows : [['—', 'No metrics recorded', '—']],
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.5,
        textColor: BRAND.text,
      },
      headStyles: {
        fillColor: BRAND.primaryRgb,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: BRAND.lightRgb },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 72 },
      },
    });

    const trendRows = healthTrendRows(report.metrics);
    if (trendRows.length) {
      const afterTable = (doc as AutoTableDoc).lastAutoTable?.finalY ?? y + 40;
      autoTable(doc, {
        startY: afterTable + 8,
        head: [['Date', 'Total', 'Nutrient', 'Macro', 'Calorie', 'Consistency', 'Variety']],
        body: trendRows,
        margin: { left: margin, right: margin },
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: BRAND.accentRgb, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: BRAND.lightRgb },
      });
    }
  }

  drawFooters(doc, report);
  doc.save(`${fileSlug(report)}.pdf`);
}

export function downloadReportExcel(report: ExportableReport): void {
  const kpis = buildKpis(report);
  const summaryRows = [
    ['MiraFood by Vitaway', reportTitle(report.variant)],
    ['Period type', periodLabel(report.period)],
    ['Period start', formatDate(report.periodStart)],
    ['Period end', formatDate(report.periodEnd)],
    ['Generated at', formatDateTime(report.createdAt)],
    ['Report ID', report.id],
    [],
    ['KPI', 'Value'],
    ...kpis.map((kpi) => [kpi.label, kpi.value]),
  ];

  const detailRows = [
    ['Section', 'Metric', 'Value'],
    ...flattenMetrics(report.metrics).map((row) => [row.section, row.metric, row.value]),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailRows), 'Metrics');

  const trend = report.metrics.healthScoreTrend;
  if (Array.isArray(trend) && trend.length) {
    const trendSheet = [
      ['Date', 'Total score', 'Nutrient', 'Macro', 'Calorie', 'Consistency', 'Variety'],
      ...healthTrendRows(report.metrics),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trendSheet), 'Health trend');
  }

  XLSX.writeFile(wb, `${fileSlug(report)}.xlsx`);
}
