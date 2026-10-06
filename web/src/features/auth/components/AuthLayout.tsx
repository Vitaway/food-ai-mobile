import type { ReactNode } from 'react';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';
import { SocialAuthButtons } from '@/features/auth/components/SocialAuthButtons';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  brandLine?: string;
  /** Show Google / Apple continue buttons (default true). */
  showSocial?: boolean;
};

/** Full-bleed mint auth — logo only in header (no back link). */
export function AuthLayout({
  title,
  subtitle,
  children,
  actions,
  footer,
  showSocial = true,
}: AuthLayoutProps) {
  return (
    <div className="mira-frame">
      <div className="mira-card">
        <header className="flex items-center bg-transparent px-1 py-5 sm:px-2">
          <MiraFoodLogo variant="dark" />
        </header>

        <div className="flex flex-1 flex-col justify-center bg-mira-mint px-1 py-12 sm:px-2 sm:py-16">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-mira-muted sm:text-base">{subtitle}</p>

            <div className="mt-8">{children}</div>

            {actions ? <div className="mt-8">{actions}</div> : null}

            {showSocial ? (
              <div className="mt-8">
                <SocialAuthButtons />
              </div>
            ) : null}

            {footer ? (
              <div className="mt-8 text-center text-sm text-mira-muted">{footer}</div>
            ) : null}
          </div>
        </div>

        <div className="bg-black px-5 py-4 text-center text-xs text-white/40">
          MiraFood by Vitaway
        </div>
      </div>
    </div>
  );
}
