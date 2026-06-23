import type { AuthUser, LoginPayload, RegisterPayload } from '@repo/shared'
import { apiRequest } from './client'

export const authApi = {
  me(): Promise<{ user: AuthUser }> {
    return apiRequest('/auth/me')
  },

  register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  login(payload: LoginPayload): Promise<{ user: AuthUser }> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  logout(): Promise<{ ok: boolean }> {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },
}
