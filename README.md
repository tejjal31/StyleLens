# StyleLens — AI Personal Stylist & Virtual Wardrobe

A full-stack web app that lets users photograph their clothes, have them tagged
automatically with computer vision, and get AI-styled outfits for any occasion.

## Features
- **Google sign-in** (Supabase Auth)
- **Virtual wardrobe** – private photo uploads, My Closet, Favorites, Recently Added
- **Computer vision tagging** – each photo is sent to a vision model that returns
  name, category, colour, style, season and pairing notes
- **AI outfit generator** – builds looks only from your own clothes, using live weather,
  your favourites and past saved looks for personalisation
- **Shop new looks** – AI turns a wish into product searches and fetches real products

## Tech stack
React 19, TanStack Start (SSR + server functions), Tailwind CSS v4, Supabase
(Postgres, Auth, Storage), OpenAI-compatible vision model, Open-Meteo weather API.

## Where the computer vision code is
| File | What it does |
|---|---|
| `src/lib/style.functions.ts` → `analyzeItem` | Downloads the photo, encodes it, asks the vision model to tag it, saves tags |
| `src/lib/ai.server.ts` | Connection to the AI model with structured JSON output |
| `src/lib/style.functions.ts` → `generateOutfits` | Outfit reasoning over the tagged wardrobe |
| `src/lib/shop.server.ts` | Real product search |

## Run it
1. Install Node.js 20+, then: `npm install`
2. Create a Supabase project, run `database/schema.sql` in its SQL editor,
   and enable the Google provider under Authentication.
3. Copy `.env.example` to `.env` and fill in your keys.
4. `npm run dev` and open http://localhost:8080

## Computer Vision (Python)

The `computer_vision/` folder contains the OpenCV pipeline: GrabCut garment segmentation,
contour/shape analysis, K-Means dominant-colour extraction, HSV colour naming and histogram
colour matching. See `computer_vision/README.md` to run it.
