import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { FlowEdge, FlowNode, MediaType, SaveTimelinePayload } from '@repo/shared'
import { db } from '../db'
import * as schema from '../db/schema'
import { mediaItems, timelineEdges, timelineNodes, timelines, type TimelineRow } from '../db/schema'

type Db = BetterSQLite3Database<typeof schema>

type ExternalIds = {
  isbn?: string
  tmdbId?: number
  igdbId?: number
}

function isMediaType(value: unknown): value is MediaType {
  return value === 'book' || value === 'movie' || value === 'game'
}

function parseExternalIds(data: Record<string, unknown> | undefined): ExternalIds | null {
  const externalIds = data?.externalIds
  if (!externalIds || typeof externalIds !== 'object') return null

  const parsed: ExternalIds = {}
  if (typeof (externalIds as ExternalIds).isbn === 'string') {
    parsed.isbn = (externalIds as ExternalIds).isbn
  }
  if (typeof (externalIds as ExternalIds).tmdbId === 'number') {
    parsed.tmdbId = (externalIds as ExternalIds).tmdbId
  }
  if (typeof (externalIds as ExternalIds).igdbId === 'number') {
    parsed.igdbId = (externalIds as ExternalIds).igdbId
  }

  return Object.keys(parsed).length > 0 ? parsed : null
}

function externalIdsMatch(
  stored: ExternalIds | null | undefined,
  incoming: ExternalIds | null,
): boolean {
  if (!stored || !incoming) return false
  if (incoming.isbn && stored.isbn === incoming.isbn) return true
  if (incoming.tmdbId != null && stored.tmdbId === incoming.tmdbId) return true
  if (incoming.igdbId != null && stored.igdbId === incoming.igdbId) return true
  return false
}

function findExistingMediaItem(
  tx: Db,
  mediaType: MediaType,
  title: string,
  externalIds: ExternalIds | null,
) {
  const candidates = tx
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.type, mediaType), eq(mediaItems.title, title)))
    .all()

  if (externalIds) {
    const byExternalId = candidates.find((item) => externalIdsMatch(item.externalIds, externalIds))
    if (byExternalId) return byExternalId
  }

  if (!externalIds && candidates.length === 1) {
    return candidates[0]
  }

  return null
}

function upsertMediaItemForNode(tx: Db, node: FlowNode): string | null {
  const data = node.data ?? {}
  const mediaType = isMediaType(data.mediaType) ? data.mediaType : isMediaType(node.type) ? node.type : null
  const title = typeof data.title === 'string' ? data.title.trim() : ''

  if (!mediaType || !title) {
    return null
  }

  const externalIds = parseExternalIds(data)
  const existing = findExistingMediaItem(tx, mediaType, title, externalIds)
  if (existing) {
    return existing.id
  }

  const id = randomUUID()
  const now = new Date()
  const releaseDate = typeof data.releaseDate === 'string' ? data.releaseDate : null
  const metadataCache =
    data.metadataCache && typeof data.metadataCache === 'object'
      ? (data.metadataCache as Record<string, unknown>)
      : null

  tx.insert(mediaItems)
    .values({
      id,
      type: mediaType,
      title,
      releaseDate,
      externalIds,
      metadataCache,
      createdAt: now,
      updatedAt: now,
    })
    .run()

  return id
}

function resolveNodeType(node: FlowNode): string {
  if (node.type) return node.type
  const mediaType = node.data?.mediaType
  if (isMediaType(mediaType)) return mediaType
  return 'default'
}

function buildNodeData(node: FlowNode, mediaItemId: string | null): Record<string, unknown> {
  const data = { ...(node.data ?? {}) }
  if (mediaItemId) {
    data.mediaItemId = mediaItemId
  }
  return data
}

