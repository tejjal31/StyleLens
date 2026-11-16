import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type WardrobeItem = Tables<"wardrobe_items"> & { url?: string | undefined };
export type SavedLook = Tables<"saved_looks">;

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}

export function useWardrobe() {
  return useQuery({
    queryKey: ["wardrobe"],
    queryFn: async (): Promise<WardrobeItem[]> => {
      const { data, error } = await supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      if (!data.length) return [];
      const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrls(data.map((d) => d.image_path), 3600);
      const map = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
      return data.map((d) => ({ ...d, url: map.get(d.image_path) ?? undefined }));
    },
    staleTime: 60_000,
  });
}

export function useLooks() {
  return useQuery({
    queryKey: ["looks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_looks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useWardrobeActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["wardrobe"] });
  return {
    refresh,
    async toggleFavorite(item: WardrobeItem) {
      qc.setQueryData<WardrobeItem[]>(["wardrobe"], (old) => old?.map((i) => (i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i)));
      const { error } = await supabase.from("wardrobe_items").update({ is_favorite: !item.is_favorite }).eq("id", item.id);
      if (error) refresh();
    },
    async remove(item: WardrobeItem) {
      await supabase.storage.from("wardrobe").remove([item.image_path]);
      await supabase.from("wardrobe_items").delete().eq("id", item.id);
      refresh();
    },
    async update(id: string, patch: Partial<WardrobeItem>) {
      const { url: _u, ...rest } = patch;
      await supabase.from("wardrobe_items").update(rest).eq("id", id);
      refresh();
    },
    async upload(file: File): Promise<string> {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("wardrobe").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data, error: insErr } = await supabase
        .from("wardrobe_items")
        .insert({ image_path: path, user_id: u.user.id, name: "Analysing…" })
        .select("id")
        .single();
      if (insErr) throw insErr;
      return data.id;
    },
  };
}
