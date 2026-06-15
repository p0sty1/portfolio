-- Timeline feed metrics: admin-curated featured posts + one view per browser client.

alter table public.portfolio_timeline_posts
  add column if not exists is_featured boolean not null default false;

create index if not exists portfolio_timeline_posts_featured_created_idx
  on public.portfolio_timeline_posts (site_id, is_featured, created_at desc)
  where deleted_at is null;

create table if not exists public.portfolio_timeline_post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.portfolio_timeline_posts(id) on delete cascade,
  client_id text not null check (char_length(client_id) between 8 and 128),
  created_at timestamptz not null default now(),
  constraint portfolio_timeline_post_views_unique_client
    unique (post_id, client_id)
);

create index if not exists portfolio_timeline_post_views_post_idx
  on public.portfolio_timeline_post_views (post_id);

alter table public.portfolio_timeline_post_views enable row level security;

revoke all on public.portfolio_timeline_post_views from anon, authenticated;
grant all on public.portfolio_timeline_post_views to service_role;

create or replace function public.record_timeline_post_views(
  p_post_ids uuid[],
  p_client_id text
)
returns table (
  post_id uuid,
  views_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_ids uuid[];
begin
  if p_client_id is null
    or char_length(p_client_id) < 8
    or char_length(p_client_id) > 128
  then
    raise exception 'invalid client id';
  end if;

  select array_agg(distinct candidate.post_id)
  into v_post_ids
  from unnest(p_post_ids) as candidate(post_id)
  where candidate.post_id is not null;

  if coalesce(array_length(v_post_ids, 1), 0) = 0 then
    return;
  end if;

  if array_length(v_post_ids, 1) > 100 then
    raise exception 'too many timeline posts';
  end if;

  insert into public.portfolio_timeline_post_views (post_id, client_id)
  select posts.id, p_client_id
  from public.portfolio_timeline_posts posts
  where posts.id = any(v_post_ids)
    and posts.deleted_at is null
    and posts.status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = posts.site_id
        and sites.is_active
    )
  on conflict on constraint portfolio_timeline_post_views_unique_client
  do nothing;

  return query
  select
    posts.id as post_id,
    count(views.id)::int as views_count
  from public.portfolio_timeline_posts posts
  left join public.portfolio_timeline_post_views views
    on views.post_id = posts.id
  where posts.id = any(v_post_ids)
    and posts.deleted_at is null
    and posts.status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = posts.site_id
        and sites.is_active
    )
  group by posts.id;
end;
$$;

drop function if exists public.get_timeline_post_engagement(text);

create or replace function public.get_timeline_post_engagement(p_client_id text)
returns table (
  post_id uuid,
  likes_count int,
  liked_by_client boolean,
  views_count int
)
language sql
security definer
set search_path = public
as $$
  select
    posts.id as post_id,
    count(distinct likes.id)::int as likes_count,
    coalesce(bool_or(likes.client_id = p_client_id), false) as liked_by_client,
    count(distinct views.id)::int as views_count
  from public.portfolio_timeline_posts posts
  left join public.portfolio_timeline_post_likes likes
    on likes.post_id = posts.id
  left join public.portfolio_timeline_post_views views
    on views.post_id = posts.id
  where posts.deleted_at is null
    and posts.status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = posts.site_id
        and sites.is_active
    )
  group by posts.id;
$$;

revoke all on function public.record_timeline_post_views(uuid[], text) from public;
revoke all on function public.get_timeline_post_engagement(text) from public;

grant execute on function public.record_timeline_post_views(uuid[], text)
  to anon, authenticated;
grant execute on function public.get_timeline_post_engagement(text)
  to anon, authenticated;
