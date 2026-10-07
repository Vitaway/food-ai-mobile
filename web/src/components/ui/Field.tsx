import { cn } from '@/lib/utils';
import {
  Select,
  selectOptionsFromChildren,
  syntheticSelectChange,
  type SelectOption,
  type SelectSize,
} from '@/components/ui/Select';
import type {
  ChangeEvent,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  /** `line` = bottom border only (auth / marketing). Dashboard keeps `default`. */
  variant?: 'default' | 'line';
};

export function FieldLabel({
  children,
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-sm font-medium text-ash-grey-700', className)} {...props}>
      {children}
    </label>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  variant = 'default',
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const line = variant === 'line';
  return (
    <div>
      <FieldLabel className={line ? 'text-mira-green' : undefined}>{label}</FieldLabel>
      <input
        className={cn(
          line
            ? 'mira-input-line'
            : 'w-full rounded-2xl border border-ash-grey-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-ash-grey-400 focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100',
          line && error && 'mira-input-line--error',
          !line && error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p className={cn('mt-1.5 text-xs', line ? 'text-mira-muted' : 'text-ash-grey-500')}>{hint}</p>
      ) : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  variant = 'default',
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const line = variant === 'line';
  return (
    <div>
      <FieldLabel className={line ? 'text-mira-green' : undefined}>{label}</FieldLabel>
      <textarea
        className={cn(
          line
            ? 'mira-input-line min-h-28 resize-y'
            : 'min-h-28 w-full resize-y rounded-2xl border border-ash-grey-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-ash-grey-400 focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100',
          line && error && 'mira-input-line--error',
          !line && error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p className={cn('mt-1.5 text-xs', line ? 'text-mira-muted' : 'text-ash-grey-500')}>{hint}</p>
      ) : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

type SelectFieldProps = FieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> & {
    size?: SelectSize;
    options?: readonly SelectOption[];
    children?: ReactNode;
    placeholder?: string;
    onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** Prefer this for new code; receives the selected string value directly. */
    onValueChange?: (value: string) => void;
  };

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  options,
  size = 'md',
  value,
  disabled,
  placeholder,
  name,
  id,
  onChange,
  onValueChange,
  variant = 'default',
}: SelectFieldProps) {
  const resolvedOptions = options ?? selectOptionsFromChildren(children);
  const line = variant === 'line';

  if (line) {
    return (
      <div>
        <FieldLabel htmlFor={id} className="text-mira-green">
          {label}
        </FieldLabel>
        <select
          id={id}
          name={name}
          disabled={disabled}
          value={value == null ? '' : String(value)}
          onChange={(e) => {
            onValueChange?.(e.target.value);
            onChange?.(e);
          }}
          className={cn('mira-select-line', error && 'mira-input-line--error', className)}>
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {resolvedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error ? <p className="mt-1.5 text-xs text-mira-muted">{hint}</p> : null}
        {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        id={id}
        name={name}
        value={value == null ? '' : String(value)}
        onChange={(next) => {
          onValueChange?.(next);
          onChange?.(syntheticSelectChange(next, name));
        }}
        options={resolvedOptions}
        placeholder={placeholder}
        disabled={disabled}
        error={Boolean(error)}
        size={size}
        className={className}
      />
      {hint && !error ? <p className="mt-1.5 text-xs text-ash-grey-500">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export type { SelectOption, SelectSize };
