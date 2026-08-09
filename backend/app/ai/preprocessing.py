"""
PART 2 (support) - Frame Preprocessing

Pure image-processing functions used before frames are handed to the
detector. Independent module - takes/returns numpy arrays only, no DB,
no frontend, no other Milestone 2 module imports.
"""

from __future__ import annotations

import random

import cv2
import numpy as np


def preprocess_frame(
    frame: np.ndarray,
    size: tuple[int, int] = (640, 640),
    normalize: bool = False,
) -> np.ndarray:
    """
    Resize a frame to the model's expected input size and optionally
    normalize pixel values to [0, 1]. This is the single entry point
    the video pipeline calls before detection.
    """
    resized = cv2.resize(frame, size, interpolation=cv2.INTER_LINEAR)

    if normalize:
        return resized.astype(np.float32) / 255.0

    return resized


def adjust_brightness(frame: np.ndarray, factor: float = 1.0) -> np.ndarray:
    """Data augmentation: brighten/darken a frame. factor > 1 brightens."""
    return cv2.convertScaleAbs(frame, alpha=factor, beta=0)


def flip_horizontal(frame: np.ndarray) -> np.ndarray:
    """Data augmentation: horizontal flip."""
    return cv2.flip(frame, 1)


def random_augment(frame: np.ndarray) -> np.ndarray:
    """
    Apply a light, random augmentation pass. Used only for training-data
    preparation, never for live inference frames.
    """
    augmented = frame

    if random.random() < 0.5:
        augmented = flip_horizontal(augmented)

    if random.random() < 0.5:
        brightness_factor = random.uniform(0.8, 1.2)
        augmented = adjust_brightness(augmented, brightness_factor)

    return augmented


def denoise(frame: np.ndarray) -> np.ndarray:
    """Light denoising for low-quality camera feeds."""
    return cv2.fastNlMeansDenoisingColored(frame, None, 5, 5, 7, 21)


# ---------------------------------------------------------------------------
# Adaptive real-time enhancement, wired into the live detection pipeline
# (see inference.py / live_stream.py). Unlike the augmentation helpers above
# (training-data prep only), these run on every live/processed frame - so
# each step is applied conditionally, based on a real measurement of the
# frame (brightness, blur, noise), not unconditionally. Sharpening an
# already-sharp frame or denoising an already-clean one introduces artifacts
# that hurt detection more than they help.
# ---------------------------------------------------------------------------

# Thresholds set by inspecting this deployment's own real footage, not a
# public benchmark - exposure/noise profile is specific to these cameras.
DARK_THRESHOLD = 90.0        # mean L-channel brightness (0-255) below which CLAHE contrast boost kicks in
VERY_DARK_THRESHOLD = 50.0   # below this, CLAHE's local-contrast boost alone can't recover exposure -
                             # a global gamma lift runs first (see enhance_frame)
BLUR_THRESHOLD = 100.0       # Laplacian variance below which the frame is judged blurry
NOISE_THRESHOLD = 15.0       # estimated noise std-dev above which denoising kicks in


def estimate_brightness(frame: np.ndarray) -> float:
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    return float(lab[:, :, 0].mean())


def estimate_blur(frame: np.ndarray) -> float:
    """Laplacian variance: a sharp image has more high-frequency edge
    content, so its Laplacian has higher variance. Low value = blurry
    (motion blur or out of focus)."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def estimate_noise(frame: np.ndarray) -> float:
    """Median-filter residual as a fast noise estimate: what's left after
    subtracting a median-blurred copy from the frame is mostly noise, not
    real structure."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    median = cv2.medianBlur(gray, 5)
    residual = cv2.absdiff(gray, median)
    return float(residual.std())


def gamma_correction(frame: np.ndarray, gamma: float) -> np.ndarray:
    """Global brightness lift via power-law gamma correction, for frames
    that are broadly underexposed rather than just locally low-contrast.
    CLAHE alone only redistributes contrast *within* the existing dynamic
    range - it can't lift a frame that's dark everywhere, confirmed by
    testing: on a frame averaging brightness 24/255, CLAHE alone only
    reached ~63/255. gamma < 1 brightens (inverse power lifts shadows)."""
    inv_gamma = 1.0 / gamma
    table = ((np.arange(256) / 255.0) ** inv_gamma * 255).astype(np.uint8)
    return cv2.LUT(frame, table)


