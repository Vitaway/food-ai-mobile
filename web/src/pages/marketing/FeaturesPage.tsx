import { AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { APP_IMAGES, APP_IMAGE_ALTS, type AppImageKey } from '@/constants/appImages';

const features: {
  id: string;
  title: string;
  desc: string;
  bullets: string[];
  image: AppImageKey;
}[] = [
  {
    id: 'meal-logging',
    title: 'AI meal logging',
    desc: 'Log meals with your camera, photo library, or a quick text description. MiraFood handles the rest.',
    bullets: ['8 meal types from breakfast to post-workout', 'Time-aware suggestions', 'Past meal reuse'],
    image: 'logMeal',
  },
  {
    id: 'coach-review',
    title: 'Coach-verified nutrition',
    desc: 'Every meal goes through a human coach before approved macros appear in your diary — no blind AI guesses.',
    bullets: ['Transparent pipeline status', 'Meals hidden until approved', 'Edit & quality checks'],
    image: 'home',
  },
  {
    id: 'portion',
    title: 'Portion intelligence',
    desc: 'AI plate detection from photos helps estimate serving sizes more accurately than eyeballing alone.',
    bullets: ['Remote plate detection API', 'Optional description with photos', 'Manual diameter entry when needed'],
    image: 'logMeal',
  },
  {
    id: 'insights',
    title: 'Insights & habits',
    desc: 'See patterns over 7 and 30 days. Get streaks, hydration tracking, and actionable meal-swap tips.',
    bullets: ['Calorie & macro trends', 'Health score & streaks', 'Personalized coach tips'],
    image: 'insights',
  },
  {
    id: 'privacy',
    title: 'Privacy & security',
    desc: 'Your data stays under your control with passcode, biometrics, and in-app account deletion.',
    bullets: ['Face ID / Touch ID lock', 'Reset nutrition data', 'Delete account anytime'],
    image: 'profile',
  },
  {
    id: 'targets',
    title: 'Personalized targets',
    desc: 'Onboarding builds your profile — BMR, TDEE, macro splits, and water goals tailored to you.',
    bullets: ['Weight & muscle goals', 'Dietary preferences & allergies', 'Activity-level aware'],
    image: 'home',
  },
];

export function FeaturesPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-ash-grey-200 bg-ash-grey-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h1 className="font-sans text-4xl tracking-tight text-ash-grey-900 normal-case sm:text-5xl">Features</h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-ash-grey-600 lg:mx-0">
                MiraFood combines modern AI with human coach review — the accuracy of a dietitian, the
                speed of an app.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <AppStoreBadgesLight />
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AppScreenshot
                src={APP_IMAGES.home}
                alt={APP_IMAGE_ALTS.home}
                variant="light"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {features.map((feature, i) => (
            <article
              key={feature.id}
              id={feature.id}
              className="scroll-mt-24 grid items-center gap-10 lg:grid-cols-2">
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <h2 className="text-2xl tracking-tight text-ash-grey-900 sm:text-3xl">{feature.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-ash-grey-600">{feature.desc}</p>
                <ul className="mt-5 space-y-2">
                  {feature.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-ash-grey-700">
                      <span className="mt-0.5 text-shamrock-500">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`flex justify-center rounded-3xl bg-blue-spruce-50 p-6 sm:p-10 ${
                  i % 2 === 1 ? 'lg:order-1' : ''
                }`}>
                <AppScreenshot
                  src={APP_IMAGES[feature.image]}
                  alt={APP_IMAGE_ALTS[feature.image]}
                  variant="light"
                  size="md"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
