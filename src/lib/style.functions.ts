import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiJson } from "./ai.server";
import { searchCatalog, type ShopProduct } from "./shop.server";

export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "ethnic", "shoes", "bag", "accessory", "jewelry", "other"] as const;

/** Look at an uploaded clothing photo and auto-tag it. */
export const analyzeItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: item, error } = await supabase.from("wardrobe_items").select("*").eq("id", data.id).single();
    if (error || !item) throw new Error("Item not found");
    const { data: blob, error: dlErr } = await supabase.storage.from("wardrobe").download(item.image_path);
    if (dlErr || !blob) throw new Error("Could not read the photo");
    const b64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
    const mime = blob.type || "image/jpeg";

    const formData = new FormData();
    formData.append("file", blob, "wardrobe-image.jpg");

    const cvApiUrl = process.env["CV_API_URL"]?.replace(/\/+$/, "");

    if (!cvApiUrl) {
      throw new Error("CV_API_URL is not configured");
    }

    const cvResponse = await fetch(`${cvApiUrl}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!cvResponse.ok) {
      const errorText = await cvResponse.text();
      console.error("CV ERROR:", cvResponse.status, errorText);
      throw new Error(`CV Error ${cvResponse.status}: ${errorText}`);
    }

    const cvResult = await cvResponse.json();
    console.log("Computer Vision Result:", cvResult);

    const tags = await aiJson<{ name: string; category: string; color: string; style: string; season: string; notes: string }>(
      "You are a fashion cataloguer. Describe the single main garment or accessory in the photo precisely.",
      [
        { type: "input_text", text: "Tag this clothing item for a digital wardrobe. name: short evocative name (e.g. 'Burgundy satin slip dress'). color: main colour(s) in plain words. style: 2-4 style words (e.g. 'romantic, evening, minimal'). season: seasons/weather it suits. notes: fabric, fit, and what it pairs well with, one sentence." },
        { type: "input_image", image_url: `data:${mime};base64,${b64}`, detail: "low" },
      ],
      "wardrobe_tags",
      {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "color", "style", "season", "notes"],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: [...CATEGORIES] },
          color: { type: "string" },
          style: { type: "string" },
          season: { type: "string" },
          notes: { type: "string" },
        },
      },
    );
    const { data: updated, error: upErr } = await supabase
      .from("wardrobe_items")
      .update(tags)
      .eq("id", data.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);
    return updated;
  });

export type GeneratedLook = {
  title: string;
  vibe: string;
  item_ids: string[];
  reasoning: string;
  styling_tips: string;
  missing_piece: string;
};

/** Build outfits from the user's own wardrobe for a free-text request. */
export const generateOutfits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ prompt: z.string().trim().min(3).max(800), lat: z.number().optional(), lon: z.number().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: items }, { data: looks }] = await Promise.all([
      supabase.from("wardrobe_items").select("id,name,category,color,style,season,notes,is_favorite").limit(300),
      supabase.from("saved_looks").select("title,prompt").order("created_at", { ascending: false }).limit(10),
    ]);
    if (!items || items.length === 0) throw new Error("Your closet is empty — add a few pieces first.");

    let weather = "Unknown (infer from the request if mentioned).";
    if (data.lat !== undefined && data.lon !== undefined) {
      try {
        const w = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m`,
        ).then((r) => r.json() as Promise<{ current?: { temperature_2m: number; precipitation: number; wind_speed_10m: number } }>);
        if (w.current) weather = `${w.current.temperature_2m}°C, precipitation ${w.current.precipitation}mm, wind ${w.current.wind_speed_10m} km/h at the user's location right now.`;
      } catch {
        /* weather is optional */
      }
    }

    const favs = items.filter((i) => i.is_favorite).map((i) => i.name);
    const result = await aiJson<{ looks: GeneratedLook[] }>(

      "You are StyleLens, a warm, expert personal stylist. Return a JSON object with a single key named looks. looks must be an array containing 1 to 3 outfit objects. Every outfit object MUST contain exactly these six fields: title (string), vibe (string), item_ids (array of exact wardrobe item ID strings), reasoning (string), styling_tips (string), and missing_piece (string). Use the exact IDs from the provided wardrobe JSON. Never use fields named name, items, or reason. Never invent wardrobe IDs. Build outfits only from available wardrobe items. Prefer complete combinations such as top plus bottom, or a dress, with shoes and accessories when available. If something essential is missing, describe it in missing_piece; otherwise use an empty string. Return only valid JSON, with no markdown or extra text.",

      [
        {
          type: "input_text",
          text: `REQUEST: ${data.prompt}\n\nWEATHER: ${weather}\n\nFAVOURITE PIECES: ${favs.join(", ") || "none yet"}\nPAST SAVED LOOKS: ${(looks ?? []).map((l) => `${l.title} (${l.prompt})`).join("; ") || "none yet"}\n\nWARDROBE (JSON):\n${JSON.stringify(items.map(({ is_favorite, ...rest }) => rest))}\n\nReturn 1-3 distinct looks.`,
        },
      ],
      "outfits",
      {
        type: "object",
        additionalProperties: false,
        required: ["looks"],
        properties: {
          looks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["title", "vibe", "item_ids", "reasoning", "styling_tips", "missing_piece"],
              properties: {
                title: { type: "string" },
                vibe: { type: "string" },
                item_ids: { type: "array", items: { type: "string" } },
                reasoning: { type: "string" },
                styling_tips: { type: "string" },
                missing_piece: { type: "string" },
              },
            },
          },
        },
      },
    );
    const valid = new Set(items.map((i) => i.id));
    if (!result || !Array.isArray(result.looks)) {
      console.error("Invalid outfit response from AI:", result);
      throw new Error("AI returned an invalid outfit format. Please try again.");
    }
    return {
      weather,
      looks: result.looks
        .filter((l) => l && Array.isArray(l.item_ids))
        .map((l) => ({
          ...l,
          item_ids: [...new Set(l.item_ids)].filter(
            (id) => typeof id === "string" && valid.has(id)
          ),
        }))
        .filter((l) => l.item_ids.length > 0),
    };
  });

/** Turn a shopping wish into product searches and fetch real products. */
export const shopNewLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ query: z.string().trim().min(2).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: items } = await context.supabase.from("wardrobe_items").select("name,color,style").limit(60);
    const plan = await aiJson<{ searches: string[]; note: string }>(
      "You are a fashion personal shopper. Convert the user's wish into 1-3 concise product search phrases (3-6 words each, concrete garment + colour/detail) for an online catalog. Prefer pieces that complement their existing wardrobe. note: one warm sentence on what to look for.",
      [{ type: "input_text", text: `WISH: ${data.query}\nTHEIR WARDROBE: ${(items ?? []).map((i) => `${i.name} (${i.color}, ${i.style})`).join("; ") || "unknown"}` }],
      "shop_plan",
      {
        type: "object",
        additionalProperties: false,
        required: ["searches", "note"],
        properties: { searches: { type: "array", items: { type: "string" } }, note: { type: "string" } },
      },
    );
    const searches = plan.searches.slice(0, 3);
    if (searches.length === 0) searches.push(data.query);
    const groups = await Promise.all(searches.map((q) => searchCatalog(q, 8).catch(() => [] as ShopProduct[])));
    const seen = new Set<string>();
    const products: ShopProduct[] = [];
    for (let i = 0; i < 8; i++)
      for (const g of groups) {
        const p = g[i];
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          products.push(p);
        }
      }
    return { note: plan.note, searches, products: products.slice(0, 18) };
  });
