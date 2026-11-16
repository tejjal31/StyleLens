"""Garment segmentation: separate the clothing item from the photo background.

Algorithms used:
  * GrabCut (graph-cut energy minimisation over a Gaussian Mixture colour model)
  * Morphological opening/closing to clean the mask
  * Contour detection to find the garment outline and bounding box
"""
from __future__ import annotations

import cv2
import numpy as np


def load_image(path: str, max_side: int = 600) -> np.ndarray:
    """Read an image (BGR) and resize so the longest side is `max_side` pixels."""
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    h, w = img.shape[:2]
    scale = max_side / max(h, w)
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def segment_garment(img: np.ndarray, iterations: int = 5) -> np.ndarray:
    """Return a binary mask (255 = garment, 0 = background) using GrabCut.

    We assume the garment is roughly centred, so a rectangle with a 5% margin
    is used to initialise the foreground / background models.
    """
    h, w = img.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    rect = (int(w * 0.05), int(h * 0.05), int(w * 0.90), int(h * 0.90))
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, rect, bgd_model, fgd_model, iterations, cv2.GC_INIT_WITH_RECT)

    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, kernel, iterations=2)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=2)
    return fg


def largest_contour(mask: np.ndarray):
    """Find the biggest outline in the mask and return (contour, bounding_box)."""
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None, None
    c = max(contours, key=cv2.contourArea)
    return c, cv2.boundingRect(c)


def shape_features(contour, img_shape) -> dict:
    """Simple shape descriptors that hint at garment type."""
    x, y, w, h = cv2.boundingRect(contour)
    area = cv2.contourArea(contour)
    hull_area = cv2.contourArea(cv2.convexHull(contour)) or 1
    return {
        "aspect_ratio": round(h / max(w, 1), 2),   # tall (dress) vs wide (top)
        "solidity": round(area / hull_area, 2),     # low = sleeves / straps
        "coverage": round(area / (img_shape[0] * img_shape[1]), 2),
    }


def guess_category(features: dict) -> str:
    """Rule-based category guess from shape (a classical CV heuristic)."""
    ar, sol = features["aspect_ratio"], features["solidity"]
    if ar > 1.6:
        return "dress / long garment"
    if ar < 0.8:
        return "bottom or shoes (wide shape)"
    if sol < 0.8:
        return "top with sleeves"
    return "top / outerwear"
