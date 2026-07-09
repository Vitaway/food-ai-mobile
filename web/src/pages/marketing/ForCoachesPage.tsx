import { Link } from 'react-router-dom';
import { AppScreenshot } from '@/components/marketing/AppScreenshot';
import { AudienceQASection } from '@/components/marketing/AudienceQASection';
import { Button } from '@/components/ui/Button';
import { coachFaqs } from '@/constants/marketingContent';
import { appImage } from '@/constants/appImages';

const coachFeatures = [
  {
    title: 'Review queue',
    desc: 'Filters for flagged and low-confidence meals — focus on what needs attention first.',
  },
  {
    title: 'Approve, reject, or edit',
    desc: 'Adjust ingredient weights, meal names, and leave notes clients see on approved meals.',
  },
  {
    title: 'Client context',
    desc: 'Patient file ID, goals, allergies, and today’s macros at a glance while you review.',
  },
  {
    title: 'Performance analytics',
    desc: 'Approval rates, queue depth, and review trends to manage your workload.',
  },
  {
    title: 'Efficient workflow',
    desc: 'Structured review in minutes — not a full dietary recall interview every time.',
  },
  {
    title: 'Secure sign-in',
    desc: 'Web dashboard with profile, password, timezone, and avatar settings.',
  },
];

export function ForCoachesPage() {
  return (
    <div className="bg-white">
      <section className="bg-blue-spruce-600 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="font-sans text-4xl leading-tight tracking-tight normal-case sm:text-5xl">For coaches</h1>
              <p className="mt-5 text-lg leading-relaxed text-white/85">
                Review client meals like a structured nutrition consult — verify AI output, edit
                portions, and keep your queue moving from a clean web dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to="/login" variant="primary" size="lg">
                  Open coach dashboard
                </Button>
                <Button to="/clinical-evidence" variant="outline-light" size="lg">
                  Our methodology
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <AppScreenshot {...appImage('logMeal')} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl tracking-tight text-ash-grey-900">Built for your workflow</h2>
          <p className="mt-3 max-w-2xl text-ash-grey-600">
            MiraFood is designed to fit into clinical nutrition practice — not replace your judgment.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coachFeatures.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-ash-grey-200 bg-ash-grey-50 px-5 py-5">
                <h3 className="font-normal text-ash-grey-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ash-grey-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl text-ash-grey-900">Bring MiraFood to your practice</h2>
          <p className="mt-3 text-sm leading-relaxed text-ash-grey-600">
            Interested in bringing MiraFood to your clinic or coaching practice?{' '}
            <a
              href="mailto:hello@vitaway.org"
              className="font-normal text-blue-spruce-600 underline-offset-2 hover:underline">
              Get in touch
            </a>{' '}
            or visit our{' '}
            <Link to="/for-clinics" className="font-normal text-blue-spruce-600 underline-offset-2 hover:underline">
              clinics page
            </Link>
            .
          </p>
        </div>
      </section>

      <AudienceQASection title="Coach FAQ" items={coachFaqs} />
    </div>
  );
}
