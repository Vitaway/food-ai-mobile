import { CONTACT_EMAIL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '@/constants/contact';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
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
    a: 'Open MiraFood → Profile → Data & privacy → Delete account. Or use the web form at mirafood.vitaway.org/delete-account if you cannot open the app.',
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
    <div>
      <MarketingPageHero
        title="Support"
        description="Help with the app, coach accounts, and your data."
      />

      <section className="px-1 py-12 sm:px-2">
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactFormCard defaultTopic="Technical support" />

          <div className="rounded-[1.5rem] bg-mira-black p-8 text-white">
            <h2 className="text-xl font-semibold">Other ways to reach us</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-white/55">Email</dt>
                <dd>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-white hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-white/55">Phone</dt>
                <dd>
                  <a href={`tel:${SUPPORT_PHONE_TEL}`} className="text-white hover:underline">
                    {SUPPORT_PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-white/55">Coach dashboard</dt>
                <dd>
                  <Link to="/login" className="text-white hover:underline">
                    Open coach login
                  </Link>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-white/55">We aim to respond within 2 business days.</p>
          </div>
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="rounded-[1.5rem] bg-mira-green p-6 text-white sm:p-10">
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/70">
            Quick answers about downloading MiraFood, coach review, privacy, and your account.
          </p>

          <div className="mt-10 divide-y divide-white/15">
            {faqs.map((item, i) => {
              const open = openIndex === i;
              return (
                <div key={item.q} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                    aria-expanded={open}>
                    <span className="text-base sm:text-lg">{item.q}</span>
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-black text-white transition-transform',
                        open && 'rotate-45',
                      )}
                      aria-hidden>
                      +
                    </span>
                  </button>
                  {open ? (
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{item.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
