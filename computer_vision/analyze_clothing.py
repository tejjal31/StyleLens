"""StyleLens computer-vision demo.

Usage:
    python analyze_clothing.py photo.jpg                # analyse one garment
    python analyze_clothing.py a.jpg --compare b.jpg     # colour match two garments

Outputs JSON tags and saves <photo>_cv_result.png showing the mask,
outline and colour palette.
"""
from __future__ import annotations

import argparse
import json
import os

import cv2
import numpy as np

from .color_analysis import color_similarity, dominant_colors, hsv_histogram
from .segmentation import (
    guess_category,
    largest_contour,
    load_image,
    segment_garment,
    shape_features,
)

def analyze(path: str) -> tuple[dict, np.ndarray, np.ndarray]:
    img = load_image(path)
    mask = segment_garment(img)
    contour, box = largest_contour(mask)
    colors = dominant_colors(img, mask, k=3)
    result = {"file": os.path.basename(path), "colors": colors}
    if contour is not None:
        feats = shape_features(contour, img.shape)
        result.update({"bounding_box": box, "shape": feats, "category_guess": guess_category(feats)})
    return result, img, mask


def save_visual(path: str, img: np.ndarray, mask: np.ndarray, result: dict) -> str:
    cut = cv2.bitwise_and(img, img, mask=mask)
    outline = img.copy()
    contour, _ = largest_contour(mask)
    if contour is not None:
        cv2.drawContours(outline, [contour], -1, (90, 60, 255), 3)
        x, y, w, h = result["bounding_box"]
        cv2.rectangle(outline, (x, y), (x + w, y + h), (0, 200, 0), 2)
    h = img.shape[0]
    palette = np.zeros((h, 80, 3), np.uint8)
    y = 0
    for c in result["colors"]:
        hh = int(c["share"] * h)
        r, g, b = c["rgb"]
        palette[y:y + hh] = (b, g, r)
        y += hh
    panel = np.hstack([outline, cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR), cut, palette])
    out = os.path.splitext(path)[0] + "_cv_result.png"
    cv2.imwrite(out, panel)
    return out


def main() -> None:
    p = argparse.ArgumentParser(description="StyleLens garment computer vision")
    p.add_argument("image")
    p.add_argument("--compare", help="second garment photo for colour matching")
    args = p.parse_args()

    result, img, mask = analyze(args.image)
    result["visual"] = save_visual(args.image, img, mask, result)

    if args.compare:
        r2, img2, mask2 = analyze(args.compare)
        score = color_similarity(hsv_histogram(img, mask), hsv_histogram(img2, mask2))
        result["compare_with"] = r2["file"]
        result["color_similarity"] = round(score, 3)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
