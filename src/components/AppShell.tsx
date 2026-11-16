import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Clock, Heart, LogOut, Menu, Shirt, ShoppingBag, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/wardrobe";

const NAV = [
  { to: "/closet", label: "My Closet", icon: Shirt },
  { to: "/stylist", label: "AI Stylist", icon: Sparkles },
  { to: "/shop", label: "Shop New Looks", icon: ShoppingBag },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/recent", label: "Recently Added", icon: Clock },
] as const;

export function AppShell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const user = useUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const name = (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? "";
  const avatar = user?.user_metadata?.["avatar_url"] as string | undefined;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-maroon-gradient text-sidebar-foreground">
      <Link to="/closet" className="flex items-center gap-2 px-6 pt-8 pb-10">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-blush text-primary">♥</span>
        <span className="font-display text-2xl tracking-wide">StyleLens</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-sidebar-foreground/80 transition-all hover:translate-x-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shadow-soft" }}
          >
            <n.icon className="h-4 w-4 transition-transform group-hover:scale-125" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-sidebar-accent p-4">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-9 w-9 rounded-full border border-sidebar-primary" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blush text-primary">{name.slice(0, 1)}</span>
          )}
          <div className="min-w-0 flex-1 truncate text-sm">{name}</div>
          <button onClick={signOut} aria-label="Sign out" className="rounded-full p-2 hover:bg-sidebar-border">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64">{sidebar}</div>
          <button aria-label="Close menu" className="flex-1 bg-foreground/40" onClick={() => setOpen(false)} />
        </div>
      )}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background/85 px-5 py-4 backdrop-blur md:px-10">
          <button className="rounded-lg p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            {open ? <X /> : <Menu />}
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl text-primary md:text-3xl">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </header>
        <div className="fade-up px-5 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
