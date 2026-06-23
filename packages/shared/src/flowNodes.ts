import { z } from 'zod'
import { mediaTypeSchema } from './media'

export const flowNodeTypeSchema = z.enum(['book', 'movie', 'game', 'group'])
export type FlowNodeType = z.infer<typeof flowNodeTypeSchema>

export const mediaNodeDataSchema = z.object({
  mediaType: mediaTypeSchema.optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  releaseDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

export type MediaNodeData = z.infer<typeof mediaNodeDataSchema>

export const groupNodeDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
})

export type GroupNodeData = z.infer<typeof groupNodeDataSchema>
