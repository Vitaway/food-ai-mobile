import { useDeferredValue, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchNutritionCategories,
  fetchNutritionFoodsPage,
  type NutritionFood,
} from '@/api/nutritionDbApi';
import { cn } from '@/lib/utils';

type FoodDbPickerProps = {
  valueId?: string;
  valueLabel?: string;
  onSelect: (food: NutritionFood) => void;
  className?: string;
};

type MenuPos = { top: number; left: number; width: number };

const PAGE_SIZE = 30;

/** Searchable nutrition-DB food picker for coach review rows. */
export function FoodDbPicker({ valueId, valueLabel, onSelect, className }: FoodDbPickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pos, setPos] = useState<MenuPos | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const updatePos = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 360),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    function onScrollOrResize() {
      updatePos();
    }
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (inputRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      setSearch('');
      setCategory('');
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const { data: categories = [] } = useQuery({
    queryKey: ['nutrition-db', 'categories'],
    queryFn: fetchNutritionCategories,
    enabled: open,
    staleTime: 60_000,
  });

  const { data, isFetching, isFetchingNextPage, isError, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['nutrition-db', 'picker', deferredSearch, category],
      queryFn: ({ pageParam }) =>
        fetchNutritionFoodsPage({
          q: deferredSearch || undefined,
          category: category || undefined,
          approval: 'approved',
          page: pageParam,
          pageSize: PAGE_SIZE,
        }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
      enabled: open,
      placeholderData: (prev) => prev,
    });

  const foods = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const displayValue = open ? search : (valueLabel ?? '');

  function openPicker() {
    setSearch('');
    setCategory('');
    setOpen(true);
    updatePos();
  }

  function pick(food: NutritionFood) {
    onSelect(food);
    setSearch('');
    setCategory('');
    setOpen(false);
  }

  const menu =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            className="fixed z-[120] flex max-h-[22rem] flex-col overflow-hidden rounded-lg border border-ash-grey-200 bg-white shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}>
            <div className="shrink-0 space-y-2 border-b border-ash-grey-100 px-3 py-2">
              <p className="text-[11px] leading-4 text-ash-grey-500">
                {deferredSearch
                  ? `Search results${total ? ` · ${total} match${total === 1 ? '' : 'es'}` : ''}`
                  : `Browse the food database${total ? ` · ${total} foods` : ''}. Type a name to find faster.`}
              </p>
              {categories.length > 0 ? (
                <select
                  className="w-full rounded-md border border-ash-grey-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-spruce-400"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}>
                  <option value="">All groups</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : null}
              {valueLabel ? (
                <p className="truncate text-[11px] text-ash-grey-400">
                  Current: <span className="font-medium text-ash-grey-600">{valueLabel}</span>
                </p>
              ) : null}
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto py-1">
              {isError ? (
                <li className="px-3 py-2 text-xs text-red-600">
                  {(error as Error)?.message ?? 'Could not load foods'}
                </li>
              ) : null}
              {isFetching && !foods.length ? (
                <li className="px-3 py-2 text-xs text-ash-grey-500">Loading foods…</li>
              ) : null}
              {!isFetching && !isError && !foods.length ? (
                <li className="px-3 py-2 text-xs text-ash-grey-500">
                  No foods match. Try another name or clear the group filter.
                </li>
              ) : null}
              {foods.map((food) => {
                const n = food.nutritionPer100g ?? {};
                return (
                  <li key={food.id} role="option">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full flex-col items-start px-3 py-1.5 text-left text-sm hover:bg-blue-spruce-50',
                        food.id === valueId && 'bg-blue-spruce-50',
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        pick(food);
                      }}>
                      <span className="font-medium text-ash-grey-900">{food.name}</span>
                      <span className="text-[11px] text-ash-grey-500">
                        {food.foodGroupName ?? food.category}
                        {food.foodCode ? ` · #${food.foodCode}` : ''}
                        {` · ${n.caloriesKcal ?? 0} kcal/100g`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {foods.length > 0 ? (
              <div className="shrink-0 border-t border-ash-grey-100 px-3 py-2">
                <p className="text-[11px] text-ash-grey-500">
                  Showing {foods.length}
                  {total ? ` of ${total}` : ''}
                </p>
                {hasNextPage ? (
                  <button
                    type="button"
                    className="mt-1.5 w-full rounded-md border border-ash-grey-200 bg-ash-grey-50 px-2 py-1.5 text-xs font-semibold text-ash-grey-800 hover:bg-ash-grey-100 disabled:opacity-60"
                    disabled={isFetchingNextPage}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void fetchNextPage();
                    }}>
                    {isFetchingNextPage ? 'Loading…' : 'Load more foods'}
                  </button>
                ) : (
                  <p className="mt-1 text-[11px] text-ash-grey-400">End of list</p>
                )}
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn('relative min-w-[12rem]', className)}>
      <input
        ref={inputRef}
        className="w-full min-w-0 rounded-md border border-ash-grey-200 bg-white px-2 py-1 text-sm outline-none focus:border-blue-spruce-400"
        value={displayValue}
        placeholder="Search or browse food database…"
        onFocus={openPicker}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
          updatePos();
        }}
        aria-controls={listId}
        aria-expanded={open}
        role="combobox"
        autoComplete="off"
      />
      {menu}
    </div>
  );
}
