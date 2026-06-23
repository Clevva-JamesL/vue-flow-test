import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ViewportTransform } from '@vue-flow/core'
import type { FlowEdge, FlowNode, SaveTimelinePayload } from '@repo/shared'
import { timelineApi } from '@/api/timelines'

export const useTimelineStore = defineStore('timeline', () => {
  const id = ref<string | null>(null)
  const title = ref('Untitled Timeline')
  const nodes = ref<FlowNode[]>([])
  const edges = ref<FlowEdge[]>([])
  const viewport = ref<ViewportTransform | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const lastSavedAt = ref<string | null>(null)
  const error = ref<string | null>(null)

  const hasUnsavedChanges = ref(false)

  const savePayload = computed((): SaveTimelinePayload => ({
    title: title.value,
    nodes: nodes.value,
    edges: edges.value,
    viewport: viewport.value
      ? {
          x: viewport.value.x,
          y: viewport.value.y,
          zoom: viewport.value.zoom,
        }
      : undefined,
  }))

  function markDirty() {
    hasUnsavedChanges.value = true
  }

  function setGraph(nextNodes: FlowNode[], nextEdges: FlowEdge[]) {
    nodes.value = nextNodes
    edges.value = nextEdges
    markDirty()
  }

  function setViewport(nextViewport: ViewportTransform) {
    viewport.value = nextViewport
    markDirty()
  }

  async function load(timelineId: string) {
    isLoading.value = true
    error.value = null

    try {
      const timeline = await timelineApi.get(timelineId)
      id.value = timeline.id
      title.value = timeline.title
      nodes.value = timeline.nodes
      edges.value = timeline.edges
      viewport.value = timeline.viewport as ViewportTransform | null
      hasUnsavedChanges.value = false
      lastSavedAt.value = timeline.updatedAt
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load timeline'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function save() {
    if (!id.value) return

    isSaving.value = true
    error.value = null

    try {
      const timeline = await timelineApi.save(id.value, savePayload.value)
      title.value = timeline.title
      lastSavedAt.value = timeline.updatedAt
      hasUnsavedChanges.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save timeline'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function reset() {
    id.value = null
    title.value = 'Untitled Timeline'
    nodes.value = []
    edges.value = []
    viewport.value = null
    isLoading.value = false
    isSaving.value = false
    lastSavedAt.value = null
    error.value = null
    hasUnsavedChanges.value = false
  }

  return {
    id,
    title,
    nodes,
    edges,
    viewport,
    isLoading,
    isSaving,
    lastSavedAt,
    error,
    hasUnsavedChanges,
    savePayload,
    markDirty,
    setGraph,
    setViewport,
    load,
    save,
    reset,
  }
})
