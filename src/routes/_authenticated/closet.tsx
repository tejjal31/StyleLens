import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ItemCard } from "@/components/ItemCard";
import { UploadButton } from "@/components/UploadButton";
import { useWardrobe } from "@/lib/wardrobe";
import { CATEGORIES } from "@/lib/style.functions";

export const Route = createFileRoute("/_authenticated/closet")({
  head: () => ({ meta: [{ title: "My Closet — StyleLens" }, { name: "description", content: "Your private virtual wardrobe." }] }),
  component: Closet,
});

export function EmptyCloset({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed bg-card p-10 text-center shadow-soft">
      <div className="mb-3 text-4xl text-blush-deep">♥</div>
      <p className="text-muted-foreground">{text}</p>
      <div className="mt-6"><UploadButton /></div>
    </div>
  );
}

function Closet() {
  const { data = [], isLoading } = useWardrobe();
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return data.filter(
      (i) =>
        (cat === "all" || i.category === cat) &&
        (!s || [i.name, i.color, i.style, i.season, i.notes].some((f) => f?.toLowerCase().includes(s))),
    );
  }, [data, cat, q]);
  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c, data.filter((i) => i.category === c).length])), [data]);

  return (
    <AppShell title="My Closet" subtitle={`${data.length} pieces, auto-tagged by AI`} actions={<UploadButton />}>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-blush-deep" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by colour, style, fabric… e.g. 'red silk'" className="flex-1 bg-transparent outline-none" />
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {["all", ...CATEGORIES.filter((c) => (counts[c] ?? 0) > 0)].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`bounce-hover rounded-full border px-4 py-1.5 text-sm capitalize ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {c} {c !== "all" && <span className="opacity-60">{counts[c]}</span>}
          </button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Opening your wardrobe…</p>
      ) : data.length === 0 ? (
        <EmptyCloset text="Your closet is waiting. Upload photos of your clothes and AI will tag the type, colour and style for you." />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
          {filtered.map((i) => <ItemCard key={i.id} item={i} />)}
        </div>
      )}
    </AppShell>
  );
}
