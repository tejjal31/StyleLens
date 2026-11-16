import type { ReactNode } from "react";
import type { WardrobeItem } from "@/lib/wardrobe";
import { ItemCard } from "./ItemCard";

export function LookCard({ title, vibe, items, children, footer }: { title: string; vibe?: string | null; items: WardrobeItem[]; children?: ReactNode; footer?: ReactNode }) {
  return (
    <article className="fade-up overflow-hidden rounded-3xl border bg-card shadow-soft">
      <div className="bg-blush-gradient px-6 py-5">
        <h3 className="text-2xl text-primary">{title}</h3>
        {vibe && <p className="text-sm text-accent-foreground/80">{vibe}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-5">
        {items.map((i) => <ItemCard key={i.id} item={i} compact />)}
      </div>
      {children && <div className="space-y-2 px-6 pb-4 text-sm">{children}</div>}
      {footer && <div className="flex flex-wrap gap-2 border-t px-6 py-4">{footer}</div>}
    </article>
  );
}
