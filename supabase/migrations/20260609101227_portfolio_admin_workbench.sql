-- Admin workbench support: site scopes, moderation states, and safer public RLS.

create table if not exists public.portfolio_sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (
    char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9][a-z0-9-]*$'
  ),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists portfolio_sites_single_default_idx
  on public.portfolio_sites (is_default)
  where is_default;

insert into public.portfolio_sites (slug, title, description, is_default, sort_order)
values ('main', '主主页', '默认公开主页', true, 0)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  is_default = true,
  is_active = true,
  updated_at = now();

create or replace function public.portfolio_default_site_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select id
  from public.portfolio_sites
  where is_default
  order by created_at asc
  limit 1;
$$;

create or replace function public.touch_portfolio_sites_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_portfolio_sites_updated_at
  on public.portfolio_sites;

create trigger touch_portfolio_sites_updated_at
  before update on public.portfolio_sites
  for each row
  execute function public.touch_portfolio_sites_updated_at();

alter table public.portfolio_sites enable row level security;

drop policy if exists "portfolio_sites_select_public"
  on public.portfolio_sites;

create policy "portfolio_sites_select_public"
  on public.portfolio_sites
  for select
  to anon, authenticated
  using (is_active);

grant select on public.portfolio_sites to anon, authenticated;
grant all on public.portfolio_sites to service_role;

revoke all on function public.portfolio_default_site_id() from public;
grant execute on function public.portfolio_default_site_id()
  to anon, authenticated, service_role;
revoke all on function public.touch_portfolio_sites_updated_at() from public;

-- Anonymous Q&A moderation.

alter table public.portfolio_anonymous_questions
  add column if not exists site_id uuid,
  add column if not exists status text,
  add column if not exists hidden_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists moderated_at timestamptz;

update public.portfolio_anonymous_questions
set
  site_id = coalesce(site_id, public.portfolio_default_site_id()),
  status = coalesce(
    status,
    case when nullif(trim(coalesce(answer, '')), '') is null
      then 'pending'
      else 'answered'
    end
  )
where site_id is null
  or status is null;

alter table public.portfolio_anonymous_questions
  alter column site_id set default public.portfolio_default_site_id(),
  alter column site_id set not null,
  alter column status set default 'pending',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_anonymous_questions_site_fk'
  ) then
    alter table public.portfolio_anonymous_questions
      add constraint portfolio_anonymous_questions_site_fk
      foreign key (site_id) references public.portfolio_sites(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_anonymous_questions_status_check'
  ) then
    alter table public.portfolio_anonymous_questions
      add constraint portfolio_anonymous_questions_status_check
      check (status in ('pending', 'answered', 'hidden', 'deleted'));
  end if;
end;
$$;

create index if not exists portfolio_anonymous_questions_site_status_created_idx
  on public.portfolio_anonymous_questions (site_id, status, created_at desc)
  where deleted_at is null;

drop policy if exists "portfolio_anonymous_questions_select_anon"
  on public.portfolio_anonymous_questions;
drop policy if exists "portfolio_anonymous_questions_insert_anon"
  on public.portfolio_anonymous_questions;

create policy "portfolio_anonymous_questions_select_anon"
  on public.portfolio_anonymous_questions
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status in ('pending', 'answered')
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

create policy "portfolio_anonymous_questions_insert_anon"
  on public.portfolio_anonymous_questions
  for insert
  to anon, authenticated
  with check (
    answer is null
    and answered_at is null
    and hidden_at is null
    and deleted_at is null
    and moderated_at is null
    and status = 'pending'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

grant select, insert on public.portfolio_anonymous_questions
  to anon, authenticated;
revoke update, delete on public.portfolio_anonymous_questions
  from anon, authenticated;
grant all on public.portfolio_anonymous_questions to service_role;

-- Guestbook moderation for the existing demo notes table.

alter table public.portfolio_demo_notes
  add column if not exists site_id uuid,
  add column if not exists status text,
  add column if not exists hidden_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists moderated_at timestamptz;

update public.portfolio_demo_notes
set
  site_id = coalesce(site_id, public.portfolio_default_site_id()),
  status = coalesce(status, 'published')
where site_id is null
  or status is null;

alter table public.portfolio_demo_notes
  alter column site_id set default public.portfolio_default_site_id(),
  alter column site_id set not null,
  alter column status set default 'published',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_demo_notes_site_fk'
  ) then
    alter table public.portfolio_demo_notes
      add constraint portfolio_demo_notes_site_fk
      foreign key (site_id) references public.portfolio_sites(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_demo_notes_status_check'
  ) then
    alter table public.portfolio_demo_notes
      add constraint portfolio_demo_notes_status_check
      check (status in ('published', 'hidden', 'deleted'));
  end if;
