import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AUTH_ROUTES } from '@/features/auth/constants';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

const FORM_ID = 'forgot-password-form';

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(false);
    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => {
          setSent(true);
          toast.success(
            `If an account exists for ${email.trim()}, we sent reset instructions.`,
            'Check your inbox',
          );
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, 'Unable to send reset link'), 'Reset unavailable'),
      },
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email reset instructions if your account exists."
      actions={
        sent ? null : (
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="lg"
            fullWidth
            disabled={forgotPassword.isPending}>
            {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        )
      }>
      {sent ? (
        <div className="rounded-2xl border border-shamrock-200 bg-shamrock-50 p-5 text-sm text-shamrock-800">
          <p className="font-normal text-shamrock-900">Check your inbox</p>
          <p className="mt-2 leading-relaxed">
            If an account exists for <strong>{email}</strong>, we sent password reset instructions.
          </p>
          <Link
            to={AUTH_ROUTES.login}
            className="mt-4 inline-block text-sm text-blue-spruce-600 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@vitaway.com"
            hint="We'll send a reset link if this email is registered."
          />

          <p className="text-center text-sm text-ash-grey-500">
            <Link to={AUTH_ROUTES.login} className="text-blue-spruce-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
