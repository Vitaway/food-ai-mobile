import { Link } from 'react-router-dom';
import { StagedAppShot } from '@/components/marketing/CrescentStage';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { CONTACT_EMAIL } from '@/constants/contact';
import { coachFaqs } from '@/constants/marketingContent';
import { MARKETING_COACHES_DESK_IMAGE } from '@/constants/marketingImages';
import { appImage } from '@/constants/appImages';

const coachSteps = [
  {
    title: 'Open your queue',
    desc: 'Filters for flagged and low-confidence meals; focus on what needs attention first.',
  },
  {
    title: 'Review the meal',
    desc: 'See the photo, AI draft, and client notes. Adjust ingredients and weights as needed.',
  },
  {
    title: 'Approve, edit, or reject',
    desc: 'Leave client-facing notes. Only verified nutrition enters their diary totals.',
  },
  {
    title: 'Track your performance',
    desc: 'Approval rates, queue depth, and review trends help you manage workload over time.',
  },
];

const coachOutcomes = [
  {
    value: 'Minutes',
    label: 'Per typical review',
    detail: 'Structured queue; not a full dietary recall interview every time.',
  },
  {
    value: 'Full context',
    label: 'While you review',
    detail: 'Patient file ID, goals, allergies, and today’s macros at a glance.',
  },
  {
    value: 'Your call',
    label: 'On every number',
    detail: 'AI drafts the first pass. You decide what gets approved.',
  },
];

export function ForCoachesPage() {
  return (
    <div>
      <MarketingPageHero
        title="For coaches"
        description="Review client meals like a structured nutrition consult; verify AI output, edit portions, and keep your queue moving from a clean web dashboard."
      />

      <PartnerLogosStrip />

      <section className="px-1 py-12 sm:px-2">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
              Built for your workflow
            </h2>
            <p className="mt-4 text-base leading-relaxed text-mira-muted sm:text-lg">
              MiraFood fits clinical nutrition practice; it does not replace your judgment. AI
              speeds the first pass; you stay in control of every approved number.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-mira-muted">
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Structured review queue with priority filters
              </li>
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Edit portions, ingredients, and client-facing notes
              </li>
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Secure web dashboard with analytics and settings
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="mira-btn mira-btn--black">
                Open coach dashboard
              </Link>
              <Link to="/clinical-evidence" className="mira-btn mira-btn--outline">
                Our methodology
              </Link>
            </div>
          </div>
          <StagedAppShot {...appImage('logMeal')} size="md" />
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
          How it works for coaches
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-mira-muted">
          From queue to verified diary data; a clear path for every review.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {coachSteps.map((step, index) => (
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
        <div className="overflow-hidden rounded-[1.5rem] bg-mira-green p-8 text-white sm:p-10 lg:p-12">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for how coaches actually work
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
            Verify AI output, edit portions, and keep your queue moving without losing clinical
            judgment.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {coachOutcomes.map((item) => (
              <div key={item.label} className="rounded-[1.25rem] bg-black/25 p-6">
                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.value}</p>
                <p className="mt-2 font-medium">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="overflow-hidden rounded-[1.5rem]">
            <img
              src={MARKETING_COACHES_DESK_IMAGE}
              alt="Coach reviewing nutrition data on a laptop"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
              Why coaches choose MiraFood
            </h2>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-mira-green">Priority review queue</h3>
                <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                  Flagged and low-confidence meals surface first so you spend time where it matters.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mira-green">Edit with full client context</h3>
                <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                  Patient file ID, goals, allergies, and today’s macros sit beside the meal while you
                  review.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mira-green">Performance you can see</h3>
                <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                  Approval rates, queue depth, and review trends help you manage workload without
                  guesswork.
                </p>
              </div>
            </div>
            <Link to="/for-clinics" className="mira-btn mira-btn--outline mt-8">
              See the clinic offering
            </Link>
          </div>
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactFormCard
            title="Join as a coach"
            defaultTopic="Coach onboarding"
            description="Tell us about your practice or clinic affiliation. We support coach onboarding and team deployment."
          />
          <div className="flex flex-col justify-between rounded-[1.5rem] bg-mira-green p-8 text-white sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Already on the team?</h2>
              <p className="mt-4 text-base leading-relaxed text-white/75">
                Sign in to your coach dashboard to review client meals, manage your queue, and view
                patient context.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/login" className="mira-btn mira-btn--black">
                Open coach dashboard
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="mira-btn mira-btn--outline border-white/30 text-white ring-white/30 hover:bg-white hover:text-mira-green">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      <AudienceQASection title="Coach FAQ" items={coachFaqs} />
    </div>
  );
}
