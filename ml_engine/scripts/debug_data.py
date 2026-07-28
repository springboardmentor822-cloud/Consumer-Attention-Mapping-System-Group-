import numpy as np
import os

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../dataset/crowd count'))
images_path = os.path.join(base_dir, 'images.npy')
labels_path = os.path.join(base_dir, 'labels.npy')

print("--- Diagnostics for Crowd Count dataset ---")

if os.path.exists(images_path):
    try:
        imgs = np.load(images_path, allow_pickle=True)
        print("Images NPY:")
        print("Array Shape:", imgs.shape)
        print("Array Dtype:", imgs.dtype)
        if len(imgs) > 0:
            print("First element type:", type(imgs[0]))
            if isinstance(imgs[0], np.ndarray):
                print("First element shape:", imgs[0].shape)
            elif hasattr(imgs[0], 'shape'):
                print("First element shape:", imgs[0].shape)
            else:
                print("First element:", imgs[0])
    except Exception as e:
        print("Failed to load images.npy:", e)
else:
    print(f"images.npy not found at {images_path}")

if os.path.exists(labels_path):
    try:
        lbls = np.load(labels_path, allow_pickle=True)
        print("\nLabels NPY:")
        print("Array Shape:", lbls.shape)
        print("Array Dtype:", lbls.dtype)
        if len(lbls) > 0:
            print("First element type:", type(lbls[0]))
            if hasattr(lbls[0], 'shape'):
                print("First element shape:", lbls[0].shape)
            else:
                print("First element:", lbls[0])
    except Exception as e:
        print("Failed to load labels.npy:", e)
else:
    print(f"\nlabels.npy not found at {labels_path}")
