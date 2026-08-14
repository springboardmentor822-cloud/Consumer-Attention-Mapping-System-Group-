/**
 * objectCoverTransform.js
 * =======================
 * Pure utility to convert normalized backend bounding box coordinates
 * (relative to native video resolution, 0-1 range) into CSS pixel
 * coordinates that correctly account for CSS `object-cover` cropping.
 *
 * Background:
 *   When a <video> uses `object-cover`, the browser scales the video so
 *   that it FILLS the container, then crops the overflow symmetrically.
 *   A simple `left: x%` approach fails because it doesn't account for
 *   the portion of the video that is cropped off.
 *
 * Formula (from spec):
 *   scale     = max(containerW / nativeW, containerH / nativeH)
 *   scaledW   = nativeW * scale
 *   scaledH   = nativeH * scale
 *   offsetX   = (scaledW - containerW) / 2   ← pixels cropped from left
 *   offsetY   = (scaledH - containerH) / 2   ← pixels cropped from top
 *
 *   For each normalized bbox (x, y, w, h):
 *     nativeX = bbox.x * nativeW
 *     nativeY = bbox.y * nativeH
 *     nativeW_ = bbox.w * nativeW
 *     nativeH_ = bbox.h * nativeH
 *
 *     displayLeft   = nativeX * scale - offsetX
 *     displayTop    = nativeY * scale - offsetY
 *     displayWidth  = nativeW_ * scale
 *     displayHeight = nativeH_ * scale
 */

/**
 * Compute the object-cover transform parameters for a given video/container pair.
 *
 * @param {number} videoNativeWidth   - Native video width in pixels (e.g. 1920)
 * @param {number} videoNativeHeight  - Native video height in pixels (e.g. 1080)
 * @param {number} containerWidth     - Rendered container width in CSS pixels
 * @param {number} containerHeight    - Rendered container height in CSS pixels
 * @returns {{ scale: number, offsetX: number, offsetY: number, scaledWidth: number, scaledHeight: number }}
 */
export function computeObjectCoverParams(
  videoNativeWidth,
  videoNativeHeight,
  containerWidth,
  containerHeight
) {
  if (
    videoNativeWidth <= 0 || videoNativeHeight <= 0 ||
    containerWidth <= 0  || containerHeight <= 0
  ) {
    return { scale: 1, offsetX: 0, offsetY: 0, scaledWidth: containerWidth, scaledHeight: containerHeight };
  }

  const scale = Math.max(
    containerWidth  / videoNativeWidth,
    containerHeight / videoNativeHeight
  );

  const scaledWidth  = videoNativeWidth  * scale;
  const scaledHeight = videoNativeHeight * scale;

  const offsetX = (scaledWidth  - containerWidth)  / 2;
  const offsetY = (scaledHeight - containerHeight) / 2;

  return { scale, offsetX, offsetY, scaledWidth, scaledHeight };
}

/**
 * Convert a single normalized bounding box from native video coordinates
 * to CSS pixel coordinates relative to the container element.
 *
 * @param {{ x: number, y: number, w: number, h: number }} normalizedBbox
 *   - All values in [0, 1] relative to native video resolution
 * @param {number} videoNativeWidth   - Native video width in pixels
 * @param {number} videoNativeHeight  - Native video height in pixels
 * @param {number} containerWidth     - Rendered container width in CSS pixels
 * @param {number} containerHeight    - Rendered container height in CSS pixels
 * @returns {{ left: number, top: number, width: number, height: number }}
 *   - CSS pixel values suitable for `position: absolute` children
 */
export function normalizedBboxToCSS(
  normalizedBbox,
  videoNativeWidth,
  videoNativeHeight,
  containerWidth,
  containerHeight
) {
  const { x, y, w, h } = normalizedBbox;

  const { scale, offsetX, offsetY } = computeObjectCoverParams(
    videoNativeWidth,
    videoNativeHeight,
    containerWidth,
    containerHeight
  );

  // Convert normalized coords → native pixel coords
  const nativeX = x * videoNativeWidth;
  const nativeY = y * videoNativeHeight;
  const nativeW = w * videoNativeWidth;
  const nativeH = h * videoNativeHeight;

  // Apply scale and subtract the crop offset
  const left   = nativeX * scale - offsetX;
  const top    = nativeY * scale - offsetY;
  const width  = nativeW * scale;
  const height = nativeH * scale;

  return { left, top, width, height };
}

/**
 * Convert normalized center-point coords to CSS pixel position.
 * Useful for zone mapping and heatmap point placement.
 *
 * @param {number} normCenterX  - Normalized center X [0, 1]
 * @param {number} normCenterY  - Normalized center Y [0, 1]
 * @param {number} videoNativeWidth
 * @param {number} videoNativeHeight
 * @param {number} containerWidth
 * @param {number} containerHeight
 * @returns {{ cssX: number, cssY: number }}
 */
export function normalizedPointToCSS(
  normCenterX,
  normCenterY,
  videoNativeWidth,
  videoNativeHeight,
  containerWidth,
  containerHeight
) {
  const { scale, offsetX, offsetY } = computeObjectCoverParams(
    videoNativeWidth,
    videoNativeHeight,
    containerWidth,
    containerHeight
  );

  const cssX = normCenterX * videoNativeWidth  * scale - offsetX;
  const cssY = normCenterY * videoNativeHeight * scale - offsetY;

  return { cssX, cssY };
}

/**
 * Convert a pixel bounding box from native video coordinates (source pixels)
 * to CSS pixel coordinates relative to the container element.
 *
 * @param {{ x1: number, y1: number, x2: number, y2: number }} bbox
 *   - Bounding box coordinates in native source pixels
 * @param {number} videoNativeWidth   - Native video width in pixels
 * @param {number} videoNativeHeight  - Native video height in pixels
 * @param {number} containerWidth     - Rendered container width in CSS pixels
 * @param {number} containerHeight    - Rendered container height in CSS pixels
 * @returns {{ left: number, top: number, width: number, height: number }}
 *   - CSS pixel values suitable for absolute layout
 */
export function pixelBboxToCSS(
  bbox,
  videoNativeWidth,
  videoNativeHeight,
  containerWidth,
  containerHeight
) {
  const { x1, y1, x2, y2 } = bbox;

  const { scale, offsetX, offsetY } = computeObjectCoverParams(
    videoNativeWidth,
    videoNativeHeight,
    containerWidth,
    containerHeight
  );

  // Convert pixel coords to scale and subtract crop offsets
  const left   = x1 * scale - offsetX;
  const top    = y1 * scale - offsetY;
  const width  = (x2 - x1) * scale;
  const height = (y2 - y1) * scale;

  return { left, top, width, height };
}

