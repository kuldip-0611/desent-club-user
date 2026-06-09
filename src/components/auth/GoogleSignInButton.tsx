'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FcGoogle } from 'react-icons/fc';

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  variant?: 'auth' | 'modal';
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'signup_with' | 'continue_with';
            },
          ) => void;
        };
      };
    };
  }
}

export const GoogleSignInButton = ({
  onCredential,
  disabled = false,
  label = 'Continue with Google',
  variant = 'auth',
}: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const allowMock = process.env.NEXT_PUBLIC_GOOGLE_MOCK === 'true';

  const handleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      if (response.credential) {
        void onCredential(response.credential);
      }
    },
    [onCredential],
  );

  useEffect(() => {
    if (!clientId || disabled || !containerRef.current) return;

    const mountButton = () => {
      if (!containerRef.current || !window.google?.accounts?.id) return;
      containerRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: variant === 'auth' ? 'outline' : 'outline',
        size: 'large',
        width: containerRef.current.offsetWidth || 320,
        text: 'continue_with',
      });
    };

    if (window.google?.accounts?.id) {
      mountButton();
      return;
    }

    const existing = document.querySelector('script[data-google-gsi]');
    if (existing) {
      existing.addEventListener('load', mountButton);
      return () => existing.removeEventListener('load', mountButton);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = mountButton;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [clientId, disabled, handleCredential, variant]);

  const mockSignIn = () => {
    const email = window.prompt('Dev mock Google email', 'google.user@example.com');
    if (!email?.trim()) return;
    const name = email.split('@')[0] ?? 'Google User';
    void onCredential(`mock:google-dev:${email.trim()}:${name}`);
  };

  if (!clientId) {
    if (!allowMock) {
      return (
        <p className="text-center text-xs text-white/60">
          Google sign-in is not configured (set NEXT_PUBLIC_GOOGLE_CLIENT_ID).
        </p>
      );
    }
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={mockSignIn}
        className={
          variant === 'auth'
            ? 'flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50'
            : 'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-50'
        }
      >
        <FcGoogle className="h-5 w-5" />
        {label} (dev)
      </button>
    );
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
    </div>
  );
};
