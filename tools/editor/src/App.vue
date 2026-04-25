<template>
  <div class="app-container">
    <!-- Header -->
    <header class="main-header glass-card">
      <div class="logo">
        <el-icon :size="24" color="#06b6d4"><Files /></el-icon>
        <span>Manifest Editor</span>
      </div>
      
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="Search by name, description or labels..."
          clearable
          :prefix-icon="Search"
        />
      </div>

      <div class="header-actions">
        <el-button-group>
          <el-button @click="store.selectAll">Select All</el-button>
          <el-button @click="store.deselectAll">None</el-button>
        </el-button-group>
        <el-button :icon="MagicStick" @click="slideshowDialogVisible = true">
          Generate Slideshow
        </el-button>
        <el-button type="primary" :icon="Upload" @click="handleSave" :loading="saving">
          Save Changes
        </el-button>
      </div>
    </header>

    <!-- Slideshow Dialog -->
    <el-dialog
      v-model="slideshowDialogVisible"
      title="Generate Slideshow Embed"
      width="600px"
      custom-class="dark-dialog"
    >
      <div class="slideshow-config">
        <el-form label-position="top">
          <el-form-item label="Target Label">
            <el-select v-model="selectedSlideshowLabel" placeholder="Select label for images">
              <el-option
                v-for="label in store.allLabels"
                :key="label"
                :label="label"
                :value="label"
              />
            </el-select>
          </el-form-item>

          <div style="display: flex; gap: 20px">
            <el-form-item label="Default Language" style="flex: 1">
              <el-select v-model="slideshowConfig.lang">
                <el-option label="French" value="fr" />
                <el-option label="English" value="en" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="Display Style" style="flex: 1">
              <el-checkbox v-model="slideshowConfig.isOverlay" label="Fullscreen Overlay" border />
            </el-form-item>
          </div>
          
          <el-form-item label="Embed Code">
            <el-input
              type="textarea"
              :rows="5"
              readonly
              :value="generatedEmbedCode"
            />
            <el-button 
              type="primary" 
              style="margin-top: 10px"
              @click="copyEmbedCode"
            >
              Copy to Clipboard
            </el-button>
          </el-form-item>

          <el-form-item label="Live Preview">
            <div class="preview-container">
              <div v-if="!selectedSlideshowLabel" class="preview-placeholder">
                <el-icon :size="48" color="#334155"><MagicStick /></el-icon>
                <p>Select a target label to start the live preview</p>
              </div>
              <div 
                v-else
                ref="slideshowPreview" 
                class="labmtl-slideshow" 
                :data-label="selectedSlideshowLabel"
                :data-lang="slideshowConfig.lang"
                :data-overlay="slideshowConfig.isOverlay"
                data-manifest="http://localhost:3000/api/manifest"
              >
                <!-- Preview will be rendered here -->
              </div>
            </div>
            <el-button 
              v-if="selectedSlideshowLabel"
              size="small" 
              style="margin-top: 10px" 
              @click="refreshPreview"
            >
              Refresh Preview
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>

    <!-- Main Content -->
    <main class="gallery-container">
      <div v-if="store.loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else class="grid">
        <MediaCard
          v-for="item in filteredItems"
          :key="item.id"
          :item="item"
          :selected="store.selectedIds.has(item.id)"
          @toggle="store.toggleSelection(item.id)"
          @edit="openDrawer(item)"
        />
      </div>
    </main>

    <!-- Bulk Action Bar -->
    <transition name="slide-up">
      <div v-if="store.selectedIds.size > 0" class="bulk-actions-bar glass-card">
        <div class="selection-count">
          {{ store.selectedIds.size }} items selected
        </div>
        <div class="bulk-tools">
          <el-select
            v-model="bulkLabelsToAdd"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="Add labels to selected..."
            style="width: 300px"
          >
            <el-option
              v-for="label in store.allLabels"
              :key="label"
              :label="label"
              :value="label"
            />
          </el-select>
          <el-button type="primary" @click="applyBulkLabels">Apply</el-button>
          <el-button type="danger" @click="confirmBulkRemove" plain>Remove Labels</el-button>
          <el-divider direction="vertical" />
          <el-button type="danger" :icon="Delete" @click="handleBulkDelete">Delete Images</el-button>
        </div>
      </div>
    </transition>

    <!-- Item Drawer (Single Edit) -->
    <el-drawer
      v-model="drawerVisible"
      title="Edit Media Metadata"
      direction="rtl"
      size="40%"
      custom-class="dark-drawer"
    >
      <div v-if="activeItem" class="drawer-content">
        <img :src="`http://localhost:3000/${activeItem.formats.images[0].path}`" class="preview-img" />
        
        <div class="field-group">
          <label>Title (English)</label>
          <el-input v-model="activeItem.title.en" placeholder="English name" />
        </div>
        
        <div class="field-group">
          <label>Titre (Français)</label>
          <el-input v-model="activeItem.title.fr" placeholder="Nom en français" />
        </div>

        <div class="field-group">
          <label>Description (English)</label>
          <el-input type="textarea" v-model="activeItem.description.en" :rows="3" />
        </div>

        <div class="field-group">
          <label>Description (Français)</label>
          <el-input type="textarea" v-model="activeItem.description.fr" :rows="3" />
        </div>

        <div class="label-section">
          <label>Labels</label>
          <el-select
            v-model="activeItem.labels"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="Assign labels"
            style="width: 100%"
          >
            <el-option
              v-for="label in store.allLabels"
              :key="label"
              :label="label"
              :value="label"
            />
          </el-select>
        </div>

        <div class="label-section" style="margin-top: 20px">
          <label>Source URL (Click action)</label>
          <el-input v-model="activeItem.source_url" placeholder="https://..." @change="handleItemChange" />
        </div>

        <div style="margin-top: 24px">
          <el-button type="success" :icon="Check" @click="handleItemSave" :loading="saving">
            Save Metadata
          </el-button>
        </div>

        <div class="formats-section" style="margin-top: 24px">
          <label>Available Formats</label>
          <div v-for="fmt in activeItem.formats.images" :key="fmt.path" class="format-item">
            <span class="fmt-tag">{{ fmt.width }}w ({{ fmt.format }})</span>
            <el-link 
              type="primary" 
              :href="`http://localhost:3000/${fmt.path}`" 
              target="_blank"
              class="fmt-link"
            >
              View Asset
            </el-link>
          </div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid var(--border-glass); padding-top: 20px">
          <el-button type="danger" :icon="Delete" @click="handleSingleDelete">Delete Image From Disk</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Search, Upload, Files, MagicStick, Delete, Check } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useManifestStore, type MediaItem } from './stores/manifest';
