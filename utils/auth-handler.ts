import type { AuthTokensResponse } from '@/types/auth'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'

export const useAuthHandler = () => {
  const setAuthResponse = useAuthStore((s) => s.setAuthResponse)
  const lines = useCartStore((s) => s.lines)

  const onLoginSuccess = (response: AuthTokensResponse) => {
    setAuthResponse(response)
    void lines
  }

  return { onLoginSuccess }
}
