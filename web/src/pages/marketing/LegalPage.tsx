import { Link } from 'react-router-dom';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';

const legalPages = [
  {
    to: '/privacy',
    title: 'Privacy Policy',
    desc: 'How we collect, use, and protect your personal and health data.',
  },
  {
    to: '/terms',
    title: 'Terms of Service',
    desc: 'Rules for using MiraFood, including eligibility and acceptable use.',
  },
  {
    to: '/medical-disclaimer',
    title: 'Medical disclaimer',
    desc: 'MiraFood is not medical advice; important health information.',
  },
  {
    to: '/cookie-policy',
    title: 'Cookie policy',
    desc: 'How this website uses cookies and similar technologies.',
  },
  {
    to: '/delete-account',
    title: 'Delete your account',
    desc: 'How to permanently delete your MiraFood account and data.',
  },
  {
    to: '/support',
    title: 'Customer support',
    desc: 'Contact us, FAQs, and help with the app.',
  },
];

export function LegalPage() {
  return (
    <div>
      <MarketingPageHero
        title="Legal"
        description="Privacy, terms, support, and your data on MiraFood."
      />

      <section className="px-1 pb-12 sm:px-2 sm:pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {legalPages.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="rounded-[1.25rem] bg-mira-green p-6 text-white transition-colors hover:bg-mira-green-dark">
              <h2 className="text-lg font-semibold">{page.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{page.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-white">Read more →</span>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-mira-muted">
          Questions? Email{' '}
          <a href="mailto:support@vitaway.org" className="text-mira-green hover:underline">
            support@vitaway.org
          </a>
        </p>
      </section>
    </div>
  );
}
