export type {
  AuthAction,
  AuthProvider,
  AuthTokensResponse as AuthResponse,
  AuthUser as User,
  AuthUser,
  OtpContext,
  RegisterPayload,
  SendEmailOtpPayload,
  UserLoginPayload,
  VerifyEmailOtpPayload as VerifyOtpPayload,
} from '@/types/auth'

export type AuthMethod = 'email'

export type ApiError = {
  message: string
}
