-- Run in Supabase SQL Editor for project nhwlsrnvdxzhygudhhuj
-- (must match REACT_APP_SUPABASE_URL in .env.local)

-- 1) Guestbook
create table if not exists public.portfolio_demo_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);

alter table public.portfolio_demo_notes enable row level security;

drop policy if exists "portfolio_demo_notes_select_anon" on public.portfolio_demo_notes;
drop policy if exists "portfolio_demo_notes_insert_anon" on public.portfolio_demo_notes;

create policy "portfolio_demo_notes_select_anon"
  on public.portfolio_demo_notes for select to anon, authenticated using (true);

create policy "portfolio_demo_notes_insert_anon"
  on public.portfolio_demo_notes for insert to anon, authenticated with check (true);

-- 2) Likes / favorites
do $$ begin
  create type public.portfolio_favorite_category as enum (
    'movie', 'tv', 'anime', 'game', 'song', 'celebrity', 'video', 'pornstar'
  );
exception when duplicate_object then null;
end $$;

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
  on public.portfolio_favorites for select to anon, authenticated using (true);

revoke insert, update, delete on public.portfolio_favorites from anon, authenticated;

-- 3) Anonymous mailbox
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
  on public.portfolio_anonymous_questions for select to anon, authenticated using (true);

create policy "portfolio_anonymous_questions_insert_anon"
  on public.portfolio_anonymous_questions for insert to anon, authenticated with check (true);

revoke update, delete on public.portfolio_anonymous_questions from anon, authenticated;

-- 4) Blog likes + comments
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

drop policy if exists "portfolio_blog_posts_meta_select_anon" on public.portfolio_blog_posts_meta;
create policy "portfolio_blog_posts_meta_select_anon"
  on public.portfolio_blog_posts_meta for select to anon, authenticated using (true);
revoke insert, update, delete on public.portfolio_blog_posts_meta from anon, authenticated;

drop policy if exists "portfolio_blog_comments_select_anon" on public.portfolio_blog_comments;
drop policy if exists "portfolio_blog_comments_insert_anon" on public.portfolio_blog_comments;
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
declare v_count int;
begin
  insert into public.portfolio_blog_posts_meta (post_id, likes_count, updated_at)
  values (p_post_id, 1, now())
  on conflict (post_id) do update
  set likes_count = public.portfolio_blog_posts_meta.likes_count + 1, updated_at = now()
  returning likes_count into v_count;
  return v_count;
end;
$$;
revoke all on function public.increment_blog_likes(text) from public;
grant execute on function public.increment_blog_likes(text) to anon, authenticated;

-- 5) Timeline posts + media upload bucket
create table if not exists public.portfolio_timeline_posts (
  id uuid primary key default gen_random_uuid(),
  body text not null default '',
  media_url text,
  media_path text,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  constraint portfolio_timeline_posts_not_empty
    check (length(trim(body)) > 0 or media_url is not null),
  constraint portfolio_timeline_posts_body_length
    check (char_length(body) <= 2000)
);

create index if not exists portfolio_timeline_posts_created_idx
  on public.portfolio_timeline_posts (created_at desc);

alter table public.portfolio_timeline_posts enable row level security;

drop policy if exists "portfolio_timeline_posts_select_anon"
  on public.portfolio_timeline_posts;
drop policy if exists "portfolio_timeline_posts_insert_anon"
  on public.portfolio_timeline_posts;

create policy "portfolio_timeline_posts_select_anon"
  on public.portfolio_timeline_posts
  for select
  to anon, authenticated
  using (true);

create policy "portfolio_timeline_posts_insert_anon"
  on public.portfolio_timeline_posts
  for insert
  to anon, authenticated
  with check (
    char_length(body) <= 2000
    and (media_type is null or media_type in ('image', 'video'))
    and (
      media_url is null
      or media_url like '%/storage/v1/object/public/portfolio-feed-media/feed/%'
    )
  );

revoke update, delete on public.portfolio_timeline_posts from anon, authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio-feed-media',
  'portfolio-feed-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "portfolio_feed_media_select_public"
  on storage.objects;
drop policy if exists "portfolio_feed_media_insert_anon"
  on storage.objects;

create policy "portfolio_feed_media_select_public"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-feed-media');

create policy "portfolio_feed_media_insert_anon"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'portfolio-feed-media'
    and (storage.foldername(name))[1] = 'feed'
  );

-- 6) Timeline likes + threaded comments
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
