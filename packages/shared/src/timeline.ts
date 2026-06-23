import { z } from 'zod'
import { timelineVisibilitySchema } from './media'

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
})

export type Viewport = z.infer<typeof viewportSchema>

export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.unknown()).optional(),
  parentNode: z.string().optional(),
  extent: z.union([z.literal('parent'), z.array(z.array(z.number()))]).optional(),
  style: z.record(z.unknown()).optional(),
})

export type FlowNode = z.infer<typeof flowNodeSchema>

export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  label: z.string().optional(),
  data: z.record(z.unknown()).optional(),
})

export type FlowEdge = z.infer<typeof flowEdgeSchema>

export const saveTimelineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  viewport: viewportSchema.optional(),
})

export type SaveTimelinePayload = z.infer<typeof saveTimelineSchema>

export const timelineSchema = z.object({
  id: z.string(),
  title: z.string(),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  viewport: viewportSchema.nullable(),
  visibility: timelineVisibilitySchema.optional(),
  shareSlug: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  readOnly: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Timeline = z.infer<typeof timelineSchema>

export const publishTimelineSchema = z.object({
  visibility: z.enum(['public', 'unlisted']),
})

export type PublishTimelinePayload = z.infer<typeof publishTimelineSchema>

export const createTimelineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

export type CreateTimelinePayload = z.infer<typeof createTimelineSchema>
