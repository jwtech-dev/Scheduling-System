import sqlite3
import os

# Get the path to the database in AppData
db_path = os.path.expandvars(r'%APPDATA%\sched-mng\schedule-manager.db')

if not os.path.exists(db_path):
    print(f"Error: Database file not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Prepared hashes:
# PASS (AdminPassword123): $2a$10$6zkuap6Ha2qZcPPeW0PhherHtdQCCvMcoyiH/TkhtbAyf88bwhn4i
# ANS1 (fluffy): $2a$10$H1v/Ji8lp0d8npyeVDYtDuTwJcfIu8b8LmcE.9qHgcmOE2NyYmRtO
# ANS2 (josh): $2a$10$jvTr88WluQC0V3NPU4qDbeDGWb51tuvVB1HOSb7C09ARt2HS.ixti
settings = [
    ('admin_password_hash', '$2a$10$6zkuap6Ha2qZcPPeW0PhherHtdQCCvMcoyiH/TkhtbAyf88bwhn4i'),
    ('security_question_1', 'What was the name of your first pet?'),
    ('security_answer_hash_1', '$2a$10$H1v/Ji8lp0d8npyeVDYtDuTwJcfIu8b8LmcE.9qHgcmOE2NyYmRtO'),
    ('security_question_2', 'What was your childhood nickname?'),
    ('security_answer_hash_2', '$2a$10$jvTr88WluQC0V3NPU4qDbeDGWb51tuvVB1HOSb7C09ARt2HS.ixti')
]

for key, value in settings:
    cursor.execute('''
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    ''', (key, value))

conn.commit()
conn.close()

print("==========================================================")
print("SUCCESS: Credentials and security questions reset!")
print("==========================================================")
print("New Login Password: AdminPassword123")
print("----------------------------------------------------------")
print("Security Question 1: What was the name of your first pet?")
print("  Answer to enter: fluffy")
print("----------------------------------------------------------")
print("Security Question 2: What was your childhood nickname?")
print("  Answer to enter: josh")
print("==========================================================")
