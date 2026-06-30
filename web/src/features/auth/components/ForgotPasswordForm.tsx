import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { COACH_ROUTES, DEMO_COACH_EMAIL } from '@/features/auth/constants';
import {
  getForgotPasswordErrorMessage,
  useForgotPassword,
} from '@/features/auth/hooks/useForgotPassword';

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState(DEMO_COACH_EMAIL);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(false);
    try {
      await forgotPassword.mutateAsync({ email });
      setSent(true);
    } catch {
      // error shown below
    }
  }

  const error = forgotPassword.isError ? getForgotPasswordErrorMessage(forgotPassword.error) : null;

  if (sent) {
    return (
      <div className="rounded-3xl border border-shamrock-200 bg-shamrock-50 p-6 text-sm text-shamrock-800">
        <p className="text-base text-shamrock-900">Check your inbox</p>
        <p className="mt-2 leading-relaxed">
          If an account exists for <strong>{email}</strong>, we sent password reset instructions.
        </p>
        <Link
          to={COACH_ROUTES.login}
          className="mt-5 inline-block text-sm text-blue-spruce-600 hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert">
          {error}
        </div>
      ) : null}

      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="coach@vitaway.com"
        hint="We'll send a reset link if this email is registered."
      />

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={forgotPassword.isPending}>
        {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-ash-grey-500">
        <Link to={COACH_ROUTES.login} className="text-blue-spruce-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
