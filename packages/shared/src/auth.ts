import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
})

export type RegisterPayload = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
})

export type LoginPayload = z.infer<typeof loginSchema>

export type AuthUser = {
  id: string
  email: string
}