export async function saveTimelineGraph(timelineId: string, payload: SaveTimelinePayload) {
  const existing = db.select().from(timelines).where(eq(timelines.id, timelineId)).get()
  if (!existing) {
    return null
  }

  const now = new Date()
  const viewport = payload.viewport ?? existing.viewport ?? existing.graphJson.viewport ?? null

  const nodeMediaMap = new Map<string, string | null>()
  for (const node of payload.nodes) {
    nodeMediaMap.set(node.id, upsertMediaItemForNode(db, node))
  }

  db.transaction((tx) => {
    tx.delete(timelineEdges).where(eq(timelineEdges.timelineId, timelineId)).run()
    tx.delete(timelineNodes).where(eq(timelineNodes.timelineId, timelineId)).run()

    for (const node of payload.nodes) {
      const mediaItemId = nodeMediaMap.get(node.id) ?? null

      tx.insert(timelineNodes)
        .values({
          id: randomUUID(),
          timelineId,
          mediaItemId,
          vueNodeId: node.id,
          positionX: node.position.x,
          positionY: node.position.y,
          parentVueNodeId: node.parentNode ?? null,
          nodeType: resolveNodeType(node),
          nodeData: buildNodeData(node, mediaItemId),
          createdAt: now,
          updatedAt: now,
        })
        .run()
    }

    for (const edge of payload.edges) {
      tx.insert(timelineEdges)
        .values({
          id: randomUUID(),
          timelineId,
          vueEdgeId: edge.id,
          sourceVueId: edge.source,
          targetVueId: edge.target,
          edgeType: edge.type ?? null,
          edgeData: {
            ...(edge.data ?? {}),
            ...(edge.label ? { label: edge.label } : {}),
          },
          createdAt: now,
          updatedAt: now,
        })
        .run()
    }

    tx.update(timelines)
      .set({
        title: payload.title ?? existing.title,
        viewport,
        graphJson: {
          nodes: payload.nodes,
          edges: payload.edges,
          viewport,
        },
        updatedAt: now,
      })
      .where(eq(timelines.id, timelineId))
      .run()
  })

  return getTimelineGraphById(timelineId)
}

function toFlowNode(
  node: typeof timelineNodes.$inferSelect,
  mediaItem: typeof mediaItems.$inferSelect | null,
): FlowNode {
  const data: Record<string, unknown> = { ...node.nodeData }

  if (mediaItem) {
    data.mediaType = mediaItem.type
    data.title = mediaItem.title
    data.releaseDate = mediaItem.releaseDate ?? undefined
    data.externalIds = mediaItem.externalIds ?? undefined
    data.metadataCache = mediaItem.metadataCache ?? undefined
    data.mediaItemId = mediaItem.id
  }

  return {
    id: node.vueNodeId,
    type: node.nodeType,
    position: { x: node.positionX, y: node.positionY },
    parentNode: node.parentVueNodeId ?? undefined,
    data,
  }
}

function toFlowEdge(edge: typeof timelineEdges.$inferSelect): FlowEdge {
  const label = typeof edge.edgeData.label === 'string' ? edge.edgeData.label : undefined
  const { label: _label, ...restData } = edge.edgeData

  return {
    id: edge.vueEdgeId,
    source: edge.sourceVueId,
    target: edge.targetVueId,
    type: edge.edgeType ?? undefined,
    label,
    data: Object.keys(restData).length > 0 ? restData : undefined,
  }
}

export async function getTimelineGraphById(timelineId: string) {
  const timeline = db.select().from(timelines).where(eq(timelines.id, timelineId)).get()
  if (!timeline) {
    return null
  }

  const nodeRows = db
    .select({
      node: timelineNodes,
      mediaItem: mediaItems,
    })
    .from(timelineNodes)
    .leftJoin(mediaItems, eq(timelineNodes.mediaItemId, mediaItems.id))
    .where(eq(timelineNodes.timelineId, timelineId))
    .all()

  const edgeRows = db
    .select()
    .from(timelineEdges)
    .where(eq(timelineEdges.timelineId, timelineId))
    .all()

  if (nodeRows.length === 0 && edgeRows.length === 0 && timeline.graphJson.nodes.length > 0) {
    return graphFromLegacyJson(timeline)
  }

  return {
    timeline,
    nodes: nodeRows.map((row) => toFlowNode(row.node, row.mediaItem)),
    edges: edgeRows.map((row) => toFlowEdge(row)),
    viewport: timeline.viewport ?? timeline.graphJson.viewport ?? null,
  }
}

