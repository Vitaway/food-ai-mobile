import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { Button } from '@/components/ui/Button';
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '@/constants/contact';

const mainNav = [
  { to: '/for-patients', label: 'Patients' },
  { to: '/for-coaches', label: 'Coaches' },
  { to: '/for-clinics', label: 'Clinics' },
  { to: '/features', label: 'Features' },
  { to: '/download', label: 'Get app' },
  { to: '/support', label: 'Support' },
];

const NAV_BLUE_PATHS = [
  '/features',
  '/download',
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

const HIDE_PRE_FOOTER_PATHS = [
  '/download',
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
  const isHome = location.pathname === '/';
  const hidePreFooterCta = HIDE_PRE_FOOTER_PATHS.includes(location.pathname);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navBlue = scrolled || NAV_BLUE_PATHS.includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Utility bar */}
      <div
        className={cn(
          'hidden border-b sm:block transition-colors duration-300',
          navBlue
            ? 'border-blue-spruce-700 bg-blue-spruce-700 text-white/75'
            : 'border-ash-grey-200 bg-ash-grey-50 text-ash-grey-600',
        )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/support"
              className={cn(
                'font-normal transition-colors',
                navBlue ? 'hover:text-white' : 'hover:text-blue-spruce-600',
              )}>
              Customer support
            </Link>
            <a
              href="mailto:hello@vitaway.org"
              className={cn(
                'font-normal transition-colors',
                navBlue ? 'hover:text-white' : 'hover:text-blue-spruce-600',
              )}>
              Contact us
            </a>
            <Link
              to="/privacy"
              className={cn(
                'font-normal transition-colors',
                navBlue ? 'hover:text-white' : 'hover:text-blue-spruce-600',
              )}>
              Privacy
            </Link>
            <Link
              to="/terms"
              className={cn(
                'font-normal transition-colors',
                navBlue ? 'hover:text-white' : 'hover:text-blue-spruce-600',
              )}>
              Terms
            </Link>
          </div>
          <a
            href={`tel:${SUPPORT_PHONE_TEL}`}
            className={cn(
              'font-normal transition-colors',
              navBlue ? 'hover:text-white' : 'hover:text-blue-spruce-600',
            )}>
            {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </div>

      {/* Announcement */}
      {isHome ? (
        <div className="bg-shamrock-600 px-4 py-2.5 text-center text-sm font-normal text-white">
          <span>Coach-verified nutrition for patients, coaches, and clinics — </span>
          <Link to="/clinical-evidence" className="underline underline-offset-2 hover:text-shamrock-100">
            See our clinical approach
          </Link>
        </div>
      ) : null}

      {/* Main nav */}
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-colors duration-300',
          navBlue
            ? 'border-blue-spruce-700 bg-blue-spruce-600 text-white shadow-md'
            : 'border-ash-grey-200 bg-white/95 text-ash-grey-900 backdrop-blur-md',
        )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <MiraFoodLogo variant={navBlue ? 'light' : 'dark'} />

          <nav className="hidden items-center gap-1 md:flex">
            {mainNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-normal transition-colors',
                  navBlue
                    ? location.pathname === item.to
                      ? 'bg-white/15 text-white'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                    : location.pathname === item.to
                      ? 'bg-blue-spruce-50 text-blue-spruce-700'
                      : 'text-ash-grey-700 hover:bg-ash-grey-50 hover:text-blue-spruce-700',
                )}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button to="/login" variant="primary" size="sm">
              My account
            </Button>
          </div>
        </div>

        <nav
          className={cn(
            'flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden',
            navBlue ? 'border-white/10' : 'border-ash-grey-100',
          )}>
          {mainNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'shrink-0 rounded-xl px-3 py-2 text-sm font-normal transition-colors',
                navBlue
                  ? location.pathname === item.to
                    ? 'bg-white/15 text-white'
                    : 'text-white/85'
                  : location.pathname === item.to
                    ? 'bg-blue-spruce-50 text-blue-spruce-700'
                    : 'text-ash-grey-600',
              )}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Pre-footer CTA — hidden on download page */}
      {!hidePreFooterCta ? (
        <section className="bg-blue-spruce-600 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="max-w-xl">
              <h2 className="text-3xl tracking-tight sm:text-4xl">
                Get started
              </h2>
              <p className="mt-3 text-lg text-white/80">
                Download MiraFood for iOS and Android. Snap meals, track macros, and get coach-verified
                nutrition insights.
              </p>
              <Button to="/download" variant="outline-light" size="md" className="mt-6">
                Go to download page
              </Button>
            </div>
            <AppStoreBadges className="items-center lg:items-end" />
          </div>
        </section>
      ) : null}

      <MarketingFooter />
    </div>
  );
}
