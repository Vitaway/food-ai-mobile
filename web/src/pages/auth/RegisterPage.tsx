import { Link } from 'react-router-dom';
import { AppStoreBadgesLight } from '@/components/marketing/AppStoreBadges';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AUTH_ROUTES } from '@/features/auth/constants';

export function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="New MiraFood accounts are set up on mobile — download the app to register and get your Vitaway patient file ID."
      actions={
        <Button to="/download" variant="primary" size="lg" fullWidth>
          Go to download page
        </Button>
      }
      footer={
        <p>
          Already have an account?{' '}
          <Link to={AUTH_ROUTES.login} className="font-semibold text-blue-spruce-700 hover:underline">
            Sign in
          </Link>
        </p>
      }>
      <div className="space-y-5 text-center">
        <p className="text-sm leading-relaxed text-ash-grey-600">
          Use the MiraFood app on iPhone or Android to create your account, complete onboarding, and
          start logging meals. Once registered, you can also sign in here on the web.
        </p>
        <div className="flex justify-center">
          <AppStoreBadgesLight />
        </div>
      </div>
    </AuthLayout>
  );
}
