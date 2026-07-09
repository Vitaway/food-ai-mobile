import { AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { appImage } from '@/constants/appImages';
import { supportFaqsExtra } from '@/constants/marketingContent';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'How do I download MiraFood?',
    a: 'MiraFood is available on the Apple App Store and Google Play. Visit our download page or search "MiraFood Vitaway" in your store.',
  },
  {
    q: 'How does coach review work?',
    a: 'After you log a meal, AI analyzes it and sends it to a nutrition coach. Meals stay hidden in your diary until a coach approves the nutrition data.',
  },
  {
    q: 'Is MiraFood a replacement for a dietitian or doctor?',
    a: 'No. MiraFood is an educational tool. Always consult a healthcare professional for medical advice. See our medical disclaimer.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Open MiraFood → Profile → Data & privacy → Delete account. You can also follow the steps on our delete account page.',
  },
  {
    q: 'What permissions does the app need?',
    a: 'Camera and photo library (meal logging), notifications (meal updates and reminders), and optionally biometrics (app lock).',
  },
  ...supportFaqsExtra,
];

export function SupportPage() {
  return (
    <div className="bg-ash-grey-50">
      <MarketingPageHero
        title="Support"
        description="Help with the app, coach accounts, and your data."
      />

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <ContactFormCard defaultTopic="Technical support" />

          <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl text-ash-grey-900">Other ways to reach us</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-normal text-ash-grey-700">General support</dt>
                <dd>
                  <a href="mailto:support@vitaway.org" className="text-blue-spruce-600">
                    support@vitaway.org
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-normal text-ash-grey-700">Privacy requests</dt>
                <dd>
                  <a href="mailto:privacy@vitaway.org" className="text-blue-spruce-600">
                    privacy@vitaway.org
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-normal text-ash-grey-700">Legal</dt>
                <dd>
                  <a href="mailto:legal@vitaway.org" className="text-blue-spruce-600">
                    legal@vitaway.org
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-normal text-ash-grey-700">Business & partnerships</dt>
                <dd>
                  <a href="mailto:hello@vitaway.org" className="text-blue-spruce-600">
                    hello@vitaway.org
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-normal text-ash-grey-700">Coach dashboard</dt>
                <dd>
                  <Link to="/login" className="text-blue-spruce-600">
                    Open coach login
                  </Link>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-ash-grey-500">
              We aim to respond within 2 business days.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-ash-grey-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-xl text-ash-grey-900">Download the app</h2>
              <p className="mt-3 text-sm text-ash-grey-600">
                Get MiraFood on your phone to start logging meals and tracking your goals.
              </p>
              <div className="mt-6">
                <AppStoreBadgesLight />
              </div>
              <Link to="/download" className="mt-4 inline-block text-sm text-blue-spruce-600 hover:underline">
                Go to download page →
              </Link>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('home')} variant="light" size="md" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ash-grey-200 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl text-ash-grey-900">Frequently asked questions</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((item) => (
              <div key={item.q} className="border-b border-ash-grey-100 pb-6">
                <h3 className="text-ash-grey-900">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-ash-grey-500">
            See also:{' '}
            <Link to="/legal" className="text-blue-spruce-600">
              All legal & policy pages
            </Link>
            {' · '}
            <Link to="/privacy" className="text-blue-spruce-600">
              Privacy Policy
            </Link>
            {' · '}
            <Link to="/terms" className="text-blue-spruce-600">
              Terms of Service
            </Link>
            {' · '}
            <Link to="/medical-disclaimer" className="text-blue-spruce-600">
              Medical disclaimer
            </Link>
            {' · '}
            <Link to="/delete-account" className="text-blue-spruce-600">
              Delete account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
