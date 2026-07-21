import { homeSteps } from '@/constants/marketingContent';

function StepIllustration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="relative mx-auto h-28 w-36 rounded-2xl border border-ash-grey-200 bg-white p-3 shadow-md">
        <div className="h-2 w-10 rounded bg-shamrock-500" />
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full rounded bg-ash-grey-100" />
          <div className="h-2 w-4/5 rounded bg-ash-grey-100" />
          <div className="flex items-center gap-2 pt-1">
            <span className="h-3 w-3 rounded bg-blue-spruce-500" />
            <span className="h-2 flex-1 rounded bg-ash-grey-100" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-blue-spruce-500" />
            <span className="h-2 flex-1 rounded bg-ash-grey-100" />
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="relative mx-auto flex h-28 w-36 flex-col justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-ash-grey-200 bg-white px-3 py-2 shadow-md"
            style={{ transform: `translateX(${i * 4}px)` }}>
            <span className="h-3 w-3 rounded bg-shamrock-500" />
            <span className="h-5 w-10 rounded bg-blue-spruce-600" />
          </div>
        ))}
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="relative mx-auto h-28 w-40">
        <div className="absolute left-0 top-2 h-20 w-24 rounded-xl border border-ash-grey-200 bg-white p-2 shadow-md">
          <div className="h-2 w-12 rounded bg-ash-grey-100" />
          <div className="mt-2 h-2 w-full rounded bg-ash-grey-100" />
          <div className="mt-3 h-5 w-14 rounded bg-blue-spruce-600" />
        </div>
        <div className="absolute bottom-0 right-2 h-24 w-14 rounded-xl border border-ash-grey-200 bg-white p-1.5 shadow-lg">
          <div className="mx-auto h-1.5 w-6 rounded bg-ash-grey-200" />
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-full rounded bg-ash-grey-100" />
            <div className="h-1.5 w-4/5 rounded bg-ash-grey-100" />
          </div>
          <div className="mt-3 h-4 w-full rounded bg-blue-spruce-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-28 w-36">
      <div className="absolute left-1 top-4 h-20 w-16 -rotate-6 rounded-xl border border-ash-grey-200 bg-white shadow-md" />
      <div className="absolute right-1 top-4 h-20 w-16 rotate-6 rounded-xl border border-ash-grey-200 bg-white shadow-md" />
      <div className="absolute left-1/2 top-2 h-24 w-20 -translate-x-1/2 rounded-xl border border-ash-grey-200 bg-white p-2 shadow-lg">
        <div className="mx-auto flex h-8 w-8 items-end justify-center gap-0.5 rounded bg-shamrock-50 pb-1">
          <span className="h-3 w-1.5 rounded-sm bg-shamrock-500" />
          <span className="h-5 w-1.5 rounded-sm bg-shamrock-500" />
          <span className="h-4 w-1.5 rounded-sm bg-shamrock-500" />
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1.5 w-full rounded bg-ash-grey-100" />
          <div className="h-1.5 w-4/5 rounded bg-ash-grey-100" />
        </div>
      </div>
      <span className="absolute right-3 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-spruce-600 text-xs text-white shadow">
        ✓
      </span>
    </div>
  );
}

function Connector({ flip }: { flip?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute top-14 hidden w-[18%] lg:block"
      style={flip ? { right: '-9%' } : { left: '100%', marginLeft: '-9%' }}
      aria-hidden>
      <svg viewBox="0 0 120 48" className="h-12 w-full overflow-visible" fill="none">
        <path
          d={flip ? 'M8 36 C 40 36, 56 8, 112 12' : 'M8 12 C 40 8, 70 40, 112 36'}
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 6"
          className="text-blue-spruce-500"
        />
        <path
          d={flip ? 'M102 8 L112 12 L104 20' : 'M102 30 L112 36 L104 40'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-spruce-500"
        />
      </svg>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">How it works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">
            From snap to coach-verified nutrition in four steps.
          </p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {homeSteps.map((item, index) => (
            <div key={item.step} className="relative text-center">
              {index < homeSteps.length - 1 ? <Connector flip={index % 2 === 1} /> : null}
              <StepIllustration index={index} />
              <h3 className="mt-6 text-base text-ash-grey-900 sm:text-lg">{item.title}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-ash-grey-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
