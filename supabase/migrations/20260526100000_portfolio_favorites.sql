-- Portfolio favorites: categorized links with images (public read via anon).

create type public.portfolio_favorite_category as enum (
  'movie',
  'tv',
  'anime',
  'game',
  'song',
  'celebrity',
  'video',
  'pornstar'
);

create table if not exists public.portfolio_favorites (
  id uuid primary key default gen_random_uuid(),
  category public.portfolio_favorite_category not null,
  title text not null check (char_length(title) <= 200),
  subtitle text not null default '' check (char_length(subtitle) <= 300),
  link_url text not null default '' check (char_length(link_url) <= 2000),
  image_url text not null default '' check (char_length(image_url) <= 2000),
  note text not null default '' check (char_length(note) <= 500),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_favorites_category_sort_idx
  on public.portfolio_favorites (category, sort_order, created_at desc);

alter table public.portfolio_favorites enable row level security;

drop policy if exists "portfolio_favorites_select_anon" on public.portfolio_favorites;

create policy "portfolio_favorites_select_anon"
  on public.portfolio_favorites
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.portfolio_favorites from anon, authenticated;