end;
$$;

create index if not exists portfolio_demo_notes_site_status_created_idx
  on public.portfolio_demo_notes (site_id, status, created_at desc)
  where deleted_at is null;

drop policy if exists "portfolio_demo_notes_select_anon"
  on public.portfolio_demo_notes;
drop policy if exists "portfolio_demo_notes_insert_anon"
  on public.portfolio_demo_notes;

create policy "portfolio_demo_notes_select_anon"
  on public.portfolio_demo_notes
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

create policy "portfolio_demo_notes_insert_anon"
  on public.portfolio_demo_notes
  for insert
  to anon, authenticated
  with check (
    status = 'published'
    and hidden_at is null
    and deleted_at is null
    and moderated_at is null
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

grant select, insert on public.portfolio_demo_notes to anon, authenticated;
revoke update, delete on public.portfolio_demo_notes from anon, authenticated;
grant all on public.portfolio_demo_notes to service_role;

-- Timeline post moderation. Publishing now belongs to the Worker admin API.

alter table public.portfolio_timeline_posts
  add column if not exists site_id uuid,
  add column if not exists status text,
  add column if not exists hidden_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists moderated_at timestamptz;

update public.portfolio_timeline_posts
set
  site_id = coalesce(site_id, public.portfolio_default_site_id()),
  status = coalesce(status, 'published')
where site_id is null
  or status is null;

alter table public.portfolio_timeline_posts
  alter column site_id set default public.portfolio_default_site_id(),
  alter column site_id set not null,
  alter column status set default 'published',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_timeline_posts_site_fk'
  ) then
    alter table public.portfolio_timeline_posts
      add constraint portfolio_timeline_posts_site_fk
      foreign key (site_id) references public.portfolio_sites(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_timeline_posts_status_check'
  ) then
    alter table public.portfolio_timeline_posts
      add constraint portfolio_timeline_posts_status_check
      check (status in ('published', 'hidden', 'deleted'));
  end if;
end;
$$;

create index if not exists portfolio_timeline_posts_site_status_created_idx
  on public.portfolio_timeline_posts (site_id, status, created_at desc)
  where deleted_at is null;

drop policy if exists "portfolio_timeline_posts_select_anon"
  on public.portfolio_timeline_posts;
drop policy if exists "portfolio_timeline_posts_insert_anon"
  on public.portfolio_timeline_posts;

create policy "portfolio_timeline_posts_select_anon"
  on public.portfolio_timeline_posts
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

grant select on public.portfolio_timeline_posts to anon, authenticated;
revoke insert, update, delete on public.portfolio_timeline_posts
  from anon, authenticated;
grant all on public.portfolio_timeline_posts to service_role;

-- Timeline comment moderation and site syncing.

alter table public.portfolio_timeline_comments
  add column if not exists site_id uuid,
  add column if not exists status text,
  add column if not exists hidden_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists moderated_at timestamptz;

update public.portfolio_timeline_comments comments
set site_id = posts.site_id
from public.portfolio_timeline_posts posts
where comments.post_id = posts.id
  and comments.site_id is null;

update public.portfolio_timeline_comments
set
  site_id = coalesce(site_id, public.portfolio_default_site_id()),
  status = coalesce(status, 'published')
where site_id is null
  or status is null;

alter table public.portfolio_timeline_comments
  alter column site_id set default public.portfolio_default_site_id(),
  alter column site_id set not null,
  alter column status set default 'published',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_timeline_comments_site_fk'
  ) then
    alter table public.portfolio_timeline_comments
      add constraint portfolio_timeline_comments_site_fk
      foreign key (site_id) references public.portfolio_sites(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_timeline_comments_status_check'
  ) then
    alter table public.portfolio_timeline_comments
      add constraint portfolio_timeline_comments_status_check
      check (status in ('published', 'hidden', 'deleted'));
  end if;
