create type public.family_member_role as enum (
  'admin',
  'contributor',
  'viewer'
);

create type public.family_person_status as enum (
  'living',
  'deceased',
  'unknown'
);

create type public.family_relationship_type as enum (
  'parent_of',
  'adoptive_parent_of',
  'partner_of',
  'sibling_of',
  'guardian_of',
  'other'
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  owner_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.family_member_role not null default 'viewer',
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index family_members_user_idx
  on public.family_members (user_id, family_id);

create table public.family_people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  birth_date date,
  death_date date,
  biography text check (biography is null or char_length(biography) <= 10000),
  status public.family_person_status not null default 'unknown',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, id),
  check (birth_date is null or death_date is null or birth_date <= death_date)
);

create index family_people_family_name_idx
  on public.family_people (family_id, full_name);

create table public.family_relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  person_id uuid not null,
  related_person_id uuid not null,
  relationship public.family_relationship_type not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (family_id, person_id)
    references public.family_people (family_id, id) on delete cascade,
  foreign key (family_id, related_person_id)
    references public.family_people (family_id, id) on delete cascade,
  check (person_id <> related_person_id),
  check (
    relationship not in ('partner_of', 'sibling_of')
    or person_id < related_person_id
  ),
  unique (family_id, person_id, related_person_id, relationship)
);

create index family_relationships_related_idx
  on public.family_relationships (family_id, related_person_id);

create table public.family_ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  transferred_from uuid not null references auth.users (id) on delete restrict,
  transferred_to uuid not null references auth.users (id) on delete restrict,
  transferred_at timestamptz not null default now(),
  check (transferred_from <> transferred_to)
);

create index family_ownership_transfers_family_idx
  on public.family_ownership_transfers (family_id, transferred_at desc);

alter table public.memorials
  add column family_id uuid references public.families (id) on delete set null,
  add column person_id uuid references public.family_people (id) on delete set null;

create index memorials_family_idx
  on public.memorials (family_id, created_at desc)
  where family_id is not null;

create function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.families f
    where f.id = target_family_id
      and f.owner_id = (select auth.uid())
    union all
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = (select auth.uid())
  );
$$;

create function public.can_edit_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.families f
    where f.id = target_family_id
      and f.owner_id = (select auth.uid())
    union all
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = (select auth.uid())
      and fm.role in ('admin', 'contributor')
  );
$$;

create function public.can_manage_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.families f
    where f.id = target_family_id
      and f.owner_id = (select auth.uid())
    union all
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = (select auth.uid())
      and fm.role = 'admin'
  );
$$;

create function public.is_family_collaborator(
  target_family_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.families f
    join public.family_members fm
      on fm.family_id = f.id
    where f.id = target_family_id
      and f.owner_id = (select auth.uid())
      and fm.user_id = target_user_id
  );
$$;

revoke all on function public.is_family_member(uuid) from public, anon;
revoke all on function public.can_edit_family(uuid) from public, anon;
revoke all on function public.can_manage_family(uuid) from public, anon;
revoke all on function public.is_family_collaborator(uuid, uuid) from public, anon;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.can_edit_family(uuid) to authenticated;
grant execute on function public.can_manage_family(uuid) to authenticated;
grant execute on function public.is_family_collaborator(uuid, uuid) to authenticated;

create function public.set_family_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.set_family_updated_at() from public, anon, authenticated;

create trigger families_set_updated_at
before update on public.families
for each row execute function public.set_family_updated_at();

create trigger family_people_set_updated_at
before update on public.family_people
for each row execute function public.set_family_updated_at();

create function public.validate_memorial_family_person()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  person_family_id uuid;
begin
  if new.person_id is null then
    return new;
  end if;

  if new.family_id is null then
    raise exception 'A memorial person must belong to the linked family';
  end if;

  select fp.family_id into person_family_id
  from public.family_people fp
  where fp.id = new.person_id;

  if person_family_id is distinct from new.family_id then
    raise exception 'The memorial person must belong to the linked family';
  end if;

  return new;
end;
$$;
revoke all on function public.validate_memorial_family_person() from public, anon, authenticated;

create trigger memorials_validate_family_person
before insert or update of family_id, person_id on public.memorials
for each row execute function public.validate_memorial_family_person();

create function public.prevent_memorial_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Memorial ownership cannot be changed through a memorial update';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_memorial_owner_change() from public, anon, authenticated;

create trigger memorials_prevent_owner_change
before update of owner_id on public.memorials
for each row execute function public.prevent_memorial_owner_change();

create function public.prevent_family_record_creator_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'The creator of a family record cannot be changed';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_family_record_creator_change() from public, anon, authenticated;

create trigger family_people_prevent_creator_change
before update of created_by on public.family_people
for each row execute function public.prevent_family_record_creator_change();

create trigger family_relationships_prevent_creator_change
before update of created_by on public.family_relationships
for each row execute function public.prevent_family_record_creator_change();

create function public.audit_family_ownership_transfer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    if (select auth.uid()) is distinct from old.owner_id then
      raise exception 'Only the current family owner can transfer ownership';
    end if;

    if not public.is_family_collaborator(old.id, new.owner_id) then
      raise exception 'The new owner must already be a family member';
    end if;

    insert into public.family_ownership_transfers (
      family_id,
      transferred_from,
      transferred_to
    )
    values (old.id, old.owner_id, new.owner_id);
  end if;

  return new;
