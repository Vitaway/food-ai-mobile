import { Link } from 'react-router-dom';
import { MiraFoodLogo } from '@/components/marketing/MiraFoodLogo';
import { FooterHalftoneScene } from '@/components/marketing/FooterHalftoneScene';

const footerProducts = [
  { to: '/download', label: 'Download app' },
  { to: '/features', label: 'Features' },
  { to: '/for-coaches', label: 'For coaches' },
  { to: '/coach/login', label: 'Coach dashboard' },
];

const footerLegal = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/medical-disclaimer', label: 'Medical disclaimer' },
  { to: '/delete-account', label: 'Delete account' },
  { to: '/legal', label: 'Legal hub' },
  { to: '/cookie-policy', label: 'Cookie policy' },
  { to: '/support', label: 'Support' },
];

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.24em] text-ash-grey-400">{title}</p>
      <ul className="mt-5 space-y-2.5">
        {links.map((item) => (
          <li key={item.to + item.label}>
            <Link
              to={item.to}
              className="text-sm text-ash-grey-700 transition-colors hover:text-blue-spruce-600">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-ash-grey-200/80 bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <MiraFoodLogo />
              <span className="hidden h-8 w-px bg-ash-grey-300 sm:block" aria-hidden />
              <span className="text-base tracking-tight text-ash-grey-700">Vitaway</span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ash-grey-600">
              AI-powered meal logging with human coach review. Built for people who want accurate
              nutrition without the guesswork.
            </p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 sm:gap-10 lg:pt-1">
            <FooterLinkColumn title="Product" links={footerProducts} />
            <FooterLinkColumn title="Legal" links={footerLegal} />
          </div>
        </div>

        <div className="mt-14 border-t border-ash-grey-300/60 pt-6 lg:mt-16">
          <div className="flex flex-col items-start justify-between gap-5 text-[10px] uppercase tracking-[0.16em] text-ash-grey-500 sm:flex-row sm:items-center">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 leading-relaxed">
              <span>© {year} Vitaway</span>
              <span className="text-ash-grey-300" aria-hidden>
                ·
              </span>
              <a
                href="https://vitaway.com"
                className="transition-colors hover:text-blue-spruce-600"
                target="_blank"
                rel="noopener noreferrer">
                vitaway.com
              </a>
              <span className="text-ash-grey-300" aria-hidden>
                ·
              </span>
              <a href="mailto:support@vitaway.com" className="transition-colors hover:text-blue-spruce-600">
                support@vitaway.com
              </a>
            </p>

            <a
                href="https://keyypress.com"
                className="transition-colors hover:text-blue-spruce-600"
                target="_blank"
                rel="noopener noreferrer">
                Built by KEYYPRESS
              </a>
          </div>
        </div>

        <p className="mt-5 pb-4 text-center text-[10px] leading-relaxed tracking-wide text-ash-grey-400">
          MiraFood is not a medical device. Nutrition insights are educational — consult a healthcare
          professional for medical advice.
        </p>
      </div>

      <FooterHalftoneScene />
    </footer>
  );
}
