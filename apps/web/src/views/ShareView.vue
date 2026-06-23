<script setup lang="ts">
import { onMounted } from 'vue'
import LiteraryTimeline from '@/components/flow/LiteraryTimeline.vue'
import { Badge } from '@/components/ui/badge'
import { useTimelineStore } from '@/stores/timelineStore'

const props = defineProps<{
  slug: string
}>()

const store = useTimelineStore()

onMounted(async () => {
  store.reset()

  try {
    await store.loadPublic(props.slug)
  } catch {
    // error surfaced via store.error
  }
})
</script>

<template>
  <div class="flex h-screen flex-col gap-3 p-4">
    <header class="flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Shared timeline
        </p>
        <h1 class="truncate text-lg font-semibold">{{ store.title }}</h1>
      </div>
      <Badge variant="secondary">Read only</Badge>
    </header>

    <p v-if="store.error" class="text-sm text-destructive">{{ store.error }}</p>
    <div v-else-if="store.isLoading" class="flex flex-1 items-center justify-center text-muted-foreground">
      Loading shared timeline…
    </div>
    <LiteraryTimeline v-else readonly class="min-h-0 flex-1" />
  </div>
</template>
