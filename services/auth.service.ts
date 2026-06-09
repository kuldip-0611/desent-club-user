import type { AuthUser } from '@/types/user'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const loginWithEmail = async (email: string): Promise<{ token: string; user: AuthUser }> => {
  await sleep(350)
  return {
    token: `mock-jwt-${Date.now()}`,
    user: { id: 'u1', name: email.split('@')[0] || 'Shopper', email },
  }
}

export const registerWithEmail = async (name: string, email: string): Promise<{ token: string; user: AuthUser }> => {
  await sleep(350)
  return {
    token: `mock-jwt-${Date.now()}`,
    user: { id: `u-${Date.now()}`, name, email },
  }
}
