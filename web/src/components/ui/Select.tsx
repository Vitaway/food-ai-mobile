import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectSize = 'sm' | 'md' | 'lg';

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: SelectSize;
  className?: string;
  /** Compact filter-bar styling */
  variant?: 'default' | 'filter';
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

const sizeClasses: Record<SelectSize, { trigger: string; item: string; chevron: string }> = {
  sm: {
    trigger: 'min-h-9 rounded-xl px-3 py-1.5 text-xs',
    item: 'px-3 py-2 text-xs',
    chevron: 'h-3.5 w-3.5',
  },
  md: {
    trigger: 'min-h-11 rounded-2xl px-4 py-2.5 text-sm',
    item: 'px-3.5 py-2.5 text-sm',
    chevron: 'h-4 w-4',
  },
  lg: {
    trigger: 'min-h-12 rounded-2xl px-4 py-3 text-sm',
    item: 'px-4 py-3 text-sm',
    chevron: 'h-4 w-4',
  },
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Brand Select — use everywhere for consistent dropdowns. */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  error = false,
  size = 'md',
  className,
  variant = 'default',
  id,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectProps) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0, openUp: false });

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const enabledIndexes = useMemo(
    () => options.map((option, index) => (option.disabled ? -1 : index)).filter((i) => i >= 0),
    [options],
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const maxHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < Math.min(maxHeight, options.length * 44 + 16) && rect.top > spaceBelow;
    setMenuPos({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
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
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : (enabledIndexes[0] ?? -1));
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open, options, value, enabledIndexes]);

  function openMenu() {
    if (disabled) return;
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(next: string) {
    onChange(next);
    closeMenu();
  }

  function moveActive(delta: number) {
    if (!enabledIndexes.length) return;
    setActiveIndex((current) => {
      const pos = enabledIndexes.indexOf(current);
      const nextPos =
        pos < 0
          ? delta > 0
            ? 0
            : enabledIndexes.length - 1
          : (pos + delta + enabledIndexes.length) % enabledIndexes.length;
      return enabledIndexes[nextPos] ?? enabledIndexes[0] ?? -1;
    });
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      openMenu();
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(enabledIndexes[0] ?? -1);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[activeIndex];
      if (option && !option.disabled) choose(option.value);
    }
  }

  const sizes = sizeClasses[size];
  const isFilter = variant === 'filter';

  return (
    <div className={cn('relative w-full', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'font-ui flex w-full items-center justify-between gap-2 border text-left outline-none transition',
          sizes.trigger,
          isFilter ? 'rounded-xl bg-white' : 'bg-white',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-ash-grey-200 hover:border-blue-spruce-300 focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100',
          open && !error && 'border-blue-spruce-400 ring-2 ring-blue-spruce-100',
          disabled && 'cursor-not-allowed opacity-55',
        )}>
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            selected ? 'text-ash-grey-900' : 'text-ash-grey-400',
          )}>
          {selected?.label ?? placeholder}
        </span>
        <Chevron
          className={cn(
            'shrink-0 text-blue-spruce-600 transition-transform',
            sizes.chevron,
            open && 'rotate-180',
          )}
        />
      </button>

      {open
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={
                activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
              }
              onKeyDown={onListKeyDown}
              data-vitaway-select-menu=""
              className="font-ui fixed z-[200] max-h-[280px] overflow-auto rounded-2xl border border-ash-grey-200 bg-white py-1.5 shadow-[0_16px_40px_rgba(2,52,89,0.14)] outline-none"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: Math.max(menuPos.width, 160),
                transform: menuPos.openUp ? 'translateY(-100%)' : undefined,
              }}>
              {options.length === 0 ? (
                <li className="px-3.5 py-3 text-sm text-ash-grey-500">No options</li>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={`${option.value}-${index}`}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      className={cn(
                        'mx-1.5 flex cursor-pointer items-center justify-between gap-2 rounded-xl transition-colors',
                        sizes.item,
                        option.disabled && 'cursor-not-allowed opacity-40',
                        !option.disabled && isActive && 'bg-blue-spruce-50 text-blue-spruce-800',
                        !option.disabled && !isActive && 'text-ash-grey-800 hover:bg-ash-grey-50',
                        isSelected && !isActive && 'text-blue-spruce-700',
                      )}
                      onMouseEnter={() => {
                        if (!option.disabled) setActiveIndex(index);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (!option.disabled) choose(option.value);
                      }}>
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {isSelected ? (
                        <CheckIcon className="h-4 w-4 shrink-0 text-blue-spruce-600" />
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Parse native <option> children into SelectOption[]. */
export function selectOptionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)
    ) {
      return [];
    }
    if (child.type !== 'option') return [];
    return [
      {
        value: String(child.props.value ?? ''),
        label: String(child.props.children ?? ''),
        disabled: Boolean(child.props.disabled),
      },
    ];
  });
}

/** Build a synthetic change event so legacy SelectField handlers keep working. */
export function syntheticSelectChange(
  value: string,
  name?: string,
): ChangeEvent<HTMLSelectElement> {
  return {
    target: { value, name: name ?? '' },
    currentTarget: { value, name: name ?? '' },
  } as ChangeEvent<HTMLSelectElement>;
}
