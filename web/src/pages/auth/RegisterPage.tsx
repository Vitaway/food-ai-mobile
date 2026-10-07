import { Link } from 'react-router-dom';
import { AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AUTH_ROUTES } from '@/features/auth/constants';

export function RegisterPage() {
  return (
    <AuthLayout
      title="Get the app"
      subtitle="Create your MiraFood account on iPhone or Android."
      footer={
        <p>
          Already have an account?{' '}
          <Link to={AUTH_ROUTES.login} className="font-semibold text-mira-green hover:underline">
            Login
          </Link>
        </p>
      }>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-mira-muted">
          Download MiraFood, complete onboarding, and start logging meals. Coaches can also log in
          here on the web after they’re set up.
        </p>
        <div className="flex justify-center">
          <AppStoreBadgesLight />
        </div>
      </div>
    </AuthLayout>
  );
}
