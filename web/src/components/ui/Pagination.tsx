import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-ash-grey-100 bg-ash-grey-50/50 px-5 py-3',
        className,
      )}>
      <p className="text-sm text-ash-grey-500">
        {total === 0 ? 'No results' : `Showing ${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}>
          Previous
        </Button>
        <span className="min-w-[7rem] text-center text-sm text-ash-grey-600">
          Page {safePage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
