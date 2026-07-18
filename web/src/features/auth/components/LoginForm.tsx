import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from '@/components/ui/Field';
import { AUTH_ROUTES } from '@/features/auth/constants';
import type { useLogin } from '@/features/auth/hooks/useLogin';
import { getApiErrorMessage } from '@/lib/apiErrors';
import type { useToast } from '@/context/ToastContext';

const FORM_ID = 'login-form';

type LoginFormProps = {
  login: ReturnType<typeof useLogin>;
  toast: ReturnType<typeof useToast>;
};

export function LoginForm({ login, toast }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [debugHint, setDebugHint] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (challengeToken) {
      login.mutate(
        { email, password, rememberMe, mfaCode, challengeToken },
        {
          onSuccess: () => toast.success('Welcome back!', 'Signed in'),
          onError: (error) =>
            toast.error(getApiErrorMessage(error, 'Verification failed'), 'Sign in failed'),
        },
      );
      return;
    }

    login.mutate(
      { email, password, rememberMe },
      {
        onSuccess: (result) => {
          if (result && 'mfaRequired' in result && result.mfaRequired) {
            setChallengeToken(result.challengeToken);
            setDebugHint(result.debugCode ?? null);
            toast.success('Check your email for a verification code', 'Verify sign-in');
            return;
          }
          toast.success('Welcome back!', 'Signed in');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Sign in failed'), 'Sign in failed'),
      },
    );
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {!challengeToken ? (
        <>
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@vitaway.org"
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <div className="flex items-center justify-between gap-4 pt-0.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ash-grey-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-ash-grey-300 text-blue-spruce-600 focus:ring-blue-spruce-400"
              />
              Remember me
            </label>
            <Link
              to={AUTH_ROUTES.forgotPassword}
              className="text-sm text-blue-spruce-600 hover:text-blue-spruce-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ash-grey-600">
            Enter the 6-digit code sent to <span className="font-semibold">{email}</span>.
          </p>
          <TextField
            label="Verification code"
            type="text"
            name="mfaCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
          />
          {debugHint ? (
            <p className="text-xs text-ash-grey-500">Dev code: {debugHint}</p>
          ) : null}
          <button
            type="button"
            className="text-sm text-blue-spruce-600 hover:underline"
            onClick={() => {
              setChallengeToken(null);
              setMfaCode('');
              setDebugHint(null);
            }}>
            Back to password
          </button>
        </>
      )}
    </form>
  );
}

export const LOGIN_FORM_ID = FORM_ID;

export function loginSubmitLabel(pending: boolean, mfaStep = false) {
  if (pending) return mfaStep ? 'Verifying…' : 'Signing in…';
  return mfaStep ? 'Verify code' : 'Sign in';
}
