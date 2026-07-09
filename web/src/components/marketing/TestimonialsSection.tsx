import { testimonials } from '@/constants/marketingContent';

export function TestimonialsSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight text-ash-grey-900 sm:text-4xl">
            What people are saying
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ash-grey-600">
            Feedback from members, coaches, and partners in the Vitaway ecosystem.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote
              key={item.role}
              className="flex flex-col rounded-3xl border border-ash-grey-200 bg-ash-grey-50 p-8">
              <p className="flex-1 text-sm leading-relaxed text-ash-grey-700">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-ash-grey-200 pt-4">
                <p className="font-normal text-ash-grey-900">{item.role}</p>
                <p className="text-xs text-ash-grey-500">{item.context}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
