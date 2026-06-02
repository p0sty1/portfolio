-- Anonymous Q&A: visitors submit questions; owner answers via Supabase dashboard / service role.

create table if not exists public.portfolio_anonymous_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 1000),
  answer text check (answer is null or char_length(answer) <= 2000),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create index if not exists portfolio_anonymous_questions_created_idx
  on public.portfolio_anonymous_questions (created_at desc);

alter table public.portfolio_anonymous_questions enable row level security;

drop policy if exists "portfolio_anonymous_questions_select_anon"
  on public.portfolio_anonymous_questions;
drop policy if exists "portfolio_anonymous_questions_insert_anon"
  on public.portfolio_anonymous_questions;

create policy "portfolio_anonymous_questions_select_anon"
  on public.portfolio_anonymous_questions
  for select
  to anon, authenticated
  using (true);

create policy "portfolio_anonymous_questions_insert_anon"
  on public.portfolio_anonymous_questions
  for insert
  to anon, authenticated
  with check (true);

-- Answers: update in Supabase Table Editor or with service_role (not exposed to anon).

revoke update, delete on public.portfolio_anonymous_questions from anon, authenticated;
