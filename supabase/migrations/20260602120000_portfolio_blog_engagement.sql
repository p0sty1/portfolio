-- Blog likes (per post_id slug) + comments

create table if not exists public.portfolio_blog_posts_meta (
  post_id text primary key,
  likes_count int not null default 0 check (likes_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists portfolio_blog_comments_post_created_idx
  on public.portfolio_blog_comments (post_id, created_at desc);

alter table public.portfolio_blog_posts_meta enable row level security;
alter table public.portfolio_blog_comments enable row level security;

drop policy if exists "portfolio_blog_posts_meta_select_anon"
  on public.portfolio_blog_posts_meta;
create policy "portfolio_blog_posts_meta_select_anon"
  on public.portfolio_blog_posts_meta for select to anon, authenticated using (true);

revoke insert, update, delete on public.portfolio_blog_posts_meta from anon, authenticated;

drop policy if exists "portfolio_blog_comments_select_anon"
  on public.portfolio_blog_comments;
drop policy if exists "portfolio_blog_comments_insert_anon"
  on public.portfolio_blog_comments;

create policy "portfolio_blog_comments_select_anon"
  on public.portfolio_blog_comments for select to anon, authenticated using (true);

create policy "portfolio_blog_comments_insert_anon"
  on public.portfolio_blog_comments for insert to anon, authenticated with check (true);

revoke update, delete on public.portfolio_blog_comments from anon, authenticated;

create or replace function public.increment_blog_likes(p_post_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.portfolio_blog_posts_meta (post_id, likes_count, updated_at)
  values (p_post_id, 1, now())
  on conflict (post_id) do update
  set
    likes_count = public.portfolio_blog_posts_meta.likes_count + 1,
    updated_at = now()
  returning likes_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.increment_blog_likes(text) from public;
grant execute on function public.increment_blog_likes(text) to anon, authenticated;
