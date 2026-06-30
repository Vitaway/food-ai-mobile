import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'outline-light' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

type ButtonProps = BaseProps &
  (
    | (Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
        to?: never;
        href?: never;
        target?: never;
      })
    | ({ to: string; href?: never; target?: never } & Omit<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        keyof BaseProps | 'href'
      >)
    | ({ href: string; to?: never; target?: string } & Omit<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        keyof BaseProps | 'href'
      >)
  );

const variantClasses: Record<Variant, string> = {
  primary: 'brutal-btn--primary',
  secondary: 'brutal-btn--secondary',
  outline: 'brutal-btn--outline',
  'outline-light': 'brutal-btn--outline-light',
  ghost: 'brutal-btn--ghost',
  danger: 'brutal-btn--danger',
};

const sizeClasses: Record<Size, string> = {
  sm: 'brutal-btn__face--sm',
  md: 'brutal-btn__face--md',
  lg: 'brutal-btn__face--lg',
};

function ButtonFace({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
}: BaseProps) {
  return (
    <span
      className={cn('brutal-btn', variantClasses[variant], fullWidth && 'brutal-btn--block', className)}>
      <span
        className={cn('brutal-btn__face', sizeClasses[size], fullWidth && 'brutal-btn__face--full')}>
        {children}
      </span>
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      children,
      className = '',
      onClick,
    } = props;

    const content = (
      <ButtonFace variant={variant} size={size} fullWidth={fullWidth} className={className}>
        {children}
      </ButtonFace>
    );

    if ('to' in props && props.to) {
      return (
        <Link
          to={props.to}
          ref={ref as React.Ref<HTMLAnchorElement>}
          onClick={onClick}
          className={cn('brutal-btn-host', fullWidth && 'brutal-btn-host--block')}>
          {content}
        </Link>
      );
    }

    if ('href' in props && props.href) {
      const isExternal =
        props.href.startsWith('http') ||
        props.href.startsWith('mailto') ||
        props.href.startsWith('tel');
      const target = props.target ?? (isExternal ? '_blank' : undefined);
      return (
        <a
          href={props.href}
          target={target}
          ref={ref as React.Ref<HTMLAnchorElement>}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={onClick}
          className={cn('brutal-btn-host', fullWidth && 'brutal-btn-host--block')}>
          {content}
        </a>
      );
    }

    const {
      variant: _v,
      size: _s,
      fullWidth: _f,
      children: _c,
      className: _c2,
      onClick: _onClick,
      ...buttonProps
    } = props as BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        {...buttonProps}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
        className={cn(
          'brutal-btn-host cursor-pointer border-0 bg-transparent p-0 font-inherit disabled:cursor-not-allowed',
          fullWidth && 'brutal-btn-host--block',
        )}>
        {content}
      </button>
    );
  },
);
