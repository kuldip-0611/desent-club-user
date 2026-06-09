import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'

export const useAuthHandler = () => {
  const setSession = useAuthStore((s) => s.setSession)
  const lines = useCartStore((s) => s.lines)

  const onLoginSuccess = (token: string, user: { id: string; name: string; email: string }) => {
    setSession(token, user)
    void lines
  }

  return { onLoginSuccess }
}
