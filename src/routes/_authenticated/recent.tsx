import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ItemCard } from "@/components/ItemCard";
import { UploadButton } from "@/components/UploadButton";
import { useWardrobe } from "@/lib/wardrobe";

export const Route = createFileRoute("/_authenticated/recent")({
  head: () => ({ meta: [{ title: "Recently Added — StyleLens" }, { name: "description", content: "Your newest wardrobe pieces." }] }),
  component: Recent,
});

function Recent() {
  const { data = [] } = useWardrobe();
  const weekAgo = Date.now() - 14 * 864e5;
  const recent = data.filter((i) => new Date(i.created_at).getTime() > weekAgo).slice(0, 30);
  return (
    <AppShell title="Recently Added" subtitle="Pieces added in the last two weeks" actions={<UploadButton />}>
      {recent.length === 0 ? (
        <p className="text-muted-foreground">Nothing new lately — add a piece to see it here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
          {recent.map((i) => <ItemCard key={i.id} item={i} />)}
        </div>
      )}
    </AppShell>
  );
}
