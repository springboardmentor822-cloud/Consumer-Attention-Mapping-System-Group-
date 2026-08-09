# Detection model comparison — grounded in this project's real constraints

This compares the five requested models against what this project actually has available,
not against an idealized setup. Two hard constraints rule most of the list out immediately:

1. **No per-SKU labeled training data.** The one closed-set "product" model fine-tuned
   earlier this project (on a COCO + RPC + SKU110k mix) scored effectively 0% on real
   store footage — a confirmed train/test domain gap (studio product photos vs. real CCTV
   angles/lighting), not a bug. Any closed-set model (fixed class list, needs its own
   training run) hits the same wall without genuinely new labeled data from this store's
   own cameras.
2. **CPU-only inference.** No GPU is configured anywhere in this deployment. Every number
   below was measured on this machine's CPU.

## The five candidates

| Model | Type | Verdict |
|---|---|---|
| **YOLOv11** | Closed-set (Ultralytics) | Needs a trained class list — same domain-gap risk as the model already abandoned. Not viable without real labeled data collection. |
| **YOLOv10** | Closed-set (Ultralytics) | Same as YOLOv11 — NMS-free variant, marginal difference for this project's problem. Not viable without labeled data. |
| **RT-DETR** | Closed-set (transformer) | Also needs a trained class list. Heavier than YOLO on CPU (transformer decoder), no zero-shot capability out of the box. Not viable here. |
| **EfficientDet** | Closed-set (2019 architecture) | Same data problem, and generally outperformed by modern YOLO variants on both speed and accuracy at comparable size. Weakest pick regardless. |
| **Grounding DINO** | Open-vocabulary (transformer) | The only other real zero-shot option. Generally stronger on complex referring-expression detection, but multi-second-per-frame on CPU in practice — moving *away* from the 20-30fps goal, not toward it. |

**The real fork isn't between these five — it's between the two genuinely zero-shot
options**, because zero-shot is a hard requirement given the data situation:
YOLO-World (already in use) vs. Grounding DINO. Grounding DINO's accuracy edge doesn't
matter if it makes the CPU pipeline an order of magnitude slower; it was ruled out for
that reason before any test was needed.

## A real third option I found and tested: YOLOE-26

While checking this environment's `ultralytics` install for the YOLO26 person-detector
swap done earlier, I found `yoloe-26.yaml`/`yoloe-26-seg.yaml` — Ultralytics' newer
open-vocabulary detector (successor line to YOLO-World, built on the YOLO26 backbone).
I downloaded the real pretrained checkpoint (`yoloe-26s-seg.pt`, plus its 242MB MobileCLIP
text encoder) and ran it head-to-head against the current `yolov8s-world.pt`, same class
vocabulary, same real footage:

| Frame | YOLO-World (current) | YOLOE-26s-seg (candidate) |
|---|---|---|
| Grocery Section.mp4, frame 0 (1280x720) | 10 detections, 0.873s, top confidence 0.32 | 6 detections, 0.577s (34% faster), top confidence 0.45 |
| Beverage Section.mp4, frame 0 (3840x2160) | 14 detections, 0.711s | 33 detections, 0.827s |

**Honest read of this**: mixed, not a slam dunk. On the smaller frame, YOLOE-26 was
faster and more confident but found fewer boxes. On the large 4K frame, it found far
more. Two frames isn't enough to declare a winner — but it's also not nothing: YOLOE-26
genuinely produces **segmentation masks**, not just boxes (confirmed: `masks is not None`
on real output), which the current box-only YOLO-World cannot do. That matters directly
for Section 7 of the request (shelf *boundaries*, not just shelf *boxes*) — a mask traces
the actual shelf outline instead of a rectangle around it.

## Recommendation

**Keep YOLO-World as the default for now; stand up YOLOE-26 as an A/B candidate, not a
replacement.** Concretely:
- Don't rip out the current model on a 2-frame test — that would repeat the exact mistake
  of trusting too little evidence that burned the earlier fine-tuned "product" model.
- Do add YOLOE-26 as a selectable second backend behind the same `detect_products_and_shelves()`
  interface (see the preprocessing/tracking work below, which is backend-agnostic either way),
  and run both across a real multi-video sample before deciding.
- The segmentation-mask capability is worth pursuing specifically for shelf-boundary
  detection regardless of which model wins the box-detection comparison — that's a real,
  new capability, not a speed/accuracy tradeoff.

## What's flatly not available, and why I'm not faking it

- **mAP@50, mAP@50:95, Precision, Recall, F1, Confusion Matrix**: these require a labeled
  ground-truth evaluation set (real bounding boxes on real held-out footage). None exists
  for this store's products. Any numbers here would be invented.
- **TensorRT, GPU inference, FP16**: no NVIDIA GPU is present in this environment. FP16 on
  CPU is typically neutral-to-slower, not faster, since most CPUs lack native FP16 execution
  units - configuring it here would be cargo-cult, not optimization.
- **Per-SKU "Product Name / SKU / Category" from the detector itself**: not buildable
  without per-SKU labeled training data. This information already exists for real in this
  system - not from computer vision, but from the `Product`/`Shelf` database records
  (manually entered), joined against a shelf's camera to attribute a detection to a shelf.
  That's the correct source of truth here, not a fabrication target for the CV model.
