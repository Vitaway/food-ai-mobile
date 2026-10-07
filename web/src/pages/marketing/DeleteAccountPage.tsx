import { useState, type FormEvent } from 'react';
import { LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { CONTACT_EMAIL } from '@/constants/contact';
import { apiRequest, ApiError } from '@/lib/apiClient';

export function DeleteAccountPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = await apiRequest<{ ok: boolean; message: string }>(
        '/consumer/account/deletion-request',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            displayName: name.trim() || undefined,
            note: note.trim() || undefined,
          }),
        },
      );
      setSuccess(data.message);
      setName('');
      setEmail('');
      setNote('');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : `Could not submit the request. Email ${CONTACT_EMAIL} with subject "Account deletion request."`;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LegalPageLayout
      title="Delete account"
      updated="July 28, 2026"
      description="Remove your MiraFood account and personal data.">
      <LegalSection title="Overview">
        <p>
          You can delete your MiraFood account and associated personal data at any time. Use the app
          (fastest) or the web form below if you cannot open the app. Deletion requests submitted here
          are processed within <strong>30 days</strong> after we verify the account email.
        </p>
      </LegalSection>

      <LegalSection title="Delete from the app (recommended)">
        <ol className="list-decimal space-y-3 pl-5">
          <li>Open the MiraFood app on your device</li>
          <li>
            Go to <strong>Profile</strong> (bottom tab)
          </li>
          <li>
            Tap <strong>Data & privacy</strong>
          </li>
          <li>
            Scroll to <strong>Delete account</strong>
          </li>
          <li>Confirm deletion when prompted</li>
        </ol>
        <p className="mt-4">
          In-app deletion removes your account immediately on our servers. This action is permanent
          and cannot be undone.
        </p>
      </LegalSection>

      <LegalSection title="Request deletion on the web">
        <p>
          Submit the form below using the email address linked to your MiraFood account. We will
          verify ownership and complete deletion within 30 days. You can also email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-mira-green underline">
            {CONTACT_EMAIL}
          </a>{' '}
          with the subject line &quot;Account deletion request.&quot;
        </p>

        <form
          className="mira-form-on-dark mt-6 space-y-4 rounded-[1.25rem] bg-mira-green p-5 text-white"
          onSubmit={handleSubmit}>
          <TextField
            variant="line"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
          <TextField
            variant="line"
            label="Account email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            hint="Must match the email on your MiraFood account."
          />
          <TextAreaField
            variant="line"
            label="Optional note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything we should know (optional)"
          />
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          {success ? <p className="text-sm text-white">{success}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="mira-btn mira-btn--black w-full disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Request account deletion'}
          </button>
        </form>
      </LegalSection>

      <LegalSection title="What gets deleted">
        <ul className="list-disc space-y-2 pl-5">
          <li>Profile information (name, email, health goals, preferences)</li>
          <li>Meal logs, photos, and nutrition history</li>
          <li>Streaks, insights, and in-app preferences</li>
          <li>Notification settings and local app data</li>
          <li>Coach chat history tied to your patient account</li>
        </ul>
      </LegalSection>

      <LegalSection title="What may be retained">
        <p>
          We may retain limited information where required by law (e.g. tax, fraud prevention) or in
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
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-mira-green underline">
            {CONTACT_EMAIL}
          </a>{' '}
          for privacy-related deletion questions.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
