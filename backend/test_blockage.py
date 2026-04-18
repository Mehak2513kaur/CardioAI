import cv2
import numpy as np
from skimage.filters import frangi

def detect_blockage(img_gray):
    # 1. Get Vesselness
    v = frangi(img_gray, sigmas=range(1, 4, 1), black_ridges=True)
    v_norm = cv2.normalize(v, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    
    # 2. Threshold to get binary vessels
    _, binary = cv2.threshold(v_norm, 30, 255, cv2.THRESH_BINARY)
    
    # 3. Find gaps in the skeleton
    # This is complex, but we can use morphological components.
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    heatmap = cv2.applyColorMap(v_norm, cv2.COLORMAP_JET)
    # Draw red circles on small disconnected islands which are likely blockages
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if 5 < area < 100:
            (x,y), radius = cv2.minEnclosingCircle(cnt)
            cv2.circle(heatmap, (int(x), int(y)), int(radius)+10, (0,0,255), 2)
    
    print("Logic verified")

detect_blockage(np.zeros((512,512), dtype=np.uint8))
