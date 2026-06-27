> **Product:** Schedule Management System
> **Version:** 0.2.0
> **Date:** 2026-06-27
> **Company / Team:** JW-Tech
> **References:** [SRS Specification](SRS_ScheduleManagement_v1.0.md), [Architecture](Architecture_ScheduleManagement.md)

---

# Schedule Management System — User Manual

---

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. System Requirements](#2-system-requirements)
- [3. Getting Started](#3-getting-started)
  - [3.1 Installing the Application](#31-installing-the-application)
  - [3.2 First-Time Setup](#32-first-time-setup)
  - [3.3 Logging In](#33-logging-in)
  - [3.4 Understanding the Department Switcher](#34-understanding-the-department-switcher)
- [4. Navigation Overview](#4-navigation-overview)
  - [4.1 Main Dashboard / Home Screen](#41-main-dashboard--home-screen)
  - [4.2 Sidebar Navigation Menu](#42-sidebar-navigation-menu)
  - [4.3 Keyboard Shortcuts](#43-keyboard-shortcuts)
- [5. Core Features](#5-core-features)
  - [5.1 Dashboard](#51-dashboard)
  - [5.2 Class Schedules](#52-class-schedules)
  - [5.3 Exam Schedules](#53-exam-schedules)
  - [5.4 Room Management](#54-room-management)
  - [5.5 Section Management](#55-section-management)
  - [5.6 Personnel Management](#56-personnel-management)
  - [5.7 Subject Bank](#57-subject-bank)
  - [5.8 Programs](#58-programs)
  - [5.9 Academic Years & Semesters](#59-academic-years--semesters)
  - [5.10 Academic Calendar](#510-academic-calendar)
  - [5.11 Carry Forward](#511-carry-forward)
  - [5.12 Data Import](#512-data-import)
  - [5.13 Data Export](#513-data-export)
  - [5.14 Trash & Data Recovery](#514-trash--data-recovery)
  - [5.15 Audit Log](#515-audit-log)
- [6. Settings & Configuration](#6-settings--configuration)
  - [6.1 Password Management](#61-password-management)
  - [6.2 Security Questions](#62-security-questions)
  - [6.3 Institution Logo](#63-institution-logo)
  - [6.4 Institution Details](#64-institution-details)
  - [6.5 Export Footer Credits](#65-export-footer-credits)
  - [6.6 Prepared By / Received By Defaults](#66-prepared-by--received-by-defaults)
  - [6.7 Database Backup & Restore](#67-database-backup--restore)
  - [6.8 Application Updates](#68-application-updates)
  - [6.9 Danger Zone — Reset Application](#69-danger-zone--reset-application)
- [7. Troubleshooting](#7-troubleshooting)
- [8. Frequently Asked Questions (FAQ)](#8-frequently-asked-questions-faq)
- [9. Glossary](#9-glossary)
- [10. Support & Contact Information](#10-support--contact-information)
- [11. Document Version History](#11-document-version-history)

---

## 1. Introduction

Welcome! This manual is your complete guide to using the **Schedule Management System**. Whether you are using it for the first time or looking for help with a specific feature, you will find everything you need right here.

**What is the Schedule Management System?**

The Schedule Management System is an offline desktop application designed for academic institutions that manage two departments — **Senior High School (SHS)** and **College**. It replaces manual scheduling workflows — spreadsheets, paper-based timetables, and ad-hoc coordination — with a structured, conflict-aware system. With it, you can create, validate, and publish conflict-free class and exam schedules, manage rooms, personnel, and sections, and export professional schedule reports — all from one place, without any internet connection required.

**Who is this manual for?**

This manual is written for the **Institutional Administrator** — the single user responsible for all scheduling operations across both SHS and College departments. You do not need any technical background to follow along. If you can use a Windows computer and navigate desktop applications, you have all the skills you need to get started.

**How to use this document**

- **New users:** We recommend reading Sections 2 through 5 in order. These sections walk you through installing the application, setting up your account, and understanding every feature.
- **Returning users:** Jump directly to the section you need using the Table of Contents above. Each section is self-contained so you can read it on its own.
- **Having trouble?** Head straight to the [Troubleshooting](#7-troubleshooting) or [FAQ](#8-frequently-asked-questions-faq) sections for quick answers.

Throughout this manual you will see these special callout boxes:

> 💡 **Tip:** These boxes contain helpful hints that can save you time or make your experience better.

> ⚠️ **Note:** These boxes contain important warnings or information you should pay attention to before proceeding.

---

## 2. System Requirements

Before you begin, make sure your computer meets the following requirements. This ensures the Schedule Management System runs smoothly.

| Requirement | Minimum | Recommended |
|---|---|---|
| Operating System | Windows 10 (64-bit) | Windows 11 (64-bit) |
| Processor | Intel Core i3 or equivalent | Intel Core i5 or higher |
| RAM | 4 GB | 8 GB or higher |
| Storage Space | 200 MB available disk space | 500 MB or more (to accommodate database growth over time) |
| Screen Resolution | 1280 × 720 pixels | 1920 × 1080 pixels or higher |
| Internet Connection | Not required — the application is fully offline | Not required |

> 💡 **Tip:** The Schedule Management System is a fully offline desktop application. No internet connection, no external database server, and no cloud account is needed. All your data is stored locally on your computer in a SQLite database file.

> ⚠️ **Note:** This application is designed and tested for Windows only. It is not supported on macOS or Linux.

---

## 3. Getting Started

This section walks you through everything you need to do the very first time you use the Schedule Management System.

### 3.1 Installing the Application

1. Locate the **Schedule Management System installer** (`.exe` file) provided to you by your IT administrator or developer.
2. Double-click the installer file to begin the installation process.
3. Follow the on-screen prompts — accept the license agreement and choose an installation directory (the default location is recommended for most users).
4. Click **"Install"** and wait for the installation to complete.
5. Once the installation finishes, click **"Finish."** The application may launch automatically, or you can find it in your Start Menu under **"Schedule Management System."**

> 💡 **Tip:** The application enforces a single-instance lock — you can only run one copy of it at a time. If you try to open a second window, the existing window will be brought to the front instead.

### 3.2 First-Time Setup

The very first time you launch the application, you will be presented with a **First-Time Setup** screen. This only appears once.

1. **Welcome Screen:** You will see a setup page prompting you to create your administrator credentials.
2. **Admin Password:** Enter a strong password. The setup screen shows real-time complexity indicators as you type. Your password must meet the following requirements:
   - At least 8 characters long
   - Contains at least one uppercase letter
   - Contains at least one lowercase letter
   - Contains at least one number
3. **Confirm Password:** Re-enter your password to confirm it matches.
4. **Security Questions:** Set up two security questions for password recovery:
   - Select a question from the predefined dropdown list, or write a custom question.
   - Enter your answer for each question.
   - These questions will be used to verify your identity if you forget your password.
5. Click **"Complete Setup"** to finalize your credentials.
6. Once your credentials are created, you will be taken to the **Login** screen.

![The First-Time Setup screen showing fields for password, confirm password, and security questions](screenshots/setup-page.png)

> ⚠️ **Note:** There is only one administrator account. This system does not support multiple users. Keep your credentials and security question answers safe — you will need them if you ever forget your password.

### 3.3 Logging In

Once your account has been created, here is how to log in:

1. Launch the **Schedule Management System** from your Start Menu or desktop shortcut.
2. On the **Login** screen, enter your **password** in the password field. (There is only one administrator account, so no username is required.)
3. You can click the **eye icon** next to the password field to toggle password visibility.
4. Click the **"Log In"** button.
5. If your password is correct, you will be taken to the **Dashboard** — you are now logged in.

![The Login screen showing the password field and Log In button](screenshots/login-page.png)

> ⚠️ **Note:** After too many failed login attempts, a countdown timer will appear showing how long you need to wait before trying again (e.g., "Too many attempts. Try again in Xs"). This rate limiting protects your account.

**Forgot your password?**

If you forget your password, click the **"Forgot Password?"** link on the login screen:

1. A recovery modal will appear asking you to answer the **two security questions** you set up during first-time setup.
2. Enter the answers to both questions.
3. If your answers are correct, you will be prompted to create a **new password** (with the same complexity requirements as before).
4. After successfully resetting your password, you will be returned to the login screen to log in with your new password.

### 3.4 Understanding the Department Switcher

The Schedule Management System manages two separate departments: **SHS (Senior High School)** and **College**. These departments have different academic calendars, section models, and exam structures.

- **Department Switcher:** Located in the header/navigation area, you will find a toggle or dropdown to switch between **SHS** and **College**. This is visible at all times while you are logged in.
- **How it works:** When you select a department, all data entry forms and list views throughout the application are filtered to show only data belonging to that department.
- **Exception:** The **Academic Calendar** is institution-wide and is not affected by the department switcher.

| Feature | SHS | College |
|---|---|---|
| School Year Cycle | June – March | August – May |
| Semesters | 1st Semester, 2nd Semester | 1st Semester, 2nd Semester, Summer |
| Exam Types | Q1, Q2, Q3, Q4 (quarter-based) | Prelim, Midterm, Pre-Finals, Finals |
| Section Model | Homeroom (fixed cohort) | Course (per-subject enrollment) |

> 💡 **Tip:** Always check which department is active before creating or editing records. The department switcher is your primary context control — it determines what data you see across the entire application.

---

## 4. Navigation Overview

This section gives you a bird's-eye view of the Schedule Management System interface so you know where everything is and how to move around.

### 4.1 Main Dashboard / Home Screen

The **Dashboard** is the first screen you see after logging in. It is your home base — it gives you a quick summary of everything important across the currently selected department.

The Dashboard displays:

- **Summary Statistics Cards** — Key metrics at a glance, such as total number of rooms, personnel, sections, published schedules, and draft schedules for the active department.
- **Quick status indicators** — Visual indicators showing whether you have items that need attention, such as unpublished drafts or scheduling conflicts.

![The Dashboard screen showing summary statistic cards for the active department](screenshots/dashboard-overview.png)

### 4.2 Sidebar Navigation Menu

The navigation sidebar on the left side of the screen is your primary way to move between different sections of the application. The sidebar is always visible.

**Top-Level (no group header):**

| Menu Item | Description |
|---|---|
| **Dashboard** | Returns you to the main home screen with summary statistics |
| **Schedule** | Opens the class schedule builder and viewer for creating, editing, and publishing schedule entries |
| **Exam Schedule** | Opens the exam schedule management page for creating and managing examination schedules |

**Resources Section:**

| Menu Item | Description |
|---|---|
| **Rooms** | Manage physical rooms and spaces available for scheduling |
| **Sections** | Manage homeroom sections (SHS) or course sections (College) |
| **Personnel** | Manage faculty members and their teaching assignments |
| **Subject Bank** | Manage the catalog of subjects/courses available for scheduling |
| **Programs** | Manage academic programs/strands and curricula |

**Calendar Section:**

| Menu Item | Description |
|---|---|
| **Academic Years** | Create and manage academic year periods with semesters |
| **Calendar** | View and manage the institution-wide academic calendar with events |

**Tools Section:**

| Menu Item | Description |
|---|---|
| **Carry Forward** | Clone data (sections, schedules, events) from a previous academic term to a new one |
| **Export Template** | Download pre-formatted Excel templates for data import |
| **Audit Log** | View a chronological record of all data changes made in the system |

**System Section:**

| Menu Item | Description |
|---|---|
| **Settings** | Access password management, institution logo, backup/restore, and other configuration |
| **Trash** | View and restore soft-deleted records |

Additionally:

- **Help** button (**?** icon) — Located in the page header area. Opens a context-sensitive help modal with step-by-step instructions specific to the page you are currently viewing. Includes a "Purpose" section, "How to Use" steps, and quick links to related pages.
- **Sign Out** button — Located at the bottom of the sidebar. Logs you out and returns to the login screen.
- **Sidebar collapse** — The sidebar automatically collapses on smaller screens (below 900px width). You can also toggle it manually.
- **History Mode Banner** — When viewing data from a past (non-active) academic year, an amber banner appears across the top of the screen indicating you are in historical view mode, with a **"Back to Active Term"** button to return.
- **Grade Level Tabs** — When the SHS department is selected, Grade 11 / Grade 12 tabs appear on the Schedule, Exams, and Calendar pages to filter by grade level.

### 4.3 Keyboard Shortcuts

The Schedule Management System supports keyboard shortcuts for efficient navigation:

| Shortcut | Action |
|---|---|
| **Escape** | Closes the currently open form, panel, or modal dialog |
| **Escape** (when in a text field) | Blurs (deselects) the active text field first; press again to close the form |

> 💡 **Tip:** When editing a text field, pressing **Escape** will first blur (deselect) the field. Press **Escape** again to close the containing form or panel.

---

## 5. Core Features

This section covers the main features of the Schedule Management System in detail. For each feature, you will find a description of what it does, step-by-step instructions on how to use it, and helpful tips.

---

### 5.1 Dashboard

**What it does:** The Dashboard is your personal command center. It gives you a quick, at-a-glance overview of key metrics for the currently selected department — such as how many rooms, personnel, and sections are configured, and how many schedule entries are in draft versus published status.

**How to use it:**

1. After logging in, you will land on the Dashboard automatically. If you have navigated away, click **"Dashboard"** in the left sidebar to return.
2. The Dashboard shows the **Active Term** information — current academic year, semester, and quarter details. For SHS, it shows separate cards for Grade 11 and Grade 12 with their individual semester/quarter status.
3. Review the **Statistics Grid** — seven color-coded cards showing:
   - **Total Entries** (blue) — Total number of schedule entries
   - **Drafts** (amber) — Entries still in draft status
   - **Published** (green) — Finalized and published entries
   - **Conflicts** (red/gray) — Count of hard conflicts detected
   - **Rooms** (purple) — Total active rooms
   - **Personnel** (cyan) — Total active personnel
   - **Sections** (indigo) — Total active sections
4. Use the **Quick Action** buttons to jump to common tasks:
   - **"New Schedule Entry"** — Opens the Schedule builder
   - **"Import CSV"** — Opens the Import page
   - **"View Audit Log"** — Opens the Audit Log
   - **"Export Schedule"** — Opens Settings for export
5. Use the **Department Switcher** in the header to toggle between SHS and College views. The Dashboard statistics will update to reflect the selected department.

> 💡 **Tip:** If a warning banner appears about security questions not being configured, click **"Configure Now"** to set them up in Settings. This is important for password recovery.

> 💡 **Tip:** Check the Dashboard regularly to get a quick pulse on your scheduling progress — especially the count of draft entries and conflicts that need attention.

---

### 5.2 Class Schedules

**What it does:** The Schedule page is the heart of the application. It allows you to create, edit, publish, and manage class schedule entries. Each entry represents a specific class session with details like subject, instructor, room, time slot, day(s), and recurrence pattern. The system automatically detects scheduling conflicts (such as room double-bookings or instructor overlaps) and prevents you from saving conflicting entries unless you explicitly override them.

**How to use it:**

1. Click **"Schedule"** in the left sidebar to open the Schedule page.
2. Make sure the correct **department** is selected via the Department Switcher, and that you have selected an active **Academic Year** and **Semester** from the available filters.
3. To **create a new schedule entry:**
   a. Click the **"Add Schedule"** or **"Create"** button.
   b. A form will appear. Fill in the required fields:
      - **Section** — Select the section this class is for.
      - **Subject** — Enter or select the subject name.
      - **Instructor/Personnel** — Select the assigned faculty member.
      - **Room** — Select the room where the class will be held.
      - **Day(s)** — Select which day(s) of the week this class occurs.
      - **Start Time** and **End Time** — Set the time slot for the class.
      - **Recurrence Pattern** — Choose the recurrence (e.g., Weekly, Weekdays, Bi-Weekly).
   c. Click **"Save"** to save the entry as a **Draft**.
4. To **edit** an existing schedule entry, click on it in the list or table and modify the fields in the form.
5. To **publish** schedule entries (make them visible across all schedule views), select the entries and click **"Publish."** Published entries become the official schedule.
6. To **unpublish** entries (revert to draft status), select published entries and click **"Unpublish."**

**Conflict Detection:**

The system checks for the following conflicts when you save a schedule entry:

- **Room conflicts** — Another class is already scheduled in the same room at the same time.
- **Instructor conflicts** — The same instructor is already assigned to another class at the same time.
- **Section conflicts** — The same section already has a class scheduled at the same time.

**Hard conflicts** block saving unless you explicitly choose to override. **Soft conflicts** display a warning but allow saving.

![The Schedule page showing the schedule entry form with section, subject, instructor, room, day, and time fields](screenshots/schedule-page.png)

> 💡 **Tip:** Work with draft entries first and review all conflicts before publishing. This allows you to build out the entire schedule and resolve all conflicts before making it official.

> ⚠️ **Note:** Schedule entries cannot span across midnight. If you need a class that runs past midnight, create two separate entries.

---

### 5.3 Exam Schedules

**What it does:** The Exams page allows you to create and manage examination schedules. Exam types vary by department — SHS uses quarter-based exams (Q1, Q2, Q3, Q4), while College uses semester-based exams (Prelim, Midterm, Pre-Finals, Finals).

**How to use it:**

1. Click **"Exams"** in the left sidebar.
2. Select the correct **department**, **Academic Year**, and **Semester** using the filters.
3. For SHS, select the appropriate **Quarter** to view or create exams for that exam period.
4. To **create a new exam entry:**
   a. Click the **"Add Exam"** or **"Create"** button.
   b. Fill in the exam details:
      - **Exam Type** — Select the exam type (department-specific).
      - **Section** — Select the section.
      - **Subject** — Enter or select the subject.
      - **Room** — Select the exam room.
      - **Date** — Set the exam date.
      - **Start Time** and **End Time** — Set the exam time slot.
      - **Proctor/Instructor** — Select the assigned proctor or instructor.
   c. Click **"Save"** to create the exam entry.
5. The system performs **conflict detection** for exam entries similar to class schedules (room, instructor, and section overlap checks).
6. Use the **Publish/Unpublish** actions to manage the visibility of exam entries.

![The Exams page showing the exam entry form with exam type, section, subject, room, date, and time fields](screenshots/exams-page.png)

> 💡 **Tip:** When scheduling exams, check the **Calendar** view to confirm there are no institution-wide events or holidays that overlap with your planned exam dates.

---

### 5.4 Room Management

**What it does:** The Rooms page allows you to create, edit, view, and archive physical rooms (classrooms, lecture halls, laboratories, etc.) that can be assigned to schedule entries. Each room has a name, building, floor, room type, and capacity.

**How to use it:**

1. Click **"Rooms"** in the left sidebar to open the Rooms page.
2. You will see a **list or table** of all rooms. Use the **search bar** and **filters** (room type, building, floor) to find specific rooms.
3. To **create a new room:**
   a. Click the **"+ New Room"** button.
   b. Fill in the room details:
      - **Room Code** — A unique identifier for the room.
      - **Room Name** — The descriptive name for the room.
      - **Building** — The building where the room is located.
      - **Floor** — The floor number.
      - **Room Type** — Classify the room (e.g., Classroom, Laboratory, Lecture Hall).
      - **Capacity** — The maximum number of occupants (1–10,000).
      - **Department Availability** — Whether the room is **Shared** (available to both departments), **SHS Only**, or **College Only**.
      - **Notes** — Any additional notes about the room (optional).
   c. Click **"Save"** to create the room.
4. Rooms are displayed as **cards** in a paginated grid (6 per page), with **status badges** indicating availability: Available (green), Maintenance (yellow), Inactive (gray).
5. To **view room details**, click on a room card to open its detail page. The detail page shows the room's information, location, capacity, department availability, and a table of **assigned schedule entries** (filterable by semester) with columns for activity type, subject, personnel, section(s), day, time, and status.
6. To **edit** a room, open the edit form from the room's detail page or the list view.
6. To **archive** (soft-delete) a room, use the archive/delete action. Archived rooms are moved to the Trash and can be restored later.

![The Rooms page showing a table of rooms with name, building, floor, type, and capacity columns](screenshots/rooms-page.png)

> 💡 **Tip:** Keep room information up to date, especially capacity. The system does not enforce capacity limits during scheduling, but accurate capacity data helps you make better room assignments.

> ⚠️ **Note:** Archiving a room does not automatically remove it from existing schedule entries. Review and update any affected schedules before archiving a room that is currently in use.

---

### 5.5 Section Management

**What it does:** The Sections page allows you to create, edit, and manage academic sections. The section model differs by department:

- **SHS (Homeroom Sections):** A fixed cohort of students who attend all subjects together as a group. Fields include section name, grade level, strand, and adviser.
- **College (Course Sections):** Sections tied to specific subjects. Fields include section code, subject, program, and year level.

**How to use it:**

1. Click **"Sections"** in the left sidebar.
2. Make sure the correct **department** is selected. The form fields and section model will adapt accordingly.
3. Sections are displayed in a **card view grouped by course/program**, showing section count, total students, and year levels per program. Click on a program card to drill down into its sections.
4. To **create new sections:**
   a. Click the **"Add Section"** or **"Create"** button.
   b. Fill in the section details appropriate to the department:
      - **SHS:** Section name, grade level (11 or 12), strand/track, adviser (optional).
      - **College:** Section code, program, year level, subject, student count.
   c. **Batch Creation (College):** When creating sections, the system can auto-match subjects from the Subject Bank based on the selected program, year level, and semester. This generates one section per matched subject — dramatically faster than creating them one by one.
   d. Click **"Save"** to create the section(s).
5. Use the **search bar** and **filters** (academic year, semester) to narrow down the section list.
6. To **view section details**, click on a section to open its detail page. The detail page displays the section's information and its assigned schedule.
7. To **archive** a section, use the archive action. Archived sections are moved to the Trash.

![The Sections page showing a table of sections with department-specific columns and filter controls](screenshots/sections-page.png)

> 💡 **Tip:** For SHS, sections are department-scoped containers — you assign subjects at the schedule entry level, not at the section level. For College, each section is tied to a specific subject.

---

### 5.6 Personnel Management

**What it does:** The Personnel page allows you to create, edit, and manage faculty members and instructors who can be assigned to class and exam schedules. Each personnel record includes personal information, employment details, and department assignment.

**How to use it:**

1. Click **"Personnel"** in the left sidebar.
2. You will see a **table** listing all personnel. Use the **search bar** and **filters** (department, employment type, status) to find specific faculty.
3. Personnel are displayed in a **card view grouped by type** (Faculty, Staff, Admin), each showing count, active count, and shared count. Click a card to drill down.
4. To **create a new personnel record:**
   a. Click the **"Add Personnel"** or **"Create"** button.
   b. Fill in the personnel details:
      - **Employee ID** — A unique identifier.
      - **Honorific** — Title prefix (e.g., Mr., Ms., Dr.) (optional).
      - **First Name** and **Last Name** — The person's name.
      - **Credentials** — Suffix (e.g., PhD, MBA) (optional).
      - **Email** — Contact email (optional).
      - **Department** — Primary department (SHS or College).
      - **Shared** — Toggle if the person can be assigned to schedules in both departments.
      - **Personnel Type** — Faculty, Staff, or Admin.
      - **Specializations** — Comma-separated areas of expertise, with autocomplete from the Subject Bank.
      - **Max Weekly Hours** — Maximum teaching hours per week.
   c. Click **"Save"** to create the personnel record.
5. To **view personnel details**, click on a personnel record to open the detail page. The detail page shows the person's complete information and their assigned teaching schedule.
6. To **edit** personnel, open the edit form from the detail page or list view.
7. To **archive** personnel, use the archive action. Archived personnel are moved to the Trash.

![The Personnel page showing a table of faculty with name, department, employment type, and specialization columns](screenshots/personnel-page.png)

> 💡 **Tip:** Keep personnel records current. If an instructor is on leave or no longer teaching, archive their record to keep them out of the active personnel list while preserving their historical schedule data.

---

### 5.7 Subject Bank

**What it does:** The Subject Bank page allows you to create and manage a catalog of subjects (courses) that can be referenced when creating schedule entries. This is particularly useful for the College department where sections are tied to specific subjects.

**How to use it:**

1. Click **"Subject Bank"** in the left sidebar.
2. You will see a **table** listing all subjects. Use the **search bar** to find specific subjects.
3. Subjects are displayed in a **card view grouped by course/program**, showing subject count, year levels, and total units per program. Click a card to drill down.
4. To **create a new subject:**
   a. Click the **"Add Subject"** or **"Create"** button.
   b. Fill in the subject details:
      - **Subject Code** — A unique code (e.g., "CS101", "MATH201").
      - **Subject Name** — The full name of the subject.
      - **Course/Program** — The program the subject belongs to (selected from the Programs list).
      - **Year Level** — Which year level this subject is taught in.
      - **Semester Type** — Which semester the subject is offered in (1st, 2nd, or Summer).
      - **Lecture Units** — Number of lecture units.
      - **Lab Units** — Number of lab units.
      - **Pre-requisites** — Any prerequisite subjects (optional).
   c. Click **"Save"** to create the subject.
5. To **edit** a subject, click the edit action on the subject row.
6. To **archive** a subject, use the archive action. The system will check for dependent sections and warn you before deletion.

![The Subject Bank page showing a table of subjects with code, name, units, and department columns](screenshots/subject-bank-page.png)

> 💡 **Tip:** A well-maintained Subject Bank makes schedule creation faster — you can quickly select subjects from your catalog instead of typing them manually each time.

---

### 5.8 Programs

**What it does:** The Programs page allows you to create and manage academic programs (e.g., "BS Computer Science," "STEM Strand"). Programs are used to organize sections and provide structure to the academic hierarchy.

**How to use it:**

1. Click **"Programs"** in the left sidebar.
2. You will see a **list of programs** for the active department.
3. To **create a new program:**
   a. Click the **"Add Program"** or **"Create"** button.
   b. Enter the program details:
      - **Program Code** — A short identifier (e.g., "BSCS", "STEM").
      - **Program Name** — The full descriptive name.
      - **Department** — SHS or College.
   c. Click **"Save"** to create the program.
4. To **edit** or **archive** a program, use the corresponding actions.

![The Programs page showing a list of academic programs with code and name columns](screenshots/programs-page.png)

---

### 5.9 Academic Years & Semesters

**What it does:** The Academic Years page allows you to create and manage academic year periods with their associated semesters. Academic years are fully independent per department — creating or modifying one in SHS has no effect on College, and vice versa.

**How to use it:**

1. Click **"Academic Years"** in the left sidebar.
2. You will see a **list of academic years** for the currently selected department.
3. To **create a new academic year:**
   a. Click the **"Add Academic Year"** or **"Create"** button.
   b. Enter the academic year details:
      - **Year Label** — The academic year name (e.g., "2026-2027").
      - **Start Date** and **End Date** — The beginning and end of the academic year.
   c. Click **"Save"** to create the academic year.
4. To **add semesters** to an academic year, click on the academic year to open its **detail page**, then add semesters:
   - **SHS:** 1st Semester and 2nd Semester only.
   - **College:** 1st Semester, 2nd Semester, and Summer.
5. For each semester, set the **start date** and **end date**.
6. The **Academic Year Detail Page** provides a comprehensive view of the year, its semesters, and all schedule entries within.
7. You can view the **history** of changes to an academic year from the detail page.

![The Academic Years page showing a list of academic years with year label and date range](screenshots/academic-years-page.png)

> ⚠️ **Note:** SHS does not allow Summer semesters. If you attempt to create one under SHS, the system will display the error: "Summer semester is not available for SHS."

> 💡 **Tip:** Set up your academic years and semesters before creating schedule entries. Schedule entries are linked to specific semesters within academic years.

---

### 5.10 Academic Calendar

**What it does:** The Calendar page provides an institution-wide calendar view where you can view and manage academic events, holidays, and important dates. Unlike most other views, the calendar is **not filtered by department** — it shows events across the entire institution.

**How to use it:**

1. Click **"Calendar"** in the left sidebar.
2. You will see a **calendar view** (monthly layout) showing all academic events.
3. To **add a new event:**
   a. Click on a date cell or the **"Add Event"** button.
   b. Enter the event details:
      - **Event Title** — Name of the event (e.g., "Foundation Day", "Enrollment Period").
      - **Date** — The event date (or date range for multi-day events).
      - **Event Type** — Categorize the event (e.g., Holiday, Academic Event, Enrollment).
      - **Description** — Additional details (optional).
   c. Click **"Save"** to create the event.
4. Navigate between months using the **forward** and **back** arrows.
5. Click on existing events to **view details** or **edit** them.
6. Use the calendar to verify that your schedule and exam dates do not conflict with institutional events and holidays.

![The Calendar page showing a monthly calendar view with academic events marked on dates](screenshots/calendar-page.png)

> 💡 **Tip:** Populate the calendar with holidays and institutional events at the start of each academic year. This gives you a complete picture when planning class and exam schedules.

---

### 5.11 Carry Forward

**What it does:** The Carry Forward feature allows you to clone data from a previous academic term to a new one. Instead of recreating sections, class schedules, exam schedules, and calendar events from scratch, you can carry them forward from a previous semester and adjust as needed.

**How to use it:**

The Carry Forward uses a **3-step wizard:**

1. Click **"Carry Forward"** in the left sidebar (under the **Tools** section).
2. **Step 1 — Configure:**
   a. Select the **Source** Academic Year and Semester (the term you want to copy from).
   b. Select the **Target** Academic Year and Semester (the term you want to copy to).
   c. Choose which **entity types** to carry forward by toggling them on or off:
      - **Sections** — Section definitions, year levels, programs, advisers.
      - **Class Schedules** — Class entries with room, personnel, and section assignments.
      - **Exam Schedules** — Exam entries with room and personnel assignments.
      - **Calendar Events** — Holidays, exam periods, and breaks (dates are kept as-is).
   d. Click **"Next"** to proceed.
3. **Step 2 — Preview:**
   - Review the count of records that will be cloned for each entity type.
   - Confirm you are satisfied with the selection.
   - Click **"Carry Forward"** and confirm the action in the confirmation dialog.
4. **Step 3 — Complete:**
   - Review the results showing the total number of records created for each entity type.
   - All cloned schedule entries are created as **Drafts** for your review — nothing is auto-published.

![The Carry Forward page showing the 3-step wizard with source and target term selection](screenshots/carry-forward-page.png)

> 💡 **Tip:** Carry Forward is the fastest way to start a new semester. Clone your previous semester's schedules, then only adjust what has changed — saving hours of manual re-entry.

> ⚠️ **Note:** The source and target terms must be different. You cannot carry forward from a term to itself.

---

### 5.12 Data Import

**What it does:** The system supports data import from CSV and Excel files on most resource pages. Import is available for **Rooms, Personnel, Sections, Subject Bank, and Calendar Events.**

**Downloading Import Templates:**

1. Click **"Export Template"** in the left sidebar (under the **Tools** section).
2. You will see cards for each importable data type: Personnel, Sections, Subject Bank, Rooms, and Calendar Events.
3. For SHS, Calendar Events templates are split by grade level (Grade 11, Grade 12).
4. Click the **Download** button on the desired template card to download a pre-formatted Excel file.
5. Open the template in a spreadsheet application (e.g., Microsoft Excel) and follow the instructions on the **Instructions** sheet.
6. Fill in your data starting from **Row 4**. Required columns are marked with an asterisk (**).

**Importing Data:**

1. Navigate to the relevant resource page (e.g., **Rooms**, **Personnel**, **Subject Bank**, etc.).
2. Click the **"📥 Import File"** button on the page.
3. Select your completed CSV or Excel file.
4. The system will display an **import preview** showing the first 10 rows of data and any validation issues.
5. Review the preview and click **"Commit"** to finalize the import.
6. You will see a summary of results — how many records were **created**, **updated**, **skipped**, or had **errors**.

![The Import Template page showing download cards for each data type, and the import preview dialog](screenshots/import-page.png)

> ⚠️ **Note:** Supported file formats are **CSV** and **Excel (.xlsx)**. Make sure your file follows the template format exactly — mismatched columns or invalid data will cause import errors.

> 💡 **Tip:** Always download and use the provided import template from the Export Template page. It ensures your column headers match the system's expected format and reduces import errors.

---

### 5.13 Data Export

**What it does:** The Export feature allows you to generate professional reports and data exports from your schedule data. You can export schedules, room assignments, personnel assignments, and other data in multiple formats.

**How to use it:**

1. Navigate to the page whose data you want to export (e.g., Schedule, Rooms, Personnel).
2. Look for the **Export** button (usually an icon button or dropdown in the top-right area of the page).
3. Click the **Export** button to open the **Export Dropdown**.
4. Select the **export format:**
   - **PDF** — Generates a professionally formatted document suitable for printing or distribution.
   - **Excel (.xlsx)** — Generates a spreadsheet for further analysis or editing.
   - **CSV** — Generates a plain-text file for data interchange.
5. For **PDF exports**, a **Signatories Modal** will appear, allowing you to add signature blocks:
   - Enter the **name**, **title/label**, and **position** for each signatory.
   - You can add multiple signatories or skip this step.
   - Click **"Export"** or **"Generate"** to create the PDF.
6. The file will be saved to your chosen location on your computer.

**PDF Export Customization:**

- **Institution Logo** — If you have uploaded an institution logo in Settings, it will appear in the header of all PDF exports.
- **Export Footer Credit** — A configurable footer line (e.g., "Schedule Management System | Powered by: JW-Tech") appears at the bottom of every PDF page. Configure this in Settings.
- **Signatories** — Optional signature blocks appear at the bottom of the PDF with name, title, and position.

![The Export dropdown showing format options (PDF, Excel, CSV) and the Signatories Modal for PDF exports](screenshots/export-dropdown.png)

> 💡 **Tip:** Set up your institution logo and export footer credit in Settings before generating your first PDF export. This ensures all your reports have a consistent, professional appearance.

---

### 5.14 Trash & Data Recovery

**What it does:** When you archive (soft-delete) any record — rooms, personnel, sections, subjects, etc. — it is moved to the Trash instead of being permanently deleted. The Trash page lets you view all archived items and either restore them or permanently delete them.

**How to use it:**

1. Click **"Trash"** in the left sidebar.
2. You will see a **tabbed view** with seven tabs — one for each entity type:
   - Academic Years, Semesters, Personnel, Rooms, Sections, Schedule Entries, Calendar Events
3. Each tab shows a **count badge** indicating how many archived items are in that category.
4. Each item shows when it was archived, and the **number of days until automatic purge** (items are auto-purged after **90 days**).
5. To **restore** an item, click the **"Restore"** button next to it. The item will reappear in its original list as an active record.
6. To **permanently delete** an item, click **"Permanently Delete"** and confirm the action. This is irreversible.
7. Use the **"Empty Trash"** button to purge all items older than 90 days at once. Items still referenced by active schedules will be skipped.

![The Trash page showing tabs for each entity type with count badges, restore and delete buttons](screenshots/trash-page.png)

> ⚠️ **Note:** Permanent deletion cannot be undone. Once you permanently delete a record from the Trash, all associated data is removed from the database. Use this action with caution.

> ⚠️ **Note:** Archived items are automatically purged after **90 days**. If you need to keep a record, restore it before the 90-day window expires.

> 💡 **Tip:** Periodically review the Trash to clean up records you no longer need or restore items that were accidentally deleted.

---

### 5.15 Audit Log

**What it does:** The Audit Log provides a complete, append-only chronological record of every data change made in the system. Every time a record is created, updated, or deleted, an entry is logged with details about what changed, when, and by whom. The audit log cannot be modified or deleted — it is protected by database triggers.

**How to use it:**

1. Click **"Audit Log"** in the left sidebar.
2. You will see a **table** of audit entries in reverse chronological order (most recent first).
3. Each entry includes:
   - **Timestamp** — When the change occurred.
   - **Entity Type** — What type of record was changed, shown as a badge (e.g., Room, Section, Schedule Entry, Academic Year, Semester, Calendar Event, Personnel, Template, Settings).
   - **Action** — The type of change, shown as a color-coded badge:
     - **CREATE** (green) — A new record was created
     - **UPDATE** (blue) — An existing record was modified
     - **DELETE** (red) — A record was deleted
     - **PUBLISH** (purple) — A schedule entry was published
     - **UNPUBLISH** (amber) — A published entry was reverted to draft
     - **OVERRIDE** (orange) — A hard conflict was overridden
   - **Department** — Which department the change belongs to.
   - **Details** — Additional context such as override reasons or entity identifiers.
4. Use **filters** to narrow down the log:
   - **Entity Type** — Filter by specific entity types.
   - **Action** — Filter by specific action types.
   - **Date From / Date To** — Filter by date range.
5. The audit log is **paginated** (8 records per page) and scoped to the active academic year (or the historical year when in History Mode).

![The Audit Log page showing a table of change entries with timestamp, entity type, action, and data snapshots](screenshots/audit-page.png)

> 💡 **Tip:** Use the Audit Log to investigate when a specific change was made. If you are unsure why a schedule entry looks different, the audit log will show you exactly what was changed and when.

> ⚠️ **Note:** The Audit Log is append-only and tamper-proof. Entries cannot be edited or deleted through any user action. This ensures a complete and trustworthy history of all system changes.

---

## 6. Settings & Configuration

This section provides a detailed reference for all user-adjustable settings in the Schedule Management System. Access the Settings page by clicking **"Settings"** in the left sidebar.

### 6.1 Password Management

**What it does:** Allows you to change your administrator password.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Change Password** section.
3. Enter your **current password**.
4. Enter your **new password** (must be at least 8 characters, with at least one uppercase letter, one lowercase letter, and one number).
5. **Confirm** your new password by entering it again.
6. Click **"Change Password"** to save.

> ⚠️ **Note:** If you forget your password and cannot log in, use the **"Forgot Password?"** link on the login screen to recover your account using your security questions.

### 6.2 Security Questions

**What it does:** Manages the two security questions used for password recovery. If you forget your password, you will need to answer these questions correctly to reset it.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Security Questions** section.
3. The section shows your current security questions (locked by default).
4. Click the **unlock toggle** to enable editing.
5. Enter your **current password** to verify your identity.
6. Update your questions — select from the predefined dropdown list, or write custom questions.
7. Update your answers.
8. Click **"Save"** to apply.

> ⚠️ **Note:** Remember your security question answers exactly as you typed them. They are case-sensitive and must match exactly when used for password recovery.

### 6.3 Institution Logo

**What it does:** Allows you to upload an institution logo that appears in the header of all PDF exports.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Institution Logo** section.
3. Click **"Upload Logo"** or the logo placeholder area.
4. Select an image file from your computer. Supported formats: **PNG**, **JPG**, or **JPEG**.
5. The logo will be stored within the application settings.
6. To **remove** the logo, click the **"Remove"** button next to the current logo preview.

> 💡 **Tip:** Use a logo image with a transparent background (PNG format) for the best appearance in PDF exports.

### 6.4 Institution Details

**What it does:** Configures institution information that appears in the header of PDF exports.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Institution Details** section.
3. Enter or update the following fields:
   - **Institution Name** — The official name of your institution.
   - **Address** — The institution's address.
   - **Telephone Numbers** — Add multiple telephone numbers using the add/remove controls.
   - **Mobile Numbers** — Add multiple mobile numbers using the add/remove controls.
   - **Email** — The institution's email address.
4. Click **"Save"** or **"Update"** to apply.

### 6.5 Export Footer Credits

**What it does:** Allows you to configure a text line that appears in the footer of every exported PDF page.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Footer Credit** section.
3. Enter the desired footer text (e.g., "© 2025 Your Institution").
4. Changes are saved automatically.

### 6.6 Prepared By / Received By Defaults

**What it does:** Configures default signatory names and titles that are pre-populated in the Signatories Modal when you export PDFs. This saves you from having to re-enter the same information every time you export.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Prepared By / Received By** section.
3. Enter the **name** and **title** for the "Prepared By" signatory.
4. Enter the **name** and **title** for the "Received By" signatory.
5. Changes are saved automatically.

### 6.7 Database Backup & Restore

**What it does:** Allows you to create a backup copy of the entire database and restore from a previous backup. This is critical for protecting your data against accidental loss or corruption.

**Creating a Backup:**

1. Navigate to **Settings**.
2. Find the **Backup & Restore** section.
3. Click **"Create Backup."**
4. Choose a location on your computer to save the backup file (a `.db` file).
5. The system will create a consistent snapshot of the database using SQLite's Backup API. This process takes a few moments depending on your database size.
6. You will see a confirmation once the backup is complete.
7. The section shows the **last backup date** for reference.

**Restoring from a Backup:**

1. Navigate to **Settings**.
2. Find the **Backup & Restore** section.
3. Click **"Restore from Backup."**
4. Select a previously saved `.db` backup file from your computer.
5. Confirm the restore action. This will **replace** all current data with the data from the backup.
6. The application will **reload** after the restore completes.

> ⚠️ **Note:** Restoring from a backup will **overwrite all current data** in the application. Any changes made since the backup was created will be lost. Always create a fresh backup before restoring, in case you need to revert.

> 💡 **Tip:** Create regular backups — especially before major scheduling changes, at the end of each semester, and before applying system updates. Store backup files in a separate location (such as a USB drive or network folder) for extra safety.

### 6.8 Application Updates

**What it does:** Allows you to check for and install application updates.

**How to use it:**

1. Navigate to **Settings**.
2. Find the **Updates** section. It shows the **current application version**.
3. Click **"Check for Updates"** to see if a newer version is available.
4. If an update is available, click **"Download & Install"** and follow the progress bar.
5. The application will restart to apply the update.

### 6.9 Danger Zone — Reset Application

**What it does:** Permanently deletes ALL data in the application and resets it to a fresh state. This is a destructive, irreversible action.

**How to use it:**

1. Navigate to **Settings**.
2. Scroll to the **Danger Zone** section at the very bottom.
3. Click the **"Reset App"** button.
4. A first confirmation dialog will appear — confirm you want to proceed.
5. A second confirmation will require you to type the exact phrase: **`Reset "Schedule Manager"`** to prove your intent.
6. All data will be permanently deleted and the application will restart in first-time setup mode.

> ⚠️ **Note:** This action is **completely irreversible**. All schedules, rooms, personnel, sections, academic years, calendar events, audit logs, and settings will be permanently destroyed. Create a backup first if there is any possibility you may need this data in the future.

---

## 7. Troubleshooting

If something is not working as expected, check the table below for common problems and solutions. If your issue is not listed here, please contact the developer (see [Section 10](#10-support--contact-information)).

| Problem | Possible Cause | Solution |
|---|---|---|
| Application won't open | Another instance is already running, or the application crashed during the last session | Check your taskbar for an existing window. If you cannot find one, open **Task Manager** (Ctrl + Shift + Esc), find any "Schedule Management System" or "Electron" processes, end them, and try opening the application again. |
| Cannot log in | Incorrect username or password | Double-check your credentials for typos. Make sure Caps Lock is not turned on. If you have forgotten your credentials, contact the developer for the reset-credentials tool. |
| Data not showing after switching departments | The Department Switcher is set to the wrong department | Check the Department Switcher in the header. Make sure you have selected the correct department (SHS or College). All list views are filtered by the active department. |
| Schedule entry fails to save | A scheduling conflict was detected (room, instructor, or section overlap) | Review the conflict warning message. Either change the conflicting field (room, time, instructor) or explicitly override the hard conflict if you are certain it is acceptable. |
| Cannot create Summer semester for SHS | Summer is not available for SHS | This is by design. SHS only supports 1st Semester and 2nd Semester. Summer semesters are only available for the College department. |
| Imported file fails validation | File format does not match the expected template | Download the import template for the data type you are importing and make sure your file follows the exact same column headers and format. Supported formats are CSV and Excel (.xlsx). |
| PDF export looks incomplete or missing logo | Institution logo not uploaded, or export footer credit not configured | Go to **Settings** and upload your institution logo (PNG, JPG, or JPEG). Also configure the Export Footer Credit text. |
| Archived record not appearing | The record was permanently deleted from the Trash | Once a record is permanently deleted, it cannot be recovered. Check the Audit Log to confirm when and how the record was deleted. If you have a recent backup, you can restore from it. |
| Application running slowly | Large database, many records, or many browser-like windows/tabs consuming memory | Close any unnecessary applications. If the database has grown very large, consider archiving old academic year data. Restart the application if performance does not improve. |
| Error during database restore | Backup file is corrupted or from an incompatible version | Verify that the backup file is not corrupted and was created from a compatible version of the application. Try a different backup file if available. |

> 💡 **Tip:** When contacting support about any issue, it is very helpful to include: the exact steps you took before the issue occurred, any error messages you saw, and a screenshot if possible.

---

## 8. Frequently Asked Questions (FAQ)

**Q: Do I need an internet connection to use this application?**
A: No. The Schedule Management System is a fully offline desktop application. All data is stored locally on your computer. No internet connection, no cloud account, and no external database server is required.

**Q: Can multiple people use the system at the same time?**
A: No. The system is designed for a single administrator. There is only one user account. Multi-user support is not available in the current version.

**Q: How do I back up my data?**
A: Go to **Settings > Backup & Restore** and click **"Create Backup."** Save the backup file to a safe location. We recommend creating backups regularly — before major changes, at the end of each semester, and before updates.

**Q: Can I transfer my data to another computer?**
A: Yes. Create a backup on the original computer using the Backup & Restore feature. Install the application on the new computer, then use the **Restore from Backup** feature to load your data. Alternatively, copy the database file directly from the application's data folder.

**Q: What happens when I archive (delete) a record?**
A: Archived records are not permanently deleted. They are moved to the **Trash**, where you can view and restore them at any time. To permanently delete a record, go to the Trash and select **"Delete Permanently."** Permanent deletion is irreversible.

**Q: Can I undo a change I made?**
A: The system does not have an "undo" feature. However, you can check the **Audit Log** to see exactly what was changed and manually revert it. For major mistakes, you can restore from a recent backup.

**Q: What is the difference between SHS and College departments?**
A: SHS (Senior High School) and College have different academic structures. SHS uses a June–March school year with quarter-based exams and homeroom sections. College uses an August–May school year with semester-based exams, a Summer term option, and course-based sections. See [Section 3.4](#34-understanding-the-department-switcher) for the full comparison.

**Q: What is a "hard conflict" vs. a "soft conflict"?**
A: A **hard conflict** is a serious scheduling overlap (e.g., two classes in the same room at the same time) that blocks saving unless you explicitly choose to override it. A **soft conflict** is an advisory warning (e.g., a scheduling concern that is unusual but may be acceptable) that does not block saving.

**Q: Can schedule entries span across midnight?**
A: No. Schedule entries cannot cross the midnight boundary. If you need a session that runs past midnight, create two separate entries — one ending at midnight and one starting at midnight.

**Q: What file formats does the system support for import and export?**
A: For **import**, the system supports CSV and Excel (.xlsx) files. For **export**, the system supports PDF, Excel (.xlsx), and CSV formats.

**Q: How do I reset my password if I forget it?**
A: On the login screen, click the **"Forgot Password?"** link. You will be asked to answer the two security questions you set up during first-time setup. If your answers are correct, you can create a new password. If you did not set up security questions or cannot remember your answers, contact your developer or IT support for the external `reset-credentials` tool.

---

## 9. Glossary

This glossary defines common terms used throughout this manual and within the Schedule Management System.

| Term | Definition |
|---|---|
| Academic Year | A named school year period defined independently per department (SHS: June–March; College: August–May) |
| Audit Log | A complete, append-only record of every data change (create, update, delete) made in the system. Cannot be edited or deleted. |
| Archive (Soft Delete) | Moving a record to the Trash instead of permanently deleting it. Archived records can be restored. |
| College | The College/Tertiary undergraduate academic department. School year runs August–May. Uses 1st Semester, 2nd Semester, and Summer. |
| Conflict (Hard) | A scheduling overlap that blocks saving unless explicitly overridden by the administrator |
| Conflict (Soft) | A scheduling concern that warns the user but does not block saving |
| Course Section | The College section model — a section tied to a specific subject where students enroll individually per subject |
| Dashboard | The main home screen that displays summary statistics for the active department |
| Department Switcher | The toggle in the navigation header that controls which department's data (SHS or College) is displayed throughout the application |
| Draft | A schedule entry that has been created and saved but not yet published. Not visible in final schedule views. |
| Export Signatories | Optional named individuals whose signature blocks appear at the bottom of PDF exports |
| F2F | Face-to-Face delivery modality |
| Homeroom Section | The SHS section model — a fixed cohort of students who attend all subjects together as a group |
| Import Job | A process that parses an uploaded CSV or Excel file and creates or updates records in the system |
| Institution Logo | A user-uploaded image displayed in the header of all PDF exports. Configured in Settings. |
| Period Length | The configured duration (in minutes) of a single class period, configurable per department |
| Published | A finalized schedule entry visible across all schedule views and in exports |
| Quarter | A subdivision within an SHS semester used for exam period marking (Q1 & Q2 in 1st Semester; Q3 & Q4 in 2nd Semester) |
| Recurrence Pattern | The repeating schedule rule for an entry (e.g., Weekly, Weekdays, Bi-Weekly) |
| Schedule Template | A saved, semester-agnostic snapshot of schedule entries that can be applied to a new Academic Year/Semester |
| Semester | A term period within an Academic Year. SHS: 1st and 2nd Semester. College: 1st Semester, 2nd Semester, and Summer. |
| SHS | Senior High School — Grades 11–12 academic department. School year runs June–March. |
| SQLite Backup API | The built-in mechanism used to create a consistent database snapshot for backup |
| Trash | The holding area for archived (soft-deleted) records. Records can be restored or permanently deleted from here. |

---

## 10. Support & Contact Information

If you need help that is not covered in this manual, please contact the developer or IT support.

| Support Channel | Details | Availability |
|---|---|---|
| Developer Contact | Contact the application developer directly for technical issues, bugs, or feature requests. | During working hours |
| In-App Help | Click the **Help** button in the sidebar footer for quick reference information and keyboard shortcuts. | Always available within the application |

**Reporting Issues:**

When reporting an issue, please include the following information:

1. **What you were doing** — The exact steps you took before the issue occurred.
2. **What you expected to happen** — The behavior you were expecting.
3. **What actually happened** — The actual behavior you observed, including any error messages.
4. **Screenshots** — If possible, capture a screenshot of the error or unexpected behavior.
5. **Application version** — Found in the application header or Settings page.

---

## 11. Document Version History

This table tracks changes to this User Manual over time.

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-27 | AI-Generated | Initial release of the User Manual covering all features of Schedule Management System v0.2.0 |
