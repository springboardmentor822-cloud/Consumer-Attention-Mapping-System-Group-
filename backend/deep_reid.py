"""
deep_reid.py — Deep-learning appearance embeddings for cross-camera Re-ID.

Replaces the old HSV color-histogram proxy in main.py's
extract_appearance_feature() with a CNN embedding, which is far less
sensitive to lighting shifts between cameras (histograms conflate "same
person under different lighting" with "different person," since raw color
distribution changes a lot with illumination; learned CNN features are
trained to be more invariant to exactly that).

Three-tier fallback chain, tried in order:

  1. OSNet (via torchreid) — an actual person-Re-ID architecture, not a
     generic classifier. `pip install torchreid` to enable.
  2. MobileNetV3-Small — generic ImageNet-pretrained CNN features. Enabled
     by the much lighter `pip install torch torchvision`.
  3. HSV color histogram — the original proxy, zero extra dependencies.

Be precise about what tier 1 actually gets you, though: torchreid's
FeatureExtractor, called with no model_path, only downloads OSNet's
ImageNet-pretrained backbone weights (from torchreid's own Google-Drive-
hosted URLs — not always reliable to auto-download, and not the same thing
as a person-Re-ID-*finetuned* checkpoint). OSNet's architecture is still
purpose-built for this task even at that tier, but the real accuracy jump
comes from a checkpoint actually fine-tuned on a Re-ID dataset (e.g.
Market1501). If you have one, point OSNET_MODEL_PATH at it. Without one,
tier 1 is a real upgrade over tier 2 (better architecture for this specific
problem) but not the full "meaningfully more accurate" claim a finetuned
checkpoint would earn — that distinction is worth keeping honest rather
than implying a finetuned-level result you haven't actually verified.

Each tier falls through to the next on import failure OR runtime failure
(e.g. the OSNet weight download failing partway), so a flaky Google Drive
download degrades this to tier 2 or 3 rather than crashing the pipeline.
"""
import os
import threading
from typing import Optional

import cv2
import numpy as np

EMBEDDING_DIM_OSNET = 512     # torchreid osnet_x1_0's feature width
EMBEDDING_DIM_MOBILENET = 576  # MobileNetV3-Small's pre-classifier feature width
_INPUT_SIZE = (128, 256)      # (width, height) — standard person-Re-ID aspect ratio

# Cosine-similarity threshold for find_global_identity(). Deep embeddings
# occupy a different similarity range than raw histograms — 0.85 (tuned for
# HSV histograms) is too strict here and will mint a new global ID for nearly
# every detection. Start around 0.6-0.7 and tune against your own footage;
# there's no universal correct value, it trades off false-merges (different
# people called the same person) against false-splits (same person tracked
# as multiple people). Applies to both the OSNet and MobileNet tiers — it
# has NOT been separately tuned per-tier, since neither has been validated
# against real multi-camera footage yet.
RECOMMENDED_MATCH_THRESHOLD = 0.65

_active_tier = None  # set on first successful embed, for logging/introspection only


# ---------------------------------------------------------------------------
# Tier 1: OSNet via torchreid
# ---------------------------------------------------------------------------
_TORCHREID_AVAILABLE = True
try:
    import torch
    from torchreid.utils import FeatureExtractor
except ImportError:
    _TORCHREID_AVAILABLE = False


class _OSNetEmbedder:
    _instance = None
    _unavailable = False
    _instance_lock = threading.Lock()

    def __init__(self):
        model_path = os.getenv("OSNET_MODEL_PATH", "")
        if model_path and not os.path.isfile(model_path):
            raise FileNotFoundError(f"OSNET_MODEL_PATH is set but not found: {model_path}")
        if not model_path:
            print(
                "ℹ️ OSNET_MODEL_PATH not set — torchreid will use OSNet's "
                "ImageNet-pretrained backbone only, not a Re-ID-finetuned "
                "checkpoint. See deep_reid.py's module docstring for what "
                "that does and doesn't get you."
            )
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.extractor = FeatureExtractor(
            model_name="osnet_x1_0",
            model_path=model_path,
            device=device,
            verbose=False,
        )
        self.inference_lock = threading.Lock()

    @classmethod
    def instance(cls):
        if cls._unavailable:
            return None
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None and not cls._unavailable:
                    try:
                        cls._instance = cls()
                    except Exception as e:
                        print(f"⚠️ OSNet (torchreid) unavailable ({e}) — falling back to MobileNet tier.")
                        cls._unavailable = True
                        return None
        return cls._instance

    def embed(self, crop_bgr: np.ndarray) -> np.ndarray:
        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        with self.inference_lock:
            features = self.extractor(crop_rgb)  # accepts an (H, W, C) ndarray directly
        vec = features.squeeze(0).cpu().numpy()
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 1e-10 else vec


