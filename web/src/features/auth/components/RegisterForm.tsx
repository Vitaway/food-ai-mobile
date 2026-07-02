import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { TextField } from '@/components/ui/Field';
import { AUTH_ROUTES } from '@/features/auth/constants';
import type { useRegister } from '@/features/auth/hooks/useRegister';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { isRegisterFormValid } from '@/lib/authForm';
import { isPasswordAcceptable } from '@/lib/passwordStrength';
import type { useToast } from '@/context/ToastContext';

export const REGISTER_FORM_ID = 'register-form';

type RegisterFormProps = {
  register: ReturnType<typeof useRegister>;
  toast: ReturnType<typeof useToast>;
  onValidityChange?: (valid: boolean) => void;
};

export function RegisterForm({ register, toast, onValidityChange }: RegisterFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const valid = useMemo(
    () => isRegisterFormValid({ displayName, email, password, confirmPassword }),
    [displayName, email, password, confirmPassword],
  );

  useEffect(() => {
    onValidityChange?.(valid);
  }, [onValidityChange, valid]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isPasswordAcceptable(password)) {
      toast.error('Choose a stronger password (8+ characters with mixed case and a number).');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    register.mutate(
      { displayName, email, password, rememberMe },
      {
        onSuccess: () => toast.success('Account created — welcome to MiraFood.', 'Welcome'),
        onError: (error) =>
          toast.error(getApiErrorMessage(error, 'Registration failed'), 'Registration failed'),
      },
    );
  }

  return (
    <form id={REGISTER_FORM_ID} onSubmit={handleSubmit} className="space-y-5">
      <TextField
        label="Full name"
        type="text"
        name="displayName"
        autoComplete="name"
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Your name"
      />

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

      <div>
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a strong password"
        />
        <div className="mt-3">
          <PasswordStrengthMeter password={password} />
        </div>
      </div>

      <TextField
        label="Confirm password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your password"
        error={
          confirmPassword && confirmPassword !== password ? 'Passwords do not match' : undefined
        }
      />

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ash-grey-600">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-ash-grey-300 text-blue-spruce-600 focus:ring-blue-spruce-400"
        />
        Remember me
      </label>

      <p className="text-center text-sm text-ash-grey-500">
        Already have an account?{' '}
        <Link to={AUTH_ROUTES.login} className="text-blue-spruce-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function registerSubmitLabel(pending: boolean) {
  return pending ? 'Creating account…' : 'Create account';
}
