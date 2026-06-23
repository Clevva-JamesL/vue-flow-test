<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()

const mediaLabels: Record<string, string> = {
  book: 'Book',
  movie: 'Movie',
  game: 'Game',
  group: 'Group',
}

const mediaType = typeof props.data?.mediaType === 'string' ? props.data.mediaType : props.type
const title = typeof props.data?.title === 'string' ? props.data.title : 'Untitled'
</script>

<template>
  <div class="media-node" :class="mediaType ? `media-node--${mediaType}` : 'media-node--default'">
    <Handle type="target" :position="Position.Top" />
    <span class="media-node__kind">{{ mediaLabels[mediaType] ?? 'Node' }}</span>
    <span class="media-node__title">{{ title }}</span>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.media-node {
  min-width: 140px;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #c7d0e1;
  background: #fff;
  box-shadow: 0 1px 3px rgb(26 26 46 / 8%);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.media-node--book {
  border-color: #91a7ff;
  background: #f3f6ff;
}

.media-node--movie {
  border-color: #ffa8a8;
  background: #fff5f5;
}

.media-node--game {
  border-color: #8ce99a;
  background: #f4fdf5;
}

.media-node--group {
  border-color: #ced4da;
  background: #f8f9fa;
  min-width: 180px;
}

.media-node__kind {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5b6478;
}

.media-node__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}
</style>
