"""
Full Seed Script — Schedule Management System
===============================================
Resets and populates the database with comprehensive data covering ALL features:
  1.  Admin account + institution settings
  2.  Academic years (COMPLETED x2, PUBLISHED/Active, DRAFT) — SHS & College
  3.  Semesters (with grade_level for SHS)
  4.  Quarters (SHS only — Q1/Q2 per 1st sem, Q3/Q4 per 2nd sem)
  5.  Rooms (SHS-only, College-only, Shared; various types)
  6.  Personnel with honorific + credentials
  7.  Programs (SHS strands + College degrees)
  8.  Subject Bank (SHS + College curriculum)
  9.  Sections for COMPLETED, ACTIVE, and DRAFT terms
  10. Schedule Entries — CLASS + EXAM (DRAFT + PUBLISHED)
  11. Calendar Events (holidays, exam periods, breaks, institutional)

Usage: python seed-data.py
"""

import sqlite3, os, uuid, json
from datetime import datetime

# ── DB connection ────────────────────────────────────────────────

db_path = os.path.expandvars(r'%APPDATA%\sched-mng\schedule-manager.db')
if not os.path.exists(db_path):
    print("ERROR: Database not found. Start the app once first."); exit(1)

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA foreign_keys = OFF")
c = conn.cursor()
now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

def uid(): return str(uuid.uuid4())

def audit(entity_type, entity_id, department, action, after=None):
    c.execute('''INSERT INTO audit_log (id,entity_type,entity_id,department,action,after_snapshot,created_at)
                 VALUES (?,?,?,?,?,?,?)''',
              (uid(), entity_type, entity_id, department, action, json.dumps(after) if after else None, now))


# ══════════════════════════════════════════════════════════════════
# 1. WIPE EXISTING DATA
# ══════════════════════════════════════════════════════════════════

print("Clearing existing data...")

# Temporarily drop audit_log delete trigger so we can clear it
c.execute("DROP TRIGGER IF EXISTS audit_log_no_delete")
c.execute("DELETE FROM audit_log")

for t in ['schedule_entries','quarters','sections','semesters','academic_years',
          'rooms','personnel','subject_bank','programs','calendar_events']:
    c.execute(f"DELETE FROM {t}")

# Recreate audit_log delete trigger
c.execute("""CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
  BEFORE DELETE ON audit_log
  BEGIN
    SELECT RAISE(ABORT, 'Audit log records cannot be deleted');
  END""")

print("[OK] All data cleared (including audit log)")


# ══════════════════════════════════════════════════════════════════
# 2. ADMIN ACCOUNT + INSTITUTION SETTINGS
# ══════════════════════════════════════════════════════════════════

settings = [
    ('admin_password_hash', '$2a$10$6zkuap6Ha2qZcPPeW0PhherHtdQCCvMcoyiH/TkhtbAyf88bwhn4i'),
    ('security_question_1', 'What was the name of your first pet?'),
    ('security_answer_hash_1', '$2a$10$H1v/Ji8lp0d8npyeVDYtDuTwJcfIu8b8LmcE.9qHgcmOE2NyYmRtO'),
    ('security_question_2', 'What was your childhood nickname?'),
    ('security_answer_hash_2', '$2a$10$jvTr88WluQC0V3NPU4qDbeDGWb51tuvVB1HOSb7C09ARt2HS.ixti'),
    ('institution_name', 'JW Technical Institute'),
    ('institution_address', '123 University Ave, Quezon City'),
    ('institution_contact', '+63 2 8123 4567'),
    ('institution_email', 'registrar@jwtech.edu.ph'),
]
for key, value in settings:
    c.execute('''INSERT INTO app_settings (key,value,updated_at) VALUES (?,?,?)
                 ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at''',
              (key, value, now))
print("[OK] Admin account + institution settings")


# ══════════════════════════════════════════════════════════════════
# 3. ACADEMIC YEARS + SEMESTERS + QUARTERS
# ══════════════════════════════════════════════════════════════════

def make_ay(dept, label, start, end, status, is_active):
    ay_id = uid()
    c.execute('''INSERT INTO academic_years
                 (id,department,label,start_date,end_date,is_active,status,
                  created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?)''',
              (ay_id,dept,label,start,end,is_active,status,now,now))
    audit('academic_year', ay_id, dept, 'CREATE', {'label':label,'status':status})
    return ay_id

def make_sem(ay_id, dept, sem_type, start, end, status, is_active, grade_level=None):
    sem_id = uid()
    c.execute('''INSERT INTO semesters
                 (id,academic_year_id,department,semester_type,grade_level,
                  start_date,end_date,is_active,status,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?)''',
              (sem_id,ay_id,dept,sem_type,grade_level,start,end,is_active,status,now,now))
    return sem_id

def make_quarter(sem_id, dept, label, start, end, status, is_active):
    q_id = uid()
    c.execute('''INSERT INTO quarters
                 (id,semester_id,department,quarter_label,start_date,end_date,
                  is_active,status,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?)''',
              (q_id,sem_id,dept,label,start,end,is_active,status,now,now))
    return q_id


# ── SHS: COMPLETED 2023-2024 (lean — AY + semesters only) ───────

shs_c1 = make_ay('SHS','A.Y. 2023-2024','2023-06-05','2024-03-29','COMPLETED',0)
make_sem(shs_c1,'SHS','1ST_SEMESTER','2023-06-05','2023-10-27','PUBLISHED',0,'GRADE_11')
make_sem(shs_c1,'SHS','2ND_SEMESTER','2023-11-06','2024-03-29','PUBLISHED',0,'GRADE_11')
make_sem(shs_c1,'SHS','1ST_SEMESTER','2023-06-05','2023-10-27','PUBLISHED',0,'GRADE_12')
make_sem(shs_c1,'SHS','2ND_SEMESTER','2023-11-06','2024-03-29','PUBLISHED',0,'GRADE_12')

# ── SHS: COMPLETED 2024-2025 (rich — sections, entries, exams) ──

shs_c2 = make_ay('SHS','A.Y. 2024-2025','2024-06-03','2025-03-28','COMPLETED',0)
shs_c2_s1_g11 = make_sem(shs_c2,'SHS','1ST_SEMESTER','2024-06-03','2024-10-25','PUBLISHED',0,'GRADE_11')
shs_c2_s2_g11 = make_sem(shs_c2,'SHS','2ND_SEMESTER','2024-11-04','2025-03-28','PUBLISHED',0,'GRADE_11')
shs_c2_s1_g12 = make_sem(shs_c2,'SHS','1ST_SEMESTER','2024-06-03','2024-10-25','PUBLISHED',0,'GRADE_12')
shs_c2_s2_g12 = make_sem(shs_c2,'SHS','2ND_SEMESTER','2024-11-04','2025-03-28','PUBLISHED',0,'GRADE_12')

# Quarters — COMPLETED 2024-2025
make_quarter(shs_c2_s1_g11,'SHS','Q1','2024-06-03','2024-08-16','PUBLISHED',0)
make_quarter(shs_c2_s1_g11,'SHS','Q2','2024-08-19','2024-10-25','PUBLISHED',0)
make_quarter(shs_c2_s2_g11,'SHS','Q3','2024-11-04','2025-01-17','PUBLISHED',0)
make_quarter(shs_c2_s2_g11,'SHS','Q4','2025-01-20','2025-03-28','PUBLISHED',0)
make_quarter(shs_c2_s1_g12,'SHS','Q1','2024-06-03','2024-08-16','PUBLISHED',0)
make_quarter(shs_c2_s1_g12,'SHS','Q2','2024-08-19','2024-10-25','PUBLISHED',0)
make_quarter(shs_c2_s2_g12,'SHS','Q3','2024-11-04','2025-01-17','PUBLISHED',0)
make_quarter(shs_c2_s2_g12,'SHS','Q4','2025-01-20','2025-03-28','PUBLISHED',0)

# ── SHS: PUBLISHED / ACTIVE 2025-2026 ───────────────────────────

shs_a = make_ay('SHS','A.Y. 2025-2026','2025-06-02','2026-09-30','PUBLISHED',1)
shs_a_s1_g11 = make_sem(shs_a,'SHS','1ST_SEMESTER','2025-06-02','2025-10-24','PUBLISHED',1,'GRADE_11')
shs_a_s2_g11 = make_sem(shs_a,'SHS','2ND_SEMESTER','2025-11-03','2026-03-27','PUBLISHED',0,'GRADE_11')
shs_a_s1_g12 = make_sem(shs_a,'SHS','1ST_SEMESTER','2025-06-02','2025-10-24','PUBLISHED',1,'GRADE_12')
shs_a_s2_g12 = make_sem(shs_a,'SHS','2ND_SEMESTER','2025-11-03','2026-03-27','PUBLISHED',0,'GRADE_12')

