import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T, index: number) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'border-b border-ash-grey-200 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ash-grey-500',
                  col.className,
                )}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-12 text-center">
                <p className="font-semibold text-ash-grey-800">{emptyTitle}</p>
                {emptyDescription ? (
                  <p className="mt-1 text-sm text-ash-grey-500">{emptyDescription}</p>
                ) : null}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-ash-grey-100 last:border-b-0',
                  onRowClick && 'cursor-pointer transition-colors hover:bg-cinnamon-wood-50/60',
                )}>
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-3 py-3 align-middle text-ash-grey-800', col.className)}>
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
