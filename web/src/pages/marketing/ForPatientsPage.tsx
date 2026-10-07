import { Link } from 'react-router-dom';
import { APP_STORE_URL, AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { StagedAppShot } from '@/components/marketing/CrescentStage';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { patientFaqs } from '@/constants/marketingContent';
import { appImage } from '@/constants/appImages';

const patientSteps = [
  {
    title: 'Download & register',
    desc: 'Create your account and receive a Vitaway patient file ID linked to your health profile.',
  },
  {
    title: 'Log meals your way',
    desc: 'Photo, gallery, or text; add notes when the picture needs context.',
  },
  {
    title: 'Coach reviews every meal',
    desc: 'AI estimates nutrition first; your coach approves before it counts in your diary.',
  },
  {
    title: 'Track & improve',
    desc: 'Macros, water, streaks, and insights help you stay on goal between visits.',
  },
];

export function ForPatientsPage() {
  return (
    <div>
      <MarketingPageHero
        title="For patients"
        description="Snap your meals, understand your nutrition, and trust what’s in your diary; because a coach verifies every approved entry."
      />

      <section className="px-1 py-12 sm:px-2">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-mira-green">
              Your nutrition, verified
            </h2>
            <p className="mt-4 text-base leading-relaxed text-mira-muted">
              MiraFood is built for people who want more than a calorie counter. AI makes logging
              fast; your coach makes the numbers trustworthy.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-mira-muted">
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Patient file ID for your care team
              </li>
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Meals hidden from diary totals until coach-approved
              </li>
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Personalized macro and water targets from onboarding
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mira-btn mira-btn--black">
                Download the app
              </a>
              <Link to="/clinical-evidence" className="mira-btn mira-btn--outline">
                How we work
              </Link>
            </div>
          </div>
          <StagedAppShot {...appImage('home')} size="md" />
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-mira-green">
          How it works for you
        </h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {patientSteps.map((step, index) => (
            <div key={step.title} className="rounded-[1.25rem] bg-mira-green p-6 text-white">
              <span className="text-2xl font-semibold">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="rounded-[1.5rem] bg-mira-green px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-semibold">Ready to start?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
            Available on iPhone and Android. Search &quot;MiraFood Vitaway&quot; in your app store.
          </p>
          <div className="mt-6 flex justify-center">
            <AppStoreBadgesLight className="[&_img]:brightness-0 [&_img]:invert [&_a]:ring-white/25" />
          </div>
          <p className="mt-6 text-sm text-white/70">
            Questions?{' '}
            <Link to="/support" className="text-white underline underline-offset-2">
              Visit support
            </Link>
          </p>
        </div>
      </section>

      <AudienceQASection items={patientFaqs} />
    </div>
  );
}