import MediaCard from './components/MediaCard.vue';

const store = useManifestStore();
const searchQuery = ref('');
const saving = ref(false);
const drawerVisible = ref(false);
const slideshowDialogVisible = ref(false);
const selectedSlideshowLabel = ref('');
const slideshowPreview = ref<HTMLElement | null>(null);
const slideshowConfig = ref({
  lang: 'fr',
  isOverlay: false
});
const activeItem = ref<any | null>(null);
const bulkLabelsToAdd = ref<string[]>([]);

onMounted(() => {
  store.fetchManifest();
});

const filteredItems = computed(() => {
  if (!searchQuery.value) return store.items;
  const q = searchQuery.value.toLowerCase();
  return store.items.filter(item => 
    item.base_name.toLowerCase().includes(q) ||
    item.title.en.toLowerCase().includes(q) ||
    item.title.fr.toLowerCase().includes(q) ||
    item.description.en.toLowerCase().includes(q) ||
    item.description.fr.toLowerCase().includes(q) ||
    item.labels?.some(l => l.toLowerCase().includes(q))
  );
});

const generatedEmbedCode = computed(() => {
  const label = selectedSlideshowLabel.value || 'YOUR_LABEL';
  const overlayAttr = slideshowConfig.value.isOverlay ? '\n     data-overlay="true"' : '';
  return `<!-- LabMTL Slideshow -->
<div class="labmtl-slideshow" 
     data-label="${label}" 
     data-lang="${slideshowConfig.value.lang}"${overlayAttr}
     data-manifest="https://raw.githubusercontent.com/labmtl/assets/main/processed_media/manifest.json">
</div>
<script src="https://raw.githubusercontent.com/labmtl/assets/main/processed_media/slideshow.js" async><\/script>`;
});

