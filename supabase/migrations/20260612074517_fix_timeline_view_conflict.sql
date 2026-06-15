-- Fix PL/pgSQL ambiguity between OUT parameter names and conflict target columns.

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

revoke all on function public.record_timeline_post_views(uuid[], text)
  from public;
grant execute on function public.record_timeline_post_views(uuid[], text)
  to anon, authenticated;
