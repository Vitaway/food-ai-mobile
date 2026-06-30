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
    <div className="bg-ash-grey-50">
      <MarketingPageHero
        title={title}
        description={description ?? `Last updated: ${updated}`}
        compact
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          to="/legal"
          className="text-sm font-normal text-blue-spruce-600 hover:text-blue-spruce-700">
          ← All legal & policy pages
        </Link>
        <p className="mt-4 text-sm text-ash-grey-500">Last updated: {updated}</p>
        <article className="mt-8 space-y-8 text-ash-grey-700">{children}</article>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-ash-grey-200 pt-8 text-sm">
          <Link to="/privacy" className="text-blue-spruce-600 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-blue-spruce-600 hover:underline">
            Terms of Service
          </Link>
          <Link to="/support" className="text-blue-spruce-600 hover:underline">
            Support
          </Link>
          <Link to="/delete-account" className="text-blue-spruce-600 hover:underline">
            Delete account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl text-ash-grey-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
