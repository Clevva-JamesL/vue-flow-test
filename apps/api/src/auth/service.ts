import { randomBytes, randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import { sessions, users } from '../db/schema'

export const SESSION_COOKIE = 'lt_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export type SessionUser = {
  id: string
  email: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string | null) {
  if (!hash) return false
  return bcrypt.compare(password, hash)
}

export function createSession(userId: string) {
  const sessionId = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  db.insert(sessions)
    .values({
      id: sessionId,
      userId,
      expiresAt,
    })
    .run()

  return { sessionId, expiresAt }
}

export function validateSession(sessionId: string): SessionUser | null {
  const row = db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get()

  if (!row) return null

  if (row.session.expiresAt < new Date()) {
    deleteSession(sessionId)
    return null
  }

  return {
    id: row.user.id,
    email: row.user.email,
  }
}

export function deleteSession(sessionId: string) {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run()
}

export async function registerUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = db.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (existing) {
    return { error: 'Email already registered' as const }
  }

  const id = randomUUID()
  const passwordHash = await hashPassword(password)
  const now = new Date()

  db.insert(users)
    .values({
      id,
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
    })
    .run()

  return {
    user: {
      id,
      email: normalizedEmail,
    },
  }
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const user = db.select().from(users).where(eq(users.email, normalizedEmail)).get()

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: 'Invalid email or password' as const }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
  }
}
