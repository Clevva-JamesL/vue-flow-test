import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createTimelineSchema, mediaTypeSchema, saveTimelineSchema } from '@repo/shared'
import { db } from '../db'
import { timelines } from '../db/schema'
import {
  backfillAllTimelinesFromGraphJson,
  getTimelineGraphById,
  getTimelineNodeCount,
  getTimelineNodesFiltered,
  saveTimelineGraph,
  toTimelineResponse,
} from '../services/timelineGraph'

const timelinesRouter = new Hono()

timelinesRouter.get('/', async (c) => {
  const rows = await db.select().from(timelines).orderBy(timelines.updatedAt)

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
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    }),
  )

  return c.json(summaries)
})

timelinesRouter.post('/', zValidator('json', createTimelineSchema), async (c) => {
  const body = c.req.valid('json')
  const id = randomUUID()
  const now = new Date()

  await db
    .insert(timelines)
    .values({
      id,
      title: body.title ?? 'Untitled Timeline',
      viewport: null,
      graphJson: { nodes: [], edges: [], viewport: null },
      createdAt: now,
      updatedAt: now,
    })
    .run()

  const graph = await getTimelineGraphById(id)
  if (!graph) {
    return c.json({ error: 'Failed to create timeline' }, 500)
  }

  return c.json(toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport), 201)
})

timelinesRouter.get('/:id/nodes', async (c) => {
  const id = c.req.param('id')
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
  const graph = await getTimelineGraphById(id)

  if (!graph) {
    return c.json({ error: 'Timeline not found' }, 404)
  }

  return c.json(toTimelineResponse(graph.timeline, graph.nodes, graph.edges, graph.viewport))
})

timelinesRouter.put('/:id', zValidator('json', saveTimelineSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const graph = await saveTimelineGraph(id, body)
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
