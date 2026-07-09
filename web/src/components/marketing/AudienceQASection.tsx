type QAItem = { q: string; a: string };

type AudienceQASectionProps = {
  title?: string;
  items: readonly QAItem[];
};

export function AudienceQASection({
  title = 'Common questions',
  items,
}: AudienceQASectionProps) {
  return (
    <section className="border-t border-ash-grey-200 bg-ash-grey-50 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl tracking-tight text-ash-grey-900 sm:text-3xl">{title}</h2>
        <div className="mt-8 space-y-6">
          {items.map((item) => (
            <div key={item.q} className="rounded-2xl border border-ash-grey-200 bg-white p-6 shadow-sm">
              <h3 className="text-ash-grey-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
