import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MarketingPageHero } from '@/components/marketing/MarketingPageHero';

type LegalPageLayoutProps = {
  title: string;
  updated: string;
  description?: string;
  children: ReactNode;
};

export function LegalPageLayout({ title, updated, description, children }: LegalPageLayoutProps) {
  return (
    <div>
      <MarketingPageHero
        title={title}
        description={description ?? `Last updated: ${updated}`}
        compact
      />
      <div className="px-1 pb-12 sm:px-2 sm:pb-16">
        <div className="mx-auto max-w-3xl">
          <Link to="/legal" className="text-sm font-medium text-mira-green hover:underline">
            ← All legal & policy pages
          </Link>
          <p className="mt-4 text-sm text-mira-muted">Last updated: {updated}</p>
          <article className="legal-prose mt-8 space-y-8 text-mira-muted">{children}</article>
          <div className="mt-12 flex flex-wrap gap-4 border-t border-mira-line pt-8 text-sm">
            <Link to="/privacy" className="font-medium text-mira-green hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="font-medium text-mira-green hover:underline">
              Terms of Service
            </Link>
            <Link to="/support" className="font-medium text-mira-green hover:underline">
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-mira-green">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
