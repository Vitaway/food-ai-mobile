import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_STORE_URL } from '@/components/marketing/AppStoreBadges';
import { CONTACT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '@/constants/contact';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';

const menuLinks = [
  { to: '/for-patients', label: 'Patients' },
  { to: '/for-coaches', label: 'Coaches' },
  { to: '/for-clinics', label: 'Clinics' },
  { to: '/clinical-evidence', label: 'Clinical evidence' },
];

const productLinks = [
  { to: '/login', label: 'Login' },
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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/75 transition-colors hover:text-white">
                {item.label}
              </a>
            ) : (
              <Link
                to={item.to!}
                className="text-sm text-white/75 transition-colors hover:text-white">
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] bg-white/10 text-white transition-colors hover:bg-white/20">
      {children}
    </a>
  );
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 bg-black text-white">
      <div className="px-1 py-12 sm:px-2 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.5fr] lg:gap-14">
          <div>
            <MiraFoodLogo variant="light" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              AI meal logging with human coach review — built for patients, coaches, and care teams.
            </p>
            <div className="mt-6 flex items-center gap-2">
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
            </div>
            <div className="mt-6 space-y-1 text-sm text-white/55">
              <a href={`mailto:${CONTACT_EMAIL}`} className="block hover:text-white">
                {CONTACT_EMAIL}
              </a>
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="block hover:text-white">
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="Menu" links={menuLinks} />
            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Legal" links={legalLinks} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/35">
            © {year} Vitaway. MiraFood is not a medical device.
          </p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mira-btn mira-btn--green w-fit">
            Get started
          </a>
        </div>
      </div>
    </footer>
  );
}
