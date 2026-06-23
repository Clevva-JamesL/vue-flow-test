<script setup lang="ts">
import { Folder } from '@lucide/vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGroupNodeData } from '@/composables/useFlowNodeData'

const props = defineProps<NodeProps>()
const { title, description } = useGroupNodeData(props)
</script>

<template>
  <Card class="size-full min-h-40 min-w-64 border-dashed bg-muted/30 shadow-none">
    <Handle type="target" :position="Position.Top" class="!bg-border !border-border" />
    <CardHeader class="gap-2 px-4 py-3">
      <div class="flex items-center gap-2">
        <Folder class="size-4 text-muted-foreground" />
        <Badge variant="outline" class="text-[0.65rem] uppercase tracking-wide">Group</Badge>
      </div>
      <CardTitle class="text-base">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0">
      <p class="text-xs text-muted-foreground">
        Assign child nodes with <code class="rounded bg-muted px-1">parentNode</code> to nest works inside this series or universe.
      </p>
    </CardContent>
    <Handle type="source" :position="Position.Bottom" class="!bg-border !border-border" />
  </Card>
</template>
