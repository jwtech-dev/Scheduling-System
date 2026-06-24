import sqlite3, os
conn = sqlite3.connect(os.path.expandvars(r'%APPDATA%\sched-mng\schedule-manager.db'))
r = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log'").fetchone()
print('audit_log exists:', r)
if r:
    print([c[1] for c in conn.execute('PRAGMA table_info(audit_log)').fetchall()])
