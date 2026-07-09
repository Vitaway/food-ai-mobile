import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { ContactFormCard } from '@/components/marketing/ContactFormCard';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { Button } from '@/components/ui/Button';
import { clinicFaqs } from '@/constants/marketingContent';
import { appImage } from '@/constants/appImages';

const clinicBenefits = [
  {
    title: 'Scale coach review',
    desc: 'A shared review queue lets nutrition coaches verify client meals without starting from scratch every visit.',
  },
  {
    title: 'Patient file IDs',
    desc: 'Every member gets a Vitaway patient file ID — consistent tracking across programs and touchpoints.',
  },
  {
    title: 'Faster dietary history',
    desc: 'Photo logging replaces lengthy recalls. Coaches review structured AI output instead of transcribing from memory.',
  },
  {
    title: 'Outcome-oriented data',
    desc: 'Approved meal data feeds dashboards and insights — supporting follow-up visits and program evaluation.',
  },
];

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
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900">
                Nutrition support that fits your workflow
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ash-grey-600">
                MiraFood is designed like a structured nutrition review — clients log meals in the
                app; coaches approve before data enters the diary. Your team gets better data without
                adding hours of manual entry.
              </p>
              <Button to="/clinical-evidence" variant="outline" size="md" className="mt-8">
                Clinical approach
              </Button>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('logMeal')} variant="light" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl tracking-tight text-ash-grey-900">Why clinics choose MiraFood</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {clinicBenefits.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-ash-grey-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg text-ash-grey-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <ContactFormCard
            defaultTopic="Clinic or hospital partnership"
            description="Tell us about your clinic, expected client volume, and timeline. We support pilots and coach onboarding."
          />
          <div className="rounded-3xl border border-ash-grey-200 bg-ash-grey-50 p-8">
            <h2 className="text-xl text-ash-grey-900">Already working with Vitaway?</h2>
            <p className="mt-3 text-sm leading-relaxed text-ash-grey-600">
              Coaches can sign in to the web dashboard to review client meals, manage their queue, and
              view client context.
            </p>
            <Button to="/login" variant="primary" size="md" className="mt-6">
              Coach sign in
            </Button>
            <p className="mt-6 text-sm text-ash-grey-500">
              Email{' '}
              <a href="mailto:hello@vitaway.org" className="text-blue-spruce-600 hover:underline">
                hello@vitaway.org
              </a>{' '}
              for enterprise deployment.
            </p>
          </div>
        </div>
      </section>

      <AudienceQASection items={clinicFaqs} />
    </div>
  );
}
