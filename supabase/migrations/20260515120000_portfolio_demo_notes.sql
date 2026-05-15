-- Minimal demo table for portfolio ↔ Supabase smoke test.
-- For production: tighten RLS (require auth, rate limits, moderation).

create table if not exists public.portfolio_demo_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);

alter table public.portfolio_demo_notes enable row level security;

drop policy if exists "portfolio_demo_notes_select_anon" on public.portfolio_demo_notes;
drop policy if exists "portfolio_demo_notes_insert_anon" on public.portfolio_demo_notes;

create policy "portfolio_demo_notes_select_anon"
  on public.portfolio_demo_notes
  for select
  to anon, authenticated
  using (true);

create policy "portfolio_demo_notes_insert_anon"
  on public.portfolio_demo_notes
  for insert
  to anon, authenticated
  with check (true);
