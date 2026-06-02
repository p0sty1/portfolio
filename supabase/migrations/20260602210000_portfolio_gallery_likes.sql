-- Gallery likes: one like per browser client per gallery item.

create table if not exists public.portfolio_gallery_likes (
  id uuid primary key default gen_random_uuid(),
  item_id text not null check (
    char_length(item_id) between 1 and 120
    and item_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
  ),
  client_id uuid not null,
  created_at timestamptz not null default now(),
  unique (item_id, client_id)
);

create index if not exists portfolio_gallery_likes_item_idx
  on public.portfolio_gallery_likes (item_id, created_at desc);

alter table public.portfolio_gallery_likes enable row level security;

drop policy if exists "portfolio_gallery_likes_no_direct_select"
  on public.portfolio_gallery_likes;

revoke all on public.portfolio_gallery_likes from anon, authenticated;

create or replace function public.get_gallery_like_counts(p_item_ids text[])
returns table (item_id text, likes_count int)
language sql
security definer
set search_path = public
as $$
  select l.item_id, count(*)::int as likes_count
  from public.portfolio_gallery_likes as l
  where l.item_id = any(p_item_ids)
  group by l.item_id;
$$;

create or replace function public.like_gallery_item(
  p_item_id text,
  p_client_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_item_id is null
    or char_length(p_item_id) not between 1 and 120
    or p_item_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
  then
    raise exception 'Invalid gallery item id';
  end if;

  insert into public.portfolio_gallery_likes (item_id, client_id)
  values (p_item_id, p_client_id)
  on conflict (item_id, client_id) do nothing;

  select count(*)::int
  into v_count
  from public.portfolio_gallery_likes
  where item_id = p_item_id;

  return v_count;
end;
$$;

revoke all on function public.get_gallery_like_counts(text[]) from public;
revoke all on function public.like_gallery_item(text, uuid) from public;

grant execute on function public.get_gallery_like_counts(text[])
  to anon, authenticated;
grant execute on function public.like_gallery_item(text, uuid)
  to anon, authenticated;
