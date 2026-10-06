import { PARTNER_LOGOS } from '@/constants/partnerLogos';
import { cn } from '@/lib/utils';

type PartnerLogosStripProps = {
  title?: string;
  className?: string;
};

export function PartnerLogosStrip({
  title = 'Trusted in Rwanda',
  className = '',
}: PartnerLogosStripProps) {
  return (
    <section className={`px-1 py-10 sm:px-2 ${className}`}>
      {title ? (
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-mira-muted">
          {title}
        </p>
      ) : null}
      <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {PARTNER_LOGOS.map((partner) => {
          const img = (
            <img
              src={partner.src}
              alt={partner.name}
              className={cn(
                'h-8 w-auto object-contain opacity-55 grayscale transition-all hover:opacity-100 hover:grayscale-0 sm:h-9',
                partner.wide ? 'max-w-[180px]' : 'max-w-[110px]',
              )}
              loading="lazy"
            />
          );
          return (
            <li key={partner.name}>
              {partner.href ? (
                <a href={partner.href} target="_blank" rel="noopener noreferrer" title={partner.name}>
                  {img}
                </a>
              ) : (
                img
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
