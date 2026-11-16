import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ItemCard } from "@/components/ItemCard";
import { LookCard } from "@/components/LookCard";
import { supabase } from "@/integrations/supabase/client";
import { useLooks, useWardrobe } from "@/lib/wardrobe";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — StyleLens" }, { name: "description", content: "Saved clothes and looks." }] }),
  component: Favorites,
});

function Favorites() {
  const { data: items = [] } = useWardrobe();
  const { data: looks = [] } = useLooks();
  const qc = useQueryClient();
  const favs = items.filter((i) => i.is_favorite);
  const byId = new Map(items.map((i) => [i.id, i]));

  return (
    <AppShell title="Favorites" subtitle="The pieces and looks you love">
      <h2 className="mb-4 text-2xl text-primary">Saved Looks</h2>
      {looks.length === 0 ? (
        <p className="mb-10 text-muted-foreground">Ask the AI Stylist for an outfit and tap “Save look”.</p>
      ) : (
        <div className="mb-12 grid gap-6 xl:grid-cols-2">
          {looks.map((l) => (
            <LookCard
              key={l.id}
              title={l.title}
              vibe={`“${l.prompt}”`}
              items={l.item_ids.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x)}
              footer={
                <button
                  onClick={async () => {
                    await supabase.from("saved_looks").delete().eq("id", l.id);
                    qc.invalidateQueries({ queryKey: ["looks"] });
                  }}
                  className="inline-flex items-center gap-1 text-sm text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              }
            >
              {l.description && <p>{l.description}</p>}
              {l.styling_tips && <p className="text-muted-foreground">✦ {l.styling_tips}</p>}
            </LookCard>
          ))}
        </div>
      )}
      <h2 className="mb-4 text-2xl text-primary">Favorite Pieces</h2>
      {favs.length === 0 ? (
        <p className="text-muted-foreground">Tap the heart on any piece in your closet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
          {favs.map((i) => <ItemCard key={i.id} item={i} />)}
        </div>
      )}
    </AppShell>
  );
}
