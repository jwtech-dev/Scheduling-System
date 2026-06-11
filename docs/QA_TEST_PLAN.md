# QA Test Plan

> **Project:** Schedule Management System
> **Version:** 1.0
> **Last Updated:** 2026-06-12
> **Authors:** QA Team
> **SRS Version:** v1.0 â€” this test plan was generated from this SRS version
> **App:** Desktop Application (Windows .exe â€” launch from Desktop or Start Menu)

---

## 1. What Is This Document?

This guide tells you **what to test** and **how to test it**, step by step. You don't need any technical knowledge to follow it â€” just the installed app on your Windows computer.

Each test has:
- A **test ID** (e.g., TC-FR09-03) â€” use this when reporting bugs
- **What you need before starting** â€” any setup or conditions
- **Where** â€” the exact page or screen in the app where you perform this test
- **Steps** â€” what to click, type, or do
- **What should happen** â€” what you should see on screen if the app is working correctly

**If the app does something different from what's described** â†’ file a bug report and include the test ID.

---

## 2. Before You Start

> **Important:** Start with the **Getting Started** section. You will set up the app and create your admin password there. This password is used for all other tests.

**You need:**
- A Windows 10 or 11 computer
- The app installed (either via 
pm run dev for development testing, or the .exe installer for production testing)
- For production testing: the .exe installer file

**Testing order:**
1. **Getting Started** â€” do these first (you'll set up the app and create your password here)
2. **Setting Up the School Year** and **Managing Semesters** â€” do these second (other features depend on having an active academic year and semester)
3. All other sections can be done in any order after that

**Two departments:**
This app manages schedules for two departments: **SHS** (Senior High School) and **College**. You switch between them using the department toggle in the top header. Some tests ask you to test in a specific department or both.

**Test data conventions:**

| What | Standard Test Values |
|------|---------------------|
| Admin Password | dmin (default after setup), Test1234 (for password change tests) |
| SHS Academic Year | Start: June 2026, Label: "2026â€“2027" |
| College Academic Year | Start: August 2026, Label: "2026â€“2027" |
| Room | Code: "RM-101", Name: "Room 101", Capacity: 40 |
| Section (SHS) | Code: "SHS-11-STEM-A", Strand: STEM, Grade Level: 11, Students: 40 |
| Section (College) | Code: "BSIT-3A", Program: BSIT, Year Level: 3rd Year, Students: 35 |
| Personnel | Employee ID: "EMP-001", Name: "Juan Dela Cruz", Max Hours: 40 |
| Schedule Entry | Activity: CLASS, Day: Monday, Time: 08:00â€“09:00, Room: RM-101, Recurrence: Weekly |

---

## 3. How to Report a Bug

When a test fails (the app does something different from "What should happen"), report it in the **bug_report_qa** Excel sheet.

**How to fill in the sheet:**

| Column | What to write |
|--------|---------------|
| **Issue Count** | The next number in sequence |
| **FR-AC ID** | The test ID from this document (e.g., TC-FR09-01) |
| **Description** | A short summary of the problem (e.g., "Schedule entry form shows error after clicking Save with all fields filled") |
| **Reported By** | Your name |
| **Log Date** | Today's date |
| **Status** | "Open" |
| **Resource Person** | Leave blank â€” the development team will assign this |
| **Resolution** | Leave blank â€” filled in after the bug is fixed |
| **Remarks** | Describe **only what actually happened** on screen (see examples below) |

> **You do NOT need to write what was expected.** The expected result is already in the test case's "What should happen" section. The development team will look it up using the TC ID.

> **Do NOT suggest fixes or changes.** The requirements (SRS) are already approved. Just describe what you saw.

**Bad vs good Remarks:**

| âŒ Bad | âœ… Good |
|--------|--------|
| "It doesn't work." | "After clicking Save, a loading spinner appears but the page never loads. Waited 2 minutes." |
| "Error on the page." | "A red error banner appears at the top saying 'Something went wrong' after I click 'Create Entry'." |
| "Should show the schedule." | "The Schedule page shows an empty list even though I just created an entry in the previous step." |

**How to retest a fixed bug:**

When the development team marks a bug as fixed, go back to the test case in this document (e.g., TC-FR09-01) and re-run the steps. If the app now matches "What should happen," the bug is fixed.

---

## 4. Test Cases

*Test cases are grouped by user journey. Each section focuses on a part of the app that a real user would use together.*


---

# TC_AUTH — Authentication & First-Run Setup

**Module:** Authentication & First-Run Setup
**SRS References:** FR-17 (First-Run Setup), FR-18 (Authentication)
**Version:** 2.0
**Last Updated:** 2026-06-12

---

### Getting Started

*First-run detection, initial setup, and creating the admin account. Complete this section first — you need to set up the app before any other tests.*

---

#### TC-FR17-01

> *SRS Reference: FR-17 AC-1*

**What you need:** A fresh install of the app with no previous data (no existing database file)

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time after a fresh install |

**What should happen:**
- The app opens and displays the first-time setup screen

---

#### TC-FR17-02

> *SRS Reference: FR-17 AC-2*

**What you need:** The app's data file exists but setup was never finished (no admin password was saved)

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Use a data file where setup was started but never completed (no saved password) |
| 2 | Launch the app |

**What should happen:**
- The app displays the first-time setup screen (not the login screen)

---

#### TC-FR17-03

> *SRS Reference: FR-17 AC-3*

**What you need:** Setup has been completed at least once (admin password exists)

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete the first-time setup if not already done |
| 2 | Close the app completely |
| 3 | Relaunch the app |

**What should happen:**
- The app displays the login screen (not the setup screen)

---

#### TC-FR17-04

> *SRS Reference: FR-17 AC-1*

**What you need:** A fresh install of the app with no previous data

**Where:** Desktop (launch the app), then File Explorer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | Open File Explorer and navigate to the app data folder (`%APPDATA%/schedule-management/`) |

**What should happen:**
- A file named `schedule-manager.db` exists in the app data folder

---

#### TC-FR17-05

> *SRS Reference: FR-17 AC-1*

**What you need:** A fresh install of the app with no previous data

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | Wait for the setup screen to appear |

**What should happen:**
- The app launches to the setup screen without any errors or crashes
- The database is created and initialized automatically

---

#### TC-FR17-06

> *SRS Reference: FR-17 AC-12*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | Look at the layout of the setup screen |

**What should happen:**
- All setup fields are visible on a single screen (not spread across multiple steps or pages)
- The form is compact and inline — not a multi-step wizard

---

#### TC-FR17-07

> *SRS Reference: FR-17 AC-13*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | Review all the fields on the setup form |

**What should happen:**
- The form contains only these fields: Password, Confirm Password

---

#### TC-FR17-08

> *SRS Reference: FR-17 AC-7*

⚠️ DEPRECATED/REMOVED — SHS Period Length field was removed from the Setup screen.

---

#### TC-FR17-09

> *SRS Reference: FR-17 AC-7*

⚠️ DEPRECATED/REMOVED — College Period Length field was removed from the Setup screen.

---

#### TC-FR17-10

> *SRS Reference: FR-17 AC-7*

⚠️ DEPRECATED/REMOVED — Time Slot Start field was removed from the Setup screen.

---

#### TC-FR17-11

> *SRS Reference: FR-17 AC-7*

⚠️ DEPRECATED/REMOVED — Time Slot End field was removed from the Setup screen.

---

#### TC-FR17-12

> *SRS Reference: FR-17 AC-8*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Leave the Password field blank |
| 2 | Enter a value in the Confirm Password field |
| 3 | Click "Complete Setup" |

**What should happen:**
- The form does not submit
- An error message appears indicating the password is required

---

#### TC-FR17-13

> *SRS Reference: FR-17 AC-13*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click into the Password field |
| 2 | Start typing a partial password (e.g., "Ab1") |

**What should happen:**
- A password strength indicator appears below the field
- It shows checkmarks or crosses for each requirement: at least 8 characters, uppercase letter, lowercase letter, number

---

#### TC-FR17-14

> *SRS Reference: FR-17 AC-6*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Admin123" in the Password field |
| 2 | Enter "Admin123" in the Confirm Password field |
| 3 | Click "Complete Setup" |

**What should happen:**
- Setup completes successfully with no errors
- The app navigates to the login screen

---

#### TC-FR17-15

> *SRS Reference: FR-17 AC-18*

⚠️ DEPRECATED/REMOVED — Custom period length fields were removed from the Setup screen.

---

#### TC-FR17-16

> *SRS Reference: FR-17 AC-18*

⚠️ DEPRECATED/REMOVED — Custom time slot fields were removed from the Setup screen.

---

#### TC-FR17-17

> *SRS Reference: FR-17 AC-17*

**What you need:** A fresh install (no setup completed yet), a database browser tool

**Where:** Setup screen, then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete setup with password "Admin123" |
| 2 | Open the database file with a database browser |
| 3 | Look at the stored password value in the settings table |

**What should happen:**
- The password is stored as an encrypted hash (not as plain text)
- The hash starts with `$2a$10$` or `$2b$10$` (indicating secure encryption with cost factor 10)

---

#### TC-FR17-18

> *SRS Reference: FR-17 AC-6*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Fill in all fields with valid data |
| 2 | Click "Complete Setup" |
| 3 | Watch what happens after the button is clicked |

**What should happen:**
- After setup completes, the app automatically navigates to the login screen
- The setup screen does not reappear

---

#### TC-FR17-19

> *SRS Reference: FR-17 AC-18*

**What you need:** A fresh install (no setup completed yet), a database browser tool

**Where:** Setup screen, then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete setup with valid data |
| 2 | Open the database file and check the settings table |

**What should happen:**
- All settings are saved: password hash, and the default settings for SHS period length, College period length, time slot start, and time slot end are seeded in the database
- No settings are missing — all were saved together

---

#### TC-FR17-20

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Ab1" in both password fields (only 3 characters) |
| 2 | Click "Complete Setup" |

**What should happen:**
- An error message appears: "Password must be at least 8 characters."
- Setup does not complete

---

#### TC-FR17-21

> *SRS Reference: FR-17 AC-16*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Admin12" in both password fields (only 7 characters) |
| 2 | Click "Complete Setup" |

**What should happen:**
- An error message appears: "Password must be at least 8 characters."
- Setup does not complete

---

#### TC-FR17-22

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Admin123" in both password fields (exactly 8 characters) |
| 2 | Click "Complete Setup" |

**What should happen:**
- Setup completes successfully (meets the minimum length requirement)
- The app navigates to the login screen

---

#### TC-FR17-23

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "admin123" in both password fields (no uppercase letter) |
| 2 | Click "Complete Setup" |

**What should happen:**
- An error message appears: "Password must contain at least one uppercase letter."
- Setup does not complete

---

#### TC-FR17-24

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "ADMIN123" in both password fields (no lowercase letter) |
| 2 | Click "Complete Setup" |

**What should happen:**
- An error message appears: "Password must contain at least one lowercase letter."
- Setup does not complete

---

#### TC-FR17-25

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "AdminPass" in both password fields (no number) |
| 2 | Click "Complete Setup" |

**What should happen:**
- An error message appears: "Password must contain at least one number."
- Setup does not complete

---

#### TC-FR17-26

> *SRS Reference: FR-17 AC-5 AC-15*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Admin123" in the Password field |
| 2 | Enter "Admin456" in the Confirm Password field |
| 3 | Click "Complete Setup" |

**What should happen:**
- An error message appears: "Passwords do not match."
- Setup does not complete

---

#### TC-FR17-27

> *SRS Reference: FR-17 AC-5*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Admin123" in the Password field |
| 2 | Leave the Confirm Password field empty |
| 3 | Click "Complete Setup" |

**What should happen:**
- The form does not submit, or a validation error appears
- Setup does not complete

---

#### TC-FR17-28

> *SRS Reference: FR-17 AC-13*

⚠️ DEPRECATED/REMOVED — Period length validation on setup is no longer applicable.

---

#### TC-FR17-29

> *SRS Reference: FR-17 AC-13*

⚠️ DEPRECATED/REMOVED — Period length validation on setup is no longer applicable.

---

#### TC-FR17-30

> *SRS Reference: FR-17 AC-13*

⚠️ DEPRECATED/REMOVED — Period length validation on setup is no longer applicable.

---

#### TC-FR17-31

> *SRS Reference: FR-17 AC-13*

⚠️ DEPRECATED/REMOVED — Period length validation on setup is no longer applicable.

---

#### TC-FR17-32

> *SRS Reference: FR-17 AC-18*

**What you need:** Setup has already been completed once

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete the first-time setup normally |
| 2 | Try to access the setup screen again (e.g., relaunch the app or navigate back) |

**What should happen:**
- The setup screen does not appear — the app shows the login screen instead
- If setup is somehow triggered again, the app displays an error: "Setup has already been completed."

---

#### TC-FR17-33

> *SRS Reference: FR-17 AC-9*

**What you need:** A fresh install with no previous data, a database browser tool

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | After the setup screen appears, open the database file with a database browser |
| 3 | Check the version history table (`_schema_versions`) |

**What should happen:**
- The version history table exists in the database
- It contains entries for all database updates, listed in sequential order (001, 002, etc.)
- Each entry has a timestamp showing when it was applied

---

#### TC-FR17-34

> *SRS Reference: FR-17 AC-9*

**What you need:** App with completed setup, a database browser tool

**Where:** Database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the database file with a database browser |
| 2 | Check the version history table (`_schema_versions`) |

**What should happen:**
- The table contains one row per database update that was applied
- Each row has a version identifier and a timestamp

---

#### TC-FR17-35

> *SRS Reference: FR-17 AC-9 AC-19*

**What you need:** An older version of the database (e.g., only first 3 updates applied), a newer version of the app (with 5 updates bundled)

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the newer version of the app with the older database |
| 2 | Check the version history table in the database |

**What should happen:**
- The missing updates (4 and 5) are applied automatically
- The version history table now shows all 5 updates

---

#### TC-FR17-36

> *SRS Reference: FR-17 AC-9*

**What you need:** A database with all updates already applied

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app normally |

**What should happen:**
- The app starts up normally without re-applying any database updates
- No duplicate entries appear in the version history table

---

#### TC-FR17-37

> *SRS Reference: FR-17 AC-11*

**What you need:** A database with pending updates, a database browser tool

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app so that pending database updates are applied |
| 2 | Check the database |

**What should happen:**
- Each database update is applied as a complete unit — if one update fails, only that update is rolled back (previous successful updates are kept)

---

#### TC-FR17-38

> *SRS Reference: FR-17 AC-20*

**What you need:** A database with multiple pending updates, a database browser tool

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app with a database that has multiple pending updates (e.g., 004, 005, 006) |
| 2 | Check the version history table timestamps |

**What should happen:**
- Updates are applied in numerical order: 004 before 005 before 006
- Timestamps confirm the correct sequence

---

#### TC-FR17-39

> *SRS Reference: FR-17 AC-20*

**What you need:** A database with pending updates, a database browser tool

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app so that pending database updates are applied |
| 2 | Check the version history table after each update |

**What should happen:**
- After each successful update, the version number is immediately recorded in the version history table

---

#### TC-FR17-40

> *SRS Reference: FR-17 AC-10*

⚠️ DEFERRED — Pre-update backup feature is not yet implemented. Not yet implemented.

---

#### TC-FR17-41

> *SRS Reference: FR-17 AC-10*

⚠️ DEFERRED — Pre-update backup feature is not yet implemented. Not yet implemented.

---

#### TC-FR17-42

> *SRS Reference: FR-17 AC-11*

**What you need:** A database with 3 pending updates, where the 2nd update contains an intentional error

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Prepare a deliberately broken database update file (e.g., invalid content in update 2) |
| 2 | Launch the app |

**What should happen:**
- Update 1 succeeds
- Update 2 fails and an error is displayed or logged
- Update 3 does not run (the app stops applying updates after a failure)

---

#### TC-FR17-43

> *SRS Reference: FR-17 AC-11*

**What you need:** A database with a broken update at a known version number (e.g., version 005)

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app with the broken update |
| 2 | Check the error output |

**What should happen:**
- The error message includes the version number or name of the failed update (e.g., "005")

---

#### TC-FR17-44

> *SRS Reference: FR-17 AC-11*

**What you need:** A database update that contains two changes where the second one fails

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app with the partially-broken update |
| 2 | Check the database |

**What should happen:**
- Neither change from the failed update is applied (the entire update is rolled back as a unit)
- The version history table does not contain an entry for the failed update

---

### Logging In

*Entering the password, login errors, rate limiting, and session behavior.*

---

#### TC-FR18-01

> *SRS Reference: FR-18 AC-1*

**What you need:** Setup completed, app showing login screen. Password is "Admin123"

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Admin123" in the password field |
| 2 | Click "Log In" |

**What should happen:**
- Login succeeds
- The app navigates to the Dashboard

---

#### TC-FR18-02

> *SRS Reference: FR-18 AC-3*

**What you need:** Setup completed

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Close the app completely |
| 3 | Relaunch the app |

**What should happen:**
- The login screen is displayed again
- You must re-enter your password to continue

---

#### TC-FR18-03

> *SRS Reference: FR-18 AC-1*

**What you need:** Setup completed, app launched

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the login screen layout |

**What should happen:**
- The screen shows the title "Welcome Back"
- A subtitle reads "Enter your password to continue"
- There is a password input field and a "Log In" button

---

#### TC-FR18-04

> *SRS Reference: FR-18 AC-1*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Type a password into the password field |
| 2 | Click the eye icon next to the password field to show the password |
| 3 | Click the eye icon again to hide the password |

**What should happen:**
- When the eye icon is clicked the first time, the password becomes visible as plain text
- When clicked again, the password is masked with dots again

---

#### TC-FR18-05

> *SRS Reference: FR-18 AC-1*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the "Log In" button without entering any password |

**What should happen:**
- The "Log In" button is disabled (grayed out) and cannot be clicked

---

#### TC-FR18-06

> *SRS Reference: FR-18 AC-1*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter a password in the field |
| 2 | Click "Log In" |
| 3 | Watch the button while the app is checking the password |

**What should happen:**
- The button text changes to "Logging in..." and becomes temporarily disabled while the password is being verified

---

#### TC-FR18-07

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter an incorrect password (e.g., "WrongPass1") |
| 2 | Click "Log In" |

**What should happen:**
- An error message appears: "Invalid password."
- You remain on the login screen
- The password field is cleared

---

#### TC-FR18-08

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter an incorrect password |
| 2 | Click "Log In" |
| 3 | Read the error message carefully |

**What should happen:**
- The error message is generic ("Invalid password.")
- It does not reveal any account details, usernames, or password hints

---

#### TC-FR18-09

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter an incorrect password |
| 2 | Click "Log In" |
| 3 | Look at the password field after the error appears |

**What should happen:**
- The password field is cleared (emptied) after the failed login attempt

---

#### TC-FR18-10

> *SRS Reference: FR-18 AC-2*

**What you need:** An error message is currently displayed on the login screen (from a previous failed login)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Trigger a login error by entering a wrong password and clicking "Log In" |
| 2 | Start typing a new password in the password field |

**What should happen:**
- The error message disappears as soon as you start typing

---

#### TC-FR18-11

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen, no prior failed attempts

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter an incorrect password and click "Log In" |
| 2 | Repeat step 1 four more times (5 total failed attempts) |

**What should happen:**
- After the 5th failure, an error message appears: "Too many failed login attempts. Try again in 30 seconds."
- The "Log In" button changes to show a countdown (e.g., "Wait 30s") and becomes disabled

---

#### TC-FR18-12

> *SRS Reference: FR-18 AC-2*

**What you need:** The app is currently in a lockout state (5 failed login attempts)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Trigger lockout by failing login 5 times |
| 2 | Watch the lockout countdown |

**What should happen:**
- An amber warning banner shows a countdown timer that decreases every second
- The "Log In" button shows "Wait Xs" with the remaining seconds

---

#### TC-FR18-13

> *SRS Reference: FR-18 AC-2*

**What you need:** The app is currently in a lockout state

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Trigger lockout by failing login 5 times |
| 2 | Try to click the "Log In" button during the countdown |

**What should happen:**
- The button is disabled and cannot be clicked during the lockout period

---

#### TC-FR18-14

> *SRS Reference: FR-18 AC-2*

**What you need:** The app is currently in a lockout state, countdown is active

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Trigger lockout by failing login 5 times |
| 2 | Wait for the 30-second countdown to reach 0 |
| 3 | Enter the correct password |
| 4 | Click "Log In" |

**What should happen:**
- Login succeeds after the lockout expires
- The app navigates to the Dashboard

---

#### TC-FR18-15

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Fail login 5 times to trigger a 30-second lockout |
| 2 | Wait for the lockout to expire |
| 3 | Fail login 5 more times (10 total failures) |

**What should happen:**
- The second lockout lasts 60 seconds (longer than the first)

---

#### TC-FR18-16

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Fail login through the first two lockout tiers (10 total failures) |
| 2 | Wait for the second lockout to expire |
| 3 | Fail login 5 more times (15 total failures) |

**What should happen:**
- The third lockout lasts 2 minutes (120 seconds)

---

#### TC-FR18-17

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Fail login through the first three lockout tiers (15 total failures) |
| 2 | Wait for the third lockout to expire |
| 3 | Fail login 5 more times (20 total failures) |

**What should happen:**
- The lockout lasts 5 minutes (300 seconds) — this is the maximum
- Further failures do not increase the lockout beyond 5 minutes

---

#### TC-FR18-18

> *SRS Reference: FR-18 AC-2*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Fail login 4 times (just below the lockout threshold) |
| 2 | Enter the correct password and log in successfully |
| 3 | Log out |
| 4 | Fail login 4 more times |

**What should happen:**
- No lockout is triggered after the second batch of 4 failures
- The failed attempt counter was reset by the successful login

---

#### TC-FR18-19

> *SRS Reference: FR-18 AC-2*

**What you need:** The app is currently in a lockout state (5 failed attempts)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Trigger lockout by failing login 5 times |
| 2 | Close the app completely |
| 3 | Relaunch the app |
| 4 | Enter the correct password and click "Log In" |

**What should happen:**
- Login succeeds immediately — the lockout counter is cleared when the app is closed

---

#### TC-FR18-20

> *SRS Reference: FR-18 AC-2*

**What you need:** The app is currently in a lockout state

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Trigger lockout by failing login 5 times |
| 2 | While locked out, try to log in by any means |

**What should happen:**
- The app rejects the login attempt with a message about too many failed attempts and shows the remaining lockout time

---

#### TC-FR18-21

> *SRS Reference: FR-18 AC-9*

**What you need:** Logged in to the app

**Where:** Any page (Dashboard, Sidebar > Rooms, Sidebar > Schedule, Sidebar > Settings, etc.)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Navigate to several different pages using the sidebar (Rooms, Schedule, Settings, etc.) |
| 3 | Wait at least 30 minutes without closing the app |
| 4 | Navigate to another page |

**What should happen:**
- You remain logged in throughout
- No session timeout or re-login prompt appears
- All pages continue to work normally

---

#### TC-FR18-22

> *SRS Reference: FR-18 AC-3*

**What you need:** Logged in to the app

**Where:** Any page, then Desktop (close and relaunch)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Close the app completely (click the X button or press Alt+F4) |
| 3 | Relaunch the app |

**What should happen:**
- The login screen is displayed
- You must re-enter your password — the previous session is not remembered

---

#### TC-FR18-23

> *SRS Reference: FR-18 AC-9*

**What you need:** Logged in to the app, access to File Explorer

**Where:** Any page, then File Explorer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Check the app data folder (`%APPDATA%/schedule-management/`) in File Explorer |

**What should happen:**
- There are no session files, tokens, or cookies saved to disk
- The login session exists only while the app is running

---

#### TC-FR18-24

> *SRS Reference: FR-18 AC-3*

**What you need:** Logged in to the app

**Where:** Any page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Click "Logout" (or trigger the logout action) |

**What should happen:**
- You are returned to the login screen
- You can no longer access any app pages without logging in again

---

#### TC-FR18-25

> *SRS Reference: FR-18 AC-1*

**What you need:** Previously logged in and then logged out

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log out from an active session |
| 2 | Enter the correct password on the login screen |
| 3 | Click "Log In" |

**What should happen:**
- Login succeeds
- The Dashboard is displayed

---

#### TC-FR18-26

> *SRS Reference: FR-18 AC-4 AC-12*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to access Sidebar > Rooms without logging in)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to access the Rooms feature |

**What should happen:**
- The app blocks access and shows a message: "Authentication required. Please log in."

---

#### TC-FR18-27

> *SRS Reference: FR-18 AC-4*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to create a schedule without logging in)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to create a new schedule |

**What should happen:**
- The app blocks the action and shows a message: "Authentication required. Please log in."

---

#### TC-FR18-28

> *SRS Reference: FR-18 AC-4*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to access Settings without logging in)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to access the Settings feature |

**What should happen:**
- The app blocks access and shows a message: "Authentication required. Please log in."

---

#### TC-FR18-29

> *SRS Reference: FR-18 AC-13*

**What you need:** App is running, on the login screen (not logged in)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter a password on the login screen and click "Log In" |

**What should happen:**
- The login screen works normally without requiring prior authentication
- The app processes the login attempt (success or failure based on password)

---

#### TC-FR18-30

> *SRS Reference: FR-18 AC-13*

**What you need:** App is running (not logged in)

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app |

**What should happen:**
- The app correctly determines whether to show the setup screen or login screen without requiring prior authentication

---

#### TC-FR18-31

> *SRS Reference: FR-18 AC-13*

**What you need:** A fresh install (first-run state, not logged in)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | Fill in the setup form and click "Complete Setup" |

**What should happen:**
- The setup process works normally without requiring prior authentication

---

#### TC-FR18-32

> *SRS Reference: FR-18 AC-13*

**What you need:** App is running (not logged in)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, trigger the logout action |

**What should happen:**
- The logout action completes without an error (no "Authentication required" message)

---

#### TC-FR18-33

> *SRS Reference: FR-18 AC-4*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms (or any app page)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Navigate to Sidebar > Rooms |

**What should happen:**
- The Rooms page loads normally with data displayed
- No authentication errors appear

---

#### TC-FR18-34

> *SRS Reference: FR-18 AC-12*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to access any protected feature)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to access any app feature (e.g., Rooms, Schedule, Settings) |

**What should happen:**
- The app consistently blocks access with the message: "Authentication required. Please log in."
- The response format is consistent across all protected features

---

#### TC-FR18-35

> *SRS Reference: FR-18 AC-14*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to navigate to Dashboard)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to navigate directly to the Dashboard |

**What should happen:**
- The app redirects you back to the login screen

---

#### TC-FR18-36

> *SRS Reference: FR-18 AC-14*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to navigate to Rooms)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to navigate directly to the Rooms page |

**What should happen:**
- The app redirects you back to the login screen

---

#### TC-FR18-37

> *SRS Reference: FR-18 AC-14*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen (attempting to navigate to Settings)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, try to navigate directly to the Settings page |

**What should happen:**
- The app redirects you back to the login screen

---

#### TC-FR18-38

> *SRS Reference: FR-18 AC-14*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app (setup already completed) |

**What should happen:**
- The login screen loads and displays correctly without any redirect or error

---

#### TC-FR18-39

> *SRS Reference: FR-18 AC-14*

**What you need:** A fresh install (first-run state)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |

**What should happen:**
- The setup screen loads and displays correctly without any redirect or error

---

#### TC-FR18-40

> *SRS Reference: FR-18 AC-8*

**What you need:** App launched (setup completed or not)

**Where:** All screens and menus

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate through every screen and menu in the app |
| 2 | Look for any "Register," "Sign Up," or "Create Account" options |

**What should happen:**
- No registration, sign-up, or account creation option exists anywhere in the app

---

#### TC-FR18-41

> *SRS Reference: FR-18 AC-8*

**What you need:** Logged in to the app

**Where:** All sidebar items and Settings page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate through every sidebar item |
| 2 | Check the Settings page |
| 3 | Look for any user management, user list, or multi-user features |

**What should happen:**
- No user management functionality exists anywhere in the app

---

#### TC-FR18-42

> *SRS Reference: FR-18 AC-15*

**What you need:** Logged in to the app

**Where:** All sidebar items (Dashboard, Schedule, Exams, Calendar, Rooms, Sections, Personnel, Templates, Import, Export, Audit Log, Trash, Settings)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to every page in the sidebar |
| 2 | Try using features on each page |

**What should happen:**
- All features are fully accessible — there are no extra permission checks, role restrictions, or access levels
- Everything works for the single admin user without any additional authorization steps

---

### Changing Your Password

*Updating the admin password from the Settings page.*

---

#### TC-FR18-43

> *SRS Reference: FR-18 AC-5*

**What you need:** Logged in, current password is "Admin123"

