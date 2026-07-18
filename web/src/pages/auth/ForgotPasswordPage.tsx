import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AUTH_ROUTES } from '@/features/auth/constants';
import {
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyResetCode,
} from '@/features/auth/api/authApi';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

type Step = 'email' | 'code' | 'password' | 'done';

const FORM_ID = 'forgot-password-form';

export function ForgotPasswordPage() {
  const toast = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset({ email });
      setStep('code');
      toast.success(
        `If an account exists for ${email.trim()}, we sent a 6-digit code.`,
        'Check your inbox',
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to send reset code'), 'Reset unavailable');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    if (normalized.length !== 6) {
      toast.error('Enter the 6-digit code from your email.', 'Invalid code');
      return;
    }
    setBusy(true);
    try {
      await verifyResetCode(email, normalized);
      setCode(normalized);
      setStep('password');
      toast.success('Code confirmed. Choose a new password.', 'Verified');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid or expired code'), 'Code not accepted');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.', 'Invalid password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.', 'Invalid password');
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithOtp(email, code, password);
      setStep('done');
      toast.success('You can sign in with your new password.', 'Password updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to reset password'), 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    try {
      await requestPasswordReset({ email });
      toast.success('If an account exists, we sent a new code.', 'Code resent');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to resend code'), 'Resend failed');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'done') {
    return (
      <AuthLayout title="Password updated" subtitle="Your MiraFood account is ready again.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-shamrock-200 bg-shamrock-50 p-5 text-sm text-shamrock-800">
            <p className="font-normal text-shamrock-900">All set</p>
            <p className="mt-2 leading-relaxed">
              Your password has been changed. Sign in with your new password to continue.
            </p>
          </div>
          <Link to={AUTH_ROUTES.login}>
            <Button variant="primary" size="lg" fullWidth>
              Sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'password') {
    return (
      <AuthLayout
        title="Choose a new password"
        subtitle="Pick something strong that you have not used here before."
        actions={
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="lg"
            fullWidth
            disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </Button>
        }>
        <form id={FORM_ID} onSubmit={(e) => void handleResetPassword(e)} className="space-y-5">
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
      </AuthLayout>
    );
  }

  if (step === 'code') {
    return (
      <AuthLayout
        title="Enter your code"
        subtitle={`We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
        actions={
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="lg"
            fullWidth
            disabled={busy}>
            {busy ? 'Checking…' : 'Continue'}
          </Button>
        }>
        <form id={FORM_ID} onSubmit={(e) => void handleVerifyCode(e)} className="space-y-5">
          <TextField
            label="Reset code"
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            hint="Check your inbox and spam folder."
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleResend()}
              className="text-blue-spruce-600 hover:underline disabled:opacity-50">
              Resend code
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep('email');
                setCode('');
              }}
              className="text-ash-grey-500 hover:underline disabled:opacity-50">
              Change email
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email a one-time code if your account exists."
      actions={
        <Button
          type="submit"
          form={FORM_ID}
          variant="primary"
          size="lg"
          fullWidth
          disabled={busy}>
          {busy ? 'Sending…' : 'Send reset code'}
        </Button>
      }>
      <form id={FORM_ID} onSubmit={(e) => void handleSendCode(e)} className="space-y-5">
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@vitaway.org"
          hint="You'll enter the code here — no email link required."
        />
        <p className="text-center text-sm text-ash-grey-500">
          <Link to={AUTH_ROUTES.login} className="text-blue-spruce-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
