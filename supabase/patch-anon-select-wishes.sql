-- Run once in Supabase SQL Editor to enable public guest-book display
-- (anon users can read wishes for erzal-dhea slug only)

create policy if not exists "anon_select_wishes"
  on public.wishes
  for select
  to anon
  using (wedding_slug = 'erzal-dhea');
