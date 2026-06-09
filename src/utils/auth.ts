import type { OtpContext, User } from '@/src/types/auth';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';
const OTP_CONTEXT_KEY = 'otp_context';

export const setAuthSession = (token: string, user: User) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getAuthUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(AUTH_USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
};

export const setOtpContext = (context: OtpContext) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(OTP_CONTEXT_KEY, JSON.stringify(context));
};

export const getOtpContext = (): OtpContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(OTP_CONTEXT_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as OtpContext;
  } catch {
    return null;
  }
};

export const clearOtpContext = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(OTP_CONTEXT_KEY);
};