# Quarters — ACTIVE 2025-2026 (Q1 active for current semesters)
make_quarter(shs_a_s1_g11,'SHS','Q1','2025-06-02','2025-08-15','PUBLISHED',1)
make_quarter(shs_a_s1_g11,'SHS','Q2','2025-08-18','2025-10-24','PUBLISHED',0)
make_quarter(shs_a_s2_g11,'SHS','Q3','2025-11-03','2026-01-16','PUBLISHED',0)
make_quarter(shs_a_s2_g11,'SHS','Q4','2026-01-19','2026-03-27','PUBLISHED',0)
make_quarter(shs_a_s1_g12,'SHS','Q1','2025-06-02','2025-08-15','PUBLISHED',1)
make_quarter(shs_a_s1_g12,'SHS','Q2','2025-08-18','2025-10-24','PUBLISHED',0)
make_quarter(shs_a_s2_g12,'SHS','Q3','2025-11-03','2026-01-16','PUBLISHED',0)
make_quarter(shs_a_s2_g12,'SHS','Q4','2026-01-19','2026-03-27','PUBLISHED',0)

# ── SHS: DRAFT 2026-2027 ────────────────────────────────────────

shs_d = make_ay('SHS','A.Y. 2026-2027','2026-06-01','2027-09-30','DRAFT',0)
shs_d_s1_g11 = make_sem(shs_d,'SHS','1ST_SEMESTER','2026-06-01','2026-10-23','DRAFT',0,'GRADE_11')
shs_d_s2_g11 = make_sem(shs_d,'SHS','2ND_SEMESTER','2026-10-26','2027-03-26','DRAFT',0,'GRADE_11')
shs_d_s1_g12 = make_sem(shs_d,'SHS','1ST_SEMESTER','2026-06-01','2026-10-23','DRAFT',0,'GRADE_12')
shs_d_s2_g12 = make_sem(shs_d,'SHS','2ND_SEMESTER','2026-10-26','2027-03-26','DRAFT',0,'GRADE_12')

# Quarters — DRAFT 2026-2027
make_quarter(shs_d_s1_g11,'SHS','Q1','2026-06-01','2026-08-14','DRAFT',0)
make_quarter(shs_d_s1_g11,'SHS','Q2','2026-08-17','2026-10-23','DRAFT',0)
make_quarter(shs_d_s2_g11,'SHS','Q3','2026-10-26','2027-01-15','DRAFT',0)
make_quarter(shs_d_s2_g11,'SHS','Q4','2027-01-18','2027-03-26','DRAFT',0)
make_quarter(shs_d_s1_g12,'SHS','Q1','2026-06-01','2026-08-14','DRAFT',0)
make_quarter(shs_d_s1_g12,'SHS','Q2','2026-08-17','2026-10-23','DRAFT',0)
make_quarter(shs_d_s2_g12,'SHS','Q3','2026-10-26','2027-01-15','DRAFT',0)
make_quarter(shs_d_s2_g12,'SHS','Q4','2027-01-18','2027-03-26','DRAFT',0)

print("[OK] SHS academic years (COMPLETED x2, PUBLISHED/Active, DRAFT) + 24 quarters")


# ── COLLEGE: COMPLETED 2023-2024 (lean) ─────────────────────────

col_c1 = make_ay('COLLEGE','A.Y. 2023-2024','2023-08-14','2024-06-07','COMPLETED',0)
make_sem(col_c1,'COLLEGE','1ST_SEMESTER','2023-08-14','2023-12-22','PUBLISHED',0)
make_sem(col_c1,'COLLEGE','2ND_SEMESTER','2024-01-08','2024-05-24','PUBLISHED',0)
make_sem(col_c1,'COLLEGE','SUMMER','2024-05-27','2024-06-07','PUBLISHED',0)

# ── COLLEGE: COMPLETED 2024-2025 (rich) ─────────────────────────

col_c2 = make_ay('COLLEGE','A.Y. 2024-2025','2024-08-12','2025-06-06','COMPLETED',0)
col_c2_s1 = make_sem(col_c2,'COLLEGE','1ST_SEMESTER','2024-08-12','2024-12-20','PUBLISHED',0)
col_c2_s2 = make_sem(col_c2,'COLLEGE','2ND_SEMESTER','2025-01-06','2025-05-23','PUBLISHED',0)
col_c2_sum = make_sem(col_c2,'COLLEGE','SUMMER','2025-05-26','2025-06-06','PUBLISHED',0)

# ── COLLEGE: PUBLISHED / ACTIVE 2025-2026 ───────────────────────

col_a = make_ay('COLLEGE','A.Y. 2025-2026','2025-08-11','2026-09-30','PUBLISHED',1)
col_a_s1 = make_sem(col_a,'COLLEGE','1ST_SEMESTER','2025-08-11','2025-12-19','PUBLISHED',1)
col_a_s2 = make_sem(col_a,'COLLEGE','2ND_SEMESTER','2026-01-05','2026-05-22','PUBLISHED',0)
col_a_sum = make_sem(col_a,'COLLEGE','SUMMER','2026-05-25','2026-09-30','DRAFT',0)

# ── COLLEGE: DRAFT 2026-2027 ────────────────────────────────────

col_d = make_ay('COLLEGE','A.Y. 2026-2027','2026-08-10','2027-09-30','DRAFT',0)
col_d_s1 = make_sem(col_d,'COLLEGE','1ST_SEMESTER','2026-08-10','2026-12-18','DRAFT',0)
col_d_s2 = make_sem(col_d,'COLLEGE','2ND_SEMESTER','2027-01-04','2027-05-21','DRAFT',0)

print("[OK] COLLEGE academic years (COMPLETED x2, PUBLISHED/Active, DRAFT)")


# ══════════════════════════════════════════════════════════════════
# 4. ROOMS
# ══════════════════════════════════════════════════════════════════

rooms_data = [
    # (code, name, building, floor, capacity, room_type, dept_avail)
    ('RM-101','Room 101','Main Building','1st Floor',40,'Classroom','SHARED'),
    ('RM-102','Room 102','Main Building','1st Floor',40,'Classroom','SHARED'),
    ('RM-103','Room 103','Main Building','1st Floor',35,'Classroom','SHARED'),
    ('RM-201','Room 201','Main Building','2nd Floor',40,'Classroom','SHARED'),
    ('RM-202','Room 202','Main Building','2nd Floor',40,'Classroom','SHARED'),
    ('RM-203','Room 203','Main Building','2nd Floor',35,'Classroom','SHS_ONLY'),
    ('RM-301','Room 301','Main Building','3rd Floor',45,'Classroom','COLLEGE_ONLY'),
    ('RM-302','Room 302','Main Building','3rd Floor',45,'Classroom','COLLEGE_ONLY'),
    ('LB-101','Computer Lab 1','Lab Building','1st Floor',30,'Laboratory','SHARED'),
    ('LB-102','Computer Lab 2','Lab Building','1st Floor',30,'Laboratory','SHARED'),
    ('LB-201','Science Lab','Lab Building','2nd Floor',25,'Laboratory','SHS_ONLY'),
    ('GYM-01','Gymnasium','Gym Building','Ground Floor',200,'Gymnasium','SHARED'),
    ('AVR-01','Audio-Visual Room','Main Building','Ground Floor',80,'AVR','SHARED'),
    ('LIB-01','Library','Library Building','1st Floor',60,'Library','SHARED'),
    ('RM-401','Room 401','Annex Building','4th Floor',38,'Classroom','COLLEGE_ONLY'),
]

