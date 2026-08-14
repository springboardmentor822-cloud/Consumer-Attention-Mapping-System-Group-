/**
 * objectCoverTransform.test.js
 * ============================
 * Unit tests for the object-cover coordinate transformation utility.
 * Run with: npx vitest run src/utils/objectCoverTransform.test.js
 *
 * Test cases cover:
 *  1. Same aspect ratio → scale=1, no crop offset
 *  2. Portrait source inside landscape container
 *  3. Landscape source inside portrait container
 *  4. Center bounding box placement
 *  5. Edge bounding box placement
 *  6. Cropped area must not incorrectly shift person's box
 */

import { describe, it, expect } from "vitest";
import {
  computeObjectCoverParams,
  normalizedBboxToCSS,
  normalizedPointToCSS,
} from "./objectCoverTransform";

// Helper: expect number approximately equal (float tolerance)
const approx = (a, b, tol = 0.001) => Math.abs(a - b) <= tol;

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Same aspect ratio → scale=1, offsets=0
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 1 — Same aspect ratio: 1920×1080 video in 1920×1080 container", () => {
  const nW = 1920, nH = 1080, cW = 1920, cH = 1080;

  it("scale should be exactly 1.0", () => {
    const { scale } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(scale).toBeCloseTo(1.0, 5);
  });

  it("offsetX should be 0 (no horizontal crop)", () => {
    const { offsetX } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(offsetX).toBeCloseTo(0, 5);
  });

  it("offsetY should be 0 (no vertical crop)", () => {
    const { offsetY } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(offsetY).toBeCloseTo(0, 5);
  });

  it("normalized (0,0,1,1) bbox fills the entire container exactly", () => {
    const css = normalizedBboxToCSS({ x: 0, y: 0, w: 1, h: 1 }, nW, nH, cW, cH);
    expect(css.left).toBeCloseTo(0);
    expect(css.top).toBeCloseTo(0);
    expect(css.width).toBeCloseTo(1920);
    expect(css.height).toBeCloseTo(1080);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Portrait source (1080×1920) inside landscape container (1920×1080)
// object-cover: scale to fill → scale by height (1080/1920 = 0.5625... no)
// Actually: scale = max(1920/1080, 1080/1920) = max(1.778, 0.5625) = 1.778
// scaledW = 1080 * 1.778 = 1920, scaledH = 1920 * 1.778 = 3413
// offsetX = (1920 - 1920) / 2 = 0
// offsetY = (3413 - 1080) / 2 = 1166.67
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 2 — Portrait source (1080×1920) inside landscape container (1920×1080)", () => {
  const nW = 1080, nH = 1920, cW = 1920, cH = 1080;
  const expectedScale = 1920 / 1080; // ≈ 1.7778

  it("scale should be containerW / nativeW (≈1.778)", () => {
    const { scale } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(scale).toBeCloseTo(expectedScale, 3);
  });

  it("offsetX should be 0 (width exactly fills)", () => {
    const { offsetX } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(offsetX).toBeCloseTo(0, 1);
  });

  it("offsetY should be positive (top/bottom cropped)", () => {
    const { offsetY } = computeObjectCoverParams(nW, nH, cW, cH);
    const expectedOffsetY = (1920 * expectedScale - 1080) / 2;
    expect(offsetY).toBeCloseTo(expectedOffsetY, 1);
  });

  it("center of native video (0.5, 0.5) maps to center of container", () => {
    const { cssX, cssY } = normalizedPointToCSS(0.5, 0.5, nW, nH, cW, cH);
    expect(cssX).toBeCloseTo(cW / 2, 0);
    expect(cssY).toBeCloseTo(cH / 2, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Landscape source (1920×1080) inside portrait container (540×960)
// scale = max(540/1920, 960/1080) = max(0.28125, 0.888...) = 0.888...
// scaledW = 1920 * 0.889 = 1706.7, scaledH = 1080 * 0.889 = 960
// offsetX = (1706.7 - 540) / 2 = 583.3
// offsetY = (960 - 960) / 2 = 0
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 3 — Landscape source (1920×1080) inside portrait container (540×960)", () => {
  const nW = 1920, nH = 1080, cW = 540, cH = 960;
  const expectedScale = 960 / 1080; // ≈ 0.8889

  it("scale should be containerH / nativeH (≈0.889)", () => {
    const { scale } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(scale).toBeCloseTo(expectedScale, 3);
  });

  it("offsetY should be 0 (height exactly fills)", () => {
    const { offsetY } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(offsetY).toBeCloseTo(0, 1);
  });

  it("offsetX should be positive (left/right cropped)", () => {
    const { offsetX } = computeObjectCoverParams(nW, nH, cW, cH);
    const expectedOffsetX = (1920 * expectedScale - 540) / 2;
    expect(offsetX).toBeCloseTo(expectedOffsetX, 1);
  });

  it("center of native video (0.5, 0.5) maps to center of container", () => {
    const { cssX, cssY } = normalizedPointToCSS(0.5, 0.5, nW, nH, cW, cH);
    expect(cssX).toBeCloseTo(cW / 2, 0);
    expect(cssY).toBeCloseTo(cH / 2, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Center bounding box on 1920×1080 source in 1280×720 container
// scale = max(1280/1920, 720/1080) = max(0.667, 0.667) = 0.667
// offsetX = offsetY = 0 (same aspect ratio)
// A center bbox at (0.40, 0.35, 0.20, 0.30):
//   nativeX = 0.40*1920 = 768, nativeY = 0.35*1080 = 378
//   nativeW = 0.20*1920 = 384, nativeH = 0.30*1080 = 324
//   displayLeft = 768 * 0.667 - 0 = 512
//   displayTop  = 378 * 0.667 - 0 = 252
//   displayW    = 384 * 0.667 = 256
//   displayH    = 324 * 0.667 = 216
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 4 — Center bounding box on 1920×1080 → 1280×720 container (same aspect ratio)", () => {
  const nW = 1920, nH = 1080, cW = 1280, cH = 720;
  const bbox = { x: 0.40, y: 0.35, w: 0.20, h: 0.30 };

  it("scale should be 2/3 (≈0.667)", () => {
    const { scale } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(scale).toBeCloseTo(2 / 3, 3);
  });

  it("displayLeft should be ≈512", () => {
    const { left } = normalizedBboxToCSS(bbox, nW, nH, cW, cH);
    expect(left).toBeCloseTo(512, 0);
  });

  it("displayTop should be ≈252", () => {
    const { top } = normalizedBboxToCSS(bbox, nW, nH, cW, cH);
    expect(top).toBeCloseTo(252, 0);
  });

  it("displayWidth should be ≈256", () => {
    const { width } = normalizedBboxToCSS(bbox, nW, nH, cW, cH);
    expect(width).toBeCloseTo(256, 0);
  });

  it("displayHeight should be ≈216", () => {
    const { height } = normalizedBboxToCSS(bbox, nW, nH, cW, cH);
    expect(height).toBeCloseTo(216, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Bounding box near the right edge of a cropped landscape video
// Source: 1920×1080, Container: 540×960 (portrait, crops left & right)
// scale = 960/1080 ≈ 0.8889
// offsetX = (1920*0.8889 - 540)/2 ≈ 582.67
// A person at the far right: bbox = {x: 0.85, y: 0.20, w: 0.10, h: 0.50}
//   nativeX = 0.85*1920 = 1632  → displayLeft = 1632*0.8889 - 582.67 ≈ 868.9
//   But container is only 540px wide, so this box is partially off-screen (valid)
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 5 — Edge bounding box: right-side person partially off cropped container", () => {
  const nW = 1920, nH = 1080, cW = 540, cH = 960;
  const bbox = { x: 0.85, y: 0.20, w: 0.10, h: 0.50 };
  const scale = 960 / 1080;
  const offsetX = (1920 * scale - 540) / 2;

  it("offsetX should be positive (landscape crop)", () => {
    const { offsetX: ox } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(ox).toBeCloseTo(offsetX, 1);
  });

  it("right-edge person's displayLeft should reflect the correct offset subtraction", () => {
    const { left } = normalizedBboxToCSS(bbox, nW, nH, cW, cH);
    const expected = 0.85 * nW * scale - offsetX;
    expect(left).toBeCloseTo(expected, 1);
  });

  it("display width should scale proportionally", () => {
    const { width } = normalizedBboxToCSS(bbox, nW, nH, cW, cH);
    expect(width).toBeCloseTo(0.10 * nW * scale, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Cropped area must NOT shift a person who is in the VISIBLE portion
// Source: 1920×1080, Container: 1280×800 (slight vertical letterbox removal)
// scale = max(1280/1920, 800/1080) = max(0.667, 0.741) = 0.741
// scaledW = 1920*0.741 = 1422.2, scaledH = 1080*0.741 = 800
// offsetX = (1422.2 - 1280)/2 = 71.1
// offsetY = (800 - 800)/2 = 0
// Person at center (x=0.4, y=0.3):
//   nativeX=768, → displayLeft = 768*0.741 - 71.1 = 498.1
//   If we naively used left = x * containerW = 0.4 * 1280 = 512 → wrong by ~14px
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 6 — Cropped offset must not incorrectly shift visible person box", () => {
  const nW = 1920, nH = 1080, cW = 1280, cH = 800;
  const scale = Math.max(cW / nW, cH / nH);  // 800/1080 ≈ 0.7407
  const offsetX = (nW * scale - cW) / 2;

  it("scale should be containerH/nativeH since height ratio is larger", () => {
    const { scale: s } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(s).toBeCloseTo(cH / nH, 4);
  });

  it("offsetX should be positive (slight left/right crop)", () => {
    const { offsetX: ox } = computeObjectCoverParams(nW, nH, cW, cH);
    expect(ox).toBeGreaterThan(0);
    expect(ox).toBeCloseTo(offsetX, 1);
  });

  it("naive x% approach gives different (wrong) result than correct transform", () => {
    // Naive (wrong) approach:
    const bboxX = 0.4;
    const naiveLeft = bboxX * cW;  // 512

    // Correct approach:
    const { left } = normalizedBboxToCSS({ x: bboxX, y: 0.3, w: 0.1, h: 0.4 }, nW, nH, cW, cH);

    // They should NOT be equal because of the crop offset
    expect(Math.abs(naiveLeft - left)).toBeGreaterThan(1);
  });

  it("person at native center maps to container center after transform", () => {
    // Center of native video: x=0.5, y=0.5 → should land at (cW/2, cH/2)
    const { cssX, cssY } = normalizedPointToCSS(0.5, 0.5, nW, nH, cW, cH);
    expect(cssX).toBeCloseTo(cW / 2, 0);
    expect(cssY).toBeCloseTo(cH / 2, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Guard — degenerate inputs return safe defaults
// ─────────────────────────────────────────────────────────────────────────────
describe("Test 7 — Degenerate / zero inputs return safe defaults", () => {
  it("zero video dimensions return scale=1, offsets=0", () => {
    const { scale, offsetX, offsetY } = computeObjectCoverParams(0, 0, 1280, 720);
    expect(scale).toBe(1);
    expect(offsetX).toBe(0);
    expect(offsetY).toBe(0);
  });

  it("zero container dimensions return scale=1, offsets=0", () => {
    const { scale, offsetX, offsetY } = computeObjectCoverParams(1920, 1080, 0, 0);
    expect(scale).toBe(1);
    expect(offsetX).toBe(0);
    expect(offsetY).toBe(0);
  });
});
