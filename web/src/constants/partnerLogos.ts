export type PartnerLogo = {
  name: string;
  src: string;
  href?: string;
  /** Wider logos (e.g. ministry banners) */
  wide?: boolean;
};

/** Rwandan health & institutional partners — logos in /public/partner-logos */
export const PARTNER_LOGOS: PartnerLogo[] = [
  {
    name: 'Vitaway Health',
    src: '/partner-logos/vitaway.png',
    href: 'https://www.vitaway.org',
  },
  {
    name: 'Ministry of Health Rwanda',
    src: '/partner-logos/moh.png',
    href: 'https://www.moh.gov.rw',
    wide: true,
  },
  {
    name: 'Rwanda Biomedical Centre',
    src: '/partner-logos/rbc.png',
    href: 'https://www.rbc.gov.rw',
  },
  {
    name: 'Rwanda Social Security Board',
    src: '/partner-logos/rssb.svg',
    href: 'https://www.rssb.rw',
  },
  {
    name: 'MiraFood',
    src: '/partner-logos/mirafood.png',
  },
];
