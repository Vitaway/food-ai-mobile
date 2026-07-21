import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FieldLabel } from '@/components/ui/Field';
import {
  COUNTRY_DIAL_CODES,
  countryFlagEmoji,
  formatPhoneValue,
  getCountryByIso,
  parsePhoneValue,
} from '@/lib/countryDialCodes';
import { cn } from '@/lib/utils';

type PhoneFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PhoneField({
  label,
  value,
  onChange,
  hint,
  error,
  disabled,
  id,
  className,
}: PhoneFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const listId = `${fieldId}-countries`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parsePhoneValue(value), [value]);
  const [iso, setIso] = useState(parsed.iso);
  const [national, setNational] = useState(parsed.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUp: false });

  useEffect(() => {
    const next = parsePhoneValue(value);
    setIso(next.iso);
    setNational(next.national);
  }, [value]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
    setMenuPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      openUp,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    searchRef.current?.focus();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const country = getCountryByIso(iso) ?? COUNTRY_DIAL_CODES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_DIAL_CODES;
    return COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        `+${c.dial}`.includes(q),
    );
  }, [query]);

  function emit(nextIso: string, nextNational: string) {
    onChange(formatPhoneValue(nextIso, nextNational));
  }

  function selectCountry(nextIso: string) {
    setIso(nextIso);
    setOpen(false);
    setQuery('');
    emit(nextIso, national);
  }

  return (
    <div className={className}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <div
        className={cn(
          'flex rounded-2xl border border-ash-grey-200 bg-white transition-colors focus-within:border-blue-spruce-400 focus-within:ring-2 focus-within:ring-blue-spruce-100',
          error && 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100',
          disabled && 'opacity-60',
        )}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label="Country code"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[2.875rem] shrink-0 items-center gap-1.5 rounded-l-2xl border-r border-ash-grey-200 bg-ash-grey-50/80 px-3 text-sm font-medium text-ash-grey-900 hover:bg-ash-grey-100 disabled:cursor-not-allowed">
          <span className="text-base leading-none" aria-hidden>
            {countryFlagEmoji(country.iso)}
          </span>
          <span className="tabular-nums">+{country.dial}</span>
          <Chevron className={cn('h-3.5 w-3.5 text-ash-grey-500 transition', open && 'rotate-180')} />
        </button>

        <input
          id={fieldId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          value={national}
          placeholder="Phone number"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            setNational(digits);
            emit(iso, digits);
          }}
          className="min-w-0 flex-1 rounded-r-2xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ash-grey-400"
        />
      </div>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              className="fixed z-[200] w-72 overflow-hidden rounded-2xl border border-ash-grey-200 bg-white shadow-[0_16px_40px_rgba(2,52,89,0.14)]"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                transform: menuPos.openUp ? 'translateY(-100%)' : undefined,
              }}>
              <div className="border-b border-ash-grey-100 p-2">
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country…"
                  className="w-full rounded-xl border border-ash-grey-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-ash-grey-400 focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-ash-grey-500">No countries found</li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.iso}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={c.iso === iso}
                        onClick={() => selectCountry(c.iso)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-ash-grey-50',
                          c.iso === iso && 'bg-blue-spruce-50',
                        )}>
                        <span className="text-base leading-none" aria-hidden>
                          {countryFlagEmoji(c.iso)}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-ash-grey-900">
                          {c.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-ash-grey-500">+{c.dial}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}

      {hint && !error ? <p className="mt-1.5 text-xs text-ash-grey-500">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
