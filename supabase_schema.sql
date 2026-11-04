-- ============================================================================
-- DIFOTOIN — Client Photo Proofing & Digital Album Web Application (Zeevisual)
-- Supabase PostgreSQL Schema, Indexes, RLS Policies & Demo Seed Data
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  order_code text not null default '#ZV-7910',
  studio_slug text not null default 'zeevisual',
  studio_name text not null default 'Zeevisual',
  client_name text not null,
  slug text not null unique,
  session_type text not null default 'Editorial Pre-Wedding',
  session_date text not null default '14 Oktober 2024',
  deadline_date text not null default '28 Oktober 2024',
  gdrive_folder_url text not null,
  gdrive_folder_id text not null,
  selection_quota integer not null default 50 check (selection_quota > 0),
  owner_token text not null check (char_length(owner_token) >= 8),
  cover_photo_id text,
  album_pin text check (album_pin is null or char_length(album_pin) = 4),
  hidden_photo_ids text[] not null default '{}',
  is_locked boolean not null default false,
  watermark_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.selections (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id text not null,
  filename text not null,
  note text not null default '',
  selected_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint selections_gallery_photo_unique unique (gallery_id, photo_id)
);

-- ============================================================================
-- 2. PERFORMANCE INDEXES
-- ============================================================================

create index if not exists idx_galleries_slug
  on public.galleries (slug);

create index if not exists idx_galleries_studio_slug_slug
  on public.galleries (studio_slug, slug);

create index if not exists idx_galleries_owner_token
  on public.galleries (owner_token);

create index if not exists idx_galleries_created_at
  on public.galleries (created_at desc);

create index if not exists idx_selections_gallery_id
  on public.selections (gallery_id);

create index if not exists idx_selections_gallery_order
  on public.selections (gallery_id, selected_order asc);

-- ============================================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_galleries_updated_at on public.galleries;
create trigger set_galleries_updated_at
  before update on public.galleries
  for each row
  execute function public.handle_updated_at();

drop trigger if exists set_selections_updated_at on public.selections;
create trigger set_selections_updated_at
  before update on public.selections
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- 4. EXPOSE TO SUPABASE DATA API & ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.galleries to anon, authenticated;
grant select, insert, update, delete on public.selections to anon, authenticated;

alter table public.galleries enable row level security;
alter table public.selections enable row level security;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

drop policy if exists "galleries_public_select" on public.galleries;
create policy "galleries_public_select"
  on public.galleries
  for select
  to anon, authenticated
  using (true);

drop policy if exists "galleries_public_insert" on public.galleries;
create policy "galleries_public_insert"
  on public.galleries
  for insert
  to anon, authenticated
  with check (
    char_length(slug) > 0
    and char_length(owner_token) >= 8
  );

drop policy if exists "galleries_token_update" on public.galleries;
create policy "galleries_token_update"
  on public.galleries
  for update
  to anon, authenticated
  using (
    coalesce(
      (current_setting('request.headers', true)::json ->> 'x-owner-token') = owner_token,
      true
    )
  )
  with check (
    char_length(owner_token) >= 8
  );

drop policy if exists "selections_public_select" on public.selections;
create policy "selections_public_select"
  on public.selections
  for select
  to anon, authenticated
  using (true);

drop policy if exists "selections_client_insert" on public.selections;
create policy "selections_client_insert"
  on public.selections
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.galleries g
      where g.id = gallery_id
        and g.is_locked = false
    )
  );

drop policy if exists "selections_client_update" on public.selections;
create policy "selections_client_update"
  on public.selections
  for update
  to anon, authenticated
  using (
    exists (
      select 1
      from public.galleries g
      where g.id = gallery_id
        and g.is_locked = false
    )
  )
  with check (
    exists (
      select 1
      from public.galleries g
      where g.id = gallery_id
        and g.is_locked = false
    )
  );

drop policy if exists "selections_client_delete" on public.selections;
create policy "selections_client_delete"
  on public.selections
  for delete
  to anon, authenticated
  using (
    exists (
      select 1
      from public.galleries g
      where g.id = gallery_id
        and g.is_locked = false
    )
  );

-- ============================================================================
-- 6. SEED DEMO DATA (Aida Fitri Harahab — Zeevisual)
-- ============================================================================

insert into public.galleries (
  id,
  order_code,
  studio_slug,
  studio_name,
  client_name,
  slug,
  session_type,
  session_date,
  deadline_date,
  gdrive_folder_url,
  gdrive_folder_id,
  selection_quota,
  owner_token,
  cover_photo_id,
  album_pin,
  hidden_photo_ids,
  is_locked,
  watermark_enabled
)
values (
  '11111111-1111-4111-8111-111111111111',
  '#ZV-7910',
  'zeevisual',
  'Zeevisual',
  'Aida Fitri Harahab',
  'aida-fitri-harahab',
  'Editorial Pre-Wedding',
  '14 Oktober 2024',
  '28 Oktober 2024',
  'https://drive.google.com/drive/folders/1x9BAidaFauziRAW74Editorial',
  '1x9BAidaFauziRAW74Editorial',
  50,
  'mhttesqg7rjx',
  'photo-01',
  '2408',
  ARRAY['photo-08'],
  false,
  true
)
on conflict (slug) do update set
  studio_slug = excluded.studio_slug,
  studio_name = excluded.studio_name,
  order_code = excluded.order_code;

insert into public.selections (gallery_id, photo_id, filename, note, selected_order)
values
  ('11111111-1111-4111-8111-111111111111', 'photo-01', 'ZV_0488.JPG', 'Tolong ratakan pencahayaan di bagian latar belakang taman & bersihkan bayangan di pipi.', 1),
  ('11111111-1111-4111-8111-111111111111', 'photo-02', 'ZV_0489.JPG', 'Jadikan spread halaman tengah buku album.', 2),
  ('11111111-1111-4111-8111-111111111111', 'photo-05', 'ZV_0501.JPG', 'Warna kebaya jangan terlalu putih, buat bernuansa krem hangat.', 3),
  ('11111111-1111-4111-8111-111111111111', 'photo-07', 'ZV_0514.JPG', 'Pertahankan kontras hitam putih ini.', 4),
  ('11111111-1111-4111-8111-111111111111', 'photo-09', 'ZV_0520.JPG', 'Tonjolkan kilau cincin emas dengan grain halus.', 5),
  ('11111111-1111-4111-8111-111111111111', 'photo-10', 'ZV_0525.JPG', '', 6)
on conflict (gallery_id, photo_id) do nothing;
