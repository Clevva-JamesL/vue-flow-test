<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  VueFlow,
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
  type ViewportTransform,
} from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useTimelineStore } from '@/stores/timelineStore'
import { useTimelinePersistence } from '@/composables/useTimelinePersistence'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const store = useTimelineStore()
const { nodes, edges, viewport } = storeToRefs(store)

useTimelinePersistence()

onMounted(() => {
  if (viewport.value) {
    // Viewport is restored via default-viewport prop on first render
  }
})

function onNodesChange(changes: NodeChange[]) {
  nodes.value = applyNodeChanges(changes, nodes.value as never) as typeof nodes.value
  if (changes.some((change) => change.type !== 'select')) {
    store.markDirty()
  }
}

function onEdgesChange(changes: EdgeChange[]) {
  edges.value = applyEdgeChanges(changes, edges.value as never) as typeof edges.value
  if (changes.some((change) => change.type !== 'select')) {
    store.markDirty()
  }
}

function onConnect(connection: { source: string; target: string }) {
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
  store.setViewport(nextViewport)
}
</script>

<template>
  <div class="flow-canvas">
    <VueFlow
      :nodes="(nodes as any)"
      :edges="(edges as any)"
      :default-viewport="viewport ?? undefined"
      fit-view-on-init
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @connect="onConnect"
      @viewport-change="onViewportChange"
    >
      <Background pattern-color="#d0d7e6" :gap="16" />
      <Controls />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<style scoped>
.flow-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 1px solid #d8deea;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
</style>
