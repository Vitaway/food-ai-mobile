import { Link } from 'react-router-dom';
import { AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { Button } from '@/components/ui/Button';
import { patientFaqs } from '@/constants/marketingContent';
import { appImage } from '@/constants/appImages';

const patientSteps = [
  {
    title: 'Download & register',
    desc: 'Create your account and receive a Vitaway patient file ID linked to your health profile.',
  },
  {
    title: 'Log meals your way',
    desc: 'Photo, gallery, or text — add notes when the picture needs context.',
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
    <div className="bg-white">
      <MarketingPageHero
        title="For patients"
        description="Snap your meals, understand your nutrition, and trust what’s in your diary — because a coach verifies every approved entry."
      />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900">Your nutrition, verified</h2>
              <p className="mt-4 text-base leading-relaxed text-ash-grey-600">
                MiraFood is built for people who want more than a calorie counter. AI makes logging
                fast; your coach makes the numbers trustworthy.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ash-grey-700">
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Patient file ID for your care team
                </li>
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Meals hidden from diary totals until coach-approved
                </li>
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Personalized macro and water targets from onboarding
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to="/download" variant="primary" size="md">
                  Download the app
                </Button>
                <Button to="/clinical-evidence" variant="outline" size="md">
                  How we work
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('home')} variant="light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl tracking-tight text-ash-grey-900">How it works for you</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {patientSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-ash-grey-200 bg-white p-6 shadow-sm">
                <span className="text-2xl font-bold text-cinnamon-wood-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-ash-grey-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl text-ash-grey-900">Ready to start?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ash-grey-600">
            Available on iPhone and Android. Search &quot;MiraFood Vitaway&quot; in your app store.
          </p>
          <div className="mt-6 flex justify-center">
            <AppStoreBadgesLight />
          </div>
          <p className="mt-6 text-sm text-ash-grey-500">
            Questions?{' '}
            <Link to="/support" className="text-blue-spruce-600 hover:underline">
              Visit support
            </Link>
          </p>
        </div>
      </section>

      <AudienceQASection items={patientFaqs} />
    </div>
  );
}
