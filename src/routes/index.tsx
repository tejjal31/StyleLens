import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShoppingBag, Shirt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero-wardrobe.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/wardrobe";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StyleLens — Your AI Personal Stylist & Virtual Wardrobe" },
      { name: "description", content: "Upload your closet, get AI outfits for any occasion, and shop the missing pieces from real stores." },
      { property: "og:title", content: "StyleLens — AI Personal Stylist" },
      { property: "og:description", content: "Your wardrobe, styled by AI. Outfits for every mood, weather and moment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const user = useUser();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/closet` },
    });
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-background px-8 py-10 md:px-16">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-blush">♥</span>
          <span className="font-display text-2xl text-primary">StyleLens</span>
        </div>
        <div className="fade-up max-w-lg py-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-blush-deep">Your AI personal stylist</p>
          <h1 className="text-5xl leading-tight text-primary md:text-6xl">Dress from your own closet, <em>beautifully.</em></h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Snap your clothes, describe the moment in your own words, and StyleLens styles complete looks for your mood and weather — then finds the missing piece online.
          </p>
          <div className="mt-10">
            {user ? (
              <Link to="/closet" className="bounce-hover inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-primary-foreground shadow-lift">
                Open my closet →
              </Link>
            ) : (
              <button onClick={signIn} disabled={busy} className="bounce-hover inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-primary-foreground shadow-lift disabled:opacity-60">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
            )}
          </div>
          <ul className="mt-12 grid gap-4 text-sm sm:grid-cols-3">
            {[
              { icon: Shirt, t: "Virtual wardrobe", d: "AI-tagged & private" },
              { icon: Sparkles, t: "AI outfits", d: "Mood, weather, style" },
              { icon: ShoppingBag, t: "Shop new looks", d: "Real stores, real prices" },
            ].map((f) => (
              <li key={f.t} className="bounce-hover rounded-2xl border bg-card p-4 shadow-soft">
                <f.icon className="mb-2 h-5 w-5 text-blush-deep" />
                <p className="font-semibold text-primary">{f.t}</p>
                <p className="text-muted-foreground">{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">Your wardrobe photos are private to your account.</p>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <img src={hero} alt="Silk dresses in maroon, blush and cream on gold hangers" width={1280} height={1600} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M21.8 10.2H12v3.9h5.6c-.8 2.4-3 4-5.6 4a6.1 6.1 0 1 1 3.9-10.8l2.8-2.8A10 10 0 1 0 22 12c0-.6-.1-1.2-.2-1.8Z" />
      <path fill="#FF3D00" d="m3.2 7.3 3.2 2.4A6.1 6.1 0 0 1 15.9 7.3l2.8-2.8A10 10 0 0 0 3.2 7.3Z" />
      <path fill="#4CAF50" d="M12 22c2.6 0 5-1 6.7-2.6l-3.1-2.6A6 6 0 0 1 6.4 14l-3.2 2.5A10 10 0 0 0 12 22Z" />
      <path fill="#1976D2" d="M21.8 10.2H12v3.9h5.6a6 6 0 0 1-2 2.7l3.1 2.6c-.2.2 3.3-2.4 3.3-7.4 0-.6-.1-1.2-.2-1.8Z" />
    </svg>
  );
}
