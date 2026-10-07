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
    <section className="px-1 py-12 sm:px-2">
      <h2 className="text-2xl font-semibold tracking-tight text-mira-green sm:text-3xl">{title}</h2>
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <div key={item.q} className="rounded-[1.25rem] bg-mira-green p-5 text-white sm:p-6">
            <h3 className="font-semibold">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
