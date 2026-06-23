<script setup lang="ts">
import { BookOpen } from '@lucide/vue'
import type { NodeProps } from '@vue-flow/core'
import MediaNodeShell from '@/components/flow/nodes/MediaNodeShell.vue'
import { useMediaNodeData } from '@/composables/useFlowNodeData'

const props = defineProps<NodeProps>()
const { title, subtitle, releaseDate, tags } = useMediaNodeData(props)
</script>

<template>
  <MediaNodeShell
    label="Book"
    :title="title"
    :subtitle="subtitle"
    :release-date="releaseDate"
    :tags="tags"
    :icon="BookOpen"
    accent-class="border-blue-200/80 bg-blue-50/40"
  />
</template>
