<script setup lang="ts">
import type { Component } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

defineProps<{
  label: string
  title: string
  subtitle?: string
  releaseDate?: string | null
  tags?: string[]
  icon: Component
  accentClass?: string
}>()
</script>

<template>
  <Card :class="cn('min-w-44 shadow-sm', accentClass)">
    <Handle type="target" :position="Position.Top" class="!bg-border !border-border" />
    <CardHeader class="gap-2 px-3 py-2">
      <div class="flex items-center gap-2">
        <component :is="icon" class="size-4 shrink-0 text-muted-foreground" />
        <Badge variant="secondary" class="text-[0.65rem] uppercase tracking-wide">
          {{ label }}
        </Badge>
      </div>
      <CardTitle class="text-sm leading-snug">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent v-if="subtitle || releaseDate || tags?.length" class="space-y-2 px-3 pb-3 pt-0">
      <p v-if="subtitle" class="text-xs text-muted-foreground">{{ subtitle }}</p>
      <p v-if="releaseDate" class="text-xs text-muted-foreground">{{ releaseDate }}</p>
      <div v-if="tags?.length" class="flex flex-wrap gap-1">
        <Badge v-for="tag in tags" :key="tag" variant="outline" class="text-[0.65rem]">
          {{ tag }}
        </Badge>
      </div>
    </CardContent>
    <Handle type="source" :position="Position.Bottom" class="!bg-border !border-border" />
  </Card>
</template>
