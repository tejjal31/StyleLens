"""Colour analysis of a segmented garment.

Algorithms used:
  * K-Means clustering (cv2.kmeans) on garment pixels -> dominant colours
  * HSV colour-space rules -> human colour names ("maroon", "blush pink" ...)
  * 3-D HSV histograms + correlation -> similarity between two garments
"""
from __future__ import annotations

import cv2
import numpy as np


def dominant_colors(img: np.ndarray, mask: np.ndarray, k: int = 3) -> list[dict]:
    """Return the k dominant colours of the masked pixels, sorted by share."""
    pixels = img[mask > 0].reshape(-1, 3).astype(np.float32)
    if len(pixels) < k:
        pixels = img.reshape(-1, 3).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.flatten(), minlength=k)
    result = []
    for i in np.argsort(-counts):
        b, g, r = (int(v) for v in centers[i])
        result.append({
            "rgb": (r, g, b),
            "hex": f"#{r:02x}{g:02x}{b:02x}",
            "name": name_color((b, g, r)),
            "share": round(float(counts[i] / counts.sum()), 3),
        })
    return result


def name_color(bgr) -> str:
    """Map a BGR colour to a fashion colour name using HSV thresholds."""
    h, s, v = cv2.cvtColor(np.uint8([[bgr]]), cv2.COLOR_BGR2HSV)[0][0]
    h = int(h) * 2  # OpenCV hue is 0-179 -> convert to degrees
    s, v = int(s) / 255, int(v) / 255
    if v < 0.18:
        return "black"
    if s < 0.15:
        return "white" if v > 0.85 else "cream" if v > 0.7 else "grey"
    if s < 0.35 and v > 0.7 and (h < 50 or h > 330):
        return "blush pink" if h > 300 or h < 15 else "beige"
    if h < 15 or h >= 345:
        return "maroon" if v < 0.5 else "red"
    if h < 40:
        return "brown" if v < 0.55 else "orange"
    if h < 70:
        return "mustard" if v < 0.7 else "yellow"
    if h < 165:
        return "olive" if v < 0.5 else "green"
    if h < 200:
        return "teal"
    if h < 255:
        return "navy" if v < 0.45 else "blue"
    if h < 290:
        return "purple"
    return "wine" if v < 0.5 else "pink"


def hsv_histogram(img: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Normalised 3-D HSV histogram of the garment pixels."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1, 2], mask, [18, 8, 8], [0, 180, 0, 256, 0, 256])
    return cv2.normalize(hist, hist).flatten()


def color_similarity(hist_a: np.ndarray, hist_b: np.ndarray) -> float:
    """Correlation between two histograms (1.0 = identical colours)."""
    return float(cv2.compareHist(hist_a, hist_b, cv2.HISTCMP_CORREL))
