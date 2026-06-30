import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email reset instructions if your account exists.">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
