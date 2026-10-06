import { Link } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm, LOGIN_FORM_ID, loginSubmitLabel } from '@/features/auth/components/LoginForm';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useToast } from '@/context/ToastContext';

export function LoginPage() {
  const login = useLogin();
  const toast = useToast();

  return (
    <AuthLayout
      title="Log in"
      subtitle="Enter the email linked to your coach or clinic account."
      actions={
        <button
          type="submit"
          form={LOGIN_FORM_ID}
          disabled={login.isPending}
          className="mira-btn mira-btn--green w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50">
          {loginSubmitLabel(login.isPending)}
        </button>
      }
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-mira-green hover:underline">
            Get started
          </Link>
        </p>
      }>
      <LoginForm login={login} toast={toast} />
    </AuthLayout>
  );
}
