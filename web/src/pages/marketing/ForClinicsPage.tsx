import { Link } from 'react-router-dom';
import { StagedAppShot } from '@/components/marketing/CrescentStage';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { CONTACT_EMAIL } from '@/constants/contact';
import { clinicFaqs } from '@/constants/marketingContent';
import { MARKETING_CLINICS_TEAM_IMAGE } from '@/constants/marketingImages';
import { appImage } from '@/constants/appImages';

const clinicSteps = [
  {
    title: 'Pilot with your coaches',
    desc: 'Onboard a small coach cohort, connect patient cohorts, and validate the review workflow in your setting.',
  },
  {
    title: 'Patients log between visits',
    desc: 'Members snap or describe meals in MiraFood; AI drafts nutrition estimates for coach review.',
  },
  {
    title: 'Coaches verify at scale',
    desc: 'A shared queue, patient file IDs, and client context keep reviews structured and fast.',
  },
  {
    title: 'Act on trusted data',
    desc: 'Only coach-approved meals enter diaries and reports; better follow-ups, cleaner program evaluation.',
  },
];

const clinicOutcomes = [
  {
    value: 'Human-led',
    label: 'Every diary total',
    detail: 'AI drafts. Coaches decide what counts.',
  },
  {
    value: 'Shared IDs',
    label: 'Patient continuity',
    detail: 'Vitaway file IDs across programs and touchpoints.',
  },
  {
    value: 'Minutes',
    label: 'Typical review',
    detail: 'Structured queue; not a full dietary recall every time.',
  },
];

export function ForClinicsPage() {
  return (
    <div>
      <MarketingPageHero
        title="For clinics & teams"
        description="Deploy coach-verified nutrition at scale; human accountability, AI speed, and workflows built for real clinical settings."
      />

      <PartnerLogosStrip />

      <section className="px-1 py-12 sm:px-2">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
              Nutrition support that fits your workflow
            </h2>
            <p className="mt-4 text-base leading-relaxed text-mira-muted sm:text-lg">
              Clients log meals in the app. Coaches approve before data enters the diary. Your team
              gets better longitudinal data; without adding hours of manual entry.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-mira-muted">
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Shared coach review queue across your team
              </li>
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Vitaway patient file IDs for continuity of care
              </li>
              <li className="flex gap-2">
                <span className="text-mira-green">✓</span>
                Pilot-friendly onboarding with Vitaway support
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="mira-btn mira-btn--black">
                Talk to our team
              </a>
              <Link to="/clinical-evidence" className="mira-btn mira-btn--outline">
                Clinical approach
              </Link>
            </div>
          </div>
          <StagedAppShot {...appImage('insights')} size="md" />
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
          How clinics deploy MiraFood
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-mira-muted">
          From pilot to trusted diary data; a clear path for care teams.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {clinicSteps.map((step, index) => (
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
            Built for clinical reality
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
            A shared review workflow so dietary history is continuous, not rebuilt from memory at
            every visit.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {clinicOutcomes.map((item) => (
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
              src={MARKETING_CLINICS_TEAM_IMAGE}
              alt="Clinicians collaborating on patient care"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-mira-green sm:text-4xl">
              Why clinics choose MiraFood
            </h2>
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-mira-green">Scale coach review</h3>
                <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                  A shared queue lets nutrition coaches verify client meals without starting from
                  scratch every visit.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mira-green">Faster dietary history</h3>
                <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                  Photo logging replaces lengthy recalls. Coaches review structured AI output instead
                  of transcribing from memory.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mira-green">Outcome-oriented data</h3>
                <p className="mt-2 text-sm leading-relaxed text-mira-muted">
                  Approved meal data feeds insights and follow-ups; supporting program evaluation with
                  numbers you can trust.
                </p>
              </div>
            </div>
            <Link to="/for-coaches" className="mira-btn mira-btn--outline mt-8">
              See the coach experience
            </Link>
          </div>
        </div>
      </section>

      <section className="px-1 py-12 sm:px-2">
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactFormCard
            title="Start a clinic pilot"
            defaultTopic="Clinic or hospital partnership"
            description="Tell us about your clinic, expected client volume, and timeline. We support pilots and coach onboarding."
          />
          <div className="flex flex-col justify-between rounded-[1.5rem] bg-mira-green p-8 text-white sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Already with Vitaway?</h2>
              <p className="mt-4 text-base leading-relaxed text-white/75">
                Coaches can sign in to the web dashboard today to review client meals, manage their
                queue, and view patient context.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/login" className="mira-btn mira-btn--black">
                Coach sign in
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mira-btn mira-btn--outline border-white/30 text-white ring-white/30 hover:bg-white hover:text-mira-green">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>

      <AudienceQASection title="Clinic FAQ" items={clinicFaqs} />
    </div>
  );
}
