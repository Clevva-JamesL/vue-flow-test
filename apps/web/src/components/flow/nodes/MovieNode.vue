<script setup lang="ts">
import { Film } from '@lucide/vue'
import type { NodeProps } from '@vue-flow/core'
import MediaNodeShell from '@/components/flow/nodes/MediaNodeShell.vue'
import { useMediaNodeData } from '@/composables/useFlowNodeData'

const props = defineProps<NodeProps>()
const { title, subtitle, releaseDate, tags } = useMediaNodeData(props)
</script>

<template>
  <MediaNodeShell
    label="Movie"
    :title="title"
    :subtitle="subtitle"
    :release-date="releaseDate"
    :tags="tags"
    :icon="Film"
    accent-class="border-rose-200/80 bg-rose-50/40"
  />
</template>
