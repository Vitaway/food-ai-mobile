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
      title="Sign in"
      subtitle="Sign in with your Vitaway account. You'll land on the right experience for your role."
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
        <p className="text-center text-sm text-white/75">
          New here?{' '}
          <Link to="/register" className="font-semibold text-white hover:underline">
            Download the app to create an account
          </Link>
          {' · '}
          Coach?{' '}
          <Link to="/for-coaches" className="font-semibold text-white hover:underline">
            Learn about coaching
          </Link>
        </p>
      }>
      <LoginForm login={login} toast={toast} />
    </AuthLayout>
  );
}
