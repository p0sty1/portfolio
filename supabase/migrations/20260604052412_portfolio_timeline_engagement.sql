-- Timeline post likes + threaded comments.

create table if not exists public.portfolio_timeline_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.portfolio_timeline_posts(id) on delete cascade,
  client_id text not null check (char_length(client_id) between 8 and 128),
  created_at timestamptz not null default now(),
  constraint portfolio_timeline_post_likes_unique_client
    unique (post_id, client_id)
);

create index if not exists portfolio_timeline_post_likes_post_idx
  on public.portfolio_timeline_post_likes (post_id);

create table if not exists public.portfolio_timeline_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.portfolio_timeline_posts(id) on delete cascade,
  parent_id uuid references public.portfolio_timeline_comments(id) on delete cascade,
  author_name text not null default '访客' check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists portfolio_timeline_comments_post_created_idx
  on public.portfolio_timeline_comments (post_id, created_at asc);

create index if not exists portfolio_timeline_comments_parent_idx
  on public.portfolio_timeline_comments (parent_id);

create or replace function public.validate_timeline_comment_parent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is not null and not exists (
    select 1
    from public.portfolio_timeline_comments parent
    where parent.id = new.parent_id
      and parent.post_id = new.post_id
  ) then
    raise exception 'comment parent must belong to the same timeline post';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_timeline_comment_parent
  on public.portfolio_timeline_comments;

create trigger validate_timeline_comment_parent
  before insert or update on public.portfolio_timeline_comments
  for each row
  execute function public.validate_timeline_comment_parent();

alter table public.portfolio_timeline_post_likes enable row level security;
alter table public.portfolio_timeline_comments enable row level security;

drop policy if exists "portfolio_timeline_comments_select_anon"
  on public.portfolio_timeline_comments;
drop policy if exists "portfolio_timeline_comments_insert_anon"
  on public.portfolio_timeline_comments;

create policy "portfolio_timeline_comments_select_anon"
  on public.portfolio_timeline_comments
  for select
  to anon, authenticated
  using (true);

create policy "portfolio_timeline_comments_insert_anon"
  on public.portfolio_timeline_comments
  for insert
  to anon, authenticated
  with check (true);

revoke all on public.portfolio_timeline_post_likes from anon, authenticated;
revoke update, delete on public.portfolio_timeline_comments from anon, authenticated;

create or replace function public.get_timeline_post_engagement(p_client_id text)
returns table (
  post_id uuid,
  likes_count int,
  liked_by_client boolean
)
language sql
security definer
set search_path = public
as $$
  select
    posts.id as post_id,
    count(likes.id)::int as likes_count,
    coalesce(bool_or(likes.client_id = p_client_id), false) as liked_by_client
  from public.portfolio_timeline_posts posts
  left join public.portfolio_timeline_post_likes likes
    on likes.post_id = posts.id
  group by posts.id;
$$;

create or replace function public.toggle_timeline_post_like(
  p_post_id uuid,
  p_client_id text
)
returns table (
  liked boolean,
  likes_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
  v_liked boolean;
begin
  if char_length(p_client_id) < 8 or char_length(p_client_id) > 128 then
    raise exception 'invalid client id';
  end if;

  if not exists (
    select 1
    from public.portfolio_timeline_posts
    where id = p_post_id
  ) then
    raise exception 'timeline post not found';
  end if;

  delete from public.portfolio_timeline_post_likes
  where post_id = p_post_id
    and client_id = p_client_id;

  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    v_liked := false;
  else
    insert into public.portfolio_timeline_post_likes (post_id, client_id)
    values (p_post_id, p_client_id)
    on conflict (post_id, client_id) do nothing;
    v_liked := true;
  end if;

  return query
  select
    v_liked,
    count(*)::int
  from public.portfolio_timeline_post_likes
  where post_id = p_post_id;
end;
$$;

revoke all on function public.get_timeline_post_engagement(text) from public;
revoke all on function public.toggle_timeline_post_like(uuid, text) from public;
revoke all on function public.validate_timeline_comment_parent() from public;

grant execute on function public.get_timeline_post_engagement(text)
  to anon, authenticated;
grant execute on function public.toggle_timeline_post_like(uuid, text)
  to anon, authenticated;
