import { apiClient } from '@/services/api/client'
import type {
  AuthTokensResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SendEmailOtpPayload,
  UserLoginPayload,
  VerifyEmailOtpPayload,
} from '@/types/auth'

export const registerAccount = async (payload: RegisterPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/register', payload)
  return data
}

export const userLogin = async (payload: UserLoginPayload): Promise<AuthTokensResponse> => {
  const { data } = await apiClient.post<AuthTokensResponse>('/auth/login', payload)
  return data
}

export const sendEmailOtp = async (payload: SendEmailOtpPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/email/send-otp', payload)
  return data
}

export const resendEmailOtp = async (payload: SendEmailOtpPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/email/resend-otp', payload)
  return data
}

export const verifyEmailOtp = async (payload: VerifyEmailOtpPayload): Promise<AuthTokensResponse> => {
  const { data } = await apiClient.post<AuthTokensResponse>('/auth/email/verify-otp', payload)
  return data
}

export const refreshAuthTokens = async (refreshToken: string): Promise<AuthTokensResponse> => {
  const { data } = await apiClient.post<AuthTokensResponse>('/auth/refresh', { refreshToken })
  return data
}

export const logoutSession = async (): Promise<void> => {
  await apiClient.post('/auth/logout')
}

export const forgotPassword = async (
  payload: ForgotPasswordPayload,
): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', payload)
  return data
}

export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', payload)
  return data
}

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/change-password', payload)
  return data
}

export const loginWithGoogle = async (token: string): Promise<AuthTokensResponse> => {
  const { data } = await apiClient.post<AuthTokensResponse>('/auth/google', { token })
  return data
}
