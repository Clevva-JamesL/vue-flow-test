<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@lucide/vue'
import { timelineApi, type TimelineSummary } from '@/api/timelines'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const auth = useAuthStore()
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

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
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
          Signed in as {{ auth.user?.email }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="logout">Sign out</Button>
        <Button :disabled="isCreating" @click="createTimeline">
          <Plus data-icon="inline-start" />
          {{ isCreating ? 'Creating…' : 'New timeline' }}
        </Button>
      </div>
    </header>

    <p v-if="error" class="mb-4 text-sm text-destructive">{{ error }}</p>
    <p v-else-if="isLoading" class="text-muted-foreground">Loading timelines…</p>

    <div v-else-if="timelines.length" class="grid gap-4">
      <Card v-for="timeline in timelines" :key="timeline.id">
        <CardHeader class="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <div class="flex items-center gap-2">
              <CardTitle>{{ timeline.title }}</CardTitle>
              <Badge v-if="timeline.visibility !== 'private'" variant="secondary">
                {{ timeline.visibility }}
              </Badge>
            </div>
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
