import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type Ref,
} from 'react';
import { cn } from '@/lib/utils';

export type SearchInputSize = 'sm' | 'md';

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> & {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Prefer for new code — receives the string value directly. */
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  size?: SearchInputSize;
  /** Show the clear (X) control when there is a value. Default true. */
  clearable?: boolean;
  /** Classes on the outer wrapper (width, flex, etc.). */
  className?: string;
  inputClassName?: string;
};

const sizeClasses: Record<
  SearchInputSize,
  { shell: string; input: string; icon: string; clear: string; padRightEmpty: string; padRightClear: string }
> = {
  sm: {
    shell: 'min-h-9',
    input: 'py-1.5 text-xs',
    icon: 'left-3 h-3.5 w-3.5',
    clear: 'right-2.5 h-6 w-6',
    padRightEmpty: 'pr-3',
    padRightClear: 'pr-9',
  },
  md: {
    shell: 'min-h-11',
    input: 'py-2.5 text-sm',
    icon: 'left-4 h-4 w-4',
    clear: 'right-3 h-7 w-7',
    padRightEmpty: 'pr-4',
    padRightClear: 'pr-11',
  },
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

/** Brand search field — pill shell with offset spruce shadow. Use for all search UIs. */
export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    defaultValue,
    onChange,
    onValueChange,
    onClear,
    size = 'md',
    clearable = true,
    className,
    inputClassName,
    disabled,
    id,
    placeholder = 'Search…',
    'aria-label': ariaLabel,
    ...rest
  }: SearchInputProps,
  ref: Ref<HTMLInputElement>,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const sizes = sizeClasses[size];
  const controlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(() =>
    defaultValue == null ? '' : String(defaultValue),
  );
  const current = controlled ? String(value) : uncontrolled;
  const showClear = clearable && !disabled && current.length > 0;

  function emit(next: string, event?: ChangeEvent<HTMLInputElement>) {
    if (!controlled) setUncontrolled(next);
    onValueChange?.(next);
    if (event) {
      onChange?.(event);
      return;
    }
    if (onChange) {
      const target = { value: next } as HTMLInputElement;
      onChange({
        target,
        currentTarget: target,
      } as ChangeEvent<HTMLInputElement>);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    emit(event.target.value, event);
  }

  function handleClear() {
    onClear?.();
    emit('');
  }

  return (
    <div className={cn('relative w-full pb-[3px] pr-[3px]', className)}>
      <div
        className={cn(
          'search-input font-ui relative flex w-full items-center rounded-full border-2 border-blue-spruce-300 bg-white transition-[border-color,box-shadow]',
          sizes.shell,
          'shadow-[3px_3px_0_0_var(--color-blue-spruce-300)]',
          'focus-within:border-blue-spruce-500 focus-within:shadow-[3px_3px_0_0_var(--color-blue-spruce-500)]',
          disabled && 'cursor-not-allowed opacity-55',
        )}>
        <SearchIcon
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ash-grey-600',
            sizes.icon,
          )}
        />
        <input
          ref={ref}
          id={inputId}
          type="search"
          disabled={disabled}
          value={controlled ? value : uncontrolled}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          onChange={handleChange}
          className={cn(
            'w-full min-w-0 rounded-full bg-transparent text-ash-grey-900 outline-none placeholder:text-ash-grey-400',
            'caret-blue-spruce-500',
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            sizes.input,
            size === 'sm' ? 'pl-9' : 'pl-11',
            showClear ? sizes.padRightClear : sizes.padRightEmpty,
            inputClassName,
          )}
          {...rest}
        />
        {showClear ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full text-ash-grey-500 transition hover:bg-blue-spruce-50 hover:text-blue-spruce-700',
              sizes.clear,
            )}>
            <ClearIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
});
