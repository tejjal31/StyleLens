import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Loader2, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LookCard } from "@/components/LookCard";
import { supabase } from "@/integrations/supabase/client";
import { generateOutfits, type GeneratedLook } from "@/lib/style.functions";
import { useWardrobe } from "@/lib/wardrobe";

export const Route = createFileRoute("/_authenticated/stylist")({
  head: () => ({ meta: [{ title: "AI Stylist — StyleLens" }, { name: "description", content: "Describe your occasion and get outfits from your own wardrobe." }] }),
  component: Stylist,
});

function getCoords(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((res) => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => res(null),
      { timeout: 6000, maximumAge: 600000 },
    );
  });
}

function Stylist() {
  const { data: items = [] } = useWardrobe();
  const gen = useServerFn(generateOutfits);
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [useWeather, setUseWeather] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ prompt: string; weather: string; looks: GeneratedLook[] } | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const byId = new Map(items.map((i) => [i.id, i]));

  async function run() {
    if (prompt.trim().length < 3) { toast.error("Tell me a little about the look you want."); return; }
    setBusy(true);
    try {
      const coords = useWeather ? await getCoords() : null;
      const r = await gen({ data: { prompt, ...(coords ?? {}) } });
      setResult({ prompt, ...r });
      setSaved(new Set());
      if (r.looks.length === 0) toast.error("I couldn't build a look from your closet for that — try adding more pieces.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function save(l: GeneratedLook, idx: number) {
    if (!result) return;
    const { error } = await supabase.from("saved_looks").insert({
      title: l.title,
      prompt: result.prompt,
      description: l.reasoning,
      styling_tips: l.styling_tips,
      item_ids: l.item_ids,
    });
    if (error) { toast.error(error.message); return; }
    setSaved((s) => new Set(s).add(idx));
    qc.invalidateQueries({ queryKey: ["looks"] });
    toast.success("Look saved to Favorites ♥");
  }

  return (
    <AppShell title="AI Outfit Generator" subtitle="Describe the moment — I'll dress you from your own closet">
      <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-6 shadow-lift">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && run()}
          rows={4}
          maxLength={800}
          placeholder="e.g. A rooftop dinner date tonight, I'm feeling bold but want to stay comfy — something that makes me feel like a main character…"
          className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground/70"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={useWeather} onChange={(e) => setUseWeather(e.target.checked)} className="accent-primary" />
            <MapPin className="h-4 w-4" /> Use my local weather
          </label>
          <button onClick={run} disabled={busy} className="bounce-hover inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-soft disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Styling you…" : "Style me"}
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          Your closet is empty. <Link to="/closet" className="text-primary underline">Add some pieces</Link> first.
        </p>
      )}

      {result && (
        <div className="mx-auto mt-10 max-w-5xl space-y-6">
          {result.weather && !result.weather.startsWith("Unknown") && <p className="text-sm text-muted-foreground">☁ Weather considered: {result.weather}</p>}
          {result.looks.map((l, idx) => (
            <LookCard
              key={idx}
              title={l.title}
              vibe={l.vibe}
              items={l.item_ids.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x)}
              footer={
                <>
                  <button
                    onClick={() => save(l, idx)}
                    disabled={saved.has(idx)}
                    className="bounce-hover inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
                  >
                    <Heart className="h-4 w-4" fill={saved.has(idx) ? "currentColor" : "none"} /> {saved.has(idx) ? "Saved" : "Save look"}
                  </button>
                  {l.missing_piece && (
                    <Link to="/shop" search={{ q: l.missing_piece }} className="bounce-hover inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm text-primary">
                      <ShoppingBag className="h-4 w-4" /> Shop: {l.missing_piece}
                    </Link>
                  )}
                </>
              }
            >
              <p>{l.reasoning}</p>
              <p className="text-muted-foreground">✦ {l.styling_tips}</p>
            </LookCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
