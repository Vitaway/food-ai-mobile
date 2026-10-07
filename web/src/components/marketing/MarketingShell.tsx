import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { LoginIcon } from '@/components/icons/LoginIcon';

const mainNav = [
  { to: '/for-patients', label: 'Patients' },
  { to: '/for-coaches', label: 'Coaches' },
  { to: '/for-clinics', label: 'Clinics' },
  { to: '/support', label: 'Support' },
];

const HIDE_PRE_FOOTER_PATHS = [
  '/support',
  '/for-patients',
  '/for-coaches',
  '/for-clinics',
  '/clinical-evidence',
  '/legal',
  '/privacy',
  '/terms',
  '/medical-disclaimer',
  '/cookie-policy',
  '/delete-account',
];

export function MarketingShell() {
  const location = useLocation();
  const hidePreFooterCta = HIDE_PRE_FOOTER_PATHS.includes(location.pathname);

  return (
    <div className="mira-frame text-mira-green">
      <div className="mira-card">
        <header className="relative z-50 shrink-0 bg-transparent">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-1 py-5 sm:px-2">
            <MiraFoodLogo variant="dark" />

            <nav className="order-3 flex w-full items-center justify-center gap-5 overflow-x-auto sm:order-none sm:w-auto sm:justify-start md:gap-8">
              {mainNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'shrink-0 text-sm font-medium transition-colors',
                    location.pathname === item.to
                      ? 'text-mira-green'
                      : 'text-mira-green/70 hover:text-mira-green',
                  )}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/login" className="mira-nav-cta mira-nav-cta--login">
                <LoginIcon />
                Login
              </Link>
              <Link to="/register" className="mira-nav-cta mira-nav-cta--start">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Get started
              </Link>
            </div>
          </div>
        </header>

        <main className="relative flex-1 bg-mira-mint">
          <Outlet />
        </main>

        {!hidePreFooterCta ? (
          <section className="bg-mira-mint px-1 pb-10 pt-4 sm:px-2">
            <div className="flex flex-col items-center gap-6 rounded-[4px] bg-mira-green px-6 py-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Get MiraFood on your phone
                </h2>
                <p className="mt-2 text-sm text-white/70 sm:text-base">
                  Snap meals, track macros, and get coach-verified nutrition.
                </p>
              </div>
              <AppStoreBadges />
            </div>
          </section>
        ) : null}

        <MarketingFooter />
      </div>
    </div>
  );
}
