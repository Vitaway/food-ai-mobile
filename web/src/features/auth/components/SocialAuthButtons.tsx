import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithApple, signInWithGoogle } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { resolvePostLoginPath } from '@/features/auth/utils/routing';
import { useToast } from '@/context/ToastContext';
import { getApiErrorMessage } from '@/lib/apiErrors';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;

type LoginLocationState = {
  from?: { pathname: string };
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
      };
    };
  }
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function SocialAuthButtons() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const from = (location.state as LoginLocationState | null)?.from?.pathname;
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;
    let cancelled = false;

    void loadScript('https://accounts.google.com/gsi/client', 'google-gsi')
      .then(() => {
        if (cancelled || !window.google || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            void (async () => {
              setBusy('google');
              try {
                const session = await signInWithGoogle(response.credential);
                setSession(session);
                toast.success('Welcome back!', 'Signed in with Google');
                navigate(resolvePostLoginPath(session.user.role, from), { replace: true });
              } catch (error) {
                toast.error(getApiErrorMessage(error, 'Google sign-in failed'), 'Sign in failed');
              } finally {
                setBusy(null);
              }
            })();
          },
        });
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 320,
          text: 'continue_with',
          shape: 'rectangular',
        });
      })
      .catch(() => {
        /* GIS optional when client id missing / blocked */
      });

    return () => {
      cancelled = true;
    };
  }, [from, navigate, setSession, toast]);

  async function handleApple() {
    if (!APPLE_CLIENT_ID) {
      toast.error(
        'Apple sign-in is not configured for this environment yet. Use email login.',
        'Unavailable',
      );
      return;
    }
    setBusy('apple');
    try {
      await loadScript(
        'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
        'apple-auth',
      );
      if (!window.AppleID) throw new Error('Apple Sign In failed to load');
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const result = await window.AppleID.auth.signIn();
      const fullName = [result.user?.name?.firstName, result.user?.name?.lastName]
        .filter(Boolean)
        .join(' ');
      const session = await signInWithApple(result.authorization.id_token, {
        fullName: fullName || undefined,
        email: result.user?.email,
      });
      setSession(session);
      toast.success('Welcome back!', 'Signed in with Apple');
      navigate(resolvePostLoginPath(session.user.role, from), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Apple sign-in failed'), 'Sign in failed');
    } finally {
      setBusy(null);
    }
  }

  function handleGoogleFallback() {
    if (!GOOGLE_CLIENT_ID) {
      toast.error(
        'Google sign-in is not configured for this environment yet. Use email login.',
        'Unavailable',
      );
      return;
    }
    window.google?.accounts.id.prompt();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-mira-green/15" />
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-mira-muted">
          Or continue with
        </span>
        <div className="h-px flex-1 bg-mira-green/15" />
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div ref={googleBtnRef} className="flex min-h-11 w-full justify-center overflow-hidden rounded-[4px]" />
      ) : (
        <button
          type="button"
          onClick={handleGoogleFallback}
          disabled={busy !== null}
          className="mira-btn mira-btn--outline w-full gap-2 py-3 disabled:opacity-50">
          <GoogleGlyph />
          Continue with Google
        </button>
      )}

      <button
        type="button"
        onClick={() => void handleApple()}
        disabled={busy !== null}
        className="mira-btn w-full gap-2 bg-mira-black py-3 text-white hover:bg-black disabled:opacity-50">
        <AppleGlyph />
        {busy === 'apple' ? 'Connecting…' : 'Continue with Apple'}
      </button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.37 12.26c.03 3.12 2.74 4.16 2.77 4.17-.02.07-.43 1.48-1.43 2.93-.86 1.25-1.76 2.5-3.17 2.52-1.39.03-1.84-.83-3.43-.83-1.6 0-2.09.8-3.41.85-1.37.05-2.41-1.35-3.28-2.59C2.57 16.55 1.2 12.3 3.05 9.45c.92-1.42 2.56-2.32 4.34-2.34 1.35-.03 2.63.91 3.43.91.8 0 2.3-1.12 3.88-.96.66.03 2.52.27 3.71 2.01-.1.06-2.21 1.29-2.04 3.19ZM14.7 5.64c.73-.88 1.22-2.11 1.09-3.33-1.05.04-2.32.7-3.07 1.58-.68.78-1.27 2.03-1.11 3.23 1.17.09 2.37-.6 3.09-1.48Z" />
    </svg>
  );
}
