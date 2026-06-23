/**
 * Step 3 integration checks for auth and publish/read-only sharing.
 */
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { sessions, timelines, users } from '../db/schema.js'
import {
  authenticateUser,
  createSession,
  registerUser,
  validateSession,
} from '../auth/service.js'
import {
  getPublishedTimelineBySlug,
  publishTimeline,
  saveTimelineGraph,
  unpublishTimeline,
  userCanReadTimeline,
  userCanWriteTimeline,
} from '../services/timelineGraph.js'

const email = `step3-${randomUUID()}@example.com`
const password = 'test-password-123'

const registered = await registerUser(email, password)
if ('error' in registered) {
  throw new Error(`Registration failed: ${registered.error}`)
}

const authenticated = await authenticateUser(email, password)
if ('error' in authenticated) {
  throw new Error(`Authentication failed: ${authenticated.error}`)
}

const { sessionId } = createSession(registered.user.id)
const sessionUser = validateSession(sessionId)
if (!sessionUser || sessionUser.id !== registered.user.id) {
  throw new Error('Session validation failed')
}

const timelineId = randomUUID()
const now = new Date()

db.insert(timelines)
  .values({
    id: timelineId,
    ownerId: registered.user.id,
    title: 'Step 3 Verification',
    viewport: null,
    graphJson: { nodes: [], edges: [], viewport: null },
    createdAt: now,
    updatedAt: now,
  })
  .run()

await saveTimelineGraph(timelineId, {
  title: 'Step 3 Verification',
  nodes: [
    {
      id: 'book-node',
      type: 'book',
      position: { x: 120, y: 120 },
      data: { mediaType: 'book', title: 'The Hobbit' },
    },
  ],
  edges: [],
})

const published = await publishTimeline(timelineId, registered.user.id, 'public')
const shared = published?.timeline.shareSlug
  ? await getPublishedTimelineBySlug(published.timeline.shareSlug)
  : null

const privateTimeline = db.select().from(timelines).where(eq(timelines.id, timelineId)).get()
const unpublished = await unpublishTimeline(timelineId, registered.user.id)
const hiddenAfterUnpublish = privateTimeline?.shareSlug
  ? await getPublishedTimelineBySlug(privateTimeline.shareSlug)
  : null

const otherUserId = randomUUID()
db.insert(users)
  .values({
    id: otherUserId,
    email: `other-${randomUUID()}@example.com`,
    passwordHash: 'hash',
    createdAt: now,
  })
  .run()

const timeline = db.select().from(timelines).where(eq(timelines.id, timelineId)).get()!

const checks = [
  ['user registration succeeds', Boolean(registered.user.id)],
  ['session validates user', sessionUser.email === email],
  ['owner can write timeline', userCanWriteTimeline(timeline, registered.user.id)],
  ['other user cannot write timeline', !userCanWriteTimeline(timeline, otherUserId)],
  ['owner can read timeline', userCanReadTimeline(timeline, registered.user.id)],
  ['other user cannot read owned timeline', !userCanReadTimeline(timeline, otherUserId)],
  ['publish sets visibility public', published?.timeline.visibility === 'public'],
  ['publish creates share slug', Boolean(published?.timeline.shareSlug)],
  ['publish stores snapshot nodes', published?.timeline.publishedGraphJson?.nodes.length === 1],
  ['public share endpoint returns graph', shared?.nodes.length === 1],
  ['unpublish sets visibility private', unpublished?.timeline.visibility === 'private'],
  ['unpublished timeline hidden from share endpoint', hiddenAfterUnpublish === null],
]

let failed = 0
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)
  if (!passed) failed += 1
}

db.delete(sessions).where(eq(sessions.userId, registered.user.id)).run()
db.delete(timelines).where(eq(timelines.id, timelineId)).run()
db.delete(users).where(eq(users.id, registered.user.id)).run()
db.delete(users).where(eq(users.id, otherUserId)).run()

if (failed > 0) {
  process.exitCode = 1
  console.error(`\n${failed} check(s) failed`)
} else {
  console.log(`\nAll ${checks.length} Step 3 checks passed`)
}
