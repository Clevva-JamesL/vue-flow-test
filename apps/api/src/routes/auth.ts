import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getCookie } from 'hono/cookie'
import { loginSchema, registerSchema } from '@repo/shared'
import { SESSION_COOKIE, authenticateUser, registerUser } from '../auth/service'
import {
  clearSessionCookie,
  requireAuth,
  sessionMiddleware,
  startSession,
  type AppEnv,
} from '../auth/middleware'

const authRouter = new Hono<AppEnv>()

authRouter.use('*', sessionMiddleware)

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await registerUser(body.email, body.password)

  if ('error' in result) {
    return c.json({ error: result.error }, 409)
  }

  startSession(c, result.user.id)
  return c.json({ user: result.user }, 201)
})

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const body = c.req.valid('json')
  const result = await authenticateUser(body.email, body.password)

  if ('error' in result) {
    return c.json({ error: result.error }, 401)
  }

  startSession(c, result.user.id)
  return c.json({ user: result.user })
})

authRouter.post('/logout', sessionMiddleware, async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE)
  clearSessionCookie(c, sessionId)
  return c.json({ ok: true })
})

authRouter.get('/me', sessionMiddleware, requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

export { authRouter }
