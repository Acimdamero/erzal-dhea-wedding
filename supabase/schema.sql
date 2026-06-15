-- Wedding Invitation — Erzal & Dhea
-- Supabase schema: RSVP + Wishes with Row Level Security
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text,
  email text,
  attendance text not null,
  guest_count int not null default 1,
  message text,
  event_type text not null default 'resepsi',
  wedding_slug text not null default 'erzal-dhea',
  constraint rsvp_attendance_check check (
    attendance in ('hadir', 'tidak_hadir', 'ragu')
  ),
  constraint rsvp_event_type_check check (
    event_type in ('akad', 'resepsi', 'both')
  ),
  constraint rsvp_guest_count_check check (guest_count >= 1 and guest_count <= 20)
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  message text not null,
  wedding_slug text not null default 'erzal-dhea'
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists rsvp_responses_created_at_idx
  on public.rsvp_responses (created_at desc);

create index if not exists rsvp_responses_wedding_slug_idx
  on public.rsvp_responses (wedding_slug);

create index if not exists rsvp_responses_attendance_idx
  on public.rsvp_responses (attendance);

create index if not exists wishes_created_at_idx
  on public.wishes (created_at desc);

create index if not exists wishes_wedding_slug_idx
  on public.wishes (wedding_slug);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.rsvp_responses enable row level security;
alter table public.wishes enable row level security;

-- Public (anon): INSERT only — guests submit RSVP & wishes from the website
create policy "anon_insert_rsvp"
  on public.rsvp_responses
  for insert
  to anon
  with check (true);

create policy "anon_insert_wishes"
  on public.wishes
  for insert
  to anon
  with check (true);

-- Authenticated admin: SELECT only — dashboard reads reports after Supabase Auth login
create policy "auth_select_rsvp"
  on public.rsvp_responses
  for select
  to authenticated
  using (true);

create policy "auth_select_wishes"
  on public.wishes
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Optional: restrict admin reads to one wedding slug (uncomment if needed)
-- ---------------------------------------------------------------------------
-- drop policy if exists "auth_select_rsvp" on public.rsvp_responses;
-- drop policy if exists "auth_select_wishes" on public.wishes;
--
-- create policy "auth_select_rsvp"
--   on public.rsvp_responses
--   for select
--   to authenticated
--   using (wedding_slug = 'erzal-dhea');
--
-- create policy "auth_select_wishes"
--   on public.wishes
--   for select
--   to authenticated
--   using (wedding_slug = 'erzal-dhea');
