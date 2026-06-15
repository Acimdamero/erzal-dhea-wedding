-- Hapus entri uji/coba dari wishes & rsvp_responses
-- Jalankan di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bebdiinqomsclynxvpbm/sql/new
--
-- Test data (2026-06-15):
--   wishes: RLSTest, Setup Test
--   rsvp:   RLSTest, Setup Test

-- ---------------------------------------------------------------------------
-- HAPUS — by ID spesifik
-- ---------------------------------------------------------------------------
DELETE FROM wishes
WHERE id IN (
  'e49e648e-0277-4ede-aa99-dfc545766ff8',  -- RLSTest
  'ac3ad82b-c8dc-48a5-b613-587ba9080f90'   -- Setup Test
);

DELETE FROM rsvp_responses
WHERE id IN (
  '16bb8d63-04fe-403f-ab4b-83eac0ece596',  -- RLSTest
  '50c3b2d9-3fe7-4dc4-817d-42d4c8a62200'   -- Setup Test
);

-- ---------------------------------------------------------------------------
-- HAPUS — by nama uji (fallback)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- VERIFIKASI (harus 0 baris)
-- ---------------------------------------------------------------------------
SELECT id, name FROM wishes
WHERE name ILIKE 'ReviewTest'
   OR name ILIKE 'RLSTest'
   OR name ILIKE 'Setup Test'
   OR name ILIKE 'SetupTest'
   OR name ILIKE 'HandoffReviewTest';

SELECT id, name FROM rsvp_responses
WHERE name ILIKE 'ReviewTest'
   OR name ILIKE 'RLSTest'
   OR name ILIKE 'Setup Test'
   OR name ILIKE 'SetupTest'
   OR name ILIKE 'HandoffReviewTest';
