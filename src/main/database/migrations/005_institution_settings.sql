-- Migration 005: Seed institution detail settings
-- These settings were missing from the original setup seed, causing empty export headers.
-- Uses INSERT OR IGNORE so it won't overwrite values if they already exist.

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('institution_name', 'INTEGRATED INNOVATION AND HOSPITALITY COLLEGES, INC.', datetime('now'));

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('institution_address', 'Buenamar St. Brgy. Novaliches Proper, Novaliches, Quezon City', datetime('now'));

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('institution_contact', 'Tel. No. 7754-9645 Mobile No. 0919-893-4789 0917-125-4442', datetime('now'));

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('institution_email', 'iihcolleges@gmail.com', datetime('now'));
