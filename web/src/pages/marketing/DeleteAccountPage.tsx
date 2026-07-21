import { LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

export function DeleteAccountPage() {
  return (
    <LegalPageLayout
      title="Delete account"
      updated="May 23, 2026"
      description="Remove your MiraFood account and personal data.">
      <LegalSection title="Overview">
        <p>
          You can delete your MiraFood account and associated personal data at any time. This page
          describes how to do so, what data is removed, and what you can expect after deletion.
        </p>
      </LegalSection>

      <LegalSection title="Delete from the app (recommended)">
        <ol className="list-decimal space-y-3 pl-5">
          <li>Open the MiraFood app on your device</li>
          <li>Go to <strong>Profile</strong> (bottom tab)</li>
          <li>Tap <strong>Data & privacy</strong></li>
          <li>Scroll to <strong>Delete account</strong></li>
          <li>Confirm deletion when prompted</li>
        </ol>
        <p className="mt-4">
          Account deletion is processed on your device and synced to our servers. This action is
          permanent and cannot be undone.
        </p>
      </LegalSection>

      <LegalSection title="Request deletion by email">
        <p>
          If you cannot access the app, email{' '}
          <a href="mailto:support@vitaway.org" className="text-blue-spruce-600 underline">
            support@vitaway.org
          </a>{' '}
          from the address linked to your account with the subject line &quot;Account deletion
          request.&quot; Include your full name and the email used for MiraFood. We will verify your
          identity and process the request within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="What gets deleted">
        <ul className="list-disc space-y-2 pl-5">
          <li>Profile information (name, email, health goals, preferences)</li>
          <li>Meal logs, photos, and nutrition history</li>
          <li>Streaks, insights, and in-app preferences</li>
          <li>Notification settings and local app data</li>
        </ul>
      </LegalSection>

      <LegalSection title="What may be retained">
        <p>
          We may retain limited information where required by law (e.g., tax, fraud prevention) or in
          anonymized form for analytics. Backup copies may persist for up to 90 days before permanent
          removal from all systems.
        </p>
      </LegalSection>

      <LegalSection title="Before you delete">
        <p>
          If you only want to clear nutrition data without deleting your account, use{' '}
          <strong>Reset nutrition data</strong> in Profile → Data & privacy instead.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          Contact{' '}
          <a href="mailto:support@vitaway.org" className="text-blue-spruce-600 underline">
            support@vitaway.org
          </a>{' '}
          for privacy-related deletion questions.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
