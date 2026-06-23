import { z } from 'zod'

export const mediaTypeSchema = z.enum(['book', 'movie', 'game'])
export type MediaType = z.infer<typeof mediaTypeSchema>

export const externalIdsSchema = z.object({
  isbn: z.string().optional(),
  tmdbId: z.number().optional(),
  igdbId: z.number().optional(),
})

export type ExternalIds = z.infer<typeof externalIdsSchema>

export const mediaItemSchema = z.object({
  id: z.string(),
  type: mediaTypeSchema,
  title: z.string(),
  releaseDate: z.string().nullable(),
  externalIds: externalIdsSchema.nullable(),
  metadataCache: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type MediaItem = z.infer<typeof mediaItemSchema>

export const timelineVisibilitySchema = z.enum(['private', 'unlisted', 'public'])
export type TimelineVisibility = z.infer<typeof timelineVisibilitySchema>
