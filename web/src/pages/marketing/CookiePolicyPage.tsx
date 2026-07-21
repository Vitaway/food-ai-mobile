import { LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

export function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookies"
      updated="May 23, 2026"
      description="How Vitaway uses cookies on the MiraFood website.">
      <LegalSection title="What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the
          site remember preferences and understand how visitors use our pages.
        </p>
      </LegalSection>

      <LegalSection title="Cookies we use">
        <p>
          <strong>Essential cookies:</strong> Required for the website to function, such as remembering
          navigation state and security preferences.
        </p>
        <p>
          <strong>Analytics cookies (optional):</strong> If enabled, we may use anonymized analytics to
          understand traffic and improve our marketing site. We do not sell data from cookies.
        </p>
      </LegalSection>

      <LegalSection title="Mobile app">
        <p>
          The MiraFood mobile app does not use browser cookies. App data is stored on your device and
          our servers as described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          You can block or delete cookies through your browser settings. Disabling essential cookies may
          affect how some parts of this website work.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy:{' '}
          <a href="mailto:hello@vitaway.org" className="text-blue-spruce-600 underline">
            hello@vitaway.org
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
