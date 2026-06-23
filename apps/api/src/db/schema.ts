import { relations } from 'drizzle-orm'
import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const mediaItems = sqliteTable('media_items', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['book', 'movie', 'game'] }).notNull(),
  title: text('title').notNull(),
  releaseDate: text('release_date'),
  externalIds: text('external_ids', { mode: 'json' }).$type<{
    isbn?: string
    tmdbId?: number
    igdbId?: number
  } | null>(),
  metadataCache: text('metadata_cache', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const timelines = sqliteTable(
  'timelines',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').references(() => users.id),
    title: text('title').notNull().default('Untitled Timeline'),
    visibility: text('visibility', { enum: ['private', 'unlisted', 'public'] })
      .notNull()
      .default('private'),
    shareSlug: text('share_slug').unique(),
    viewport: text('viewport', { mode: 'json' }).$type<{
      x: number
      y: number
      zoom: number
    } | null>(),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
    publishedGraphJson: text('published_graph_json', { mode: 'json' }).$type<{
      nodes: unknown[]
      edges: unknown[]
      viewport?: { x: number; y: number; zoom: number } | null
    } | null>(),
    graphJson: text('graph_json', { mode: 'json' })
      .$type<{
        nodes: unknown[]
        edges: unknown[]
        viewport?: { x: number; y: number; zoom: number } | null
      }>()
      .notNull()
      .default({ nodes: [], edges: [], viewport: null }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('timelines_share_slug_idx').on(table.shareSlug)],
)

export const timelineNodes = sqliteTable(
  'timeline_nodes',
  {
    id: text('id').primaryKey(),
    timelineId: text('timeline_id')
      .notNull()
      .references(() => timelines.id, { onDelete: 'cascade' }),
    mediaItemId: text('media_item_id').references(() => mediaItems.id),
    vueNodeId: text('vue_node_id').notNull(),
    positionX: real('position_x').notNull(),
    positionY: real('position_y').notNull(),
    parentVueNodeId: text('parent_vue_node_id'),
    nodeType: text('node_type').notNull(),
    nodeData: text('node_data', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('timeline_nodes_timeline_vue_node_idx').on(table.timelineId, table.vueNodeId)],
)

export const timelineEdges = sqliteTable(
  'timeline_edges',
  {
    id: text('id').primaryKey(),
    timelineId: text('timeline_id')
      .notNull()
      .references(() => timelines.id, { onDelete: 'cascade' }),
    vueEdgeId: text('vue_edge_id').notNull(),
    sourceVueId: text('source_vue_id').notNull(),
    targetVueId: text('target_vue_id').notNull(),
    edgeType: text('edge_type'),
    edgeData: text('edge_data', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('timeline_edges_timeline_vue_edge_idx').on(table.timelineId, table.vueEdgeId)],
)

export const usersRelations = relations(users, ({ many }) => ({
  timelines: many(timelines),
}))

export const timelinesRelations = relations(timelines, ({ one, many }) => ({
  owner: one(users, {
    fields: [timelines.ownerId],
    references: [users.id],
  }),
  nodes: many(timelineNodes),
  edges: many(timelineEdges),
}))

export const mediaItemsRelations = relations(mediaItems, ({ many }) => ({
  timelineNodes: many(timelineNodes),
}))

export const timelineNodesRelations = relations(timelineNodes, ({ one }) => ({
  timeline: one(timelines, {
    fields: [timelineNodes.timelineId],
    references: [timelines.id],
  }),
  mediaItem: one(mediaItems, {
    fields: [timelineNodes.mediaItemId],
    references: [mediaItems.id],
  }),
}))

export const timelineEdgesRelations = relations(timelineEdges, ({ one }) => ({
  timeline: one(timelines, {
    fields: [timelineEdges.timelineId],
    references: [timelines.id],
  }),
}))

export type TimelineRow = typeof timelines.$inferSelect
export type MediaItemRow = typeof mediaItems.$inferSelect
export type TimelineNodeRow = typeof timelineNodes.$inferSelect
export type TimelineEdgeRow = typeof timelineEdges.$inferSelect
