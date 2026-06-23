import { computed } from 'vue'
import type { NodeProps } from '@vue-flow/core'
import { groupNodeDataSchema, mediaNodeDataSchema } from '@repo/shared'

export function useMediaNodeData(props: NodeProps) {
  const parsed = computed(() => {
    const result = mediaNodeDataSchema.safeParse(props.data)
    if (result.success) return result.data

    const title = typeof props.data?.title === 'string' ? props.data.title : 'Untitled'
    return { title, subtitle: undefined, releaseDate: null, tags: [] as string[] }
  })

  const title = computed(() => parsed.value.title)
  const subtitle = computed(() => parsed.value.subtitle)
  const releaseDate = computed(() => parsed.value.releaseDate ?? null)
  const tags = computed(() => parsed.value.tags ?? [])

  return { title, subtitle, releaseDate, tags }
}

export function useGroupNodeData(props: NodeProps) {
  const parsed = computed(() => {
    const result = groupNodeDataSchema.safeParse(props.data)
    if (result.success) return result.data

    const title = typeof props.data?.title === 'string' ? props.data.title : 'Group'
    return { title, description: undefined }
  })

  const title = computed(() => parsed.value.title)
  const description = computed(() => parsed.value.description)

  return { title, description }
}
