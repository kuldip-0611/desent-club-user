import { api } from '@/src/services/api';
import type {
  AuthResponse,
  RegisterPayload,
  SendOtpPayload,
  UserLoginPayload,
  VerifyOtpPayload,
} from '@/src/types/auth';

export const registerAccount = async (payload: RegisterPayload) => {
  const { data } = await api.post<{ message: string }>('/auth/register', payload);
  return data;
};

export const userLogin = async (payload: UserLoginPayload) => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const sendEmailOtp = async (payload: SendOtpPayload) => {
  const { data } = await api.post<{ message: string }>('/auth/email/send-otp', payload);
  return data;
};

export const resendEmailOtp = async (payload: SendOtpPayload) => {
  const { data } = await api.post<{ message: string }>('/auth/email/resend-otp', payload);
  return data;
};

export const verifyEmailOtp = async (payload: VerifyOtpPayload) => {
  const { data } = await api.post<AuthResponse>('/auth/email/verify-otp', payload);
  return data;
};
