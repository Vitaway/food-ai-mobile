import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { COACH_ROUTES, DEMO_COACH_EMAIL } from '@/features/auth/constants';
import { getLoginErrorMessage, useLogin } from '@/features/auth/hooks/useLogin';

export function LoginForm() {
  const login = useLogin();
  const [email, setEmail] = useState(DEMO_COACH_EMAIL);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password, rememberMe });
  }

  const error = login.isError ? getLoginErrorMessage(login.error) : null;

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
          to={COACH_ROUTES.forgotPassword}
          className="text-sm text-blue-spruce-600 hover:text-blue-spruce-700 hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-xs text-ash-grey-400">
        Demo: <span className="text-ash-grey-500">{DEMO_COACH_EMAIL}</span> /{' '}
        <span className="text-ash-grey-500">coach1234</span>
      </p>
    </form>
  );
}
