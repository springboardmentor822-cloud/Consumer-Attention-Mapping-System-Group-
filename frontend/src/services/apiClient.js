import { mockDashboardData } from './mockDashboardData';

const API_BASE = 'http://localhost:8000/api/v1';

async function safeFetch(url, fallbackData) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallbackData;
    }
    return await response.json();
  } catch (err) {
    // Return fallback mock data on network error / backend offline
    return fallbackData;
  }
}

export const apiClient = {
  // Fetch Shopper Segmentation breakdown
  async getShopperSegmentation(storeId = 1) {
    const fallback = {
      store_id: storeId,
      segment_counts: {
        explorers: 3720,
        quick_buyers: 5592,
        comparison_shoppers: 6151,
        impulse_buyers: 3179,
        brand_loyal: 2500,
      },
    };
    return safeFetch(`${API_BASE}/behavior/segmentation?store_id=${storeId}`, fallback);
  },

  // Fetch Store Heatmap layers (Traffic, Zone, Gaze, Shelf)
  async getStoreHeatmap(storeId = 1, dateRange = 'Last 7 Days', segmentType = 'all') {
    const fallback = {
      store_id: storeId,
      date_range: dateRange,
      segment_type: segmentType,
      layers: {
        grid_dimensions: { width: 100, height: 100 },
      },
    };
    return safeFetch(`${API_BASE}/heatmaps/store?store_id=${storeId}&date_range=${encodeURIComponent(dateRange)}&segment_type=${segmentType}`, fallback);
  },

  // Fetch Product Attractiveness Scores
  async getAttractivenessScores(storeId = 1, category = '') {
    const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
    const fallback = mockDashboardData.marketingManager.productAttractiveness.ranking.map((item) => ({
      store_id: storeId,
      product_sku: `SKU-${item.rank}`,
      product_name: item.name,
      category: 'Electronics',
      shelf_location: 'Shelf A',
      attractiveness_score: item.score * 10,
    }));
    return safeFetch(`${API_BASE}/analytics/attractiveness?store_id=${storeId}${categoryParam}`, fallback);
  },

  // Fetch Optimization & Diagnostic Recommendations
  async getRecommendations(storeId = 1) {
    const fallback = mockDashboardData.marketingManager.recommendations.map((r) => ({
      id: r.id,
      store_id: storeId,
      target_sku: 'SKU-REC',
      product_name: r.title,
      priority_level: r.badge,
      rule_type: 'diagnostic_alert',
      action_item: r.detail,
      expected_conversion_uplift: '+15.5%',
      status: 'active',
    }));
    return safeFetch(`${API_BASE}/recommendations?store_id=${storeId}`, fallback);
  },
};
