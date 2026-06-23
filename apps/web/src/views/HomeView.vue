<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { timelineApi, type TimelineSummary } from '@/api/timelines'

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
  <main class="home">
    <header class="home__header">
      <div>
        <p class="eyebrow">Literary Timeline Builder</p>
        <h1>Your timelines</h1>
        <p class="subtitle">Create graph-based literary timelines with books, movies, and games.</p>
      </div>
      <button class="primary" :disabled="isCreating" @click="createTimeline">
        {{ isCreating ? 'Creating…' : 'New timeline' }}
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="isLoading" class="muted">Loading timelines…</p>

    <ul v-else-if="timelines.length" class="timeline-list">
      <li v-for="timeline in timelines" :key="timeline.id" class="timeline-card">
        <div>
          <h2>{{ timeline.title }}</h2>
          <p class="muted">
            {{ timeline.nodeCount }} nodes · {{ timeline.edgeCount }} edges · updated
            {{ new Date(timeline.updatedAt).toLocaleString() }}
          </p>
        </div>
        <RouterLink class="link" :to="{ name: 'editor', params: { id: timeline.id } }">Open</RouterLink>
      </li>
    </ul>

    <div v-else class="empty">
      <p>No timelines yet.</p>
      <button class="primary" :disabled="isCreating" @click="createTimeline">Create your first timeline</button>
    </div>
  </main>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
}

.home__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5b6478;
}

h1 {
  margin: 0;
  font-size: 2rem;
}

.subtitle,
.muted {
  color: #5b6478;
}

.subtitle {
  margin: 0.5rem 0 0;
}

.primary {
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  background: #3b5bdb;
  color: #fff;
}

.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: #c92a2a;
}

.timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.timeline-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid #d8deea;
  border-radius: 12px;
}

.timeline-card h2 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.link {
  color: #3b5bdb;
  text-decoration: none;
  font-weight: 600;
}

.empty {
  padding: 3rem 1rem;
  text-align: center;
  background: #fff;
  border: 1px dashed #c7d0e1;
  border-radius: 12px;
}
</style>
