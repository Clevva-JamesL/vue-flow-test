<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@lucide/vue'
import { timelineApi, type TimelineSummary } from '@/api/timelines'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const timelines = ref<TimelineSummary[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const isCreating = ref(false)

async function loadTimelines() {
  isLoading.value = true
  error.value = null

  try {
    timelines.value = await timelineApi.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load timelines'
  } finally {
    isLoading.value = false
  }
}

async function createTimeline() {
  isCreating.value = true
  error.value = null

  try {
    const timeline = await timelineApi.create({ title: 'New Literary Timeline' })
    await router.push({ name: 'editor', params: { id: timeline.id } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create timeline'
  } finally {
    isCreating.value = false
  }
}

onMounted(() => {
  void loadTimelines()
})
</script>

<template>
  <main class="mx-auto max-w-4xl px-6 py-8">
    <header class="mb-8 flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Literary Timeline Builder
        </p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight">Your timelines</h1>
        <p class="mt-2 text-muted-foreground">
          Create graph-based literary timelines with books, movies, and games.
        </p>
      </div>
      <Button :disabled="isCreating" @click="createTimeline">
        <Plus data-icon="inline-start" />
        {{ isCreating ? 'Creating…' : 'New timeline' }}
      </Button>
    </header>

    <p v-if="error" class="mb-4 text-sm text-destructive">{{ error }}</p>
    <p v-else-if="isLoading" class="text-muted-foreground">Loading timelines…</p>

    <div v-else-if="timelines.length" class="grid gap-4">
      <Card v-for="timeline in timelines" :key="timeline.id">
        <CardHeader class="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{{ timeline.title }}</CardTitle>
            <CardDescription>
              {{ timeline.nodeCount }} nodes · {{ timeline.edgeCount }} edges · updated
              {{ new Date(timeline.updatedAt).toLocaleString() }}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" as-child>
            <RouterLink :to="{ name: 'editor', params: { id: timeline.id } }">Open</RouterLink>
          </Button>
        </CardHeader>
      </Card>
    </div>

    <Card v-else class="border-dashed">
      <CardContent class="flex flex-col items-center gap-4 py-12 text-center">
        <p class="text-muted-foreground">No timelines yet.</p>
        <Button :disabled="isCreating" @click="createTimeline">
          <Plus data-icon="inline-start" />
          Create your first timeline
        </Button>
      </CardContent>
    </Card>
  </main>
</template>
