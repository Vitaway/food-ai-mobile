import { AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { HeroProductPair, StagedAppShot } from '@/components/marketing/CrescentStage';
import { DifferentiatorsSection } from '@/components/marketing/DifferentiatorsSection';
import { ImpactStatsSection } from '@/components/marketing/ImpactStatsSection';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { VerifiedMealPanel } from '@/components/marketing/VerifiedMealPanel';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { appImage } from '@/constants/appImages';

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-1 pb-0 pt-6 sm:px-2 sm:pt-8">
        <div className="mira-fade-up relative z-10 mx-auto max-w-2xl text-center">
          <h1 className="text-[2.15rem] font-semibold leading-[1.15] tracking-tight text-mira-green sm:text-4xl lg:text-[3.15rem]">
            Meal logging with coach-verified nutrition
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-mira-muted sm:text-lg">
            Snap or describe meals, get AI estimates in seconds, and a coach reviews every entry
            before it counts.
          </p>
          <div className="mt-8 flex justify-center">
            <AppStoreBadgesLight />
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <HeroProductPair left={appImage('home')} right={appImage('logMeal')} />
        </div>
      </section>

      <PartnerLogosStrip />

      <section className="px-1 py-10 sm:px-2">
        <div className="overflow-hidden rounded-[4px] bg-mira-green">
          <div className="grid lg:grid-cols-2">
            <div className="flex items-end justify-center bg-mira-mint px-4 pt-8 sm:px-8">
              <StagedAppShot {...appImage('insights')} size="md" className="max-w-md" />
            </div>
            <VerifiedMealPanel />
          </div>
        </div>
      </section>

      <ImpactStatsSection />

      <DifferentiatorsSection />

      <TestimonialsSection />
    </>
  );
}
