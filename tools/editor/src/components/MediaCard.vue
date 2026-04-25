<template>
  <div 
    class="media-card glass-card" 
    :class="{ 'selected': selected }"
    @click="$emit('toggle')"
  >
    <div class="thumbnail-container">
      <img :src="thumbnailUrl" loading="lazy" />
      <div class="overlay">
        <div class="checkbox" :class="{ 'checked': selected }" @click.stop="$emit('toggle')">
          <el-icon v-if="selected"><Check /></el-icon>
        </div>
        <div class="info-btn" @click.stop="$emit('edit')">
          <el-icon><InfoFilled /></el-icon>
        </div>
      </div>
    </div>
    <div class="info">
      <div class="name">
        {{ item.title.fr || item.title.en }}
      </div>
      <div class="labels">
        <el-tag 
          v-for="label in item.labels" 
          :key="label" 
          size="small" 
          effect="plain"
          round
        >
          {{ label }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check, InfoFilled } from '@element-plus/icons-vue';
import type { MediaItem } from './stores/manifest';

const props = defineProps<{
  item: MediaItem;
  selected: boolean;
}>();

defineEmits(['toggle', 'edit']);

const thumbnailUrl = computed(() => {
  // Try to find the 640w webp image
  const img = props.item.formats.images.find(f => f.width === 640 && f.format === 'webp') 
             || props.item.formats.images[0];
  return `http://localhost:3000/${img?.path}`;
});
</script>

<style scoped>
.media-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease;
  display: flex;
  flex-direction: column;
}

.media-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-cyan);
}

.media-card.selected {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
}

.thumbnail-container {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
}

.thumbnail-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
}

.checkbox, .info-btn {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  color: #fff;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
}

.info-btn:hover {
  background: var(--accent-purple);
  border-color: var(--accent-purple);
  transform: scale(1.1);
}

.info {
  padding: 12px;
  flex-grow: 1;
}

.name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

:deep(.el-tag) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}
</style>
