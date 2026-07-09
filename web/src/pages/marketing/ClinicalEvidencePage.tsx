import { Link } from 'react-router-dom';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { Button } from '@/components/ui/Button';

const methodology = [
  {
    title: 'AI-assisted logging',
    desc: 'Vision models estimate foods, portions, and macros from photos or text descriptions. Users can add notes when photos are unclear.',
  },
  {
    title: 'Mandatory coach review',
    desc: 'No approved macro enters a client diary without coach sign-off. Coaches can edit ingredients, weights, and leave notes.',
  },
  {
    title: 'Transparent pipeline',
    desc: 'Clients see meal status (pending, in review, approved, rejected) so expectations are clear throughout.',
  },
  {
    title: 'Goal-aware profiles',
    desc: 'Onboarding captures health goals, activity, allergies, and dietary preferences to contextualize review and insights.',
  },
];

const limitations = [
  'MiraFood is not a medical device and does not diagnose or treat conditions.',
  'AI estimates are starting points — coach review is the source of truth for approved diary data.',
  'Accuracy varies with photo quality, lighting, and food complexity; users should add descriptions when needed.',
  'We continue to improve models and validation; published outcome studies will be shared here as they complete.',
];

export function ClinicalEvidencePage() {
  return (
    <div className="bg-white">
      <MarketingPageHero
        title="Clinical evidence & approach"
        description="How MiraFood combines AI speed with human review — and what we claim (and don’t claim) about our technology."
      />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl tracking-tight text-ash-grey-900">Our methodology</h2>
          <p className="mt-4 text-base leading-relaxed text-ash-grey-600">
            MiraFood follows a human-in-the-loop model aligned with medical nutrition therapy
            principles: capture dietary intake efficiently, review with a qualified coach, and track
            change over time.
          </p>
          <div className="mt-10 space-y-6">
            {methodology.map((item) => (
              <div key={item.title} className="rounded-2xl border border-ash-grey-200 bg-ash-grey-50 p-6">
                <h3 className="text-ash-grey-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ash-grey-200 bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl tracking-tight text-ash-grey-900">Research & outcomes</h2>
          <p className="mt-4 text-base leading-relaxed text-ash-grey-600">
            Vitaway is building outcome studies with clinic partners in Rwanda and beyond. We report
            process metrics today — coach review rates, logging adherence, and review turnaround — and
            will publish formal clinical outcomes as validated studies complete.
          </p>
          <div className="mt-8 rounded-2xl border border-blue-spruce-200 bg-blue-spruce-50 p-6">
            <p className="text-sm leading-relaxed text-blue-spruce-900">
              <strong>Interested in a research partnership?</strong> Contact{' '}
              <a href="mailto:hello@vitaway.org" className="underline underline-offset-2">
                hello@vitaway.org
              </a>{' '}
              to discuss pilots and data collection protocols.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl tracking-tight text-ash-grey-900">Important limitations</h2>
          <ul className="mt-6 space-y-3">
            {limitations.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-ash-grey-700">
                <span className="text-cinnamon-wood-500">•</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-ash-grey-600">
            Read our full{' '}
            <Link to="/medical-disclaimer" className="text-blue-spruce-600 hover:underline">
              medical disclaimer
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-spruce-600 hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button to="/for-clinics" variant="primary" size="md">
              For clinics
            </Button>
            <Button to="/for-patients" variant="outline" size="md">
              For patients
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
