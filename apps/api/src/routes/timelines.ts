import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createTimelineSchema, mediaTypeSchema, publishTimelineSchema, saveTimelineSchema } from '@repo/shared'
import { requireAuth, sessionMiddleware, type AppEnv } from '../auth/middleware'
import { db } from '../db'
import { timelines } from '../db/schema'
import {
  backfillAllTimelinesFromGraphJson,
  getPublishedTimelineBySlug,
  getTimelineGraphById,
  getTimelineNodeCount,
  getTimelineNodesFiltered,
  publishTimeline,
  saveTimelineGraph,
  toTimelineResponse,
  unpublishTimeline,
  userCanReadTimeline,
  userCanWriteTimeline,
} from '../services/timelineGraph'

const timelinesRouter = new Hono<AppEnv>()

timelinesRouter.use('*', sessionMiddleware)

timelinesRouter.get('/share/:slug', async (c) => {
  const slug = c.req.param('slug')
  const graph = await getPublishedTimelineBySlug(slug)

  if (!graph) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json(
    toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport, { readOnly: true }),
  )
})

timelinesRouter.get('/', requireAuth, async (c) => {
  const user = c.get('user')!
  const rows = await db
    .select()
    .from(timelines)
    .where(eq(timelines.ownerId, user.id))
    .orderBy(timelines.updatedAt)

  const summaries = await Promise.all(
    rows.map(async (row) => {
      const { nodeCount, edgeCount } = await getTimelineNodeCount(row.id)
      return {
        id: row.id,
        title: row.title,
        nodeCount,
        edgeCount,
        visibility: row.visibility,
        shareSlug: row.shareSlug,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }),
  )

  return c.json(summaries)
})

timelinesRouter.post('/', requireAuth, zValidator('json', createTimelineSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const user = c.get('user')!
    const id = randomUUID()
    const now = new Date()
    const title = body.title ?? 'Untitled Timeline'

    db.insert(timelines)
      .values({
        id,
        ownerId: user.id,
        title,
        viewport: null,
        graphJson: { nodes: [], edges: [], viewport: null },
        createdAt: now,
        updatedAt: now,
      })
      .run()

    const timeline = db.select().from(timelines).where(eq(timelines.id, id)).get()
    if (!timeline) {
      return c.json({ error: 'Failed to create timeline' }, 500)
    }

    return c.json(toTimelineResponse(timeline, [], [], null), 201)
  } catch (err) {
    console.error('Failed to create timeline', err)
    const message = err instanceof Error ? err.message : 'Failed to create timeline'
    return c.json({ error: message }, 500)
  }
})

timelinesRouter.get('/:id/nodes', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const timeline = db.select().from(timelines).where(eq(timelines.id, id)).get()

  if (!timeline || !userCanReadTimeline(timeline, user?.id ?? null)) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  const typeParam = c.req.query('type')
  const parsedType = typeParam ? mediaTypeSchema.safeParse(typeParam) : null

  if (parsedType && !parsedType.success) {
    return c.json({ error: 'Invalid media type. Use book, movie, or game.' }, 400)
  }

  const nodes = await getTimelineNodesFiltered(id, parsedType?.data)
  if (!nodes) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json({ timelineId: id, nodes })
})

timelinesRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const graph = await getTimelineGraphById(id)

  if (!graph || !userCanReadTimeline(graph.timeline, user?.id ?? null)) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json(toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport))
})

timelinesRouter.put('/:id', zValidator('json', saveTimelineSchema), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const body = c.req.valid('json')
  const timeline = db.select().from(timelines).where(eq(timelines.id, id)).get()

  if (!timeline || !userCanWriteTimeline(timeline, user?.id ?? null)) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  const graph = await saveTimelineGraph(id, body)
  if (!graph) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json(toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport))
})

timelinesRouter.post('/:id/publish', requireAuth, zValidator('json', publishTimelineSchema), async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')!
  const body = c.req.valid('json')

  const graph = await publishTimeline(id, user.id, body.visibility)
  if (!graph) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json(toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport))
})

timelinesRouter.post('/:id/unpublish', requireAuth, async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')!

  const graph = await unpublishTimeline(id, user.id)
  if (!graph) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json(toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport))
})

timelinesRouter.post(
  '/admin/backfill',
  zValidator('json', z.object({ secret: z.string().optional() }).optional()),
  async (c) => {
    const migrated = await backfillAllTimelinesFromGraphJson()
    return c.json({ migrated })
  },
)

export { timelinesRouter }
