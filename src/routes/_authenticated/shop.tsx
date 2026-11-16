import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { shopNewLooks } from "@/lib/style.functions";

export const Route = createFileRoute("/_authenticated/shop")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Shop New Looks — StyleLens" }, { name: "description", content: "AI-picked products from real online stores." }] }),
  component: Shop,
});

const POPULAR = ["Red dress", "Backless dress", "Chikankari kurta", "Burgundy slingback heels", "Juttis", "Tailored fluid trousers", "Satin co-ord set", "Pearl drop earrings"];

const STORES: { name: string; emoji: string; url: (q: string) => string }[] = [
  { name: "Myntra", emoji: "🛍️", url: (q) => `https://www.myntra.com/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}` },
  { name: "Nykaa Fashion", emoji: "💄", url: (q) => `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}` },
  { name: "Ajio", emoji: "✨", url: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}` },
  { name: "Zara India", emoji: "👗", url: (q) => `https://www.zara.com/in/en/search?searchTerm=${encodeURIComponent(q)}` },
  { name: "H&M India", emoji: "🏷️", url: (q) => `https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(q)}` },
  { name: "Amazon India Fashion", emoji: "📦", url: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}&i=apparel` },
  { name: "Tata CLiQ Fashion", emoji: "💎", url: (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(q)}` },
  { name: "Littlebox", emoji: "🎀", url: (q) => `https://littleboxindia.com/search?q=${encodeURIComponent(q)}` },
  { name: "Google Shopping India", emoji: "🌐", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}&udm=28&gl=in&hl=en-IN` },
];

type Result = Awaited<ReturnType<typeof shopNewLooks>>;

function Shop() {
  const { q: initial } = Route.useSearch();
  const shop = useServerFn(shopNewLooks);
  const [q, setQ] = useState(initial ?? "");
  const [active, setActive] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  async function run(query: string) {
    const v = query.trim();
    if (v.length < 2) return;
    setQ(v);
    setActive(v);
    setBusy(true);
    try {
      setRes(await shop({ data: { query: v } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <AppShell title="Shop Across Stores" subtitle="Describe what you want — AI finds real products to buy">
      <div className="mb-6 rounded-3xl bg-maroon-gradient p-6 text-primary-foreground shadow-lift md:p-8">
        <span className="inline-flex items-center gap-1 rounded-full bg-blush px-3 py-1 text-xs font-medium text-primary"><Sparkles className="h-3 w-3" /> AI Powered</span>
        <p className="mt-3 max-w-2xl font-display text-2xl md:text-3xl">Don't own it? Don't love what you have? Tell me the dream piece.</p>
      </div>

      <section className="rounded-3xl border bg-card p-5 shadow-soft md:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest">Search any item across stores:</p>
        <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-5 w-5 text-blush-deep" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. a backless dress for a beach wedding in blush tones" className="flex-1 bg-transparent text-lg outline-none" />
          <button disabled={busy} className="bounce-hover rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-2">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-blush-deep">Popular in India:</span>
          {POPULAR.map((p) => (
            <button key={p} onClick={() => run(p)} className={`bounce-hover shrink-0 rounded-full border px-4 py-1.5 text-sm ${active === p ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>
              {p}
            </button>
          ))}
        </div>

        {busy && <p className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Hunting across stores for “{active}”…</p>}

        {res && !busy && (
          <div className="mt-8">
            <p className="mb-1 text-sm text-muted-foreground">✦ {res.note}</p>
            <p className="mb-5 text-xs text-muted-foreground">Searched: {res.searches.join(" · ")}</p>
            {res.products.length === 0 ? (
              <p className="text-muted-foreground">No live products matched — try the store links below.</p>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {res.products.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="bounce-hover group overflow-hidden rounded-2xl border bg-background">
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      {p.image && <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-semibold text-primary">{p.price ?? "See price"}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">{p.seller} <ArrowUpRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {active && (
          <div className="mt-10 border-t pt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl"><Sparkles className="h-4 w-4 text-blush-deep" /> Launch “{active}” in Indian Shopping Apps:</h2>
              <span className="hidden text-sm text-blush-deep sm:block">Direct 1-Click Search</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {STORES.map((s) => (
                <a key={s.name} href={s.url(active)} target="_blank" rel="noopener noreferrer" className="bounce-hover flex items-center gap-4 rounded-2xl border bg-background p-5">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-primary">Search on {s.name} →</p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-soft"><ArrowUpRight className="h-4 w-4 text-primary" /></span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}
