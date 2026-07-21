import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_STORE_URL } from '@/components/marketing/AppStoreBadges';
import { CONTACT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '@/constants/contact';

const menuLinks = [
  { to: '/for-patients', label: 'Patients' },
  { to: '/for-coaches', label: 'Coaches' },
  { to: '/for-clinics', label: 'Clinics' },
  { to: '/clinical-evidence', label: 'Clinical evidence' },
];

const productLinks = [
  { to: '/login', label: 'Sign in' },
  { to: '/support', label: 'Support' },
  { to: '/register', label: 'Get the app' },
  { href: 'https://vitaway.org', label: 'Vitaway' },
];

const legalLinks = [
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/medical-disclaimer', label: 'Disclaimer' },
  { to: '/cookie-policy', label: 'Cookies' },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ to?: string; href?: string; label: string }>;
}) {
  return (
    <div>
      <p className="text-xs font-normal uppercase tracking-[0.22em] text-white/45">{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/85 transition-colors hover:text-white">
                {item.label}
              </a>
            ) : (
              <Link
                to={item.to!}
                className="text-sm text-white/85 transition-colors hover:text-white">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10">
      {children}
    </a>
  );
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-black text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <SocialIcon href="https://www.instagram.com/vitaway" label="Instagram">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://x.com/vitaway" label="X">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.717-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://www.youtube.com/@vitaway" label="YouTube">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                </svg>
              </SocialIcon>
            </div>

            <div className="mt-8 space-y-2 text-sm leading-relaxed text-white/80">
              <p>Kigali, Rwanda</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="block transition-colors hover:text-white">
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="block transition-colors hover:text-white">
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            <FooterColumn title="Menu" links={menuLinks} />
            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Legal" links={legalLinks} />
          </div>
        </div>

        <div className="relative mt-14 lg:mt-16">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" aria-hidden />
          <div className="relative flex justify-end">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-white px-6 py-2.5 text-sm font-normal text-black transition-opacity hover:opacity-90">
              Get started
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 pb-8 sm:mt-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-white/55">
            AI-powered meal logging with human coach review. Clinical-grade nutrition you can trust —
            built for patients, coaches, and care teams.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms & conditions
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy policy
            </Link>
            <a
              href="https://keyypress.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white">
              Built by KEYYPRESS
            </a>
          </div>
        </div>

        <p className="pb-4 text-center text-[10px] leading-relaxed text-white/35">
          © {year} Vitaway. MiraFood is not a medical device. Nutrition insights are educational —
          consult a healthcare professional for medical advice.
        </p>
      </div>

      <div
        className="pointer-events-none relative z-0 select-none overflow-hidden pb-2 pt-2"
        aria-hidden>
        <p className="whitespace-nowrap text-center text-[clamp(4.5rem,18vw,12rem)] font-normal leading-none tracking-tight text-white/[0.07]">
          MiraFood — Vitaway
        </p>
      </div>
    </footer>
  );
}
