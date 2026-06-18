const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.env.APPDATA, 'sched-mng', 'schedule-manager.db');
console.log('DB Path:', dbPath);
try {
  const db = new Database(dbPath);
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'admin_password_hash'").get();
  console.log('ROW:', row);
  console.log('hasAdminPassword:', row !== undefined && row.value !== null && row.value.length > 0);
  db.close();
} catch (err) {
  console.error('ERROR:', err);
}
