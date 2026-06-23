import type {
  CreateTimelinePayload,
  PublishTimelinePayload,
  SaveTimelinePayload,
  Timeline,
  TimelineVisibility,
} from '@repo/shared'
import { apiRequest } from './client'

export type TimelineSummary = {
  id: string
  title: string
  nodeCount: number
  edgeCount: number
  visibility: TimelineVisibility
  shareSlug: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export const timelineApi = {
  list(): Promise<TimelineSummary[]> {
    return apiRequest('/timelines')
  },

  get(id: string): Promise<Timeline> {
    return apiRequest(`/timelines/${id}`)
  },

  getByShareSlug(slug: string): Promise<Timeline> {
    return apiRequest(`/timelines/share/${slug}`)
  },

  create(payload: CreateTimelinePayload = {}): Promise<Timeline> {
    return apiRequest('/timelines', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  save(id: string, payload: SaveTimelinePayload): Promise<Timeline> {
    return apiRequest(`/timelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  publish(id: string, payload: PublishTimelinePayload): Promise<Timeline> {
    return apiRequest(`/timelines/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  unpublish(id: string): Promise<Timeline> {
    return apiRequest(`/timelines/${id}/unpublish`, {
      method: 'POST',
    })
  },
}
