import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCoachStore } from '@/stores/coachStore';

type ApproveMealModalProps = {
  open: boolean;
  andNext: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Approve confirmation with optional coach note (visible to the client). */
export function ApproveMealModal({
  open,
  andNext,
  loading = false,
  onConfirm,
  onCancel,
}: ApproveMealModalProps) {
  const note = useCoachStore((s) => s.reviewDraft?.note ?? '');
  const updateDraftNote = useCoachStore((s) => s.updateDraftNote);

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onCancel}
      title={andNext ? 'Approve and open next?' : 'Approve this meal?'}
      description={
        andNext
          ? 'Your coach review will be saved and the client will see the approved nutrition. You’ll move to the next queue item.'
          : 'Your coach review will be saved and the client will see the approved nutrition.'
      }
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Approving…' : andNext ? 'Approve & next' : 'Approve meal'}
          </Button>
        </div>
      }>
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-ash-grey-900">Coach note</p>
          <p className="mt-0.5 text-xs text-ash-grey-500">Visible to the client when you approve</p>
        </div>
        <textarea
          className="min-h-24 w-full rounded-xl border border-ash-grey-200 px-3 py-2.5 text-sm outline-none focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
          placeholder="Optional note for the client…"
          value={note}
          onChange={(e) => updateDraftNote(e.target.value)}
          disabled={loading}
        />
      </div>
    </Modal>
  );
}
