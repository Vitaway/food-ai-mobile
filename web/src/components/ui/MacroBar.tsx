import { cn } from '@/lib/utils';

type MacroBarProps = {
  label: string;
  value: number;
  target: number;
  unit?: string;
  colorClass: string;
};

export function MacroBar({ label, value, target, unit = 'g', colorClass }: MacroBarProps) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-ash-grey-700">{label}</span>
        <span className="text-ash-grey-500">
          {value}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ash-grey-100">
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MacroPills({
  protein,
  carbs,
  fat,
  water,
}: {
  protein: string;
  carbs: string;
  fat: string;
  water?: string;
}) {
  const pills = [
    { label: 'Protein', value: protein, dot: 'bg-shamrock-500' },
    { label: 'Carbs', value: carbs, dot: 'bg-blue-spruce-500' },
    { label: 'Fats', value: fat, dot: 'bg-cinnamon-wood-400' },
    ...(water ? [{ label: 'Water', value: water, dot: 'bg-muted-teal-500' }] : []),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <div
          key={p.label}
          className="flex items-center gap-2 rounded-full border border-ash-grey-200 bg-white px-3 py-1.5 text-sm shadow-sm">
          <span className={cn('h-2 w-2 rounded-full', p.dot)} />
          <span className="text-ash-grey-600">{p.label}</span>
          <span className="font-semibold text-ash-grey-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
