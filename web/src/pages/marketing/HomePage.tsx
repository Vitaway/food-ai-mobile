import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { DifferentiatorsSection } from '@/components/marketing/DifferentiatorsSection';
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection';
import { ImpactStatsSection } from '@/components/marketing/ImpactStatsSection';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
import { VerifiedMealPanel } from '@/components/marketing/VerifiedMealPanel';
import { appImage } from '@/constants/appImages';
import { MARKETING_HERO_IMAGE } from '@/constants/marketingImages';

export function HomePage() {
  return (
    <>
      <section
        className="relative overflow-hidden bg-blue-spruce-800 text-white"
        style={{
          backgroundImage: `url('${MARKETING_HERO_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}>
        <div className="absolute inset-0 bg-blue-spruce-950/55" aria-hidden />
        <div className="relative mx-auto flex min-h-[min(85vh,920px)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h1 className="text-3xl leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Trust what&apos;s in your diary
              </h1>
              <p className="mt-5 max-w-lg font-sans text-base leading-relaxed text-white/85 sm:text-lg">
                MiraFood is Vitaway&apos;s nutrition app. Snap or describe your meals, get AI
                estimates in seconds, and a real coach reviews every entry before it counts in your
                diary.
              </p>
              <div className="mt-8">
                <AppStoreBadges />
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AppScreenshot {...appImage('home')} priority />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1 right-0 h-16 w-full rounded-tl-[4rem] bg-white sm:h-24 sm:rounded-tl-[6rem]" />
      </section>

      <PartnerLogosStrip />

      <section className="bg-ash-grey-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-blue-spruce-700 shadow-xl sm:rounded-[2.5rem]">
            <div className="grid lg:grid-cols-2">
              <div className="flex items-center justify-center bg-blue-spruce-600 p-6 sm:p-10">
                <AppScreenshot {...appImage('logMeal')} variant="dark" />
              </div>
              <VerifiedMealPanel />
            </div>
          </div>
        </div>
      </section>

      <ImpactStatsSection />

      <HowItWorksSection />

      <DifferentiatorsSection />

      <TestimonialsSection />
    </>
  );
}
