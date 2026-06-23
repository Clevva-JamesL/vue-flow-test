import { onUnmounted, ref, watch } from 'vue'
import { useTimelineStore } from '@/stores/timelineStore'

const IDLE_AFTER_MOVE_MS = 2000
const MIN_AUTOSAVE_INTERVAL_MS = 30_000

export function useTimelinePersistence() {
  const store = useTimelineStore()
  const lastNodeMoveAt = ref(Date.now())
  let saveTimeoutId: ReturnType<typeof setTimeout> | undefined
  let lastAutosaveAt = Date.now()

  function markNodeMoved() {
    lastNodeMoveAt.value = Date.now()
    scheduleAutosave()
  }

  function getNextSaveTime() {
    return Math.max(
      lastNodeMoveAt.value + IDLE_AFTER_MOVE_MS,
      lastAutosaveAt + MIN_AUTOSAVE_INTERVAL_MS,
    )
  }

  function scheduleAutosave() {
    clearTimeout(saveTimeoutId)
    const delay = Math.max(0, getNextSaveTime() - Date.now())
    saveTimeoutId = setTimeout(() => {
      void attemptAutosave()
    }, delay)
  }

  async function attemptAutosave() {
    if (!store.id || store.isReadOnly || !store.hasUnsavedChanges) return

    const now = Date.now()
    if (now < lastNodeMoveAt.value + IDLE_AFTER_MOVE_MS || now < lastAutosaveAt + MIN_AUTOSAVE_INTERVAL_MS) {
      scheduleAutosave()
      return
    }

    if (store.isSaving) {
      scheduleAutosave()
      return
    }

    await store.save()
    lastAutosaveAt = Date.now()
  }

  const stopLastSavedWatch = watch(
    () => store.lastSavedAt,
    (savedAt) => {
      if (savedAt) {
        lastAutosaveAt = new Date(savedAt).getTime()
      }
    },
    { immediate: true },
  )

  const stopIdWatch = watch(
    () => store.id,
    () => {
      lastNodeMoveAt.value = Date.now()
    },
  )

  const stopChangeWatch = watch(
    () => [store.nodes, store.edges, store.viewport, store.title] as const,
    () => {
      if (store.hasUnsavedChanges && store.id) {
        scheduleAutosave()
      }
    },
    { deep: true },
  )

  onUnmounted(() => {
    stopLastSavedWatch()
    stopIdWatch()
    stopChangeWatch()
    clearTimeout(saveTimeoutId)
  })

  return { markNodeMoved }
}
