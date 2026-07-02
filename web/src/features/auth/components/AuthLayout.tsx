import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Primary CTA below the white card (on the gradient). */
  actions?: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, actions, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#16304D] via-[#1A3A5C] to-[#21466B] px-4 py-10 sm:px-6 sm:py-14">
      <Link
        to="/"
        className="flex flex-col items-center text-center transition-opacity hover:opacity-90">
        <img
          src="/mirafood-logo.png"
          alt=""
          className="h-[72px] w-[72px] rounded-full object-contain"
          aria-hidden
        />
        <span className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/50">by Vitaway</span>
      </Link>

      <div className="mt-8 max-w-md text-center">
        <h1 className="text-3xl tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-base leading-relaxed text-white/75">{subtitle}</p>
      </div>

      <div className="mt-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-8">{children}</div>

      {actions ? <div className="mt-6 w-full max-w-md">{actions}</div> : null}

      {footer ? <div className="mt-8 w-full max-w-md text-center text-sm text-white/75">{footer}</div> : null}
    </div>
  );
}
