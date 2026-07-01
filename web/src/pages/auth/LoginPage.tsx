import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Coaches and platform admins use one sign-in. You’ll land on the right dashboard for your account."
      footer={
        <p className="text-center text-sm text-ash-grey-500">
          Not a coach yet?{' '}
          <Link to="/for-coaches" className="text-blue-spruce-600 hover:underline">
            Learn about coaching on MiraFood
          </Link>
        </p>
      }>
      <LoginForm />
    </AuthLayout>
  );
}
