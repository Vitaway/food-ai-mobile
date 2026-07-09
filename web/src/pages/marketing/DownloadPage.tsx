import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { appImage } from '@/constants/appImages';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const highlights = [
  'Snap meals with camera, gallery, or text',
  'Coach-verified nutrition before it hits your diary',
  'AI plate detection & portion estimates from photos',
  'Daily macros, water, streaks & insights',
  'Works on iPhone and Android',
];

export function DownloadPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-blue-spruce-600 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[min(72vh,820px)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h1 className="font-sans text-4xl leading-tight tracking-tight normal-case sm:text-5xl lg:text-6xl">
                Get the app
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">
                Start logging meals, tracking macros, and building better habits — with coach-verified
                nutrition you can trust.
              </p>
              <div className="mt-10">
                <AppStoreBadges />
              </div>
              <p className="mt-6 text-sm text-white/60">
                Requires iOS 15+ or Android 8+. Search &quot;MiraFood Vitaway&quot; in your store.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AppScreenshot {...appImage('home')} priority />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">Why MiraFood?</h2>
              <ul className="mt-8 space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-ash-grey-700">
                    <span className="mt-0.5 text-shamrock-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button to="/features" variant="outline" size="md" className="mt-8">
                See all features
              </Button>
              <p className="mt-6 text-sm text-ash-grey-500">
                Need help installing?{' '}
                <Link to="/support" className="text-blue-spruce-600 hover:underline">
                  Visit support
                </Link>
              </p>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('insights')} variant="light" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
