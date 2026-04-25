import { defineStore } from 'pinia';
import axios from 'axios';

export interface MultilingualString {
  en: string;
  fr: string;
}

export interface MediaItem {
  id: string;
  base_name: string;
  title: MultilingualString;
  description: MultilingualString;
  labels?: string[];
  source_url?: string;
  formats: {
    images: Array<{
      width: number;
      format: string;
      path: string;
    }>;
    videos: any[];
    html: string;
  };
}

const API_BASE = 'http://localhost:3000';

export const useManifestStore = defineStore('manifest', {
  state: () => ({
    items: [] as MediaItem[],
    loading: false,
    selectedIds: new Set<string>(),
  }),
  getters: {
    allItems: (state) => state.items,
    selectedItems: (state) => state.items.filter(item => state.selectedIds.has(item.id)),
    allLabels: (state) => {
      const labels = new Set<string>();
      state.items.forEach(item => {
        item.labels?.forEach(label => labels.add(label));
      });
      return Array.from(labels).sort();
    },
  },
  actions: {
    async fetchManifest() {
      this.loading = true;
      try {
        const response = await axios.get(`${API_BASE}/api/manifest`);
        this.items = response.data.map((item: any) => {
          // Ensure title and description are multilingual objects
          const title = typeof item.title === 'string'
            ? { en: item.title, fr: item.title }
            : (item.title || { en: item.base_name, fr: item.base_name });
          
          const description = typeof item.description === 'string'
            ? { en: item.description, fr: item.description }
            : (item.description || { en: '', fr: '' });

          return {
            ...item,
            title,
            description,
            labels: item.labels || [],
            source_url: item.source_url || ''
          };
        });
      } catch (error) {
        console.error('Error fetching manifest:', error);
      } finally {
        this.loading = false;
      }
    },
    async saveManifest() {
      try {
        await axios.post(`${API_BASE}/api/manifest`, this.items);
      } catch (error) {
        console.error('Error saving manifest:', error);
        throw error;
      }
    },
    async deleteSelected() {
      if (this.selectedIds.size === 0) return;
      try {
        const ids = Array.from(this.selectedIds);
        await axios.delete(`${API_BASE}/api/media`, { data: { ids } });
        this.items = this.items.filter(item => !this.selectedIds.has(item.id));
        this.selectedIds.clear();
      } catch (error) {
        console.error('Error deleting items:', error);
        throw error;
      }
    },
    toggleSelection(id: string) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
    },
    selectAll() {
      this.selectedIds = new Set(this.items.map(item => item.id));
    },
    deselectAll() {
      this.selectedIds.clear();
    },
    addLabelsToSelected(labels: string[]) {
      this.selectedItems.forEach(item => {
        const currentLabels = item.labels || [];
        labels.forEach(l => {
          if (!currentLabels.includes(l)) {
            currentLabels.push(l);
          }
        });
        item.labels = currentLabels;
      });
    },
    removeLabelFromSelected(label: string) {
      this.selectedItems.forEach(item => {
        item.labels = item.labels?.filter(l => l !== label);
      });
    }
  }
});
