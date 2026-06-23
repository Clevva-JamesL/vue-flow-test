import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthUser, LoginPayload, RegisterPayload } from '@repo/shared'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  async function initialize() {
    if (isInitialized.value) return

    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.me()
      user.value = response.user
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function register(payload: RegisterPayload) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register(payload)
      user.value = response.user
      return response.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(payload: LoginPayload) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login(payload)
      user.value = response.user
      return response.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      await authApi.logout()
      user.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    error,
    initialize,
    register,
    login,
    logout,
  }
})