**Where:** Sidebar > Settings (password change section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to Sidebar > Settings |
| 2 | Find the change password form |
| 3 | Enter "Admin123" in the Current Password field |
| 4 | Enter "NewPass1" in the New Password field |
| 5 | Enter "NewPass1" in the Confirm New Password field |
| 6 | Click the submit button |

**What should happen:**
- A success message appears confirming the password was changed
- On the next login, "NewPass1" works as the password

---

#### TC-FR18-44

> *SRS Reference: FR-18 AC-10*

**What you need:** Logged in

**Where:** Sidebar > Settings (password change section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to Sidebar > Settings |
| 2 | Find the change password form |

**What should happen:**
- The form contains three fields: Current Password, New Password, and Confirm New Password

---

#### TC-FR18-45

> *SRS Reference: FR-18 AC-6 AC-11*

**What you need:** Logged in

**Where:** Sidebar > Settings (password change section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to Sidebar > Settings |
| 2 | Enter a wrong current password (e.g., "WrongOld1") |
| 3 | Enter a valid new password (e.g., "NewPass1") in both new password fields |
| 4 | Click the submit button |

**What should happen:**
- An error message appears: "Current password is incorrect."
- The password is not changed

---

#### TC-FR18-46

> *SRS Reference: FR-18 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Settings (password change section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to Sidebar > Settings |
| 2 | Enter the correct current password |
| 3 | Enter "Ab1" as the new password (less than 8 characters) |
| 4 | Click the submit button |

**What should happen:**
- An error message appears: "Password must be at least 8 characters."
- The password is not changed

---

#### TC-FR18-47

> *SRS Reference: FR-18 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Settings (password change section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to Sidebar > Settings |
| 2 | Enter the correct current password |
| 3 | Enter "newpassword1" as the new password (no uppercase letter) |
| 4 | Click the submit button |

**What should happen:**
- An error message appears about the missing uppercase letter
- The password is not changed

---

#### TC-FR18-48

> *SRS Reference: FR-18 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Settings (password change section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to Sidebar > Settings |
| 2 | Enter the correct current password |
| 3 | Enter "NewPass1" in the New Password field |
| 4 | Enter "DiffPass1" in the Confirm New Password field |
| 5 | Click the submit button |

**What should happen:**
- An error message appears about the passwords not matching
- The password is not changed

---

#### TC-FR18-49

> *SRS Reference: FR-18 AC-5*

**What you need:** Logged in, a database browser tool

**Where:** Sidebar > Settings (password change section), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Change the password to "NewPass1" successfully via Settings |
| 2 | Open the database file with a database browser |
| 3 | Check the stored password hash in the settings table |

**What should happen:**
- The password is stored as an encrypted hash (not plain text)
- The hash starts with `$2a$10$` or `$2b$10$` (indicating secure encryption with cost factor 10)

---

#### TC-FR18-50

> *SRS Reference: FR-18 AC-5*

**What you need:** Password has been changed from "Admin123" to "NewPass1"

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log out |
| 2 | Enter the old password "Admin123" |
| 3 | Click "Log In" |

**What should happen:**
- Login fails with the message: "Invalid password."
- The old password no longer works

---

#### TC-FR18-51

> *SRS Reference: FR-18 AC-5*

**What you need:** Password has been changed to "NewPass1"

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log out |
| 2 | Enter the new password "NewPass1" |
| 3 | Click "Log In" |

**What should happen:**
- Login succeeds
- The Dashboard is displayed

---

### Edge Cases

*Unusual inputs, rapid actions, and boundary conditions that test the app's resilience.*

---

#### TC-EDG-01

> *SRS Reference: FR-18 AC-2*

**What you need:** The app's data file exists but no password was ever set (setup never completed)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Use a data file where setup was never completed |
| 2 | Try to log in with any password (e.g., "Admin123") |

**What should happen:**
- An error message appears: "No password configured. Run setup first."

---

#### TC-EDG-02

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter a very long password — 500 characters — that includes uppercase, lowercase, and a number (e.g., "Aa1" followed by 497 "x" characters) |
| 2 | Enter the same password in the Confirm Password field |
| 3 | Click "Complete Setup" |

**What should happen:**
- Setup completes successfully without errors
- The password is saved and can be used to log in

---

#### TC-EDG-03

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "P@ss!w0rd#$%" in both password fields (contains special characters) |
| 2 | Click "Complete Setup" |
| 3 | Log in with "P@ss!w0rd#$%" |

**What should happen:**
- Setup completes successfully
- Login with the special-character password works

---

#### TC-EDG-04

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "Pàsswörd1" in both password fields (contains accented characters) |
| 2 | Click "Complete Setup" |
| 3 | Log in with "Pàsswörd1" |

**What should happen:**
- Setup completes successfully
- Login with the accented-character password works

---

#### TC-EDG-05

> *SRS Reference: FR-18 AC-1*

**What you need:** Setup completed, app showing login screen

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter the correct password |
| 2 | Rapidly double-click the "Log In" button |

**What should happen:**
- Only one login attempt is processed
- The button disables after the first click, preventing duplicate submissions
- No errors or unexpected behavior

---

#### TC-EDG-06

> *SRS Reference: FR-17 AC-6*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Fill out the setup form with valid data |
| 2 | Rapidly double-click the "Complete Setup" button |

**What should happen:**
- Only one setup attempt is processed
- No "Setup has already been completed" error from the second click
- The app navigates to the login screen normally

---

#### TC-EDG-07

> *SRS Reference: FR-17 AC-9*

**What you need:** A fresh install where the app's internal update files are missing from the expected location

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Remove or rename the database update files from the app's installation folder |
| 2 | Launch the app |

**What should happen:**
- The app handles the missing files gracefully — no crash
- The setup screen still appears

---

#### TC-EDG-08

> *SRS Reference: FR-18 AC-4*

**What you need:** App is running but you have NOT logged in

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Without logging in, rapidly trigger 10 different app features at the same time (e.g., try to access Rooms, Schedule, Settings, etc. simultaneously) |

**What should happen:**
- All attempts are blocked with "Authentication required" messages
- The app does not crash or behave unexpectedly

---

### Environment — Build Variants

*Verifying the app works in development and production builds.*

---

#### TC-NFR-01

> *SRS Reference: FR-17 AC-1*

**What you need:** Development environment set up, no existing database

**Where:** Desktop (run the app in development mode)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Delete any existing database file from the development app data path |
| 2 | Start the app in development mode (e.g., `npm run dev`) |
| 3 | Complete the setup flow |
| 4 | Log in |

**What should happen:**
- The setup screen appears on first launch
- All fields are functional
- Setup completes and login works

---

#### TC-NFR-02

> *SRS Reference: FR-17 AC-1*

**What you need:** A production build (.exe installer) installed on a clean machine with no prior app data

**Where:** Desktop (launch the installed app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Install the .exe on a machine with no prior installation |
| 2 | Launch the app |
| 3 | Complete the setup flow |
| 4 | Log in |

**What should happen:**
- The setup screen appears on first launch
- Database updates run from the bundled app files
- Setup completes and login works

---

#### TC-NFR-03

> *SRS Reference: FR-18 AC-1*

**What you need:** Production build installed, setup completed

**Where:** Desktop (launch the installed app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the installed .exe |
| 2 | Enter the password |
| 3 | Click "Log In" |

**What should happen:**
- Login succeeds
- The Dashboard loads
- All sidebar features are accessible

---

#### TC-NFR-04

> *SRS Reference: FR-17 AC-9*

**What you need:** Production build (.exe) installed, a database browser tool

**Where:** Desktop (launch the installed app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Install and launch the production .exe |
| 2 | Open the database file and check the version history table |

**What should happen:**
- All database updates were found and applied from the bundled app files
- The version history table contains all expected entries

---

#### TC-NFR-05

> *SRS Reference: FR-17 AC-1*

**What you need:** A fresh install of the app

**Where:** Desktop

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app (instance A — the setup screen appears) |
| 2 | Without closing instance A, try to launch the app a second time |

**What should happen:**
- The second instance is blocked from opening
- The first instance receives focus instead
- Only one copy of the app can run at a time

---

# TC_ACADEMIC — Academic Year, Semester & Active Term Management

> **Module:** Academic Term Management
> **SRS Coverage:** FR-02 (Academic Years), FR-03 (Semesters), FR-04 (Active Term Resolution)
> **Last Updated:** 2026-06-12
> **Status:** Draft

---

### Setting Up the School Year

*Creating and managing academic years for SHS and College departments.*

---

#### TC-FR02-01

> *SRS Reference: FR-02 AC-10*

**What you need:** Logged in, SHS department selected, no existing SHS academic years

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Confirm the label and end date are automatically filled in |
| 4 | Click Save |

**What should happen:**
- A new academic year appears in the list with label "2025–2026"
- The end date shows March 31, 2026
- The status shows as Published
- It is marked as the active academic year

---

#### TC-FR02-02

> *SRS Reference: FR-02 AC-13*

**What you need:** Logged in, College department selected, no existing College academic years

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 1, 2025 |
| 3 | Confirm the label and end date are automatically filled in |
| 4 | Click Save |

**What should happen:**
- A new academic year appears in the list with label "2025–2026"
- The end date shows May 31, 2026
- The status shows as Published
- It is marked as the active academic year

---

#### TC-FR02-03

> *SRS Reference: FR-02 AC-10*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 15, 2025 |
| 3 | Look at the Label field |

**What should happen:**
- The label field shows "2025–2026"
- The label field cannot be edited (it is read-only)

---

#### TC-FR02-04

> *SRS Reference: FR-02 AC-12*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Look at the End Date field |

**What should happen:**
- The end date shows March 31, 2026 (ten months from June to March)
- The end date field is automatically filled and cannot be manually changed

---

#### TC-FR02-05

> *SRS Reference: FR-02 AC-13*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 1, 2025 |
| 3 | Look at the End Date field |

**What should happen:**
- The end date shows May 31, 2026 (ten months from August to May)
- The end date field is automatically filled and cannot be manually changed

---

#### TC-FR02-06

> *SRS Reference: FR-02 AC-8*

**What you need:** Logged in, SHS department selected, academic years exist for both SHS and College

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Look at the list of academic years |

**What should happen:**
- Only SHS academic years are shown
- College academic years are not visible

---

#### TC-FR02-07

> *SRS Reference: FR-02 AC-8*

**What you need:** Logged in, academic years exist for both SHS and College

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College using the department switcher in the header |
| 2 | Navigate to the Academic Years page |

**What should happen:**
- Only College academic years are shown
- SHS academic years are not visible

---

#### TC-FR02-08

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" exists with 2 semesters

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Find the "2025–2026" row in the list |
| 3 | Check the Semester Count column |

**What should happen:**
- The Semester Count column displays "2"

---

#### TC-FR02-09

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, at least one academic year exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Look at the table columns |

**What should happen:**
- The following columns are visible: Label, Start Date, End Date, Status, Semester Count

---

#### TC-FR02-10

> *SRS Reference: FR-02 AC-10*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the "2025–2026" row or its detail button |

**What should happen:**
- The detail view opens showing: Department (SHS), Label ("2025–2026"), Start Date, End Date, Status
- A list of linked semesters is shown below the details

---

#### TC-FR02-11

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, a Draft SHS academic year exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft academic year |
| 2 | Click Edit |
| 3 | Change the start date to June 15, 2026 |
| 4 | Confirm the label and end date are recalculated |
| 5 | Click Save |

**What should happen:**
- The academic year is updated
- The label changes to "2026–2027"
- The end date is recalculated to match the new start date

---

#### TC-FR02-12

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, a Draft SHS academic year "2026–2027" exists with no semesters

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the "2026–2027" academic year |
| 2 | Click Delete |
| 3 | Confirm the deletion |

**What should happen:**
- The academic year no longer appears in the active list
- It has been moved to Trash

---

#### TC-FR02-13

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, SHS department selected, SHS academic year with 2 semesters exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the academic year detail page |
| 2 | Look at the semesters section |

**What should happen:**
- Both semesters are listed
- Each semester shows its type, dates, and status correctly

---

#### TC-FR02-14

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is Published and active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2026 |
| 3 | Click Save |

**What should happen:**
- A new academic year "2026–2027" is created with Draft status
- The new academic year is not marked as active
- The existing "2025–2026" academic year remains Published and active

---

#### TC-FR02-15

> *SRS Reference: FR-02*

**What you need:** Logged in, an archived academic year exists in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Trash page |
| 2 | Find the archived academic year |
| 3 | Click Restore |

**What should happen:**
- The academic year reappears in the active Academic Years list
- It is no longer shown in Trash

---

#### TC-FR02-16

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, SHS department selected, 20 or more academic years exist for SHS

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Look for pagination controls at the bottom of the list |
| 3 | Click through the pages |

**What should happen:**
- Results are split across pages
- Pagination controls (next, previous, page numbers) work correctly

---

#### TC-FR02-17

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 1, 2025 (not June) |
| 3 | Click Save |

**What should happen:**
- An error message appears: SHS academic year must start in June
- The academic year is not created

---

#### TC-FR02-18

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 (not August) |
| 3 | Click Save |

**What should happen:**
- An error message appears: College academic year must start in August
- The academic year is not created

---

#### TC-FR02-19

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as January 15, 2025 |
| 3 | Click Save |

**What should happen:**
- An error message appears: SHS academic year must start in June
- The academic year is not created

---

#### TC-FR02-20

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as December 1, 2025 |
| 3 | Click Save |

**What should happen:**
- An error message appears: College academic year must start in August
- The academic year is not created

---

#### TC-FR02-21

> *SRS Reference: FR-02 AC-3*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Observe the end date field |

**What should happen:**
- The end date is automatically calculated and is always after the start date
- There is no way to set the end date equal to the start date through the form

---

#### TC-FR02-22

> *SRS Reference: FR-02 AC-3*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select any valid June start date |
| 3 | Observe the end date field |

**What should happen:**
- The end date is automatically calculated to be well after the start date
- There is no way to set the end date before the start date through the form

---

#### TC-FR02-23

> *SRS Reference: FR-02 AC-4*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" already exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 15, 2025 (which produces the label "2025–2026") |
| 3 | Click Save |

**What should happen:**
- An error message appears: label "2025–2026" already exists for SHS
- The academic year is not created

---

#### TC-FR02-24

> *SRS Reference: FR-02 AC-4*

**What you need:** Logged in, SHS academic year "2025–2026" already exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College using the department switcher in the header |
| 2 | Click "Add Academic Year" |
| 3 | Select the start date as August 1, 2025 (which produces the label "2025–2026") |
| 4 | Click Save |

**What should happen:**
- The academic year is created successfully with label "2025–2026"
- The same label is allowed across different departments

---

#### TC-FR02-25

> *SRS Reference: FR-02 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" (June 1, 2025 to March 31, 2026) exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 (same as existing) |
| 3 | Click Save |

**What should happen:**
- An error message appears about overlapping date ranges
- The academic year is not created

---

#### TC-FR02-26

> *SRS Reference: FR-02 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" (June 1, 2025 to March 31, 2026) exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2026 (which produces "2026–2027") |
| 3 | Click Save |

**What should happen:**
- The academic year is created successfully — no overlap with the existing one
- "2026–2027" appears in the list

---

#### TC-FR02-27

> *SRS Reference: FR-02 AC-12*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Observe the end date field |

**What should happen:**
- The end date is automatically set to March 31, 2026
- The end date field cannot be manually changed to a different value (e.g., May 31, 2026)
- The system enforces the correct SHS end date (June start → March end)

---

#### TC-FR02-28

> *SRS Reference: FR-02 AC-13*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 1, 2025 |
| 3 | Observe the end date field |

**What should happen:**
- The end date is automatically set to May 31, 2026
- The end date field cannot be manually changed to a different value (e.g., March 31, 2026)
- The system enforces the correct College end date (August start → May end)

---

#### TC-FR02-29

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" has a 1st Semester ending October 30

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select and edit academic year "2025–2026" |
| 2 | Try to change the end date to October 1, 2025 (before the semester ends) |
| 3 | Click Save |

**What should happen:**
- An error message appears: cannot shorten the academic year below the dates of its existing semesters
- The change is not saved

---

#### TC-FR02-30

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, Draft SHS academic year "2025–2026" has a 1st Semester ending October 30

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select and edit the Draft academic year |
| 2 | Confirm the dates still cover all existing semesters |
| 3 | Click Save |

**What should happen:**
- The edit is accepted
- Widening or maintaining the date range is allowed as long as semesters still fit within it

---

#### TC-FR02-31

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published academic year |
| 2 | Try to delete it |

**What should happen:**
- An error message appears: "Cannot delete a published academic year."
- The academic year remains in the list

---

#### TC-FR02-32

> *SRS Reference: FR-02 AC-6*

**What you need:** Logged in, College academic year "2025–2026" is active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to SHS using the department switcher in the header |
| 2 | Create an SHS academic year "2025–2026" |
| 3 | Switch back to College using the department switcher |

**What should happen:**
- The College academic year "2025–2026" is unchanged — still active, same status
- Creating an academic year in one department does not affect the other department

---

#### TC-FR02-33

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as July 1, 2025 |
| 3 | Click Save |

**What should happen:**
- An error message appears: SHS academic year must start in June, not July
- The academic year is not created

---

#### TC-FR02-34

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as September 1, 2025 |
| 3 | Click Save |

**What should happen:**
- An error message appears: College academic year must start in August, not September
- The academic year is not created

---

#### TC-FR02-35

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS has zero academic years

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Click Save |

**What should happen:**
- The academic year is created with Published status
- It is automatically marked as the active academic year (since it's the first one)

---

#### TC-FR02-36

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is Published and active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2026 |
| 3 | Click Save |

**What should happen:**
- The new academic year "2026–2027" is created with Draft status
- It is not marked as active
- The existing "2025–2026" remains Published and active

---

#### TC-FR02-37

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is active but its end date has passed, Draft academic year "2026–2027" exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft academic year "2026–2027" |
| 2 | Click Publish |

**What should happen:**
- "2026–2027" changes to Published status and becomes the active academic year
- "2025–2026" is no longer marked as active

---

#### TC-FR02-38

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is active with end date in the future, Draft "2026–2027" exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft academic year "2026–2027" |
| 2 | Click Publish |

**What should happen:**
- An error message appears: "Cannot publish until the current academic year ends on [date]."
- "2026–2027" remains in Draft status

---

#### TC-FR02-39

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is active (its end date has passed), Draft "2026–2027" is ready to publish

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click Publish on "2026–2027" |
| 2 | Check the status of "2025–2026" |

**What should happen:**
- "2025–2026" is no longer marked as active
- "2026–2027" is now the active academic year
- Only one academic year is active at a time

---

#### TC-FR02-40

> *SRS Reference: FR-02 AC-6*

**What you need:** Logged in, SHS has a Draft academic year ready to publish, College academic year "2025–2026" is active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | With SHS selected, publish the Draft academic year |
| 2 | Switch to College using the department switcher |
| 3 | Check the College academic year status |

**What should happen:**
- College academic year "2025–2026" remains active and unchanged
- Publishing in SHS does not affect College

---

#### TC-FR02-41

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the already-Published academic year |
| 2 | Try to click Publish again |

**What should happen:**
- An error message appears: "Academic year is already published."
- No change occurs

---

#### TC-FR02-42

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published academic year |
| 2 | Try to edit the label, start date, or end date |

**What should happen:**
- An error message appears: "Cannot edit a published academic year."
- The fields cannot be changed

---

#### TC-FR02-43

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published academic year |
| 2 | Try to delete it |

**What should happen:**
- An error message appears: "Cannot delete a published academic year."
- The academic year remains in the list

---

#### TC-FR02-44

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Draft SHS academic year exists with no semesters

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft academic year |
| 2 | Click Delete |
| 3 | Confirm the deletion |

**What should happen:**
- The academic year is removed from the active list
- It is moved to Trash

---

#### TC-FR02-45

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new academic year |
| 2 | Open the activity log or audit history |

**What should happen:**
- An audit entry appears showing that the academic year was created
- The entry includes the details of the new academic year

---

#### TC-FR02-46

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, a Draft academic year exists that is ready to publish (the current active academic year has ended)

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Publish the Draft academic year |
| 2 | Open the activity log or audit history |

**What should happen:**
- An audit entry appears showing the status changed from Draft to Published
- The entry captures both the before and after states

---

#### TC-FR02-47

> *SRS Reference: FR-02 AC-8*

**What you need:** Logged in, SHS department selected, SHS has no academic years

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |

**What should happen:**
- An empty state is displayed (e.g., "No academic years found" or an empty table)

---

#### TC-FR02-48

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 30, 2025 (last day of June) |
| 3 | Click Save |

**What should happen:**
- The academic year is created successfully with label "2025–2026"
- The end date is March 31, 2026
- June 30 is accepted because it is still in June

---

#### TC-FR02-49

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 31, 2025 (last day of August) |
| 3 | Click Save |

**What should happen:**
- The academic year is created successfully with label "2025–2026"
- The end date is May 31, 2026
- August 31 is accepted because it is still in August

---

#### TC-FR02-50

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, an academic year exists with 2 semesters, several schedule entries, and a calendar event

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the academic year |
| 2 | Click Delete |
| 3 | Look at the deletion warning that appears |

**What should happen:**
- A warning shows how many related items would be affected (e.g., "2 semesters, 5 schedule entries, 1 calendar event")
- The user is asked to confirm before proceeding

---

#### TC-FR02-51

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, an academic year exists with no semesters and no schedule entries

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the academic year |
| 2 | Click Delete |
| 3 | Look at the deletion warning that appears |

**What should happen:**
- The warning shows no related items would be affected (e.g., "0 semesters, 0 schedule entries, 0 calendar events")

---

#### TC-FR02-52

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, an archived academic year exists in Trash with no linked records

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Trash page |
| 2 | Find the archived academic year |
| 3 | Click Permanently Delete |
| 4 | Confirm the permanent deletion |

**What should happen:**
- The academic year is permanently removed
- It no longer appears in Trash or in the active academic years list

---

### Managing Semesters

*Creating semesters within academic years, quarter boundaries for SHS, and semester activation.*

---

#### TC-FR03-01

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is Published and active

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 1st Semester |
| 3 | Enter start date: June 15, 2025 |
| 4 | Enter end date: October 30, 2025 |
| 5 | Enter Q1 End Date: August 15, 2025 |
| 6 | Click Save |

**What should happen:**
- The semester is created and appears in the semester list
- Quarter 1 spans June 15 to August 15
- Quarter 2 spans August 16 to October 30
- The status is Published and it is marked as the active semester (since it's the first)

---

#### TC-FR03-02

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" exists, 1st Semester is already active

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Enter start date: November 1, 2025 |
| 4 | Enter end date: March 15, 2026 |
| 5 | Enter Q3 End Date: January 15, 2026 |
| 6 | Click Save |

**What should happen:**
- The semester is created with Draft status (because a sibling semester is active)
- Quarter 3 spans November 1 to January 15
- Quarter 4 spans January 16 to March 15

---

#### TC-FR03-03

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, College department selected, College academic year "2025–2026" is Published and active

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 1st Semester |
| 3 | Enter start date: August 15, 2025 |
| 4 | Enter end date: December 15, 2025 |
| 5 | Click Save |

**What should happen:**
- The semester is created and appears in the list
- No quarter boundary fields are shown (College does not have quarters)
- The status is Published and it is the active semester (first one)

---

#### TC-FR03-04

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, College department selected, College academic year "2025–2026" exists, 1st Semester is already active

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Enter start date: January 10, 2026 |
| 4 | Enter end date: May 15, 2026 |
| 5 | Click Save |

**What should happen:**
- The semester is created with Draft status
- No quarter boundary fields are shown

---

#### TC-FR03-05

> *SRS Reference: FR-03 AC-5*

**What you need:** Logged in, College department selected, College academic year "2025–2026" exists

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: Summer |
| 3 | Enter valid dates within the academic year range |
| 4 | Click Save |

**What should happen:**
- The Summer semester is created successfully
- It appears in the semester list under the academic year

---

#### TC-FR03-06

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, an academic year exists with no semesters

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Fill in valid semester details |
| 3 | Click Save |

**What should happen:**
- The semester is created with Published status
- It is automatically marked as the active semester (since it's the first one)

---

#### TC-FR03-07

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, an academic year exists with one active semester

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Fill in valid semester details for a second semester |
| 3 | Click Save |

**What should happen:**
- The second semester is created with Draft status
- It is not marked as active
- The first semester remains unchanged (Published and active)

---

#### TC-FR03-08

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year with 2 semesters exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the semesters view for the academic year |

**What should happen:**
- Semesters are grouped under their parent academic year
- Each semester shows its type, status, start and end dates
- SHS semesters also show quarter boundary dates

---

#### TC-FR03-09

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, a Draft SHS semester exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft semester |
| 2 | Click Edit |
| 3 | Change the start date and end date (keeping them within the academic year range) |
| 4 | Click Save |

**What should happen:**
- The semester is updated with the new dates
- The changes are reflected in the semester list

---

#### TC-FR03-10

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, SHS department selected, a Draft SHS 1st Semester with a Q1 boundary exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft semester |
| 2 | Click Edit |
| 3 | Change the Q1 End Date to a new valid value (between start and end) |
| 4 | Click Save |

**What should happen:**
- The Q1 End Date is updated
- The quarter spans are recalculated to reflect the new boundary

---

#### TC-FR03-11

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Draft semester exists with no schedule entries

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft semester |
| 2 | Click Delete |
| 3 | Confirm the deletion |

**What should happen:**
- The semester is removed from the active list
- It is moved to Trash

---

#### TC-FR03-12

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new semester |
| 2 | Open the activity log or audit history |

**What should happen:**
- An audit entry appears showing that the semester was created

---

#### TC-FR03-13

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, College department selected, College semesters exist

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | View the semester list |

**What should happen:**
- No Q1 End Date or Q3 End Date columns are visible
- College semesters do not show quarter-related information

---

#### TC-FR03-14

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, SHS department selected, SHS semesters exist

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | View the semester list |

**What should happen:**
- Quarter boundary date columns are visible and populated
- The Q1/Q3 End Date columns show the correct dates

---

#### TC-FR03-15

> *SRS Reference: FR-03 AC-4*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Try to select Summer as the semester type |

**What should happen:**
- Either Summer is not available in the dropdown, or selecting it and saving shows an error: "Summer semester is not available for SHS."
- The Summer semester is not created

---

#### TC-FR03-16

> *SRS Reference: FR-03 AC-4*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Open the semester type dropdown |

**What should happen:**
- Only "1st Semester" and "2nd Semester" are available
- "Summer" is not listed as an option

---

#### TC-FR03-17

> *SRS Reference: FR-03 AC-5*

**What you need:** Logged in, College department selected, College academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Open the semester type dropdown |

**What should happen:**
- Three options are available: "1st Semester", "2nd Semester", and "Summer"

---

#### TC-FR03-18

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 1st Semester |
| 3 | Look at the form fields |

**What should happen:**
- A "Q1 End Date" field is visible and editable

---

#### TC-FR03-19

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Look at the form fields |

**What should happen:**
- A "Q3 End Date" field is visible and editable

---

#### TC-FR03-20

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, College department selected, College academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 1st Semester |
| 3 | Look at the form fields |

**What should happen:**
- No Q1 End Date or Q3 End Date fields are visible
- Quarter boundary fields are hidden for College

---

#### TC-FR03-21

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, College department selected, College academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: Summer |
| 3 | Look at the form fields |

**What should happen:**
- No quarter boundary fields are shown
- Only start date and end date fields are present

---

#### TC-FR03-22

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, creating a 1st Semester under an SHS academic year

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30, Q1 End Date: August 15 |
| 3 | Click Save |
| 4 | Open the semester detail |

**What should happen:**
- Quarter 1 spans June 15 to August 15 (inclusive)
- Quarter 2 spans August 16 to October 30 (inclusive)
- Both quarter spans are correctly derived from the Q1 End Date

---

#### TC-FR03-23

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, creating a 2nd Semester under an SHS academic year

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 2nd Semester |
| 2 | Enter start date: November 1, end date: March 15, Q3 End Date: January 15 |
| 3 | Click Save |
| 4 | Open the semester detail |

**What should happen:**
- Quarter 3 spans November 1 to January 15 (inclusive)
- Quarter 4 spans January 16 to March 15 (inclusive)
- Both quarter spans are correctly derived from the Q3 End Date

---

#### TC-FR03-24

> *SRS Reference: FR-03 AC-4 AC-5*

**What you need:** Logged in, academic years exist for both SHS and College

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College, open the College academic year, create a Summer semester → should succeed |
| 2 | Switch to SHS using the department switcher, open the SHS academic year, try to create a Summer semester |

**What should happen:**
- The College Summer semester is created successfully
- The SHS Summer semester is rejected with the message: "Summer semester is not available for SHS."

---

#### TC-FR03-25

> *SRS Reference: FR-03 AC-13*

**What you need:** Logged in, SHS 1st Semester is active with 5 unpublished draft schedule entries, Draft 2nd Semester exists, 1st Semester period has ended

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |
| 3 | Look at the advisory notice that appears |

**What should happen:**
- A non-blocking advisory appears showing: "5 unpublished drafts", a template reminder, and a backup reminder
- The activation still proceeds after the advisory is shown
- The 2nd Semester becomes Published and active

---

#### TC-FR03-26

> *SRS Reference: FR-03 AC-13*

**What you need:** Logged in, 1st Semester is active with 0 draft schedule entries, Draft 2nd Semester exists, 1st Semester period has ended

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |

**What should happen:**
- No advisory checklist is displayed (or it shows 0 drafts)
- The activation proceeds without interruption

---

#### TC-FR03-27

> *SRS Reference: FR-03 AC-1*

**What you need:** Logged in, SHS department selected, SHS academic year with an existing 1st Semester

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 1st Semester |
| 3 | Enter valid dates |
| 4 | Click Save |

**What should happen:**
- An error message appears: "1st Semester already exists for this academic year."
- The duplicate semester is not created

---

#### TC-FR03-28

> *SRS Reference: FR-03 AC-2*

**What you need:** Logged in, SHS department selected, SHS academic year runs June 1, 2025 to March 31, 2026

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Enter start date: May 1, 2025 (before the academic year starts) |
| 3 | Click Save |

**What should happen:**
- An error message appears: "Semester dates must be within the academic year range."
- The semester is not created

---

#### TC-FR03-29

> *SRS Reference: FR-03 AC-3*

**What you need:** Logged in, SHS department selected, SHS academic year runs June 1, 2025 to March 31, 2026

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Enter end date: April 15, 2026 (after the academic year ends) |
| 3 | Click Save |

**What should happen:**
- An error message appears: "Semester dates must be within the academic year range."
- The semester is not created

---

#### TC-FR03-30

> *SRS Reference: FR-03 AC-2*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Enter start date: October 1, 2025 and end date: October 1, 2025 (same date) |
| 3 | Click Save |

**What should happen:**
- An error message appears: "Start date must be before end date."
- The semester is not created

---

#### TC-FR03-31

> *SRS Reference: FR-03 AC-12*

**What you need:** Logged in, SHS department selected, SHS academic year with 1st Semester running June 15 to October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Enter start date: October 15, 2025 (overlaps with 1st Semester ending October 30) |
| 4 | Enter end date: March 1, 2026 |
| 5 | Click Save |

**What should happen:**
- An error message appears about overlapping semester dates
- The semester is not created

---

#### TC-FR03-32

> *SRS Reference: FR-03 AC-12*

**What you need:** Logged in, SHS department selected, SHS academic year with 1st Semester running June 15 to October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Enter start date: November 1, 2025 (no overlap) |
| 4 | Enter end date: March 15, 2026 |
| 5 | Click Save |

**What should happen:**
- The semester is created successfully — no overlap with the 1st Semester

---

#### TC-FR03-33

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30 |
| 3 | Set Q1 End Date to June 15 (same as the start date) |
| 4 | Click Save |

**What should happen:**
- An error message appears: the Q1 boundary must be strictly between the start and end dates
- The semester is not created

---

#### TC-FR03-34

> *SRS Reference: FR-03 AC-9*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30 |
| 3 | Set Q1 End Date to October 30 (same as the end date) |
| 4 | Click Save |

**What should happen:**
- An error message appears: the Q1 boundary must be strictly between the start and end dates
- The semester is not created

---

#### TC-FR03-35

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30 |
| 3 | Set Q1 End Date to June 10 (before the start date) |
| 4 | Click Save |

**What should happen:**
- An error message appears: the Q1 boundary is outside the semester range
- The semester is not created

---

#### TC-FR03-36

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30 |
| 3 | Set Q1 End Date to November 5 (after the end date) |
| 4 | Click Save |

**What should happen:**
- An error message appears: the Q1 boundary is outside the semester range
- The semester is not created

---

#### TC-FR03-37

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30 |
| 3 | Set Q1 End Date to June 16 (one day after start) |
| 4 | Click Save |

**What should happen:**
- The semester is created successfully
- Quarter 1 spans June 15 to June 16
- Quarter 2 spans June 17 to October 30

---

#### TC-FR03-38

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" and select type: 1st Semester |
| 2 | Enter start date: June 15, end date: October 30 |
| 3 | Set Q1 End Date to October 29 (one day before end) |
| 4 | Click Save |

**What should happen:**
- The semester is created successfully
- Quarter 1 spans June 15 to October 29
- Quarter 2 spans October 30 to October 30

---

#### TC-FR03-39

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Published semester exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published semester |
| 2 | Try to edit the start date or end date |

**What should happen:**
- An error message appears: "Cannot edit a published semester."
- The fields cannot be changed

---

#### TC-FR03-40

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Published semester exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published semester |
| 2 | Try to delete it |

**What should happen:**
- An error message appears: "Cannot delete a published semester."
- The semester remains in the list

---

#### TC-FR03-41

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active but its end date has passed, Draft 2nd Semester exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |

**What should happen:**
- The 2nd Semester changes to Published status and becomes the active semester
- The 1st Semester is no longer marked as active

---

#### TC-FR03-42

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active with end date in the future, Draft 2nd Semester exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |

**What should happen:**
- An error message appears: "Cannot publish until the current semester ends on [date]."
- The 2nd Semester remains in Draft status

---

#### TC-FR03-43

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Published semester exists

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published semester |
| 2 | Try to click Publish again |

**What should happen:**
- An error message appears: "Semester is already published."
- No change occurs

---

#### TC-FR03-44

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active, 2nd Semester is ready to publish (1st Semester period has ended)

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Publish the 2nd Semester |
| 2 | Check the 1st Semester status |

**What should happen:**
- The 1st Semester is no longer marked as active
- Only the 2nd Semester is active
- There is never more than one active semester at a time

---

#### TC-FR03-45

> *SRS Reference: FR-03 AC-2*

**What you need:** Logged in, SHS department selected, SHS academic year runs June 1, 2025 to March 31, 2026

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Enter start date: June 1, 2025 (exactly matching academic year start) |
| 3 | Enter end date: March 31, 2026 (exactly matching academic year end) |
| 4 | Click Save |

**What should happen:**
- The semester is created successfully
- Dates exactly matching the academic year boundaries are accepted as valid

---

#### TC-FR03-46

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year exists with no semesters

**Where:** Sidebar > Academic > Academic year detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the academic year detail page |
| 2 | Look at the semesters section |

**What should happen:**
- An empty state is shown (no semesters listed)

---

### Active Term

*How the app determines the current active academic year and semester, and how this affects other features.*

---

#### TC-FR04-01

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is active, 1st Semester is active with Q1 End Date set to August 15, 2025

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active academic year shows "2025–2026"
- The active semester shows "1st Semester"
- The current quarter (Q1 or Q2) is displayed based on today's date relative to August 15

---

#### TC-FR04-02

> *SRS Reference: FR-04 AC-2*

**What you need:** Logged in, College department selected, College academic year "2025–2026" is active, 2nd Semester is active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active academic year shows "2025–2026"
- The active semester shows "2nd Semester"
- No quarter information is displayed (College does not have quarters)

---

#### TC-FR04-03

> *SRS Reference: FR-04 AC-3*

**What you need:** Logged in, SHS department selected, SHS has no active academic year (none exist or all are inactive)

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- No active academic year is shown
- No active semester is shown
- No quarter information is displayed

---

#### TC-FR04-04

> *SRS Reference: FR-04 AC-4*

**What you need:** Logged in, College department selected, College academic year "2025–2026" is active, but no active semester exists within it

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active academic year shows "2025–2026"
- No active semester is shown
- No quarter information is displayed

---

#### TC-FR04-05

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active with Q1 End Date set to August 15, 2025; today's date is before August 15

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q1"

---

#### TC-FR04-06

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active with Q1 End Date set to August 15, 2025; today's date is after August 15

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q2"

---

#### TC-FR04-07

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 2nd Semester is active with Q3 End Date set to January 15, 2026; today's date is before January 15

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q3"

---

#### TC-FR04-08

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 2nd Semester is active with Q3 End Date set to January 15, 2026; today's date is after January 15

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q4"

---

#### TC-FR04-09

> *SRS Reference: FR-04 AC-2*

**What you need:** Logged in, College department selected, College Summer semester is active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active semester shows "Summer"
- No quarter information is displayed (Summer has no quarters)

---

#### TC-FR04-10

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS academic year is active; College has no active academic year

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | With SHS selected, look at the active term display — it shows the active academic year and semester |
| 2 | Switch to College using the department switcher in the header |
| 3 | Look at the active term display |

**What should happen:**
- SHS shows full active term information (academic year, semester, quarter)
- College shows no active term information
- Each department's active term is independent of the other

---

#### TC-FR04-11

> *SRS Reference: FR-04 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year is active but has no active semester

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Class schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created

---

#### TC-FR04-12

> *SRS Reference: FR-04 AC-6*

**What you need:** Logged in, College department selected, College academic year is active but has no active semester

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Exam schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created

---

#### TC-FR04-13

> *SRS Reference: FR-04 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year is active but has no active semester

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Office Hours schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created

---

#### TC-FR04-14

> *SRS Reference: FR-04 AC-8*

**What you need:** Logged in, SHS department selected, SHS academic year is active but has no active semester

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new Meeting schedule entry |

**What should happen:**
- The Meeting is created successfully
- Meetings only require an active academic year, not an active semester

---

#### TC-FR04-15

> *SRS Reference: FR-04 AC-5*

**What you need:** Logged in, SHS department selected, SHS has no active academic year at all

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Class schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created (no academic year means no semester either)

---

#### TC-FR04-16

> *SRS Reference: FR-04 AC-8*

**What you need:** Logged in, SHS department selected, SHS has no active academic year at all

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Meeting schedule entry |

**What should happen:**
- The Meeting is blocked — Meetings require at least an active academic year
- An error message appears indicating no active academic year is set

---

#### TC-FR04-17

> *SRS Reference: FR-04 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year is active with an active semester and existing Class entries

**Where:** Sidebar > Academic, then Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Academic and publish a new academic year (after the current one has ended) |
| 2 | The previous academic year is deactivated automatically |
| 3 | Go to Sidebar > Schedule |
| 4 | Try to create a new Class entry under the new academic year (which has no semester yet) |

**What should happen:**
- The new Class entry is blocked — the new academic year has no active semester
- Existing entries from the previous academic year are unaffected
- An error message appears about needing an active semester

---

#### TC-FR04-18

> *SRS Reference: FR-04 AC-1 AC-5*

**What you need:** Logged in, SHS department selected, fresh department with no data

**Where:** Sidebar > Academic, then Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Academic and create an SHS academic year (it auto-publishes and activates) |
| 2 | Add a 1st Semester with a Q1 boundary (it auto-publishes and activates) |
| 3 | Check the active term display — it should show the academic year, semester, and quarter |
| 4 | Go to Sidebar > Schedule and create a Class entry |
| 5 | Create an Exam entry |

**What should happen:**
- All steps succeed without errors
- The active term display shows complete information (academic year, semester, and quarter)
- Both Class and Exam entries are created successfully without being blocked

---

#### TC-FR04-19

> *SRS Reference: FR-03 AC-6, FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS academic year is active, 1st Semester is active, 1st Semester period has ended, Draft 2nd Semester exists

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Publish the 2nd Semester (it deactivates the 1st Semester) |
| 2 | Check the active term display |

**What should happen:**
- The active term now shows the 2nd Semester
- New entries will be associated with the 2nd Semester
- The 1st Semester is no longer active

---

#### TC-FR04-20

> *SRS Reference: FR-04 AC-3*

**What you need:** Logged in, SHS department selected, Draft academic year "2027–2028" exists alongside the active "2026–2027"

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Delete the Draft academic year "2027–2028" |
| 2 | Check the active term display |

**What should happen:**
- The active term still shows "2026–2027" and its active semester
- Deleting a Draft academic year does not disrupt the active term

---

#### TC-FR04-21

> *SRS Reference: FR-04 AC-1 AC-2*

**What you need:** Logged in, SHS academic year "2025–2026" with 1st Semester active; College academic year "2025–2026" with 2nd Semester active

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | With SHS selected, check the active term display |
| 2 | Switch to College using the department switcher |
| 3 | Check the active term display |

**What should happen:**
- SHS shows 1st Semester with quarter information (Q1 or Q2)
- College shows 2nd Semester with no quarter information
- Each department resolves its active term independently

---

#### TC-FR04-22

> *SRS Reference: FR-04 AC-3*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" was active but has been deleted (moved to Trash)

**Where:** Sidebar > Academic

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Check the active term display |

**What should happen:**
- No active academic year is shown
- No active semester or quarter is shown
- A deleted academic year is excluded from the active term

---

# TC_CALENDAR — Academic Calendar Management

> **Module:** Academic Calendar (FR-05)
> **Last Updated:** 2026-06-12

---

### Academic Calendar
*Creating and managing calendar events like holidays, exam periods, and school events.*

---

#### TC-FR05-01

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in, at least one academic year exists

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: HOLIDAY |
| 3 | Enter title: "All Saints Day" |
| 4 | Set date to November 1, 2026 |
| 5 | Check the "All Day" checkbox |
| 6 | Click Save |

**What should happen:**
- The event is created and appears in the calendar list
- The event is automatically marked as blocking (prevents scheduling on that day)

---

#### TC-FR05-02

> *SRS Reference: FR-05 AC-2*

**What you need:** Logged in, an academic year and semester exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: EXAM_PERIOD |
| 3 | Enter title: "Midterm Exam Week" |
| 4 | Set start date to October 14, 2026 |
| 5 | Set end date to October 18, 2026 |
| 6 | Check the "All Day" checkbox |
| 7 | Link the event to an academic year and semester |
| 8 | Click Save |

**What should happen:**
- The event is created and appears in the calendar list
- The event is automatically marked as blocking
- The date range defines the exam scheduling window for that period

---

#### TC-FR05-03

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: BREAK |
| 3 | Enter title: "Semester Break" |
| 4 | Set start date to October 21, 2026 |
| 5 | Set end date to October 25, 2026 |
| 6 | Click Save |

**What should happen:**
- The event is created successfully and appears in the calendar list

---

#### TC-FR05-04

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: INSTITUTIONAL_EVENT |
| 3 | Enter title: "Foundation Day" |
| 4 | Set the date |
| 5 | Set the event as non-blocking |
| 6 | Add a description |
| 7 | Click Save |

**What should happen:**
- The event is created and appears in the calendar list
- The event does not prevent scheduling on that day (non-blocking)

---

#### TC-FR05-05

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: CUSTOM |
| 3 | Enter title: "Faculty Meeting" |
| 4 | Set a specific time range (e.g., 2:00 PM – 4:00 PM) instead of all-day |
| 5 | Click Save |

**What should happen:**
- The event is created with the specific time range and appears in the calendar list

---

#### TC-FR05-06

> *SRS Reference: FR-05 AC-3*

**What you need:** Logged in, at least one calendar event exists

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on an existing event in the list |
| 2 | Change the title to "Updated Holiday" |
| 3 | Change the date |
| 4 | Click Save |

**What should happen:**
- The event is updated with the new title and date
- The changes are reflected in the calendar list

---

#### TC-FR05-07

> *SRS Reference: FR-05 AC-4*

**What you need:** Logged in, at least one calendar event exists

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on an existing event |
| 2 | Confirm the deletion in the dialog that appears |

**What should happen:**
- The event is removed from the calendar list
- The event can be found in the Trash page for potential restoration

---

#### TC-FR05-08

> *SRS Reference: FR-05 AC-14*

**What you need:** Logged in, multiple calendar events of different types exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the event type filter and choose HOLIDAY |
| 2 | Verify only holiday events are shown in the list |
| 3 | Clear the filter |
| 4 | Type a title into the search field |
| 5 | Verify only events matching the search term are shown |

**What should happen:**
- Filtering by type shows only events of the selected type
- Searching by title shows only events matching the search query
- Clearing the filter restores the full list

---

#### TC-FR05-09

> *SRS Reference: FR-05 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Enter a title with only 1 character (e.g., "A") |
| 3 | Fill in the other required fields |
| 4 | Click Save |

**What should happen:**
- A validation error is displayed: title must be at least 2 characters
- The event is not saved

---

#### TC-FR05-10

> *SRS Reference: FR-05 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Leave the title field empty |
| 3 | Click Save |

**What should happen:**
- A validation error is displayed: title is required
- The event is not saved

---

#### TC-FR05-11

> *SRS Reference: FR-05 AC-6*

**What you need:** Logged in, an event titled "Holiday A" already exists for November 1–2, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Enter title: "Holiday A" |
| 3 | Set date to November 1, 2026 (overlaps the existing event) |
| 4 | Click Save |

**What should happen:**
- A validation error is displayed: the title must be unique within overlapping date ranges
- The event is not saved

---

#### TC-FR05-12

> *SRS Reference: FR-05 AC-6*

**What you need:** Logged in, an event titled "Holiday A" exists for November 1, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Enter title: "Holiday A" |
| 3 | Set date to December 25, 2026 (no overlap with existing event) |
| 4 | Click Save |

**What should happen:**
- The event is created successfully — the same title is allowed when dates do not overlap

---

#### TC-FR05-13

> *SRS Reference: FR-05 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Set start time to November 5, 2026 at 10:00 AM |
| 3 | Set end time to November 5, 2026 at 9:00 AM (before the start) |
| 4 | Click Save |

**What should happen:**
- A validation error is displayed: end date/time must be after start date/time
- The event is not saved

---

#### TC-FR05-14

> *SRS Reference: FR-05 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Set start and end to the exact same date and time |
| 3 | Click Save |

**What should happen:**
- A validation error is displayed: end must be strictly after start
- The event is not saved

---

#### TC-FR05-15

> *SRS Reference: FR-05 AC-8*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: HOLIDAY |
| 3 | Fill in the required fields and click Save |
| 4 | Open the newly created event |

**What should happen:**
- The event is automatically marked as blocking (the blocking checkbox is checked and cannot be unchecked for this type)

---

#### TC-FR05-16

> *SRS Reference: FR-05 AC-8*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: EXAM_PERIOD |
| 3 | Fill in the required fields and click Save |
| 4 | Open the newly created event |

**What should happen:**
- The event is automatically marked as blocking (the blocking checkbox is checked and cannot be unchecked for this type)

---

#### TC-FR05-17

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, a draft schedule entry exists on Monday November 3, 2026 at 8:00–9:00 AM

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking HOLIDAY on November 3, 2026 |
| 3 | Click Save |
| 4 | Navigate to the schedule page and open the draft entry for November 3 |

**What should happen:**
- The draft schedule entry on November 3 now shows a "blocked by event" conflict warning
- The conflict is marked as a hard conflict that must be resolved before publishing

---

#### TC-FR05-18

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, draft schedule entries exist in both SHS and College departments on November 3, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking HOLIDAY on November 3, 2026 |
| 3 | Click Save |
| 4 | Switch to SHS department and check the draft entry on November 3 |
| 5 | Switch to College department and check the draft entry on November 3 |

**What should happen:**
- Both the SHS and College draft entries on November 3 show a "blocked by event" conflict warning
- The blocking event affects entries in all departments (institution-wide)

---

#### TC-FR05-19

> *SRS Reference: FR-05 AC-10*

**What you need:** Logged in, a published schedule entry exists on November 3, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking HOLIDAY on November 3, 2026 |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check the published entry on November 3 |

**What should happen:**
- The published entry does NOT show a new conflict warning
- Published entries are only updated when explicitly re-validated (not automatically)

---

#### TC-FR05-20

> *SRS Reference: FR-05 AC-10*

**What you need:** Logged in, a published schedule entry exists on November 3, 2026, and a blocking holiday event also exists on November 3

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Re-validate Published" |
| 2 | Check the published entry for November 3 |

**What should happen:**
- The published entry now shows a "blocked by event" conflict warning after re-validation

---

#### TC-FR05-21

> *SRS Reference: FR-05 AC-11*

**What you need:** Logged in, a blocking holiday exists on November 3, 2026, and a draft schedule entry on November 3 shows a "blocked by event" conflict

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Delete the holiday event on November 3 |
| 2 | Confirm the deletion |
| 3 | Navigate to the schedule page and check the draft entry on November 3 |

**What should happen:**
- The "blocked by event" conflict warning is removed from the draft entry
- The draft entry no longer has any event-related conflicts

---

#### TC-FR05-22

> *SRS Reference: FR-05 AC-8*

**What you need:** Logged in, a draft schedule entry exists on November 3, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a non-blocking INSTITUTIONAL_EVENT on November 3, 2026 |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check the draft entry on November 3 |

**What should happen:**
- The draft entry does NOT show a "blocked by event" conflict warning
- Non-blocking events do not affect schedule entries

---

#### TC-FR05-23

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, a non-blocking event exists on a date that also has draft schedule entries

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the non-blocking event |
| 2 | Toggle the blocking setting to enabled |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check the draft entries on that date |

**What should happen:**
- The draft entries now show a "blocked by event" conflict warning
- Changing an event to blocking immediately affects overlapping draft entries

---

#### TC-FR05-24

> *SRS Reference: FR-05 AC-12*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Check the "All Day" checkbox |

**What should happen:**
- The time picker fields are hidden or disabled
- Only date fields remain visible for selection

---

#### TC-FR05-25

> *SRS Reference: FR-05 AC-12*

**What you need:** Logged in, draft schedule entries exist on November 3, 2026 at various times (e.g., 8:00 AM, 12:00 PM, 8:00 PM)

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking all-day event on November 3, 2026 |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check all draft entries on November 3 |

**What should happen:**
- All draft entries on November 3 show a "blocked by event" conflict, regardless of their time
- An all-day blocking event covers the entire day from start to end

---

#### TC-FR05-26

> *SRS Reference: FR-05 AC-12*

**What you need:** Logged in, draft schedule entries exist on November 3 at 8:00–9:00 AM and 11:00 AM–12:00 PM

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking event on November 3, 2026 from 10:00 AM to 12:00 PM (not all-day) |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check the draft entries on November 3 |

**What should happen:**
- The 11:00 AM–12:00 PM entry shows a "blocked by event" conflict (overlaps with the event)
- The 8:00–9:00 AM entry does NOT show a conflict (outside the event's time range)

---

#### TC-FR05-27

> *SRS Reference: FR-05 AC-13*

**What you need:** Logged in, an EXAM_PERIOD event exists for October 14–18, 2026

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create an exam schedule entry on October 15, 2026 (within the exam period) |
| 2 | Check the entry's conflict status |

**What should happen:**
- The exam entry does NOT show an "exam period mismatch" warning
- The exam is correctly scheduled within the defined exam window

---

#### TC-FR05-28

> *SRS Reference: FR-05 AC-13*

**What you need:** Logged in, an EXAM_PERIOD event exists for October 14–18, 2026

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create an exam schedule entry on October 22, 2026 (outside the exam period) |
| 2 | Check the entry's conflict status |

**What should happen:**
- The exam entry shows an "exam period mismatch" warning
- The warning is a soft conflict (advisory, does not block publishing)

---

#### TC-FR05-29

> *SRS Reference: FR-05 AC-13*

**What you need:** Logged in, no EXAM_PERIOD events exist in the calendar

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create an exam schedule entry on any date |
| 2 | Check the entry's conflict status |

**What should happen:**
- No "exam period mismatch" warning is shown
- When no exam period is defined, exams can be scheduled on any date without a mismatch warning

---

#### TC-FR05-30

> *SRS Reference: FR-05 AC-15*

**What you need:** Logged in, calendar events exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to SHS department using the department switcher |
| 2 | View the calendar event list |
| 3 | Note all events displayed |
| 4 | Switch to College department |
| 5 | View the calendar event list again |

**What should happen:**
- The same calendar events are visible in both department views
- Calendar events are institution-wide and not filtered by department

---

#### TC-FR05-31

> *SRS Reference: FR-05 AC-15*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Review the form fields available |

**What should happen:**
- There is no department selection field on the event creation form
- Events are always institution-wide by default

---

#### TC-FR05-32

> *SRS Reference: FR-05 AC-14*

**What you need:** Logged in, at least 5 calendar events of mixed types exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | View the calendar list |
| 2 | Click on the "Title" column header to sort |
| 3 | Verify the list reorders by title |
| 4 | Click on the "Date" column header to sort |
| 5 | Verify the list reorders by date |

**What should happen:**
- The list is sortable by clicking column headers (title, date, event type)
- Each click toggles between ascending and descending order

---

#### TC-FR05-33

> *SRS Reference: FR-05 AC-14*

**What you need:** Logged in, multiple calendar events exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Type "Holiday" into the search field |
| 2 | Review the filtered results |

**What should happen:**
- Only events whose title matches the search query "Holiday" are displayed
- Events that do not match are hidden from the list

---

#### TC-FR05-34

> *SRS Reference: FR-05 AC-14*

**What you need:** Logged in, multiple calendar events of different types exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the type filter and choose HOLIDAY |
| 2 | Verify only holiday events are shown |
| 3 | Change the type filter to EXAM_PERIOD |
| 4 | Verify only exam period events are shown |

**What should happen:**
- The filter correctly restricts the displayed events to only the selected type
- Changing the filter immediately updates the list

---

#### TC-FR05-35

> *SRS Reference: FR-05 AC-16*

⚠️ DEFERRED — Calendar grid view (monthly) is not yet implemented. List view is the current implementation. Not yet implemented.

---

#### TC-FR05-36

> *SRS Reference: FR-05 AC-16*

⚠️ DEFERRED — Calendar grid view (weekly/daily) is not yet implemented. List view is the current implementation. Not yet implemented.

---

#### TC-FR05-37

> *SRS Reference: FR-05 AC-4*

**What you need:** Logged in, at least one calendar event exists

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Delete an event from the calendar list |
| 2 | Confirm the deletion |
| 3 | Navigate to Sidebar > Trash |
| 4 | Look for the deleted event in the trash list |

**What should happen:**
- The deleted event appears in the Trash page
- A "Restore" option is available next to the deleted event

---

#### TC-FR05-38

> *SRS Reference: FR-05 AC-4*

**What you need:** Logged in, a deleted calendar event exists in the Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Find the deleted calendar event in the trash list |
| 2 | Click "Restore" on the event |
| 3 | Navigate to Sidebar > Calendar |

**What should happen:**
- The event reappears in the calendar list
- The event is fully functional again after restoration

---

#### TC-FR05-39

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, draft schedule entries exist on November 3, 5, and 7, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking event spanning November 3–7, 2026 (5 days) |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check draft entries on November 3, 5, and 7 |

**What should happen:**
- All three draft entries (Nov 3, Nov 5, Nov 7) show a "blocked by event" conflict
- A multi-day blocking event affects all days within its range

---

#### TC-FR05-40

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a HOLIDAY event (all-day, blocking) on November 3, 2026 |
| 2 | Create an INSTITUTIONAL_EVENT (non-blocking) on November 3, 2026 |
| 3 | View the calendar list for November 3 |

**What should happen:**
- Both events appear in the calendar list for November 3
- Only the HOLIDAY event (blocking) generates conflict warnings on schedule entries
- The non-blocking event coexists without affecting scheduling

---

#### TC-FR05-41

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in, a semester that ends on October 20, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create an event on October 20, 2026 (last day of the semester) |
| 2 | Create an event on October 21, 2026 (first day after the semester) |

**What should happen:**
- Both events are created successfully
- The October 20 event affects schedule entries within that semester
- The October 21 event does not affect entries in the ended semester

---

#### TC-FR05-42

> *SRS Reference: FR-05 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Enter a very long title (500 characters) |
| 3 | Fill in the other required fields |
| 4 | Click Save |

**What should happen:**
- If the title exceeds the maximum allowed length, a validation error is displayed
- If within the allowed length, the event is created successfully

---

#### TC-FR05-43

> *SRS Reference: FR-05 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Enter title: "Día de los Muertos 🎃" (includes accented characters and emoji) |
| 3 | Fill in the other required fields |
| 4 | Click Save |

**What should happen:**
- The event is created successfully
- The title displays correctly with all special characters and emoji preserved

---

#### TC-FR05-44

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in, an academic year and semester exist

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Fill in the event details |
| 3 | Select an academic year from the dropdown |
| 4 | Select a semester from the dropdown |
| 5 | Click Save |

**What should happen:**
- The event is created with the selected academic year and semester linked
- The event details show the linked academic year and semester

---

#### TC-FR05-45

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Fill in the event details |
| 3 | Leave the academic year and semester fields empty (unselected) |
| 4 | Click Save |

**What should happen:**
- The event is created successfully without any academic year or semester link
- The event stands alone as a general calendar entry

---

#### TC-FR05-46

> *SRS Reference: FR-05 AC-12*

**What you need:** Logged in, at least one calendar event exists

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new event and click Save |
| 2 | Open the event and edit it, then click Save |
| 3 | Delete the event and confirm the deletion |

**What should happen:**
- Each action (create, edit, delete) is recorded in the system's history
- The change history shows what was changed and when for each action

---

#### TC-FR05-47

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, a blocking event exists on November 3, 2026, and a draft schedule entry on November 3 shows a "blocked by event" hard conflict

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Attempt to publish the draft schedule entry that has the "blocked by event" conflict |
| 2 | Observe the result |

**What should happen:**
- Publishing is blocked — the hard conflict prevents the entry from being published
- A message indicates the entry cannot be published due to a blocking event conflict

---

#### TC-FR05-48

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, a draft schedule entry has a "blocked by event" hard conflict

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Attempt to publish the draft entry with the conflict |
| 2 | Choose the override option |
| 3 | Enter an override reason (e.g., "Special permission granted") |
| 4 | Confirm the publish |

**What should happen:**
- The entry is published successfully despite the conflict
- The override reason is recorded in the system's history

---

# TC_ROOMS — Room Management

> **Module:** Room Management (FR-06)
> **Prefix:** TC-FR06
> **Last Updated:** 2026-06-12

---

### Managing Rooms

*Creating, editing, and deleting rooms. Room status changes and how they affect schedules.*

---

#### TC-FR06-01

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Fill in Room Code: "RM-101", Name: "Room 101", Building: "Main", Floor: "1", Capacity: 40 |
| 3 | Select Type: LECTURE, Department Availability: SHARED, Status: AVAILABLE |
| 4 | Click Save |

**What should happen:**
- A success message appears
- The new room "RM-101" appears in the rooms list with all the entered details

---

#### TC-FR06-02

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Type to LAB and Room Code to "LAB-201" |
| 3 | Fill in the remaining required fields (name, building, floor, capacity, department availability, status) |
| 4 | Click Save |

**What should happen:**
- The room is created and appears in the list with type shown as LAB

---

#### TC-FR06-03

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Type to GYM and Room Code to "GYM-01" |
| 3 | Fill in the remaining required fields |
| 4 | Click Save |

**What should happen:**
- The room is created and appears in the list with type shown as GYM

---

#### TC-FR06-04

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Type to OFFICE and Room Code to "OFC-01" |
| 3 | Fill in the remaining required fields |
| 4 | Click Save |

**What should happen:**
- The room is created and appears in the list with type shown as OFFICE

---

#### TC-FR06-05

> *SRS Reference: FR-06 AC-3*

**What you need:** A room with code "RM-101" already exists

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on room "RM-101" in the list |
| 2 | Click Edit |
| 3 | Change the Name to "Lecture Hall 101" and Capacity to 50 |
| 4 | Click Save |

**What should happen:**
- The room details update to show the new name "Lecture Hall 101" and capacity 50
- The changes are reflected in the rooms list

---

#### TC-FR06-06

> *SRS Reference: FR-06 AC-4*

**What you need:** A room exists that has no schedule entries assigned to it

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The room disappears from the rooms list
- The room is moved to Trash

---

#### TC-FR06-07

> *SRS Reference: FR-06 AC-8*

**What you need:** A room exists and has schedule entries for the current semester

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room's code in the list |
| 2 | View the detail page that opens |

**What should happen:**
- The room's full information is displayed (code, name, building, floor, capacity, type, status, department availability)
- Schedule entries for the current semester are shown

---

#### TC-FR06-08

> *SRS Reference: FR-06 AC-5*

**What you need:** A room with code "RM-101" already exists

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Enter Room Code: "RM-101" |
| 3 | Fill in the remaining fields |
| 4 | Click Save |

**What should happen:**
- The save fails
- A validation error message appears saying the room code must be unique

---

#### TC-FR06-09

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Capacity to 0 |
| 3 | Click Save |

**What should happen:**
- The save fails
- A validation error message appears saying capacity must be at least 1

---

#### TC-FR06-10

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Capacity to -5 |
| 3 | Click Save |

**What should happen:**
- The save fails
- A validation error message appears saying capacity must be at least 1

---

#### TC-FR06-11

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Capacity to 1 |
| 3 | Fill in all other required fields with valid values |
| 4 | Click Save |

**What should happen:**
- The room is created successfully with capacity 1
- The room appears in the rooms list

---

#### TC-FR06-12

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Capacity to 10000 |
| 3 | Fill in all other required fields with valid values |
| 4 | Click Save |

**What should happen:**
- The room is created successfully with capacity 10000
- The room appears in the rooms list

---

#### TC-FR06-13

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Set Capacity to 10001 |
| 3 | Click Save |

**What should happen:**
- The save fails
- A validation error message appears saying capacity exceeds the maximum allowed value

---

#### TC-FR06-14

> *SRS Reference: FR-06 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Leave the Room Code field empty |
| 3 | Click Save |

**What should happen:**
- The save fails
- A validation error message appears saying room code is required

---

#### TC-FR06-15

> *SRS Reference: FR-06 AC-7, FR-01*

**What you need:** A room exists with Department Availability set to SHS_ONLY

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department filter to SHS |
| 2 | Check that the SHS_ONLY room is visible in the list |
| 3 | Switch the department filter to College |
| 4 | Check whether the SHS_ONLY room appears in the list |

**What should happen:**
- When filtered to SHS, the room appears in the list
- When filtered to College, the room does not appear in the list

---

#### TC-FR06-16

> *SRS Reference: FR-06 AC-7, FR-01*

**What you need:** A room exists with Department Availability set to COLLEGE_ONLY

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department filter to College |
| 2 | Check that the COLLEGE_ONLY room is visible in the list |
| 3 | Switch the department filter to SHS |
| 4 | Check whether the COLLEGE_ONLY room appears in the list |

**What should happen:**
- When filtered to College, the room appears in the list
- When filtered to SHS, the room does not appear in the list

---

#### TC-FR06-17

> *SRS Reference: FR-06 AC-7, FR-01*

**What you need:** A room exists with Department Availability set to SHARED

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department filter to SHS and check if the SHARED room is visible |
| 2 | Switch the department filter to College and check if the SHARED room is visible |

**What should happen:**
- The room appears in the list when filtered to SHS
- The room appears in the list when filtered to College

---

#### TC-FR06-18

> *SRS Reference: FR-06 AC-7, FR-10*

**What you need:** A room with Department Availability set to SHS_ONLY exists. An SHS schedule entry in Draft status exists.

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the SHS Draft schedule entry |
| 2 | Assign the SHS_ONLY room to the entry |
| 3 | Save the entry |
| 4 | Check the entry for any conflict warnings |

**What should happen:**
- No department mismatch warning appears on the entry
- The room is accepted without conflict

---

#### TC-FR06-19

> *SRS Reference: FR-06 AC-7, FR-10*

**What you need:** A room with Department Availability set to SHS_ONLY exists

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department |
| 2 | Create a Draft schedule entry and assign the SHS_ONLY room |
| 3 | Save the entry |
| 4 | Check the entry for conflict warnings |

**What should happen:**
- A department mismatch conflict warning appears on the entry
- The conflict is marked as a hard conflict (blocking)

---

#### TC-FR06-20

> *SRS Reference: FR-06 AC-7, FR-01 AC-7*

**What you need:** A room with Department Availability set to SHARED. An SHS schedule entry already uses this room on Monday 08:00–09:00.

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department |
| 2 | Create a Draft schedule entry using the same SHARED room on Monday 08:00–09:00 |
| 3 | Save the entry |
| 4 | Check the entry for conflict warnings |

**What should happen:**
- A room time conflict warning appears on the entry
- The conflict is marked as a hard conflict (blocking) because the room is already booked at that time by another department

---

#### TC-FR06-21

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status AVAILABLE that has Draft schedule entries assigned to it

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change the Status to MAINTENANCE |
| 4 | A confirmation dialog appears showing the number of affected schedule entries — confirm it |
| 5 | Click Save |

**What should happen:**
- The room status changes to MAINTENANCE
- The affected Draft schedule entries now show a "room unavailable" conflict warning

---

#### TC-FR06-22

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status AVAILABLE that has Draft schedule entries assigned to it

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change the Status to INACTIVE |
| 4 | A confirmation dialog appears showing the number of affected schedule entries — confirm it |
| 5 | Click Save |

**What should happen:**
- The room status changes to INACTIVE
- The affected Draft schedule entries now show a "room unavailable" conflict warning

---

#### TC-FR06-23

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status MAINTENANCE that has Draft schedule entries showing a "room unavailable" conflict

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change the Status back to AVAILABLE |
| 4 | Click Save |

**What should happen:**
- The room status changes to AVAILABLE
- The "room unavailable" conflict warnings are removed from the Draft schedule entries

---

#### TC-FR06-24

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status AVAILABLE that has 5 Draft schedule entries assigned to it

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change the Status to MAINTENANCE |
| 4 | Observe the confirmation dialog that appears |

**What should happen:**
- A confirmation dialog appears showing a count of affected entries (e.g., "This will affect 5 schedule entries")

---

#### TC-FR06-25

> *SRS Reference: FR-06 AC-10*

**What you need:** A room that has Draft schedule entries in the current semester

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Observe the result |

**What should happen:**
- The deletion is blocked
- An error message appears saying the room has active schedule entries and suggesting to set it to INACTIVE instead

---

#### TC-FR06-26

> *SRS Reference: FR-06 AC-10*

**What you need:** A room that has Published schedule entries

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Observe the result |

**What should happen:**
- The deletion is blocked
- An error message appears indicating the room cannot be deleted because it has schedule entries

---

#### TC-FR06-27

> *SRS Reference: FR-06 AC-10*

**What you need:** A room that has zero schedule entries

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The room is deleted successfully and disappears from the list
- The room is moved to Trash

---

#### TC-FR06-28

> *SRS Reference: FR-06 AC-8*

**What you need:** A room that has published schedule entries for the current semester

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room's code in the list to open its detail page |
| 2 | Look at the schedule section |

**What should happen:**
- A weekly schedule grid is displayed
- Published schedule entries for the current semester appear in the grid

---

#### TC-FR06-29

> *SRS Reference: FR-06 AC-8, FR-01*

**What you need:** A room with Department Availability set to SHARED that has schedule entries from both SHS and College departments

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the SHARED room's code to open its detail page |
| 2 | Look at the schedule section |

**What should happen:**
- Both SHS and College schedule entries are visible in the schedule view
- Each entry shows a department badge indicating which department it belongs to

---

#### TC-FR06-30

> *SRS Reference: FR-06 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Enter Room Code: "RM/101-A (LAB)" (includes special characters) |
| 3 | Fill in the remaining fields |
| 4 | Click Save |

**What should happen:**
- Either the room is created with the special-character code, or a validation error appears if special characters are restricted — verify which behavior matches the business rule

---

#### TC-FR06-31

> *SRS Reference: FR-06 AC-7, FR-10*

**What you need:** A room with Department Availability set to SHARED that has SHS schedule entries assigned to it

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the SHARED room to open it |
| 2 | Click Edit |
| 3 | Change Department Availability from SHARED to COLLEGE_ONLY |
| 4 | Click Save |
| 5 | Check the previously-assigned SHS schedule entries for conflict warnings |

**What should happen:**
- The department availability changes to COLLEGE_ONLY
- The SHS schedule entries now show a department mismatch conflict warning (hard conflict)

---

#### TC-FR06-32

> *SRS Reference: FR-06 AC-6, FR-10*

**What you need:** A room with capacity 40. A section with 35 students has a Draft schedule entry using this room.

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change Capacity from 40 to 30 |
| 4 | Click Save |
| 5 | Check the Draft schedule entry for conflict warnings |

**What should happen:**
- The room capacity updates to 30
- The Draft schedule entry now shows a "capacity exceeded" conflict warning because the section has 35 students but the room only holds 30

---

#### TC-FR06-33

> *SRS Reference: FR-06*

**What you need:** No rooms exist in the system

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Rooms page |
| 2 | Observe the page content |

**What should happen:**
- An empty state message is displayed (e.g., "No rooms found")

---

#### TC-FR06-34

> *SRS Reference: FR-06, FR-12*

**What you need:** A room exists in the system

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new room and then check the audit log |
| 2 | Edit the room's details and then check the audit log |
| 3 | Delete the room and then check the audit log |

**What should happen:**
- Each action (create, edit, delete) has a corresponding entry in the audit log
- Each audit log entry includes before and after snapshots of the room data

---

# TC_SECTIONS — Section Management

> **Module:** Section Management (FR-07)
> **SRS Reference:** FR-07
> **Prefix:** TC-FR07
> **Last Updated:** 2026-06-12

---

### Managing Sections

*Creating and managing class sections for SHS and College departments.*

---

#### TC-FR07-01

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. SHS department active. An academic year and semester already exist.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Click "Add Section" |
| 3 | Fill in: Code: "SHS-11-STEM-A", Strand: STEM, Grade Level: Grade 11, Student Count: 40 |
| 4 | Select the academic year and semester |
| 5 | Click Save |

**What should happen:**
- The new section appears in the sections list
- The section shows strand/track as "STEM" and grade level as "Grade 11"
- Student count displays as 40

---

#### TC-FR07-02

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. College department active. An academic year and semester already exist.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Click "Add Section" |
| 3 | Fill in: Code: "BSIT-3A", Program: BSIT, Subject: "Data Structures", Year Level: 3rd Year, Student Count: 35 |
| 4 | Select the academic year and semester |
| 5 | Click Save |

**What should happen:**
- The new section appears in the sections list
- The section shows program as "BSIT" and subject as "Data Structures"
- Year level displays as "3rd Year" and student count as 35

---

#### TC-FR07-03

> *SRS Reference: FR-07 AC-3*

**What you need:** Logged in. At least one section already exists.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on an existing section to open its details |
| 2 | Click Edit |
| 3 | Change the student count from 40 to 45 |
| 4 | Click Save |

**What should happen:**
- The section details update to show the new student count of 45
- A success message confirms the section was updated

---

#### TC-FR07-04

> *SRS Reference: FR-07 AC-4*

**What you need:** Logged in. A section exists that has no schedule entries assigned to it.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on a section that has no schedule entries |
| 2 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The section disappears from the sections list
- A success message confirms the section was deleted

---

#### TC-FR07-05

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. College department active. Subject Bank has entries for BSIT, 3rd Year (at least 5 subjects).

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Batch Create" |
| 2 | Select Program: BSIT, Year Level: 3rd Year |
| 3 | Confirm the batch creation |

**What should happen:**
- Multiple sections are created automatically, one for each subject in the Subject Bank matching BSIT 3rd Year
- All new sections appear in the sections list
- Each section is pre-filled with the corresponding subject from the Subject Bank

---

#### TC-FR07-06

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. SHS department active.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Click "Add Section" to open the section form |

**What should happen:**
- The form shows a "Strand/Track" field
- The form does not show "Program" or "Subject" fields

---

#### TC-FR07-07

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. College department active.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Click "Add Section" to open the section form |

**What should happen:**
- The form shows "Program" and "Subject" fields
- The form does not show a "Strand/Track" field

---

#### TC-FR07-08

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. SHS department active.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Click "Add Section" |
| 3 | Fill in all fields except leave Strand/Track empty |
| 4 | Click Save |

**What should happen:**
- A validation error appears indicating that Strand/Track is required for SHS sections
- The section is not created

---

#### TC-FR07-09

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. College department active.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Click "Add Section" |
| 3 | Fill in all fields except leave Subject empty |
| 4 | Click Save |

**What should happen:**
- A validation error appears indicating that Subject is required for College sections
- The section is not created

---

#### TC-FR07-10

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. College department active. A section with code "BSIT-3A" already exists in the same academic year and semester.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter Code: "BSIT-3A" and fill in remaining fields |
| 3 | Select the same academic year and semester as the existing section |
| 4 | Click Save |

**What should happen:**
- A validation error appears indicating that the section code must be unique within the same department, academic year, and semester
- The section is not created

---

#### TC-FR07-11

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. College department active. A section with code "BSIT-3A" exists in academic year 2025–2026.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter Code: "BSIT-3A" and fill in remaining fields |
| 3 | Select academic year 2026–2027 |
| 4 | Click Save |

**What should happen:**
- The section is created successfully
- No duplicate error appears because the same code is allowed in a different academic year

---

#### TC-FR07-12

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. A section with code "SEC-A" already exists in the SHS department.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Click "Add Section" |
| 3 | Enter Code: "SEC-A" and fill in remaining fields |
| 4 | Click Save |

**What should happen:**
- The section is created successfully in the College department
- No duplicate error appears because the same code is allowed across different departments

---

#### TC-FR07-13

> *SRS Reference: FR-07 AC-6*

**What you need:** Logged in.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter Student Count: -1 and fill in remaining fields |
| 3 | Click Save |

**What should happen:**
- A validation error appears indicating that student count cannot be negative
- The section is not created

---

#### TC-FR07-14

> *SRS Reference: FR-07 AC-6*

**What you need:** Logged in.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter Student Count: 0 and fill in all other required fields |
| 3 | Click Save |

**What should happen:**
- The section is created successfully with a student count of 0
- No validation error appears

---

#### TC-FR07-15

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Leave the section code field empty and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- A validation error appears indicating that section code is required
- The section is not created

---

#### TC-FR07-16

> *SRS Reference: FR-07 AC-7*

**What you need:** Logged in. A section exists that has draft schedule entries assigned to it.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the section that has draft schedule entries |

**What should happen:**
- An error message appears indicating that the section cannot be deleted because it has schedule entries
- The section remains in the list

---

#### TC-FR07-17

> *SRS Reference: FR-07 AC-7*

**What you need:** Logged in. A section exists that has published schedule entries assigned to it.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the section that has published schedule entries |

**What should happen:**
- An error message appears indicating that the section cannot be deleted because it has schedule entries
- The section remains in the list

---

#### TC-FR07-18

> *SRS Reference: FR-07 AC-7*

**What you need:** Logged in. A section exists that has no schedule entries assigned to it.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the section with no schedule entries |
| 2 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The section is removed from the list
- A success message confirms the section was deleted

---

#### TC-FR07-19

> *SRS Reference: FR-07 AC-8*

**What you need:** Logged in. A section exists with 35 students. The section has draft schedule entries assigned to a room with a capacity of 40.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the section to open its details |
| 2 | Click Edit |
| 3 | Change student count from 35 to 45 |
| 4 | Click Save |
| 5 | Check the section's draft schedule entries |

**What should happen:**
- The section updates to show 45 students
- The draft schedule entries now show a capacity warning because 45 students exceeds the room's capacity of 40

---

#### TC-FR07-20

> *SRS Reference: FR-07 AC-8*

**What you need:** Logged in. A section exists with 45 students (above the assigned room's capacity of 40). The section has draft schedule entries showing a capacity warning.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the section to open its details |
| 2 | Click Edit |
| 3 | Change student count from 45 to 35 |
| 4 | Click Save |
| 5 | Check the section's draft schedule entries |

**What should happen:**
- The section updates to show 35 students
- The capacity warning on the draft schedule entries is cleared because 35 students fits within the room's capacity of 40

---

#### TC-FR07-21

> *SRS Reference: FR-07 AC-9*

**What you need:** Logged in. SHS department active. An SHS section exists with schedule entries across multiple subjects throughout the week.

**Where:** Sidebar > Sections > (click on an SHS section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Click on an SHS section that has schedule entries |
| 3 | View the section's schedule |

**What should happen:**
- A full weekly timetable is displayed showing all subject periods for the section
- Each day of the week shows the scheduled time slots and subjects

---

#### TC-FR07-22

> *SRS Reference: FR-07 AC-9*

**What you need:** Logged in. College department active. A College section exists for the subject "Data Structures" with schedule entries.

**Where:** Sidebar > Sections > (click on a College section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Click on the College section for "Data Structures" |
| 3 | View the section's schedule |

**What should happen:**
- Only the "Data Structures" schedule entries are shown
- The schedule displays the specific days and time slots for this subject

---

#### TC-FR07-23

> *SRS Reference: FR-07 AC-10*

**What you need:** Logged in. An active section exists with draft schedule entries.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the section to open its details |
| 2 | Click Edit |
| 3 | Change the section's status to "Inactive" |
| 4 | Click Save |
| 5 | Check the section's draft schedule entries |

**What should happen:**
- The section is now marked as "Inactive"
- The draft schedule entries for this section now show a conflict warning indicating the section is inactive

---

#### TC-FR07-24

> *SRS Reference: FR-07 AC-10*

**What you need:** Logged in. An inactive section exists with draft schedule entries showing an "inactive section" conflict warning.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the inactive section to open its details |
| 2 | Click Edit |
| 3 | Change the section's status back to "Active" |
| 4 | Click Save |
| 5 | Check the section's draft schedule entries |

**What should happen:**
- The section is now marked as "Active"
- The "inactive section" conflict warning is removed from the draft schedule entries

---

#### TC-FR07-25

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. SHS department active. At least one personnel record exists.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Click "Add Section" |
| 3 | Fill in all required fields |
| 4 | Select an existing personnel member as the adviser |
| 5 | Click Save |

**What should happen:**
- The section is created successfully
- The section details show the selected adviser name

---

#### TC-FR07-26

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Fill in all required fields |
| 3 | Leave the adviser/instructor field empty |
| 4 | Click Save |

**What should happen:**
- The section is created successfully
- The adviser/instructor field shows as empty or "None" in the section details

---

#### TC-FR07-27

> *SRS Reference: FR-07*

**What you need:** Logged in. No sections exist for the currently selected academic year and semester.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Sections page |

**What should happen:**
- An empty state message is displayed (e.g., "No sections found" or similar)
- The page does not show an error

---

#### TC-FR07-28

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter a section name with special characters: "Sección A — Matemáticas" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The section is created successfully
- The section name displays correctly with all special characters (accented letters, em dash) intact

---

#### TC-FR07-29

> *SRS Reference: FR-07 AC-12*

**What you need:** Logged in. At least one section exists.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new section and check the activity/audit area |
| 2 | Edit the section and check the activity/audit area again |
| 3 | Delete the section and check the activity/audit area again |

**What should happen:**
- After creating: an audit entry appears recording the creation
- After editing: an audit entry appears recording the update
- After deleting: an audit entry appears recording the deletion

---

#### TC-FR07-30

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. Multiple academic years and semesters exist. A section has been created in AY 2026–2027, 1st Semester.

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Verify the section appears in the list while AY 2026–2027, 1st Semester is selected |
| 2 | Switch to 2nd Semester using the semester selector |
| 3 | Check the sections list |

**What should happen:**
- The section appears in the list when AY 2026–2027, 1st Semester is selected
- The section does not appear in the list when 2nd Semester is selected
- Sections are scoped to their assigned academic year and semester

---

# TC_PERSONNEL — Personnel Management

> **Module:** Personnel Management (FR-08)
> **SRS Reference:** FR-08.1 through FR-08.11
> **Prefix:** TC-FR08
> **Last Updated:** 2026-06-12

---

### Managing Personnel
*Adding teachers and staff, setting workload limits, and managing cross-department sharing.*

---

#### TC-FR08-01

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Fill in the form: Employee ID: "EMP-001", First Name: "Juan", Last Name: "Dela Cruz", Email: "juan@test.com", Department: SHS, Type: Faculty, Max Weekly Hours: 40, Specializations: "Math", "Physics" |
| 3 | Click Save |

**What should happen:**
- A new personnel record appears in the personnel list
- The record shows the name "Juan Dela Cruz", type "Faculty", department "SHS", and max hours "40"

---

#### TC-FR08-02

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Fill in the form with Type set to "Staff" and complete all other required fields |
| 3 | Click Save |

**What should happen:**
- A new personnel record appears in the personnel list with type shown as "Staff"

---

#### TC-FR08-03

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Fill in the form with Type set to "Admin" and complete all other required fields |
| 3 | Click Save |

**What should happen:**
- A new personnel record appears in the personnel list with type shown as "Admin"

---

#### TC-FR08-04

> *SRS Reference: FR-08 AC-4*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Check the "Shared" checkbox |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- A new personnel record appears in the personnel list marked as shared
- This person is visible and can be scheduled in both the SHS and College departments

---

#### TC-FR08-05

> *SRS Reference: FR-08 AC-3*

**What you need:** At least one personnel record already exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on an existing personnel record to open it |
| 2 | Change the Max Weekly Hours from 40 to 30 |
| 3 | Click Save |

**What should happen:**
- The personnel record updates to show Max Weekly Hours as 30
- The change is saved successfully

---

#### TC-FR08-06

> *SRS Reference: FR-08 AC-4*

**What you need:** A personnel record exists that has no schedule entries assigned to it

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The personnel record is removed from the active list
- The deleted record appears in the Trash

---

#### TC-FR08-07

> *SRS Reference: FR-08 AC-8*

**What you need:** A personnel record exists that has schedule entries assigned to it

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel's employee ID to open their detail page |
| 2 | Review the information displayed |

**What should happen:**
- The detail page shows the personnel's basic information (name, type, department, etc.)
- The current weekly workload is displayed
- All schedule entries from all departments are listed

---

#### TC-FR08-08

> *SRS Reference: FR-08 AC-5*

**What you need:** A personnel record with Employee ID "EMP-001" already exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter "EMP-001" as the Employee ID and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- An error message appears saying the Employee ID must be unique
- The record is not saved

---

#### TC-FR08-09

> *SRS Reference: FR-08 AC-5*

**What you need:** A personnel record with email "juan@test.com" already exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter "juan@test.com" as the Email and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- An error message appears saying the email must be unique
- The record is not saved

---

#### TC-FR08-10

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter 0 for Max Weekly Hours and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- An error message appears saying Max Weekly Hours must be between 1 and 80
- The record is not saved

---

#### TC-FR08-11

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter 81 for Max Weekly Hours and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- An error message appears saying Max Weekly Hours must be between 1 and 80
- The record is not saved

---

#### TC-FR08-12

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter 1 for Max Weekly Hours and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- The personnel record is created successfully with Max Weekly Hours set to 1

---

#### TC-FR08-13

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter 80 for Max Weekly Hours and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- The personnel record is created successfully with Max Weekly Hours set to 80

---

#### TC-FR08-14

> *SRS Reference: FR-08 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Leave the Employee ID field empty and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- An error message appears saying Employee ID is required
- The record is not saved

---

#### TC-FR08-15

> *SRS Reference: FR-08 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Leave the Email field empty and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- An error message appears saying Email is required
- The record is not saved

---

#### TC-FR08-16

> *SRS Reference: FR-08 AC-4, FR-01*

**What you need:** A personnel record exists with "Shared" enabled

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department view to SHS and confirm the shared personnel appears in the list |
| 2 | Switch the department view to College and confirm the same personnel appears in the list |

**What should happen:**
- The shared personnel record is visible in both the SHS and College personnel lists

---

#### TC-FR08-17

> *SRS Reference: FR-08 AC-4, FR-01*

**What you need:** A personnel record exists in the SHS department with "Shared" not enabled

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department view to SHS and confirm the personnel appears in the list |
| 2 | Switch the department view to College |

**What should happen:**
- The personnel appears in the SHS list
- The personnel does not appear in the College list

---

#### TC-FR08-18

> *SRS Reference: FR-08 AC-4, FR-10*

**What you need:** A non-shared SHS personnel record exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department view |
| 2 | Create a new draft schedule entry and assign the non-shared SHS personnel to it |
| 3 | Check the conflict indicators on the entry |

**What should happen:**
- A warning-level conflict appears indicating the personnel belongs to a different department

---

#### TC-FR08-19

> *SRS Reference: FR-08 AC-4, FR-01*

**What you need:** A shared personnel is already scheduled in SHS on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department view |
| 2 | Create a new draft schedule entry for the same shared personnel on Monday from 8:00 AM to 9:00 AM |
| 3 | Check the conflict indicators on the entry |

**What should happen:**
- A conflict appears indicating the personnel has an overlapping time slot across departments

---

#### TC-FR08-20

> *SRS Reference: FR-08 AC-7, FR-10*

**What you need:** A shared personnel exists with 20 hours scheduled in SHS and 25 hours scheduled in College, and their Max Weekly Hours is set to 40

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the shared personnel to open their detail page |
| 2 | Check the weekly workload display |

**What should happen:**
- The workload display shows 45 out of 40 hours (combining both departments)
- An overload conflict indicator is shown because the total exceeds the maximum

---

#### TC-FR08-21

> *SRS Reference: FR-08 AC-4*

**What you need:** A non-shared SHS personnel record exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Enable the "Shared" checkbox |
| 3 | Click Save |

**What should happen:**
- The personnel record is now marked as shared
- The personnel becomes visible in both department views
- Any existing conflicts are re-evaluated

---

#### TC-FR08-22

> *SRS Reference: FR-08 AC-7, FR-10*

**What you need:** A personnel record exists with Max Weekly Hours set to 40 and a current workload of 35 hours

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Change Max Weekly Hours from 40 to 30 |
| 3 | A confirmation dialog appears showing how many schedule entries will be affected — confirm the change |
| 4 | Click Save |

**What should happen:**
- The Max Weekly Hours updates to 30
- An overload conflict appears because the current workload (35 hours) exceeds the new maximum (30 hours)
- A workload warning indicator also appears

---

#### TC-FR08-23

> *SRS Reference: FR-08 AC-7, FR-10*

**What you need:** A personnel record exists with Max Weekly Hours set to 30 and a current workload of 35 hours (already showing an overload conflict)

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Change Max Weekly Hours from 30 to 40 |
| 3 | Click Save |

**What should happen:**
- The Max Weekly Hours updates to 40
- The overload conflict is cleared because the workload (35 hours) no longer exceeds the maximum (40 hours)

---

#### TC-FR08-24

> *SRS Reference: FR-08 AC-7*

**What you need:** A personnel record exists with schedule entries in both departments

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Change the Max Weekly Hours value |
| 3 | Observe the confirmation dialog that appears |

**What should happen:**
- A confirmation dialog appears showing the number of schedule entries that will be affected across all departments
- The dialog asks for confirmation before applying the change

---

#### TC-FR08-25

> *SRS Reference: FR-08 AC-9*

**What you need:** A personnel record exists that has draft schedule entries assigned to it

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |

**What should happen:**
- The deletion is blocked
- An error message appears explaining the personnel cannot be deleted because they have schedule entries

---

#### TC-FR08-26

> *SRS Reference: FR-08 AC-9*

**What you need:** A personnel record exists that has published schedule entries assigned to it

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |

**What should happen:**
- The deletion is blocked
- An error message appears explaining the personnel cannot be deleted because they have schedule entries

---

#### TC-FR08-27

> *SRS Reference: FR-08 AC-9*

**What you need:** A personnel record exists that has no schedule entries assigned to it

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The personnel record is removed from the active list
- The deleted record appears in the Trash

---

#### TC-FR08-28

> *SRS Reference: FR-08 AC-10, FR-10*

**What you need:** An active personnel record exists that has draft schedule entries assigned to it

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Change the employment status to "Inactive" |
| 3 | Click Save |

**What should happen:**
- The personnel's status changes to "Inactive"
- Conflict indicators appear on all of that personnel's draft schedule entries, flagging them as assigned to an inactive person

---

#### TC-FR08-29

> *SRS Reference: FR-08 AC-10*

**What you need:** An inactive personnel record exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Change the employment status to "Active" |
| 3 | Click Save |

**What should happen:**
- The personnel's status changes to "Active"
- Any conflict indicators related to inactive status are removed from that personnel's schedule entries

---

#### TC-FR08-30

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | In the Specializations field, add three entries: "Math", "Physics", "Statistics" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The personnel record is created successfully
- The detail view shows all three specializations: Math, Physics, and Statistics

---

#### TC-FR08-31

> *SRS Reference: FR-08 AC-1, FR-10*

**What you need:** A personnel record exists with specialization "Math"

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new draft schedule entry for a subject called "English" and assign it to the Math-specialized personnel |
| 2 | Check the conflict indicators on the entry |

**What should happen:**
- A warning-level conflict appears indicating the personnel's specializations do not match the assigned subject

---

#### TC-FR08-32

> *SRS Reference: FR-08 AC-1, FR-10*

**What you need:** A personnel record exists with specialization "math" (lowercase)

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new draft schedule entry for a subject called "Math" (uppercase M) and assign it to the personnel |
| 2 | Check the conflict indicators on the entry |

**What should happen:**
- No specialization mismatch conflict appears — the matching is not case-sensitive

---

#### TC-FR08-33

> *SRS Reference: FR-08 AC-8*

**What you need:** A shared personnel record exists with schedule entries in both the SHS and College departments

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open the detail page |
| 2 | Look at the schedule entries section |

**What should happen:**
- Schedule entries from both SHS and College are listed, each showing a label indicating which department it belongs to
- The entries are not filtered by the current department view — all entries are always shown

---

#### TC-FR08-34

> *SRS Reference: FR-08 AC-8*

**What you need:** A personnel record exists with 5 schedule entries totaling 20 hours, and their Max Weekly Hours is 40

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open the detail page |
| 2 | Check the "Current Weekly Load" section |

**What should happen:**
- The weekly load displays as "20 / 40 hours"
- The load is calculated from all draft and published entries in the current semester

---

#### TC-FR08-35

> *SRS Reference: FR-08*

**What you need:** No personnel records exist in the system

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Personnel page |

**What should happen:**
- An empty state message is displayed (e.g., "No personnel found" or similar placeholder)

---

#### TC-FR08-36

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter "José" as the First Name and "Ñañez" as the Last Name |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The personnel record is created successfully
- The name displays correctly with accented characters: "José Ñañez"

---

#### TC-FR08-37

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | In the Specializations field, add 50 separate entries |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- If 50 is within the allowed limit: the record is saved with all 50 specializations
- If 50 exceeds the allowed limit: an error message appears indicating the maximum number of specializations has been exceeded

---

#### TC-FR08-38

> *SRS Reference: FR-08, FR-12*

**What you need:** At least one personnel record exists

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new personnel record and check for a corresponding entry in the activity or audit log |
| 2 | Edit the personnel record (e.g., change the name) and check the audit log again |
| 3 | Delete the personnel record (if it has no schedule entries) and check the audit log again |

**What should happen:**
- Each action (create, edit, delete) has a corresponding entry in the audit log
- Each audit log entry records what was changed, including the previous and new values

---

# TC_SCHEDULE — Schedule Entry Management

> **Module:** Schedule Entry Management (FR-09)
> **SRS Reference:** FR-09.1 through FR-09.36
> **Prefix:** TC-FR09
> **Last Updated:** 2026-06-12

---

### Creating Schedule Entries
*Adding classes, meetings, office hours, and other activities to the schedule.*

---

#### TC-FR09-01

> *SRS Reference: FR-09 AC-1*

**What you need:** An active academic year and semester. At least one room, one section, and one personnel record exist.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" and Modality to "F2F" |
| 3 | Select room "RM-101", personnel "EMP-001", and section "SHS-11-STEM-A" |
| 4 | Type "Math" in the Subject field |
| 5 | Set Day to Monday, Start Time to 08:00, End Time to 09:00 |
| 6 | Set Recurrence to "WEEKLY" |
| 7 | Click Save |

**What should happen:**
- The entry appears in the schedule list with a "DRAFT" status badge
- All the details you entered (room, personnel, section, subject, time, day) are shown on the entry

---

#### TC-FR09-02

> *SRS Reference: FR-09 AC-2*

**What you need:** An active academic year and semester. At least one section and one personnel record exist.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" and Modality to "ONLINE" |
| 3 | Observe the Room field |
| 4 | Fill in personnel, section, and subject |
| 5 | Click Save |

**What should happen:**
- The Room field is hidden or disabled when "ONLINE" is selected
- The entry is created without a room and appears in the schedule list as "DRAFT"

---

#### TC-FR09-03

> *SRS Reference: FR-09 AC-4*

**What you need:** An active academic year. No active semester is required.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "MEETING" |
| 3 | Select personnel and optionally select a room |
| 4 | Set Recurrence to "ONCE" |
| 5 | Click Save |

**What should happen:**
- The entry is created successfully even without an active semester
- The entry appears in the schedule list as "DRAFT"

---

#### TC-FR09-04

> *SRS Reference: FR-09 AC-1*

**What you need:** An active academic year and semester. At least one personnel record exists.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "OFFICE" |
| 3 | Select personnel and optionally select a room |
| 4 | Click Save |

**What should happen:**
- The Section and Subject fields are hidden for "OFFICE" activity
- The entry is created and appears in the schedule list as "DRAFT"

---

#### TC-FR09-05

> *SRS Reference: FR-09 AC-5*

**What you need:** An active academic year and semester. At least three sections exist.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" |
| 3 | In the Section field, select three different sections from the dropdown |
| 4 | Fill in room, personnel, and subject |
| 5 | Click Save |

**What should happen:**
- All three selected sections appear as tags or chips in the Section field
- The entry is created and shows all three sections in the entry details

---

#### TC-FR09-06

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" |
| 3 | Leave the Subject field empty |
| 4 | Fill in all other required fields (room, personnel, section) |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that Subject is required for CLASS entries
- The entry is not saved

---

#### TC-FR09-07

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" |
| 3 | Do not select any sections |
| 4 | Fill in all other required fields (room, personnel, subject) |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that at least one section is required for CLASS entries
- The entry is not saved

---

#### TC-FR09-08

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester. Activity set to CLASS, Modality set to F2F.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" and Modality to "F2F" |
| 3 | Leave the Room field empty |
| 4 | Fill in personnel, section, and subject |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that Room is required for face-to-face entries
- The entry is not saved

---

#### TC-FR09-09

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "EXAM" |
| 3 | Leave the Exam Type field empty |
| 4 | Fill in all other required fields (room, personnel, section, subject, exam title) |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that Exam Type is required for EXAM entries
- The entry is not saved

---

#### TC-FR09-10

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "EXAM" |
| 3 | Leave the Exam Title field empty |
| 4 | Fill in all other required fields (room, personnel, section, subject, exam type) |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that Exam Title is required for EXAM entries
- The entry is not saved

---

#### TC-FR09-11

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "EXAM" and Modality to "ONLINE" |
| 3 | Leave the Room field empty |
| 4 | Fill in personnel, section, subject, exam type, and exam title |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that Room is always required for EXAM entries, regardless of modality
- The entry is not saved

---

#### TC-FR09-12

> *SRS Reference: FR-09 AC-7*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "EXAM" |
| 3 | Look at the Recurrence field |

**What should happen:**
- The Recurrence field is locked to "ONCE" and cannot be changed
- Other recurrence options are disabled or hidden

---

#### TC-FR09-13

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "MEETING" |
| 3 | Look at the form fields |

**What should happen:**
- The Subject field is hidden and not shown on the form

---

#### TC-FR09-14

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "MEETING" |
| 3 | Select personnel but do not select any section |
| 4 | Click Save |

**What should happen:**
- The entry is created successfully without a section
- Section is optional for MEETING entries

---

#### TC-FR09-15

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "OFFICE" |
| 3 | Look at the form fields |

**What should happen:**
- Both the Subject and Section fields are hidden and not shown on the form

---

#### TC-FR09-16

> *SRS Reference: FR-09 AC-8*

**What you need:** Time slot configuration starts at 07:00 with a 60-minute period length.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is saved successfully — 08:00 aligns with the time slot boundaries (07:00 + 1 period)

---

#### TC-FR09-17

> *SRS Reference: FR-09 AC-9*

**What you need:** SHS department selected with a 60-minute period length.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Observe the End Time field |

**What should happen:**
- The End Time is automatically set to 09:00 (start time plus one 60-minute period)

---

#### TC-FR09-18

> *SRS Reference: FR-09 AC-10*

**What you need:** Period length is 60 minutes.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Change End Time to 10:00 (covering 2 periods) |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The entry is saved successfully — 2 hours is an exact multiple of the 60-minute period length

---

#### TC-FR09-19

> *SRS Reference: FR-09 AC-10*

**What you need:** Period length is 60 minutes.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Change End Time to 09:30 |
| 4 | Click Save |

**What should happen:**
- A validation error appears indicating that end time must be a whole multiple of the period length
- The entry is not saved

---

#### TC-FR09-20

> *SRS Reference: FR-09 AC-11*

**What you need:** Logged in to the app.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 23:00 |
| 3 | Set End Time to 01:00 (next day) |
| 4 | Click Save |

**What should happen:**
- A validation error appears indicating that entries cannot span midnight
- The entry is not saved

---

#### TC-FR09-21

> *SRS Reference: FR-09 AC-12*

**What you need:** Time window is configured as 07:00–21:00.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 06:00 and End Time to 07:00 (before the configured window) |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- A warning message appears noting that the time is outside the configured time window
- The entry is still saved despite the warning (non-blocking)

---

#### TC-FR09-22

> *SRS Reference: FR-09 AC-16*

**What you need:** An active academic year and semester. An SHS section and a College section exist.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" |
| 3 | Select one SHS section and one College section |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that all sections must belong to the same department
- The entry is not saved

---

#### TC-FR09-23

> *SRS Reference: FR-09 AC-16*

**What you need:** Sections from different academic years or semesters exist.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" |
| 3 | Select sections that belong to different academic years or semesters |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- A validation error appears indicating that all sections must be from the same academic year and semester
- The entry is not saved

---

#### TC-FR09-24

> *SRS Reference: FR-09 AC-17*

**What you need:** An active academic year exists but no active semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" |
| 3 | Attempt to proceed with the form |

**What should happen:**
- A message appears: "No active semester. Activate a semester to create entries."
- The entry cannot be created

---

#### TC-FR09-25

> *SRS Reference: FR-09 AC-17*

**What you need:** An active academic year exists but no active semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "EXAM" |
| 3 | Attempt to proceed with the form |

**What should happen:**
- A message appears: "No active semester. Activate a semester to create entries."
- The entry cannot be created

---

#### TC-FR09-26

> *SRS Reference: FR-09 AC-4*

**What you need:** An active academic year exists but no active semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "MEETING" |
| 3 | Fill in personnel and optional room |
| 4 | Click Save |

**What should happen:**
- The entry is created successfully — MEETING only requires an active academic year, not a semester
- The entry appears in the schedule list as "DRAFT"

---

#### TC-FR09-27

> *SRS Reference: FR-09 AC-18*

**What you need:** An existing schedule entry occupies room RM-101, Monday 08:00–09:00.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Create an entry using the same room (RM-101) and the same time (Monday 08:00–09:00) |
| 3 | Click Save without checking the override option |

**What should happen:**
- A conflict error is displayed showing the room and time overlap
- The save is blocked until the conflict is resolved or overridden

---

#### TC-FR09-28

> *SRS Reference: FR-09 AC-19*

**What you need:** An existing schedule entry creates a room conflict with the new entry.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Create an entry that overlaps with an existing entry's room and time |
| 3 | Check the "Override" checkbox |
| 4 | Type "Dean's approval" in the override reason field |
| 5 | Click Save |

**What should happen:**
- The entry is saved successfully despite the conflict
- The override reason "Dean's approval" is recorded with the entry

---

#### TC-FR09-29

> *SRS Reference: FR-09 AC-19*

**What you need:** An existing schedule entry creates a conflict with the new entry.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Create an entry that conflicts with an existing one |
| 3 | Check the "Override" checkbox |
| 4 | Type "ok" in the override reason field (less than 10 characters) |
| 5 | Click Save |

**What should happen:**
- A warning message appears noting that the override reason is very short
- The entry is still saved despite the warning (non-blocking)

---

#### TC-FR09-30

> *SRS Reference: FR-09 AC-20*

**What you need:** Entry form is filled with data.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Fill in all entry fields |
| 3 | Click the "Validate" button (without clicking Save) |

**What should happen:**
- Any conflicts are displayed on screen as a preview
- No data is saved — this is a dry-run check only

---

#### TC-FR09-31

> *SRS Reference: FR-09 AC-18*

**What you need:** A room with a capacity of 30. A section with 35 students.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Select the room (capacity 30) and the section (35 students) |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- A warning is displayed indicating that the room capacity is exceeded
- The entry is still saved — capacity warnings do not block the save

---

### Recurring Schedules
*Setting up repeating patterns like weekly, daily, or custom day combinations.*

---

#### TC-FR09-32

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "ONCE" |
| 3 | Select a specific date (e.g., October 14) |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The entry is created with a single occurrence on the selected date only

---

#### TC-FR09-33

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "DAILY" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on every day within the semester date range

---

#### TC-FR09-34

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "WEEKDAYS" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on Monday through Friday only
- No occurrences appear on Saturday or Sunday

---

#### TC-FR09-35

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "WEEKLY" and select Monday |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on every Monday within the semester date range

---

#### TC-FR09-36

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "BI_WEEKLY" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences every other week within the semester date range

---

#### TC-FR09-37

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "MWF" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on every Monday, Wednesday, and Friday within the semester date range

---

#### TC-FR09-38

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "TTH" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on every Tuesday and Thursday within the semester date range

---

#### TC-FR09-39

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "MTH" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on every Monday through Thursday within the semester date range

---

#### TC-FR09-40

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "MONTHLY_DATE" and set day of month to 15 |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is created with occurrences on the 15th of each month within the semester date range

---

#### TC-FR09-41

> *SRS Reference: FR-09 AC-14*

**What you need:** An active academic year and semester that includes February and April.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "MONTHLY_DATE" and set day of month to 31 |
| 3 | Fill in all other required fields |
| 4 | Click Save |
| 5 | Open the entry and review the list of occurrences |

**What should happen:**
- Months that have fewer than 31 days (e.g., February, April) are skipped — no occurrences appear for those months
- Only months with 31 days have occurrences listed

---

#### TC-FR09-42

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "CUSTOM" |
| 3 | Select specific days: Monday, Wednesday, and Friday |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The entry is created with occurrences only on the selected custom days (Monday, Wednesday, Friday) within the semester date range

---

#### TC-FR09-43

> *SRS Reference: FR-09 AC-15*

**What you need:** An active academic year and a long semester. A "DAILY" recurrence pattern that would generate more than 200 occurrences.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "DAILY" |
| 3 | Fill in all other required fields |
| 4 | Click Save |
| 5 | Open the entry and review the list of occurrences |

**What should happen:**
- The occurrences list is capped at 200 entries maximum
- Dates beyond the 200th occurrence are not generated

---

### Editing and Deleting
*Modifying and removing schedule entries, with status restrictions.*

---

#### TC-FR09-44

> *SRS Reference: FR-09 AC-21*

**What you need:** An existing schedule entry with "DRAFT" status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the DRAFT entry to open it |
| 2 | Change the Start Time from 08:00 to 10:00 |
| 3 | Click Save |

**What should happen:**
- The entry is updated with the new time
- Conflict detection runs again with the updated time
- The updated time is reflected in the schedule list

---

#### TC-FR09-45

> *SRS Reference: FR-09 AC-22*

**What you need:** An existing schedule entry with "PUBLISHED" status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the PUBLISHED entry to open it |
| 2 | Attempt to edit any field |

**What should happen:**
- All fields are read-only or the edit controls are disabled
- A message indicates "Only DRAFT entries can be updated"

---

#### TC-FR09-46

> *SRS Reference: FR-09 AC-23*

**What you need:** An existing schedule entry with "DRAFT" status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the DRAFT entry |
| 2 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The entry is removed from the schedule list
- The entry no longer appears in search or filter results

---

#### TC-FR09-47

> *SRS Reference: FR-09 AC-22*

**What you need:** An existing schedule entry with "PUBLISHED" status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the PUBLISHED entry |

**What should happen:**
- Deletion is blocked
- A message indicates "Only DRAFT entries can be deleted"

---

#### TC-FR09-48

> *SRS Reference: FR-09 AC-24*

**What you need:** An existing schedule entry.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Duplicate" button on an existing entry |
| 2 | Review the form that opens |

**What should happen:**
- A new entry form opens pre-filled with all the values from the original entry
- The status is set to "DRAFT"
- The entry has a new identity (it is not the same record as the original)

---

#### TC-FR09-49

> *SRS Reference: FR-09 AC-25*

**What you need:** Quick-Add mode is available.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enable Quick-Add mode (toggle or checkbox) |
| 2 | Create a schedule entry and fill in room, personnel, time, and recurrence |
| 3 | Click Save |
| 4 | Observe the form after saving |

**What should happen:**
- After saving, the form does not reset to blank
- The previous values (room, personnel, time, recurrence) are retained for rapid creation of the next entry

---

#### TC-FR09-50

> *SRS Reference: FR-09 AC-26*

**What you need:** The Add Entry form is partially filled with unsaved data.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" and fill in some fields without saving |
| 2 | Click a navigation link in the sidebar (e.g., "Rooms") |

**What should happen:**
- A confirmation dialog appears: "You have unsaved changes. Discard?"
- If you confirm, navigation proceeds and unsaved data is lost
- If you cancel, you stay on the form with your data intact

---

#### TC-FR09-51

> *SRS Reference: FR-09 AC-27*

**What you need:** An existing schedule entry.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on an existing entry to view its details |

**What should happen:**
- A read-only detail panel opens showing all entry fields (activity, room, personnel, sections, time, recurrence, etc.)
- Conflict flags and change history are visible

---

#### TC-FR09-52

> *SRS Reference: FR-09 AC-8*

**What you need:** Time slot configured as 07:00–21:00 with a 60-minute period length.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Create an entry with Start Time 07:00 and End Time 08:00 (first slot) |
| 3 | Save the entry |
| 4 | Click "Add Entry" again |
| 5 | Create an entry with Start Time 20:00 and End Time 21:00 (last slot) |
| 6 | Save the entry |

**What should happen:**
- Both entries are saved successfully — times at the exact start and end boundaries of the time window are valid

---

#### TC-FR09-53

> *SRS Reference: FR-09 AC-2*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "CLASS" and Modality to "ONLINE" |
| 3 | Fill in personnel, section, and subject (leave Room empty) |
| 4 | Click Save |
| 5 | Open the saved entry and review any conflict indicators |

**What should happen:**
- The entry is saved successfully without a room
- No room-related conflict warnings appear (room overlap, room unavailable, room department mismatch, and capacity exceeded checks are all skipped for entries without a room)

---

#### TC-FR09-54

> *SRS Reference: FR-09 AC-1*

**What you need:** No schedule entries exist yet.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Schedule page |

**What should happen:**
- An empty state message is displayed: "No schedule entries found"
- Guidance or a prompt to create the first entry is shown

---

#### TC-FR09-55

> *SRS Reference: FR-09 AC-1*

**What you need:** An existing DRAFT schedule entry.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open an existing DRAFT entry |
| 2 | Change multiple fields (e.g., room, time, and personnel) |
| 3 | Click Save |
| 4 | Open the change history or audit log for this entry |

**What should happen:**
- The change history shows the previous values (before the edit) and the new values (after the edit) for each changed field
- Each changed field is clearly listed with its old and new value

---

# TC_CONFLICTS — Conflict Detection Engine

> **Module:** Conflict Detection Engine (FR-10)
> **SRS Reference:** FR-10.1 through FR-10.26
> **Prefix:** TC-FR10
> **Last Updated:** 2026-06-12

---

### Schedule Conflicts
*How the app detects and displays scheduling problems like double-booked rooms, overloaded teachers, and unavailable resources.*

---

#### TC-FR10-01

> *SRS Reference: FR-10 AC-1*

**What you need:** A schedule entry already exists using Room 101 on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select Room 101 as the room |
| 3 | Set the day to Monday, start time to 8:30 AM, end time to 9:30 AM |
| 4 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict message mentions the existing entry that uses Room 101 at the overlapping time

---

#### TC-FR10-02

> *SRS Reference: FR-10 AC-1*

**What you need:** A schedule entry already exists using Room 101 on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select Room 101 as the room |
| 3 | Set the day to Monday, start time to 9:00 AM, end time to 10:00 AM |
| 4 | Save the entry |

**What should happen:**
- No red conflict indicator appears on the entry
- The entry saves without any room conflict (adjacent times do not overlap)

---

#### TC-FR10-03

> *SRS Reference: FR-10 AC-1*

**What you need:** A schedule entry already exists using Room 101 on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select Room 101 as the room |
| 3 | Set the day to Tuesday, start time to 8:00 AM, end time to 9:00 AM |
| 4 | Save the entry |

**What should happen:**
- No red conflict indicator appears on the entry
- The entry saves without any room conflict (different days)

---

#### TC-FR10-04

> *SRS Reference: FR-10 AC-1*

**What you need:** A SHS schedule entry already exists using a shared room on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Click to create a new schedule entry |
| 3 | Select the same shared room |
| 4 | Set the day to Monday, start time to 8:00 AM, end time to 9:00 AM |
| 5 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict message references the SHS entry using the same shared room at the overlapping time

---

#### TC-FR10-05

> *SRS Reference: FR-10 AC-1*

**What you need:** A schedule entry already exists using Room 101 on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Set the modality to Online (no room assigned) |
| 3 | Set the day to Monday, start time to 8:00 AM, end time to 9:00 AM |
| 4 | Save the entry |

**What should happen:**
- No red conflict indicator appears for a room conflict
- Online entries do not trigger room conflicts since no room is assigned

---

#### TC-FR10-06

> *SRS Reference: FR-10 AC-2*

**What you need:** A schedule entry already exists with a specific teacher assigned on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Assign the same teacher |
| 3 | Set the day to Monday, start time to 8:30 AM, end time to 9:30 AM |
| 4 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the teacher is already scheduled at the overlapping time

---

#### TC-FR10-07

> *SRS Reference: FR-10 AC-2*

**What you need:** A shared teacher is assigned to a SHS schedule entry on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Click to create a new schedule entry |
| 3 | Assign the same shared teacher |
| 4 | Set the day to Monday, start time to 8:00 AM, end time to 9:00 AM |
| 5 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the shared teacher is already scheduled across departments at the overlapping time

---

#### TC-FR10-08

> *SRS Reference: FR-10 AC-2*

**What you need:** A non-shared SHS teacher is assigned to a SHS schedule entry on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Click to create a new schedule entry |
| 3 | Assign the same non-shared SHS teacher |
| 4 | Set the day to Monday, start time to 8:00 AM, end time to 9:00 AM |
| 5 | Save the entry |

**What should happen:**
- No red conflict indicator appears for a teacher time conflict
- A yellow warning indicator may appear for department mismatch (non-shared teacher used in a different department)

---

#### TC-FR10-09

> *SRS Reference: FR-10 AC-3*

**What you need:** A schedule entry already exists with section SHS-11-STEM-A on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select section SHS-11-STEM-A |
| 3 | Set the day to Monday, start time to 8:30 AM, end time to 9:30 AM |
| 4 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the section is already scheduled at the overlapping time

---

#### TC-FR10-10

> *SRS Reference: FR-10 AC-3*

**What you need:** Entry A has sections A and B assigned. Entry B will use sections B and C at the same time

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry at the same time as Entry A |
| 2 | Select sections B and C |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates section B is already scheduled in another entry at the same time

---

#### TC-FR10-11

> *SRS Reference: FR-10 AC-4*

**What you need:** A blocking calendar event (e.g., Holiday) exists on November 3rd covering the whole day

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to November 3rd on the schedule |
| 2 | Click to create a new schedule entry on November 3rd at any time |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the date is blocked by a calendar event

---

#### TC-FR10-12

> *SRS Reference: FR-10 AC-4*

**What you need:** A non-blocking calendar event exists on November 3rd

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to November 3rd on the schedule |
| 2 | Click to create a new schedule entry on November 3rd |
| 3 | Save the entry |

**What should happen:**
- No red conflict indicator appears for calendar blocking
- The entry saves normally since the calendar event is not set to block scheduling

---

#### TC-FR10-13

> *SRS Reference: FR-10 AC-5*

**What you need:** A teacher has a maximum of 40 weekly hours and currently has 38 hours of scheduled entries

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new 3-hour schedule entry |
| 2 | Assign the teacher who already has 38 hours |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the teacher's weekly hours (41) exceed the maximum allowed (40)

---

#### TC-FR10-14

> *SRS Reference: FR-10 AC-5*

**What you need:** A shared teacher has a maximum of 40 weekly hours, with 20 hours in SHS and 18 hours in College

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College department |
| 2 | Click to create a new 3-hour schedule entry |
| 3 | Assign the shared teacher |
| 4 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the teacher's combined weekly hours across all departments (41) exceed the maximum allowed (40)

---

#### TC-FR10-15

> *SRS Reference: FR-10 AC-5*

**What you need:** A teacher has a maximum of 40 weekly hours and currently has 38 hours of scheduled entries

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new 2-hour schedule entry |
| 2 | Assign the teacher who already has 38 hours |
| 3 | Save the entry |

**What should happen:**
- No red conflict indicator appears for overload (total is exactly 40, not over)
- A yellow warning indicator may appear indicating the teacher's workload is approaching the maximum

---

#### TC-FR10-16

> *SRS Reference: FR-10 AC-6*

**What you need:** A room with a capacity of 30 students. A section with 35 students

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the room with capacity 30 |
| 3 | Select the section with 35 students |
| 4 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the number of students (35) exceeds the room's capacity (30)
- The entry still saves — this is a warning, not a blocking conflict

---

#### TC-FR10-17

> *SRS Reference: FR-10 AC-6*

**What you need:** A room with a capacity of 40. Section A has 25 students, Section B has 20 students

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the room with capacity 40 |
| 3 | Select both Section A and Section B |
| 4 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the combined student count (45) exceeds the room's capacity (40)
- The entry still saves — this is a warning, not a blocking conflict

---

#### TC-FR10-18

> *SRS Reference: FR-10 AC-6*

**What you need:** A room with a capacity of 40. A section with exactly 40 students

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the room with capacity 40 |
| 3 | Select the section with 40 students |
| 4 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for capacity
- The entry saves normally — exactly matching the room capacity is not a conflict

---

#### TC-FR10-19

> *SRS Reference: FR-10 AC-7*

**What you need:** A teacher has a maximum of 40 weekly hours and currently has 30 hours of scheduled entries

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new 3-hour schedule entry |
| 2 | Assign the teacher who already has 30 hours (new total will be 33 hours, which is 82.5% of max) |
| 3 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the teacher's workload is approaching the maximum allowed hours

---

#### TC-FR10-20

> *SRS Reference: FR-10 AC-7*

**What you need:** A teacher has a maximum of 40 weekly hours and currently has 10 hours of scheduled entries

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new 5-hour schedule entry |
| 2 | Assign the teacher who already has 10 hours (new total will be 15 hours, which is 37.5% of max) |
| 3 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for workload
- The entry saves normally — workload is well below the warning threshold

---

#### TC-FR10-21

> *SRS Reference: FR-10 AC-8*

**What you need:** A teacher whose specializations are set to "Math" only

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Assign the teacher who specializes in Math |
| 3 | Set the subject to "English" |
| 4 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the assigned subject does not match the teacher's listed specializations

---

#### TC-FR10-22

> *SRS Reference: FR-10 AC-8*

**What you need:** A teacher whose specializations include "Math"

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Assign the teacher who specializes in Math |
| 3 | Set the subject to "Math" |
| 4 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for specialization mismatch
- The subject matches the teacher's specialization (matching is not case-sensitive)

---

#### TC-FR10-23

> *SRS Reference: FR-10 AC-8*

**What you need:** A teacher with no specializations defined (specializations list is empty)

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Assign the teacher with no specializations |
| 3 | Set any subject |
| 4 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for specialization mismatch
- When a teacher has no specializations listed, no comparison is made

---

#### TC-FR10-24

> *SRS Reference: FR-10 AC-9*

**What you need:** A room with its status set to "Maintenance"

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the room that is under maintenance |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the selected room is currently unavailable due to maintenance

---

#### TC-FR10-25

> *SRS Reference: FR-10 AC-9*

**What you need:** A room with its status set to "Inactive"

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the room that is inactive |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the selected room is inactive and unavailable for scheduling

---

#### TC-FR10-26

> *SRS Reference: FR-10 AC-9*

**What you need:** A room with its status set to "Available"

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the available room |
| 3 | Save the entry |

**What should happen:**
- No red conflict indicator appears for room availability
- The entry saves normally — the room is available

---

#### TC-FR10-27

> *SRS Reference: FR-10 AC-10*

**What you need:** A room assigned exclusively to the College department

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to SHS |
| 2 | Click to create a new schedule entry |
| 3 | Select the College-only room |
| 4 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the room belongs to a different department and cannot be used by SHS

---

#### TC-FR10-28

> *SRS Reference: FR-10 AC-10*

**What you need:** A room assigned exclusively to the SHS department

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Click to create a new schedule entry |
| 3 | Select the SHS-only room |
| 4 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the room belongs to a different department and cannot be used by College

---

#### TC-FR10-29

> *SRS Reference: FR-10 AC-10*

**What you need:** A room set as shared between departments

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry in either department |
| 2 | Select the shared room |
| 3 | Save the entry |

**What should happen:**
- No red conflict indicator appears for department mismatch
- Shared rooms can be used by any department

---

#### TC-FR10-30

> *SRS Reference: FR-10 AC-11*

**What you need:** A non-shared teacher who belongs to the SHS department

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Click to create a new schedule entry |
| 3 | Assign the non-shared SHS teacher |
| 4 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the teacher belongs to a different department than the entry

---

#### TC-FR10-31

> *SRS Reference: FR-10 AC-11*

**What you need:** A teacher who is set as shared between departments

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry in either department |
| 2 | Assign the shared teacher |
| 3 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for department mismatch
- Shared teachers can be assigned to entries in any department

---

#### TC-FR10-32

> *SRS Reference: FR-10 AC-12*

**What you need:** An exam period is configured for October 14–18

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to October 22nd on the schedule |
| 2 | Click to create a new schedule entry |
| 3 | Set the activity type to Exam |
| 4 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the exam is scheduled outside the designated exam period (October 14–18)

---

#### TC-FR10-33

> *SRS Reference: FR-10 AC-12*

**What you need:** An exam period is configured for October 14–18

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to October 15th on the schedule |
| 2 | Click to create a new schedule entry |
| 3 | Set the activity type to Exam |
| 4 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for exam period mismatch
- The exam is within the designated exam period

---

#### TC-FR10-34

> *SRS Reference: FR-10 AC-12*

**What you need:** An exam period is configured for October 14–18

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to October 22nd on the schedule |
| 2 | Click to create a new schedule entry |
| 3 | Set the activity type to Class (not Exam) |
| 4 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for exam period mismatch
- The exam period check only applies to entries with the Exam activity type

---

#### TC-FR10-35

> *SRS Reference: FR-10 AC-13*

**What you need:** The active semester is 1st Semester (covering Quarter 1 and Quarter 2 only). Department is SHS

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Set the activity type to Exam |
| 3 | Set the exam type to Quarter 3 Exam |
| 4 | Save the entry |

**What should happen:**
- A yellow warning indicator appears on the entry
- The warning indicates the Quarter 3 exam does not belong to the 1st Semester

---

#### TC-FR10-36

> *SRS Reference: FR-10 AC-13*

**What you need:** The active semester is 1st Semester. Department is SHS. Quarter 1 end date is configured

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry within the Quarter 1 date range |
| 2 | Set the activity type to Exam |
| 3 | Set the exam type to Quarter 1 Exam |
| 4 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for exam quarter mismatch
- The Quarter 1 exam is correctly scheduled within the 1st Semester

---

#### TC-FR10-37

> *SRS Reference: FR-10 AC-13*

**What you need:** The active department is College

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Set the activity type to Exam |
| 3 | Save the entry |

**What should happen:**
- No yellow warning indicator appears for exam quarter mismatch
- The exam quarter check only applies to SHS entries, not College entries

---

#### TC-FR10-38

> *SRS Reference: FR-10 AC-14*

**What you need:** A teacher whose status is set to "Inactive"

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Assign the inactive teacher |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the assigned teacher is inactive

---

#### TC-FR10-39

> *SRS Reference: FR-10 AC-15*

**What you need:** A section whose status is set to "Inactive"

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Select the inactive section |
| 3 | Save the entry |

**What should happen:**
- A red conflict indicator appears on the entry
- The conflict indicates the selected section is inactive

---

#### TC-FR10-40

> *SRS Reference: FR-10 AC-17*

**What you need:** A schedule entry with any conflict present

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open a schedule entry that has a conflict |
| 2 | Look at the conflict indicators on the entry |

**What should happen:**
- Each conflict indicator shows a colored flag (red for blocking, yellow for warning)
- Each flag shows the type of conflict and a description message

---

#### TC-FR10-41

> *SRS Reference: FR-10 AC-17*

**What you need:** A schedule entry with an existing conflict (e.g., a room conflict)

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Edit the entry to resolve the conflict (e.g., change the room to one that is not in use) |
| 2 | Save the entry |
| 3 | Check the conflict indicators on the entry |

**What should happen:**
- The previously shown conflict indicator is removed
- Only conflicts that still apply are shown (conflicts are fully rechecked on each save, not accumulated)

---

#### TC-FR10-42

> *SRS Reference: FR-10 AC-17*

**What you need:** Conditions that will trigger multiple conflicts at once (e.g., a double-booked room, an overloaded teacher, and exceeding room capacity)

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click to create a new schedule entry |
| 2 | Set up the entry so it triggers multiple conflicts simultaneously (overlapping room, overloaded teacher, too many students for the room) |
| 3 | Save the entry |

**What should happen:**
- Multiple conflict indicators appear on the same entry
- Each applicable conflict is shown with its own colored flag and message
- Both red (blocking) and yellow (warning) conflicts can appear together

---

### Overriding Conflicts
*Acknowledging and overriding scheduling conflicts with a reason.*

---

#### TC-FR10-43

> *SRS Reference: FR-10 AC-16*

**What you need:** A schedule entry that has a red (blocking) conflict

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the entry that has a red conflict |
| 2 | Check the override checkbox |
| 3 | Enter a reason: "Approved by Dean" |
| 4 | Save the entry |

**What should happen:**
- The entry saves successfully despite the blocking conflict
- The override reason is recorded and visible on the entry

---

#### TC-FR10-44

> *SRS Reference: FR-10 AC-16*

**What you need:** A schedule entry that has a red (blocking) conflict

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the entry that has a red conflict |
| 2 | Check the override checkbox |
| 3 | Leave the reason field empty |
| 4 | Click Save |

**What should happen:**
- The entry does not save
- A message appears indicating that an override reason is required

---

#### TC-FR10-45

> *SRS Reference: FR-10 AC-16*

**What you need:** A schedule entry that has a red (blocking) conflict

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the entry that has a red conflict |
| 2 | Check the override checkbox |
| 3 | Enter a very short reason: "ok" |
| 4 | Save the entry |

**What should happen:**
- A warning message appears indicating the reason is very short
- The entry still saves despite the short reason

---

### Automatic Conflict Updates
*How conflicts are automatically re-checked when rooms, personnel, or calendar events change.*

---

#### TC-FR10-46

> *SRS Reference: FR-10 AC-18*

**What you need:** A room set to "Available" with draft schedule entries using that room

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the room's details |
| 2 | Change the room's status from "Available" to "Maintenance" |
| 3 | Save the room |
| 4 | Go to Sidebar > Schedule and check the draft entries that use this room |

**What should happen:**
- The draft entries using the room now show a red conflict indicator
- The conflict indicates the room is unavailable due to maintenance

---

#### TC-FR10-47

> *SRS Reference: FR-10 AC-18*

**What you need:** A teacher with maximum weekly hours set, and draft schedule entries that are near the limit

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the teacher's details |
| 2 | Reduce the maximum weekly hours to a value below their current scheduled total |
| 3 | Save the teacher record |
| 4 | Go to Sidebar > Schedule and check the draft entries for this teacher |

**What should happen:**
- The affected draft entries now show a red conflict indicator
- The conflict indicates the teacher's scheduled hours exceed the new maximum

---

#### TC-FR10-48

> *SRS Reference: FR-10 AC-18*

**What you need:** A section assigned to a draft schedule entry where the room capacity is close to the student count

**Where:** Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the section's details |
| 2 | Increase the student count to a number that exceeds the assigned room's capacity |
| 3 | Save the section |
| 4 | Go to Sidebar > Schedule and check the draft entries using this section |

**What should happen:**
- The affected draft entries now show a yellow warning indicator
- The warning indicates the student count exceeds the room's capacity

---

#### TC-FR10-49

> *SRS Reference: FR-10 AC-19*

**What you need:** A room with published schedule entries using it. The room is currently set to "Available"

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the room's details |
| 2 | Change the room's status from "Available" to "Maintenance" |
| 3 | Save the room |
| 4 | Go to Sidebar > Schedule and check the published entries that use this room |

**What should happen:**
- The published entries are NOT automatically updated with new conflicts
- Published entries require a manual re-validate action to check for new conflicts

---

#### TC-FR10-50

> *SRS Reference: FR-10 AC-18*

**What you need:** A non-blocking calendar event on a date that has draft schedule entries

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the calendar event's details |
| 2 | Change the event to blocking |
| 3 | Save the calendar event |
| 4 | Go to Sidebar > Schedule and check the draft entries on that date |

**What should happen:**
- The draft entries on that date now show a red conflict indicator
- The conflict indicates the date is blocked by a calendar event

---

# TC_PUBLISH — Publish Workflow

> **Module:** Publish Workflow (FR-11)
> **Total Test Cases:** 28
> **Last Updated:** 2026-06-12

---

### Publishing Schedules

*Making draft schedules official by publishing them. Includes conflict checks, selective publishing, and unpublishing.*

---

#### TC-FR11-01

> *SRS Reference: FR-11 AC-1*

**What you need:** At least 5 schedule entries in DRAFT status with no conflicts in the active term.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Publish" button |
| 2 | Review the pre-publish summary — it should show 5 selected, 0 hard conflicts, and the number of soft warnings |
| 3 | Click "Confirm" to publish |

**What should happen:**
- All 5 entries change from DRAFT to PUBLISHED
- The schedule list shows them as PUBLISHED
- Each entry has an audit log record for the publish action

---

#### TC-FR11-02

> *SRS Reference: FR-11 AC-2*

**What you need:** At least 5 schedule entries in DRAFT status in the active term.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Publish" button |
| 2 | Deselect 2 of the 5 entries in the selection list |
| 3 | Click "Confirm" to publish |

**What should happen:**
- Only the 3 selected entries change to PUBLISHED
- The 2 deselected entries remain in DRAFT status

---

#### TC-FR11-03

> *SRS Reference: FR-11 AC-3*

**What you need:** Several DRAFT entries — some with hard conflicts, some with soft warnings, some clean.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Publish" button |
| 2 | Review the pre-publish summary |

**What should happen:**
- The summary displays the total number of selected entries
- The summary displays the count of hard conflicts
- The summary displays the count of soft warnings

---

#### TC-FR11-04

> *SRS Reference: FR-11 AC-4*

**What you need:** A DRAFT entry that has a hard conflict (e.g., a room double-booking).

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the entry with the hard conflict |
| 2 | Click "Publish" |
| 3 | Attempt to confirm without overriding |

**What should happen:**
- Publishing is blocked
- A message appears: "Resolve HARD conflicts or override to publish"
- The entry remains in DRAFT status

---

#### TC-FR11-05

> *SRS Reference: FR-11 AC-4*

**What you need:** A DRAFT entry that has only a soft warning (e.g., room capacity exceeded) and no hard conflicts.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the entry with the soft warning |
| 2 | Click "Publish" and confirm |

**What should happen:**
- The entry is published successfully
- The soft warning is shown but does not block publishing

---

#### TC-FR11-06

> *SRS Reference: FR-11 AC-5*

**What you need:** A DRAFT entry that has a hard conflict.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the entry with the hard conflict |
| 2 | Click "Publish" |
| 3 | Click the "Override" option next to the hard conflict |
| 4 | Enter a reason for the override |
| 5 | Confirm the publish |

**What should happen:**
- The entry is published despite the hard conflict
- The override reason is recorded and visible in the audit log

---

#### TC-FR11-07

> *SRS Reference: FR-11 AC-6*

**What you need:** A DRAFT entry that previously had a hard conflict overridden when it was saved (before publishing).

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the previously-overridden entry for publishing |
| 2 | Click "Publish" |

**What should happen:**
- A fresh validation runs — the prior save-time override does NOT carry forward
- The hard conflict reappears and must be overridden again at publish time
- Publishing is blocked until the conflict is resolved or overridden again

---

#### TC-FR11-08

> *SRS Reference: FR-11 AC-7*

**What you need:** An active term with zero DRAFT entries (all entries are already published, or no entries exist).

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the "Publish" button |

**What should happen:**
- The "Publish" button is disabled, or clicking it shows a message: "No entries to publish"

---

#### TC-FR11-09

> *SRS Reference: FR-11 AC-8*

**What you need:** DRAFT entries exist in both the SHS and College departments.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to SHS |
| 2 | Click "Publish" and confirm |

**What should happen:**
- Only SHS draft entries are published
- College draft entries remain unchanged in DRAFT status

---

#### TC-FR11-10

> *SRS Reference: FR-11 AC-8*

**What you need:** DRAFT entries exist across multiple semesters (e.g., 1st Semester and 2nd Semester).

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Make sure the active term is set to 1st Semester |
| 2 | Click "Publish" and confirm |

**What should happen:**
- Only 1st Semester draft entries are published
- 2nd Semester draft entries remain unchanged

---

#### TC-FR11-11

> *SRS Reference: FR-11 AC-9*

**What you need:** A semester that is set to inactive status, with DRAFT entries in it.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the schedule for the inactive semester |
| 2 | Attempt to publish |

**What should happen:**
- Publishing is blocked
- A message appears: "Activate this semester to publish entries."

---

#### TC-FR11-12

> *SRS Reference: FR-11 AC-10*

**What you need:** At least one schedule entry in PUBLISHED status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Unpublish" on the published entry |
| 2 | Confirm the unpublish action |

**What should happen:**
- The entry reverts to DRAFT status
- Conflict detection re-runs on the unpublished entry and on any entries that share the same room or instructor

---

#### TC-FR11-13

> *SRS Reference: FR-11 AC-10*

**What you need:** A PUBLISHED entry (Entry A) that shares a room (e.g., RM-101) with other entries.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Unpublish" on Entry A |
| 2 | Confirm the action |
| 3 | Check the conflict status of other entries that use room RM-101 |

**What should happen:**
- Entry A reverts to DRAFT
- Other entries sharing RM-101 have their conflicts re-evaluated — some conflicts may appear or disappear based on the change

---

#### TC-FR11-14

> *SRS Reference: FR-11 AC-11*

**What you need:** Multiple schedule entries in PUBLISHED status in the active term.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Bulk Unpublish" |
| 2 | Confirm the action in the dialog |

**What should happen:**
- All PUBLISHED entries in the active department, academic year, and semester revert to DRAFT

---

#### TC-FR11-15

> *SRS Reference: FR-11 AC-11*

**What you need:** At least one PUBLISHED entry in the active term.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Bulk Unpublish" |

**What should happen:**
- A confirmation dialog appears showing the message: "This will unpublish N entries. Are you sure?" (where N is the count of published entries)

---

#### TC-FR11-16

> *SRS Reference: FR-11 AC-12*

**What you need:** PUBLISHED entries in the active term, and a room has been changed to maintenance status since publish time.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Re-validate Published" |
| 2 | Review the results |

**What should happen:**
- Conflict flags are refreshed on all published entries
- Entries using the room now in maintenance show a new hard conflict for "room unavailable"

---

#### TC-FR11-17

> *SRS Reference: FR-11 AC-12*

**What you need:** PUBLISHED entries with a mix of conflict statuses.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Re-validate Published" |
| 2 | Review the summary |

**What should happen:**
- The summary shows the count of new conflicts found, conflicts resolved, and entries unchanged

---

#### TC-FR11-18

> *SRS Reference: FR-11 AC-13*

**What you need:** Multiple schedule entries in PUBLISHED status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Re-validate Published" |
| 2 | Check the status of each entry after re-validation |

**What should happen:**
- All entries remain in PUBLISHED status — re-validation only updates conflict flags, it does not change entry status

---

#### TC-FR11-19

> *SRS Reference: FR-11 AC-14*

**What you need:** A schedule entry in DRAFT status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the DRAFT entry |
| 2 | Click "Publish" and confirm |

**What should happen:**
- The entry status changes from DRAFT to PUBLISHED

---

#### TC-FR11-20

> *SRS Reference: FR-11 AC-14*

**What you need:** A schedule entry in PUBLISHED status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Unpublish" on the published entry |
| 2 | Confirm the action |

**What should happen:**
- The entry status changes from PUBLISHED to DRAFT

---

#### TC-FR11-21

> *SRS Reference: FR-11 AC-14*

**What you need:** A schedule entry in any status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Review all available status-change actions on the entry |

**What should happen:**
- Only DRAFT-to-PUBLISHED and PUBLISHED-to-DRAFT transitions are available
- No other state transitions (e.g., direct delete or archive) are offered

---

#### TC-FR11-22

> *SRS Reference: FR-11 AC-1*

**What you need:** 5 DRAFT entries — 4 clean and 1 with an unresolvable hard conflict.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select all 5 entries |
| 2 | Click "Publish" without overriding the hard conflict |

**What should happen:**
- The entry with the hard conflict fails to publish
- The other valid entries may still publish successfully (verify whether partial publish or all-or-nothing behavior applies)

---

#### TC-FR11-23

> *SRS Reference: FR-11 AC-1, FR-12*

**What you need:** Several DRAFT entries ready to publish.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select entries and click "Publish" |
| 2 | Confirm the publish |
| 3 | Open the audit log |

**What should happen:**
- A PUBLISH action is logged in the audit log for each published entry

---

#### TC-FR11-24

> *SRS Reference: FR-11 AC-10, FR-12*

**What you need:** A schedule entry in PUBLISHED status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Unpublish" on the entry |
| 2 | Confirm the action |
| 3 | Open the audit log |

**What should happen:**
- An UNPUBLISH action is logged in the audit log for the entry

---

#### TC-FR11-25

> *SRS Reference: FR-11 AC-9*

**What you need:** An inactive semester that has DRAFT entries.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the schedule for the inactive semester |

**What should happen:**
- The draft entries are visible in the list
- A banner is displayed indicating that publishing is blocked for this inactive semester

---

#### TC-FR11-26

> *SRS Reference: FR-11 AC-1*

**What you need:** A recurring DRAFT entry (e.g., weekly, with 15 occurrences) with no hard conflicts.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the recurring entry |
| 2 | Click "Publish" and confirm |

**What should happen:**
- All occurrences of the recurring entry are published
- Each occurrence is individually re-validated for conflicts

---

#### TC-FR11-27

> *SRS Reference: FR-11 AC-3*

**What you need:** 5 DRAFT entries — 3 clean, 1 with a hard conflict, 1 with only a soft warning.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select all 5 entries |
| 2 | Click "Publish" |
| 3 | Review the pre-publish summary |

**What should happen:**
- The summary shows: 5 selected, 1 hard conflict, 1 soft warning
- 4 entries (3 clean + 1 soft-only) can be published without override
- The entry with the hard conflict requires an override or must be excluded

---

#### TC-FR11-28

> *SRS Reference: FR-11 AC-10*

**What you need:** A schedule entry that was previously published.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Unpublish" on the entry and confirm |
| 2 | Edit the entry (e.g., change the time or room) |
| 3 | Save the changes |
| 4 | Select the entry and click "Publish" again |
| 5 | Confirm the publish |

**What should happen:**
- The entry is published with the updated values
- Conflicts are re-evaluated based on the new time/room
- The full edit-and-republish cycle is recorded in the audit log

---

# TC_EXAMS — Examination Schedule

> **Module:** Examination Schedule (FR-13)
> **Prefix:** TC-FR13
> **Last Updated:** 2026-06-12

---

### Examination Schedules

*Creating and managing exam schedules for SHS (quarterly) and College (semester-based) departments.*

---

#### TC-FR13-01

> *SRS Reference: FR-13 AC-1*

**What you need:** An SHS department is active with a 1st Semester that has a Q1 date boundary configured.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q1 Exam" |
| 3 | Enter title: "Math Q1 Exam" |
| 4 | Fill in Subject, Section, Room, Personnel, and a Date that falls within the Q1 date range |
| 5 | Fill in the Time fields |
| 6 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status
- The recurrence is set to "Once" and cannot be changed
- The exam date falls within the Q1 window

---

#### TC-FR13-02

> *SRS Reference: FR-13 AC-1*

**What you need:** An SHS department is active with a 1st Semester selected.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q2 Exam" |
| 3 | Fill in all required fields, choosing a date within the Q2 date range |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status
- The exam date falls within the Q2 window (after Q1 ends, up to the semester end)

---

#### TC-FR13-03

> *SRS Reference: FR-13 AC-1*

**What you need:** An SHS department is active with a 2nd Semester that has a Q3 date boundary configured.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q3 Exam" |
| 3 | Fill in all required fields, choosing a date within the Q3 date range |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status

---

#### TC-FR13-04

> *SRS Reference: FR-13 AC-1*

**What you need:** An SHS department is active with a 2nd Semester selected.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q4 Exam" |
| 3 | Fill in all required fields, choosing a date within the Q4 date range |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status

---

#### TC-FR13-05

> *SRS Reference: FR-13 AC-2*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Prelim" |
| 3 | Fill in all required fields (Subject, Section, Room, Personnel, Date, Time) |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status

---

#### TC-FR13-06

> *SRS Reference: FR-13 AC-2*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Midterm" |
| 3 | Fill in all required fields |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status

---

#### TC-FR13-07

> *SRS Reference: FR-13 AC-2*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Pre-Finals" |
| 3 | Fill in all required fields |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status

---

#### TC-FR13-08

> *SRS Reference: FR-13 AC-2*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Finals" |
| 3 | Fill in all required fields |
| 4 | Click Save |

**What should happen:**
- The exam is created and appears in the exam list with a "Draft" status

---

#### TC-FR13-09

> *SRS Reference: FR-13 AC-3*

**What you need:** An SHS department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Click the Exam Type dropdown |

**What should happen:**
- Only SHS exam types are shown: "Q1 Exam", "Q2 Exam", "Q3 Exam", "Q4 Exam"
- No College exam types (Prelim, Midterm, Pre-Finals, Finals) appear in the list

---

#### TC-FR13-10

> *SRS Reference: FR-13 AC-3*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Click the Exam Type dropdown |

**What should happen:**
- Only College exam types are shown: "Prelim", "Midterm", "Pre-Finals", "Finals"
- No SHS exam types (Q1 Exam, Q2 Exam, Q3 Exam, Q4 Exam) appear in the list

---

#### TC-FR13-11

> *SRS Reference: FR-13 AC-4*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Attempt to select an SHS exam type (e.g., "Q1 Exam") for a College exam |
| 3 | Click Save |

**What should happen:**
- The exam is rejected with an error indicating cross-department exam types are not allowed
- The exam is not created

---

#### TC-FR13-12

> *SRS Reference: FR-13 AC-4*

**What you need:** An SHS department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Attempt to select a College exam type (e.g., "Prelim") for an SHS exam |
| 3 | Click Save |

**What should happen:**
- The exam is rejected with an error indicating cross-department exam types are not allowed
- The exam is not created

---

#### TC-FR13-13

> *SRS Reference: FR-13 AC-5*

**What you need:** Logged in, on the exam creation form.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Look at the Recurrence field on the exam form |

**What should happen:**
- The Recurrence field shows "Once" and is locked (grayed out or disabled)
- There is no way to change it to "Weekly", "Daily", or any other option

---

#### TC-FR13-14

> *SRS Reference: FR-13 AC-5*

**What you need:** Logged in.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Fill in all required fields |
| 3 | Attempt to change recurrence to something other than "Once" (if the field were editable) |
| 4 | Click Save |

**What should happen:**
- The exam is rejected if recurrence is anything other than "Once"
- An error message indicates exams must occur only once

---

#### TC-FR13-15

> *SRS Reference: FR-13 AC-6*

**What you need:** Logged in, creating an exam with "Online" modality selected.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Set modality to "Online" |
| 3 | Fill in all required fields except Room (leave Room empty) |
| 4 | Click Save |

**What should happen:**
- The save is rejected with an error stating that a room is always required for exams
- The exam is not created until a room is selected, even though the modality is "Online"

---

#### TC-FR13-16

> *SRS Reference: FR-13 AC-6*

**What you need:** Logged in, creating an exam with "Face-to-Face" modality selected.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Set modality to "Face-to-Face" |
| 3 | Fill in all required fields except Room (leave Room empty) |
| 4 | Click Save |

**What should happen:**
- The save is rejected with an error stating that a room is required
- The exam is not created until a room is selected

---

#### TC-FR13-17

> *SRS Reference: FR-13 AC-7*

**What you need:** An SHS department is active with 1st Semester. Q1 date range is set to Jun 5–Aug 15.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q1 Exam" |
| 3 | Set the date to Jul 20 (within the Q1 range) |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The exam is created successfully with no warnings
- No quarter mismatch warning appears

---

#### TC-FR13-18

> *SRS Reference: FR-13 AC-7*

**What you need:** An SHS department is active with 1st Semester. Q1 ends Aug 15.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q1 Exam" |
| 3 | Set the date to Sep 10 (falls in the Q2 date range, outside Q1) |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The exam is created, but a soft warning appears indicating a quarter mismatch
- The warning explains that a Q1 exam is scheduled outside the Q1 date range

---

#### TC-FR13-19

> *SRS Reference: FR-13 AC-8*

**What you need:** An SHS department is active with a 1st Semester selected (which only covers Q1 and Q2).

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Q3 Exam" |
| 3 | Fill in all required fields with a date in the 1st Semester |
| 4 | Click Save |

**What should happen:**
- The exam is created, but a soft warning appears indicating a quarter mismatch
- The warning explains that Q3 belongs to the 2nd Semester, not the 1st Semester

---

#### TC-FR13-20

> *SRS Reference: FR-13 AC-7*

**What you need:** A College department is active.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Select exam type "Midterm" |
| 3 | Set the date to any valid date |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The exam is created successfully with no quarter mismatch warnings
- Quarter validation does not apply to College exams

---

#### TC-FR13-21

> *SRS Reference: FR-13 AC-9*

**What you need:** An exam period event exists on the calendar for Oct 14–18.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Set the date to Oct 15 (within the exam period) |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The exam is created successfully with no warnings
- No exam period mismatch warning appears

---

#### TC-FR13-22

> *SRS Reference: FR-13 AC-9*

**What you need:** An exam period event exists on the calendar for Oct 14–18.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Set the date to Oct 22 (outside the exam period) |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The exam is created, but a soft warning appears indicating an exam period mismatch
- The warning explains that the exam is scheduled outside the designated exam period

---

#### TC-FR13-23

> *SRS Reference: FR-13 AC-10*

**What you need:** At least one exam exists in the system.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Exams page via the sidebar |

**What should happen:**
- A dedicated exam list is displayed, separate from regular schedule entries
- Exams are listed with their details (title, type, date, room, status, etc.)

---

#### TC-FR13-24

> *SRS Reference: FR-13 AC-11*

**What you need:** An SHS department is active and at least one SHS exam exists.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department |
| 2 | Navigate to the Exams page |

**What should happen:**
- The exam list displays a "Quarter" column showing Q1, Q2, Q3, or Q4 for each exam

---

#### TC-FR13-25

> *SRS Reference: FR-13 AC-11*

**What you need:** A College department is active and at least one College exam exists.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department |
| 2 | Navigate to the Exams page |

**What should happen:**
- The exam list displays an "Exam Type" column showing Prelim, Midterm, Pre-Finals, or Finals for each exam

---

#### TC-FR13-26

> *SRS Reference: FR-13 AC-12*

**What you need:** At least one exam exists in "Draft" status.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the draft exam from the exam list |
| 2 | Click "Publish" (or use the publish workflow from the Schedule page) |

**What should happen:**
- The exam is published and its status changes from "Draft" to "Published"
- If the exam has hard conflicts (e.g., room or personnel overlap), publishing is blocked with an error message listing the conflicts

---

#### TC-FR13-27

> *SRS Reference: FR-13 AC-13*

**What you need:** At least one exam exists in "Published" status.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the published exam from the exam list |
| 2 | Attempt to edit any field (e.g., change the title or date) |

**What should happen:**
- Editing is blocked; the form fields are disabled or an error message appears
- The published exam cannot be modified

---

#### TC-FR13-28

> *SRS Reference: FR-13 AC-13*

**What you need:** At least one exam exists in "Published" status.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the published exam from the exam list |
| 2 | Attempt to delete the exam |

**What should happen:**
- Deletion is blocked; a message indicates that published exams cannot be deleted
- The exam remains in the list

---

#### TC-FR13-29

> *SRS Reference: FR-13 AC-1*

**What you need:** An exam is set up that overlaps with another exam's room, personnel, and section, uses an inactive room, and falls outside the designated exam period.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Fill in fields that intentionally conflict: same room as another exam at the same time, same personnel, same section, an inactive room, and a date outside the exam period |
| 3 | Click Save |

**What should happen:**
- The exam is created in "Draft" status, but multiple conflict warnings are displayed
- Warnings include: room conflict, personnel conflict, section conflict, room unavailable, and exam period mismatch

---

#### TC-FR13-30

> *SRS Reference: FR-13 AC-10*

**What you need:** No exams exist in the system for the current semester.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Exams page via the sidebar |

**What should happen:**
- An empty state message is displayed (e.g., "No exams found" or similar placeholder)
- The page does not show an error

---

#### TC-FR13-31

> *SRS Reference: FR-13 AC-1*

**What you need:** Logged in.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Exam" |
| 2 | Enter a very long title (500 characters) in the Title field |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- If the title is within the allowed character limit, the exam is created successfully
- If the title exceeds the maximum allowed length, the save is rejected with an error message indicating the title is too long

---

#### TC-FR13-32

> *SRS Reference: FR-13 AC-1*

**What you need:** At least one exam exists in "Draft" status.

**Where:** Sidebar > Exams

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new exam and note it appears in the list |
| 2 | Edit the exam (change the title or date) and save |
| 3 | Delete the exam |

**What should happen:**
- Each action (create, edit, delete) is recorded in the system
- The exam list reflects each change immediately after saving

---

# TC_TEMPLATES — Templates & Carry Forward

> **Module:** Schedule Templates / Carry Forward (FR-14)
> **Prefix:** TC-FR14
> **Last Updated:** 2026-06-12

---

### Carrying Forward Schedules

*Copying sections, schedules, exams, and calendar events from a previous term to the current term.*

---

#### TC-FR14-01

> *SRS Reference: FR-14 AC-1*

**What you need:** A previous term that has sections, class schedules, exam schedules, and calendar events already created. A current active term set.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page |
| 2 | Select a previous term from the Source Term dropdown |
| 3 | Confirm the Target Term shows the current active term |
| 4 | Check the boxes for Sections and Class Schedules |
| 5 | Click "Preview" |

**What should happen:**
- A preview appears showing the count of items that will be carried forward
- Any potential conflicts are listed
- Any unmapped resources are flagged

---

#### TC-FR14-02

> *SRS Reference: FR-14 AC-2*

**What you need:** A previous term with at least 10 sections. A current active term with no matching sections.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Sections only |
| 3 | Click "Preview" to review |
| 4 | Click "Execute" |

**What should happen:**
- All 10 sections from the source term are cloned into the target term as new entries
- Any sections that already exist in the target (matching code) are skipped
- A summary shows how many were created and how many were skipped

---

#### TC-FR14-03

> *SRS Reference: FR-14 AC-3*

**What you need:** A previous term with at least 20 class schedule entries. Sections already exist in the target term.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules only |
| 3 | Click "Execute" |

**What should happen:**
- All 20 class schedule entries are cloned into the target term
- Each cloned entry has a Draft status
- Conflict detection runs automatically on the new entries

---

#### TC-FR14-04

> *SRS Reference: FR-14 AC-3*

**What you need:** A previous term with at least 5 exam schedule entries. Sections already exist in the target term.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Exam Schedules only |
| 3 | Click "Execute" |

**What should happen:**
- All 5 exam entries are cloned into the target term
- Each cloned entry has a Draft status

---

#### TC-FR14-05

> *SRS Reference: FR-14 AC-4*

**What you need:** A previous term with at least 8 calendar events.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Calendar Events only |
| 3 | Click "Execute" |

**What should happen:**
- All 8 calendar events are cloned into the target term

---

#### TC-FR14-06

> *SRS Reference: FR-14 AC-5*

**What you need:** A previous term with sections, class schedules, exam schedules, and calendar events.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check all boxes: Sections, Class Schedules, Exam Schedules, Calendar Events |
| 3 | Click "Execute" |

**What should happen:**
- All entity types are cloned into the target term together
- A summary shows counts for each type that was created

---

#### TC-FR14-07

> *SRS Reference: FR-14 AC-6*

**What you need:** The current active term is set (e.g., 2026–2027, 1st Semester).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page |
| 2 | Click the Source Term dropdown |
| 3 | Look through the list of available source terms |

**What should happen:**
- The current active term does not appear in the Source Term dropdown
- Only previous (non-active) terms are listed

---

#### TC-FR14-08

> *SRS Reference: FR-14 AC-6*

**What you need:** The current active term is set (e.g., 2026–2027, 1st Semester).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page |
| 2 | Look at the Target Term dropdown |

**What should happen:**
- The Target Term dropdown only shows the current active term
- No other terms are selectable as a target

---

#### TC-FR14-09

> *SRS Reference: FR-14 AC-7*

**What you need:** The target term already has a section with code "BSIT-3A". The source term also has a section with code "BSIT-3A" plus other sections.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Sections |
| 3 | Click "Execute" |

**What should happen:**
- The existing "BSIT-3A" section in the target is not duplicated — it is skipped
- All other sections from the source are cloned into the target
- The summary shows the count of skipped duplicates

---

#### TC-FR14-10

> *SRS Reference: FR-14 AC-8*

**What you need:** The target term already has some entries (sections or schedules).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select a source term |
| 2 | Select any entity types |
| 3 | Click "Preview" |

**What should happen:**
- A warning message appears: "Target term already has N entries" (or similar wording)
- The warning does not block you from proceeding — you can still execute

---

#### TC-FR14-11

> *SRS Reference: FR-14 AC-6*

**What you need:** The current active term is set.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page |
| 2 | Attempt to select the same term as both source and target |

**What should happen:**
- The system prevents selecting the same term as both source and target
- An error message indicates that the source and target terms cannot be the same

---

#### TC-FR14-12

> *SRS Reference: FR-14 AC-9*

**What you need:** The source term has class schedules referencing a section with code "BSIT-3A". The target term also has a section with code "BSIT-3A".

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" |

**What should happen:**
- The cloned class schedule entries are automatically linked to the target term's "BSIT-3A" section (matched by code)
- No manual remapping is needed

---

#### TC-FR14-13

> *SRS Reference: FR-14 AC-9*

**What you need:** The source term has class schedules referencing a section with code "BSIT-3A". The target term does not have a section with code "BSIT-3A".

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" or "Preview" |

**What should happen:**
- The result summary flags the unmapped section "BSIT-3A"
- Entries referencing unmapped sections are clearly identified

---

#### TC-FR14-14

> *SRS Reference: FR-14 AC-10*

⚠️ DEFERRED — Manual remapping UI for unmapped sections is not yet implemented. Only automatic code-based matching is available. Not yet implemented.

---

#### TC-FR14-15

> *SRS Reference: FR-14 AC-11*

**What you need:** The source term has class schedules that, when carried forward, would create time overlaps (conflicts) in the target term.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" |

**What should happen:**
- All entries are cloned as Draft status
- Conflict detection runs on every cloned entry
- Any overlapping entries are flagged with a conflict indicator

---

#### TC-FR14-16

> *SRS Reference: FR-14 AC-12*

**What you need:** A source term with at least 10 entries to carry forward. A way to observe whether partial results appear (e.g., intentionally cause one entry to fail if possible).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Select entity types and click "Execute" |
| 3 | Verify the results |

**What should happen:**
- Either all entries are created successfully, or none are created (no partial results)
- If something goes wrong during the process, no incomplete data is left behind

---

#### TC-FR14-17

> *SRS Reference: FR-14 AC-13*

**What you need:** A source term that has both SHS and College data. The app is switched to SHS department.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department |
| 2 | Open the Carry Forward page and select the source term |
| 3 | Select entity types and click "Execute" |

**What should happen:**
- Only SHS sections and schedules are carried forward
- College data from the source term is not included

---

#### TC-FR14-18

> *SRS Reference: FR-14 AC-13*

**What you need:** A source term that has both SHS and College data. The app is switched to College department.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department |
| 2 | Open the Carry Forward page and select the source term |
| 3 | Select entity types and click "Execute" |

**What should happen:**
- Only College sections and schedules are carried forward
- SHS data from the source term is not included

---

#### TC-FR14-19

> *SRS Reference: FR-14 AC-14*

**What you need:** A carry forward has just been executed successfully.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete a carry forward execution |
| 2 | Review the result summary shown after execution |

**What should happen:**
- The summary shows the total number of items attempted
- The summary shows the number of items created
- The summary shows the number of items skipped (duplicates)
- The summary shows the number of conflicts detected

---

#### TC-FR14-20

> *SRS Reference: FR-14 AC-14, FR-12*

**What you need:** A carry forward has just been executed successfully. Access to the audit log.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete a carry forward execution |
| 2 | Open the audit log (via Settings or wherever the audit log is accessible) |

**What should happen:**
- The audit log contains a "Create" entry for each item that was cloned during the carry forward
- Each entry identifies what was created and when

---

#### TC-FR14-21

> *SRS Reference: FR-14*

**What you need:** A previous term that has zero sections, schedules, exams, and events (completely empty).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page |
| 2 | Select the empty source term |
| 3 | Select any entity types |
| 4 | Click "Preview" |

**What should happen:**
- The preview shows "0 items to carry forward" or a similar empty-state message
- No errors are displayed

---

#### TC-FR14-22

> *SRS Reference: FR-14*

**What you need:** A source term where some sections have been archived (deleted/inactive).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Sections |
| 3 | Click "Execute" |

**What should happen:**
- Only active (non-archived) sections are carried forward
- Archived sections are excluded from the carry forward

---

#### TC-FR14-23

> *SRS Reference: FR-14*

**What you need:** A source term with schedule entries that reference a room which has since been deleted.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" |

**What should happen:**
- Entries referencing the deleted room are flagged with a conflict or warning
- The carry forward still completes for other valid entries

---

#### TC-FR14-24

> *SRS Reference: FR-14, NFR-P-005*

**What you need:** A source term with 100 or more entries (combined sections, schedules, exams, events).

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Select all entity types |
| 3 | Click "Execute" |
| 4 | Observe how long the operation takes |

**What should happen:**
- The carry forward completes within a reasonable time (no long freezing or hanging)
- All entries are cloned successfully
- The result summary appears promptly after completion

---

#### TC-FR14-25

> *SRS Reference: FR-14*

**What you need:** No active academic year or semester is set in the system.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page |
| 2 | Attempt to start a carry forward |

**What should happen:**
- The carry forward is blocked
- A message indicates that no valid target term is available (no active term set)

---

#### TC-FR14-26

> *SRS Reference: FR-14 AC-9*

**What you need:** A source term with schedule entries that reference room code "RM-101". The target term has a room with code "RM-101".

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" |
| 4 | Open one of the cloned schedule entries in the target term |

**What should happen:**
- The cloned entry still references room "RM-101"
- The room is correctly resolved to the matching room in the target term

---

#### TC-FR14-27

> *SRS Reference: FR-14 AC-9*

**What you need:** A source term with schedule entries assigned to an instructor (e.g., employee "EMP-001"). The instructor still exists in the system.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" |
| 4 | Open one of the cloned schedule entries in the target term |

**What should happen:**
- The cloned entry still references the same instructor
- The instructor assignment is preserved in the carried-forward entry

---

#### TC-FR14-28

> *SRS Reference: FR-14 AC-3*

**What you need:** A source term with class schedule entries that have a Published status.

**Where:** Sidebar > Templates

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Carry Forward page and select the source term |
| 2 | Check the box for Class Schedules |
| 3 | Click "Execute" |
| 4 | Open the cloned entries in the target term and check their status |

**What should happen:**
- All cloned entries have a Draft status, regardless of the source entry's status
- None of the cloned entries are Published

---

# TC_IMPORT — Data Import

> **Module:** Data Import (FR-15)
> **Last Updated:** 2026-06-12

---

### Importing Data

*Uploading CSV files to add or update rooms, personnel, sections, and calendar events in bulk.*

---

#### TC-FR15-01

> *SRS Reference: FR-15 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Personnel" as the import target |
| 2 | Click "Download Template" |

**What should happen:**
- A CSV file is downloaded to your computer
- The file contains the correct column headers for personnel fields

---

#### TC-FR15-02

> *SRS Reference: FR-15 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Rooms" as the import target |
| 2 | Click "Download Template" |

**What should happen:**
- A CSV file is downloaded with room-specific column headers

---

#### TC-FR15-03

> *SRS Reference: FR-15 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Sections" as the import target |
| 2 | Click "Download Template" |

**What should happen:**
- A CSV file is downloaded with section-specific column headers

---

#### TC-FR15-04

> *SRS Reference: FR-15 AC-2*

**What you need:** A personnel CSV template filled in with 10 valid rows of data

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Personnel" as the import target |
| 2 | Click "Upload" |
| 3 | In the file picker, select the filled-in CSV file |

**What should happen:**
- A preview table appears showing all 10 rows
- Every row is marked as Valid (green)

---

#### TC-FR15-05

> *SRS Reference: FR-15 AC-3*

**What you need:** A CSV file containing a mix of valid rows, rows with errors, and rows with warnings (e.g., 5 valid, 3 with errors, 2 with warnings)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the mixed CSV file |

**What should happen:**
- The preview table shows each row with a colored status indicator
- Valid rows appear in green
- Error rows appear in red with an error message
- Warning rows appear in yellow with a warning message

---

#### TC-FR15-06

> *SRS Reference: FR-15 AC-4*

**What you need:** A preview table showing 10 valid rows (all green, no errors)

**Where:** Sidebar > Import (preview screen)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Commit" |

**What should happen:**
- All 10 records are saved (created or updated)
- A result report appears showing: Total Processed, Created count, Updated count, and 0 Skipped

---

#### TC-FR15-07

> *SRS Reference: FR-15 AC-5*

**What you need:** An import that has just been committed

**Where:** Sidebar > Import (result screen)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Review the result report on screen |

**What should happen:**
- The report displays Total Processed, Created, Updated, and Skipped counts

---

#### TC-FR15-08

> *SRS Reference: FR-15 AC-6*

**What you need:** A CSV file larger than 5 MB

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the oversized CSV file |

**What should happen:**
- The file is rejected immediately
- An error message appears: "File exceeds 5 MB limit"

---

#### TC-FR15-09

> *SRS Reference: FR-15 AC-7*

**What you need:** A CSV file containing 1001 data rows (plus the header row)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file with 1001 rows |

**What should happen:**
- The file is rejected immediately
- An error message appears: "File exceeds 1000 row limit"

---

#### TC-FR15-10

> *SRS Reference: FR-15 AC-7*

**What you need:** A CSV file containing exactly 1000 data rows (plus the header row)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file with exactly 1000 rows |

**What should happen:**
- The file is accepted
- The preview table appears showing all 1000 rows

---

#### TC-FR15-11

> *SRS Reference: FR-15 AC-8*

**What you need:** A CSV file that is missing a required column header (e.g., the "employee_id" column is absent)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file with the missing header |

**What should happen:**
- The file is rejected immediately
- An error message appears identifying the missing header (e.g., "Missing required headers: employee_id")

---

#### TC-FR15-12

> *SRS Reference: FR-15 AC-9*

**What you need:** A CSV file with 5 data rows and 3 completely blank rows scattered between them

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |

**What should happen:**
- The preview table shows only the 5 data rows
- The blank rows are skipped silently (no errors or warnings for them)

---

#### TC-FR15-13

> *SRS Reference: FR-15 AC-10*

⚠️ DEFERRED — XLSX import not yet implemented. CSV only. Not yet implemented.

---

#### TC-FR15-14

> *SRS Reference: FR-15 AC-11*

**What you need:** A personnel CSV file where a row has a valid value in the type column (e.g., "FACULTY")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Valid (green)

---

#### TC-FR15-15

> *SRS Reference: FR-15 AC-11*

**What you need:** A personnel CSV file where a row has an invalid value in the type column (e.g., "TEACHER" instead of FACULTY, STAFF, or ADMIN)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Error (red)
- The error message indicates the invalid value and lists the allowed values

---

#### TC-FR15-16

> *SRS Reference: FR-15 AC-12*

**What you need:** A CSV file containing two rows that share the same unique identifier (e.g., both have employee_id "EMP-001")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table |

**What should happen:**
- The first row with "EMP-001" is marked as Valid (green)
- The second row with "EMP-001" is marked as Error (red) with a message about a duplicate identifier within the file

---

#### TC-FR15-17

> *SRS Reference: FR-15 AC-13*

**What you need:** A section CSV file where a row references an adviser that exists in the system (e.g., adviser employee_id "EMP-001" is already in Personnel)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Valid (green) — the referenced personnel record was found

---

#### TC-FR15-18

> *SRS Reference: FR-15 AC-13*

**What you need:** A section CSV file where a row references an adviser that does not exist in the system (e.g., adviser employee_id "EMP-999")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Error (red)
- The error message indicates that the referenced personnel record was not found

---

#### TC-FR15-19

> *SRS Reference: FR-15 AC-14*

**What you need:** A room CSV file where the capacity column contains a text value like "40" (instead of a plain number)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The value is accepted and treated as the number 40
- The row is marked as Valid (green)

---

#### TC-FR15-20

> *SRS Reference: FR-15 AC-15*

**What you need:** A room CSV file where a row has capacity set to "0"

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Error (red)
- The error message indicates that capacity must be greater than 0

---

#### TC-FR15-21

> *SRS Reference: FR-15 AC-16*

**What you need:** A CSV file where one row has a text field containing more than 500 characters (e.g., a 501-character description)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is flagged as Error or Warning
- The message indicates the field exceeds the 500 character limit

---

#### TC-FR15-22

> *SRS Reference: FR-15 AC-16*

**What you need:** A CSV file where one row has a list field containing 51 items (e.g., 51 specializations)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Error (red)
- The error message indicates the maximum of 50 items in a list field was exceeded

---

#### TC-FR15-23

> *SRS Reference: FR-15 AC-17*

**What you need:** A section CSV file for Senior High School that is missing the strand/track column

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Sections" as the import target |
| 2 | Click "Upload" and select the SHS section CSV file |
| 3 | Check the preview table |

**What should happen:**
- Rows are marked as Error (red)
- The error message indicates that strand/track is required for SHS sections

---

#### TC-FR15-24

> *SRS Reference: FR-15 AC-17*

**What you need:** A section CSV file for College that is missing the subject column

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Sections" as the import target |
| 2 | Click "Upload" and select the College section CSV file |
| 3 | Check the preview table |

**What should happen:**
- Rows are marked as Error (red)
- The error message indicates that subject is required for College sections

---

#### TC-FR15-25

> *SRS Reference: FR-15 AC-18*

**What you need:** Logged in

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Rooms" as the import target |
| 2 | Upload a valid rooms CSV file |
| 3 | Commit the import |

**What should happen:**
- Rooms are imported without any department filtering
- The imported rooms are available across the entire system

---

#### TC-FR15-26

> *SRS Reference: FR-15 AC-19*

**What you need:** Logged in, preparing to import sections

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Sections" as the import target |
| 2 | Select the Academic Year and Semester from the dropdowns on the import page |
| 3 | Upload a valid sections CSV file |
| 4 | Commit the import |

**What should happen:**
- The imported sections are assigned to the Academic Year, Semester, and Department selected in the import page (not from columns in the CSV)

---

#### TC-FR15-27

> *SRS Reference: FR-15 AC-20*

**What you need:** The system has no personnel record with employee_id "EMP-010"

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Personnel" as the import target |
| 2 | Upload a CSV containing a row with employee_id "EMP-010" |
| 3 | Verify the row is Valid in the preview |
| 4 | Click "Commit" |

**What should happen:**
- A new personnel record is created for "EMP-010"
- The result report shows 1 Created

---

#### TC-FR15-28

> *SRS Reference: FR-15 AC-20*

**What you need:** A personnel record with employee_id "EMP-001" already exists with the name "Juan"

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Personnel" as the import target |
| 2 | Upload a CSV containing a row with employee_id "EMP-001" and name "Jose" |
| 3 | Verify the row is Valid in the preview |
| 4 | Click "Commit" |

**What should happen:**
- The existing record for "EMP-001" is updated — the name changes from "Juan" to "Jose"
- The result report shows 1 Updated

---

#### TC-FR15-29

> *SRS Reference: FR-15 AC-21*

**What you need:** A calendar event titled "Holiday A" on November 1 already exists in the system

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "Calendar Events" as the import target |
| 2 | Upload a CSV containing a row with the same title "Holiday A" and the same start date (November 1) |
| 3 | Verify the row is Valid in the preview |
| 4 | Click "Commit" |

**What should happen:**
- The existing calendar event is updated (not duplicated)
- The result report shows 1 Updated

---

#### TC-FR15-30

> *SRS Reference: FR-15 AC-22*

**What you need:** A CSV file with 10 rows where row 8 has an error (e.g., references a personnel record that doesn't exist)

**Where:** Sidebar > Import (preview screen)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Observe that row 8 is marked as Error (red) in the preview |
| 2 | Click "Commit" |

**What should happen:**
- The commit is blocked
- A message appears indicating that errors must be resolved before committing
- No records are created or updated

---

#### TC-FR15-31

> *SRS Reference: FR-15 AC-23*

**What you need:** A CSV file containing names with special characters (e.g., "José Ñañez")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table |

**What should happen:**
- Names display correctly with accented and special characters (e.g., "José Ñañez" appears as-is, not garbled)

---

#### TC-FR15-32

> *SRS Reference: FR-15 AC-24*

**What you need:** A CSV file where a field value contains a comma inside quotes (e.g., notes column contains "Room A, Building 1")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The field is parsed correctly — "Room A, Building 1" appears as a single value, not split into separate columns

---

#### TC-FR15-33

> *SRS Reference: FR-15 AC-25*

**What you need:** A CSV file that contains only the header row and no data rows

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the empty CSV file |

**What should happen:**
- A message appears: "No data rows found"
- No preview table is shown

---

#### TC-FR15-34

> *SRS Reference: FR-15 AC-23*

**What you need:** An import has been committed previously

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Import page |
| 2 | Look for an import history or job log section |

**What should happen:**
- The previous import job is listed showing: the import target, row counts, timestamp, and any error details

---

#### TC-FR15-35

> *SRS Reference: FR-15 AC-24*

**What you need:** A CSV file has been uploaded and the preview shows rows with errors

**Where:** Sidebar > Import (preview screen)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Export Error Report" |
| 2 | Choose a save location in the file picker |

**What should happen:**
- An error report file is saved to the chosen location
- The report contains details of the rows that had errors

---

#### TC-FR15-36

> *SRS Reference: FR-15 AC-25*

**What you need:** Logged in

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Upload an extremely large or complex CSV file |
| 2 | Wait and observe |

**What should happen:**
- If processing takes longer than 30 seconds, an error message appears indicating the operation timed out
- The import does not proceed

---

# TC_EXPORT — Data Export, Logo, Signatories, Footer

> **Module:** Data Export (FR-16), Logo (FR-21), Signatories (FR-22), Footer Credits (FR-23)
> **SRS Reference:** FR-16.1–FR-16.26, FR-21.1–FR-21.10, FR-22.1–FR-22.15, FR-23.1–FR-23.13
> **Last Updated:** 2026-06-11

---

### Exporting Schedules

*Downloading schedule data, reports, and exam schedules as CSV or XLSX files.*

---

#### TC-FR16-01

> *SRS Reference: FR-16 AC-1*

**What you need:** Published schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select "Schedule by Resource" as the export type |
| 3 | Choose "CSV" as the format |
| 4 | Complete the signatories modal (add at least one signatory or check "No signatories") |
| 5 | Choose a save location in the file save dialog |

**What should happen:**
- A CSV file is saved to the chosen location
- The file contains schedule data matching the active department, academic year, and semester

---

#### TC-FR16-02

> *SRS Reference: FR-16 AC-1*

**What you need:** Published schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select "Schedule by Resource" as the export type |
| 3 | Choose "XLSX" as the format |
| 4 | Complete the signatories modal |
| 5 | Choose a save location in the file save dialog |

**What should happen:**
- An XLSX file is saved to the chosen location via the native save dialog
- The file contains the expected schedule data

---

#### TC-FR16-03

> *SRS Reference: FR-16 AC-2*

**What you need:** Calendar events exist for the active academic year and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select "Academic Calendar" as the export type |
| 3 | Choose "CSV" as the format |
| 4 | Complete the signatories modal |
| 5 | Choose a save location |

**What should happen:**
- A CSV file is saved containing the calendar events

---

#### TC-FR16-04

> *SRS Reference: FR-16 AC-3*

**What you need:** Personnel with schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select "Personnel Load Report" as the export type |
| 3 | Choose "XLSX" as the format |
| 4 | Complete the signatories modal |
| 5 | Choose a save location |

**What should happen:**
- An XLSX file is saved containing personnel workload data

---

#### TC-FR16-05

> *SRS Reference: FR-16 AC-4*

**What you need:** Rooms with schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select "Room Utilization Report" as the export type |
| 3 | Choose "XLSX" as the format |
| 4 | Complete the signatories modal |
| 5 | Choose a save location |

**What should happen:**
- An XLSX file is saved containing room utilization data

---

#### TC-FR16-06

> *SRS Reference: FR-16 AC-5*

**What you need:** Exam schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select "Examination Schedule" as the export type |
| 3 | Choose "XLSX" as the format |
| 4 | Complete the signatories modal |
| 5 | Choose a save location |

**What should happen:**
- An XLSX file is saved containing exam schedule data

---

#### TC-FR16-07

> *SRS Reference: FR-16 AC-6*

**What you need:** No published schedule entries exist for the active department, academic year, and semester (empty dataset).

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Observe the Export button |

**What should happen:**
- The Export button is disabled
- A message reads "No entries to export"

---

#### TC-FR16-08

> *SRS Reference: FR-16 AC-7*

**What you need:** Draft schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Set the status filter to "DRAFT" |
| 3 | Choose "CSV" as the format |
| 4 | Complete the signatories modal |
| 5 | Export and open the saved file |

**What should happen:**
- The CSV file includes a status column
- Every entry in the status column shows "DRAFT"

---

#### TC-FR16-09

> *SRS Reference: FR-16 AC-7*

**What you need:** Both draft and published schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Set the status filter to "ALL" |
| 3 | Export the file |

**What should happen:**
- The exported file includes both draft and published entries
- A status column shows the correct status for each entry

---

#### TC-FR16-10

> *SRS Reference: FR-16 AC-8*

**What you need:** Exportable schedule entries exist.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page and start an export |
| 2 | When the save dialog appears, check the suggested default filename |

**What should happen:**
- The default filename follows the pattern: ResourceType_ResourceName_Semester_AcademicYear with the correct file extension (e.g., `.csv` or `.xlsx`)

---

#### TC-FR16-11

> *SRS Reference: FR-16 AC-9*

⚠️ DEFERRED — PDF export not yet implemented. CSV and XLSX only. Not yet implemented.

---

#### TC-FR16-12

> *SRS Reference: FR-16 AC-10*

⚠️ DEFERRED — PDF export not yet implemented. Logo in PDF header cannot be tested. Not yet implemented.

---

#### TC-FR16-13

> *SRS Reference: FR-16 AC-11*

⚠️ DEFERRED — PDF export not yet implemented. Signatories in PDF cannot be tested. Not yet implemented.

---

#### TC-FR16-14

> *SRS Reference: FR-16 AC-12*

⚠️ DEFERRED — PDF export not yet implemented. Footer credits in PDF cannot be tested. Not yet implemented.

---

### Institution Branding

*Managing the institution logo, export signatories, and footer credits from Settings.*

---

#### TC-FR21-01

> *SRS Reference: FR-21 AC-1*

**What you need:** Logged in to the app.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Click "Upload Logo" |
| 3 | In the file picker, select a PNG image smaller than 2 MB |

**What should happen:**
- The logo is uploaded successfully
- A preview of the logo appears, fitting within a 200×100 pixel area
- The logo is saved and visible on the Settings page

---

#### TC-FR21-02

> *SRS Reference: FR-21 AC-1*

**What you need:** Logged in to the app.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Click "Upload Logo" |
| 3 | In the file picker, select a JPEG image smaller than 2 MB |

**What should happen:**
- The logo is uploaded successfully
- A preview of the logo appears on the Settings page

---

#### TC-FR21-03

> *SRS Reference: FR-21 AC-2*

**What you need:** Logged in to the app.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Click "Upload Logo" |
| 3 | In the file picker, select an image file larger than 2 MB |

**What should happen:**
- The upload is rejected
- An error message reads "Logo file must be under 2 MB."

---

#### TC-FR21-04

> *SRS Reference: FR-21 AC-3*

**What you need:** Logged in to the app.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Click "Upload Logo" |
| 3 | In the file picker, select a non-PNG/JPEG file (e.g., a GIF or BMP) |

**What should happen:**
- The upload is rejected
- An error message reads "Only PNG and JPEG images are accepted."

---

#### TC-FR21-05

> *SRS Reference: FR-21 AC-4*

**What you need:** A logo has already been uploaded.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Look at the logo preview |

**What should happen:**
- The logo preview fits within a 200×100 pixel bounding box
- The image's aspect ratio is preserved (not stretched or distorted)

---

#### TC-FR21-06

> *SRS Reference: FR-21 AC-5*

**What you need:** A logo has already been uploaded.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Click "Remove Logo" |
| 3 | Confirm removal in the confirmation dialog |

**What should happen:**
- The logo is removed
- The Settings page no longer shows a logo preview

---

#### TC-FR21-07

> *SRS Reference: FR-21 AC-6*

**What you need:** A logo has already been uploaded.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app completely |
| 2 | Reopen the app |
| 3 | Open the Settings page |

**What should happen:**
- The previously uploaded logo is still displayed in the preview

---

#### TC-FR22-01

> *SRS Reference: FR-22 AC-1*

**What you need:** Exportable schedule entries exist.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Select an export type and format |
| 3 | Click the Export button |

**What should happen:**
- A signatories modal appears before the file is saved
- The modal lets you configure signatories for this export

---

#### TC-FR22-02

> *SRS Reference: FR-22 AC-2*

**What you need:** The signatories modal is open (triggered by clicking Export).

**Where:** Sidebar > Export (signatories modal)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | In the signatories modal, click "Add Signatory" |
| 2 | Enter Label: "Prepared by" |
| 3 | Enter Name: "Juan Dela Cruz" |
| 4 | Enter Position: "Registrar" |
| 5 | Click the button to proceed with the export |

**What should happen:**
- The signatory is added with all three fields (label, name, position)
- The export proceeds after confirming

---

#### TC-FR22-03

> *SRS Reference: FR-22 AC-3*

**What you need:** The signatories modal is open.

**Where:** Sidebar > Export (signatories modal)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Add 5 signatories to the modal |
| 2 | Look at the "Add Signatory" button |

**What should happen:**
- The "Add Signatory" button is disabled after 5 signatories have been added
- No more than 5 signatories can be added

---

#### TC-FR22-04

> *SRS Reference: FR-22 AC-4*

**What you need:** The signatories modal is open.

**Where:** Sidebar > Export (signatories modal)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Check the "No signatories" checkbox |

**What should happen:**
- The signatory input fields are hidden
- The export can proceed without any signatories

---

#### TC-FR22-05

> *SRS Reference: FR-22 AC-5*

**What you need:** The signatories modal is open, "No signatories" is unchecked, and no signatories have been added.

**Where:** Sidebar > Export (signatories modal)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Leave the "No signatories" checkbox unchecked |
| 2 | Do not add any signatories |
| 3 | Click the Export button |

**What should happen:**
- A validation message appears indicating that signatories are required
- The export does not proceed

---

#### TC-FR22-06

> *SRS Reference: FR-22 AC-6*

**What you need:** Signatories have been configured in the modal. Exportable entries exist.

**Where:** Sidebar > Export (signatories modal)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Add one or more signatories in the modal |
| 2 | Export as CSV |
| 3 | Open the exported CSV file |

**What should happen:**
- The CSV file does not contain any signatory information (signatories are for PDF only, which is deferred)

---

#### TC-FR22-07

> *SRS Reference: FR-22 AC-7*

**What you need:** A previous export was completed with signatories configured.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click Export again to start a new export |
| 2 | Observe the signatories modal |

**What should happen:**
- The modal is fresh with no pre-filled signatories
- Previous signatory entries are not retained between exports

---

#### TC-FR23-01

> *SRS Reference: FR-23 AC-1*

**What you need:** Logged in to the app.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Find the footer credit text field |
| 3 | Type "Generated by Schedule Manager v1.0" |
| 4 | Click Save |

**What should happen:**
- The footer credit text is saved
- The field shows the saved text

---

#### TC-FR23-02

> *SRS Reference: FR-23 AC-2*

**What you need:** Logged in to the app.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Find the footer credit text field |
| 3 | Type a text that is 201 characters long |
| 4 | Click Save |

**What should happen:**
- The save is rejected
- An error message indicates the maximum is 200 characters

---

#### TC-FR23-03

> *SRS Reference: FR-23 AC-3*

**What you need:** A footer credit text has already been saved.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Clear the footer credit text field (or click "Clear") |
| 3 | Click Save |

**What should happen:**
- The footer credit is removed
- The field is now empty

---

#### TC-FR23-04

> *SRS Reference: FR-23 AC-4*

**What you need:** No footer credit text is configured. Exportable entries exist.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Export a schedule file |
| 2 | Open the exported file |

**What should happen:**
- The exported file has clean output with no footer text

---

#### TC-FR23-05

> *SRS Reference: FR-23 AC-5*

**What you need:** A footer credit text has been saved. Exportable entries exist.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Export a schedule as CSV |
| 2 | Open the exported CSV file |

**What should happen:**
- The CSV file does not contain the footer credit text (footer is for PDF only, which is deferred)

---

#### TC-FR23-06

> *SRS Reference: FR-23 AC-6*

**What you need:** A footer credit text has been saved.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app completely |
| 2 | Reopen the app |
| 3 | Open the Settings page |

**What should happen:**
- The previously saved footer credit text is still displayed in the field

---

#### TC-FR16-15

> *SRS Reference: FR-16 AC-1, NFR-P-006*

**What you need:** 200 published schedule entries exist for the active department, academic year, and semester.

**Where:** Sidebar > Export

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Export page |
| 2 | Export as XLSX |
| 3 | Observe how long the export takes |

**What should happen:**
- The export completes successfully
- The file is saved within a reasonable time (under 5 seconds)

---

#### TC-FR21-08

> *SRS Reference: FR-21 AC-6, FR-19*

**What you need:** A logo has been uploaded. A backup of the app data has been created.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Remove the current logo from Settings |
| 2 | Restore the app from the previously created backup |
| 3 | Open the Settings page |

**What should happen:**
- The logo is restored from the backup
- The logo preview is visible again on the Settings page

---

# TC_DASHBOARD — Dashboard

> **Module:** Dashboard (FR-20)
> **Last Updated:** 2026-06-12

---

### Dashboard

*The home page showing schedule statistics, quick actions, and recent activity.*

---

#### TC-FR20-01

> *SRS Reference: FR-20 AC-1*

**What you need:** Logged out of the app

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in with valid credentials |
| 2 | Observe which page appears after login |

**What should happen:**
- The Dashboard page is displayed as the first page after login

---

#### TC-FR20-02

> *SRS Reference: FR-20 AC-2*

**What you need:** No academic year or semester has been set up yet

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in to the app |
| 2 | Look at the Dashboard page |

**What should happen:**
- A prominent guidance message is displayed: "Set up an Academic Year and Semester to get started"

---

#### TC-FR20-03

> *SRS Reference: FR-20 AC-3*

**What you need:** An active academic year and semester exist for SHS

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Look at the Dashboard page |

**What should happen:**
- The active term summary card shows the academic year label, semester name, and quarter (Q1–Q4)

---

#### TC-FR20-04

> *SRS Reference: FR-20 AC-3*

**What you need:** An active academic year and semester exist for College

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Look at the Dashboard page |

**What should happen:**
- The active term summary card shows the academic year label and semester name
- No quarter field is displayed for College

---

#### TC-FR20-05

> *SRS Reference: FR-20 AC-4*

**What you need:** 5 unpublished (draft) schedule entries exist for the current term

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the Dashboard page |

**What should happen:**
- The "Unpublished Entries" card shows the count 5

---

#### TC-FR20-06

> *SRS Reference: FR-20 AC-4*

**What you need:** 10 published schedule entries exist for the current term

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the Dashboard page |

**What should happen:**
- The "Published Entries" card shows the count 10

---

#### TC-FR20-07

> *SRS Reference: FR-20 AC-5*

**What you need:** 3 schedule entries have hard conflicts

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the Dashboard page |

**What should happen:**
- The conflict count card shows 3 hard conflicts

---

#### TC-FR20-08

> *SRS Reference: FR-20 AC-5*

**What you need:** 2 schedule entries have soft warnings

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the Dashboard page |

**What should happen:**
- The soft warning count shows 2

---

#### TC-FR20-09

> *SRS Reference: FR-20 AC-6*

**What you need:** Several actions have been performed recently (e.g., entries created, published, or edited)

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the Dashboard page |

**What should happen:**
- The recent activity section shows the 5 most recent actions

---

#### TC-FR20-10

> *SRS Reference: FR-20 AC-7*

**What you need:** An active term exists with schedule entries

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Create Entry" quick action button on the Dashboard |

**What should happen:**
- The app navigates to the Schedule page with the create form open

---

#### TC-FR20-11

> *SRS Reference: FR-20 AC-7*

**What you need:** Unpublished (draft) schedule entries exist

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Publish Drafts" quick action button on the Dashboard |

**What should happen:**
- The app navigates to the Schedule page with the publish workflow started

---

#### TC-FR20-12

> *SRS Reference: FR-20 AC-7*

**What you need:** Published schedule entries exist

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Export Schedule" quick action button on the Dashboard |

**What should happen:**
- The app navigates to the export flow

---

#### TC-FR20-13

> *SRS Reference: FR-20 AC-8*

**What you need:** Both SHS and College departments have schedule data with different counts

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the Dashboard and note the current counts for SHS |
| 2 | Switch to the College department using the header department switcher |
| 3 | Look at the Dashboard counts again |

**What should happen:**
- All stat cards and counts update to reflect College-specific data
- The counts are different from the SHS counts noted earlier

---

#### TC-FR20-14

> *SRS Reference: FR-20*

**What you need:** Fresh install with setup complete but no schedule entries created

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in to the app |
| 2 | Look at the Dashboard page |

**What should happen:**
- All count cards show 0
- A "no active term" message is displayed
- The recent activity section is empty

---

#### TC-FR20-15

> *SRS Reference: FR-20 AC-4*

**What you need:** Logged in, Dashboard is visible

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Read all the card labels and text on the Dashboard |

**What should happen:**
- Cards use friendly labels like "Unpublished Entries" (not technical terms like "DRAFT entries")
- All labels are clear and easy to understand

---

#### TC-FR20-16

> *SRS Reference: FR-20 AC-4*

**What you need:** Logged in with an active term

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to the Schedule page and create a new draft entry |
| 2 | Navigate back to the Dashboard |

**What should happen:**
- The "Unpublished Entries" count has increased by 1 compared to before creating the entry

---

# TC_AUDIT — Audit Trail

> **Module:** Audit Trail (FR-12)
> **Prefix:** TC-FR12
> **Last Updated:** 2026-06-12

---

### Activity History

*Viewing the system's record of all changes. The audit log is automatic and cannot be modified.*

---

#### TC-FR12-01

> *SRS Reference: FR-12 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Rooms, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Rooms and create a new room |
| 2 | Go to Sidebar > Audit Log |
| 3 | Look for the entry related to the room you just created |

**What should happen:**
- An audit entry appears showing the action as "Create"
- The entry shows the room details that were created
- No "before" information is shown (since it was newly created)

---

#### TC-FR12-02

> *SRS Reference: FR-12 AC-1*

**What you need:** Logged in, at least one room already exists

**Where:** Sidebar > Rooms, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Rooms and change the name of an existing room |
| 2 | Go to Sidebar > Audit Log |
| 3 | Look for the entry related to the room you just updated |

**What should happen:**
- An audit entry appears showing the action as "Update"
- The entry shows both the old values (before the change) and the new values (after the change)

---

#### TC-FR12-03

> *SRS Reference: FR-12 AC-1*

**What you need:** Logged in, at least one room already exists

**Where:** Sidebar > Rooms, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Rooms and delete an existing room |
| 2 | Go to Sidebar > Audit Log |
| 3 | Look for the entry related to the room you just deleted |

**What should happen:**
- An audit entry appears showing the action as "Delete"
- The entry shows the room details that existed before deletion
- No "after" information is shown (since it was deleted)

---

#### TC-FR12-04

> *SRS Reference: FR-12 AC-2*

**What you need:** Logged in, a schedule entry with a hard conflict exists

**Where:** Sidebar > Schedule, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to the schedule entry with the hard conflict and choose to override it |
| 2 | Enter a reason for the override and confirm |
| 3 | Go to Sidebar > Audit Log |
| 4 | Look for the entry related to the override you just performed |

**What should happen:**
- An audit entry appears showing the action as "Override"
- The entry includes the reason you provided for the override
- The conflict details are captured in the entry

---

#### TC-FR12-05

> *SRS Reference: FR-12 AC-3*

**What you need:** Logged in, a schedule entry in draft status exists

**Where:** Sidebar > Schedule, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to the schedule entry and publish it |
| 2 | Go to Sidebar > Audit Log |
| 3 | Look for the entry related to the publish action |

**What should happen:**
- An audit entry appears showing the action as "Publish"
- The entry shows the status changed to "Published"

---

#### TC-FR12-06

> *SRS Reference: FR-12 AC-3*

**What you need:** Logged in, a published schedule entry exists

**Where:** Sidebar > Schedule, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to the published schedule entry and unpublish it |
| 2 | Go to Sidebar > Audit Log |
| 3 | Look for the entry related to the unpublish action |

**What should happen:**
- An audit entry appears showing the action as "Unpublish"
- The entry shows the status changed to "Draft"

---

#### TC-FR12-07

> *SRS Reference: FR-12 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Schedule, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Schedule and create a new schedule entry |
| 2 | Edit the schedule entry you just created (change any field) |
| 3 | Delete the schedule entry |
| 4 | Go to Sidebar > Audit Log |
| 5 | Look for the three entries related to the schedule entry |

**What should happen:**
- Three separate audit entries appear: one for the create, one for the update, and one for the delete
- Each entry shows the correct action type and details

---

#### TC-FR12-08

> *SRS Reference: FR-12 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Rooms, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Rooms and create a new room |
| 2 | Edit the room you just created (change any field) |
| 3 | Delete the room |
| 4 | Go to Sidebar > Audit Log |
| 5 | Look for the entries related to the room |

**What should happen:**
- Audit entries appear for each change made to the room (create, update, delete)
- Each entry shows the correct action type

---

#### TC-FR12-09

> *SRS Reference: FR-12 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Personnel, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Personnel and create a new person |
| 2 | Edit the person you just created (change any field) |
| 3 | Delete the person |
| 4 | Go to Sidebar > Audit Log |
| 5 | Look for the entries related to the person |

**What should happen:**
- Audit entries appear for each change made to the person (create, update, delete)
- Each entry shows the correct action type

---

#### TC-FR12-10

> *SRS Reference: FR-12 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Sections, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Sections and create a new section |
| 2 | Edit the section you just created (change any field) |
| 3 | Delete the section |
| 4 | Go to Sidebar > Audit Log |
| 5 | Look for the entries related to the section |

**What should happen:**
- Audit entries appear for each change made to the section (create, update, delete)
- Each entry shows the correct action type

---

#### TC-FR12-11

> *SRS Reference: FR-12 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Settings (Academic Year/Semester management), then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new academic year and semester |
| 2 | Edit the academic year or semester you just created |
| 3 | Delete the academic year or semester |
| 4 | Go to Sidebar > Audit Log |
| 5 | Look for the entries related to the academic year and semester |

**What should happen:**
- Audit entries appear for each change made to the academic year and semester (create, update, delete)
- Each entry shows the correct action type

---

#### TC-FR12-12

> *SRS Reference: FR-12 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Calendar, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Calendar and create a new calendar event |
| 2 | Edit the event you just created (change any field) |
| 3 | Delete the event |
| 4 | Go to Sidebar > Audit Log |
| 5 | Look for the entries related to the calendar event |

**What should happen:**
- Audit entries appear for each change made to the calendar event (create, update, delete)
- Each entry shows the correct action type

---

#### TC-FR12-13

> *SRS Reference: FR-12 AC-5*

**What you need:** Logged in, audit log entries already exist

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log and note the existing entries |
| 2 | Try to edit any audit log entry (look for an edit button or option) |

**What should happen:**
- There is no way to edit audit log entries from the interface
- The audit log is read-only — no edit or delete controls are available

---

#### TC-FR12-14

> *SRS Reference: FR-12 AC-5*

**What you need:** Logged in, audit log entries already exist

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log and note the existing entries |
| 2 | Try to delete any audit log entry (look for a delete button or option) |

**What should happen:**
- There is no way to delete audit log entries from the interface
- The audit log is read-only — no edit or delete controls are available

---

#### TC-FR12-15

> *SRS Reference: FR-12 AC-6*

**What you need:** Logged in

**Where:** Sidebar > Rooms, then Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Note the current time |
| 2 | Go to Sidebar > Rooms and create a new room |
| 3 | Go to Sidebar > Audit Log immediately |
| 4 | Find the audit entry for the room you just created |
| 5 | Check the timestamp on the audit entry |

**What should happen:**
- The audit entry appears immediately after the room is created (no delay)
- The timestamp on the audit entry matches the time the room was created

---

#### TC-FR12-16

> *SRS Reference: FR-12 AC-7*

**What you need:** Logged in, multiple audit entries of different action types exist (creates, updates, deletes)

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log |
| 2 | Use the action type filter and select "Create" |
| 3 | Review the results |

**What should happen:**
- Only entries with the "Create" action are shown
- No update, delete, or other action types appear in the results

---

#### TC-FR12-17

> *SRS Reference: FR-12 AC-7*

**What you need:** Logged in, audit entries exist for multiple entity types (rooms, schedule entries, personnel, etc.)

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log |
| 2 | Use the entity type filter and select "Schedule Entries" |
| 3 | Review the results |

**What should happen:**
- Only audit entries related to schedule entries are shown
- No entries for rooms, personnel, or other entity types appear

---

#### TC-FR12-18

> *SRS Reference: FR-12 AC-7*

**What you need:** Logged in, audit entries exist across multiple dates

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log |
| 2 | Use the date range filter and set a start date and end date |
| 3 | Review the results |

**What should happen:**
- Only entries with timestamps within the selected date range are shown
- No entries from before or after the date range appear

---

#### TC-FR12-19

> *SRS Reference: FR-12 AC-7*

**What you need:** Logged in, audit entries exist for multiple departments (e.g., SHS and College)

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log |
| 2 | Use the department filter and select "SHS" |
| 3 | Review the results |

**What should happen:**
- Only audit entries related to the SHS department are shown
- No entries for other departments appear

---

#### TC-FR12-20

> *SRS Reference: FR-12 AC-8*

**What you need:** Logged in, more than 100 audit log entries exist

**Where:** Sidebar > Audit Log

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log |
| 2 | Observe the list of entries on the first page |
| 3 | Scroll down or click the next page button to see more entries |

**What should happen:**
- The results are split across multiple pages (not all loaded at once)
- Page navigation controls are visible (e.g., next/previous buttons or page numbers)
- Each page shows a manageable number of entries

---

#### TC-FR12-21

> *SRS Reference: FR-12 AC-9*

⚠️ DEFERRED — Side-by-side comparison view for changes is not yet implemented. Currently, raw before/after snapshots are displayed.

---

#### TC-FR12-22

> *SRS Reference: FR-12, FR-19*

**What you need:** Logged in, audit log entries already exist, backup feature is available

**Where:** Sidebar > Audit Log, Sidebar > Settings > Backup

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Audit Log and note the current entries |
| 2 | Go to Sidebar > Settings > Backup and create a backup |
| 3 | Go back and make a few more changes (e.g., create a room, update a person) so new audit entries are added |
| 4 | Go to Sidebar > Settings > Backup and restore from the backup you created in step 2 |
| 5 | Go to Sidebar > Audit Log and review the entries |

**What should happen:**
- The audit log reflects the state at the time of the backup
- The entries that were added after the backup was created are no longer present (this is expected)

---

# TC_BACKUP — Backup & Restore

> **Module:** Backup & Restore (FR-19)
> **Environment:** Test on BOTH dev build and .exe installer

### Backup and Restore

*Saving and restoring copies of all your data. Includes automatic backups when closing the app.*

---

#### TC-FR19-01

> *SRS Reference: FR-19 AC-1*

**What you need:** Logged in, some data already exists (rooms, sections, etc.)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Create Backup" |
| 2 | A Windows save dialog appears |
| 3 | Choose a save location and accept the default filename |
| 4 | Click Save |

**What should happen:**
- A backup file is saved to the chosen location
- The default filename follows the pattern `schedule-manager-backup-YYYY-MM-DD-HHmmss.db`
- A success message appears confirming the backup was created

---

#### TC-FR19-02

> *SRS Reference: FR-19 AC-2*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Create Backup" |
| 2 | Look at the default filename in the save dialog |

**What should happen:**
- The default filename is date-and-time stamped (e.g., `schedule-manager-backup-2026-06-11-153000.db`)

---

#### TC-FR19-03

> *SRS Reference: FR-19 AC-3*

**What you need:** Logged in, data exists, the app is actively being used (e.g., viewing schedules)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Create Backup" while data exists in the app |
| 2 | Save the backup file |
| 3 | Open the backup file and verify the data is complete and consistent |

**What should happen:**
- The backup contains a complete, consistent snapshot of all data
- No partial or corrupted entries appear in the backup

---

#### TC-FR19-04

> *SRS Reference: FR-19 AC-4*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Note the current "Last Backup" date shown in Settings |
| 2 | Click "Create Backup" and save the file |
| 3 | Check the "Last Backup" date in Settings again |

**What should happen:**
- The "Last Backup" date updates to the current date and time

---

#### TC-FR19-05

> *SRS Reference: FR-19 AC-5*

**What you need:** Logged in, a valid backup file exists on disk

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter your current password |
| 3 | Read and confirm the warning dialog |
| 4 | Select the backup file from the file picker |

**What should happen:**
- A safety backup is automatically created before the restore begins
- The database is replaced with the backup's data
- You are logged out and redirected to the login screen
- After logging in, all data matches what was in the backup

---

#### TC-FR19-06

> *SRS Reference: FR-19 AC-6*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter an incorrect password |
| 3 | Try to proceed |

**What should happen:**
- An error message appears: "Incorrect password"
- The restore does not proceed
- No data is changed

---

#### TC-FR19-07

> *SRS Reference: FR-19 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter the correct password |
| 3 | Observe the confirmation dialog that appears |

**What should happen:**
- A warning dialog appears with a message like: "This will replace all current data. This action cannot be undone."
- The dialog has options to confirm or cancel

---

#### TC-FR19-08

> *SRS Reference: FR-19 AC-8*

**What you need:** Logged in, a valid backup file exists

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" and complete the password and confirmation steps |
| 2 | Select a backup file |
| 3 | After the restore completes, check the auto-backup list in Settings |

**What should happen:**
- A safety backup was automatically created before the restore happened
- The safety backup appears in the auto-backup list with a name like `pre-restore-{timestamp}.db`

---

#### TC-FR19-09

> *SRS Reference: FR-19 AC-9*

**What you need:** Logged in, a valid backup file exists

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter correct password and confirm |
| 3 | Select a valid backup file |

**What should happen:**
- The app checks the file before restoring
- If the file is valid, the restore proceeds normally
- If the file is damaged, an error message appears: "Not a valid database backup" and no changes are made

---

#### TC-FR19-10

> *SRS Reference: FR-19 AC-9*

**What you need:** Logged in, a corrupt/damaged file (e.g., a renamed text file with a `.db` extension)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter correct password and confirm |
| 3 | Select the corrupt file |

**What should happen:**
- An error message appears: "Not a valid database backup"
- No data is changed — your current data remains intact

---

#### TC-FR19-11

> *SRS Reference: FR-19 AC-10*

**What you need:** Logged in, a valid backup file exists

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete a full restore (password, confirm, select file) |
| 2 | Observe what happens after the restore finishes |

**What should happen:**
- You are automatically logged out
- The app redirects to the login screen
- You must log in again to continue using the app

---

#### TC-FR19-12

> *SRS Reference: FR-19 AC-11*

**What you need:** Logged in, a backup file that was created when a different password was set

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" and enter your current password |
| 2 | Confirm the warning and select the backup file |
| 3 | Observe any messages after restore completes |

**What should happen:**
- A warning appears indicating the backup may have a different password
- After restore, you must use the password that was active when the backup was created to log in

---

#### TC-FR19-13

> *SRS Reference: FR-19 AC-12*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter correct password and confirm |
| 3 | Look at the file picker dialog that appears |

**What should happen:**
- The file picker only shows `.db` files by default (other file types are filtered out)

---

#### TC-FR19-14

> *SRS Reference: FR-19 AC-13*

**What you need:** App is running with some data

**Where:** App close (close button or menu)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app normally using the close button or menu |
| 2 | Reopen the app |
| 3 | Go to Sidebar > Settings > Backup section |
| 4 | Check the auto-backup list |

**What should happen:**
- A new auto-backup file appears in the auto-backup list
- The file was created at the time the app was closed

---

#### TC-FR19-15

> *SRS Reference: FR-19 AC-14*

**What you need:** At least 5 auto-backups already exist (close and reopen the app 5 times)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app normally (this creates a 6th auto-backup) |
| 2 | Reopen the app |
| 3 | Go to Sidebar > Settings > Backup section |
| 4 | Count the auto-backups in the list |

**What should happen:**
- Only 5 auto-backup files are listed
- The oldest auto-backup was automatically removed

---

#### TC-FR19-16

> *SRS Reference: FR-19 AC-15*

**What you need:** Logged in, at least one auto-backup exists

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the auto-backup list in the Backup section |

**What should happen:**
- Each auto-backup entry shows the filename, date, and file size

---

#### TC-FR19-17

> *SRS Reference: FR-19 AC-16*

**What you need:** Logged in, at least one auto-backup exists in the list

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click restore on one of the auto-backup entries in the list |
| 2 | Enter your current password |
| 3 | Confirm the warning dialog |

**What should happen:**
- The same restore flow occurs: password check, confirmation, safety backup created, database replaced, logged out to login screen

---

#### TC-FR19-18

> *SRS Reference: FR-19 AC-17*

**What you need:** Logged in, at least one auto-backup exists in the list

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click delete on a specific auto-backup entry |
| 2 | Confirm the deletion |

**What should happen:**
- The auto-backup is removed from the list
- The file is deleted from disk

---

#### TC-FR19-19

> *SRS Reference: FR-19 AC-18*

⚠️ DEFERRED — Backup reminder notification not yet implemented. Not yet implemented.

---

#### TC-FR19-20

> *SRS Reference: FR-19 AC-3*

**What you need:** Logged in, actively adding or editing entries

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open a second window or tab and start creating multiple schedule entries |
| 2 | While entries are being added, switch to Settings and click "Create Backup" |
| 3 | Save the backup file |
| 4 | Inspect the backup's data |

**What should happen:**
- The backup contains a complete, consistent snapshot
- No partial or half-saved entries appear in the backup

---

#### TC-FR19-21

> *SRS Reference: FR-19 AC-5*

**What you need:** Logged in, data exists (rooms, sections, personnel, schedule entries)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a backup |
| 2 | Add 5 more schedule entries after the backup |
| 3 | Restore from the backup created in step 1 |
| 4 | Log in and check the schedule entries |

**What should happen:**
- Only the entries that existed at the time of the backup are present
- The 5 entries added after the backup are gone (this is expected — restore replaces everything)

---

#### TC-FR19-22

> *SRS Reference: FR-19 AC-7*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter the correct password |
| 3 | When the confirmation warning appears, click Cancel |

**What should happen:**
- The restore is cancelled
- No data is changed
- You remain on the Settings page, still logged in

---

#### TC-FR19-23

> *SRS Reference: FR-19 AC-19*

**What you need:** Logged in, a database with around 100 MB of data

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Create Backup" |
| 2 | Save the file and note how long the backup takes |

**What should happen:**
- The backup completes within 5 seconds

---

#### TC-FR19-24

> *SRS Reference: FR-19 AC-9*

**What you need:** Logged in, a non-database file (e.g., a `.txt` file renamed to `.db`, or bypassing the file filter)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Restore" |
| 2 | Enter correct password and confirm |
| 3 | Select the non-database file |

**What should happen:**
- The file fails the validity check
- An error message appears (e.g., "Not a valid database backup")
- No data is changed

---

#### TC-FR19-25

> *SRS Reference: FR-19 AC-13*

**What you need:** App is running

**Where:** App process (force close)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Force-close the app (e.g., use Task Manager to end the process) |
| 2 | Reopen the app and log in |
| 3 | Go to Sidebar > Settings > Backup section |
| 4 | Check the auto-backup list |

**What should happen:**
- No new auto-backup was created from the force-close
- Auto-backup only triggers on a normal app close

---

#### TC-FR19-26

> *SRS Reference: FR-19 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create an academic year, semester, rooms, sections, personnel, and schedule entries |
| 2 | Create a backup |
| 3 | Delete all the data you just created |
| 4 | Restore from the backup |
| 5 | Log in and check every section (rooms, sections, personnel, schedules, etc.) |

**What should happen:**
- All data from the backup is fully restored
- Academic year, semester, rooms, sections, personnel, and schedule entries all match what existed when the backup was created

---

#### TC-FR19-27

> *SRS Reference: FR-19 AC-5*

**What you need:** Logged in, two different backup files (Backup A and Backup B with different data)

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Restore from Backup A |
| 2 | Log in and verify the data matches Backup A |
| 3 | Restore from Backup B |
| 4 | Log in and verify the data matches Backup B |

**What should happen:**
- After restoring Backup A, all data matches Backup A
- After restoring Backup B, all data matches Backup B — Backup A's data is completely replaced
- Each restore fully replaces the previous state

---

#### TC-FR19-28

> *SRS Reference: FR-19 AC-5*

**What you need:** Logged in, a custom logo uploaded and footer text configured in Settings

**Where:** Sidebar > Settings > Backup section

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Note the current logo and footer text |
| 2 | Create a backup |
| 3 | Change the logo and footer text to something different |
| 4 | Restore from the backup created in step 2 |
| 5 | Log in and check the logo and footer in Settings |

**What should happen:**
- The original logo and footer text from the backup are restored
- The changes made after the backup are gone

---

# TC_TRASH — Trash & Soft Delete

### Trash
*Viewing, restoring, and permanently deleting removed items.*

---

#### TC-TRS-01

> *SRS Reference: FR-01*

**What you need:** Several items of different types (rooms, sections, personnel, academic years, semesters, calendar events, schedule entries) have been deleted from their respective pages

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Look at the items displayed on the page |

**What should happen:**
- All deleted items appear on the Trash page
- Items are grouped by type: Rooms, Sections, Personnel, Academic Years, Semesters, Calendar Events, and Schedule Entries

---

#### TC-TRS-02

> *SRS Reference: FR-01*

**What you need:** Several items of different types have been deleted

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Look at each entity type group heading |

**What should happen:**
- Each type group shows a count of how many deleted items it contains
- The counts match the actual number of items listed under each group

---

#### TC-TRS-03

> *SRS Reference: FR-01*

**What you need:** At least one room has been deleted and appears in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Find the deleted room in the list |
| 3 | Click "Restore" on that room |

**What should happen:**
- The room disappears from the Trash page
- Navigating to Sidebar > Rooms shows the restored room back in the list

---

#### TC-TRS-04

> *SRS Reference: FR-01*

**What you need:** At least one section has been deleted and appears in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Find the deleted section in the list |
| 3 | Click "Restore" on that section |

**What should happen:**
- The section disappears from the Trash page
- Navigating to Sidebar > Sections shows the restored section back in the list

---

#### TC-TRS-05

> *SRS Reference: FR-01*

**What you need:** At least one personnel has been deleted and appears in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Find the deleted personnel in the list |
| 3 | Click "Restore" on that personnel |

**What should happen:**
- The personnel disappears from the Trash page
- Navigating to Sidebar > Personnel shows the restored person back in the list

---

#### TC-TRS-06

> *SRS Reference: FR-01*

**What you need:** At least one schedule entry has been deleted and appears in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Find the deleted schedule entry in the list |
| 3 | Click "Restore" on that entry |

**What should happen:**
- The schedule entry disappears from the Trash page
- The restored entry reappears on the schedule as a Draft
- Any scheduling conflicts with the restored entry are detected and shown

---

#### TC-TRS-07

> *SRS Reference: FR-01*

**What you need:** At least one calendar event has been deleted and appears in Trash (ideally one that was previously marked as blocking)

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Find the deleted calendar event in the list |
| 3 | Click "Restore" on that event |

**What should happen:**
- The calendar event disappears from the Trash page
- The event reappears on the calendar
- If the event was a blocking event, it resumes blocking schedule entries on its date

---

#### TC-TRS-08

> *SRS Reference: FR-01*

**What you need:** At least one item appears in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Find an item in the list |
| 3 | Click "Permanently Delete" on that item |
| 4 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The item is permanently removed and disappears from the Trash page
- The item cannot be found anywhere in the app

---

#### TC-TRS-09

> *SRS Reference: FR-01*

**What you need:** At least one item appears in Trash

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Click "Permanently Delete" on an item |

**What should happen:**
- A confirmation dialog appears with the message "This action cannot be undone. Are you sure?" (or similar warning)
- The item is not deleted until the dialog is confirmed

---

#### TC-TRS-10

> *SRS Reference: FR-01*

**What you need:** At least one active item exists (e.g., a room on the Rooms page)

**Where:** Sidebar > Rooms (or any page with deletable items)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Delete an item from its page (e.g., delete a room from the Rooms page) |
| 2 | Observe the bottom of the screen |

**What should happen:**
- A snackbar appears at the bottom showing "Item deleted" with an "Undo" button
- The snackbar remains visible for 10 seconds

---

#### TC-TRS-11

> *SRS Reference: FR-01*

**What you need:** An item was just deleted and the undo snackbar is visible at the bottom of the screen

**Where:** Any page where the undo snackbar is showing

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Undo" on the snackbar within 10 seconds |

**What should happen:**
- The snackbar disappears
- The item reappears in its original location on the page
- The item does not appear in Sidebar > Trash

---

#### TC-TRS-12

> *SRS Reference: FR-01*

**What you need:** An item was just deleted and the undo snackbar is visible at the bottom of the screen

**Where:** Any page where the undo snackbar is showing

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Wait 10 seconds without clicking anything on the snackbar |

**What should happen:**
- The snackbar disappears automatically after 10 seconds
- The deleted item remains in Sidebar > Trash

---

#### TC-TRS-13

> *SRS Reference: FR-01*

**What you need:** Items have been sitting in Trash beyond the retention period

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Click "Purge Expired" (or wait for automatic purge to run) |

**What should happen:**
- Items that have been in Trash longer than the retention period are permanently removed
- Items still within the retention period remain in Trash

---

#### TC-TRS-14

> *SRS Reference: FR-01*

**What you need:** A room has been deleted from the Rooms page

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Rooms" in the sidebar |
| 2 | Look through the list of rooms |

**What should happen:**
- The deleted room does not appear in the rooms list
- Only active, non-deleted rooms are shown

---

#### TC-TRS-15

> *SRS Reference: FR-01*

**What you need:** A room has been deleted (it appears in Trash)

**Where:** Schedule entry form (creating or editing a schedule entry)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the form to create or edit a schedule entry |
| 2 | Click the room dropdown |
| 3 | Look through the available room options |

**What should happen:**
- The deleted room does not appear in the room dropdown
- Only active rooms are available for selection

---

#### TC-TRS-16

> *SRS Reference: FR-01*

**What you need:** A personnel member has been deleted (they appear in Trash)

**Where:** Schedule entry form (creating or editing a schedule entry)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the form to create or edit a schedule entry |
| 2 | Click the personnel dropdown |
| 3 | Look through the available personnel options |

**What should happen:**
- The deleted personnel does not appear in the personnel dropdown
- Only active personnel are available for selection

---

#### TC-TRS-17

> *SRS Reference: FR-01*

**What you need:** A section has been deleted (it appears in Trash)

**Where:** Schedule entry form (creating or editing a schedule entry)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the form to create or edit a schedule entry |
| 2 | Click the section dropdown |
| 3 | Look through the available section options |

**What should happen:**
- The deleted section does not appear in the section dropdown
- Only active sections are available for selection

---

#### TC-TRS-18

> *SRS Reference: FR-01*

**What you need:** No items have been deleted (Trash is empty)

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |

**What should happen:**
- The Trash page shows an empty state message such as "Trash is empty"
- No item groups or counts are displayed

---

#### TC-TRS-19

> *SRS Reference: FR-01, FR-12*

**What you need:** At least one item appears in Trash; audit log is accessible

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Click "Restore" on an item |
| 3 | Navigate to the audit log |

**What should happen:**
- The audit log contains a new entry recording the restore action
- The entry identifies which item was restored

---

#### TC-TRS-20

> *SRS Reference: FR-01, FR-12*

**What you need:** At least one item appears in Trash; audit log is accessible

**Where:** Sidebar > Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Trash" in the sidebar |
| 2 | Click "Permanently Delete" on an item |
| 3 | Confirm the deletion in the confirmation dialog |
| 4 | Navigate to the audit log |

**What should happen:**
- The audit log contains a new entry recording the permanent deletion
- The entry identifies which item was permanently deleted

---

# TC_EDGE_CASES — Cross-Cutting Edge Cases

> **Module:** Cross-cutting edge case and stress testing
> **Prefix:** TC-EDG
> **Last Updated:** 2026-06-11

---

### System Reliability
*Testing how the app handles unusual situations, extreme values, and error conditions.*

---

#### TC-EDG-001

> *SRS Reference: FR-19*

**What you need:** The app is open and working normally

**Where:** Sidebar > Settings > Backup

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Start a manual backup |
| 2 | While the backup is still running, open Task Manager and force-kill the app |
| 3 | Relaunch the app |

**What should happen:**
- The app starts up cleanly with no errors
- The original database is intact and all data is still there
- A partial backup file may exist in the backup folder, but it is not loaded or used by the app

---

#### TC-EDG-002

> *SRS Reference: FR-19*

**What you need:** The app is open and a backup file is available to restore

**Where:** Sidebar > Settings > Backup

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Start a restore from a backup file |
| 2 | While the restore is still running, open Task Manager and force-kill the app |
| 3 | Relaunch the app |

**What should happen:**
- A safety backup was created before the restore began
- The app uses either the safety backup or the original database — no corrupted state
- All previously existing data is accessible

---

#### TC-EDG-003

> *SRS Reference: FR-15*

**What you need:** The app is open with a valid CSV file containing 100 rows ready to import

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Upload the CSV file and proceed through preview |
| 2 | Click commit to start importing the 100 rows |
| 3 | While the import is still running, open Task Manager and force-kill the app |
| 4 | Relaunch the app and check the data |

**What should happen:**
- No partial data was written — it is all-or-nothing
- Either all 100 rows are present, or none of them are
- The app starts cleanly with no errors

---

#### TC-EDG-004

> *SRS Reference: FR-11*

**What you need:** The app is open with 50 draft schedule entries ready to publish

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select all 50 draft entries and click publish |
| 2 | While the publish is still running, open Task Manager and force-kill the app |
| 3 | Relaunch the app and check the entries |

**What should happen:**
- The entries are either all published or all still in draft — no mix of states
- The app starts cleanly with no errors

---

#### TC-EDG-005

> *SRS Reference: NFR-R*

**What you need:** The app is closed; access to the app's data folder where the database file is stored

**Where:** App launch (desktop shortcut or start menu)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app completely |
| 2 | Navigate to the app's data folder and open the database file in a hex editor |
| 3 | Change some bytes in the middle of the file to corrupt it, then save |
| 4 | Launch the app |

**What should happen:**
- The app detects that the database is corrupted
- An error message is displayed explaining the problem
- The app suggests restoring from a backup

---

#### TC-EDG-006

> *SRS Reference: FR-17*

**What you need:** The app is closed; access to the app's data folder where the database file is stored

**Where:** App launch (desktop shortcut or start menu)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app completely |
| 2 | Navigate to the app's data folder and delete the database file |
| 3 | Launch the app |

**What should happen:**
- The app creates a fresh new database automatically
- The first-run setup screen is displayed
- The app is fully functional with an empty database

---

#### TC-EDG-007

> *SRS Reference: ADR-002*

**What you need:** The app is open with some data

**Where:** App launch (desktop shortcut or start menu)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app normally (not force-kill) |
| 2 | Navigate to the app's data folder and check for any extra database files (files ending in -wal or -journal) |
| 3 | Relaunch the app |

**What should happen:**
- The database is in a consistent state after a clean close
- Extra database files (-wal, -journal) may exist but do not cause any issues
- The app launches normally with all data intact

---

#### TC-EDG-008

> *SRS Reference: Arch constraint*

**What you need:** The app is already running

**Where:** Desktop (start menu or shortcut)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | With the app already open, try to launch a second instance of the app |

**What should happen:**
- The second instance does not open
- The already-running instance is brought to the front / given focus
- No error messages or crashes occur

---

#### TC-EDG-009

> *SRS Reference: ADR-002*

**What you need:** The app is running; an external database tool (e.g., DB Browser for SQLite) is installed

**Where:** App remains open in the background

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the app's database file in an external database tool |
| 2 | Insert a new row into any table using the external tool |
| 3 | Switch back to the app and navigate to the corresponding page |

**What should happen:**
- The app does not crash
- The externally inserted row may or may not appear in the app (not guaranteed)
- All existing data remains intact and the app continues to work normally

---

#### TC-EDG-010

> *SRS Reference: FR-09 AC-15*

**What you need:** A semester configured that spans longer than 200 days; the app is open

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new schedule entry with daily recurrence in the long semester |
| 2 | Save the entry |
| 3 | Check how many occurrences were generated |

**What should happen:**
- The recurrence is capped at exactly 200 occurrences
- No more than 200 individual schedule entries are generated, even if the semester is longer

---

#### TC-EDG-011

> *SRS Reference: FR-15 AC-7*

**What you need:** A CSV file with exactly 1000 rows prepared; the app is open

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Upload the 1000-row CSV file |
| 2 | Review the preview to confirm all rows are shown |
| 3 | Click commit to import |

**What should happen:**
- All 1000 rows are processed and imported successfully
- The import completes within a reasonable time (no timeout)
- The imported data appears correctly in the relevant pages

---

#### TC-EDG-012

> *SRS Reference: FR-15 AC-6*

**What you need:** A CSV file that is exactly 5 MB in size; the app is open

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Upload the 5 MB CSV file |

**What should happen:**
- The file is accepted without any file-size error
- The preview screen loads with the file contents

---

#### TC-EDG-013

> *SRS Reference: FR-19 AC-14*

**What you need:** The app has been closed and reopened enough times that 5 automatic backups already exist in the backup folder

**Where:** App close and reopen (desktop shortcut or start menu)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app (triggering a 6th automatic backup) |
| 2 | Navigate to the backup folder and count the backup files |

**What should happen:**
- Only 5 backup files remain in the folder
- The oldest backup has been deleted
- The newest backup is the one just created

---

#### TC-EDG-014

> *SRS Reference: FR-22 AC-3*

**What you need:** The app is open; an export is ready to configure

**Where:** Export modal (from Sidebar > Schedule or Sidebar > Exams, then click Export)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the export modal |
| 2 | Add 5 signatories to the export |
| 3 | Try to add a 6th signatory |

**What should happen:**
- All 5 signatories are added successfully
- The "Add" button is disabled after the 5th signatory
- No 6th signatory can be added

---

#### TC-EDG-015

> *SRS Reference: FR-23 AC-2*

**What you need:** The app is open

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the footer credit field |
| 2 | Enter exactly 200 characters and save |
| 3 | Clear the field, enter 201 characters, and try to save |

**What should happen:**
- The 200-character footer credit is accepted and saved
- The 201-character input is rejected with a validation message

---

#### TC-EDG-016

> *SRS Reference: FR-08 AC-6*

**What you need:** The app is open

**Where:** Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create or edit a personnel entry |
| 2 | Set the maximum weekly hours to 80 and save |
| 3 | Edit the entry again and set the maximum weekly hours to 81 and try to save |

**What should happen:**
- The 80-hour value is accepted and saved successfully
- The 81-hour value is rejected with a validation message

---

#### TC-EDG-017

> *SRS Reference: FR-21 AC-2*

**What you need:** Two image files prepared: one exactly 2 MB and one slightly over 2 MB (e.g., 2.1 MB); the app is open

**Where:** Sidebar > Settings (logo upload section)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Upload the 2 MB image as the logo |
| 2 | Then try to upload the 2.1 MB image as the logo |

**What should happen:**
- The 2 MB image is accepted and displayed as the logo
- The 2.1 MB image is rejected with a file-size error message

---

#### TC-EDG-018

> *SRS Reference: Cross-cutting*

**What you need:** The app is open and logged in

**Where:** Sidebar > Rooms, then Sidebar > Personnel, then Sidebar > Sections, then Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Rooms and create a room named "Salón 101 — Edificio Ñ" |
| 2 | Go to Personnel and create a person named "José María Ñ. Pérez" |
| 3 | Go to Sections and create a section named "Sección A — Matemáticas 数学" |
| 4 | Go to Schedule and create an event named "Día de Muertos 🎃" |
| 5 | Visit each page and verify the names display correctly |

**What should happen:**
- All four entities are created successfully with their full unicode names
- Names with accented characters, special symbols, Chinese characters, and emoji display correctly everywhere they appear
- No garbled text or missing characters on any page

---

#### TC-EDG-019

> *SRS Reference: NFR-S*

**What you need:** The app is open and logged in

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new room |
| 2 | In the room code field, type exactly: `'; DROP TABLE rooms; --` |
| 3 | Save the room |

**What should happen:**
- The room is created successfully with the code displayed exactly as typed: `'; DROP TABLE rooms; --`
- No database tables are dropped or affected
- The app continues working normally with all data intact

---

#### TC-EDG-020

> *SRS Reference: NFR-S*

**What you need:** The app is open and logged in

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new room |
| 2 | In the room name field, type exactly: `<script>alert('xss')</script>` |
| 3 | Save the room |
| 4 | View the room in the list and detail views |

**What should happen:**
- The room is saved with the name shown as literal text: `<script>alert('xss')</script>`
- No popup or alert box appears
- The text is displayed as-is, not executed as code

---

#### TC-EDG-021

> *SRS Reference: FR-06*

**What you need:** The app is open and logged in

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new room |
| 2 | In the room name field, type a very long name (500 characters) |
| 3 | Save the room |
| 4 | View the room in the list and detail views |

**What should happen:**
- The room is saved if the name is within the allowed character limit
- The list view handles the long name without breaking the layout (text may be truncated with "...")
- The detail view shows the full name

---

#### TC-EDG-022

> *SRS Reference: Cross-cutting*

**What you need:** The app is open and logged in

**Where:** Sidebar > Rooms, Sidebar > Personnel, Sidebar > Sections

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create or edit entities across different pages (rooms, personnel, sections) |
| 2 | In each description field, enter 500 characters of text |
| 3 | Save each entity |
| 4 | View the entities in both list and detail views |

**What should happen:**
- All 500-character descriptions are accepted and saved
- List views show truncated descriptions (with "..." or similar)
- Detail views show the full description text

---

#### TC-EDG-023

> *SRS Reference: NFR-U*

**What you need:** A fresh install of the app with first-run setup completed but no data entered

**Where:** Every page in the sidebar: Rooms, Sections, Personnel, Schedule, Exams, Calendar, Templates, Audit Log, Trash

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to each page listed above, one by one |
| 2 | On each page, observe what is displayed |

**What should happen:**
- Every page shows a meaningful empty-state message (e.g., "No rooms yet" or "Nothing to display")
- No page crashes, shows a blank white screen, or displays a broken layout
- The app remains fully functional and navigable

---

#### TC-EDG-024

> *SRS Reference: FR-09*

**What you need:** A fresh install with no rooms, sections, or personnel created

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Schedule page |
| 2 | Try to create a new schedule entry |

**What should happen:**
- The app provides guidance that rooms, sections, and personnel need to be created first
- Dropdowns for rooms, sections, and personnel are empty or the form shows a helpful message
- No crash or confusing error occurs

---

#### TC-EDG-025

> *SRS Reference: FR-01*

**What you need:** The app has SHS-only resources (rooms, sections, personnel not shared with College)

**Where:** Department switcher (top of sidebar), then Sidebar > Rooms, Sidebar > Sections, Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Navigate to Rooms and check the list |
| 3 | Navigate to Sections and check the list |
| 4 | Navigate to Personnel and check the list |
| 5 | Open any dropdown that lists rooms, sections, or personnel |

**What should happen:**
- SHS-only rooms, sections, and personnel do not appear in any College list or dropdown
- Only College-specific and shared resources are visible

---

#### TC-EDG-026

> *SRS Reference: FR-01*

**What you need:** The app has College-only resources (rooms, sections, personnel not shared with SHS)

**Where:** Department switcher (top of sidebar), then Sidebar > Rooms, Sidebar > Sections, Sidebar > Personnel

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to SHS |
| 2 | Navigate to Rooms and check the list |
| 3 | Navigate to Sections and check the list |
| 4 | Navigate to Personnel and check the list |
| 5 | Open any dropdown that lists rooms, sections, or personnel |

**What should happen:**
- College-only rooms, sections, and personnel do not appear in any SHS list or dropdown
- Only SHS-specific and shared resources are visible

---

#### TC-EDG-027

> *SRS Reference: Arch*

**What you need:** The app is open

**Where:** Department switcher (top of sidebar)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the active department to College |
| 2 | Close the app completely |
| 3 | Reopen the app |
| 4 | Check which department is active |

**What should happen:**
- The app remembers that College was the active department
- College is still selected after restarting — the user does not have to switch again

---

#### TC-EDG-028

> *SRS Reference: Cross-cutting*

**What you need:** The app is running

**Where:** Any page (e.g., Sidebar > Schedule)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | While the app is open, go to your computer's date/time settings |
| 2 | Change the system clock forward by 1 day |
| 3 | Switch back to the app and create a new schedule entry |
| 4 | Save the entry |

**What should happen:**
- The app does not crash or freeze
- The new entry uses the current system time for its timestamp
- All existing data remains intact

---

#### TC-EDG-029

> *SRS Reference: Cross-cutting*

**What you need:** The app is running; the system is near a daylight saving time transition date

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a schedule entry on the date when daylight saving time changes |
| 2 | Save the entry |
| 3 | View the entry and verify the time is correct |

**What should happen:**
- The time is stored and displayed correctly
- No hour is skipped or repeated due to the clock change
- The entry appears at the expected time

---

#### TC-EDG-030

> *SRS Reference: ADR-002, NFR-R*

**What you need:** The app is running and actively being used (data being entered or saved)

**Where:** Any page where data is being entered (e.g., Sidebar > Schedule)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Begin entering or saving data in the app |
| 2 | While the save is in progress, simulate a power failure by force-killing the app process in Task Manager |
| 3 | Restart the app |

**What should happen:**
- All previously saved data is preserved and intact
- At most, only the current unsaved action is lost
- The app starts up cleanly with no database errors

---

# TC_NFR — Non-Functional Requirements

> **Module:** Performance, Security, Usability, Reliability, Data Integrity, Packaging
> **SRS Reference:** NFR-P-001 through NFR-K-004 (38 NFRs)
> **Prefix:** TC-NFR
> **Last Updated:** 2026-06-12

---

### Performance and Security

*Verifying the app meets speed, security, and usability standards.*

---

#### TC-NFR-001

> *SRS Reference: NFR-P-001*

**What you need:** App is fully closed (not running in system tray or background)

**Where:** Desktop shortcut or Start Menu

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Start a stopwatch or timer |
| 2 | Double-click the app icon to launch it |
| 3 | Stop the timer when the login screen or dashboard appears and is ready to use |

**What should happen:**
- The app opens and shows a usable screen (login or dashboard) within 3 seconds of clicking

---

#### TC-NFR-002

> *SRS Reference: NFR-P-002*

**What you need:** Logged in, at least 50 rooms already created. Dev build with DevTools available (Ctrl+Shift+I)

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I and go to the Performance tab |
| 2 | Start recording in DevTools |
| 3 | Navigate to the Rooms page to trigger the list to load |
| 4 | Stop recording and check the time taken for the list to appear |

**What should happen:**
- The rooms list loads and displays within 100 milliseconds

---

#### TC-NFR-003

> *SRS Reference: NFR-P-003*

**What you need:** Logged in, dev build with DevTools available (Ctrl+Shift+I)

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I and go to the Performance tab |
| 2 | Start recording in DevTools |
| 3 | Create a new schedule entry by filling in the form and clicking Save |
| 4 | Stop recording and check the time taken from clicking Save to seeing the confirmation |

**What should happen:**
- The save completes (including any conflict checking) within 200 milliseconds

---

#### TC-NFR-004

> *SRS Reference: NFR-P-004*

**What you need:** Logged in, schedule data set up so a new entry would trigger all possible conflict checks (overlapping times, same room, same instructor, etc.). Dev build with DevTools available

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I and go to the Performance tab |
| 2 | Start recording in DevTools |
| 3 | Create a schedule entry that overlaps with existing entries in every possible way |
| 4 | Stop recording and check how long the conflict detection took |

**What should happen:**
- All conflicts are detected and reported within 300 milliseconds

---

#### TC-NFR-005

> *SRS Reference: NFR-P-005*

**What you need:** Logged in, a saved template that generates 100 schedule entries when applied

**Where:** Sidebar > Schedule (template application)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Start a stopwatch or timer |
| 2 | Select the large template and click Apply |
| 3 | Stop the timer when all 100 entries appear on the schedule |

**What should happen:**
- All 100 entries are created and displayed within 3 seconds

---

#### TC-NFR-006

> *SRS Reference: NFR-P-006*

**What you need:** Logged in, at least 200 schedule entries exist in the current view

**Where:** Sidebar > Schedule (export function)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Start a stopwatch or timer |
| 2 | Click Export and choose the Excel (.xlsx) format |
| 3 | Choose a save location in the file dialog and confirm |
| 4 | Stop the timer when the export completes and the file is saved |

**What should happen:**
- The Excel file is generated and saved within 5 seconds

---

#### TC-NFR-007

> *SRS Reference: NFR-P-007*

**What you need:** Logged in, the database has been in use (size under 100 MB)

**Where:** Sidebar > Settings > Backup

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Start a stopwatch or timer |
| 2 | Click the Create Backup button |
| 3 | Choose a save location in the file dialog and confirm |
| 4 | Stop the timer when the backup completes |

**What should happen:**
- The backup file is created within 5 seconds

---

#### TC-NFR-008

> *SRS Reference: NFR-P-008*

**What you need:** Logged in, an active semester spanning a long period (e.g., several months)

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new recurring schedule entry set to repeat Daily across the entire semester |
| 2 | Save the entry |
| 3 | Check how many occurrences were generated |

**What should happen:**
- The system creates no more than 200 occurrences, even if the date range would produce more
- If a hard conflict is found after 50 occurrences, the system stops generating further occurrences early

---

#### TC-NFR-009

> *SRS Reference: NFR-S-001*

**What you need:** App is running but you are NOT logged in (on the login screen). Dev build with DevTools available

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I |
| 2 | Go to the Console tab |
| 3 | Try to call a protected app function (e.g., listing rooms) directly from the console without logging in |

**What should happen:**
- The request is rejected with an "Authentication required" error
- No data is returned

---

#### TC-NFR-010

> *SRS Reference: NFR-S-001*

**What you need:** App is running, on the login screen (not logged in)

**Where:** Login screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Observe that the login screen loads and is functional without being logged in |
| 2 | Type the password and click Login |
| 3 | Confirm the app transitions to the dashboard |

**What should happen:**
- The login screen, setup check, and login functions all work without needing prior authentication
- These are the only functions accessible before logging in

---

#### TC-NFR-011

> *SRS Reference: NFR-S-002*

**What you need:** App running in dev build

**Where:** Any page (DevTools)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I |
| 2 | Go to the Console tab |
| 3 | Type `require('fs')` and press Enter |
| 4 | Type `process.env` and press Enter |

**What should happen:**
- Both commands fail with an error
- The app does not allow direct access to system files or environment variables from the interface

---

#### TC-NFR-012

> *SRS Reference: NFR-S-002*

**What you need:** App running in dev build

**Where:** Any page (DevTools)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I |
| 2 | Go to the Console tab |
| 3 | Try typing any system-level command like `process.exit()` or `require('child_process')` |

**What should happen:**
- All system-level commands are blocked
- The app window does not have access to underlying system functions from the interface

---

#### TC-NFR-013

> *SRS Reference: NFR-S-004*

**What you need:** App has been set up (initial password created). An external database viewer tool (e.g., DB Browser for SQLite)

**Where:** Outside the app — open the database file directly with a database viewer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app |
| 2 | Open the app's database file using a database viewer tool |
| 3 | Find the settings table and look at the stored password value |

**What should happen:**
- The password is stored as an encrypted hash (a long string of random-looking characters), NOT as the actual password you typed
- The stored value is unreadable and cannot be reversed to the original password

---

#### TC-NFR-014

> *SRS Reference: NFR-S-005*

**What you need:** Logged in

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | In the Room Code field, type: `'; DROP TABLE rooms; --` |
| 3 | Fill in remaining required fields and click Save |
| 4 | Go back to the Rooms list |

**What should happen:**
- The room is either saved with the unusual characters as its literal code, or rejected with a validation error
- The rooms list still works and all existing rooms are intact
- No data is lost or corrupted

---

#### TC-NFR-015

> *SRS Reference: NFR-S-003*

**What you need:** App has been used (audit log entries exist). An external database viewer tool

**Where:** Outside the app — open the database file directly with a database viewer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Close the app |
| 2 | Open the app's database file using a database viewer tool |
| 3 | Try to edit (update) any row in the audit log table |
| 4 | Try to delete any row in the audit log table |

**What should happen:**
- Both the edit and the delete are blocked by the database
- Audit log entries cannot be changed or removed by any means

---

#### TC-NFR-016

> *SRS Reference: NFR-S-006*

**What you need:** Logged in, dev build with DevTools available

**Where:** Any page where an error can be triggered

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I |
| 2 | Perform an action that causes an error (e.g., try to save invalid data) |
| 3 | Check the error message shown in the app and in DevTools |

**What should happen:**
- The app shows a clean, user-friendly error message
- No file paths, code details, or technical stack traces are visible in the app interface

---

#### TC-NFR-017

> *SRS Reference: NFR-U-001*

**What you need:** App is running

**Where:** App window (any page)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Grab the corner or edge of the app window |
| 2 | Try to drag it smaller than 1024 pixels wide and 768 pixels tall |

**What should happen:**
- The window stops resizing and will not go smaller than 1024×768
- Content is never cut off or hidden due to the window being too small

---

#### TC-NFR-018

> *SRS Reference: NFR-U-003*

**What you need:** Logged in

**Where:** Various pages (Rooms, Schedule, Settings)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to a list page (e.g., Sidebar > Rooms) and watch for a loading indicator while data loads |
| 2 | Save a new item and watch for a loading indicator during the save |
| 3 | Trigger an export and watch for a loading indicator during file generation |

**What should happen:**
- A spinner or loading animation appears during each operation
- The user always knows the app is working and not frozen

---

#### TC-NFR-019

> *SRS Reference: NFR-U-003*

**What you need:** Logged in

**Where:** Sidebar > Rooms

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Fill in all required fields with valid data |
| 3 | Click Save |

**What should happen:**
- A success toast notification appears (e.g., "Room created successfully")
- The toast disappears after a few seconds automatically

---

#### TC-NFR-020

> *SRS Reference: NFR-U-005*

**What you need:** Logged in

**Where:** Sidebar > Rooms (or any form page)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Leave required fields blank or enter invalid data |
| 3 | Click Save |

**What should happen:**
- Error messages appear next to the specific fields that have problems
- The messages clearly explain what needs to be fixed

---

#### TC-NFR-021

> *SRS Reference: NFR-U-004*

**What you need:** Logged in, no data exists yet for the page being tested (e.g., no rooms created)

**Where:** Sidebar > Rooms (or any list page with no data)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to a list page that has no items |

**What should happen:**
- A helpful empty state message is shown (e.g., "No rooms found. Create one to get started.")
- The page does not appear broken or blank

---

#### TC-NFR-022

> *SRS Reference: NFR-U-006*

**What you need:** Logged in, both departments (SHS and College) are available

**Where:** App header (visible on all pages)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the top of the app for the department switcher (SHS/College toggle) |
| 2 | Navigate to Sidebar > Rooms and confirm the switcher is visible |
| 3 | Navigate to Sidebar > Schedule and confirm the switcher is still visible |
| 4 | Navigate to Sidebar > Settings and confirm the switcher is still visible |

**What should happen:**
- The department switcher (SHS/College toggle) is always visible in the header area on every page
- It never disappears when navigating between pages

---

#### TC-NFR-023

> *SRS Reference: NFR-U-007*

**What you need:** Logged in

**Where:** Any page with export, import, or backup functions

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Schedule and click Export |
| 2 | Observe the file save dialog that opens |
| 3 | Go to Sidebar > Settings > Backup and click Create Backup |
| 4 | Observe the file save dialog that opens |

**What should happen:**
- A standard Windows file dialog appears (the same kind used by other Windows programs)
- The dialog is NOT a custom in-app popup

---

#### TC-NFR-024

> *SRS Reference: NFR-U-008*

**What you need:** Logged in

**Where:** Any page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Press Ctrl+N to test the "new item" shortcut |
| 2 | If a modal or form opens, press Escape to close it |
| 3 | Press Ctrl+F to test the search shortcut |

**What should happen:**
- Ctrl+N opens a new item form or modal
- Escape closes any open modal or dialog
- Ctrl+F opens or focuses the search bar

---

#### TC-NFR-025

> *SRS Reference: NFR-U-008*

**What you need:** Logged in, a large number of draft schedule entries exist (enough that publishing takes more than 5 seconds)

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select all draft entries for bulk publishing |
| 2 | Click the Publish button |
| 3 | Observe the screen while the operation runs |

**What should happen:**
- A progress indicator appears showing the operation is in progress
- The interface is locked (buttons are disabled) while the operation is running to prevent accidental actions
- The progress indicator disappears when the operation finishes

---

#### TC-NFR-026

> *SRS Reference: NFR-R-001*

**What you need:** Logged in, dev build with DevTools available. Set up conditions where saving a schedule entry might partially fail

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new schedule entry with valid data |
| 2 | Click Save |
| 3 | Check the schedule list to see if the entry was saved |
| 4 | Check the audit/history log to see if the action was recorded |

**What should happen:**
- Either BOTH the schedule entry AND the audit log entry are saved, or NEITHER is saved
- There should never be a schedule entry without a matching audit log record, or vice versa

---

#### TC-NFR-027

> *SRS Reference: NFR-R-003*

**What you need:** Logged in, a template that generates 50 schedule entries

**Where:** Sidebar > Schedule (template application)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Apply the template that generates 50 entries |
| 2 | If the operation succeeds, verify all 50 entries appear |
| 3 | If the operation fails partway through, check how many entries were created |

**What should happen:**
- If the template application succeeds, all 50 entries are created
- If it fails for any reason, NO entries are created (it does not leave behind a partial set like 25 out of 50)

---

#### TC-NFR-028

> *SRS Reference: NFR-R-007*

**What you need:** Logged in, dev build with DevTools available

**Where:** Any page (DevTools Console)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I |
| 2 | Trigger different types of errors (e.g., submit an empty form, try to access a deleted item, try an action while logged out) |
| 3 | Check the error responses in the DevTools Console |

**What should happen:**
- All error responses follow the same consistent format
- Each error includes a clear error code and a human-readable message
- No errors return raw technical details or inconsistent formats

---

#### TC-NFR-029

> *SRS Reference: NFR-D-006*

**What you need:** Logged in, at least one academic year with semesters linked to it

**Where:** Sidebar > Academic Years (or Settings > Academic Years)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to delete an academic year that still has semesters assigned to it |

**What should happen:**
- The deletion is rejected with an error message explaining that semesters still depend on this academic year
- The academic year and all its semesters remain intact

---

#### TC-NFR-030

> *SRS Reference: NFR-D-003*

**What you need:** Logged in, dev build with DevTools available

**Where:** Sidebar > Rooms (DevTools Console)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open DevTools with Ctrl+Shift+I |
| 2 | Try to create a room directly through the console with invalid data (e.g., a negative capacity like -1) |

**What should happen:**
- The app rejects the invalid data with a validation error, even though the request bypassed the form
- Validation is enforced at the app level, not just in the form fields

---

#### TC-NFR-031

> *SRS Reference: NFR-D-004*

**What you need:** Logged in, items of various types exist (rooms, instructors, subjects, schedule entries, etc.)

**Where:** Various list pages (Rooms, Instructors, Subjects, Schedule)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Rooms and delete a room |
| 2 | Go to Sidebar > Instructors and delete an instructor |
| 3 | Go to Sidebar > Subjects and delete a subject |
| 4 | For each deletion, check if the item disappears from the main list |
| 5 | Check the Trash page to see if deleted items appear there |

**What should happen:**
- Deleted items disappear from the main list but appear in the Trash
- Items are not permanently destroyed — they are moved to Trash
- Only the "Permanently Delete" action from Trash actually removes data for good

---

#### TC-NFR-032

> *SRS Reference: NFR-D*

**What you need:** Logged in, an external database viewer tool

**Where:** Outside the app — open the database file directly with a database viewer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create several items in the app (rooms, instructors, etc.) |
| 2 | Close the app |
| 3 | Open the database file in a database viewer |
| 4 | Check the ID column for each table |

**What should happen:**
- All IDs are long, unique random strings (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
- No IDs are simple sequential numbers like 1, 2, 3

---

#### TC-NFR-033

> *SRS Reference: NFR-K-001*

**What you need:** A clean Windows 10 or 11 computer (or virtual machine) that has never had this app installed. The .exe installer file built from the project

**Where:** Windows Desktop (outside the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Copy the .exe installer to the clean Windows machine |
| 2 | Double-click the installer to run it |
| 3 | Follow the installation prompts |
| 4 | After installation completes, launch the app from the Start Menu or desktop shortcut |

**What should happen:**
- The installer runs without errors
- The app installs successfully
- The app launches and shows the initial setup or login screen

---

#### TC-NFR-034

> *SRS Reference: NFR-K-003*

**What you need:** App installed with existing data (rooms, schedules, etc. already created). A newer version of the .exe installer

**Where:** Windows Desktop (outside the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the app and note what data exists (rooms, schedules, settings) |
| 2 | Close the app |
| 3 | Run the newer version installer over the existing installation |
| 4 | After the update completes, launch the app |
| 5 | Check that all previously noted data is still present |

**What should happen:**
- All data from the previous version is still present after the update
- No rooms, schedules, or settings are lost
- The app functions normally with the existing data

---

## 5. Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-12 | QA Team | Initial draft â€” 750+ test cases covering all 23 functional requirements |

---

> **Document Rules:**
> - This document is generated from the SRS acceptance criteria. When the SRS is updated, affected test cases must be updated to match.
> - Test IDs (TC-FRXX-YY) are permanent â€” never renumber them. If a test is removed, mark it as "Removed" instead of deleting it.
> - Steps must be written in plain language. Do not use technical terms like API, endpoint, HTTP, database, status code, etc. Describe what the user sees and does on screen.
> - "What you need" must describe the setup in plain terms. Say "Logged in" not "Authenticated with admin role".
> - **"Where" must specify the exact page or screen** using the sidebar label as it appears in the app (e.g., "Sidebar > Schedule", "Sidebar > Settings"). For pages not in the sidebar, describe how to reach them (e.g., "Login screen", "Setup screen on first launch").
> - "What should happen" must describe visible outcomes â€” a message, a page change, a button appearing, a number changing.
> - When filing a bug, always include the test ID (e.g., "Bug found in TC-FR09-04").
> - **Depends on:** SRS document (docs/SRS_ScheduleManagement_v1.0.md). When the SRS version changes, review this test plan for affected test cases.
