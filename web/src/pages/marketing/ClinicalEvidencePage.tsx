import { Link } from 'react-router-dom';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';

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
  'AI estimates are starting points; coach review is the source of truth for approved diary data.',
  'Accuracy varies with photo quality, lighting, and food complexity; users should add descriptions when needed.',
  'We continue to improve models and validation; published outcome studies will be shared here as they complete.',
];

export function ClinicalEvidencePage() {
  return (
    <div>
      <MarketingPageHero
        title="Clinical evidence & approach"
        description="How MiraFood combines AI speed with human review; and what we claim (and don’t claim) about our technology."
      />

      <section className="px-1 py-12 sm:px-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-mira-green">Our methodology</h2>
          <p className="mt-4 text-base leading-relaxed text-mira-muted">
            MiraFood follows a human-in-the-loop model aligned with medical nutrition therapy
            principles: capture dietary intake efficiently, review with a qualified coach, and track
            change over time.
          </p>
          <div className="mt-8 space-y-3">
            {methodology.map((item) => (
              <div key={item.title} className="rounded-[1.25rem] bg-mira-green p-6 text-white">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-mira-green">Research & outcomes</h2>
          <p className="mt-4 text-base leading-relaxed text-mira-muted">
            Vitaway is building outcome studies with clinic partners in Rwanda and beyond. We report
            process metrics today; coach review rates, logging adherence, and review turnaround; and
            will publish formal clinical outcomes as validated studies complete.
          </p>
          <div className="mt-8 rounded-[1.25rem] bg-mira-green p-6 text-white">
            <p className="text-sm leading-relaxed text-white/85">
              <strong className="text-white">Interested in a research partnership?</strong> Contact{' '}
              <a href="mailto:support@vitaway.org" className="underline underline-offset-2">
                support@vitaway.org
              </a>{' '}
              to discuss pilots and data collection protocols.
            </p>
          </div>
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-mira-green">Important limitations</h2>
          <ul className="mt-6 space-y-3">
            {limitations.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-mira-muted">
                <span className="text-mira-green">•</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-mira-muted">
            Read our full{' '}
            <Link to="/medical-disclaimer" className="text-mira-green hover:underline">
              medical disclaimer
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-mira-green hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/for-clinics" className="mira-btn mira-btn--black">
              For clinics
            </Link>
            <Link to="/for-patients" className="mira-btn mira-btn--outline">
              For patients
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
