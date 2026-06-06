-- ============================================================
-- Branch AI — database schema
-- ============================================================
-- Paste this whole file into the Supabase SQL Editor and run it.
-- It is safe to re-run: it drops/recreates policies and uses
-- "if not exists" / "on conflict" where it matters.
--
-- What it sets up:
--   1. profiles table        — one row per student (mirrors auth.users)
--   2. auto-create profile    — trigger that fills profiles on signup
--   3. documents table        — uploaded docs + their processed content
--   4. row-level security     — each student sees ONLY their own data
--   5. storage bucket         — private "documents" bucket for uploads
-- ============================================================


-- ------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid        primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles: select own" on public.profiles;
create policy "Profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);


-- ------------------------------------------------------------
-- 2. auto-create a profile row whenever an auth user is created
--    (students are added by the admin; this keeps profiles in sync)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ------------------------------------------------------------
-- 3. documents
-- ------------------------------------------------------------
create table if not exists public.documents (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles (id) on delete cascade,
  title             text        not null,
  file_path         text,
  file_type         text        check (file_type in ('pdf', 'image', 'docx')),
  status            text        not null default 'processing'
                                check (status in ('processing', 'complete', 'error')),
  processed_content jsonb,
  created_at        timestamptz not null default now()
);

-- Fast lookup of a student's documents, newest first.
create index if not exists documents_user_id_created_at_idx
  on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

drop policy if exists "Documents: select own" on public.documents;
create policy "Documents: select own"
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists "Documents: insert own" on public.documents;
create policy "Documents: insert own"
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Documents: update own" on public.documents;
create policy "Documents: update own"
  on public.documents for update
  using (auth.uid() = user_id);

drop policy if exists "Documents: delete own" on public.documents;
create policy "Documents: delete own"
  on public.documents for delete
  using (auth.uid() = user_id);


-- ------------------------------------------------------------
-- 4. storage bucket for uploaded files (private)
--    Files are stored under a per-user folder: "{user_id}/{filename}"
--    so the policies below can scope access by folder.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Storage: upload own files" on storage.objects;
create policy "Storage: upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Storage: read own files" on storage.objects;
create policy "Storage: read own files"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Storage: delete own files" on storage.objects;
create policy "Storage: delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
