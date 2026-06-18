-- Migration 016: Clear hardcoded default data
-- Removes IIHC-specific institution details (seeded by migration 005) and
-- period length / time slot settings that are no longer managed via the UI.
-- Institution values are only cleared if they still match the original seed
-- (won't overwrite user-customized values).

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

-- Remove period length and time slot settings (no longer exposed in Settings UI;
-- export handler uses hardcoded fallbacks: 07:00, 21:00, 60 min).
DELETE FROM app_settings WHERE key IN (
  'shs_period_length',
  'college_period_length',
  'shs_time_slot_start',
  'shs_time_slot_end',
  'college_time_slot_start',
  'college_time_slot_end'
);
