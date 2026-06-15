-- Jalankan sekali di Supabase SQL Editor sebelum serah terima ke klien:
-- https://supabase.com/dashboard/project/bebdiinqomsclynxvpbm/sql/new

-- 1) Aktifkan tampilan ucapan tamu di situs publik
-- (PostgreSQL tidak mendukung CREATE POLICY IF NOT EXISTS)
DROP POLICY IF EXISTS "anon_select_wishes" ON public.wishes;
CREATE POLICY "anon_select_wishes"
  ON public.wishes
  FOR SELECT
  TO anon
  USING (wedding_slug = 'erzal-dhea');

-- 2) Hapus semua entri uji
DELETE FROM wishes
WHERE name ILIKE 'ReviewTest'
   OR name ILIKE 'RLSTest'
   OR name ILIKE 'Setup Test'
   OR name ILIKE 'SetupTest'
   OR name ILIKE 'HandoffReviewTest';

DELETE FROM rsvp_responses
WHERE name ILIKE 'ReviewTest'
   OR name ILIKE 'RLSTest'
   OR name ILIKE 'Setup Test'
   OR name ILIKE 'SetupTest'
   OR name ILIKE 'HandoffReviewTest';

-- Verifikasi (harus 0 baris)
SELECT id, name FROM wishes
WHERE name ILIKE '%test%';

SELECT id, name FROM rsvp_responses
WHERE name ILIKE '%test%';
