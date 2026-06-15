-- Run once in Supabase SQL Editor to enable public guest-book display
-- (anon users can read wishes for erzal-dhea slug only)

DROP POLICY IF EXISTS "anon_select_wishes" ON public.wishes;
CREATE POLICY "anon_select_wishes"
  ON public.wishes
  FOR SELECT
  TO anon
  USING (wedding_slug = 'erzal-dhea');
