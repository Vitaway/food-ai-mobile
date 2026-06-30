import { Link } from 'react-router-dom';
import { LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy"
      updated="May 23, 2026"
      description="How we collect, use, and protect your data.">
      <LegalSection title="Introduction">
        <p>
          Vitaway (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the MiraFood mobile
          application and related services. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you use MiraFood.
        </p>
        <p>
          By using MiraFood, you agree to the collection and use of information in accordance with
          this policy. If you do not agree, please do not use the app.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>
          <strong>Account & profile data:</strong> Name, email, health goals, body metrics, dietary
          preferences, allergies, activity level, and timezone you provide during onboarding or in
          settings.
        </p>
        <p>
          <strong>Meal & nutrition data:</strong> Photos of meals, text descriptions, ingredient
          lists, macro estimates, meal timestamps, water intake, and streak data.
        </p>
        <p>
          <strong>Device & usage data:</strong> Device type, operating system, app version, crash
          logs, and anonymized usage analytics to improve the service.
        </p>
        <p>
          <strong>Camera, photos & AR:</strong> When you log a meal or measure a plate, we access your
          camera and photo library only with your permission. AR measurement may use device sensors
          including the microphone for session support where required by the platform.
        </p>
        <p>
          <strong>Biometric data:</strong> If you enable app lock, biometric authentication (Face ID,
          Touch ID, or fingerprint) is processed on your device only — we do not receive or store
          biometric templates.
        </p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide meal logging, nutrition tracking, and personalized targets</li>
          <li>Process meals through AI analysis and human coach review</li>
          <li>Send notifications about meal status, hydration, and goals (with your consent)</li>
          <li>Improve accuracy of portion detection and recommendations</li>
          <li>Respond to support requests and enforce our Terms of Service</li>
          <li>Comply with legal obligations</li>
        </ul>
      </LegalSection>

      <LegalSection title="AI and coach review">
        <p>
          Meal images and descriptions may be processed by automated systems (including third-party AI
          services) to estimate ingredients and nutrition. A human nutrition coach may review your
          meal before approved data appears in your diary. Coaches access only the information needed
          to perform reviews.
        </p>
      </LegalSection>

      <LegalSection title="Data sharing">
        <p>We do not sell your personal information. We may share data with:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Service providers</strong> who assist with hosting, AI processing, analytics, and
            customer support — under contractual confidentiality obligations
          </li>
          <li>
            <strong>Coaches</strong> assigned to review your meals as part of the MiraFood service
          </li>
          <li>
            <strong>Legal authorities</strong> when required by law or to protect rights and safety
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          We retain your data while your account is active and as needed to provide the service. You
          may delete your account and associated data from within the app (Profile → Data & privacy)
          or by following the instructions on our{' '}
          <Link to="/delete-account" className="text-blue-spruce-600 underline">
            Delete account
          </Link>{' '}
          page.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, or export your
          data, and to object to or restrict certain processing. Contact us at{' '}
          <a href="mailto:privacy@vitaway.com" className="text-blue-spruce-600 underline">
            privacy@vitaway.com
          </a>{' '}
          to exercise these rights.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          MiraFood is not intended for children under 13 (or 16 in the EEA). We do not knowingly
          collect data from children. Contact us if you believe a child has provided personal data.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use industry-standard measures including encryption in transit, secure storage practices,
          and access controls. No method of transmission over the Internet is 100% secure.
        </p>
      </LegalSection>

      <LegalSection title="International transfers">
        <p>
          Your data may be processed in countries other than your own. We take steps to ensure
          appropriate safeguards are in place.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy from time to time. We will post the revised policy on this page
          and update the &quot;Last updated&quot; date. Continued use after changes constitutes
          acceptance.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Vitaway / MiraFood
          <br />
          Email:{' '}
          <a href="mailto:privacy@vitaway.com" className="text-blue-spruce-600 underline">
            privacy@vitaway.com
          </a>
          <br />
          Support:{' '}
          <a href="mailto:support@vitaway.com" className="text-blue-spruce-600 underline">
            support@vitaway.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
