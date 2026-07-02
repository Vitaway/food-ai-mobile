import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AUTH_ROUTES } from '@/features/auth/constants';
import { resetPasswordWithToken } from '@/features/auth/api/authApi';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

const FORM_ID = 'forgot-password-form';
const RESET_FORM_ID = 'reset-password-form';

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const resetToken = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const forgotPassword = useForgotPassword();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

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

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.', 'Invalid password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.', 'Invalid password');
      return;
    }

    setResetting(true);
    try {
      await resetPasswordWithToken(resetToken, password);
      setResetDone(true);
      toast.success('You can sign in with your new password.', 'Password updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to reset password'), 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  if (resetToken) {
    return (
      <AuthLayout
        title="Choose a new password"
        subtitle="Enter a strong password for your MiraFood account."
        actions={
          resetDone ? undefined : (
            <Button
              type="submit"
              form={RESET_FORM_ID}
              variant="primary"
              size="lg"
              fullWidth
              disabled={resetting}>
              {resetting ? 'Updating…' : 'Update password'}
            </Button>
          )
        }>
        {resetDone ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-shamrock-200 bg-shamrock-50 p-5 text-sm text-shamrock-800">
              <p className="font-normal text-shamrock-900">Password updated</p>
              <p className="mt-2 leading-relaxed">Your password has been changed. Sign in to continue.</p>
            </div>
            <Link to={AUTH_ROUTES.login}>
              <Button variant="primary" size="lg" fullWidth>
                Sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form id={RESET_FORM_ID} onSubmit={handleResetSubmit} className="space-y-5">
            <TextField
              label="New password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <TextField
              label="Confirm password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </form>
        )}
      </AuthLayout>
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
            placeholder="you@vitaway.org"
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
