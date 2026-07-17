import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm, LOGIN_FORM_ID, loginSubmitLabel } from '@/features/auth/components/LoginForm';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useToast } from '@/context/ToastContext';

export function LoginPage() {
  const login = useLogin();
  const toast = useToast();

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your coach or clinic dashboard."
      brandLine="AI estimates in seconds. A real coach reviews every entry before it counts."
      actions={
        <Button
          type="submit"
          form={LOGIN_FORM_ID}
          variant="primary"
          size="lg"
          fullWidth
          disabled={login.isPending}>
          {loginSubmitLabel(login.isPending)}
        </Button>
      }
      footer={
        <p>
          New here?{' '}
          <Link to="/register" className="font-semibold text-blue-spruce-700 hover:underline">
            Download the app
          </Link>
          {' · '}
          Coach?{' '}
          <Link to="/for-coaches" className="font-semibold text-blue-spruce-700 hover:underline">
            Learn about coaching
          </Link>
        </p>
      }>
      <LoginForm login={login} toast={toast} />
    </AuthLayout>
  );
}
