import { onUnmounted, watch } from 'vue'
import { useTimelineStore } from '@/stores/timelineStore'

function debounce<T extends (...args: never[]) => void>(fn: T, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }

  debounced.cancel = () => clearTimeout(timeoutId)

  return debounced
}

export function useTimelinePersistence(debounceMs = 1500) {
  const store = useTimelineStore()

  const debouncedSave = debounce(async () => {
    if (!store.id || store.isReadOnly || !store.hasUnsavedChanges || store.isSaving) return
    await store.save()
  }, debounceMs)

  const stopWatch = watch(
    () => [store.nodes, store.edges, store.viewport, store.title] as const,
    () => {
      if (store.hasUnsavedChanges && store.id) {
        void debouncedSave()
      }
    },
    { deep: true },
  )

  onUnmounted(() => {
    stopWatch()
    debouncedSave.cancel()
  })

  return { debouncedSave }
}
