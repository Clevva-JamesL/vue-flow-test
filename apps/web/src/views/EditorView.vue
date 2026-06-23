<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LiteraryTimeline from '@/components/flow/LiteraryTimeline.vue'
import { useTimelineStore } from '@/stores/timelineStore'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const store = useTimelineStore()
const localTitle = ref('')

const saveStatus = computed(() => {
  if (store.isSaving) return 'Saving…'
  if (store.hasUnsavedChanges) return 'Unsaved changes'
  if (store.lastSavedAt) return `Saved ${new Date(store.lastSavedAt).toLocaleTimeString()}`
  return 'Ready'
})

onMounted(async () => {
  store.reset()

  try {
    await store.load(props.id)
    localTitle.value = store.title
  } catch {
    await router.replace({ name: 'home' })
  }
})

function onTitleBlur() {
  if (localTitle.value.trim() && localTitle.value !== store.title) {
    store.title = localTitle.value.trim()
    store.markDirty()
  }
}

async function saveNow() {
  await store.save()
}

function addDemoNode() {
  const nextIndex = store.nodes.length + 1
  store.nodes.push({
    id: `node-${Date.now()}`,
    position: { x: 120 + nextIndex * 40, y: 100 + nextIndex * 30 },
    data: { mediaType: 'book', title: `Work ${nextIndex}` },
  })
  store.markDirty()
}
</script>

<template>
  <div class="editor">
    <header class="editor__toolbar">
      <div class="editor__left">
        <RouterLink class="back" to="/">← Timelines</RouterLink>
        <input
          v-model="localTitle"
          class="title-input"
          type="text"
          aria-label="Timeline title"
          @blur="onTitleBlur"
        />
      </div>

      <div class="editor__right">
        <span class="status" :class="{ saving: store.isSaving, dirty: store.hasUnsavedChanges }">
          {{ saveStatus }}
        </span>
        <button class="secondary" @click="addDemoNode">Add node</button>
        <button class="primary" :disabled="store.isSaving" @click="saveNow">Save now</button>
      </div>
    </header>

    <p v-if="store.error" class="error">{{ store.error }}</p>
    <div v-else-if="store.isLoading" class="loading">Loading timeline…</div>
    <LiteraryTimeline v-else class="editor__canvas" />
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem 1rem 1.25rem;
  gap: 0.75rem;
}

.editor__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #d8deea;
  border-radius: 12px;
}

.editor__left,
.editor__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back {
  color: #3b5bdb;
  text-decoration: none;
  white-space: nowrap;
}

.title-input {
  min-width: 240px;
  border: 1px solid #d0d7e6;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font: inherit;
}

.status {
  color: #5b6478;
  font-size: 0.9rem;
}

.status.dirty {
  color: #e67700;
}

.status.saving {
  color: #3b5bdb;
}

.primary,
.secondary {
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  border: 1px solid transparent;
}

.primary {
  background: #3b5bdb;
  color: #fff;
}

.secondary {
  background: #fff;
  border-color: #d0d7e6;
}

.editor__canvas {
  flex: 1;
  min-height: calc(100vh - 8rem);
}

.loading,
.error {
  padding: 1rem;
}

.error {
  color: #c92a2a;
}
</style>
