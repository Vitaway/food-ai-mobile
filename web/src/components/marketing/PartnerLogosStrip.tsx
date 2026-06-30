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
    <section className={`bg-white py-10 sm:py-14 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title ? (
          <p className="text-center text-[11px] uppercase tracking-[0.22em] text-ash-grey-400">
            {title}
          </p>
        ) : null}

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-12 lg:gap-x-14">
          {PARTNER_LOGOS.map((partner) => {
            const img = (
              <img
                src={partner.src}
                alt={partner.name}
                className={cn(
                  'h-9 w-auto object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-10',
                  partner.wide ? 'max-w-[200px] sm:max-w-[240px]' : 'max-w-[120px] sm:max-w-[140px]',
                )}
                loading="lazy"
              />
            );

            return (
              <li key={partner.name} className="flex shrink-0 items-center justify-center">
                {partner.href ? (
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-spruce-400 focus-visible:ring-offset-2"
                    title={partner.name}>
                    {img}
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
