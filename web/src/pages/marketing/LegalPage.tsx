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
    desc: 'MiraFood is not medical advice — important health information.',
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
    <div className="bg-ash-grey-50">
      <MarketingPageHero
        title="Legal"
        description="Privacy, terms, support, and your data on MiraFood."
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
          {legalPages.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="rounded-3xl border border-ash-grey-200 bg-white p-6 transition-shadow hover:shadow-md">
              <h2 className="text-lg text-ash-grey-900">{page.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{page.desc}</p>
              <span className="mt-4 inline-block text-sm text-blue-spruce-600">Read more →</span>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-7xl px-4 text-center text-sm text-ash-grey-600 sm:px-6 lg:px-8">
          <p>
            Questions? Email{' '}
            <a href="mailto:hello@vitaway.org" className="text-blue-spruce-600">
              hello@vitaway.org
            </a>{' '}
            or{' '}
            <a href="mailto:hello@vitaway.org" className="text-blue-spruce-600">
              hello@vitaway.org
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
