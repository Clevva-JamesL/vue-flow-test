<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Film, Folder, Gamepad2, Plus } from '@lucide/vue'
import type { FlowNodeType } from '@repo/shared'
import LiteraryTimeline from '@/components/flow/LiteraryTimeline.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
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

const statusVariant = computed(() => {
  if (store.isSaving) return 'secondary'
  if (store.hasUnsavedChanges) return 'outline'
  return 'secondary'
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

function addNode(type: FlowNodeType) {
  store.addNode(type)
}

const nodeOptions: Array<{ type: FlowNodeType; label: string; icon: typeof BookOpen }> = [
  { type: 'book', label: 'Book', icon: BookOpen },
  { type: 'movie', label: 'Movie', icon: Film },
  { type: 'game', label: 'Game', icon: Gamepad2 },
  { type: 'group', label: 'Group', icon: Folder },
]
</script>

<template>
  <div class="flex h-screen flex-col gap-3 p-4">
    <header class="flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
      <div class="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="sm" as-child>
          <RouterLink to="/">← Timelines</RouterLink>
        </Button>
        <Separator orientation="vertical" class="h-6" />
        <Input
          v-model="localTitle"
          class="max-w-sm border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          type="text"
          aria-label="Timeline title"
          @blur="onTitleBlur"
        />
      </div>

      <div class="flex items-center gap-2">
        <Badge :variant="statusVariant">{{ saveStatus }}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Plus data-icon="inline-start" />
              Add node
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Node type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="option in nodeOptions"
              :key="option.type"
              @click="addNode(option.type)"
            >
              <component :is="option.icon" />
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" :disabled="store.isSaving" @click="saveNow">Save now</Button>
      </div>
    </header>

    <p v-if="store.error" class="text-sm text-destructive">{{ store.error }}</p>
    <div v-else-if="store.isLoading" class="flex flex-1 items-center justify-center text-muted-foreground">
      Loading timeline…
    </div>
    <LiteraryTimeline v-else class="min-h-0 flex-1" />
  </div>
</template>
