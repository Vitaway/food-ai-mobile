import { Link } from 'react-router-dom';
import { LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms"
      updated="May 23, 2026"
      description="Rules for using MiraFood and Vitaway services.">
      <LegalSection title="Agreement">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of the MiraFood mobile application
          and related services provided by Vitaway (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
          By downloading, accessing, or using MiraFood, you agree to these Terms and our{' '}
          <Link to="/privacy" className="text-blue-spruce-600 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Eligibility">
        <p>
          You must be at least 13 years old (or 16 in the European Economic Area) to use MiraFood. By
          using the app, you represent that you meet this requirement and have the legal capacity to
          enter into these Terms.
        </p>
      </LegalSection>

      <LegalSection title="The service">
        <p>
          MiraFood provides tools for meal logging, nutrition tracking, AI-assisted meal analysis, and
          optional human coach review. Features may change, be added, or removed as we improve the
          product.
        </p>
      </LegalSection>

      <LegalSection title="Medical disclaimer">
        <p>
          <strong>MiraFood is not a medical device and does not provide medical advice.</strong>{' '}
          Nutrition estimates, health scores, and coach feedback are for informational and educational
          purposes only. They are not a substitute for professional medical advice, diagnosis, or
          treatment. Always consult a qualified healthcare provider before making changes to your diet,
          especially if you have a medical condition, eating disorder, or are pregnant or nursing.
        </p>
        <p>
          Do not disregard professional medical advice or delay seeking it because of something you
          read or receive through MiraFood.
        </p>
      </LegalSection>

      <LegalSection title="AI and accuracy">
        <p>
          Meal analysis uses artificial intelligence and may contain errors. Approved nutrition data
          has been reviewed by a coach but remains an estimate. You are responsible for verifying
          information important to your health, including allergens.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity under your account. Notify us immediately at{' '}
          <a href="mailto:support@vitaway.org" className="text-blue-spruce-600 underline">
            support@vitaway.org
          </a>{' '}
          of any unauthorized use.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use MiraFood for any unlawful purpose</li>
          <li>Upload content that is offensive, infringing, or violates others&apos; rights</li>
          <li>Attempt to reverse engineer, scrape, or disrupt the service</li>
          <li>Impersonate another person or misrepresent your identity</li>
          <li>Share coach dashboard credentials with unauthorized parties</li>
        </ul>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          MiraFood, the Vitaway name, logos, and all related content are owned by Vitaway or its
          licensors. You receive a limited, non-exclusive, non-transferable license to use the app for
          personal, non-commercial purposes.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using MiraFood at any time and delete your account from the app. We may suspend
          or terminate access if you violate these Terms or for other legitimate reasons. See our{' '}
          <Link to="/delete-account" className="text-blue-spruce-600 underline">
            Delete account
          </Link>{' '}
          page for data deletion instructions.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Vitaway shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of profits or data,
          arising from your use of MiraFood. Our total liability shall not exceed the amount you paid
          us in the twelve months preceding the claim, or USD $100, whichever is greater.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by applicable laws of the jurisdiction in which Vitaway operates,
          without regard to conflict of law principles. Disputes shall be resolved in the courts of
          that jurisdiction unless otherwise required by mandatory local law.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms:{' '}
          <a href="mailto:legal@vitaway.org" className="text-blue-spruce-600 underline">
            legal@vitaway.org
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
