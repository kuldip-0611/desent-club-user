import type { AuthTokensResponse } from '@/types/auth'
import { useAuthStore } from '@/store/auth-store'

export const useAuthHandler = () => {
  const setAuthResponse = useAuthStore((s) => s.setAuthResponse)

  const onLoginSuccess = (response: AuthTokensResponse) => {
    setAuthResponse(response)
  }

  return { onLoginSuccess }
}
