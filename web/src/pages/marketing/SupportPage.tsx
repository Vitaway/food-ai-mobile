import { CONTACT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '@/constants/contact';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { MARKETING_SUPPORT_FAQ_IMAGE } from '@/constants/marketingImages';
import { supportFaqsExtra } from '@/constants/marketingContent';

const faqs = [
  {
    q: 'How do I download MiraFood?',
    a: 'MiraFood is available on the Apple App Store and Google Play. Search "MiraFood Vitaway" in your store to install the app.',
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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
                <dt className="font-normal text-ash-grey-700">Email</dt>
                <dd>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-spruce-600">
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-normal text-ash-grey-700">Phone</dt>
                <dd>
                  <a href={`tel:${SUPPORT_PHONE_TEL}`} className="text-blue-spruce-600">
                    {SUPPORT_PHONE_DISPLAY}
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

      <section
        className="relative isolate overflow-hidden py-20 sm:py-28"
        style={{
          backgroundImage: `url('${MARKETING_SUPPORT_FAQ_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}>
        <div className="absolute inset-0 bg-ash-grey-950/45" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-ash-grey-950/25 via-transparent to-ash-grey-950/55" aria-hidden />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:max-w-6xl lg:px-8">
          <div className="rounded-[2rem] border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-md sm:rounded-[2.5rem] sm:p-10">
            <h2 className="text-center text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ash-grey-600">
              Quick answers about downloading MiraFood, coach review, privacy, and your account.
            </p>

            <div className="mt-10 divide-y divide-ash-grey-200">
              {faqs.map((item, i) => {
                const open = openIndex === i;
                return (
                  <div key={item.q} className="py-4 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(open ? null : i)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                      aria-expanded={open}>
                      <span className="text-base text-ash-grey-900 sm:text-lg">{item.q}</span>
                      <span
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ash-grey-100 text-ash-grey-800 transition-transform',
                          open && 'rotate-45 bg-blue-spruce-600 text-white',
                        )}
                        aria-hidden>
                        +
                      </span>
                    </button>
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows] duration-300 ease-out',
                        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                      )}>
                      <div className="overflow-hidden">
                        <p className="pt-3 text-sm leading-relaxed text-ash-grey-600">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-sm text-ash-grey-500">
              See also:{' '}
              <Link to="/legal" className="text-blue-spruce-600 hover:underline">
                Legal hub
              </Link>
              {' · '}
              <Link to="/privacy" className="text-blue-spruce-600 hover:underline">
                Privacy
              </Link>
              {' · '}
              <Link to="/terms" className="text-blue-spruce-600 hover:underline">
                Terms
              </Link>
              {' · '}
              <Link to="/delete-account" className="text-blue-spruce-600 hover:underline">
                Delete account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
