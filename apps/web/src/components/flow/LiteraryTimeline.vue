<script setup lang="ts">
import { computed, nextTick, ref, unref } from 'vue'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  VueFlow,
  type EdgeChange,
  type NodeChange,
  type ViewportTransform,
  type VueFlowStore,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { markRaw } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimelineStore } from '@/stores/timelineStore'
import { useTimelinePersistence } from '@/composables/useTimelinePersistence'
import BookNode from '@/components/flow/nodes/BookNode.vue'
import MovieNode from '@/components/flow/nodes/MovieNode.vue'
import GameNode from '@/components/flow/nodes/GameNode.vue'
import GroupNode from '@/components/flow/nodes/GroupNode.vue'
import type { FlowEdge, FlowNode } from '@repo/shared'
import { toStoreNodes } from '@/lib/flowNodes'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const props = withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  {
    readonly: false,
  },
)

const store = useTimelineStore()
const { nodes, edges, viewport, id: timelineId, isReadOnly } = storeToRefs(store)

const isCanvasReadOnly = computed(() => props.readonly || isReadOnly.value)

const skipViewportDirty = ref(true)
const canSyncFromFlow = ref(false)
const flowInstance = ref<VueFlowStore | null>(null)

const nodeTypes = {
  book: markRaw(BookNode),
  movie: markRaw(MovieNode),
  game: markRaw(GameNode),
  group: markRaw(GroupNode),
}

useTimelinePersistence()

const flowNodes = computed({
  get: () => nodes.value as any,
  set: (value: FlowNode[]) => {
    if (!canSyncFromFlow.value || isCanvasReadOnly.value) return
    nodes.value = toStoreNodes(value)
  },
})

const flowEdges = computed({
  get: () => edges.value as any,
  set: (value: FlowEdge[]) => {
    if (!canSyncFromFlow.value || isCanvasReadOnly.value) return
    edges.value = value.map((edge) => ({ ...edge }))
  },
})

function onNodesInitialized() {
  canSyncFromFlow.value = true
}

function onNodesChange(changes: NodeChange[]) {
  if (isCanvasReadOnly.value) return
  if (changes.some((change) => change.type === 'add' || change.type === 'remove')) {
    store.markDirty()
  }
}

function onEdgesChange(changes: EdgeChange[]) {
  if (isCanvasReadOnly.value) return
  if (changes.some((change) => change.type === 'add' || change.type === 'remove')) {
    store.markDirty()
  }
}

function onNodeDragStop() {
  if (isCanvasReadOnly.value || !flowInstance.value || !canSyncFromFlow.value) return
  nodes.value = toStoreNodes(unref(flowInstance.value.getNodes) as FlowNode[])
  store.markDirty()
}

function onConnect(connection: { source: string; target: string }) {
  if (isCanvasReadOnly.value) return
  edges.value = [
    ...edges.value,
    {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      target: connection.target,
    },
  ]
  store.markDirty()
}

function onViewportChange(nextViewport: ViewportTransform) {
  if (isCanvasReadOnly.value || skipViewportDirty.value) return
  store.setViewport(nextViewport)
}

async function onPaneReady(flow: VueFlowStore) {
  flowInstance.value = flow
  skipViewportDirty.value = true

  await nextTick()

  if (viewport.value) {
    flow.setViewport(viewport.value)
  } else if (nodes.value.length > 0) {
    await flow.fitView()
  }

  await nextTick()
  skipViewportDirty.value = false
}
</script>

<template>
  <div class="flow-canvas size-full min-h-0 overflow-hidden rounded-xl border bg-card">
    <VueFlow
      :key="timelineId ?? undefined"
      v-model:nodes="flowNodes"
      v-model:edges="flowEdges"
      :node-types="(nodeTypes as any)"
      :default-viewport="viewport ?? undefined"
      :fit-view-on-init="false"
      :nodes-draggable="!isCanvasReadOnly"
      :nodes-connectable="!isCanvasReadOnly"
      :elements-selectable="!isCanvasReadOnly"
      :pan-on-drag="true"
      @nodes-initialized="onNodesInitialized"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @node-drag-stop="onNodeDragStop"
      @connect="onConnect"
      @viewport-change="onViewportChange"
      @pane-ready="onPaneReady"
    >
      <Background pattern-color="var(--border)" :gap="16" />
      <Controls />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<style scoped>
.flow-canvas :deep(.vue-flow) {
  width: 100%;
  height: 100%;
}

.flow-canvas :deep(.vue-flow__node-group) {
  z-index: 0;
}

.flow-canvas :deep(.vue-flow__node:not(.vue-flow__node-group)) {
  z-index: 1;
}
</style>
