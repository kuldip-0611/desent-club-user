export type AuthMethod = 'email' | 'phone';

export type AuthAction = 'login' | 'register';

export type SendOtpPayload = {
  email?: string;
  phone?: string;
  name?: string;
};

export type VerifyOtpPayload = {
  email?: string;
  phone?: string;
  otp: string;
  name?: string;
};

export type RegisterPayload = {
  email: string;
  name: string;
  password: string;
};

export type UserLoginPayload = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  provider: AuthMethod | 'google';
  role?: 'USER' | 'ADMIN';
  isVerified?: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type ApiError = {
  message: string;
};

export type OtpContext = {
  method: 'email';
  action: AuthAction;
  value: string;
  name: string;
};
