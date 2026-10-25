create type public.memorial_visibility as enum ('public', 'unlisted', 'private');

create table public.memorials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  birth_date date,
  death_date date,
  story text check (story is null or char_length(story) <= 10000),
  visibility public.memorial_visibility not null default 'unlisted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (birth_date is null or death_date is null or birth_date <= death_date)
);

create index memorials_owner_created_idx
  on public.memorials (owner_id, created_at desc);

create index memorials_public_created_idx
  on public.memorials (created_at desc)
  where visibility = 'public';

create function public.set_memorial_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.set_memorial_updated_at() from public, anon, authenticated;

create trigger memorials_set_updated_at
before update on public.memorials
for each row execute function public.set_memorial_updated_at();

create table public.memorial_media (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf')
  ),
  size_bytes bigint not null check (size_bytes between 1 and 52428800),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index memorial_media_memorial_idx
  on public.memorial_media (memorial_id, created_at);

alter table public.memorials enable row level security;
alter table public.memorial_media enable row level security;

grant select, insert, update, delete on public.memorials to authenticated;
grant select, insert, update, delete on public.memorial_media to authenticated;
grant select on public.memorials to anon;
grant select on public.memorial_media to anon;

create policy "Owners manage their memorials"
  on public.memorials for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Visitors view shared memorials"
  on public.memorials for select to anon, authenticated
  using (
    visibility in ('public', 'unlisted')
    or owner_id = (select auth.uid())
  );

create policy "Owners manage memorial media"
  on public.memorial_media for all to authenticated
  using (
    exists (
      select 1 from public.memorials
      where memorials.id = memorial_media.memorial_id
        and memorials.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.memorials
      where memorials.id = memorial_media.memorial_id
        and memorials.owner_id = (select auth.uid())
    )
  );

create policy "Visitors view explicitly shared media"
  on public.memorial_media for select to anon, authenticated
  using (
    is_public
    and exists (
      select 1 from public.memorials
      where memorials.id = memorial_media.memorial_id
        and memorials.visibility in ('public', 'unlisted')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memorial-media',
  'memorial-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners upload memorial media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memorial-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.memorials
      where memorials.id::text = (storage.foldername(name))[2]
        and memorials.owner_id = (select auth.uid())
    )
  );

create policy "Owners read their media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memorial-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Visitors read explicitly shared media"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'memorial-media'
    and exists (
      select 1
      from public.memorial_media media
      join public.memorials memorial on memorial.id = media.memorial_id
      where media.storage_path = name
        and media.is_public
        and memorial.visibility in ('public', 'unlisted')
    )
  );

create policy "Owners update their media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memorial-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'memorial-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners remove their media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memorial-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