# ---------------------------------------------------------------------------
# Tier 2: generic MobileNetV3-Small (ImageNet features)
# ---------------------------------------------------------------------------
_TORCH_AVAILABLE = True
try:
    import torch.nn as nn
    import torchvision.transforms as T
    from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small
except ImportError:
    _TORCH_AVAILABLE = False


class _MobileNetEmbedder:
    _instance = None
    _unavailable = False
    _instance_lock = threading.Lock()

    def __init__(self):
        weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
        backbone = mobilenet_v3_small(weights=weights)
        self.model = nn.Sequential(backbone.features, backbone.avgpool, nn.Flatten())
        self.model.eval()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.transform = T.Compose([
            T.ToPILImage(),
            T.Resize(_INPUT_SIZE[::-1]),  # T.Resize takes (h, w)
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        self.inference_lock = threading.Lock()

    @classmethod
    def instance(cls):
        if cls._unavailable:
            return None
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None and not cls._unavailable:
                    try:
                        cls._instance = cls()
                    except Exception as e:
                        print(f"⚠️ MobileNet embedder unavailable ({e}) — falling back to HSV histogram.")
                        cls._unavailable = True
                        return None
        return cls._instance

    def embed(self, crop_bgr: np.ndarray) -> np.ndarray:
        crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        tensor = self.transform(crop_rgb).unsqueeze(0).to(self.device)
        with self.inference_lock, torch.no_grad():
            features = self.model(tensor)
        vec = features.squeeze(0).cpu().numpy()
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 1e-10 else vec


# ---------------------------------------------------------------------------
# Tier 3: HSV color histogram (original proxy, always available)
# ---------------------------------------------------------------------------
def _extract_hsv_histogram_fallback(crop: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [8, 8], [0, 180, 0, 256])
    cv2.normalize(hist, hist)
    return hist.flatten()


# ---------------------------------------------------------------------------
def extract_feature(frame: np.ndarray, x1, y1, x2, y2) -> Optional[np.ndarray]:
    """Drop-in replacement for the old extract_appearance_feature(). Same
    signature and same None-on-empty-crop contract, so main.py only needs to
    swap which function it calls, not how it calls it.

    Tries OSNet, then MobileNet, then the HSV histogram — each tier's
    availability is checked once (import + first successful init) and
    cached, so this isn't re-attempting a failed tier on every call."""
    global _active_tier
    crop = frame[max(0, int(y1)):int(y2), max(0, int(x1)):int(x2)]
    if crop.size == 0:
        return None

    if _TORCHREID_AVAILABLE:
        osnet = _OSNetEmbedder.instance()
        if osnet is not None:
            try:
                vec = osnet.embed(crop)
                _active_tier = "osnet"
                return vec
            except Exception as e:
                # Sticky, not per-call: if we let this fall through just for
                # this one detection, later calls would keep succeeding on
                # OSNet's 512-dim vectors while this one call's fallback
                # writes a 576-dim MobileNet vector into the SAME
                # GLOBAL_PROFILES dict. find_global_identity()'s np.dot()
                # between mismatched-length vectors then raises ValueError —
                # which main.py's stream loop swallows silently, so tracking
                # quietly breaks for that profile with no visible cause.
                # Failing this tier permanently keeps every embedding in
                # GLOBAL_PROFILES the same dimension for the life of the process.
                print(f"⚠️ OSNet embedding failed at runtime ({e}) — disabling OSNet tier for the rest of this run, falling back to MobileNet.")
                _OSNetEmbedder._unavailable = True

    if _TORCH_AVAILABLE:
        mobilenet = _MobileNetEmbedder.instance()
        if mobilenet is not None:
            try:
                vec = mobilenet.embed(crop)
                _active_tier = "mobilenet"
                return vec
            except Exception as e:
                print(f"⚠️ MobileNet embedding failed at runtime ({e}) — disabling MobileNet tier for the rest of this run, falling back to HSV histogram.")
                _MobileNetEmbedder._unavailable = True

    _active_tier = "hsv_histogram"
    return _extract_hsv_histogram_fallback(crop)
