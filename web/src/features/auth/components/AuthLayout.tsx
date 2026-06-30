import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ash-grey-50 lg:flex-row">
      <aside className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-blue-spruce-600 px-6 py-12 text-white sm:min-h-[280px] lg:min-h-screen lg:w-[44%] lg:px-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-shamrock-500/10" />

        <Link
          to="/"
          className="relative flex flex-col items-center gap-5 text-center transition-opacity hover:opacity-90">
          <img
            src="/mirafood-logo.png"
            alt=""
            className="h-20 w-20 rounded-2xl object-contain sm:h-24 sm:w-24"
            aria-hidden
          />
          <div className="leading-tight">
            <span className="block text-2xl tracking-tight sm:text-3xl">MiraFood</span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-white/60">
              by Vitaway
            </span>
          </div>
        </Link>
      </aside>

      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-16 lg:py-14">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl tracking-tight text-ash-grey-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{subtitle}</p>
          </div>

          {children}

          {footer ? <div className="mt-8 border-t border-ash-grey-200 pt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
