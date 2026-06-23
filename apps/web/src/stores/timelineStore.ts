import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ViewportTransform } from '@vue-flow/core'
import type { FlowEdge, FlowNode, FlowNodeType, SaveTimelinePayload } from '@repo/shared'
import { timelineApi } from '@/api/timelines'
import { createFlowNode, toStoreNode } from '@/lib/flowNodes'

function cloneFlowNode(node: FlowNode): FlowNode {
  return toStoreNode(node)
}

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

  function addNode(type: FlowNodeType, overrides?: Partial<FlowNode>) {
    const node = createFlowNode(type, nodes.value.length + 1, overrides)
    nodes.value = [...nodes.value, node]
    markDirty()
    return node
  }

  function addChildNode(type: Exclude<FlowNodeType, 'group'>, parentNodeId: string, overrides?: Partial<FlowNode>) {
    const siblings = nodes.value.filter((node) => node.parentNode === parentNodeId)
    const node = createFlowNode(type, nodes.value.length + 1, {
      parentNode: parentNodeId,
      extent: 'parent',
      position: { x: 24 + siblings.length * 28, y: 72 + siblings.length * 24 },
      ...overrides,
    })
    nodes.value = [...nodes.value, node]
    markDirty()
    return node
  }

  function removeNode(nodeId: string) {
    const childIds = new Set(
      nodes.value.filter((node) => node.parentNode === nodeId).map((node) => node.id),
    )
    childIds.add(nodeId)

    nodes.value = nodes.value.filter((node) => !childIds.has(node.id))
    edges.value = edges.value.filter(
      (edge) => !childIds.has(edge.source) && !childIds.has(edge.target),
    )
    markDirty()
  }

  async function load(timelineId: string) {
    isLoading.value = true
    error.value = null

    try {
      const timeline = await timelineApi.get(timelineId)
      id.value = timeline.id
      title.value = timeline.title
      nodes.value = timeline.nodes.map(cloneFlowNode)
      edges.value = timeline.edges.map((edge) => ({ ...edge }))
      viewport.value = timeline.viewport ? { ...timeline.viewport } : null
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
      nodes.value = timeline.nodes.map(cloneFlowNode)
      edges.value = timeline.edges.map((edge) => ({ ...edge }))
      viewport.value = timeline.viewport ? { ...timeline.viewport } : null
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
    addNode,
    addChildNode,
    removeNode,
    load,
    save,
    reset,
  }
})