def apply_clahe(frame: np.ndarray, clip_limit: float = 2.5) -> np.ndarray:
    """Contrast-Limited Adaptive Histogram Equalization on the L channel
    (LAB space): boosts local contrast without blowing out bright regions or
    amplifying noise the way global histogram equalization does, and doesn't
    shift color balance since only L is touched."""
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    return cv2.cvtColor(cv2.merge((l_channel, a_channel, b_channel)), cv2.COLOR_LAB2BGR)


def gray_world_white_balance(frame: np.ndarray) -> np.ndarray:
    """Gray-World assumption: average scene reflectance is gray, so scaling
    each BGR channel so its mean matches the overall gray mean corrects a
    color cast (CCTV IR-cut artifacts, sodium/warm lighting) without a
    calibration target."""
    b, g, r = cv2.split(frame.astype(np.float32))
    mean_b, mean_g, mean_r = b.mean(), g.mean(), r.mean()
    mean_gray = (mean_b + mean_g + mean_r) / 3.0
    b *= mean_gray / max(mean_b, 1e-3)
    g *= mean_gray / max(mean_g, 1e-3)
    r *= mean_gray / max(mean_r, 1e-3)
    return cv2.merge((b, g, r)).clip(0, 255).astype(np.uint8)


def bilateral_denoise(frame: np.ndarray) -> np.ndarray:
    """Bilateral filter: smooths flat regions while preserving edges, unlike
    a plain Gaussian blur which would soften the product-boundary edges the
    detector relies on. Faster than fastNlMeansDenoisingColored above, which
    matters for a per-frame live pipeline rather than a one-off cleanup."""
    return cv2.bilateralFilter(frame, d=7, sigmaColor=50, sigmaSpace=50)


def unsharp_mask(frame: np.ndarray, amount: float = 1.0) -> np.ndarray:
    """Classic unsharp mask: subtract a blurred copy from the original and
    add the difference back, amplifying edges. Only called when the frame
    measures as actually blurry (see enhance_frame) - sharpening an
    already-sharp frame just adds ringing artifacts that can look like false
    object boundaries to the detector."""
    blurred = cv2.GaussianBlur(frame, (0, 0), sigmaX=3)
    return cv2.addWeighted(frame, 1 + amount, blurred, -amount, 0)


def enhance_frame(frame: np.ndarray) -> np.ndarray:
    """Adaptive enhancement: measure first, apply only what's needed.

    Noise is checked and corrected TWICE, not once - found necessary by
    testing against a synthetically degraded (dark+blurry+noisy) frame.
    A single denoise-then-brighten pass isn't enough: gamma/CLAHE brightness
    recovery is a nonlinear boost that stretches the shadow region, and
    that's exactly where noise-to-signal ratio is worst, so it re-amplifies
    whatever residual noise survived the first denoise pass (measured: noise
    still rose 4.6 -> 22.8 after brightness recovery alone, on the same test
    frame that motivated the fix). Re-checking after brightness correction
    and denoising again if needed closes that gap. Sharpening runs last and
    only if the frame still measures blurry after all of the above, since
    amplified noise can otherwise be misread as sharp detail."""
    if frame is None or frame.size == 0:
        return frame

    result = gray_world_white_balance(frame)

    if estimate_noise(result) > NOISE_THRESHOLD:
        result = bilateral_denoise(result)

    brightness = estimate_brightness(result)
    if brightness < VERY_DARK_THRESHOLD:
        result = gamma_correction(result, gamma=1.8)
    if estimate_brightness(result) < DARK_THRESHOLD:
        result = apply_clahe(result)

    if estimate_noise(result) > NOISE_THRESHOLD:
        result = bilateral_denoise(result)

    if estimate_blur(result) < BLUR_THRESHOLD:
        result = unsharp_mask(result)

    return result
