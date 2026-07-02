import { Link } from 'react-router-dom';
import { PartnerLogosStrip } from '@/components/marketing/PartnerLogosStrip';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { appImage } from '@/constants/appImages';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const benefitCards = [
  {
    title: 'Easy to use, intuitive and user friendly',
    color: 'bg-blue-spruce-500',
    icon: '◎',
  },
  {
    title: 'Coach-verified nutrition you can trust',
    color: 'bg-shamrock-500',
    icon: '✓',
  },
  {
    title: 'AI + AR portion intelligence',
    color: 'bg-cinnamon-wood-400',
    icon: '◉',
  },
  {
    title: 'Full pipeline transparency',
    color: 'bg-blue-spruce-700',
    icon: '↻',
  },
];

const solutions = [
  {
    title: 'For individuals',
    desc: 'Track calories, macros, water, and streaks with a daily command center built around your goals.',
    cta: 'Get the app',
    href: '/download',
  },
  {
    title: 'For coaches',
    desc: 'Review client meals, approve nutrition data, and manage your queue from a dedicated dashboard.',
    cta: 'Coach dashboard',
    href: '/login',
  },
  {
    title: 'For clinics & teams',
    desc: 'Scale human-in-the-loop meal review across clients with consistent, evidence-based workflows.',
    cta: 'Contact us',
    href: 'mailto:hello@vitaway.org',
  },
];

const steps = [
  { step: '01', title: 'Snap or describe your meal', desc: 'Camera, gallery, or text — log in seconds.' },
  { step: '02', title: 'AI analyzes portions', desc: 'Plate detection and AR sizing improve accuracy.' },
  { step: '03', title: 'Coach reviews', desc: 'A real nutrition coach verifies before it hits your diary.' },
  { step: '04', title: 'Track & improve', desc: 'Insights, streaks, and personalized tips keep you on goal.' },
];

export function HomePage() {
  return (
    <>
      {/* Hero — Nutritics-style blue block with rounded corner */}
      <section className="relative overflow-hidden bg-blue-spruce-600 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[min(85vh,920px)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h1 className="text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Eat smarter
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">
                Snap a meal, get accurate macros, and track your health goals — with real coaches in
                the loop before numbers reach your diary.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button to="/download" variant="primary" size="lg">
                  Download the app
                </Button>
                <Button to="/features" variant="outline-light" size="lg">
                  Explore features
                </Button>
              </div>
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

      {/* Video / feature card — magenta-style block in Nutritics */}
      <section className="bg-ash-grey-50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-blue-spruce-700 shadow-xl sm:rounded-[2.5rem]">
            <div className="grid lg:grid-cols-2">
              <div className="flex items-center justify-center bg-blue-spruce-600 p-6 sm:p-10">
                <AppScreenshot {...appImage('logMeal')} variant="dark" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
                <h2 className="text-2xl leading-tight tracking-tight text-white sm:text-3xl">
                  Verified meal data
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
                  Meal logging, AI analysis, coach review, macro tracking, water goals, streaks, and
                  personalized insights — MiraFood connects every step of your nutrition journey in
                  one beautiful app.
                </p>
                <Button to="/download" variant="primary" size="md" className="mt-8">
                  Get the app
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact + benefit cards */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl leading-tight tracking-tight text-ash-grey-900 sm:text-4xl">
                Better nutrition daily
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ash-grey-600 sm:text-lg">
                MiraFood helps you log meals in seconds, understand your macros in real time, and
                trust the numbers — because a coach reviews every meal before it&apos;s approved.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ash-grey-600">
                Combined with AR plate measurement and AI portion detection, you get accuracy that
                generic calorie apps can&apos;t match — without spending hours on manual entry.
              </p>
              <Link
                to="/features"
                className="mt-8 inline-flex font-normal text-cinnamon-wood-400 underline-offset-4 hover:underline">
                See our features
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {benefitCards.map((card) => (
                <div
                  key={card.title}
                  className={cn(
                    'flex min-h-[140px] flex-col justify-between rounded-3xl p-5 text-white shadow-md',
                    card.color,
                  )}>
                  <span className="text-2xl font-bold opacity-90">{card.icon}</span>
                  <p className="text-sm font-normal uppercase leading-snug tracking-wide sm:text-base">
                    {card.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">
              From snap to approved nutrition in four simple steps.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-ash-grey-200 bg-white p-6 shadow-sm">
                <span className="text-3xl font-bold text-cinnamon-wood-400">{item.step}</span>
                <h3 className="mt-3 text-ash-grey-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
            Solutions
          </h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {solutions.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-3xl border border-ash-grey-200 bg-ash-grey-50 p-8">
                <h3 className="text-xl text-ash-grey-900">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ash-grey-600">{item.desc}</p>
                {item.href.startsWith('mailto') ? (
                  <a
                    href={item.href}
                    className="mt-6 inline-flex w-fit font-normal text-blue-spruce-600 hover:text-blue-spruce-700">
                    {item.cta} →
                  </a>
                ) : item.href.startsWith('/') ? (
                  <Link
                    to={item.href}
                    className="mt-6 inline-flex w-fit font-normal text-blue-spruce-600 hover:text-blue-spruce-700">
                    {item.cta} →
                  </Link>
                ) : item.href.startsWith('#') ? (
                  <a
                    href={item.href}
                    className="mt-6 inline-flex w-fit font-normal text-blue-spruce-600 hover:text-blue-spruce-700">
                    {item.cta} →
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="mt-6 inline-flex w-fit font-normal text-blue-spruce-600 hover:text-blue-spruce-700">
                    {item.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
