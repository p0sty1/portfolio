-- Timeline posts: public read/insert text + optional uploaded image/video.

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
