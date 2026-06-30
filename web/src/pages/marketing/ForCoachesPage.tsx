import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { Button } from '@/components/ui/Button';
import { appImage } from '@/constants/appImages';

const coachFeatures = [
  'Review queue with filters and fraud flags',
  'Approve, reject, or edit meal ingredients',
  'Client overview and meal history',
  'Performance analytics and approval rates',
  'Profile and security settings',
];

export function ForCoachesPage() {
  return (
    <div className="bg-white">
      <section className="bg-blue-spruce-600 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">
                For coaches
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/85">
                Review client meals, verify AI-generated nutrition, and keep your queue moving — all
                from a clean web dashboard built for 2026.
              </p>
              <Button to="/coach/login" variant="primary" size="lg" className="mt-8">
                Open coach dashboard
              </Button>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('logMeal')} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl tracking-tight text-ash-grey-900">What coaches get</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coachFeatures.map((f) => (
              <div
                key={f}
                className="rounded-2xl border border-ash-grey-200 bg-ash-grey-50 px-5 py-4 text-sm font-normal text-ash-grey-800">
                {f}
              </div>
            ))}
          </div>
          <p className="mt-10 text-ash-grey-600">
            Interested in bringing MiraFood to your clinic or coaching practice?{' '}
            <a href="mailto:hello@vitaway.com" className="font-normal text-blue-spruce-600 underline-offset-2 hover:underline">
              Get in touch
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
