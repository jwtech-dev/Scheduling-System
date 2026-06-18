-- Migration 016: Clear hardcoded institution defaults
-- Migration 005 seeded IIHC-specific institution details on every fresh install.
-- This migration resets them to empty strings so a fresh app has no prefilled data.
-- Only clears rows that still hold the original seeded values (won't overwrite
-- user-customized values).

UPDATE app_settings SET value = '', updated_at = datetime('now')
WHERE key = 'institution_name'
  AND value = 'INTEGRATED INNOVATION AND HOSPITALITY COLLEGES, INC.';

UPDATE app_settings SET value = '', updated_at = datetime('now')
WHERE key = 'institution_address'
  AND value = 'Buenamar St. Brgy. Novaliches Proper, Novaliches, Quezon City';

UPDATE app_settings SET value = '', updated_at = datetime('now')
WHERE key = 'institution_contact'
  AND value = 'Tel. No. 7754-9645 Mobile No. 0919-893-4789 0917-125-4442';

UPDATE app_settings SET value = '', updated_at = datetime('now')
WHERE key = 'institution_email'
  AND value = 'iihcolleges@gmail.com';
