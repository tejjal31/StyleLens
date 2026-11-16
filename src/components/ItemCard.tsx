import { useState } from "react";
import { Heart, Loader2, Trash2 } from "lucide-react";
import type { WardrobeItem } from "@/lib/wardrobe";
import { useWardrobeActions } from "@/lib/wardrobe";

export function ItemCard({ item, compact = false }: { item: WardrobeItem; compact?: boolean }) {
  const actions = useWardrobeActions();
  const [beat, setBeat] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const analysing = item.name === "Analysing…";
  return (
    <div className="bounce-hover group relative overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        {item.url && <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      </div>
      {!compact && (
        <>
          <button
            aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              setBeat(true);
              setTimeout(() => setBeat(false), 500);
              actions.toggleFavorite(item);
            }}
            className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-card/90 shadow-soft"
          >
            <Heart className={`h-4 w-4 text-blush-deep ${beat ? "heart-beat" : ""}`} fill={item.is_favorite ? "currentColor" : "none"} />
          </button>
          <button
            aria-label={confirming ? "Confirm delete" : "Delete item"}
            onClick={(e) => {
              e.stopPropagation();
              if (confirming) actions.remove(item);
              else {
                setConfirming(true);
                setTimeout(() => setConfirming(false), 3000);
              }
            }}
            className={`absolute left-2 top-2 z-10 grid h-11 place-items-center rounded-full bg-card/95 px-3 shadow-soft transition-opacity group-hover:opacity-100 focus:opacity-100 ${confirming ? "opacity-100" : "w-11 opacity-0"}`}
          >
            {confirming ? <span className="text-xs font-medium text-destructive">Tap to delete</span> : <Trash2 className="h-4 w-4 text-destructive" />}
          </button>
        </>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 truncate text-sm font-medium">
          {analysing && <Loader2 className="h-3 w-3 animate-spin" />}
          {item.name}
        </div>
        {!compact && !analysing && (
          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
            <span className="rounded-full bg-primary px-2 py-0.5 capitalize text-primary-foreground">{item.category}</span>
            {item.color && <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{item.color}</span>}
            {item.style && <span className="truncate rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{item.style}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
