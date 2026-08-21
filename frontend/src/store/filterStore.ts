import { create } from 'zustand';

interface FilterState {
  selectedStoreId: string;
  selectedDateRange: string;
  selectedSegment: string;
  activeHeatmapLayer: 'TRAFFIC' | 'ZONE_DENSITY' | 'GAZE_FOCUS' | 'SHELF_HOTSPOT';
  setSelectedStoreId: (storeId: string) => void;
  setSelectedDateRange: (range: string) => void;
  setSelectedSegment: (segment: string) => void;
  setActiveHeatmapLayer: (layer: 'TRAFFIC' | 'ZONE_DENSITY' | 'GAZE_FOCUS' | 'SHELF_HOTSPOT') => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedStoreId: 'STORE-812',
  selectedDateRange: 'TODAY',
  selectedSegment: 'ALL',
  activeHeatmapLayer: 'TRAFFIC',
  setSelectedStoreId: (storeId) => set({ selectedStoreId: storeId }),
  setSelectedDateRange: (range) => set({ selectedDateRange: range }),
  setSelectedSegment: (segment) => set({ selectedSegment: segment }),
  setActiveHeatmapLayer: (layer) => set({ activeHeatmapLayer: layer })
}));
