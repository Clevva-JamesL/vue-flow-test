import type { CreateTimelinePayload, SaveTimelinePayload, Timeline } from '@repo/shared'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error ?? `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export type TimelineSummary = {
  id: string
  title: string
  nodeCount: number
  edgeCount: number
  createdAt: string
  updatedAt: string
}

export const timelineApi = {
  list(): Promise<TimelineSummary[]> {
    return request('/timelines')
  },

  get(id: string): Promise<Timeline> {
    return request(`/timelines/${id}`)
  },

  create(payload: CreateTimelinePayload = {}): Promise<Timeline> {
    return request('/timelines', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  save(id: string, payload: SaveTimelinePayload): Promise<Timeline> {
    return request(`/timelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
}