function graphFromLegacyJson(timeline: TimelineRow) {
  return {
    timeline,
    nodes: timeline.graphJson.nodes as FlowNode[],
    edges: timeline.graphJson.edges as FlowEdge[],
    viewport: timeline.viewport ?? timeline.graphJson.viewport ?? null,
  }
}

export async function getTimelineNodeCount(timelineId: string) {
  const graph = await getTimelineGraphById(timelineId)
  if (!graph) return { nodeCount: 0, edgeCount: 0 }
  return { nodeCount: graph.nodes.length, edgeCount: graph.edges.length }
}

export type TimelineNodeWithMedia = {
  id: string
  vueNodeId: string
  nodeType: string
  position: { x: number; y: number }
  parentVueNodeId: string | null
  nodeData: Record<string, unknown>
  mediaItem: {
    id: string
    type: MediaType
    title: string
    releaseDate: string | null
    externalIds: ExternalIds | null
  } | null
}

export async function getTimelineNodesFiltered(timelineId: string, mediaType?: MediaType) {
  const timeline = db.select().from(timelines).where(eq(timelines.id, timelineId)).get()
  if (!timeline) {
    return null
  }

  const rows = db
    .select({
      node: timelineNodes,
      mediaItem: mediaItems,
    })
    .from(timelineNodes)
    .leftJoin(mediaItems, eq(timelineNodes.mediaItemId, mediaItems.id))
    .where(eq(timelineNodes.timelineId, timelineId))
    .all()

  const filtered = mediaType
    ? rows.filter((row) => row.mediaItem?.type === mediaType || row.node.nodeType === mediaType)
    : rows

  return filtered.map(({ node, mediaItem }) => ({
    id: node.id,
    vueNodeId: node.vueNodeId,
    nodeType: node.nodeType,
    position: { x: node.positionX, y: node.positionY },
    parentVueNodeId: node.parentVueNodeId,
    nodeData: node.nodeData,
    mediaItem: mediaItem
      ? {
          id: mediaItem.id,
          type: mediaItem.type as MediaType,
          title: mediaItem.title,
          releaseDate: mediaItem.releaseDate,
          externalIds: mediaItem.externalIds,
        }
      : null,
  })) as TimelineNodeWithMedia[]
}

export async function backfillTimelineFromGraphJson(timelineId: string) {
  const timeline = db.select().from(timelines).where(eq(timelines.id, timelineId)).get()
  if (!timeline) return false

  const existingNodes = db
    .select()
    .from(timelineNodes)
    .where(eq(timelineNodes.timelineId, timelineId))
    .all()

  if (existingNodes.length > 0) {
    return false
  }

  const nodes = timeline.graphJson.nodes as FlowNode[]
  const edges = timeline.graphJson.edges as FlowEdge[]

  if (nodes.length === 0 && edges.length === 0) {
    return false
  }

  await saveTimelineGraph(timelineId, {
    title: timeline.title,
    nodes,
    edges,
    viewport: timeline.viewport ?? timeline.graphJson.viewport ?? undefined,
  })

  return true
}

export async function backfillAllTimelinesFromGraphJson() {
  const rows = db.select().from(timelines).all()
  let migrated = 0

  for (const timeline of rows) {
    const didMigrate = await backfillTimelineFromGraphJson(timeline.id)
    if (didMigrate) migrated += 1
  }

  return migrated
}

export function toTimelineResponse(
  timeline: TimelineRow,
  nodes: FlowNode[],
  edges: FlowEdge[],
  viewport: { x: number; y: number; zoom: number } | null,
) {
  return {
    id: timeline.id,
    title: timeline.title,
    nodes,
    edges,
    viewport,
    visibility: timeline.visibility,
    shareSlug: timeline.shareSlug,
    createdAt: timeline.createdAt.toISOString(),
    updatedAt: timeline.updatedAt.toISOString(),
  }
}