room_ids = {}
for code, name, bldg, floor, cap, rtype, avail in rooms_data:
    rid = uid()
    c.execute('''INSERT INTO rooms (id,room_code,room_name,building,floor,capacity,room_type,
                 department_availability,status,is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
              (rid,code,name,bldg,floor,cap,rtype,avail,'AVAILABLE',1,now,now))
    audit('room', rid, None, 'CREATE', {'room_code':code})
    room_ids[code] = rid
print(f"[OK] {len(rooms_data)} rooms")


# ══════════════════════════════════════════════════════════════════
# 5. PERSONNEL (with honorific + credentials)
# ══════════════════════════════════════════════════════════════════

personnel_data = [
    # (emp_id, first, last, email, dept, is_shared, p_type, specializations, max_hrs, honorific, credentials)
    ('EMP-001','Maria','Santos','m.santos@jwtech.edu.ph','SHS',0,'FACULTY','["Mathematics","Statistics"]',30,'Prof.','M.A. Mathematics'),
    ('EMP-002','Jose','Reyes','j.reyes@jwtech.edu.ph','SHS',0,'FACULTY','["English","Literature"]',30,'Prof.','M.A. English'),
    ('EMP-003','Ana','Dela Cruz','a.delacruz@jwtech.edu.ph','SHS',0,'FACULTY','["Science","Biology","Chemistry"]',30,'Dr.','Ph.D. Biology'),
    ('EMP-004','Carlos','Mendoza','c.mendoza@jwtech.edu.ph','SHS',0,'FACULTY','["Filipino","Araling Panlipunan"]',30,'Prof.','M.A. Filipino'),
    ('EMP-005','Liza','Garcia','l.garcia@jwtech.edu.ph','SHS',0,'FACULTY','["MAPEH","Physical Education"]',30,None,'B.S. Physical Education'),
    ('EMP-006','Ramon','Torres','r.torres@jwtech.edu.ph','SHS',0,'FACULTY','["Oral Communication","Reading and Writing"]',30,'Prof.','M.A. Communication'),
    ('EMP-007','Lourdes','Ramos','l.ramos@jwtech.edu.ph','SHS',1,'FACULTY','["ICT","Computer Science"]',40,'Engr.','M.S. Computer Science'),
    ('EMP-008','Pedro','Cruz','p.cruz@jwtech.edu.ph','COLLEGE',0,'FACULTY','["Computer Programming","Data Structures"]',30,'Engr.','M.S. Information Technology'),
    ('EMP-009','Rosa','Bautista','r.bautista@jwtech.edu.ph','COLLEGE',0,'FACULTY','["Networking","Cybersecurity"]',30,'Engr.','M.S. Cybersecurity'),
    ('EMP-010','Juan','Aquino','j.aquino@jwtech.edu.ph','COLLEGE',0,'FACULTY','["Database Management","Information Systems"]',30,'Prof.','M.S. Information Systems'),
    ('EMP-011','Carmen','Castillo','c.castillo@jwtech.edu.ph','COLLEGE',0,'FACULTY','["Business Administration","Management"]',30,'Dr.','D.B.A.'),
    ('EMP-012','Felix','Morales','f.morales@jwtech.edu.ph','COLLEGE',0,'FACULTY','["Accountancy","Finance"]',30,'CPA','M.B.A., CPA'),
    ('EMP-013','Irene','Flores','i.flores@jwtech.edu.ph','COLLEGE',1,'FACULTY','["Mathematics","Statistics","Calculus"]',40,'Dr.','Ph.D. Applied Mathematics'),
    ('EMP-014','Miguel','Villanueva','m.villanueva@jwtech.edu.ph','COLLEGE',0,'FACULTY','["Marketing","Entrepreneurship"]',30,'Prof.','M.B.A.'),
    ('EMP-015','Elena','Pascual','e.pascual@jwtech.edu.ph','COLLEGE',0,'ADMIN','["Administration"]',40,None,None),
]

pers_ids = {}
for emp_id, first, last, email, dept, shared, ptype, specs, max_hrs, honorific, credentials in personnel_data:
    pid = uid()
    c.execute('''INSERT INTO personnel (id,employee_id,first_name,last_name,email,department,
                 is_shared,personnel_type,specializations,max_weekly_hours,honorific,credentials,
                 status,is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
              (pid,emp_id,first,last,email,dept,shared,ptype,specs,max_hrs,honorific,credentials,
               'ACTIVE',1,now,now))
    audit('personnel', pid, dept, 'CREATE', {'employee_id':emp_id,'name':f'{first} {last}'})
    pers_ids[emp_id] = pid
print(f"[OK] {len(personnel_data)} personnel (with honorific/credentials)")


# ══════════════════════════════════════════════════════════════════
# 6. PROGRAMS
# ══════════════════════════════════════════════════════════════════

programs_data = [
    ('STEM','SHS','Science, Technology, Engineering, and Mathematics'),
    ('ABM','SHS','Accountancy, Business, and Management'),
    ('HUMSS','SHS','Humanities and Social Sciences'),
    ('TVL-ICT','SHS','Technical-Vocational-Livelihood - Information and Communications Technology'),
    ('GAS','SHS','General Academic Strand'),
    ('BSIT','COLLEGE','Bachelor of Science in Information Technology'),
    ('BSCS','COLLEGE','Bachelor of Science in Computer Science'),
    ('BSBA','COLLEGE','Bachelor of Science in Business Administration'),
    ('BSACCO','COLLEGE','Bachelor of Science in Accountancy'),
    ('BSN','COLLEGE','Bachelor of Science in Nursing'),
]

prog_ids = {}
for name, dept, desc in programs_data:
    pid = uid()
    c.execute('''INSERT INTO programs (id,name,description,department,is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?)''', (pid,name,desc,dept,1,now,now))
    prog_ids[(name,dept)] = pid
print(f"[OK] {len(programs_data)} programs")


# ══════════════════════════════════════════════════════════════════
# 7. SUBJECT BANK
# ══════════════════════════════════════════════════════════════════

subjects_data = [
    # (code, name, course_program, dept, yr_level, sem_type, lec, lab)
    # ── SHS STEM ──
    ('GEN-MATH-11','General Mathematics','STEM','SHS','Grade 11','1ST',4,0),
    ('EARTH-SCI-11','Earth Science','STEM','SHS','Grade 11','1ST',4,0),
    ('PRE-CALC-11','Pre-Calculus','STEM','SHS','Grade 11','2ND',4,0),
    ('BIO-11','Biology','STEM','SHS','Grade 11','2ND',3,1),
    ('CALC-12','Basic Calculus','STEM','SHS','Grade 12','1ST',4,0),
    ('STAT-PROB-12','Statistics and Probability','STEM','SHS','Grade 12','1ST',4,0),
    ('PHYS-12','Physics','STEM','SHS','Grade 12','2ND',3,1),
    ('CHEM-12','Chemistry','STEM','SHS','Grade 12','2ND',3,1),
    # ── SHS ABM ──
    ('BUS-MATH-11','Business Mathematics','ABM','SHS','Grade 11','1ST',4,0),
    ('ORG-MGT-11','Organization and Management','ABM','SHS','Grade 11','1ST',4,0),
    ('ACC-BUS-MGMT-11','Accounting, Business, and Management','ABM','SHS','Grade 11','2ND',4,0),
    ('BUS-FINANCE-12','Business Finance','ABM','SHS','Grade 12','1ST',4,0),
    # ── SHS Core (shared) ──
    ('ORAL-COMM-11','Oral Communication','GAS','SHS','Grade 11','1ST',4,0),
    ('READ-WRITE-11','Reading and Writing','GAS','SHS','Grade 11','1ST',4,0),
    ('PERSONAL-DEV-11','Personal Development','GAS','SHS','Grade 11','2ND',3,0),
    ('MEDIA-INFO-12','Media and Information Literacy','GAS','SHS','Grade 12','1ST',3,0),
    # ── SHS TVL-ICT ──
    ('CSS-11','Computer Systems Servicing','TVL-ICT','SHS','Grade 11','1ST',2,4),
    ('PROG-11','Programming (Java)','TVL-ICT','SHS','Grade 11','2ND',2,4),
    # ── College BSIT ──
    ('IT101','Introduction to Computing','BSIT','COLLEGE','1st Year','1ST',3,0),
    ('IT102','Computer Programming 1','BSIT','COLLEGE','1st Year','1ST',2,3),
    ('IT103','Computer Programming 2','BSIT','COLLEGE','1st Year','2ND',2,3),
    ('IT201','Data Structures and Algorithms','BSIT','COLLEGE','2nd Year','1ST',3,0),
    ('IT202','Database Management Systems','BSIT','COLLEGE','2nd Year','1ST',2,3),
    ('IT203','Networking Fundamentals','BSIT','COLLEGE','2nd Year','2ND',3,0),
    ('IT301','Systems Analysis and Design','BSIT','COLLEGE','3rd Year','1ST',3,0),
    ('IT302','Web Development','BSIT','COLLEGE','3rd Year','1ST',2,3),
    # ── College BSBA ──
    ('BA101','Principles of Management','BSBA','COLLEGE','1st Year','1ST',3,0),
    ('BA102','Business Mathematics','BSBA','COLLEGE','1st Year','1ST',3,0),
    ('BA201','Marketing Management','BSBA','COLLEGE','2nd Year','1ST',3,0),
    ('BA202','Financial Management','BSBA','COLLEGE','2nd Year','2ND',3,0),
    # ── College BSACCO ──
    ('ACC101','Introduction to Accounting','BSACCO','COLLEGE','1st Year','1ST',3,0),
    ('ACC102','Financial Accounting','BSACCO','COLLEGE','1st Year','2ND',3,0),
    ('ACC201','Intermediate Accounting','BSACCO','COLLEGE','2nd Year','1ST',3,0),
    # ── College General Education ──
    ('GE101','Understanding the Self','BSIT','COLLEGE','1st Year','1ST',3,0),
    ('GE102','Purposive Communication','BSIT','COLLEGE','1st Year','1ST',3,0),
    ('GE103','Mathematics in the Modern World','BSIT','COLLEGE','1st Year','2ND',3,0),
    ('GE104','The Contemporary World','BSBA','COLLEGE','1st Year','1ST',3,0),
    ('GE105','Art Appreciation','BSBA','COLLEGE','1st Year','2ND',3,0),
    ('PE101','Physical Education 1','BSIT','COLLEGE','1st Year','1ST',2,0),
    ('PE102','Physical Education 2','BSIT','COLLEGE','1st Year','2ND',2,0),
    ('NSTP1','NSTP 1','BSIT','COLLEGE','1st Year','1ST',3,0),
    ('NSTP2','NSTP 2','BSIT','COLLEGE','1st Year','2ND',3,0),
]

subj_ids = {}
for code, name, prog, dept, yr, sem, lec, lab in subjects_data:
    sid = uid()
    c.execute('''INSERT INTO subject_bank (id,subject_code,subject_name,course_program,department,
                 year_level,semester_type,lec_units,lab_units,is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
              (sid,code,name,prog,dept,yr,sem,lec,lab,1,now,now))
    subj_ids[code] = sid
print(f"[OK] {len(subjects_data)} subjects in subject bank")


# ══════════════════════════════════════════════════════════════════
# 8. SECTIONS (COMPLETED + ACTIVE + DRAFT)
# ══════════════════════════════════════════════════════════════════

def make_section(dept, code, name, ay_id, sem_id, count, strand=None, subject=None,
                 course_program=None, year_level=None, grade_level=None,
                 semester_type=None, status='ACTIVE', adviser_id=None):
    sec_id = uid()
    cp = course_program or strand
    c.execute('''INSERT INTO sections
                 (id,department,section_code,section_name,strand_track,subject,
                  course_program,year_level,grade_level,student_count,academic_year_id,semester_id,
                  semester_type,adviser_id,status,is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
              (sec_id,dept,code,name,strand,subject,cp,year_level,grade_level,count,ay_id,sem_id,
               semester_type,adviser_id,status,1,now,now))
    audit('section', sec_id, dept, 'CREATE', {'section_code':code})
    return sec_id


# ── COMPLETED 2024-2025: SHS Sections ───────────────────────────

comp_shs_secs = {}
for code, name, strand, gl, sem_id, yr, count in [
    ('11-STEM-A','Grade 11 - STEM A','STEM','GRADE_11',shs_c2_s1_g11,'Grade 11',42),
    ('11-STEM-B','Grade 11 - STEM B','STEM','GRADE_11',shs_c2_s1_g11,'Grade 11',40),
    ('11-ABM-A','Grade 11 - ABM A','ABM','GRADE_11',shs_c2_s1_g11,'Grade 11',38),
    ('11-HUMSS-A','Grade 11 - HUMSS A','HUMSS','GRADE_11',shs_c2_s1_g11,'Grade 11',36),
    ('11-TVL-ICT-A','Grade 11 - TVL-ICT A','TVL-ICT','GRADE_11',shs_c2_s1_g11,'Grade 11',30),
    ('12-STEM-A','Grade 12 - STEM A','STEM','GRADE_12',shs_c2_s1_g12,'Grade 12',41),
    ('12-ABM-A','Grade 12 - ABM A','ABM','GRADE_12',shs_c2_s1_g12,'Grade 12',37),
    ('12-HUMSS-A','Grade 12 - HUMSS A','HUMSS','GRADE_12',shs_c2_s1_g12,'Grade 12',35),
]:
    comp_shs_secs[code] = make_section('SHS',code,name,shs_c2,sem_id,count,
                                        strand=strand,year_level=yr,grade_level=gl,semester_type='1ST')

# ── COMPLETED 2024-2025: College Sections ────────────────────────

comp_col_secs = {}
for code, name, prog, yr, count in [
    ('BSIT-1A','BSIT 1A','BSIT','1st Year',35),
    ('BSIT-2A','BSIT 2A','BSIT','2nd Year',30),
    ('BSBA-1A','BSBA 1A','BSBA','1st Year',40),
    ('BSACCO-1A','BSACCO 1A','BSACCO','1st Year',35),
]:
    comp_col_secs[code] = make_section('COLLEGE',code,name,col_c2,col_c2_s1,count,
                                        course_program=prog,year_level=yr,semester_type='1ST')

print(f"[OK] {len(comp_shs_secs)+len(comp_col_secs)} sections (COMPLETED 2024-2025)")


# ── ACTIVE 2025-2026: SHS Sections ──────────────────────────────

act_shs_secs = {}
for code, name, strand, gl, sem_id, yr, count in [
    ('11-STEM-A','Grade 11 - STEM A','STEM','GRADE_11',shs_a_s1_g11,'Grade 11',42),
    ('11-STEM-B','Grade 11 - STEM B','STEM','GRADE_11',shs_a_s1_g11,'Grade 11',40),
    ('11-ABM-A','Grade 11 - ABM A','ABM','GRADE_11',shs_a_s1_g11,'Grade 11',38),
    ('11-HUMSS-A','Grade 11 - HUMSS A','HUMSS','GRADE_11',shs_a_s1_g11,'Grade 11',36),
    ('11-TVL-ICT-A','Grade 11 - TVL-ICT A','TVL-ICT','GRADE_11',shs_a_s1_g11,'Grade 11',30),
    ('12-STEM-A','Grade 12 - STEM A','STEM','GRADE_12',shs_a_s1_g12,'Grade 12',41),
    ('12-STEM-B','Grade 12 - STEM B','STEM','GRADE_12',shs_a_s1_g12,'Grade 12',39),
    ('12-ABM-A','Grade 12 - ABM A','ABM','GRADE_12',shs_a_s1_g12,'Grade 12',37),
    ('12-HUMSS-A','Grade 12 - HUMSS A','HUMSS','GRADE_12',shs_a_s1_g12,'Grade 12',35),
]:
    adv = pers_ids.get('EMP-001') if 'STEM' in code else None
    act_shs_secs[code] = make_section('SHS',code,name,shs_a,sem_id,count,
                                       strand=strand,year_level=yr,grade_level=gl,
                                       semester_type='1ST',adviser_id=adv)

# ── ACTIVE 2025-2026: College Sections ──────────────────────────

act_col_secs = {}
for code, name, prog, yr, count in [
    ('BSIT-1A','BSIT 1A','BSIT','1st Year',35),
    ('BSIT-1B','BSIT 1B','BSIT','1st Year',33),
    ('BSIT-2A','BSIT 2A','BSIT','2nd Year',30),
    ('BSIT-3A','BSIT 3A','BSIT','3rd Year',28),
    ('BSBA-1A','BSBA 1A','BSBA','1st Year',40),
    ('BSBA-2A','BSBA 2A','BSBA','2nd Year',38),
    ('BSACCO-1A','BSACCO 1A','BSACCO','1st Year',35),
    ('BSACCO-2A','BSACCO 2A','BSACCO','2nd Year',32),
]:
    act_col_secs[code] = make_section('COLLEGE',code,name,col_a,col_a_s1,count,
                                       course_program=prog,year_level=yr,semester_type='1ST')

print(f"[OK] {len(act_shs_secs)+len(act_col_secs)} sections (ACTIVE 2025-2026)")


# ── DRAFT 2026-2027: SHS Sections (planning ahead) ──────────────

draft_shs_secs = {}
for code, name, strand, gl, sem_id, yr, count in [
    ('11-STEM-A','Grade 11 - STEM A','STEM','GRADE_11',shs_d_s1_g11,'Grade 11',0),
    ('11-STEM-B','Grade 11 - STEM B','STEM','GRADE_11',shs_d_s1_g11,'Grade 11',0),
    ('11-ABM-A','Grade 11 - ABM A','ABM','GRADE_11',shs_d_s1_g11,'Grade 11',0),
    ('11-HUMSS-A','Grade 11 - HUMSS A','HUMSS','GRADE_11',shs_d_s1_g11,'Grade 11',0),
    ('12-STEM-A','Grade 12 - STEM A','STEM','GRADE_12',shs_d_s1_g12,'Grade 12',0),
    ('12-ABM-A','Grade 12 - ABM A','ABM','GRADE_12',shs_d_s1_g12,'Grade 12',0),
]:
    draft_shs_secs[code] = make_section('SHS',code,name,shs_d,sem_id,count,
                                         strand=strand,year_level=yr,grade_level=gl,
                                         semester_type='1ST',status='ACTIVE')

# ── DRAFT 2026-2027: College Sections ───────────────────────────

draft_col_secs = {}
for code, name, prog, yr, count in [
    ('BSIT-1A','BSIT 1A','BSIT','1st Year',0),
    ('BSIT-2A','BSIT 2A','BSIT','2nd Year',0),
    ('BSBA-1A','BSBA 1A','BSBA','1st Year',0),
    ('BSACCO-1A','BSACCO 1A','BSACCO','1st Year',0),
]:
    draft_col_secs[code] = make_section('COLLEGE',code,name,col_d,col_d_s1,count,
                                         course_program=prog,year_level=yr,semester_type='1ST')

print(f"[OK] {len(draft_shs_secs)+len(draft_col_secs)} sections (DRAFT 2026-2027)")


# ══════════════════════════════════════════════════════════════════
# 9. SCHEDULE ENTRIES (CLASS + EXAM, across all terms)
# ══════════════════════════════════════════════════════════════════

def make_entry(dept, ay_id, sem_id, room_code, emp_id, section_codes,
               subject, start, end, day, recurrence, start_date, end_date,
               status, sec_lookup,
               activity_type='CLASS', modality='F2F',
               exam_title=None, exam_type=None,
               subject_code=None, lec_units=0, lab_units=0):
    """Create a schedule entry. sec_lookup is the dict mapping section codes to IDs."""
    eid = uid()
    room_id = room_ids.get(room_code)
    pers_id = pers_ids.get(emp_id) if emp_id else None
    sec_ids = json.dumps([sec_lookup.get(s) for s in section_codes if sec_lookup.get(s)])
    c.execute('''INSERT INTO schedule_entries
                 (id,department,activity_type,room_id,personnel_id,section_ids,subject,
                  exam_title,exam_type,
                  modality,start_time,end_time,recurrence_pattern,recurrence_start_date,
                  recurrence_end_date,day_of_week,academic_year_id,semester_id,
                  subject_code,lec_units,lab_units,
                  status,conflict_flags,is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
              (eid,dept,activity_type,room_id,pers_id,sec_ids,subject,
               exam_title,exam_type,
               modality,start,end,recurrence,start_date,end_date,day,ay_id,sem_id,
               subject_code,lec_units,lab_units,
               status,'[]',1,now,now))
    audit('schedule_entry', eid, dept, 'CREATE',
          {'subject':subject,'status':status,'activity_type':activity_type})
    return eid


# ── COMPLETED 2024-2025: SHS CLASS entries (all PUBLISHED) ──────

comp_shs_class = [
    # (room, emp, [sections], subject, start, end, day, recurrence, start_date, end_date, subj_code, lec, lab)
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','07:00','08:00',1,'WEEKLY','2024-06-03','2024-10-25','GEN-MATH-11',4,0),
    ('RM-101','EMP-001',['11-STEM-B'],'General Mathematics','08:00','09:00',1,'WEEKLY','2024-06-03','2024-10-25','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-STEM-A'],'Oral Communication','09:00','10:00',1,'WEEKLY','2024-06-03','2024-10-25','ORAL-COMM-11',4,0),
    ('RM-102','EMP-002',['11-ABM-A'],'Oral Communication','10:00','11:00',1,'WEEKLY','2024-06-03','2024-10-25','ORAL-COMM-11',4,0),
    ('RM-103','EMP-003',['11-STEM-A'],'Earth Science','11:00','12:00',1,'WEEKLY','2024-06-03','2024-10-25','EARTH-SCI-11',4,0),
    ('RM-203','EMP-004',['11-ABM-A'],'Organization and Management','07:00','08:00',2,'WEEKLY','2024-06-04','2024-10-25','ORG-MGT-11',4,0),
    ('LB-101','EMP-007',['11-TVL-ICT-A'],'Computer Systems Servicing','07:00','09:00',2,'WEEKLY','2024-06-04','2024-10-25','CSS-11',2,4),
    ('RM-201','EMP-005',['12-STEM-A'],'Statistics and Probability','07:00','08:00',3,'WEEKLY','2024-06-05','2024-10-25','STAT-PROB-12',4,0),
    ('RM-201','EMP-001',['12-STEM-A'],'Basic Calculus','08:00','09:00',3,'WEEKLY','2024-06-05','2024-10-25','CALC-12',4,0),
    ('RM-202','EMP-006',['12-ABM-A'],'Media and Information Literacy','09:00','10:00',4,'WEEKLY','2024-06-06','2024-10-25','MEDIA-INFO-12',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, sc, lec, lab in comp_shs_class:
    make_entry('SHS',shs_c2,shs_c2_s1_g11,room,emp,secs,subj,st,et,day,rec,sd,ed,
               'PUBLISHED',comp_shs_secs,subject_code=sc,lec_units=lec,lab_units=lab)

# ── COMPLETED 2024-2025: SHS EXAM entries ───────────────────────

comp_shs_exams = [
    # Midterm exams (during Q2 — August 2024)
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','08:00','10:00',1,'ONCE','2024-08-19','2024-08-19',
     'Midterm Exam — General Mathematics','MIDTERM','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-STEM-A'],'Oral Communication','10:00','12:00',1,'ONCE','2024-08-19','2024-08-19',
     'Midterm Exam — Oral Communication','MIDTERM','ORAL-COMM-11',4,0),
    ('RM-103','EMP-003',['11-STEM-A'],'Earth Science','08:00','10:00',2,'ONCE','2024-08-20','2024-08-20',
     'Midterm Exam — Earth Science','MIDTERM','EARTH-SCI-11',4,0),
    # Final exams (during Q2 end — October 2024)
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','08:00','10:00',1,'ONCE','2024-10-14','2024-10-14',
     'Final Exam — General Mathematics','FINAL','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-STEM-A'],'Oral Communication','10:00','12:00',1,'ONCE','2024-10-14','2024-10-14',
     'Final Exam — Oral Communication','FINAL','ORAL-COMM-11',4,0),
    ('RM-201','EMP-001',['12-STEM-A'],'Basic Calculus','08:00','10:00',3,'ONCE','2024-10-16','2024-10-16',
     'Final Exam — Basic Calculus','FINAL','CALC-12',4,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, etitle, etype, sc, lec, lab in comp_shs_exams:
    make_entry('SHS',shs_c2,shs_c2_s1_g11,room,emp,secs,subj,st,et,day,rec,sd,ed,
               'PUBLISHED',comp_shs_secs,activity_type='EXAM',
               exam_title=etitle,exam_type=etype,subject_code=sc,lec_units=lec,lab_units=lab)

print(f"[OK] {len(comp_shs_class)+len(comp_shs_exams)} SHS entries (COMPLETED 2024-2025)")

# ── COMPLETED 2024-2025: College CLASS entries ───────────────────

comp_col_class = [
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','07:00','08:30',1,'WEEKLY','2024-08-12','2024-12-20','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','08:30','11:30',1,'WEEKLY','2024-08-12','2024-12-20','IT102',2,3),
    ('RM-302','EMP-010',['BSIT-2A'],'Data Structures and Algorithms','07:00','08:30',2,'WEEKLY','2024-08-13','2024-12-20','IT201',3,0),
    ('LB-102','EMP-010',['BSIT-2A'],'Database Management Systems','08:30','11:30',2,'WEEKLY','2024-08-13','2024-12-20','IT202',2,3),
    ('RM-302','EMP-011',['BSBA-1A'],'Principles of Management','07:00','08:30',1,'WEEKLY','2024-08-12','2024-12-20','BA101',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Introduction to Accounting','07:00','08:30',3,'WEEKLY','2024-08-14','2024-12-20','ACC101',3,0),
    ('RM-301','EMP-013',['BSIT-1A'],'Mathematics in the Modern World','07:00','08:30',3,'WEEKLY','2024-08-14','2024-12-20','GE103',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, sc, lec, lab in comp_col_class:
    make_entry('COLLEGE',col_c2,col_c2_s1,room,emp,secs,subj,st,et,day,rec,sd,ed,
               'PUBLISHED',comp_col_secs,subject_code=sc,lec_units=lec,lab_units=lab)

# ── COMPLETED 2024-2025: College EXAM entries ────────────────────

comp_col_exams = [
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','08:00','10:00',1,'ONCE','2024-10-07','2024-10-07',
     'Midterm Exam — Introduction to Computing','MIDTERM','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','10:00','12:00',1,'ONCE','2024-10-07','2024-10-07',
     'Midterm Exam — Computer Programming 1','MIDTERM','IT102',2,3),
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','08:00','10:00',1,'ONCE','2024-12-09','2024-12-09',
     'Final Exam — Introduction to Computing','FINAL','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','10:00','12:00',1,'ONCE','2024-12-09','2024-12-09',
     'Final Exam — Computer Programming 1','FINAL','IT102',2,3),
    ('RM-302','EMP-011',['BSBA-1A'],'Principles of Management','08:00','10:00',3,'ONCE','2024-12-11','2024-12-11',
     'Final Exam — Principles of Management','FINAL','BA101',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Introduction to Accounting','08:00','10:00',4,'ONCE','2024-12-12','2024-12-12',
     'Final Exam — Introduction to Accounting','FINAL','ACC101',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, etitle, etype, sc, lec, lab in comp_col_exams:
    make_entry('COLLEGE',col_c2,col_c2_s1,room,emp,secs,subj,st,et,day,rec,sd,ed,
               'PUBLISHED',comp_col_secs,activity_type='EXAM',
               exam_title=etitle,exam_type=etype,subject_code=sc,lec_units=lec,lab_units=lab)

print(f"[OK] {len(comp_col_class)+len(comp_col_exams)} College entries (COMPLETED 2024-2025)")


# ── ACTIVE 2025-2026: SHS CLASS entries (mix PUBLISHED + DRAFT) ─

act_shs_class = [
    # (room, emp, [sections], subject, start, end, day, recurrence, start_date, end_date, status, subj_code, lec, lab)
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','07:00','08:00',1,'WEEKLY','2025-06-02','2025-10-24','PUBLISHED','GEN-MATH-11',4,0),
    ('RM-101','EMP-001',['11-STEM-B'],'General Mathematics','08:00','09:00',1,'WEEKLY','2025-06-02','2025-10-24','PUBLISHED','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-STEM-A'],'Oral Communication','09:00','10:00',1,'WEEKLY','2025-06-02','2025-10-24','PUBLISHED','ORAL-COMM-11',4,0),
    ('RM-102','EMP-002',['11-ABM-A'],'Oral Communication','10:00','11:00',1,'WEEKLY','2025-06-02','2025-10-24','PUBLISHED','ORAL-COMM-11',4,0),
    ('RM-103','EMP-003',['11-STEM-A'],'Earth Science','11:00','12:00',1,'WEEKLY','2025-06-02','2025-10-24','PUBLISHED','EARTH-SCI-11',4,0),
    ('RM-203','EMP-003',['11-STEM-B'],'Earth Science','13:00','14:00',1,'WEEKLY','2025-06-02','2025-10-24','PUBLISHED','EARTH-SCI-11',4,0),
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','07:00','08:00',3,'WEEKLY','2025-06-04','2025-10-24','PUBLISHED','GEN-MATH-11',4,0),
    ('RM-101','EMP-001',['11-STEM-B'],'General Mathematics','08:00','09:00',3,'WEEKLY','2025-06-04','2025-10-24','PUBLISHED','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-HUMSS-A'],'Reading and Writing','07:00','08:00',2,'WEEKLY','2025-06-03','2025-10-24','PUBLISHED','READ-WRITE-11',4,0),
    ('RM-203','EMP-004',['11-ABM-A'],'Organization and Management','07:00','08:00',2,'WEEKLY','2025-06-03','2025-10-24','DRAFT','ORG-MGT-11',4,0),
    ('LB-101','EMP-007',['11-TVL-ICT-A'],'Computer Systems Servicing','07:00','09:00',2,'WEEKLY','2025-06-03','2025-10-24','PUBLISHED','CSS-11',2,4),
    ('RM-201','EMP-005',['12-STEM-A'],'Physical Education','13:00','14:00',4,'WEEKLY','2025-06-05','2025-10-24','PUBLISHED',None,0,0),
    ('RM-201','EMP-005',['12-ABM-A'],'Physical Education','14:00','15:00',4,'WEEKLY','2025-06-05','2025-10-24','PUBLISHED',None,0,0),
    ('RM-202','EMP-006',['12-STEM-A'],'Media and Information Literacy','07:00','08:00',5,'WEEKLY','2025-06-06','2025-10-24','DRAFT','MEDIA-INFO-12',3,0),
    ('RM-202','EMP-006',['12-HUMSS-A'],'Media and Information Literacy','08:00','09:00',5,'WEEKLY','2025-06-06','2025-10-24','DRAFT','MEDIA-INFO-12',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, status, sc, lec, lab in act_shs_class:
    make_entry('SHS',shs_a,shs_a_s1_g11,room,emp,secs,subj,st,et,day,rec,sd,ed,
               status,act_shs_secs,subject_code=sc,lec_units=lec,lab_units=lab)

# ── ACTIVE 2025-2026: SHS EXAM entries ──────────────────────────

act_shs_exams = [
    # Midterm exams (August 2025 — PUBLISHED, already happened)
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','08:00','10:00',1,'ONCE','2025-08-25','2025-08-25',
     'PUBLISHED','Midterm Exam — General Mathematics','MIDTERM','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-STEM-A'],'Oral Communication','10:00','12:00',1,'ONCE','2025-08-25','2025-08-25',
     'PUBLISHED','Midterm Exam — Oral Communication','MIDTERM','ORAL-COMM-11',4,0),
    ('RM-103','EMP-003',['11-STEM-A'],'Earth Science','08:00','10:00',2,'ONCE','2025-08-26','2025-08-26',
     'PUBLISHED','Midterm Exam — Earth Science','MIDTERM','EARTH-SCI-11',4,0),
    ('RM-201','EMP-005',['12-STEM-A'],'Statistics and Probability','08:00','10:00',3,'ONCE','2025-08-27','2025-08-27',
     'PUBLISHED','Midterm Exam — Statistics and Probability','MIDTERM','STAT-PROB-12',4,0),
    # Final exams (October 2025 — DRAFT, upcoming)
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','08:00','10:00',1,'ONCE','2025-10-13','2025-10-13',
     'DRAFT','Final Exam — General Mathematics','FINAL','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-STEM-A'],'Oral Communication','10:00','12:00',1,'ONCE','2025-10-13','2025-10-13',
     'DRAFT','Final Exam — Oral Communication','FINAL','ORAL-COMM-11',4,0),
    ('RM-103','EMP-003',['11-STEM-A'],'Earth Science','08:00','10:00',2,'ONCE','2025-10-14','2025-10-14',
     'DRAFT','Final Exam — Earth Science','FINAL','EARTH-SCI-11',4,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, status, etitle, etype, sc, lec, lab in act_shs_exams:
    make_entry('SHS',shs_a,shs_a_s1_g11,room,emp,secs,subj,st,et,day,rec,sd,ed,
               status,act_shs_secs,activity_type='EXAM',
               exam_title=etitle,exam_type=etype,subject_code=sc,lec_units=lec,lab_units=lab)

print(f"[OK] {len(act_shs_class)+len(act_shs_exams)} SHS entries (ACTIVE 2025-2026)")


# ── ACTIVE 2025-2026: College CLASS entries ──────────────────────

act_col_class = [
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','07:00','08:30',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','08:30','11:30',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','IT102',2,3),
    ('RM-302','EMP-009',['BSIT-2A'],'Networking Fundamentals','07:00','08:30',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','IT203',3,0),
    ('LB-102','EMP-010',['BSIT-2A'],'Database Management Systems','08:30','11:30',2,'WEEKLY','2025-08-12','2025-12-19','PUBLISHED','IT202',2,3),
    ('RM-301','EMP-013',['BSIT-1A'],'Mathematics in the Modern World','07:00','08:30',2,'WEEKLY','2025-08-12','2025-12-19','PUBLISHED','GE103',3,0),
    ('RM-301','EMP-013',['BSIT-1B'],'Mathematics in the Modern World','08:30','10:00',2,'WEEKLY','2025-08-12','2025-12-19','PUBLISHED','GE103',3,0),
    ('RM-302','EMP-011',['BSBA-1A'],'Principles of Management','07:00','08:30',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','BA101',3,0),
    ('RM-302','EMP-011',['BSBA-2A'],'Marketing Management','08:30','10:00',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','BA201',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Introduction to Accounting','07:00','08:30',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','ACC101',3,0),
    ('RM-401','EMP-012',['BSACCO-2A'],'Intermediate Accounting','08:30','10:00',1,'WEEKLY','2025-08-11','2025-12-19','PUBLISHED','ACC201',3,0),
    ('RM-301','EMP-010',['BSIT-3A'],'Systems Analysis and Design','10:00','11:30',3,'WEEKLY','2025-08-13','2025-12-19','PUBLISHED','IT301',3,0),
    ('LB-102','EMP-009',['BSIT-3A'],'Web Development','11:30','14:30',3,'WEEKLY','2025-08-13','2025-12-19','DRAFT','IT302',2,3),
    ('RM-302','EMP-013',['BSBA-1A'],'Business Mathematics','10:00','11:30',3,'WEEKLY','2025-08-13','2025-12-19','DRAFT','BA102',3,0),
    ('RM-401','EMP-014',['BSBA-2A'],'Financial Management','10:00','11:30',4,'WEEKLY','2025-08-14','2025-12-19','DRAFT','BA202',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Understanding the Self','13:00','14:30',4,'WEEKLY','2025-08-14','2025-12-19','PUBLISHED','GE101',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, status, sc, lec, lab in act_col_class:
    make_entry('COLLEGE',col_a,col_a_s1,room,emp,secs,subj,st,et,day,rec,sd,ed,
               status,act_col_secs,subject_code=sc,lec_units=lec,lab_units=lab)

# ── ACTIVE 2025-2026: College EXAM entries ───────────────────────

act_col_exams = [
    # Midterm (October 2025 — PUBLISHED)
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','08:00','10:00',1,'ONCE','2025-10-06','2025-10-06',
     'PUBLISHED','Midterm Exam — Introduction to Computing','MIDTERM','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','10:00','12:00',1,'ONCE','2025-10-06','2025-10-06',
     'PUBLISHED','Midterm Exam — Computer Programming 1','MIDTERM','IT102',2,3),
    ('RM-302','EMP-009',['BSIT-2A'],'Networking Fundamentals','08:00','10:00',2,'ONCE','2025-10-07','2025-10-07',
     'PUBLISHED','Midterm Exam — Networking Fundamentals','MIDTERM','IT203',3,0),
    ('RM-302','EMP-011',['BSBA-1A'],'Principles of Management','10:00','12:00',2,'ONCE','2025-10-07','2025-10-07',
     'PUBLISHED','Midterm Exam — Principles of Management','MIDTERM','BA101',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Introduction to Accounting','08:00','10:00',3,'ONCE','2025-10-08','2025-10-08',
     'PUBLISHED','Midterm Exam — Introduction to Accounting','MIDTERM','ACC101',3,0),
    # Finals (December 2025 — DRAFT, upcoming)
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','08:00','10:00',1,'ONCE','2025-12-15','2025-12-15',
     'DRAFT','Final Exam — Introduction to Computing','FINAL','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','10:00','12:00',1,'ONCE','2025-12-15','2025-12-15',
     'DRAFT','Final Exam — Computer Programming 1','FINAL','IT102',2,3),
    ('RM-302','EMP-011',['BSBA-1A'],'Principles of Management','08:00','10:00',3,'ONCE','2025-12-17','2025-12-17',
     'DRAFT','Final Exam — Principles of Management','FINAL','BA101',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Introduction to Accounting','08:00','10:00',4,'ONCE','2025-12-18','2025-12-18',
     'DRAFT','Final Exam — Introduction to Accounting','FINAL','ACC101',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, status, etitle, etype, sc, lec, lab in act_col_exams:
    make_entry('COLLEGE',col_a,col_a_s1,room,emp,secs,subj,st,et,day,rec,sd,ed,
               status,act_col_secs,activity_type='EXAM',
               exam_title=etitle,exam_type=etype,subject_code=sc,lec_units=lec,lab_units=lab)

print(f"[OK] {len(act_col_class)+len(act_col_exams)} College entries (ACTIVE 2025-2026)")


# ── DRAFT 2026-2027: SHS CLASS entries ──────────────────────────

draft_shs_class = [
    ('RM-101','EMP-001',['11-STEM-A'],'General Mathematics','07:00','08:00',1,'WEEKLY','2026-06-01','2026-10-23','DRAFT','GEN-MATH-11',4,0),
    ('RM-101','EMP-001',['11-STEM-B'],'General Mathematics','08:00','09:00',1,'WEEKLY','2026-06-01','2026-10-23','DRAFT','GEN-MATH-11',4,0),
    ('RM-102','EMP-002',['11-ABM-A'],'Oral Communication','09:00','10:00',1,'WEEKLY','2026-06-01','2026-10-23','DRAFT','ORAL-COMM-11',4,0),
    ('RM-203','EMP-003',['12-STEM-A'],'Basic Calculus','07:00','08:00',2,'WEEKLY','2026-06-02','2026-10-23','DRAFT','CALC-12',4,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, status, sc, lec, lab in draft_shs_class:
    make_entry('SHS',shs_d,shs_d_s1_g11,room,emp,secs,subj,st,et,day,rec,sd,ed,
               status,draft_shs_secs,subject_code=sc,lec_units=lec,lab_units=lab)

print(f"[OK] {len(draft_shs_class)} SHS entries (DRAFT 2026-2027)")

# ── DRAFT 2026-2027: College CLASS entries ───────────────────────

draft_col_class = [
    ('RM-301','EMP-008',['BSIT-1A'],'Introduction to Computing','07:00','08:30',1,'WEEKLY','2026-08-10','2026-12-18','DRAFT','IT101',3,0),
    ('LB-101','EMP-008',['BSIT-1A'],'Computer Programming 1','08:30','11:30',1,'WEEKLY','2026-08-10','2026-12-18','DRAFT','IT102',2,3),
    ('RM-302','EMP-011',['BSBA-1A'],'Principles of Management','07:00','08:30',2,'WEEKLY','2026-08-11','2026-12-18','DRAFT','BA101',3,0),
    ('RM-401','EMP-012',['BSACCO-1A'],'Introduction to Accounting','07:00','08:30',3,'WEEKLY','2026-08-12','2026-12-18','DRAFT','ACC101',3,0),
]

for room, emp, secs, subj, st, et, day, rec, sd, ed, status, sc, lec, lab in draft_col_class:
    make_entry('COLLEGE',col_d,col_d_s1,room,emp,secs,subj,st,et,day,rec,sd,ed,
               status,draft_col_secs,subject_code=sc,lec_units=lec,lab_units=lab)

print(f"[OK] {len(draft_col_class)} College entries (DRAFT 2026-2027)")


# ══════════════════════════════════════════════════════════════════
# 10. CALENDAR EVENTS (across all terms)
# ══════════════════════════════════════════════════════════════════

cal_events = [
    # ── COMPLETED 2024-2025: SHS ──
    ('SHS Midterm Exam Week (2024-2025)','EXAM_PERIOD',1,'2024-08-19 07:00:00','2024-08-23 17:00:00',
     shs_c2,shs_c2_s1_g11,'SHS','MIDTERM',None),
    ('SHS Final Exam Week (2024-2025)','EXAM_PERIOD',1,'2024-10-14 07:00:00','2024-10-18 17:00:00',
     shs_c2,shs_c2_s1_g11,'SHS','FINAL',None),
    ('Semestral Break (SHS 2024-2025)','BREAK',0,'2024-10-28 00:00:00','2024-11-03 23:59:59',
     shs_c2,None,'SHS',None,None),

    # ── COMPLETED 2024-2025: College ──
    ('College Midterm Exam Week (2024-2025)','EXAM_PERIOD',1,'2024-10-07 07:00:00','2024-10-11 17:00:00',
     col_c2,col_c2_s1,'COLLEGE','MIDTERM',None),
    ('College Final Exam Week (2024-2025)','EXAM_PERIOD',1,'2024-12-09 07:00:00','2024-12-13 17:00:00',
     col_c2,col_c2_s1,'COLLEGE','FINAL',None),
    ('Semestral Break (College 2024-2025)','BREAK',0,'2024-12-23 00:00:00','2025-01-05 23:59:59',
     col_c2,None,'COLLEGE',None,None),

    # ── Shared holidays (2024-2025) ──
    ('Rizal Day 2024','HOLIDAY',1,'2024-12-30 00:00:00','2024-12-30 23:59:59',
     None,None,None,None,'National holiday'),
    ('New Year 2025','HOLIDAY',1,'2025-01-01 00:00:00','2025-01-01 23:59:59',
     None,None,None,None,'National holiday'),

    # ── ACTIVE 2025-2026: SHS ──
    ('Foundation Day','INSTITUTIONAL_EVENT',0,'2025-09-15 00:00:00','2025-09-15 23:59:59',
     shs_a,shs_a_s1_g11,'SHS',None,'Annual school foundation celebration'),
    ('Linggo ng Wika','INSTITUTIONAL_EVENT',0,'2025-08-18 00:00:00','2025-08-22 23:59:59',
     shs_a,shs_a_s1_g11,'SHS',None,'Filipino language week celebration'),
    ('SHS Midterm Exam Week','EXAM_PERIOD',1,'2025-08-25 07:00:00','2025-08-29 17:00:00',
     shs_a,shs_a_s1_g11,'SHS','MIDTERM',None),
    ('SHS Finals Week','EXAM_PERIOD',1,'2025-10-13 07:00:00','2025-10-17 17:00:00',
     shs_a,shs_a_s1_g11,'SHS','FINAL',None),
    ('Semestral Break (SHS)','BREAK',0,'2025-10-27 00:00:00','2025-11-02 23:59:59',
     shs_a,None,'SHS',None,None),
    ('Enrollment Period 2nd Sem','INSTITUTIONAL_EVENT',0,'2025-10-20 08:00:00','2025-10-24 17:00:00',
     shs_a,None,'SHS',None,'2nd semester enrollment window'),

    # ── ACTIVE 2025-2026: College ──
    ('College Foundation Day','INSTITUTIONAL_EVENT',0,'2025-09-22 00:00:00','2025-09-22 23:59:59',
     col_a,col_a_s1,'COLLEGE',None,'Annual college foundation'),
    ('College Midterm Exams','EXAM_PERIOD',1,'2025-10-06 07:00:00','2025-10-10 17:00:00',
     col_a,col_a_s1,'COLLEGE','MIDTERM',None),
    ('College Finals Week','EXAM_PERIOD',1,'2025-12-15 07:00:00','2025-12-19 17:00:00',
     col_a,col_a_s1,'COLLEGE','FINAL',None),
    ('Semestral Break (College)','BREAK',0,'2025-12-22 00:00:00','2026-01-04 23:59:59',
     col_a,None,'COLLEGE',None,None),

    # ── Shared holidays (2025-2026) ──
    ('Rizal Day 2025','HOLIDAY',1,'2025-12-30 00:00:00','2025-12-30 23:59:59',
     None,None,None,None,'National holiday'),
    ('New Year 2026','HOLIDAY',1,'2026-01-01 00:00:00','2026-01-01 23:59:59',
     None,None,None,None,'National holiday'),
    ('EDSA People Power Anniversary','HOLIDAY',1,'2026-02-25 00:00:00','2026-02-25 23:59:59',
     None,None,None,None,'National holiday'),
    ('Araw ng Kagitingan','HOLIDAY',1,'2026-04-09 00:00:00','2026-04-09 23:59:59',
     None,None,None,None,'National holiday — Day of Valor'),

    # ── DRAFT 2026-2027: Planned events ──
    ('SHS Midterm Exam Week (2026-2027)','EXAM_PERIOD',1,'2026-08-17 07:00:00','2026-08-21 17:00:00',
     shs_d,shs_d_s1_g11,'SHS','MIDTERM','Planned exam period'),
    ('College Midterm Exams (2026-2027)','EXAM_PERIOD',1,'2026-10-05 07:00:00','2026-10-09 17:00:00',
     col_d,col_d_s1,'COLLEGE','MIDTERM','Planned exam period'),
    ('Foundation Day 2026','INSTITUTIONAL_EVENT',0,'2026-09-15 00:00:00','2026-09-15 23:59:59',
     shs_d,None,None,None,'Annual foundation day (planned)'),
]

for title, etype, blocking, start, end, ay_id, sem_id, dept, exam_type, desc in cal_events:
    eid = uid()
    c.execute('''INSERT INTO calendar_events
                 (id,title,event_type,is_blocking,is_all_day,start_datetime,end_datetime,
                  academic_year_id,semester_id,department,exam_type,description,
                  is_active,created_at,updated_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
              (eid,title,etype,blocking,0,start,end,ay_id,sem_id,dept,exam_type,desc,1,now,now))
    audit('calendar_event', eid, dept, 'CREATE', {'title':title})

print(f"[OK] {len(cal_events)} calendar events")


# ══════════════════════════════════════════════════════════════════
# COMMIT + SUMMARY
# ══════════════════════════════════════════════════════════════════

conn.commit()
conn.execute("PRAGMA foreign_keys = ON")
conn.close()

total_class = (len(comp_shs_class) + len(comp_col_class) +
               len(act_shs_class) + len(act_col_class) +
               len(draft_shs_class) + len(draft_col_class))
total_exam = (len(comp_shs_exams) + len(comp_col_exams) +
              len(act_shs_exams) + len(act_col_exams))
total_sections = (len(comp_shs_secs) + len(comp_col_secs) +
                  len(act_shs_secs) + len(act_col_secs) +
                  len(draft_shs_secs) + len(draft_col_secs))

print()
print("=" * 64)
print("SEED COMPLETE")
print("=" * 64)
print()
print("ACCOUNT:")
print("  Password: AdminPassword123")
print()
print("ACADEMIC TERMS:")
print("  +-- SHS ---------------------------------------------------+")
print("  | COMPLETED  A.Y. 2023-2024 (lean -- AY/semesters)         |")
print("  | COMPLETED  A.Y. 2024-2025 (rich -- sections/exams)       |")
print("  | PUBLISHED  A.Y. 2025-2026 (active, is_active=1)          |")
print("  | DRAFT      A.Y. 2026-2027 (planning)                     |")
print("  +----------------------------------------------------------+")
print("  +-- COLLEGE -----------------------------------------------+")
print("  | COMPLETED  A.Y. 2023-2024 (lean -- AY/semesters)         |")
print("  | COMPLETED  A.Y. 2024-2025 (rich -- sections/exams)       |")
print("  | PUBLISHED  A.Y. 2025-2026 (active, is_active=1)          |")
print("  | DRAFT      A.Y. 2026-2027 (planning)                     |")
print("  +----------------------------------------------------------+")
print()
print("DATA SUMMARY:")
print(f"  Academic Years:    4 SHS + 4 COLLEGE = 8 total")
print(f"  Semesters:         SHS 12 + College 10 = 22 total")
print(f"  Quarters (SHS):    24 (8 per term x 3 terms)")
print(f"  Rooms:             {len(rooms_data)}")
print(f"  Personnel:         {len(personnel_data)} (with honorific/credentials)")
print(f"  Programs:          {len(programs_data)}")
print(f"  Subjects:          {len(subjects_data)}")
print(f"  Sections:          {total_sections} (COMPLETED + ACTIVE + DRAFT)")
print(f"  Schedule Entries:  {total_class} CLASS + {total_exam} EXAM = {total_class + total_exam} total")
print(f"  Calendar Events:   {len(cal_events)}")
print("=" * 64)
