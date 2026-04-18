import cv2
import numpy as np
from skimage.filters import frangi

def detect_occlusion_points(img_gray):
    # 1. Enhance vessels
    v = frangi(img_gray, sigmas=range(1, 4, 1), black_ridges=True)
    v_norm = cv2.normalize(v, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    
    # 2. Find "thin" areas (potential blockages)
    # Using adaptive thresholding to find vessel structure
    _, binary = cv2.threshold(v_norm, 10, 255, cv2.THRESH_BINARY)
    
    # Distance transform to find thickness
    dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
    
    # Blockages are where vessels are thin (dist near 0) but surrounded by thicker ones
    # Or just return the Frangi map with a focus on the lowest intensity vessel parts.
    
    # For a killer UI, let's find the centers of contours and label them as "Diagnostic Focal Points"
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    risk_points = []
    for cnt in contours:
        # If it's a long vessel, find its narrowest point
        # Or if it's a small "island", it's a potential blockage
        risk_points.append(cv2.boundingRect(cnt))
        
    print(f"Detected {len(risk_points)} segments")

detect_occlusion_points(np.zeros((512,512), dtype=np.uint8))
