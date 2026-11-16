-- StyleLens database: run once in the Supabase SQL editor.
create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  image_path text not null,
  name text not null default 'New piece',
  category text not null default 'other',
  color text, style text, season text, notes text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null, prompt text not null,
  description text, styling_tips text,
  item_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.wardrobe_items enable row level security;
alter table public.saved_looks enable row level security;
create policy "own items" on public.wardrobe_items for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own looks" on public.saved_looks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.wardrobe_items, public.saved_looks to authenticated;

-- Private photo storage: each user only sees files in their own folder.
insert into storage.buckets (id, name, public) values ('wardrobe', 'wardrobe', false);
create policy "own photos" on storage.objects for all to authenticated
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);
