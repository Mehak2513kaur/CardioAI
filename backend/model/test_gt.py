# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import os, numpy as np, cv2, joblib, json
from skimage.feature import graycomatrix, graycoprops
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "archive (6)", "Database_134_Angiograms")

# EXPERIMENT: USE GT MASK FOR FEATURES TO CHECK SEPARABILITY
def extract_gt_features(image_paths, mask_paths):
    features = []
    for i in range(len(image_paths)):
        img = cv2.imread(image_paths[i], 0)
        mask = cv2.imread(mask_paths[i], 0)
        img = cv2.resize(img, (512, 512))
        mask = cv2.resize(mask, (512, 512))
        
        area = int(np.sum(mask > 0))
        glcm = graycomatrix(img, [1], [0], 256, symmetric=True, normed=True)
        contrast = float(graycoprops(glcm, 'contrast')[0, 0])
        
        edges = cv2.Canny(mask, 100, 200)
        continuity = int(np.sum(edges))
        features.append([area, contrast, continuity])
    return np.array(features)

image_paths, mask_paths = [], []
for f in sorted(os.listdir(DATASET_PATH)):
    if f.endswith(".pgm") and "_gt" not in f:
        gt = f.replace(".pgm", "_gt.pgm")
        if os.path.exists(os.path.join(DATASET_PATH, gt)):
            image_paths.append(os.path.join(DATASET_PATH, f))
            mask_paths.append(os.path.join(DATASET_PATH, gt))

raw = extract_gt_features(image_paths, mask_paths)
cont = raw[:, -1]
y = (cont < np.median(cont)).astype(int)
X = raw[:, :-1]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
print(f"GT Accuracy: {rf.score(X_test, y_test):.4f}")