const copyEmbedCode = () => {
  navigator.clipboard.writeText(generatedEmbedCode.value);
  ElMessage.success('Embed code copied to clipboard');
};

const refreshPreview = () => {
  if (typeof (window as any).initLabMTLSlideshow === 'function') {
    (window as any).initLabMTLSlideshow(slideshowPreview.value);
  }
};

import { watch } from 'vue';
watch([selectedSlideshowLabel, () => slideshowConfig.value.lang, () => slideshowConfig.value.isOverlay], () => {
  setTimeout(refreshPreview, 100);
}, { deep: true });

const openDrawer = (item: MediaItem) => {
  activeItem.value = item;
  drawerVisible.value = true;
};

const applyBulkLabels = () => {
  if (bulkLabelsToAdd.value.length === 0) return;
  store.addLabelsToSelected(bulkLabelsToAdd.value);
  bulkLabelsToAdd.value = [];
  ElMessage.success('Labels applied successfully');
};

const confirmBulkRemove = () => {
  ElMessageBox.prompt('Enter label to remove from all selected items', 'Bulk Remove', {
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel',
  }).then(({ value }) => {
    store.removeLabelFromSelected(value);
    ElMessage.info(`Removed label "${value}" from selected items`);
  });
};

const handleSave = async () => {
  saving.value = true;
  try {
    await store.saveManifest();
    ElMessage.success('Manifest saved successfully (backup created)');
  } catch (error) {
    ElMessage.error('Failed to save manifest');
  } finally {
    saving.value = false;
  }
};

const handleItemSave = async () => {
  await handleSave();
};

const handleItemChange = () => {
  // Can be used for auto-saving or visual indicator
};

const handleBulkDelete = () => {
  ElMessageBox.confirm(
    `Are you sure you want to delete ${store.selectedIds.size} images from disk and manifest? This cannot be undone.`,
    'Warning',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  ).then(async () => {
    await store.deleteSelected();
    ElMessage.success('Images deleted');
  });
};

const handleSingleDelete = () => {
  if (!activeItem.value) return;
  ElMessageBox.confirm(
    'Are you sure you want to delete this image from disk and manifest?',
    'Warning',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  ).then(async () => {
    store.selectedIds.clear();
    store.selectedIds.add(activeItem.value!.id);
    await store.deleteSelected();
    drawerVisible.value = false;
    ElMessage.success('Image deleted');
  });
};
</script>

<style>
.app-container {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.main-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  margin-bottom: 24px;
  position: sticky;
  top: 24px;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--accent-cyan);
}

.search-bar {
  flex-grow: 1;
}

.gallery-container {
  min-height: 500px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.bulk-actions-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  z-index: 200;
}

.selection-count {
  font-weight: 600;
  color: var(--accent-cyan);
}

.bulk-tools {
  display: flex;
  gap: 12px;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-img {
  width: 100%;
  border-radius: 8px;
}

.description {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
}

.label-section label, .formats-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.format-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  margin-bottom: 4px;
}

.fmt-tag {
  font-size: 0.85rem;
  color: #94a3b8;
}

.fmt-link {
  font-size: 0.85rem;
}

.preview-container {
  margin-top: 10px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-glass);
}

.preview-container .labmtl-slideshow {
  min-height: 200px;
}

.preview-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.preview-placeholder p {
  margin-top: 12px;
  font-size: 0.9rem;
}

/* Animations */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translate(-50%, 100px);
  opacity: 0;
}

:deep(.el-drawer) {
  background-color: var(--bg-deep) !important;
  color: white !important;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-input__inner) {
  color: white !important;
}
</style>
