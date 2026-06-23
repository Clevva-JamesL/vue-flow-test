<script setup lang="ts">
import { Gamepad2 } from '@lucide/vue'
import type { NodeProps } from '@vue-flow/core'
import MediaNodeShell from '@/components/flow/nodes/MediaNodeShell.vue'
import { useMediaNodeData } from '@/composables/useFlowNodeData'

const props = defineProps<NodeProps>()
const { title, subtitle, releaseDate, tags } = useMediaNodeData(props)
</script>

<template>
  <MediaNodeShell
    label="Game"
    :title="title"
    :subtitle="subtitle"
    :release-date="releaseDate"
    :tags="tags"
    :icon="Gamepad2"
    accent-class="border-emerald-200/80 bg-emerald-50/40"
  />
</template>
