import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import {
  SESSION_COOKIE,
  createSession,
  deleteSession,
  validateSession,
  type SessionUser,
} from './service'

export type AppEnv = {
  Variables: {
    user: SessionUser | null
  }
}

export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  const user = sessionId ? validateSession(sessionId) : null
  c.set('user', user)
  await next()
})

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})

export function setSessionCookie(c: Context, sessionId: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    expires: expiresAt,
  })
}

export function clearSessionCookie(c: Context, sessionId?: string) {
  if (sessionId) {
    deleteSession(sessionId)
  }

  deleteCookie(c, SESSION_COOKIE, {
    path: '/',
  })
}

export function startSession(c: Context, userId: string) {
  const { sessionId, expiresAt } = createSession(userId)
  setSessionCookie(c, sessionId, expiresAt)
}
