export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'PHONE'

export type AuthUser = {
  id: string
  name: string
  email: string | null
  phone: string | null
  profileImage: string | null
  role: 'USER' | 'ADMIN'
  isVerified: boolean
  provider: AuthProvider
}

export type AuthTokensResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type RegisterPayload = {
  email: string
  name: string
  password: string
}

export type UserLoginPayload = {
  email: string
  password: string
}

export type VerifyEmailOtpPayload = {
  email: string
  otp: string
  name?: string
}

export type SendEmailOtpPayload = {
  email: string
  name?: string
}

export type AuthAction = 'login' | 'register'

export type OtpContext = {
  action: AuthAction
  email: string
  name: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  password: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}