end;
$$;
revoke all on function public.audit_family_ownership_transfer() from public, anon, authenticated;

create trigger families_audit_ownership_transfer
before update of owner_id on public.families
for each row execute function public.audit_family_ownership_transfer();

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_people enable row level security;
alter table public.family_relationships enable row level security;
alter table public.family_ownership_transfers enable row level security;

grant select, insert, update, delete on public.families to authenticated;
grant select, insert, update, delete on public.family_members to authenticated;
grant select, insert, update, delete on public.family_people to authenticated;
grant select, insert, update, delete on public.family_relationships to authenticated;
grant select on public.family_ownership_transfers to authenticated;
grant select, insert, update, delete on public.memorials to authenticated;

create policy "Family members view their families"
  on public.families for select to authenticated
  using (public.is_family_member(id));

create policy "Users create families they own"
  on public.families for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners update family details and transfer ownership"
  on public.families for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    or public.is_family_collaborator(id, owner_id)
  );

create policy "Owners delete their families"
  on public.families for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "Family members view memberships"
  on public.family_members for select to authenticated
  using (public.is_family_member(family_id));

create policy "Family managers add collaborators"
  on public.family_members for insert to authenticated
  with check (
    user_id <> (select auth.uid())
    and (
      public.can_manage_family(family_id)
      or (
        role <> 'admin'
        and exists (
          select 1
          from public.family_members current_member
          where current_member.family_id = family_members.family_id
            and current_member.user_id = (select auth.uid())
            and current_member.role = 'admin'
        )
      )
    )
  );

create policy "Family managers update collaborators"
  on public.family_members for update to authenticated
  using (
    public.can_manage_family(family_id)
    or (
      role <> 'admin'
      and exists (
        select 1
        from public.family_members current_member
        where current_member.family_id = family_members.family_id
          and current_member.user_id = (select auth.uid())
          and current_member.role = 'admin'
      )
    )
  )
  with check (
    public.can_manage_family(family_id)
    or (
      role <> 'admin'
      and exists (
        select 1
        from public.family_members current_member
        where current_member.family_id = family_members.family_id
          and current_member.user_id = (select auth.uid())
          and current_member.role = 'admin'
      )
    )
  );

create policy "Family managers remove collaborators"
  on public.family_members for delete to authenticated
  using (
    public.can_manage_family(family_id)
    or (
      role <> 'admin'
      and exists (
        select 1
        from public.family_members current_member
        where current_member.family_id = family_members.family_id
          and current_member.user_id = (select auth.uid())
          and current_member.role = 'admin'
      )
    )
  );

create policy "Family members view the family tree"
  on public.family_people for select to authenticated
  using (public.is_family_member(family_id));

create policy "Family editors manage people"
  on public.family_people for insert to authenticated
  with check (
    public.can_edit_family(family_id)
    and created_by = (select auth.uid())
  );

create policy "Family editors update people"
  on public.family_people for update to authenticated
  using (public.can_edit_family(family_id))
  with check (public.can_edit_family(family_id));

create policy "Family editors remove people"
  on public.family_people for delete to authenticated
  using (public.can_edit_family(family_id));

create policy "Family members view relationships"
  on public.family_relationships for select to authenticated
  using (public.is_family_member(family_id));

create policy "Family editors manage relationships"
  on public.family_relationships for insert to authenticated
  with check (
    public.can_edit_family(family_id)
    and created_by = (select auth.uid())
  );

create policy "Family editors update relationships"
  on public.family_relationships for update to authenticated
  using (public.can_edit_family(family_id))
  with check (public.can_edit_family(family_id));

create policy "Family editors remove relationships"
  on public.family_relationships for delete to authenticated
  using (public.can_edit_family(family_id));

create policy "Family members view ownership history"
  on public.family_ownership_transfers for select to authenticated
  using (public.is_family_member(family_id));

create policy "Family members view linked memorials"
  on public.memorials for select to authenticated
  using (
    family_id is not null
    and public.is_family_member(family_id)
  );

create policy "Family editors manage linked memorials"
  on public.memorials for all to authenticated
  using (
    family_id is not null
    and public.can_edit_family(family_id)
  )
  with check (
    family_id is not null
    and public.can_edit_family(family_id)
  );

create policy "Family editors upload memorial media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memorial-media'
    and exists (
      select 1
      from public.memorials m
      where m.id::text = (storage.foldername(name))[2]
        and m.family_id is not null
        and public.can_edit_family(m.family_id)
    )
  );

create policy "Family editors read memorial media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memorial-media'
    and exists (
      select 1
      from public.memorials m
      where m.id::text = (storage.foldername(name))[2]
        and m.family_id is not null
        and public.can_edit_family(m.family_id)
    )
  );

create policy "Family editors update memorial media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memorial-media'
    and exists (
      select 1
      from public.memorials m
      where m.id::text = (storage.foldername(name))[2]
        and m.family_id is not null
        and public.can_edit_family(m.family_id)
    )
  )
  with check (
    bucket_id = 'memorial-media'
    and exists (
      select 1
      from public.memorials m
      where m.id::text = (storage.foldername(name))[2]
        and m.family_id is not null
        and public.can_edit_family(m.family_id)
    )
  );

create policy "Family editors remove memorial media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memorial-media'
    and exists (
      select 1
      from public.memorials m
      where m.id::text = (storage.foldername(name))[2]
        and m.family_id is not null
        and public.can_edit_family(m.family_id)
    )
  );
