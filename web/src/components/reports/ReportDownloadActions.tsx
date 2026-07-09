import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ExportableReport } from '@/types/reports';

type ReportDownloadActionsProps = {
  report: ExportableReport;
  size?: 'sm' | 'md';
};

export function ReportDownloadActions({ report, size = 'sm' }: ReportDownloadActionsProps) {
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePdf() {
    setError(null);
    setBusy('pdf');
    try {
      const { downloadReportPdf } = await import('@/lib/reportExport');
      await downloadReportPdf(report);
    } catch {
      setError('PDF export failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleExcel() {
    setError(null);
    setBusy('excel');
    try {
      const { downloadReportExcel } = await import('@/lib/reportExport');
      downloadReportExcel(report);
    } catch {
      setError('Excel export failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size={size}
          disabled={busy !== null}
          onClick={() => void handlePdf()}>
          {busy === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
        </Button>
        <Button
          variant="outline"
          size={size}
          disabled={busy !== null}
          onClick={() => void handleExcel()}>
          {busy === 'excel' ? 'Preparing Excel…' : 'Download Excel'}
        </Button>
      </div>
      {error ? <p className="text-xs text-cinnamon-wood-600">{error}</p> : null}
    </div>
  );
}
