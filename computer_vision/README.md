# StyleLens – Computer Vision Module (Python + OpenCV)

This folder contains the classical computer-vision pipeline used to analyse clothing photos.

| File | What it does |
|---|---|
| `segmentation.py` | **GrabCut** segmentation removes the background; morphology cleans the mask; **contour detection** finds the garment outline, bounding box and shape features (aspect ratio, solidity) used for a category guess. |
| `color_analysis.py` | **K-Means clustering** finds the 3 dominant colours; **HSV rules** name them (maroon, blush pink, navy…); **HSV histograms** compare two garments' colours. |
| `analyze_clothing.py` | Command-line demo that runs the full pipeline and saves a result image. |

## Run it

```bash
cd computer_vision
pip install -r requirements.txt
python analyze_clothing.py sample_dress.jpg
python analyze_clothing.py shirt.jpg --compare skirt.jpg
```

Output: JSON tags (colours, category guess, shape) plus `<photo>_cv_result.png` showing
original + outline | mask | cut-out garment | colour palette.

## How it fits the app

1. The user uploads a photo in **My Closet**.
2. CV extracts the garment, its colours and shape.
3. The web app (`src/lib/style.functions.ts → analyzeItem`) also sends the photo to a vision AI model for style words; these tags are saved to the wardrobe and used by the AI stylist to build outfits.
