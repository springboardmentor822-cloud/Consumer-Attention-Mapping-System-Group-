# End-to-End Validation Report

This report summarizes the performance and execution results of running the fully integrated consumer attention mapping pipeline against a real retail video sequence.

---

## 1. Pipeline Execution Performance

*   **Video Filename:** `aisle_camera_1.mp4`
*   **Source:** Real video from `backend/datasets/retail_videos/`
*   **Frames Processed:** 383
*   **Video FPS:** `25.0`
*   **Detections Generated (YOLO):** 1951
*   **Unique Tracks Created (ByteTrack):** 33
*   **Sessions Created:** 33
*   **Attention Events Created:** 1780
*   **Zones Visited:** 2 (`Aisle 1 Corridor` and `Checkout Line Area`)
*   **Average Attention Score:** `0.2805`

---

## 2. Analytics Service Endpoints Query

### Heatmap Metrics
*   **Heatmap Data Points Generated:** 2
*   **Zone ID 1:** `zone-e2e-aisle`
*   **Zone ID 2:** `zone-e2e-checkout`
*   **Average Attention Score:** `0.2805`

### Dwell Metrics
*   **Total Sessions:** 33
*   **Average Session Duration:** `2.39 sec`
*   **Longest Session:** `15.28 sec`
*   **Shortest Session:** `0.04 sec`

### Zone Attractiveness Rankings
1.  **Aisle 1 Corridor**
    *   **Visits:** 1672
    *   **Unique Sessions:** 29
    *   **Attractiveness Score:** `0.5603`
2.  **Checkout Line Area**
    *   **Visits:** 108
    *   **Unique Sessions:** 10
    *   **Attractiveness Score:** `0.3184`

### Shopper Journey Transitions
*   **Transitions Count:** 2
    *   **Transition:** `Checkout Line Area` -> `Aisle 1 Corridor` (Count: 3)
    *   **Transition:** `Aisle 1 Corridor` -> `Checkout Line Area` (Count: 5)

---

## 3. Heatmap Visualization Image
The shopper coordinate density plot mapping physical coordinate densities (Hexbin layout) was generated successfully:
*   [heatmap_e2e.png](file:///e:/ATTENTION-MAPPING-SYSTEM/backend/datasets/annotated_gaze_samples/heatmap_e2e.png)
