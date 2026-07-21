import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';
import { MARKETING_HERO_IMAGE } from '@/constants/marketingImages';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Primary CTA under the form fields. */
  actions?: ReactNode;
  footer?: ReactNode;
  /** Short line on the brand panel (desktop). */
  brandLine?: string;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  actions,
  footer,
  brandLine = 'Coach-verified nutrition for patients, coaches, and clinics.',
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <aside
        className="relative flex shrink-0 flex-col justify-between overflow-hidden bg-blue-spruce-800 px-6 py-8 text-white sm:px-10 sm:py-10 lg:w-[44%] lg:min-h-screen lg:px-12 lg:py-14"
        style={{
          backgroundImage: `url('${MARKETING_HERO_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="absolute inset-0 bg-blue-spruce-950/60" aria-hidden />

        <div className="relative">
          <MiraFoodLogo variant="light" />
        </div>

        <div className="relative mt-10 hidden max-w-md lg:mt-0 lg:block">
          <h2 className="text-4xl leading-tight tracking-tight text-white xl:text-5xl">
            Trust what&apos;s in your diary
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">{brandLine}</p>
        </div>

        <p className="relative mt-8 hidden text-sm text-white/50 lg:block">
          MiraFood by Vitaway
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 flex-col justify-center bg-ash-grey-50 px-4 py-10 sm:px-8 sm:py-14 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex text-sm text-ash-grey-500 transition-colors hover:text-blue-spruce-600 lg:hidden">
            ← Back to MiraFood
          </Link>

          <div className="rounded-[1.75rem] border border-ash-grey-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h1 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-ash-grey-600 sm:text-base">{subtitle}</p>
            </div>

            {children}

            {actions ? <div className="mt-6">{actions}</div> : null}
          </div>

          {footer ? (
            <div className="mt-6 text-center text-sm text-ash-grey-600">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
