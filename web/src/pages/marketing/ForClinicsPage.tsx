import { useEffect, useRef } from 'react';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { Button } from '@/components/ui/Button';
import { CONTACT_EMAIL } from '@/constants/contact';
import { clinicFaqs } from '@/constants/marketingContent';
import {
  MARKETING_CLINICS_BAND_IMAGE,
  MARKETING_CLINICS_TEAM_IMAGE,
} from '@/constants/marketingImages';
import { appImage } from '@/constants/appImages';

const clinicSteps = [
  {
    title: 'Pilot with your coaches',
    desc: 'Onboard a small coach cohort, connect patient cohorts, and validate the review workflow in your setting.',
  },
  {
    title: 'Patients log between visits',
    desc: 'Members snap or describe meals in MiraFood — AI drafts nutrition estimates for coach review.',
  },
  {
    title: 'Coaches verify at scale',
    desc: 'A shared queue, patient file IDs, and client context keep reviews structured and fast.',
  },
  {
    title: 'Act on trusted data',
    desc: 'Only coach-approved meals enter diaries and reports — better follow-ups, cleaner program evaluation.',
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
    detail: 'Structured queue — not a full dietary recall every time.',
  },
];

function ClinicsBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    let frame = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function update() {
      frame = 0;
      if (!section || !bg || reduceMotion) return;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      const progress = (viewH - rect.top) / (viewH + rect.height);
      const shift = (progress - 0.5) * 100;
      bg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(1.15)`;
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden py-20 sm:py-28">
      <div
        ref={bgRef}
        className="absolute inset-[-12%] -z-10 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url('${MARKETING_CLINICS_BAND_IMAGE}')`,
          transform: 'translate3d(0, 0, 0) scale(1.15)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-blue-spruce-950/72" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl tracking-tight text-white sm:text-4xl">
            Built for clinical reality
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            MiraFood gives your nutrition team a shared review workflow — so dietary history is
            continuous, not rebuilt from memory at every visit.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {clinicOutcomes.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-md">
              <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{item.value}</p>
              <p className="mt-2 text-base text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ForClinicsPage() {
  return (
    <div className="bg-white">
      <MarketingPageHero
        title="For clinics & teams"
        description="Deploy coach-verified nutrition at scale — human accountability, AI speed, and workflows built for real clinical settings."
      />

      <PartnerLogosStrip />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
                Nutrition support that fits your workflow
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ash-grey-600 sm:text-lg">
                Clients log meals in the app. Coaches approve before data enters the diary. Your team
                gets better longitudinal data — without adding hours of manual entry.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ash-grey-700">
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Shared coach review queue across your team
                </li>
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Vitaway patient file IDs for continuity of care
                </li>
                <li className="flex gap-2">
                  <span className="text-shamrock-500">✓</span>
                  Pilot-friendly onboarding with Vitaway support
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href={`mailto:${CONTACT_EMAIL}`} variant="primary" size="md">
                  Talk to our team
                </Button>
                <Button to="/clinical-evidence" variant="outline" size="md">
                  Clinical approach
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('insights')} variant="light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
              How clinics deploy MiraFood
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">
              From pilot to trusted diary data — a clear path for care teams.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {clinicSteps.map((step, index) => (
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

      <ClinicsBand />

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative overflow-hidden rounded-[2rem] shadow-xl sm:rounded-[2.5rem]">
              <img
                src={MARKETING_CLINICS_TEAM_IMAGE}
                alt="Clinicians collaborating on patient care"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-spruce-950/50 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 right-5 text-sm text-white/90 sm:bottom-6 sm:left-6 sm:text-base">
                Designed with coaches and care teams — not as a replacement for clinical judgment.
              </p>
            </div>
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
                Why clinics choose MiraFood
              </h2>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-lg text-ash-grey-900">Scale coach review</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">
                    A shared queue lets nutrition coaches verify client meals without starting from
                    scratch every visit.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg text-ash-grey-900">Faster dietary history</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">
                    Photo logging replaces lengthy recalls. Coaches review structured AI output
                    instead of transcribing from memory.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg text-ash-grey-900">Outcome-oriented data</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">
                    Approved meal data feeds insights and follow-ups — supporting program evaluation
                    with numbers you can trust.
                  </p>
                </div>
              </div>
              <Button to="/for-coaches" variant="outline" size="md" className="mt-8">
                See the coach experience
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
            <ContactFormCard
              title="Start a clinic pilot"
              defaultTopic="Clinic or hospital partnership"
              description="Tell us about your clinic, expected client volume, and timeline. We support pilots and coach onboarding."
            />
            <div className="flex flex-col justify-between overflow-hidden rounded-[1.75rem] bg-blue-spruce-700 p-8 text-white shadow-lg sm:rounded-[2rem] sm:p-10">
              <div>
                <h2 className="text-2xl tracking-tight sm:text-3xl">Already with Vitaway?</h2>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  Coaches can sign in to the web dashboard today to review client meals, manage their
                  queue, and view patient context.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/85">
                  <li className="flex gap-2">
                    <span className="text-cinnamon-wood-300">→</span>
                    Review queue with priority filters
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cinnamon-wood-300">→</span>
                    Patient file IDs and goals at a glance
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cinnamon-wood-300">→</span>
                    Secure sign-in for your care team
                  </li>
                </ul>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button to="/login" variant="primary" size="md">
                  Coach sign in
                </Button>
                <Button href={`mailto:${CONTACT_EMAIL}`} variant="outline-light" size="md">
                  {CONTACT_EMAIL}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AudienceQASection title="Clinic FAQ" items={clinicFaqs} />
    </div>
  );
}
