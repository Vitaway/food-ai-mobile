import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access the coach dashboard to review meals and manage your queue."
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