end;
$$;

create or replace function public.set_timeline_comment_site_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_site_id uuid;
begin
  select site_id
  into v_site_id
  from public.portfolio_timeline_posts
  where id = new.post_id;

  if v_site_id is null then
    raise exception 'timeline post not found';
  end if;

  new.site_id = v_site_id;

  return new;
end;
$$;

drop trigger if exists set_timeline_comment_site_id
  on public.portfolio_timeline_comments;

create trigger set_timeline_comment_site_id
  before insert or update of post_id on public.portfolio_timeline_comments
  for each row
  execute function public.set_timeline_comment_site_id();

create index if not exists portfolio_timeline_comments_site_status_created_idx
  on public.portfolio_timeline_comments (site_id, status, created_at desc)
  where deleted_at is null;

drop policy if exists "portfolio_timeline_comments_select_anon"
  on public.portfolio_timeline_comments;
drop policy if exists "portfolio_timeline_comments_insert_anon"
  on public.portfolio_timeline_comments;

create policy "portfolio_timeline_comments_select_anon"
  on public.portfolio_timeline_comments
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

create policy "portfolio_timeline_comments_insert_anon"
  on public.portfolio_timeline_comments
  for insert
  to anon, authenticated
  with check (
    status = 'published'
    and hidden_at is null
    and deleted_at is null
    and moderated_at is null
    and exists (
      select 1
      from public.portfolio_timeline_posts posts
      where posts.id = post_id
        and posts.status = 'published'
        and posts.deleted_at is null
    )
  );

grant select, insert on public.portfolio_timeline_comments
  to anon, authenticated;
revoke update, delete on public.portfolio_timeline_comments
  from anon, authenticated;
grant all on public.portfolio_timeline_comments to service_role;

revoke all on function public.set_timeline_comment_site_id() from public;

-- Blog comments moderation.

alter table public.portfolio_blog_comments
  add column if not exists site_id uuid,
  add column if not exists status text,
  add column if not exists hidden_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists moderated_at timestamptz;

update public.portfolio_blog_comments
set
  site_id = coalesce(site_id, public.portfolio_default_site_id()),
  status = coalesce(status, 'published')
where site_id is null
  or status is null;

alter table public.portfolio_blog_comments
  alter column site_id set default public.portfolio_default_site_id(),
  alter column site_id set not null,
  alter column status set default 'published',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_blog_comments_site_fk'
  ) then
    alter table public.portfolio_blog_comments
      add constraint portfolio_blog_comments_site_fk
      foreign key (site_id) references public.portfolio_sites(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'portfolio_blog_comments_status_check'
  ) then
    alter table public.portfolio_blog_comments
      add constraint portfolio_blog_comments_status_check
      check (status in ('published', 'hidden', 'deleted'));
  end if;
end;
$$;

create index if not exists portfolio_blog_comments_site_status_created_idx
  on public.portfolio_blog_comments (site_id, status, created_at desc)
  where deleted_at is null;

drop policy if exists "portfolio_blog_comments_select_anon"
  on public.portfolio_blog_comments;
drop policy if exists "portfolio_blog_comments_insert_anon"
  on public.portfolio_blog_comments;

create policy "portfolio_blog_comments_select_anon"
  on public.portfolio_blog_comments
  for select
  to anon, authenticated
  using (
    deleted_at is null
    and status = 'published'
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

create policy "portfolio_blog_comments_insert_anon"
  on public.portfolio_blog_comments
  for insert
  to anon, authenticated
  with check (
    status = 'published'
    and hidden_at is null
    and deleted_at is null
    and moderated_at is null
    and exists (
      select 1
      from public.portfolio_sites sites
      where sites.id = site_id
        and sites.is_active
    )
  );

grant select, insert on public.portfolio_blog_comments
  to anon, authenticated;
revoke update, delete on public.portfolio_blog_comments
  from anon, authenticated;
grant all on public.portfolio_blog_comments to service_role;

grant select on public.portfolio_blog_posts_meta to anon, authenticated;
grant all on public.portfolio_blog_posts_meta to service_role;
