import { differentiators } from '@/constants/marketingContent';
import { cn } from '@/lib/utils';

export function DifferentiatorsSection() {
  return (
    <section className="bg-ash-grey-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
            What makes us different
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">
            Clinical-grade nutrition support — AI speed with human accountability.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-3xl border border-ash-grey-200 bg-white p-6 shadow-sm">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl text-lg text-white',
                  item.color,
                )}>
                {item.icon}
              </span>
              <h3 className="mt-4 text-lg text-ash-grey-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ash-grey-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
