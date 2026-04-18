# -*- coding: utf-8 -*-
import os, numpy as np, cv2
from skimage.feature import graycomatrix, graycoprops

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "archive (6)", "Database_134_Angiograms")

def check_correlation():
    image_paths, mask_paths = [], []
    for f in sorted(os.listdir(DATASET_PATH)):
        if f.endswith(".pgm") and "_gt" not in f:
            gt = f.replace(".pgm", "_gt.pgm")
            if os.path.exists(os.path.join(DATASET_PATH, gt)):
                image_paths.append(os.path.join(DATASET_PATH, f))
                mask_paths.append(os.path.join(DATASET_PATH, gt))

    results = []
    for i in range(len(image_paths)):
        mask = cv2.imread(mask_paths[i], 0)
        edges = cv2.Canny(mask, 100, 200)
        continuity = np.sum(edges)
        area = np.sum(mask > 0)
        results.append((area, continuity))
    
    results = np.array(results)
    corr = np.corrcoef(results[:, 0], results[:, 1])[0, 1]
    print(f"Correlation (Area vs Continuity): {corr:.4f}")

if __name__ == "__main__":
    check_correlation()
