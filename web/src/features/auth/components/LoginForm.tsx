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
  const [rememberMe, setRememberMe] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password, rememberMe },
      {
        onSuccess: () => toast.success('Welcome back!', 'Signed in'),
        onError: (error) => toast.error(getApiErrorMessage(error, 'Sign in failed'), 'Sign in failed'),
      },
    );
  }

  return (
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

      <div className="flex items-center justify-between gap-4">
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
    </form>
  );
}

export const LOGIN_FORM_ID = FORM_ID;

export function loginSubmitLabel(pending: boolean) {
  return pending ? 'Signing in…' : 'Sign in';
}
