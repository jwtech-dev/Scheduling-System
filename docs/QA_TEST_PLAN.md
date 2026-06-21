# QA Test Plan

> **Project:** Schedule Management System
> **Version:** 2.0
> **Last Updated:** 2026-06-17
> **Authors:** QA Team
> **SRS Version:** v1.0 — this test plan was generated from this SRS version
> **App:** Desktop Application (Windows — launch via `npm run dev`)

---

## 1. What Is This Document?

This guide tells you **what to test** and **how to test it**, step by step. You don't need any technical knowledge to follow it — just the app running on your Windows computer.

Each test has:
- A **test ID** (e.g., TC-AUTH-03) — use this when reporting bugs
- **What you need before starting** — any setup or conditions
- **Where** — the exact page or screen in the app where you perform this test
- **Steps** — what to click, type, or do
- **What should happen** — what you should see on screen if the app is working correctly

**If the app does something different from what's described** -> file a bug report and include the test ID.

### 1.1 Testing Scope & Type

**Test type:** Manual black-box functional testing from a user's perspective

**What is covered:**

| Area | Details |
|------|---------|
| Desktop application | All features listed in the SRS (v1.0) — 746 functional test cases across 19 user-journey sections |
| End-to-end flows | 4 complete user journeys testing multiple features together |
| Negative scenarios | Invalid inputs, unauthorized access, boundary conditions |
| Edge cases | Rapid clicks, special characters, long inputs, concurrent actions |

**What is NOT covered by this test plan:**

| Area | Why |
|------|-----|
| Performance profiling | Requires developer tools (DevTools) — see Developer Verification Tests appendix |
| Security vulnerability testing | Requires specialized penetration testing tools |
| Database inspection | Requires database browser tools — see Developer Verification Tests appendix |
| Automated testing | This is a manual test plan |
| API / IPC testing | Internal communication channels are not visible to users |

**Excluded features (if any):**

- *None — all SRS v1.0 features are covered in this test plan*

---

## 2. Before You Start

> **Important:** Start with the **Setting Up Your App** section. You will set up the app and create your admin password there. This password is used for all other tests.

**You need:**
- A Windows 10 or 11 computer
- The app running via `npm run dev` (development testing)

**Testing order:**
1. **Setting Up Your App** — do these first (you'll set up the app and create your password here)
2. **Managing the School Year** — do these second (other features depend on having an active academic year and semester)
3. All other sections can be done in any order after that

**Two departments:**
This app manages schedules for two departments: **SHS** (Senior High School) and **College**. You switch between them using the department toggle in the top header. Some tests ask you to test in a specific department or both.

**Test data conventions:**

| What | Standard Test Values |
|------|---------------------|
| Admin Password | Admin123 (default after setup), Test1234 (for password change tests) |
| SHS Academic Year | Start: June 2026, Label: `2026-2027` |
| College Academic Year | Start: August 2026, Label: `2026-2027` |
| Room | Code: `RM-101`, Name: `Room 101`, Capacity: 40 |
| Section (SHS) | Code: `SHS-11-STEM-A`, Strand: STEM, Grade Level: 11, Students: 40 |
| Section (College) | Code: `BSIT-3A`, Program: BSIT, Year Level: 3rd Year, Students: 35 |
| Personnel | Employee ID: `EMP-001`, Name: `Juan Dela Cruz`, Max Hours: 40 |
| Schedule Entry | Activity: CLASS, Day: Monday, Time: 08:00-09:00, Room: RM-101, Recurrence: Weekly |

---

## 3. How to Report a Bug

When a test fails (the app does something different from `What should happen`), report it in the **bug_report_qa** Excel sheet.

**How to fill in the sheet:**

| Column | What to write |
|--------|---------------|
| **Issue Count** | The next number in sequence |
| **FR-AC ID** | The test ID from this document (e.g., TC-AUTH-01) |
| **Description** | A short summary of the problem (e.g., `Schedule entry form shows error after clicking Save with all fields filled`) |
| **Reported By** | Your name |
| **Log Date** | Today's date |
| **Status** | `Open` |
| **Resource Person** | Leave blank — the development team will assign this |
| **Resolution** | Leave blank — filled in after the bug is fixed |
| **Remarks** | Describe **only what actually happened** on screen (see examples below) |

> **You do NOT need to write what was expected.** The expected result is already in the test case's `What should happen` section. The development team will look it up using the TC ID.

> **Do NOT suggest fixes or changes.** The requirements (SRS) are already approved. Just describe what you saw.

**Bad vs good Remarks:**

| ❌ Bad | ✅ Good |
|--------|--------|
| `It doesn't work.` | `After clicking Save, a loading spinner appears but the page never loads. Waited 2 minutes.` |
| `Error on the page.` | `A red error banner appears at the top saying 'Something went wrong' after I click 'Create Entry'.` |
| `Should show the schedule.` | `The Schedule page shows an empty list even though I just created an entry in the previous step.` |

**How to retest a fixed bug:**

When the development team marks a bug as fixed, go back to the test case in this document (e.g., TC-AUTH-01) and re-run the steps. If the app now matches `What should happen`, the bug is fixed.

---

## 4. Test Cases

*Test cases are grouped by user journey. Each section focuses on a part of the app that a real user would use together.*

---

### Setting Up Your App

*First-run setup, password creation, login/logout, and session behavior. Complete this section first — you need to set up the app before any other tests.*

---

#### TC-AUTH-01

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

#### TC-AUTH-02

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

#### TC-AUTH-03

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

#### TC-AUTH-04

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

#### TC-AUTH-05

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
- The form is compact and inline â€” not a multi-step wizard

---

#### TC-AUTH-06

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

#### TC-AUTH-07

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

#### TC-AUTH-08

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

#### TC-AUTH-09

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

#### TC-AUTH-10

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

#### TC-AUTH-11

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

#### TC-AUTH-12

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

#### TC-AUTH-13

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

#### TC-AUTH-14

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

#### TC-AUTH-15

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

#### TC-AUTH-16

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

#### TC-AUTH-17

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

#### TC-AUTH-18

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

#### TC-AUTH-19

> *SRS Reference: FR-17 AC-18*

**What you need:** Setup has already been completed once

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Complete the first-time setup normally |
| 2 | Try to access the setup screen again (e.g., relaunch the app or navigate back) |

**What should happen:**
- The setup screen does not appear â€” the app shows the login screen instead
- If setup is somehow triggered again, the app displays an error: "Setup has already been completed."

---

#### TC-AUTH-20

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

#### TC-AUTH-21

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

#### TC-AUTH-22

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

#### TC-AUTH-23

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

#### TC-AUTH-24

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

#### TC-AUTH-25

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

#### TC-AUTH-26

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

#### TC-AUTH-27

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

#### TC-AUTH-28

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

#### TC-AUTH-29

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

#### TC-AUTH-30

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

#### TC-AUTH-31

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

#### TC-AUTH-32

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

#### TC-AUTH-33

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

#### TC-AUTH-34

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

#### TC-AUTH-35

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

#### TC-AUTH-36

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

#### TC-AUTH-37

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

#### TC-AUTH-38

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

#### TC-AUTH-39

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
- The lockout lasts 5 minutes (300 seconds) â€” this is the maximum
- Further failures do not increase the lockout beyond 5 minutes

---

#### TC-AUTH-40

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

#### TC-AUTH-41

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
- Login succeeds immediately â€” the lockout counter is cleared when the app is closed

---

#### TC-AUTH-42

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

#### TC-AUTH-43

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

#### TC-AUTH-44

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
- You must re-enter your password â€” the previous session is not remembered

---

#### TC-AUTH-45

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

#### TC-AUTH-46

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

#### TC-AUTH-47

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

#### TC-AUTH-48

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

#### TC-AUTH-49

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

#### TC-AUTH-50

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

#### TC-AUTH-51

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

#### TC-AUTH-52

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

#### TC-AUTH-53

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

#### TC-AUTH-54

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

#### TC-AUTH-55

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

#### TC-AUTH-56

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

#### TC-AUTH-57

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

#### TC-AUTH-58

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

#### TC-AUTH-59

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

#### TC-AUTH-60

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

#### TC-AUTH-61

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

#### TC-AUTH-62

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

#### TC-AUTH-63

> *SRS Reference: FR-18 AC-15*

**What you need:** Logged in to the app

**Where:** All sidebar items (Dashboard, Schedule, Exams, Calendar, Rooms, Sections, Personnel, Templates, Import, Export, Audit Log, Trash, Settings)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to every page in the sidebar |
| 2 | Try using features on each page |

**What should happen:**
- All features are fully accessible â€” there are no extra permission checks, role restrictions, or access levels
- Everything works for the single admin user without any additional authorization steps

---

#### TC-AUTH-64

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

#### TC-AUTH-65

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter a very long password â€” 500 characters â€” that includes uppercase, lowercase, and a number (e.g., "Aa1" followed by 497 "x" characters) |
| 2 | Enter the same password in the Confirm Password field |
| 3 | Click "Complete Setup" |

**What should happen:**
- Setup completes successfully without errors
- The password is saved and can be used to log in

---

#### TC-AUTH-66

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

#### TC-AUTH-67

> *SRS Reference: FR-17 AC-4*

**What you need:** A fresh install (no setup completed yet)

**Where:** Setup screen

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Enter "PÃ sswÃ¶rd1" in both password fields (contains accented characters) |
| 2 | Click "Complete Setup" |
| 3 | Log in with "PÃ sswÃ¶rd1" |

**What should happen:**
- Setup completes successfully
- Login with the accented-character password works

---

#### TC-AUTH-68

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

#### TC-AUTH-69

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

#### TC-AUTH-70

> *SRS Reference: FR-17 AC-9*

**What you need:** A fresh install where the app's internal update files are missing from the expected location

**Where:** Desktop (launch the app)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Remove or rename the database update files from the app's installation folder |
| 2 | Launch the app |

**What should happen:**
- The app handles the missing files gracefully â€” no crash
- The setup screen still appears

---

#### TC-AUTH-71

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

#### TC-AUTH-72

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

#### TC-AUTH-73

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

#### TC-AUTH-74

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

#### TC-AUTH-75

> *SRS Reference: FR-17 AC-1*

**What you need:** A fresh install of the app

**Where:** Desktop

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app (instance A â€” the setup screen appears) |
| 2 | Without closing instance A, try to launch the app a second time |

**What should happen:**
- The second instance is blocked from opening
- The first instance receives focus instead
- Only one copy of the app can run at a time

---

---

### Changing Your Settings

*Updating the admin password and managing account settings from the Settings page.*

---

#### TC-SET-01

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

#### TC-SET-02

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

#### TC-SET-03

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

#### TC-SET-04

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

#### TC-SET-05

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

#### TC-SET-06

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

#### TC-SET-07

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

#### TC-SET-08

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

---

### Managing the School Year

*Creating academic years, managing semesters/quarters, and setting the active term. Complete this section second — other features depend on having an active academic year and semester.*

---

#### TC-ACAD-01

> *SRS Reference: FR-02 AC-10*

**What you need:** Logged in, SHS department selected, no existing SHS academic years

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Confirm the label and end date are automatically filled in |
| 4 | Select Grade 11 Term Structure as "Two-Semester" |
| 5 | Select Grade 12 Term Structure as "Trimestral" |
| 6 | Click Save |

**What should happen:**
- A new academic year appears in the list with label "2025–2026"
- The end date shows March 31, 2026
- The status shows as Published
- The term structures are shown as: G11: Two-Semester, G12: Trimestral
- It is marked as the active academic year

---

#### TC-ACAD-02

> *SRS Reference: FR-02 AC-13*

**What you need:** Logged in, College department selected, no existing College academic years

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 1, 2025 |
| 3 | Confirm the label and end date are automatically filled in |
| 4 | Click Save |

**What should happen:**
- A new academic year appears in the list with label "2025â€“2026"
- The end date shows May 31, 2026
- The status shows as Published
- It is marked as the active academic year

---

#### TC-ACAD-03

> *SRS Reference: FR-02 AC-10*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 15, 2025 |
| 3 | Look at the Label field |

**What should happen:**
- The label field shows "2025â€“2026"
- The label field cannot be edited (it is read-only)

---

#### TC-ACAD-04

> *SRS Reference: FR-02 AC-12*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-05

> *SRS Reference: FR-02 AC-13*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-06

> *SRS Reference: FR-02 AC-8*

**What you need:** Logged in, SHS department selected, academic years exist for both SHS and College

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Look at the list of academic years |

**What should happen:**
- Only SHS academic years are shown
- College academic years are not visible

---

#### TC-ACAD-07

> *SRS Reference: FR-02 AC-8*

**What you need:** Logged in, academic years exist for both SHS and College

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College using the department switcher in the header |
| 2 | Navigate to the Academic Years page |

**What should happen:**
- Only College academic years are shown
- SHS academic years are not visible

---

#### TC-ACAD-08

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" exists with 2 semesters

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Find the "2025â€“2026" row in the list |
| 3 | Check the Semester Count column |

**What should happen:**
- The Semester Count column displays "2"

---

#### TC-ACAD-09

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, at least one academic year exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |
| 2 | Look at the table columns |

**What should happen:**
- The following columns are visible: Label, Start Date, End Date, Status, Semester Count

---

#### TC-ACAD-10

> *SRS Reference: FR-02 AC-10*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the "2025â€“2026" row or its detail button |

**What should happen:**
- The detail view opens showing: Department (SHS), Label ("2025â€“2026"), Start Date, End Date, Status
- A list of linked semesters is shown below the details

---

#### TC-ACAD-11

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, a Draft SHS academic year exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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
- The label changes to "2026â€“2027"
- The end date is recalculated to match the new start date

---

#### TC-ACAD-12

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, a Draft SHS academic year "2026â€“2027" exists with no semesters

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the "2026â€“2027" academic year |
| 2 | Click Delete |
| 3 | Confirm the deletion |

**What should happen:**
- The academic year no longer appears in the active list
- It has been moved to Trash

---

#### TC-ACAD-13

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, SHS department selected, SHS academic year with 2 semesters exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the academic year detail page |
| 2 | Look at the semesters section |

**What should happen:**
- Both semesters are listed
- Each semester shows its type, dates, and status correctly

---

#### TC-ACAD-14

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" is Published and active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2026 |
| 3 | Click Save |

**What should happen:**
- A new academic year "2026â€“2027" is created with Draft status
- The new academic year is not marked as active
- The existing "2025â€“2026" academic year remains Published and active

---

#### TC-ACAD-15

> *SRS Reference: FR-02*

**What you need:** Logged in, an archived academic year exists in Trash

**Where:** Sidebar > Trash
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-16

> *SRS Reference: FR-02 AC-9*

**What you need:** Logged in, SHS department selected, 20 or more academic years exist for SHS

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-17

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-18

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-19

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-20

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-21

> *SRS Reference: FR-02 AC-3*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-22

> *SRS Reference: FR-02 AC-3*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-23

> *SRS Reference: FR-02 AC-4*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" already exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 15, 2025 (which produces the label "2025â€“2026") |
| 3 | Click Save |

**What should happen:**
- An error message appears: label "2025â€“2026" already exists for SHS
- The academic year is not created

---

#### TC-ACAD-24

> *SRS Reference: FR-02 AC-4*

**What you need:** Logged in, SHS academic year "2025â€“2026" already exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College using the department switcher in the header |
| 2 | Click "Add Academic Year" |
| 3 | Select the start date as August 1, 2025 (which produces the label "2025â€“2026") |
| 4 | Click Save |

**What should happen:**
- The academic year is created successfully with label "2025â€“2026"
- The same label is allowed across different departments

---

#### TC-ACAD-25

> *SRS Reference: FR-02 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" (June 1, 2025 to March 31, 2026) exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-26

> *SRS Reference: FR-02 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" (June 1, 2025 to March 31, 2026) exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2026 (which produces "2026â€“2027") |
| 3 | Click Save |

**What should happen:**
- The academic year is created successfully â€” no overlap with the existing one
- "2026â€“2027" appears in the list

---

#### TC-ACAD-27

> *SRS Reference: FR-02 AC-12*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2025 |
| 3 | Observe the end date field |

**What should happen:**
- The end date is automatically set to March 31, 2026
- The end date field cannot be manually changed to a different value (e.g., May 31, 2026)
- The system enforces the correct SHS end date (June start â†’ March end)

---

#### TC-ACAD-28

> *SRS Reference: FR-02 AC-13*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 1, 2025 |
| 3 | Observe the end date field |

**What should happen:**
- The end date is automatically set to May 31, 2026
- The end date field cannot be manually changed to a different value (e.g., March 31, 2026)
- The system enforces the correct College end date (August start â†’ May end)

---

#### TC-ACAD-29

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" has a 1st Semester ending October 30

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select and edit academic year "2025â€“2026" |
| 2 | Try to change the end date to October 1, 2025 (before the semester ends) |
| 3 | Click Save |

**What should happen:**
- An error message appears: cannot shorten the academic year below the dates of its existing semesters
- The change is not saved

---

#### TC-ACAD-30

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, Draft SHS academic year "2025â€“2026" has a 1st Semester ending October 30

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-31

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published academic year |
| 2 | Try to delete it |

**What should happen:**
- An error message appears: "Cannot delete a published academic year."
- The academic year remains in the list

---

#### TC-ACAD-32

> *SRS Reference: FR-02 AC-6*

**What you need:** Logged in, College academic year "2025â€“2026" is active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to SHS using the department switcher in the header |
| 2 | Create an SHS academic year "2025â€“2026" |
| 3 | Switch back to College using the department switcher |

**What should happen:**
- The College academic year "2025â€“2026" is unchanged â€” still active, same status
- Creating an academic year in one department does not affect the other department

---

#### TC-ACAD-33

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-34

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-35

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS has zero academic years

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-36

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" is Published and active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 1, 2026 |
| 3 | Click Save |

**What should happen:**
- The new academic year "2026â€“2027" is created with Draft status
- It is not marked as active
- The existing "2025â€“2026" remains Published and active

---

#### TC-ACAD-37

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" is active but its end date has passed, Draft academic year "2026â€“2027" exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft academic year "2026â€“2027" |
| 2 | Click Publish |

**What should happen:**
- "2026â€“2027" changes to Published status and becomes the active academic year
- "2025â€“2026" is no longer marked as active

---

#### TC-ACAD-38

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" is active with end date in the future, Draft "2026â€“2027" exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft academic year "2026â€“2027" |
| 2 | Click Publish |

**What should happen:**
- An error message appears: "Cannot publish until the current academic year ends on [date]."
- "2026â€“2027" remains in Draft status

---

#### TC-ACAD-39

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" is active (its end date has passed), Draft "2026â€“2027" is ready to publish

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click Publish on "2026â€“2027" |
| 2 | Check the status of "2025â€“2026" |

**What should happen:**
- "2025â€“2026" is no longer marked as active
- "2026â€“2027" is now the active academic year
- Only one academic year is active at a time

---

#### TC-ACAD-40

> *SRS Reference: FR-02 AC-6*

**What you need:** Logged in, SHS has a Draft academic year ready to publish, College academic year "2025â€“2026" is active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | With SHS selected, publish the Draft academic year |
| 2 | Switch to College using the department switcher |
| 3 | Check the College academic year status |

**What should happen:**
- College academic year "2025â€“2026" remains active and unchanged
- Publishing in SHS does not affect College

---

#### TC-ACAD-41

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the already-Published academic year |
| 2 | Try to click Publish again |

**What should happen:**
- An error message appears: "Academic year is already published."
- No change occurs

---

#### TC-ACAD-42

> *SRS Reference: FR-02 AC-7*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published academic year |
| 2 | Try to edit the label, start date, or end date |

**What should happen:**
- An error message appears: "Cannot edit a published academic year."
- The fields cannot be changed

---

#### TC-ACAD-43

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Published SHS academic year exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published academic year |
| 2 | Try to delete it |

**What should happen:**
- An error message appears: "Cannot delete a published academic year."
- The academic year remains in the list

---

#### TC-ACAD-44

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, SHS department selected, a Draft SHS academic year exists with no semesters

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-45

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new academic year |
| 2 | Open the activity log or audit history |

**What should happen:**
- An audit entry appears showing that the academic year was created
- The entry includes the details of the new academic year

---

#### TC-ACAD-46

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, a Draft academic year exists that is ready to publish (the current active academic year has ended)

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Publish the Draft academic year |
| 2 | Open the activity log or audit history |

**What should happen:**
- An audit entry appears showing the status changed from Draft to Published
- The entry captures both the before and after states

---

#### TC-ACAD-47

> *SRS Reference: FR-02 AC-8*

**What you need:** Logged in, SHS department selected, SHS has no academic years

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Academic Years page |

**What should happen:**
- An empty state is displayed (e.g., "No academic years found" or an empty table)

---

#### TC-ACAD-48

> *SRS Reference: FR-02 AC-1*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as June 30, 2025 (last day of June) |
| 3 | Click Save |

**What should happen:**
- The academic year is created successfully with label "2025â€“2026"
- The end date is March 31, 2026
- June 30 is accepted because it is still in June

---

#### TC-ACAD-49

> *SRS Reference: FR-02 AC-2*

**What you need:** Logged in, College department selected

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Select the start date as August 31, 2025 (last day of August) |
| 3 | Click Save |

**What should happen:**
- The academic year is created successfully with label "2025â€“2026"
- The end date is May 31, 2026
- August 31 is accepted because it is still in August

---

#### TC-ACAD-50

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, an academic year exists with 2 semesters, several schedule entries, and a calendar event

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-51

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, an academic year exists with no semesters and no schedule entries

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the academic year |
| 2 | Click Delete |
| 3 | Look at the deletion warning that appears |

**What should happen:**
- The warning shows no related items would be affected (e.g., "0 semesters, 0 schedule entries, 0 calendar events")

---

#### TC-ACAD-52

> *SRS Reference: FR-02 AC-5*

**What you need:** Logged in, an archived academic year exists in Trash with no linked records

**Where:** Sidebar > Trash
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-53

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" is Published and active

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select Grade Level: Grade 11 (Term Type automatically resolves to "Two-Semester") |
| 3 | Select type: 1st Semester |
| 4 | Enter start date: June 15, 2025 |
| 5 | Enter end date: October 30, 2025 |
| 6 | Enter Q1 End Date: August 15, 2025 |
| 7 | Click Save |

**What should happen:**
- The semester is created and appears in the Grade 11 semester list group
- Quarter 1 spans June 15 to August 15
- Quarter 2 spans August 16 to October 30
- The status is Published and it is marked as the active semester (since it's the first)

---

#### TC-ACAD-54

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" exists, 1st Semester is already active

**Where:** Sidebar > Academic > Academic year "2025–2026" detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select Grade Level: Grade 11 (Term Type automatically resolves to "Two-Semester") |
| 3 | Select type: 2nd Semester |
| 4 | Enter start date: November 1, 2025 |
| 5 | Enter end date: March 15, 2026 |
| 6 | Enter Q3 End Date: January 15, 2026 |
| 7 | Click Save |

**What should happen:**
- The semester is created with Draft status (because a sibling semester is active)
- Quarter 3 spans November 1 to January 15
- Quarter 4 spans January 16 to March 15

---

#### TC-ACAD-55

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, College department selected, College academic year "2025â€“2026" is Published and active

**Where:** Sidebar > Academic > Academic year "2025â€“2026" detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-56

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, College department selected, College academic year "2025â€“2026" exists, 1st Semester is already active

**Where:** Sidebar > Academic > Academic year "2025â€“2026" detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-57

> *SRS Reference: FR-03 AC-5*

**What you need:** Logged in, College department selected, College academic year "2025â€“2026" exists

**Where:** Sidebar > Academic > Academic year "2025â€“2026" detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-58

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, an academic year exists with no semesters

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-59

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, an academic year exists with one active semester

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-60

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year with 2 semesters exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the semesters view for the academic year |

**What should happen:**
- Semesters are grouped under their parent academic year
- Each semester shows its type, status, start and end dates
- SHS semesters also show quarter boundary dates

---

#### TC-ACAD-61

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, a Draft SHS semester exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-62

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, SHS department selected, a Draft SHS 1st Semester with a Q1 boundary exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-63

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Draft semester exists with no schedule entries

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-64

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new semester |
| 2 | Open the activity log or audit history |

**What should happen:**
- An audit entry appears showing that the semester was created

---

#### TC-ACAD-65

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, College department selected, College semesters exist

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | View the semester list |

**What should happen:**
- No Q1 End Date or Q3 End Date columns are visible
- College semesters do not show quarter-related information

---

#### TC-ACAD-66

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, SHS department selected, SHS semesters exist

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | View the semester list |

**What should happen:**
- Quarter boundary date columns are visible and populated
- The Q1/Q3 End Date columns show the correct dates

---

#### TC-ACAD-67

> *SRS Reference: FR-03 AC-4*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Try to select Summer as the semester type |

**What should happen:**
- Either Summer is not available in the dropdown, or selecting it and saving shows an error: "Summer semester is not available for SHS."
- The Summer semester is not created

---

#### TC-ACAD-68

> *SRS Reference: FR-03 AC-4*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Open the semester type dropdown |

**What should happen:**
- Only "1st Semester" and "2nd Semester" are available
- "Summer" is not listed as an option

---

#### TC-ACAD-69

> *SRS Reference: FR-03 AC-5*

**What you need:** Logged in, College department selected, College academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Open the semester type dropdown |

**What should happen:**
- Three options are available: "1st Semester", "2nd Semester", and "Summer"

---

#### TC-ACAD-70

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 1st Semester |
| 3 | Look at the form fields |

**What should happen:**
- A "Q1 End Date" field is visible and editable

---

#### TC-ACAD-71

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Look at the form fields |

**What should happen:**
- A "Q3 End Date" field is visible and editable

---

#### TC-ACAD-72

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, College department selected, College academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-73

> *SRS Reference: FR-03 AC-7*

**What you need:** Logged in, College department selected, College academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-74

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, creating a 1st Semester under an SHS academic year

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-75

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, creating a 2nd Semester under an SHS academic year

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-76

> *SRS Reference: FR-03 AC-4 AC-5*

**What you need:** Logged in, academic years exist for both SHS and College

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to College, open the College academic year, create a Summer semester â†’ should succeed |
| 2 | Switch to SHS using the department switcher, open the SHS academic year, try to create a Summer semester |

**What should happen:**
- The College Summer semester is created successfully
- The SHS Summer semester is rejected with the message: "Summer semester is not available for SHS."

---

#### TC-ACAD-77

> *SRS Reference: FR-03 AC-13*

**What you need:** Logged in, SHS 1st Semester is active with 5 unpublished draft schedule entries, Draft 2nd Semester exists, 1st Semester period has ended

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-78

> *SRS Reference: FR-03 AC-13*

**What you need:** Logged in, 1st Semester is active with 0 draft schedule entries, Draft 2nd Semester exists, 1st Semester period has ended

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |

**What should happen:**
- No advisory checklist is displayed (or it shows 0 drafts)
- The activation proceeds without interruption

---

#### TC-ACAD-79

> *SRS Reference: FR-03 AC-1*

**What you need:** Logged in, SHS department selected, SHS academic year with an existing 1st Semester

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-80

> *SRS Reference: FR-03 AC-2*

**What you need:** Logged in, SHS department selected, SHS academic year runs June 1, 2025 to March 31, 2026

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-81

> *SRS Reference: FR-03 AC-3*

**What you need:** Logged in, SHS department selected, SHS academic year runs June 1, 2025 to March 31, 2026

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-82

> *SRS Reference: FR-03 AC-2*

**What you need:** Logged in, SHS department selected, SHS academic year exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-83

> *SRS Reference: FR-03 AC-12*

**What you need:** Logged in, SHS department selected, SHS academic year with 1st Semester running June 15 to October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-84

> *SRS Reference: FR-03 AC-12*

**What you need:** Logged in, SHS department selected, SHS academic year with 1st Semester running June 15 to October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Semester" |
| 2 | Select type: 2nd Semester |
| 3 | Enter start date: November 1, 2025 (no overlap) |
| 4 | Enter end date: March 15, 2026 |
| 5 | Click Save |

**What should happen:**
- The semester is created successfully â€” no overlap with the 1st Semester

---

#### TC-ACAD-85

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-86

> *SRS Reference: FR-03 AC-9*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-87

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-88

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-89

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-90

> *SRS Reference: FR-03 AC-8*

**What you need:** Logged in, SHS department selected, creating 1st Semester with start date June 15 and end date October 30

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-91

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Published semester exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published semester |
| 2 | Try to edit the start date or end date |

**What should happen:**
- An error message appears: "Cannot edit a published semester."
- The fields cannot be changed

---

#### TC-ACAD-92

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Published semester exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published semester |
| 2 | Try to delete it |

**What should happen:**
- An error message appears: "Cannot delete a published semester."
- The semester remains in the list

---

#### TC-ACAD-93

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active but its end date has passed, Draft 2nd Semester exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |

**What should happen:**
- The 2nd Semester changes to Published status and becomes the active semester
- The 1st Semester is no longer marked as active

---

#### TC-ACAD-94

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active with end date in the future, Draft 2nd Semester exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Draft 2nd Semester |
| 2 | Click Publish |

**What should happen:**
- An error message appears: "Cannot publish until the current semester ends on [date]."
- The 2nd Semester remains in Draft status

---

#### TC-ACAD-95

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, a Published semester exists

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the Published semester |
| 2 | Try to click Publish again |

**What should happen:**
- An error message appears: "Semester is already published."
- No change occurs

---

#### TC-ACAD-96

> *SRS Reference: FR-03 AC-6*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active, 2nd Semester is ready to publish (1st Semester period has ended)

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-97

> *SRS Reference: FR-03 AC-2*

**What you need:** Logged in, SHS department selected, SHS academic year runs June 1, 2025 to March 31, 2026

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

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

#### TC-ACAD-98

> *SRS Reference: FR-03 AC-11*

**What you need:** Logged in, SHS department selected, SHS academic year exists with no semesters

**Where:** Sidebar > Academic > Academic year detail page
**? How to Use:** Log in, click "Academic" in the sidebar, click on a specific Academic Year from the list to open its details. In the Semesters section, click "Add Semester" to add, or the edit icon next to a semester to edit.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the academic year detail page |
| 2 | Look at the semesters section |

**What should happen:**
- An empty state is shown (no semesters listed)

---

#### TC-ACAD-99

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS academic year "2025â€“2026" is active, 1st Semester is active with Q1 End Date set to August 15, 2025

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active academic year shows "2025â€“2026"
- The active semester shows "1st Semester"
- The current quarter (Q1 or Q2) is displayed based on today's date relative to August 15

---

#### TC-ACAD-100

> *SRS Reference: FR-04 AC-2*

**What you need:** Logged in, College department selected, College academic year "2025â€“2026" is active, 2nd Semester is active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active academic year shows "2025â€“2026"
- The active semester shows "2nd Semester"
- No quarter information is displayed (College does not have quarters)

---

#### TC-ACAD-101

> *SRS Reference: FR-04 AC-3*

**What you need:** Logged in, SHS department selected, SHS has no active academic year (none exist or all are inactive)

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- No active academic year is shown
- No active semester is shown
- No quarter information is displayed

---

#### TC-ACAD-102

> *SRS Reference: FR-04 AC-4*

**What you need:** Logged in, College department selected, College academic year "2025â€“2026" is active, but no active semester exists within it

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active academic year shows "2025â€“2026"
- No active semester is shown
- No quarter information is displayed

---

#### TC-ACAD-103

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active with Q1 End Date set to August 15, 2025; today's date is before August 15

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q1"

---

#### TC-ACAD-104

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 1st Semester is active with Q1 End Date set to August 15, 2025; today's date is after August 15

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q2"

---

#### TC-ACAD-105

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 2nd Semester is active with Q3 End Date set to January 15, 2026; today's date is before January 15

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q3"

---

#### TC-ACAD-106

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS 2nd Semester is active with Q3 End Date set to January 15, 2026; today's date is after January 15

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The current quarter shows "Q4"

---

#### TC-ACAD-107

> *SRS Reference: FR-04 AC-2*

**What you need:** Logged in, College department selected, College Summer semester is active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Look at the active term display on the page |

**What should happen:**
- The active semester shows "Summer"
- No quarter information is displayed (Summer has no quarters)

---

#### TC-ACAD-108

> *SRS Reference: FR-04 AC-1*

**What you need:** Logged in, SHS academic year is active; College has no active academic year

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | With SHS selected, look at the active term display â€” it shows the active academic year and semester |
| 2 | Switch to College using the department switcher in the header |
| 3 | Look at the active term display |

**What should happen:**
- SHS shows full active term information (academic year, semester, quarter)
- College shows no active term information
- Each department's active term is independent of the other

---

#### TC-ACAD-109

> *SRS Reference: FR-04 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year is active but has no active semester

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Class schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created

---

#### TC-ACAD-110

> *SRS Reference: FR-04 AC-6*

**What you need:** Logged in, College department selected, College academic year is active but has no active semester

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Exam schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created

---

#### TC-ACAD-111

> *SRS Reference: FR-04 AC-7*

**What you need:** Logged in, SHS department selected, SHS academic year is active but has no active semester

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Office Hours schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created

---

#### TC-ACAD-112

> *SRS Reference: FR-04 AC-8*

**What you need:** Logged in, SHS department selected, SHS academic year is active but has no active semester

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new Meeting schedule entry |

**What should happen:**
- The Meeting is created successfully
- Meetings only require an active academic year, not an active semester

---

#### TC-ACAD-113

> *SRS Reference: FR-04 AC-5*

**What you need:** Logged in, SHS department selected, SHS has no active academic year at all

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Class schedule entry |

**What should happen:**
- An error message appears: "An active semester must be set before creating schedule entries."
- The schedule entry is not created (no academic year means no semester either)

---

#### TC-ACAD-114

> *SRS Reference: FR-04 AC-8*

**What you need:** Logged in, SHS department selected, SHS has no active academic year at all

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Try to create a new Meeting schedule entry |

**What should happen:**
- The Meeting is blocked â€” Meetings require at least an active academic year
- An error message appears indicating no active academic year is set

---

#### TC-ACAD-115

> *SRS Reference: FR-04 AC-5*

**What you need:** Logged in, SHS department selected, SHS academic year is active with an active semester and existing Class entries

**Where:** Sidebar > Academic, then Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Academic and publish a new academic year (after the current one has ended) |
| 2 | The previous academic year is deactivated automatically |
| 3 | Go to Sidebar > Schedule |
| 4 | Try to create a new Class entry under the new academic year (which has no semester yet) |

**What should happen:**
- The new Class entry is blocked â€” the new academic year has no active semester
- Existing entries from the previous academic year are unaffected
- An error message appears about needing an active semester

---

#### TC-ACAD-116

> *SRS Reference: FR-04 AC-1 AC-5*

**What you need:** Logged in, SHS department selected, fresh department with no data

**Where:** Sidebar > Academic, then Sidebar > Schedule
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Sidebar > Academic and create an SHS academic year (it auto-publishes and activates) |
| 2 | Add a 1st Semester with a Q1 boundary (it auto-publishes and activates) |
| 3 | Check the active term display â€” it should show the academic year, semester, and quarter |
| 4 | Go to Sidebar > Schedule and create a Class entry |
| 5 | Create an Exam entry |

**What should happen:**
- All steps succeed without errors
- The active term display shows complete information (academic year, semester, and quarter)
- Both Class and Exam entries are created successfully without being blocked

---

#### TC-ACAD-117

> *SRS Reference: FR-03 AC-6, FR-04 AC-1*

**What you need:** Logged in, SHS department selected, SHS academic year is active, 1st Semester is active, 1st Semester period has ended, Draft 2nd Semester exists

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-118

> *SRS Reference: FR-04 AC-3*

**What you need:** Logged in, SHS department selected, Draft academic year "2027â€“2028" exists alongside the active "2026â€“2027"

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Delete the Draft academic year "2027â€“2028" |
| 2 | Check the active term display |

**What should happen:**
- The active term still shows "2026â€“2027" and its active semester
- Deleting a Draft academic year does not disrupt the active term

---

#### TC-ACAD-119

> *SRS Reference: FR-04 AC-1 AC-2*

**What you need:** Logged in, SHS academic year "2025â€“2026" with 1st Semester active; College academic year "2025â€“2026" with 2nd Semester active

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

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

#### TC-ACAD-120

> *SRS Reference: FR-04 AC-3*

**What you need:** Logged in, SHS department selected, SHS academic year "2025–2026" was active but has been deleted (moved to Trash)

**Where:** Sidebar > Academic
**? How to Use:** Log in, click "Academic" in the sidebar. To add an Academic Year, click "Add Academic Year". To edit, click on the edit icon next to an Academic Year in the list.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Check the active term display |

**What should happen:**
- No active academic year is shown
- No active semester or quarter is shown
- A deleted academic year is excluded from the active term

---

#### TC-ACAD-121

> *SRS Reference: FR-02 AC-10, FR-02 AC-13*

**What you need:** Logged in, SHS department selected

**Where:** Sidebar > Academic > Add Academic Year

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Academic Year" |
| 2 | Set Start Date as June 1, 2026 |
| 3 | Look at the "Term Structure per Grade Level" section |
| 4 | Verify that Grade 11 and Grade 12 dropdowns default to "— Not set —" |
| 5 | Set Grade 11 to "Two-Semester" and Grade 12 to "Trimestral" |
| 6 | Click Save |

**What should happen:**
- The new Academic Year is created successfully
- In the Academic Years table, the "Term" column displays G11: Two-Semester, G12: Trimestral

---

#### TC-ACAD-122

> *SRS Reference: FR-03 AC-10, FR-03 AC-12*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" exists with Grade 11 set to "Two-Semester" and no semesters created yet

**Where:** Sidebar > Academic > Academic Year "2026–2027" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the detail page for "2026–2027" |
| 2 | Locate the Grade 11 card under Semesters (shows "No semesters yet. Click 'Configure' to set dates and create them.") |
| 3 | Click "Configure Two-Semester Semesters" |
| 4 | Look at the preview modal that appears |
| 5 | Verify that 1st Semester and 2nd Semester are listed |
| 6 | Verify that 1st Semester Start Date is disabled and prefilled with the Academic Year start date (June 1, 2026) |
| 7 | Verify that 2nd Semester End Date is disabled and prefilled with the Academic Year end date (March 31, 2027) |
| 8 | Verify that Q1 Start Date is disabled and matches 1st Semester Start Date (June 1, 2026) |
| 9 | Verify that Q2 End Date is disabled and matches 1st Semester End Date |
| 10 | Click Cancel |

**What should happen:**
- The modal closes without any errors
- No semesters are created or saved to the database

---

#### TC-ACAD-123

> *SRS Reference: FR-03 AC-10, FR-03 AC-13*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" exists with Grade 12 set to "Trimestral" and no semesters created yet

**Where:** Sidebar > Academic > Academic Year "2026–2027" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the detail page for "2026–2027" |
| 2 | Locate the Grade 12 card under Semesters |
| 3 | Click "Configure Trimestral Semesters" |
| 4 | Look at the preview modal that appears |
| 5 | Verify that 3 semesters are shown: 1st Semester, 2nd Semester, and 3rd Semester |
| 6 | Verify that 1st Semester Start Date is disabled and prefilled (June 1, 2026) |
| 7 | Verify that 3rd Semester End Date is disabled and prefilled (March 31, 2027) |
| 8 | Verify that no Quarter fields or sections are displayed |
| 9 | Click Cancel |

**What should happen:**
- The modal closes and no semesters are created

---

#### TC-ACAD-124

> *SRS Reference: FR-03 AC-10, FR-03 AC-12*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" exists with Grade 11 set to "Two-Semester" and no semesters created yet

**Where:** Sidebar > Academic > Academic Year "2026–2027" detail page > Configure Semesters modal

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Configure Two-Semester Semesters" under Grade 11 |
| 2 | Set 1st Semester End Date to October 15, 2026 |
| 3 | Enter Q1 End Date as August 15, 2026 |
| 4 | Confirm that Q1 Start Date is June 1, 2026, Q2 Start Date automatically becomes August 16, 2026, and Q2 End Date automatically becomes October 15, 2026 |
| 5 | Set 2nd Semester Start Date to November 1, 2026 |
| 6 | Confirm Q3 Start Date automatically becomes November 1, 2026 |
| 7 | Enter Q3 End Date as January 15, 2027 |
| 8 | Confirm Q4 Start Date automatically becomes January 16, 2027 and Q4 End Date automatically becomes March 31, 2027 |
| 9 | Click "Create Semesters" |

**What should happen:**
- Semesters and quarters are generated successfully and saved
- The modal closes
- Under the Grade 11 group, 1st Semester and 2nd Semester are listed with their respective dates
- 1st Semester shows Quarter 1 (June 1, 2026 — August 15, 2026) and Quarter 2 (August 16, 2026 — October 15, 2026)
- 2nd Semester shows Quarter 3 (November 1, 2026 — January 15, 2027) and Quarter 4 (January 16, 2027 — March 31, 2027)

---

#### TC-ACAD-125

> *SRS Reference: FR-03 AC-10*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" exists with Grade 12 set to "Trimestral"

**Where:** Sidebar > Academic > Academic Year "2026–2027" detail page > Configure Semesters modal

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Configure Trimestral Semesters" under Grade 12 |
| 2 | In the modal, leave some semester dates empty, or enter invalid dates (e.g. 2nd Semester Start Date after 2nd Semester End Date) |
| 3 | Click "Create Semesters" |

**What should happen:**
- Validation errors are displayed on screen
- The modal does not close
- No semesters are saved to the database (partial creation rolls back fully)

---

#### TC-ACAD-126

> *SRS Reference: FR-02, FR-03*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" exists with semesters already created for Grade 11, and also has pre-existing legacy semesters (no grade level)

**Where:** Sidebar > Academic > Academic Year "2026–2027" detail page

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the detail page for "2026–2027" |
| 2 | Observe the Semesters list area |

**What should happen:**
- Semesters are grouped and displayed by Grade Level (Grade 11 and Grade 12)
- Grade 11 shows its list of generated semesters
- Grade 12 shows "No semesters yet" and the "Configure" button
- A separate "Legacy Semesters" section is listed at the bottom showing semesters that have no grade level assigned

---

---

### Setting Up the Calendar

*Adding, editing, and removing events on the academic calendar.*

---

#### TC-CAL-01

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

#### TC-CAL-02

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

#### TC-CAL-03

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

#### TC-CAL-04

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

#### TC-CAL-05

> *SRS Reference: FR-05 AC-1*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Select event type: CUSTOM |
| 3 | Enter title: "Faculty Meeting" |
| 4 | Set a specific time range (e.g., 2:00 PM â€“ 4:00 PM) instead of all-day |
| 5 | Click Save |

**What should happen:**
- The event is created with the specific time range and appears in the calendar list

---

#### TC-CAL-06

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

#### TC-CAL-07

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

#### TC-CAL-08

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

#### TC-CAL-09

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

#### TC-CAL-10

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

#### TC-CAL-11

> *SRS Reference: FR-05 AC-6*

**What you need:** Logged in, an event titled "Holiday A" already exists for November 1â€“2, 2026

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

#### TC-CAL-12

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
- The event is created successfully â€” the same title is allowed when dates do not overlap

---

#### TC-CAL-13

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

#### TC-CAL-14

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

#### TC-CAL-15

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

#### TC-CAL-16

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

#### TC-CAL-17

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, a draft schedule entry exists on Monday November 3, 2026 at 8:00â€“9:00 AM

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

#### TC-CAL-18

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

#### TC-CAL-19

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

#### TC-CAL-20

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

#### TC-CAL-21

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

#### TC-CAL-22

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

#### TC-CAL-23

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

#### TC-CAL-24

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

#### TC-CAL-25

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

#### TC-CAL-26

> *SRS Reference: FR-05 AC-12*

**What you need:** Logged in, draft schedule entries exist on November 3 at 8:00â€“9:00 AM and 11:00 AMâ€“12:00 PM

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking event on November 3, 2026 from 10:00 AM to 12:00 PM (not all-day) |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check the draft entries on November 3 |

**What should happen:**
- The 11:00 AMâ€“12:00 PM entry shows a "blocked by event" conflict (overlaps with the event)
- The 8:00â€“9:00 AM entry does NOT show a conflict (outside the event's time range)

---

#### TC-CAL-27

> *SRS Reference: FR-05 AC-13*

**What you need:** Logged in, an EXAM_PERIOD event exists for October 14â€“18, 2026

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

#### TC-CAL-28

> *SRS Reference: FR-05 AC-13*

**What you need:** Logged in, an EXAM_PERIOD event exists for October 14â€“18, 2026

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

#### TC-CAL-29

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

#### TC-CAL-30

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

#### TC-CAL-31

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

#### TC-CAL-32

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

#### TC-CAL-33

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

#### TC-CAL-34

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

#### TC-CAL-35

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

#### TC-CAL-36

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

#### TC-CAL-37

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, draft schedule entries exist on November 3, 5, and 7, 2026

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Create a blocking event spanning November 3â€“7, 2026 (5 days) |
| 3 | Click Save |
| 4 | Navigate to the schedule page and check draft entries on November 3, 5, and 7 |

**What should happen:**
- All three draft entries (Nov 3, Nov 5, Nov 7) show a "blocked by event" conflict
- A multi-day blocking event affects all days within its range

---

#### TC-CAL-38

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

#### TC-CAL-39

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

#### TC-CAL-40

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

#### TC-CAL-41

> *SRS Reference: FR-05 AC-5*

**What you need:** Logged in

**Where:** Sidebar > Calendar

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Event" |
| 2 | Enter title: "DÃ­a de los Muertos ðŸŽƒ" (includes accented characters and emoji) |
| 3 | Fill in the other required fields |
| 4 | Click Save |

**What should happen:**
- The event is created successfully
- The title displays correctly with all special characters and emoji preserved

---

#### TC-CAL-42

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

#### TC-CAL-43

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

#### TC-CAL-44

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

#### TC-CAL-45

> *SRS Reference: FR-05 AC-9*

**What you need:** Logged in, a blocking event exists on November 3, 2026, and a draft schedule entry on November 3 shows a "blocked by event" hard conflict

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Attempt to publish the draft schedule entry that has the "blocked by event" conflict |
| 2 | Observe the result |

**What should happen:**
- Publishing is blocked â€” the hard conflict prevents the entry from being published
- A message indicates the entry cannot be published due to a blocking event conflict

---

#### TC-CAL-46

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

---

### Managing Rooms

*Adding, editing, searching, and removing rooms used for scheduling.*

---

#### TC-ROOM-01

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-02

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-03

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-04

> *SRS Reference: FR-06 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-05

> *SRS Reference: FR-06 AC-3*

**What you need:** A room with code "RM-101" already exists

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-06

> *SRS Reference: FR-06 AC-4*

**What you need:** A room exists that has no schedule entries assigned to it

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The room disappears from the rooms list
- The room is moved to Trash

---

#### TC-ROOM-07

> *SRS Reference: FR-06 AC-8*

**What you need:** A room exists and has schedule entries for the current semester

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room's code in the list |
| 2 | View the detail page that opens |

**What should happen:**
- The room's full information is displayed (code, name, building, floor, capacity, type, status, department availability)
- Schedule entries for the current semester are shown

---

#### TC-ROOM-08

> *SRS Reference: FR-06 AC-5*

**What you need:** A room with code "RM-101" already exists

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-09

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-10

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-11

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-12

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-13

> *SRS Reference: FR-06 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-14

> *SRS Reference: FR-06 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-15

> *SRS Reference: FR-06 AC-7, FR-01*

**What you need:** A room exists with Department Availability set to SHS_ONLY

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-16

> *SRS Reference: FR-06 AC-7, FR-01*

**What you need:** A room exists with Department Availability set to COLLEGE_ONLY

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-17

> *SRS Reference: FR-06 AC-7, FR-01*

**What you need:** A room exists with Department Availability set to SHARED

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department filter to SHS and check if the SHARED room is visible |
| 2 | Switch the department filter to College and check if the SHARED room is visible |

**What should happen:**
- The room appears in the list when filtered to SHS
- The room appears in the list when filtered to College

---

#### TC-ROOM-18

> *SRS Reference: FR-06 AC-7, FR-10*

**What you need:** A room with Department Availability set to SHS_ONLY exists. An SHS schedule entry in Draft status exists.

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-19

> *SRS Reference: FR-06 AC-7, FR-10*

**What you need:** A room with Department Availability set to SHS_ONLY exists

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-20

> *SRS Reference: FR-06 AC-7, FR-01 AC-7*

**What you need:** A room with Department Availability set to SHARED. An SHS schedule entry already uses this room on Monday 08:00â€“09:00.

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department |
| 2 | Create a Draft schedule entry using the same SHARED room on Monday 08:00â€“09:00 |
| 3 | Save the entry |
| 4 | Check the entry for conflict warnings |

**What should happen:**
- A room time conflict warning appears on the entry
- The conflict is marked as a hard conflict (blocking) because the room is already booked at that time by another department

---

#### TC-ROOM-21

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status AVAILABLE that has Draft schedule entries assigned to it

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change the Status to MAINTENANCE |
| 4 | A confirmation dialog appears showing the number of affected schedule entries â€” confirm it |
| 5 | Click Save |

**What should happen:**
- The room status changes to MAINTENANCE
- The affected Draft schedule entries now show a "room unavailable" conflict warning

---

#### TC-ROOM-22

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status AVAILABLE that has Draft schedule entries assigned to it

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room to open it |
| 2 | Click Edit |
| 3 | Change the Status to INACTIVE |
| 4 | A confirmation dialog appears showing the number of affected schedule entries â€” confirm it |
| 5 | Click Save |

**What should happen:**
- The room status changes to INACTIVE
- The affected Draft schedule entries now show a "room unavailable" conflict warning

---

#### TC-ROOM-23

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status MAINTENANCE that has Draft schedule entries showing a "room unavailable" conflict

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-24

> *SRS Reference: FR-06 AC-9*

**What you need:** A room with status AVAILABLE that has 5 Draft schedule entries assigned to it

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-25

> *SRS Reference: FR-06 AC-10*

**What you need:** A room that has Draft schedule entries in the current semester

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Observe the result |

**What should happen:**
- The deletion is blocked
- An error message appears saying the room has active schedule entries and suggesting to set it to INACTIVE instead

---

#### TC-ROOM-26

> *SRS Reference: FR-06 AC-10*

**What you need:** A room that has Published schedule entries

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Observe the result |

**What should happen:**
- The deletion is blocked
- An error message appears indicating the room cannot be deleted because it has schedule entries

---

#### TC-ROOM-27

> *SRS Reference: FR-06 AC-10*

**What you need:** A room that has zero schedule entries

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the room |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The room is deleted successfully and disappears from the list
- The room is moved to Trash

---

#### TC-ROOM-28

> *SRS Reference: FR-06 AC-8*

**What you need:** A room that has published schedule entries for the current semester

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the room's code in the list to open its detail page |
| 2 | Look at the schedule section |

**What should happen:**
- A weekly schedule grid is displayed
- Published schedule entries for the current semester appear in the grid

---

#### TC-ROOM-29

> *SRS Reference: FR-06 AC-8, FR-01*

**What you need:** A room with Department Availability set to SHARED that has schedule entries from both SHS and College departments

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the SHARED room's code to open its detail page |
| 2 | Look at the schedule section |

**What should happen:**
- Both SHS and College schedule entries are visible in the schedule view
- Each entry shows a department badge indicating which department it belongs to

---

#### TC-ROOM-30

> *SRS Reference: FR-06 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Room" |
| 2 | Enter Room Code: "RM/101-A (LAB)" (includes special characters) |
| 3 | Fill in the remaining fields |
| 4 | Click Save |

**What should happen:**
- Either the room is created with the special-character code, or a validation error appears if special characters are restricted â€” verify which behavior matches the business rule

---

#### TC-ROOM-31

> *SRS Reference: FR-06 AC-7, FR-10*

**What you need:** A room with Department Availability set to SHARED that has SHS schedule entries assigned to it

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-32

> *SRS Reference: FR-06 AC-6, FR-10*

**What you need:** A room with capacity 40. A section with 35 students has a Draft schedule entry using this room.

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

#### TC-ROOM-33

> *SRS Reference: FR-06*

**What you need:** No rooms exist in the system

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Rooms page |
| 2 | Observe the page content |

**What should happen:**
- An empty state message is displayed (e.g., "No rooms found")

---

#### TC-ROOM-34

> *SRS Reference: FR-06, FR-12*

**What you need:** A room exists in the system

**Where:** Sidebar > Rooms
**? How to Use:** Log in, click "Rooms" in the sidebar. To add a room, click "Add Room". To edit or delete, select a room from the list and use the actions menu.

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

---

### Managing Sections

*Creating and managing class sections for SHS and College departments.*

---

#### TC-SECT-01

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. SHS department active. An academic year and semester already exist.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-02

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. College department active. An academic year and semester already exist.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-03

> *SRS Reference: FR-07 AC-3*

**What you need:** Logged in. At least one section already exists.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-04

> *SRS Reference: FR-07 AC-4*

**What you need:** Logged in. A section exists that has no schedule entries assigned to it.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on a section that has no schedule entries |
| 2 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The section disappears from the sections list
- A success message confirms the section was deleted

---

#### TC-SECT-05

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. College department active. Subject Bank has entries for BSIT, 3rd Year (at least 5 subjects).

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-06

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. SHS department active.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Click "Add Section" to open the section form |

**What should happen:**
- The form shows a "Strand/Track" field
- The form does not show "Program" or "Subject" fields

---

#### TC-SECT-07

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. College department active.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department using the header department switcher |
| 2 | Click "Add Section" to open the section form |

**What should happen:**
- The form shows "Program" and "Subject" fields
- The form does not show a "Strand/Track" field

---

#### TC-SECT-08

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. SHS department active.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-09

> *SRS Reference: FR-07 AC-2*

**What you need:** Logged in. College department active.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-10

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. College department active. A section with code "BSIT-3A" already exists in the same academic year and semester.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-11

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. College department active. A section with code "BSIT-3A" exists in academic year 2025â€“2026.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter Code: "BSIT-3A" and fill in remaining fields |
| 3 | Select academic year 2026â€“2027 |
| 4 | Click Save |

**What should happen:**
- The section is created successfully
- No duplicate error appears because the same code is allowed in a different academic year

---

#### TC-SECT-12

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. A section with code "SEC-A" already exists in the SHS department.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-13

> *SRS Reference: FR-07 AC-6*

**What you need:** Logged in.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-14

> *SRS Reference: FR-07 AC-6*

**What you need:** Logged in.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-15

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-16

> *SRS Reference: FR-07 AC-7*

**What you need:** Logged in. A section exists that has draft schedule entries assigned to it.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the section that has draft schedule entries |

**What should happen:**
- An error message appears indicating that the section cannot be deleted because it has schedule entries
- The section remains in the list

---

#### TC-SECT-17

> *SRS Reference: FR-07 AC-7*

**What you need:** Logged in. A section exists that has published schedule entries assigned to it.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the section that has published schedule entries |

**What should happen:**
- An error message appears indicating that the section cannot be deleted because it has schedule entries
- The section remains in the list

---

#### TC-SECT-18

> *SRS Reference: FR-07 AC-7*

**What you need:** Logged in. A section exists that has no schedule entries assigned to it.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the section with no schedule entries |
| 2 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The section is removed from the list
- A success message confirms the section was deleted

---

#### TC-SECT-19

> *SRS Reference: FR-07 AC-8*

**What you need:** Logged in. A section exists with 35 students. The section has draft schedule entries assigned to a room with a capacity of 40.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-20

> *SRS Reference: FR-07 AC-8*

**What you need:** Logged in. A section exists with 45 students (above the assigned room's capacity of 40). The section has draft schedule entries showing a capacity warning.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-21

> *SRS Reference: FR-07 AC-9*

**What you need:** Logged in. SHS department active. An SHS section exists with schedule entries across multiple subjects throughout the week.

**Where:** Sidebar > Sections > (click on an SHS section)
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-22

> *SRS Reference: FR-07 AC-9*

**What you need:** Logged in. College department active. A College section exists for the subject "Data Structures" with schedule entries.

**Where:** Sidebar > Sections > (click on a College section)
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-23

> *SRS Reference: FR-07 AC-10*

**What you need:** Logged in. An active section exists with draft schedule entries.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-24

> *SRS Reference: FR-07 AC-10*

**What you need:** Logged in. An inactive section exists with draft schedule entries showing an "inactive section" conflict warning.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-25

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in. SHS department active. At least one personnel record exists.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-26

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-27

> *SRS Reference: FR-07*

**What you need:** Logged in. No sections exist for the currently selected academic year and semester.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Sections page |

**What should happen:**
- An empty state message is displayed (e.g., "No sections found" or similar)
- The page does not show an error

---

#### TC-SECT-28

> *SRS Reference: FR-07 AC-1*

**What you need:** Logged in.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Section" |
| 2 | Enter a section name with special characters: "SecciÃ³n A â€” MatemÃ¡ticas" |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The section is created successfully
- The section name displays correctly with all special characters (accented letters, em dash) intact

---

#### TC-SECT-29

> *SRS Reference: FR-07 AC-12*

**What you need:** Logged in. At least one section exists.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

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

#### TC-SECT-30

> *SRS Reference: FR-07 AC-5*

**What you need:** Logged in. Multiple academic years and semesters exist. A section has been created in AY 2026â€“2027, 1st Semester.

**Where:** Sidebar > Sections
**? How to Use:** Log in, click "Sections" in the sidebar. To add a section, click "Add Section". To edit or delete, select a section from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Verify the section appears in the list while AY 2026â€“2027, 1st Semester is selected |
| 2 | Switch to 2nd Semester using the semester selector |
| 3 | Check the sections list |

**What should happen:**
- The section appears in the list when AY 2026â€“2027, 1st Semester is selected
- The section does not appear in the list when 2nd Semester is selected
- Sections are scoped to their assigned academic year and semester

---

---

### Managing Personnel

*Adding, editing, and managing teachers and staff who are assigned to schedules.*

---

#### TC-PERS-01

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-02

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Fill in the form with Type set to "Staff" and complete all other required fields |
| 3 | Click Save |

**What should happen:**
- A new personnel record appears in the personnel list with type shown as "Staff"

---

#### TC-PERS-03

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Fill in the form with Type set to "Admin" and complete all other required fields |
| 3 | Click Save |

**What should happen:**
- A new personnel record appears in the personnel list with type shown as "Admin"

---

#### TC-PERS-04

> *SRS Reference: FR-08 AC-4*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-05

> *SRS Reference: FR-08 AC-3*

**What you need:** At least one personnel record already exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-06

> *SRS Reference: FR-08 AC-4*

**What you need:** A personnel record exists that has no schedule entries assigned to it

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The personnel record is removed from the active list
- The deleted record appears in the Trash

---

#### TC-PERS-07

> *SRS Reference: FR-08 AC-8*

**What you need:** A personnel record exists that has schedule entries assigned to it

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-08

> *SRS Reference: FR-08 AC-5*

**What you need:** A personnel record with Employee ID "EMP-001" already exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-09

> *SRS Reference: FR-08 AC-5*

**What you need:** A personnel record with email "juan@test.com" already exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-10

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-11

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-12

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter 1 for Max Weekly Hours and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- The personnel record is created successfully with Max Weekly Hours set to 1

---

#### TC-PERS-13

> *SRS Reference: FR-08 AC-6*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter 80 for Max Weekly Hours and fill in all other fields |
| 3 | Click Save |

**What should happen:**
- The personnel record is created successfully with Max Weekly Hours set to 80

---

#### TC-PERS-14

> *SRS Reference: FR-08 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-15

> *SRS Reference: FR-08 AC-5*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-16

> *SRS Reference: FR-08 AC-4, FR-01*

**What you need:** A personnel record exists with "Shared" enabled

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department view to SHS and confirm the shared personnel appears in the list |
| 2 | Switch the department view to College and confirm the same personnel appears in the list |

**What should happen:**
- The shared personnel record is visible in both the SHS and College personnel lists

---

#### TC-PERS-17

> *SRS Reference: FR-08 AC-4, FR-01*

**What you need:** A personnel record exists in the SHS department with "Shared" not enabled

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch the department view to SHS and confirm the personnel appears in the list |
| 2 | Switch the department view to College |

**What should happen:**
- The personnel appears in the SHS list
- The personnel does not appear in the College list

---

#### TC-PERS-18

> *SRS Reference: FR-08 AC-4, FR-10*

**What you need:** A non-shared SHS personnel record exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department view |
| 2 | Create a new draft schedule entry and assign the non-shared SHS personnel to it |
| 3 | Check the conflict indicators on the entry |

**What should happen:**
- A warning-level conflict appears indicating the personnel belongs to a different department

---

#### TC-PERS-19

> *SRS Reference: FR-08 AC-4, FR-01*

**What you need:** A shared personnel is already scheduled in SHS on Monday from 8:00 AM to 9:00 AM

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the College department view |
| 2 | Create a new draft schedule entry for the same shared personnel on Monday from 8:00 AM to 9:00 AM |
| 3 | Check the conflict indicators on the entry |

**What should happen:**
- A conflict appears indicating the personnel has an overlapping time slot across departments

---

#### TC-PERS-20

> *SRS Reference: FR-08 AC-7, FR-10*

**What you need:** A shared personnel exists with 20 hours scheduled in SHS and 25 hours scheduled in College, and their Max Weekly Hours is set to 40

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the shared personnel to open their detail page |
| 2 | Check the weekly workload display |

**What should happen:**
- The workload display shows 45 out of 40 hours (combining both departments)
- An overload conflict indicator is shown because the total exceeds the maximum

---

#### TC-PERS-21

> *SRS Reference: FR-08 AC-4*

**What you need:** A non-shared SHS personnel record exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-22

> *SRS Reference: FR-08 AC-7, FR-10*

**What you need:** A personnel record exists with Max Weekly Hours set to 40 and a current workload of 35 hours

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open it |
| 2 | Change Max Weekly Hours from 40 to 30 |
| 3 | A confirmation dialog appears showing how many schedule entries will be affected â€” confirm the change |
| 4 | Click Save |

**What should happen:**
- The Max Weekly Hours updates to 30
- An overload conflict appears because the current workload (35 hours) exceeds the new maximum (30 hours)
- A workload warning indicator also appears

---

#### TC-PERS-23

> *SRS Reference: FR-08 AC-7, FR-10*

**What you need:** A personnel record exists with Max Weekly Hours set to 30 and a current workload of 35 hours (already showing an overload conflict)

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-24

> *SRS Reference: FR-08 AC-7*

**What you need:** A personnel record exists with schedule entries in both departments

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-25

> *SRS Reference: FR-08 AC-9*

**What you need:** A personnel record exists that has draft schedule entries assigned to it

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |

**What should happen:**
- The deletion is blocked
- An error message appears explaining the personnel cannot be deleted because they have schedule entries

---

#### TC-PERS-26

> *SRS Reference: FR-08 AC-9*

**What you need:** A personnel record exists that has published schedule entries assigned to it

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |

**What should happen:**
- The deletion is blocked
- An error message appears explaining the personnel cannot be deleted because they have schedule entries

---

#### TC-PERS-27

> *SRS Reference: FR-08 AC-9*

**What you need:** A personnel record exists that has no schedule entries assigned to it

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the personnel record |
| 2 | Confirm the deletion in the dialog |

**What should happen:**
- The personnel record is removed from the active list
- The deleted record appears in the Trash

---

#### TC-PERS-28

> *SRS Reference: FR-08 AC-10, FR-10*

**What you need:** An active personnel record exists that has draft schedule entries assigned to it

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-29

> *SRS Reference: FR-08 AC-10*

**What you need:** An inactive personnel record exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-30

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-31

> *SRS Reference: FR-08 AC-1, FR-10*

**What you need:** A personnel record exists with specialization "Math"

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new draft schedule entry for a subject called "English" and assign it to the Math-specialized personnel |
| 2 | Check the conflict indicators on the entry |

**What should happen:**
- A warning-level conflict appears indicating the personnel's specializations do not match the assigned subject

---

#### TC-PERS-32

> *SRS Reference: FR-08 AC-1, FR-10*

**What you need:** A personnel record exists with specialization "math" (lowercase)

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Create a new draft schedule entry for a subject called "Math" (uppercase M) and assign it to the personnel |
| 2 | Check the conflict indicators on the entry |

**What should happen:**
- No specialization mismatch conflict appears â€” the matching is not case-sensitive

---

#### TC-PERS-33

> *SRS Reference: FR-08 AC-8*

**What you need:** A shared personnel record exists with schedule entries in both the SHS and College departments

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open the detail page |
| 2 | Look at the schedule entries section |

**What should happen:**
- Schedule entries from both SHS and College are listed, each showing a label indicating which department it belongs to
- The entries are not filtered by the current department view â€” all entries are always shown

---

#### TC-PERS-34

> *SRS Reference: FR-08 AC-8*

**What you need:** A personnel record exists with 5 schedule entries totaling 20 hours, and their Max Weekly Hours is 40

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the personnel record to open the detail page |
| 2 | Check the "Current Weekly Load" section |

**What should happen:**
- The weekly load displays as "20 / 40 hours"
- The load is calculated from all draft and published entries in the current semester

---

#### TC-PERS-35

> *SRS Reference: FR-08*

**What you need:** No personnel records exist in the system

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Personnel page |

**What should happen:**
- An empty state message is displayed (e.g., "No personnel found" or similar placeholder)

---

#### TC-PERS-36

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Personnel" |
| 2 | Enter "JosÃ©" as the First Name and "Ã‘aÃ±ez" as the Last Name |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The personnel record is created successfully
- The name displays correctly with accented characters: "JosÃ© Ã‘aÃ±ez"

---

#### TC-PERS-37

> *SRS Reference: FR-08 AC-1*

**What you need:** Logged in to the app

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

#### TC-PERS-38

> *SRS Reference: FR-08, FR-12*

**What you need:** At least one personnel record exists

**Where:** Sidebar > Personnel
**? How to Use:** Log in, click "Personnel" in the sidebar. To add personnel, click "Add Personnel". To edit or delete, select personnel from the list and use the actions menu.

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

---

### Building Your Schedule

*Creating, editing, and deleting schedule entries. Includes recurring schedules and conflict detection.*

---

#### TC-SCHED-01

> *SRS Reference: FR-09 AC-1*

**What you need:** An active academic year and semester. At least one room, one section, and one personnel record exist.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-02

> *SRS Reference: FR-09 AC-2*

**What you need:** An active academic year and semester. At least one section and one personnel record exist.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-03

> *SRS Reference: FR-09 AC-4*

**What you need:** An active academic year. No active semester is required.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-04

> *SRS Reference: FR-09 AC-1*

**What you need:** An active academic year and semester. At least one personnel record exists.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-05

> *SRS Reference: FR-09 AC-5*

**What you need:** An active academic year and semester. At least three sections exist.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-06

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-07

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-08

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester. Activity set to CLASS, Modality set to F2F.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-09

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-10

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-11

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-12

> *SRS Reference: FR-09 AC-7*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-13

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "MEETING" |
| 3 | Look at the form fields |

**What should happen:**
- The Subject field is hidden and not shown on the form

---

#### TC-SCHED-14

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-15

> *SRS Reference: FR-09 AC-6*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "OFFICE" |
| 3 | Look at the form fields |

**What should happen:**
- Both the Subject and Section fields are hidden and not shown on the form

---

#### TC-SCHED-16

> *SRS Reference: FR-09 AC-8*

**What you need:** Time slot configuration starts at 07:00 with a 60-minute period length.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- The entry is saved successfully â€” 08:00 aligns with the time slot boundaries (07:00 + 1 period)

---

#### TC-SCHED-17

> *SRS Reference: FR-09 AC-9*

**What you need:** SHS department selected with a 60-minute period length.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Observe the End Time field |

**What should happen:**
- The End Time is automatically set to 09:00 (start time plus one 60-minute period)

---

#### TC-SCHED-18

> *SRS Reference: FR-09 AC-10*

**What you need:** Period length is 60 minutes.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Start Time to 08:00 |
| 3 | Change End Time to 10:00 (covering 2 periods) |
| 4 | Fill in all other required fields |
| 5 | Click Save |

**What should happen:**
- The entry is saved successfully â€” 2 hours is an exact multiple of the 60-minute period length

---

#### TC-SCHED-19

> *SRS Reference: FR-09 AC-10*

**What you need:** Period length is 60 minutes.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-20

> *SRS Reference: FR-09 AC-11*

**What you need:** Logged in to the app.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-21

> *SRS Reference: FR-09 AC-12*

**What you need:** Time window is configured as 07:00â€“21:00.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-22

> *SRS Reference: FR-09 AC-16*

**What you need:** An active academic year and semester. An SHS section and a College section exist.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-23

> *SRS Reference: FR-09 AC-16*

**What you need:** Sections from different academic years or semesters exist.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-24

> *SRS Reference: FR-09 AC-17*

**What you need:** An active academic year exists but no active semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-25

> *SRS Reference: FR-09 AC-17*

**What you need:** An active academic year exists but no active semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-26

> *SRS Reference: FR-09 AC-4*

**What you need:** An active academic year exists but no active semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Activity to "MEETING" |
| 3 | Fill in personnel and optional room |
| 4 | Click Save |

**What should happen:**
- The entry is created successfully â€” MEETING only requires an active academic year, not a semester
- The entry appears in the schedule list as "DRAFT"

---

#### TC-SCHED-27

> *SRS Reference: FR-09 AC-18*

**What you need:** An existing schedule entry occupies room RM-101, Monday 08:00â€“09:00.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Create an entry using the same room (RM-101) and the same time (Monday 08:00â€“09:00) |
| 3 | Click Save without checking the override option |

**What should happen:**
- A conflict error is displayed showing the room and time overlap
- The save is blocked until the conflict is resolved or overridden

---

#### TC-SCHED-28

> *SRS Reference: FR-09 AC-19*

**What you need:** An existing schedule entry creates a room conflict with the new entry.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-29

> *SRS Reference: FR-09 AC-19*

**What you need:** An existing schedule entry creates a conflict with the new entry.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-30

> *SRS Reference: FR-09 AC-20*

**What you need:** Entry form is filled with data.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Fill in all entry fields |
| 3 | Click the "Validate" button (without clicking Save) |

**What should happen:**
- Any conflicts are displayed on screen as a preview
- No data is saved â€” this is a dry-run check only

---

#### TC-SCHED-31

> *SRS Reference: FR-09 AC-18*

**What you need:** A room with a capacity of 30. A section with 35 students.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Select the room (capacity 30) and the section (35 students) |
| 3 | Fill in all other required fields |
| 4 | Click Save |

**What should happen:**
- A warning is displayed indicating that the room capacity is exceeded
- The entry is still saved â€” capacity warnings do not block the save

---

#### TC-SCHED-32

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-33

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-34

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-35

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-36

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-37

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-38

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-39

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-40

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-41

> *SRS Reference: FR-09 AC-14*

**What you need:** An active academic year and semester that includes February and April.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Add Entry" |
| 2 | Set Recurrence to "MONTHLY_DATE" and set day of month to 31 |
| 3 | Fill in all other required fields |
| 4 | Click Save |
| 5 | Open the entry and review the list of occurrences |

**What should happen:**
- Months that have fewer than 31 days (e.g., February, April) are skipped â€” no occurrences appear for those months
- Only months with 31 days have occurrences listed

---

#### TC-SCHED-42

> *SRS Reference: FR-09 AC-13*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-43

> *SRS Reference: FR-09 AC-15*

**What you need:** An active academic year and a long semester. A "DAILY" recurrence pattern that would generate more than 200 occurrences.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-44

> *SRS Reference: FR-09 AC-21*

**What you need:** An existing schedule entry with "DRAFT" status.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-45

> *SRS Reference: FR-09 AC-22*

**What you need:** An existing schedule entry with "PUBLISHED" status.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on the PUBLISHED entry to open it |
| 2 | Attempt to edit any field |

**What should happen:**
- All fields are read-only or the edit controls are disabled
- A message indicates "Only DRAFT entries can be updated"

---

#### TC-SCHED-46

> *SRS Reference: FR-09 AC-23*

**What you need:** An existing schedule entry with "DRAFT" status.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the DRAFT entry |
| 2 | Confirm the deletion in the confirmation dialog |

**What should happen:**
- The entry is removed from the schedule list
- The entry no longer appears in search or filter results

---

#### TC-SCHED-47

> *SRS Reference: FR-09 AC-22*

**What you need:** An existing schedule entry with "PUBLISHED" status.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the delete button on the PUBLISHED entry |

**What should happen:**
- Deletion is blocked
- A message indicates "Only DRAFT entries can be deleted"

---

#### TC-SCHED-48

> *SRS Reference: FR-09 AC-24*

**What you need:** An existing schedule entry.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-49

> *SRS Reference: FR-09 AC-25*

**What you need:** Quick-Add mode is available.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-50

> *SRS Reference: FR-09 AC-26*

**What you need:** The Add Entry form is partially filled with unsaved data.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-51

> *SRS Reference: FR-09 AC-27*

**What you need:** An existing schedule entry.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click on an existing entry to view its details |

**What should happen:**
- A read-only detail panel opens showing all entry fields (activity, room, personnel, sections, time, recurrence, etc.)
- Conflict flags and change history are visible

---

#### TC-SCHED-52

> *SRS Reference: FR-09 AC-8*

**What you need:** Time slot configured as 07:00â€“21:00 with a 60-minute period length.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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
- Both entries are saved successfully â€” times at the exact start and end boundaries of the time window are valid

---

#### TC-SCHED-53

> *SRS Reference: FR-09 AC-2*

**What you need:** An active academic year and semester.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-54

> *SRS Reference: FR-09 AC-1*

**What you need:** No schedule entries exist yet.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Navigate to the Schedule page |

**What should happen:**
- An empty state message is displayed: "No schedule entries found"
- Guidance or a prompt to create the first entry is shown

---

#### TC-SCHED-55

> *SRS Reference: FR-09 AC-1*

**What you need:** An existing DRAFT schedule entry.

**Where:** Sidebar > Schedule
**? How to Use:** Log in, click "Schedule" in the sidebar. To add a schedule entry, click "Add Entry". To edit or delete, select a schedule entry from the calendar/list view and use the actions menu.

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

#### TC-SCHED-56

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

#### TC-SCHED-57

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

#### TC-SCHED-58

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

#### TC-SCHED-59

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

#### TC-SCHED-60

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

#### TC-SCHED-61

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

#### TC-SCHED-62

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

#### TC-SCHED-63

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

#### TC-SCHED-64

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

#### TC-SCHED-65

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

#### TC-SCHED-66

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

#### TC-SCHED-67

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

#### TC-SCHED-68

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

#### TC-SCHED-69

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

#### TC-SCHED-70

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

#### TC-SCHED-71

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
- The entry still saves â€” this is a warning, not a blocking conflict

---

#### TC-SCHED-72

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
- The entry still saves â€” this is a warning, not a blocking conflict

---

#### TC-SCHED-73

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
- The entry saves normally â€” exactly matching the room capacity is not a conflict

---

#### TC-SCHED-74

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

#### TC-SCHED-75

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
- The entry saves normally â€” workload is well below the warning threshold

---

#### TC-SCHED-76

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

#### TC-SCHED-77

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

#### TC-SCHED-78

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

#### TC-SCHED-79

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

#### TC-SCHED-80

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

#### TC-SCHED-81

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
- The entry saves normally â€” the room is available

---

#### TC-SCHED-82

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

#### TC-SCHED-83

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

#### TC-SCHED-84

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

#### TC-SCHED-85

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

#### TC-SCHED-86

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

#### TC-SCHED-87

> *SRS Reference: FR-10 AC-12*

**What you need:** An exam period is configured for October 14â€“18

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
- The warning indicates the exam is scheduled outside the designated exam period (October 14â€“18)

---

#### TC-SCHED-88

> *SRS Reference: FR-10 AC-12*

**What you need:** An exam period is configured for October 14â€“18

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

#### TC-SCHED-89

> *SRS Reference: FR-10 AC-12*

**What you need:** An exam period is configured for October 14â€“18

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

#### TC-SCHED-90

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

#### TC-SCHED-91

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

#### TC-SCHED-92

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

#### TC-SCHED-93

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

#### TC-SCHED-94

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

#### TC-SCHED-95

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

#### TC-SCHED-96

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

#### TC-SCHED-97

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

#### TC-SCHED-98

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

#### TC-SCHED-99

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

#### TC-SCHED-100

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

#### TC-SCHED-101

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

#### TC-SCHED-102

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

#### TC-SCHED-103

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

#### TC-SCHED-104

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

#### TC-SCHED-105

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

#### TC-SCHED-106

> *SRS Reference: FR-09, FR-10*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" has semesters and sections configured for both 1st Semester and 2nd Semester, and schedule entries exist in both semesters

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Schedule page |
| 2 | Locate the Semester filter dropdown at the top (defaults to showing entries for all semesters) |
| 3 | Select "1st Semester" in the Semester filter dropdown |
| 4 | Observe the list of schedule entries |
| 5 | Open the schedule creation form and check the Sections dropdown options |
| 6 | Close the form, and select "2nd Semester" in the Semester filter dropdown |
| 7 | Observe the list of schedule entries |
| 8 | Open the schedule creation form and check the Sections dropdown options |

**What should happen:**
- Selecting "1st Semester" filters the schedule entries list to show only entries in the 1st Semester
- The Sections multiselect dropdown in the form only lists sections belonging to the 1st Semester
- Selecting "2nd Semester" filters the schedule entries list to show only entries in the 2nd Semester
- The Sections multiselect dropdown in the form only lists sections belonging to the 2nd Semester

---

#### TC-SCHED-107

> *SRS Reference: FR-09, FR-10*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" has 1st Semester (June 1, 2026 – October 15, 2026) and 2nd Semester (November 1, 2026 – March 31, 2027) configured

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Schedule page |
| 2 | Select "1st Semester" in the Semester filter dropdown |
| 3 | Click "Create Schedule Entry" to open the creation form |
| 4 | Check the "Start Date" and "End Date" fields under the Recurrence section |
| 5 | Close the form |
| 6 | Select "2nd Semester" in the Semester filter dropdown |
| 7 | Click "Create Schedule Entry" to open the creation form |
| 8 | Check the "Start Date" and "End Date" fields under the Recurrence section |

**What should happen:**
- When "1st Semester" is selected as the filter, the Recurrence Start Date automatically pre-fills with "2026-06-01" and the End Date with "2026-10-15"
- When "2nd Semester" is selected as the filter, the Recurrence Start Date automatically pre-fills with "2026-11-01" and the End Date with "2027-03-31"

---

#### TC-SCHED-108

> *SRS Reference: FR-09, FR-10*

**What you need:** Logged in, SHS department selected, Academic Year "2026–2027" has active term set, sections exist in both semesters

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Schedule page |
| 2 | Select a section in the Sections dropdown that is linked to the 2nd Semester |
| 3 | Fill in the rest of the schedule entry fields |
| 4 | Click Save |
| 5 | Verify which semester the created entry is associated with in the schedule list or details |

**What should happen:**
- The entry is created successfully
- The entry is associated with the selected section's semester (2nd Semester) even if the active semester is set to the 1st Semester

---

#### TC-SCHED-109

> *SRS Reference: FR-16*

**What you need:** Logged in, SHS department selected, schedule entries exist for both 1st Semester and 2nd Semester

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select "1st Semester" in the Semester filter dropdown |
| 2 | Click "Export Schedule" |
| 3 | Complete the signatories modal and click Export |
| 4 | Open the generated Excel file |

**What should happen:**
- The schedule is exported successfully
- The generated Excel file contains only the schedule entries that belong to the 1st Semester

---

---

### Publishing Schedules

*The workflow from draft schedules to published versions that can be shared.*

---

#### TC-PUB-01

> *SRS Reference: FR-11 AC-1*

**What you need:** At least 5 schedule entries in DRAFT status with no conflicts in the active term.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click the "Publish" button |
| 2 | Review the pre-publish summary â€” it should show 5 selected, 0 hard conflicts, and the number of soft warnings |
| 3 | Click "Confirm" to publish |

**What should happen:**
- All 5 entries change from DRAFT to PUBLISHED
- The schedule list shows them as PUBLISHED
- Each entry has an audit log record for the publish action

---

#### TC-PUB-02

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

#### TC-PUB-03

> *SRS Reference: FR-11 AC-3*

**What you need:** Several DRAFT entries â€” some with hard conflicts, some with soft warnings, some clean.

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

#### TC-PUB-04

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

#### TC-PUB-05

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

#### TC-PUB-06

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

#### TC-PUB-07

> *SRS Reference: FR-11 AC-6*

**What you need:** A DRAFT entry that previously had a hard conflict overridden when it was saved (before publishing).

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Select the previously-overridden entry for publishing |
| 2 | Click "Publish" |

**What should happen:**
- A fresh validation runs â€” the prior save-time override does NOT carry forward
- The hard conflict reappears and must be overridden again at publish time
- Publishing is blocked until the conflict is resolved or overridden again

---

#### TC-PUB-08

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

#### TC-PUB-09

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

#### TC-PUB-10

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

#### TC-PUB-11

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

#### TC-PUB-12

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

#### TC-PUB-13

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
- Other entries sharing RM-101 have their conflicts re-evaluated â€” some conflicts may appear or disappear based on the change

---

#### TC-PUB-14

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

#### TC-PUB-15

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

#### TC-PUB-16

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

#### TC-PUB-17

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

#### TC-PUB-18

> *SRS Reference: FR-11 AC-13*

**What you need:** Multiple schedule entries in PUBLISHED status.

**Where:** Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Re-validate Published" |
| 2 | Check the status of each entry after re-validation |

**What should happen:**
- All entries remain in PUBLISHED status â€” re-validation only updates conflict flags, it does not change entry status

---

#### TC-PUB-19

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

#### TC-PUB-20

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

#### TC-PUB-21

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

#### TC-PUB-22

> *SRS Reference: FR-11 AC-1*

**What you need:** 5 DRAFT entries â€” 4 clean and 1 with an unresolvable hard conflict.

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

#### TC-PUB-23

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

#### TC-PUB-24

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

#### TC-PUB-25

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

#### TC-PUB-26

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

#### TC-PUB-27

> *SRS Reference: FR-11 AC-3*

**What you need:** 5 DRAFT entries â€” 3 clean, 1 with a hard conflict, 1 with only a soft warning.

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

#### TC-PUB-28

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

---

### Exam Schedules

*Creating and managing examination period schedules.*

---

#### TC-EXAM-01

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

#### TC-EXAM-02

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

#### TC-EXAM-03

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

#### TC-EXAM-04

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

#### TC-EXAM-05

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

#### TC-EXAM-06

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

#### TC-EXAM-07

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

#### TC-EXAM-08

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

#### TC-EXAM-09

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

#### TC-EXAM-10

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

#### TC-EXAM-11

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

#### TC-EXAM-12

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

#### TC-EXAM-13

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

#### TC-EXAM-14

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

#### TC-EXAM-15

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

#### TC-EXAM-16

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

#### TC-EXAM-17

> *SRS Reference: FR-13 AC-7*

**What you need:** An SHS department is active with 1st Semester. Q1 date range is set to Jun 5â€“Aug 15.

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

#### TC-EXAM-18

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

#### TC-EXAM-19

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

#### TC-EXAM-20

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

#### TC-EXAM-21

> *SRS Reference: FR-13 AC-9*

**What you need:** An exam period event exists on the calendar for Oct 14â€“18.

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

#### TC-EXAM-22

> *SRS Reference: FR-13 AC-9*

**What you need:** An exam period event exists on the calendar for Oct 14â€“18.

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

#### TC-EXAM-23

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

#### TC-EXAM-24

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

#### TC-EXAM-25

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

#### TC-EXAM-26

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

#### TC-EXAM-27

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

#### TC-EXAM-28

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

#### TC-EXAM-29

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

#### TC-EXAM-30

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

#### TC-EXAM-31

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

#### TC-EXAM-32

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

---

### Using Templates

*Saving schedule templates and carrying forward schedules to the next term.*

---

#### TC-TMPL-01

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

#### TC-TMPL-02

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

#### TC-TMPL-03

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

#### TC-TMPL-04

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

#### TC-TMPL-05

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

#### TC-TMPL-06

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

#### TC-TMPL-07

> *SRS Reference: FR-14 AC-6*

**What you need:** The current active term is set (e.g., 2026â€“2027, 1st Semester).

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

#### TC-TMPL-08

> *SRS Reference: FR-14 AC-6*

**What you need:** The current active term is set (e.g., 2026â€“2027, 1st Semester).

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

#### TC-TMPL-09

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
- The existing "BSIT-3A" section in the target is not duplicated â€” it is skipped
- All other sections from the source are cloned into the target
- The summary shows the count of skipped duplicates

---

#### TC-TMPL-10

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
- The warning does not block you from proceeding â€” you can still execute

---

#### TC-TMPL-11

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

#### TC-TMPL-12

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

#### TC-TMPL-13

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

#### TC-TMPL-14

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

#### TC-TMPL-15

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

#### TC-TMPL-16

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

#### TC-TMPL-17

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

#### TC-TMPL-18

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

#### TC-TMPL-19

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

#### TC-TMPL-20

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

#### TC-TMPL-21

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

#### TC-TMPL-22

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

#### TC-TMPL-23

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

#### TC-TMPL-24

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

#### TC-TMPL-25

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

#### TC-TMPL-26

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

#### TC-TMPL-27

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

---

### Importing Data

*Importing data from files into the application.*

---

#### TC-IMP-01

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

#### TC-IMP-02

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

#### TC-IMP-03

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

#### TC-IMP-04

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

#### TC-IMP-05

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

#### TC-IMP-06

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

#### TC-IMP-07

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

#### TC-IMP-08

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

#### TC-IMP-09

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

#### TC-IMP-10

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

#### TC-IMP-11

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

#### TC-IMP-12

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

#### TC-IMP-13

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

#### TC-IMP-14

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

#### TC-IMP-15

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

#### TC-IMP-16

> *SRS Reference: FR-15 AC-13*

**What you need:** A section CSV file where a row references an adviser that exists in the system (e.g., adviser employee_id "EMP-001" is already in Personnel)

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The row is marked as Valid (green) â€” the referenced personnel record was found

---

#### TC-IMP-17

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

#### TC-IMP-18

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

#### TC-IMP-19

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

#### TC-IMP-20

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

#### TC-IMP-21

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

#### TC-IMP-22

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

#### TC-IMP-23

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

#### TC-IMP-24

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

#### TC-IMP-25

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

#### TC-IMP-26

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

#### TC-IMP-27

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
- The existing record for "EMP-001" is updated â€” the name changes from "Juan" to "Jose"
- The result report shows 1 Updated

---

#### TC-IMP-28

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

#### TC-IMP-29

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

#### TC-IMP-30

> *SRS Reference: FR-15 AC-23*

**What you need:** A CSV file containing names with special characters (e.g., "JosÃ© Ã‘aÃ±ez")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table |

**What should happen:**
- Names display correctly with accented and special characters (e.g., "JosÃ© Ã‘aÃ±ez" appears as-is, not garbled)

---

#### TC-IMP-31

> *SRS Reference: FR-15 AC-24*

**What you need:** A CSV file where a field value contains a comma inside quotes (e.g., notes column contains "Room A, Building 1")

**Where:** Sidebar > Import

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Click "Upload" and select the CSV file |
| 2 | Check the preview table for that row |

**What should happen:**
- The field is parsed correctly â€” "Room A, Building 1" appears as a single value, not split into separate columns

---

#### TC-IMP-32

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

#### TC-IMP-33

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

#### TC-IMP-34

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

#### TC-IMP-35

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

---

### Exporting & Printing

*Exporting schedules to PDF/Excel, managing institution logos, signatories, and footer text.*

---

#### TC-EXP-01

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

#### TC-EXP-02

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

#### TC-EXP-03

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

#### TC-EXP-04

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

#### TC-EXP-05

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

#### TC-EXP-06

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

#### TC-EXP-07

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

#### TC-EXP-08

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

#### TC-EXP-09

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

#### TC-EXP-10

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

#### TC-EXP-11

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
- A preview of the logo appears, fitting within a 200Ã—100 pixel area
- The logo is saved and visible on the Settings page

---

#### TC-EXP-12

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

#### TC-EXP-13

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

#### TC-EXP-14

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

#### TC-EXP-15

> *SRS Reference: FR-21 AC-4*

**What you need:** A logo has already been uploaded.

**Where:** Sidebar > Settings

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Open the Settings page |
| 2 | Look at the logo preview |

**What should happen:**
- The logo preview fits within a 200Ã—100 pixel bounding box
- The image's aspect ratio is preserved (not stretched or distorted)

---

#### TC-EXP-16

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

#### TC-EXP-17

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

#### TC-EXP-18

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

#### TC-EXP-19

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

#### TC-EXP-20

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

#### TC-EXP-21

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

#### TC-EXP-22

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

#### TC-EXP-23

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

#### TC-EXP-24

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

#### TC-EXP-25

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

#### TC-EXP-26

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

#### TC-EXP-27

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

#### TC-EXP-28

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

#### TC-EXP-29

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

#### TC-EXP-30

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

---

### Your Dashboard

*Overview statistics, quick access shortcuts, and summary views on the main dashboard.*

---

#### TC-DASH-01

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

#### TC-DASH-02

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

#### TC-DASH-03

> *SRS Reference: FR-20 AC-3*

**What you need:** An active academic year and semester exist for SHS

**Where:** Sidebar > Dashboard

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Switch to the SHS department using the header department switcher |
| 2 | Look at the Dashboard page |

**What should happen:**
- The active term summary card shows the academic year label, semester name, and quarter (Q1â€“Q4)

---

#### TC-DASH-04

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

#### TC-DASH-05

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

#### TC-DASH-06

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

#### TC-DASH-07

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

#### TC-DASH-08

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

#### TC-DASH-09

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

#### TC-DASH-10

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

#### TC-DASH-11

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

#### TC-DASH-12

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

#### TC-DASH-13

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

#### TC-DASH-14

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

#### TC-DASH-15

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

#### TC-DASH-16

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

---

### Viewing Activity History

*Reviewing the audit trail of changes made within the application.*

---

#### TC-AUDIT-01

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

#### TC-AUDIT-02

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

#### TC-AUDIT-03

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

#### TC-AUDIT-04

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

#### TC-AUDIT-05

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

#### TC-AUDIT-06

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

#### TC-AUDIT-07

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

#### TC-AUDIT-08

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

#### TC-AUDIT-09

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

#### TC-AUDIT-10

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

#### TC-AUDIT-11

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

#### TC-AUDIT-12

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

#### TC-AUDIT-13

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
- The audit log is read-only â€” no edit or delete controls are available

---

#### TC-AUDIT-14

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
- The audit log is read-only â€” no edit or delete controls are available

---

#### TC-AUDIT-15

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

#### TC-AUDIT-16

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

#### TC-AUDIT-17

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

#### TC-AUDIT-18

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

#### TC-AUDIT-19

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

#### TC-AUDIT-20

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

#### TC-AUDIT-21

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

---

### Backup & Restore

*Creating backups of your data and restoring from a previous backup.*

---

#### TC-BKUP-01

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

#### TC-BKUP-02

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

#### TC-BKUP-03

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

#### TC-BKUP-04

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

#### TC-BKUP-05

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

#### TC-BKUP-06

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

#### TC-BKUP-07

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

#### TC-BKUP-08

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

#### TC-BKUP-09

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

#### TC-BKUP-10

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
- No data is changed â€” your current data remains intact

---

#### TC-BKUP-11

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

#### TC-BKUP-12

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

#### TC-BKUP-13

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

#### TC-BKUP-14

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

#### TC-BKUP-15

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

#### TC-BKUP-16

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

#### TC-BKUP-17

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

#### TC-BKUP-18

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

#### TC-BKUP-19

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

#### TC-BKUP-20

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
- The 5 entries added after the backup are gone (this is expected â€” restore replaces everything)

---

#### TC-BKUP-21

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

#### TC-BKUP-22

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

#### TC-BKUP-23

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

#### TC-BKUP-24

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

#### TC-BKUP-25

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

#### TC-BKUP-26

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
- After restoring Backup B, all data matches Backup B â€” Backup A's data is completely replaced
- Each restore fully replaces the previous state

---

#### TC-BKUP-27

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

---

### Recovering Deleted Items

*Viewing, restoring, and permanently deleting items from the trash.*

---

#### TC-TRASH-01

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

#### TC-TRASH-02

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

#### TC-TRASH-03

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

#### TC-TRASH-04

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

#### TC-TRASH-05

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

#### TC-TRASH-06

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

#### TC-TRASH-07

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

#### TC-TRASH-08

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

#### TC-TRASH-09

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

#### TC-TRASH-10

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

#### TC-TRASH-11

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

#### TC-TRASH-12

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

#### TC-TRASH-13

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

#### TC-TRASH-14

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

#### TC-TRASH-15

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

#### TC-TRASH-16

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

#### TC-TRASH-17

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

#### TC-TRASH-18

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

#### TC-TRASH-19

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

#### TC-TRASH-20

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

---

### Edge Cases & Error Handling

*Unusual inputs, boundary conditions, and error scenarios that test the app's resilience.*

---

#### TC-EDGE-01

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

#### TC-EDGE-02

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
- The app uses either the safety backup or the original database â€” no corrupted state
- All previously existing data is accessible

---

#### TC-EDGE-03

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
- No partial data was written â€” it is all-or-nothing
- Either all 100 rows are present, or none of them are
- The app starts cleanly with no errors

---

#### TC-EDGE-04

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
- The entries are either all published or all still in draft â€” no mix of states
- The app starts cleanly with no errors

---

#### TC-EDGE-05

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

#### TC-EDGE-06

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

#### TC-EDGE-07

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

#### TC-EDGE-08

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

#### TC-EDGE-09

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

#### TC-EDGE-10

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

#### TC-EDGE-11

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

#### TC-EDGE-12

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

#### TC-EDGE-13

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

#### TC-EDGE-14

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

#### TC-EDGE-15

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

#### TC-EDGE-16

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

#### TC-EDGE-17

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

#### TC-EDGE-18

> *SRS Reference: Cross-cutting*

**What you need:** The app is open and logged in

**Where:** Sidebar > Rooms, then Sidebar > Personnel, then Sidebar > Sections, then Sidebar > Schedule

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Go to Rooms and create a room named "SalÃ³n 101 â€” Edificio Ã‘" |
| 2 | Go to Personnel and create a person named "JosÃ© MarÃ­a Ã‘. PÃ©rez" |
| 3 | Go to Sections and create a section named "SecciÃ³n A â€” MatemÃ¡ticas æ•°å­¦" |
| 4 | Go to Schedule and create an event named "DÃ­a de Muertos ðŸŽƒ" |
| 5 | Visit each page and verify the names display correctly |

**What should happen:**
- All four entities are created successfully with their full unicode names
- Names with accented characters, special symbols, Chinese characters, and emoji display correctly everywhere they appear
- No garbled text or missing characters on any page

---

#### TC-EDGE-19

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

#### TC-EDGE-20

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

#### TC-EDGE-21

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

#### TC-EDGE-22

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

#### TC-EDGE-23

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

#### TC-EDGE-24

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

#### TC-EDGE-25

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

#### TC-EDGE-26

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

#### TC-EDGE-27

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
- College is still selected after restarting â€” the user does not have to switch again

---

#### TC-EDGE-28

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

#### TC-EDGE-29

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

#### TC-EDGE-30

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

---

### General App Behavior

*Non-functional tests that can be observed through normal app usage: single-instance behavior, build variants, and basic responsiveness.*

---

#### TC-NFR-01

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

#### TC-NFR-02

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

#### TC-NFR-03

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

#### TC-NFR-04

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

#### TC-NFR-05

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

#### TC-NFR-06

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

#### TC-NFR-07

> *SRS Reference: NFR-S-004*

**What you need:** App has been set up (initial password created). An external database viewer tool (e.g., DB Browser for SQLite)

**Where:** Outside the app â€” open the database file directly with a database viewer

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

#### TC-NFR-08

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

#### TC-NFR-09

> *SRS Reference: NFR-S-003*

**What you need:** App has been used (audit log entries exist). An external database viewer tool

**Where:** Outside the app â€” open the database file directly with a database viewer

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

#### TC-NFR-10

> *SRS Reference: NFR-U-001*

**What you need:** App is running

**Where:** App window (any page)

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Grab the corner or edge of the app window |
| 2 | Try to drag it smaller than 1024 pixels wide and 768 pixels tall |

**What should happen:**
- The window stops resizing and will not go smaller than 1024Ã—768
- Content is never cut off or hidden due to the window being too small

---

#### TC-NFR-11

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

#### TC-NFR-12

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

#### TC-NFR-13

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

#### TC-NFR-14

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

#### TC-NFR-15

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

#### TC-NFR-16

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

#### TC-NFR-17

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

#### TC-NFR-18

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

#### TC-NFR-19

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

#### TC-NFR-20

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

#### TC-NFR-21

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
- Items are not permanently destroyed â€” they are moved to Trash
- Only the "Permanently Delete" action from Trash actually removes data for good

---

#### TC-NFR-22

> *SRS Reference: NFR-D*

**What you need:** Logged in, an external database viewer tool

**Where:** Outside the app â€” open the database file directly with a database viewer

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

#### TC-NFR-23

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

#### TC-NFR-24

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

---

### End-to-End Flows

*These tests cover complete user journeys that span multiple sections. They verify that different parts of the app work together correctly.*

---

#### Flow-01: Fresh Start to First Schedule

> *Cross-Feature Flow — Installation through first schedule creation*

**What you need:**
- A fresh install of the app with no previous data

**Steps:**

| Step | Who does it | What to do | What should happen |
|------|-------------|------------|---------------------|
| 1 | Admin | Launch the app for the first time | The first-time setup screen appears |
| 2 | Admin | Enter `Admin123` in both password fields and click `Complete Setup` | Setup completes, the login screen appears |
| 3 | Admin | Enter `Admin123` and click `Log In` | Login succeeds, the Dashboard appears |
| 4 | Admin | Navigate to Sidebar > Academic Year and create a new academic year (Start: June 2026, Label: `2026-2027`) | The academic year is created and appears in the list |
| 5 | Admin | Add a semester to the academic year (e.g., `1st Semester`) | The semester is created under the academic year |
| 6 | Admin | Set the semester as the active term | The semester is marked as active |
| 7 | Admin | Navigate to Sidebar > Rooms and create a room (Code: `RM-101`, Name: `Room 101`, Capacity: 40) | The room appears in the rooms list |
| 8 | Admin | Navigate to Sidebar > Sections and create a section (Code: `SHS-11-STEM-A`, Strand: STEM, Grade: 11, Students: 40) | The section appears in the sections list |
| 9 | Admin | Navigate to Sidebar > Personnel and add personnel (ID: `EMP-001`, Name: `Juan Dela Cruz`, Max Hours: 40) | The personnel record appears in the list |
| 10 | Admin | Navigate to Sidebar > Schedule and create a new entry (Activity: CLASS, Day: Monday, Time: 08:00-09:00, Room: RM-101, Section: SHS-11-STEM-A, Personnel: Juan Dela Cruz) | The schedule entry appears on the timetable |

---

#### Flow-02: Password Recovery

> *Cross-Feature Flow — Forgot password through security question reset*

**What you need:**
- Setup completed with password `Admin123`
- Security question and answer configured in Settings

**Steps:**

| Step | Who does it | What to do | What should happen |
|------|-------------|------------|---------------------|
| 1 | Admin | On the login screen, click `Forgot Password` | The security question recovery screen appears |
| 2 | Admin | Answer the security question correctly | The password reset form appears |
| 3 | Admin | Enter a new password `NewPass1` in both fields and submit | A success message confirms the password was reset |
| 4 | Admin | On the login screen, enter `Admin123` (old password) and click `Log In` | Login fails with `Invalid password` |
| 5 | Admin | Enter `NewPass1` (new password) and click `Log In` | Login succeeds, the Dashboard appears |

---

#### Flow-03: Publish Workflow

> *Cross-Feature Flow — Draft schedule through conflict resolution and publishing*

**What you need:**
- Logged in with an active academic year, semester, rooms, sections, and personnel already set up

**Steps:**

| Step | Who does it | What to do | What should happen |
|------|-------------|------------|---------------------|
| 1 | Admin | Navigate to Sidebar > Schedule and create a schedule entry for Monday 08:00-09:00 in Room RM-101 | The entry appears as a draft on the timetable |
| 2 | Admin | Create a second entry for the same time and room (Monday 08:00-09:00, Room RM-101, different section) | A conflict alert appears warning about the room overlap |
| 3 | Admin | Resolve the conflict by changing the second entry's room to a different room | The conflict alert disappears |
| 4 | Admin | Navigate to the publish workflow and click `Publish` | The schedule status changes from Draft to Published |
| 5 | Admin | Verify the published schedule is visible in the published view | The published timetable shows all entries correctly |

---

#### Flow-04: Backup & Restore

> *Cross-Feature Flow — Create data, back up, delete, and restore*

**What you need:**
- Logged in with at least one room, section, and personnel already created

**Steps:**

| Step | Who does it | What to do | What should happen |
|------|-------------|------------|---------------------|
| 1 | Admin | Navigate to Sidebar > Backup & Restore and create a backup | A success message confirms the backup was created, and it appears in the backup list |
| 2 | Admin | Navigate to Sidebar > Rooms and note the number of rooms listed | Record the count (e.g., 3 rooms) |
| 3 | Admin | Delete all rooms (send to trash, then permanently delete from trash) | The rooms list is empty |
| 4 | Admin | Navigate to Sidebar > Backup & Restore and select the backup you created in step 1 | The backup details are shown |
| 5 | Admin | Click `Restore` and confirm the action | A success message confirms the restore completed |
| 6 | Admin | Navigate to Sidebar > Rooms | The rooms that were deleted are back — the count matches what you recorded in step 2 |

---

---

## 5. Developer Verification Tests

> **These tests require developer tools (database browser, DevTools, File Explorer inspection) and are NOT part of black-box QA testing.** They are included here for reference by the development team.

---

#### TC-DEV-01

> *Originally: TC-FR17-04*

> *SRS Reference: FR-17 AC-1*

**What you need:** A fresh install of the app with no previous data

**Where:** Desktop (launch the app), then File Explorer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app for the first time |
| 2 | Open File Explorer and navigate to the app data folder (`%APPDATA%/sched-mng/`) |

**What should happen:**
- A file named `schedule-manager.db` exists in the app data folder

---

#### TC-DEV-02

> *Originally: TC-FR17-17*

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

#### TC-DEV-03

> *Originally: TC-FR17-19*

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
- No settings are missing â€” all were saved together

---

#### TC-DEV-04

> *Originally: TC-FR17-33*

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

#### TC-DEV-05

> *Originally: TC-FR17-34*

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

#### TC-DEV-06

> *Originally: TC-FR17-35*

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

#### TC-DEV-07

> *Originally: TC-FR17-37*

> *SRS Reference: FR-17 AC-11*

**What you need:** A database with pending updates, a database browser tool

**Where:** Desktop (launch the app), then database browser

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Launch the app so that pending database updates are applied |
| 2 | Check the database |

**What should happen:**
- Each database update is applied as a complete unit â€” if one update fails, only that update is rolled back (previous successful updates are kept)

---

#### TC-DEV-08

> *Originally: TC-FR17-38*

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

#### TC-DEV-09

> *Originally: TC-FR17-39*

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

#### TC-DEV-10

> *Originally: TC-FR17-44*

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

#### TC-DEV-11

> *Originally: TC-FR18-23*

> *SRS Reference: FR-18 AC-9*

**What you need:** Logged in to the app, access to File Explorer

**Where:** Any page, then File Explorer

**Steps:**

| Step | What to do |
|------|------------|
| 1 | Log in successfully |
| 2 | Check the app data folder (`%APPDATA%/sched-mng/`) in File Explorer |

**What should happen:**
- There are no session files, tokens, or cookies saved to disk
- The login session exists only while the app is running

---

#### TC-DEV-12

> *Originally: TC-FR18-49*

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

#### TC-DEV-13

> *Originally: TC-NFR-04*

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

#### TC-DEV-14

> *Originally: TC-NFR-002*

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

#### TC-DEV-15

> *Originally: TC-NFR-003*

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

#### TC-DEV-16

> *Originally: TC-NFR-004*

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

#### TC-DEV-17

> *Originally: TC-NFR-009*

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

#### TC-DEV-18

> *Originally: TC-NFR-011*

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

#### TC-DEV-19

> *Originally: TC-NFR-012*

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

#### TC-DEV-20

> *Originally: TC-NFR-016*

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

#### TC-DEV-21

> *Originally: TC-NFR-026*

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

#### TC-DEV-22

> *Originally: TC-NFR-028*

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

#### TC-DEV-23

> *Originally: TC-NFR-030*

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

---

## 6. Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-12 | QA Team | Initial test plan with 793 test cases |
| 2.0 | 2026-06-17 | QA Team | Black-box rewrite: restructured into 19 user-journey sections, removed 34 deprecated/deferred tests, moved 35 developer-only tests to appendix, added Testing Scope section, 4 E2E flows, Change History, and Document Rules. All test cases renumbered with journey-based IDs. |
| 2.1 | 2026-06-20 | QA Team | Template alignment: added Excluded Features subsection, emoji table headers in bug reporting guide, 3 new Document Rules (permanent TC IDs, missing UI flagging, ⚠️ notation), updated field-name quoting style. |
| 2.2 | 2026-06-21 | QA Team | Update for SHS grade-level term types, configure semester/quarter generation modals, and schedule builder academic term alignment. |

### ID Cross-Reference

<details>
<summary>Click to expand the old -> new TC ID mapping (for cross-referencing existing bug reports)</summary>

| Old ID | New ID | Status |
|--------|--------|--------|
| TC-FR17-01 | TC-AUTH-01 | Active |
| TC-FR17-02 | TC-AUTH-02 | Active |
| TC-FR17-03 | TC-AUTH-03 | Active |
| TC-FR17-04 | TC-DEV-01 | Active |
| TC-FR17-05 | TC-AUTH-04 | Active |
| TC-FR17-06 | TC-AUTH-05 | Active |
| TC-FR17-07 | TC-AUTH-06 | Active |
| TC-FR17-08 | — | Removed (DEPRECATED) |
| TC-FR17-09 | — | Removed (DEPRECATED) |
| TC-FR17-10 | — | Removed (DEPRECATED) |
| TC-FR17-11 | — | Removed (DEPRECATED) |
| TC-FR17-12 | TC-AUTH-07 | Active |
| TC-FR17-13 | TC-AUTH-08 | Active |
| TC-FR17-14 | TC-AUTH-09 | Active |
| TC-FR17-15 | — | Removed (DEPRECATED) |
| TC-FR17-16 | — | Removed (DEPRECATED) |
| TC-FR17-17 | TC-DEV-02 | Active |
| TC-FR17-18 | TC-AUTH-10 | Active |
| TC-FR17-19 | TC-DEV-03 | Active |
| TC-FR17-20 | TC-AUTH-11 | Active |
| TC-FR17-21 | TC-AUTH-12 | Active |
| TC-FR17-22 | TC-AUTH-13 | Active |
| TC-FR17-23 | TC-AUTH-14 | Active |
| TC-FR17-24 | TC-AUTH-15 | Active |
| TC-FR17-25 | TC-AUTH-16 | Active |
| TC-FR17-26 | TC-AUTH-17 | Active |
| TC-FR17-27 | TC-AUTH-18 | Active |
| TC-FR17-28 | — | Removed (DEPRECATED) |
| TC-FR17-29 | — | Removed (DEPRECATED) |
| TC-FR17-30 | — | Removed (DEPRECATED) |
| TC-FR17-31 | — | Removed (DEPRECATED) |
| TC-FR17-32 | TC-AUTH-19 | Active |
| TC-FR17-33 | TC-DEV-04 | Active |
| TC-FR17-34 | TC-DEV-05 | Active |
| TC-FR17-35 | TC-DEV-06 | Active |
| TC-FR17-36 | TC-AUTH-20 | Active |
| TC-FR17-37 | TC-DEV-07 | Active |
| TC-FR17-38 | TC-DEV-08 | Active |
| TC-FR17-39 | TC-DEV-09 | Active |
| TC-FR17-40 | — | Removed (DEFERRED) |
| TC-FR17-41 | — | Removed (DEFERRED) |
| TC-FR17-42 | TC-AUTH-21 | Active |
| TC-FR17-43 | TC-AUTH-22 | Active |
| TC-FR17-44 | TC-DEV-10 | Active |
| TC-FR18-01 | TC-AUTH-23 | Active |
| TC-FR18-02 | TC-AUTH-24 | Active |
| TC-FR18-03 | TC-AUTH-25 | Active |
| TC-FR18-04 | TC-AUTH-26 | Active |
| TC-FR18-05 | TC-AUTH-27 | Active |
| TC-FR18-06 | TC-AUTH-28 | Active |
| TC-FR18-07 | TC-AUTH-29 | Active |
| TC-FR18-08 | TC-AUTH-30 | Active |
| TC-FR18-09 | TC-AUTH-31 | Active |
| TC-FR18-10 | TC-AUTH-32 | Active |
| TC-FR18-11 | TC-AUTH-33 | Active |
| TC-FR18-12 | TC-AUTH-34 | Active |
| TC-FR18-13 | TC-AUTH-35 | Active |
| TC-FR18-14 | TC-AUTH-36 | Active |
| TC-FR18-15 | TC-AUTH-37 | Active |
| TC-FR18-16 | TC-AUTH-38 | Active |
| TC-FR18-17 | TC-AUTH-39 | Active |
| TC-FR18-18 | TC-AUTH-40 | Active |
| TC-FR18-19 | TC-AUTH-41 | Active |
| TC-FR18-20 | TC-AUTH-42 | Active |
| TC-FR18-21 | TC-AUTH-43 | Active |
| TC-FR18-22 | TC-AUTH-44 | Active |
| TC-FR18-23 | TC-DEV-11 | Active |
| TC-FR18-24 | TC-AUTH-45 | Active |
| TC-FR18-25 | TC-AUTH-46 | Active |
| TC-FR18-26 | TC-AUTH-47 | Active |
| TC-FR18-27 | TC-AUTH-48 | Active |
| TC-FR18-28 | TC-AUTH-49 | Active |
| TC-FR18-29 | TC-AUTH-50 | Active |
| TC-FR18-30 | TC-AUTH-51 | Active |
| TC-FR18-31 | TC-AUTH-52 | Active |
| TC-FR18-32 | TC-AUTH-53 | Active |
| TC-FR18-33 | TC-AUTH-54 | Active |
| TC-FR18-34 | TC-AUTH-55 | Active |
| TC-FR18-35 | TC-AUTH-56 | Active |
| TC-FR18-36 | TC-AUTH-57 | Active |
| TC-FR18-37 | TC-AUTH-58 | Active |
| TC-FR18-38 | TC-AUTH-59 | Active |
| TC-FR18-39 | TC-AUTH-60 | Active |
| TC-FR18-40 | TC-AUTH-61 | Active |
| TC-FR18-41 | TC-AUTH-62 | Active |
| TC-FR18-42 | TC-AUTH-63 | Active |
| TC-FR18-43 | TC-SET-01 | Active |
| TC-FR18-44 | TC-SET-02 | Active |
| TC-FR18-45 | TC-SET-03 | Active |
| TC-FR18-46 | TC-SET-04 | Active |
| TC-FR18-47 | TC-SET-05 | Active |
| TC-FR18-48 | TC-SET-06 | Active |
| TC-FR18-49 | TC-DEV-12 | Active |
| TC-FR18-50 | TC-SET-07 | Active |
| TC-FR18-51 | TC-SET-08 | Active |
| TC-EDG-01 | TC-AUTH-64 | Active |
| TC-EDG-02 | TC-AUTH-65 | Active |
| TC-EDG-03 | TC-AUTH-66 | Active |
| TC-EDG-04 | TC-AUTH-67 | Active |
| TC-EDG-05 | TC-AUTH-68 | Active |
| TC-EDG-06 | TC-AUTH-69 | Active |
| TC-EDG-07 | TC-AUTH-70 | Active |
| TC-EDG-08 | TC-AUTH-71 | Active |
| TC-NFR-01 | TC-AUTH-72 | Active |
| TC-NFR-02 | TC-AUTH-73 | Active |
| TC-NFR-03 | TC-AUTH-74 | Active |
| TC-NFR-04 | TC-DEV-13 | Active |
| TC-NFR-05 | TC-AUTH-75 | Active |
| TC-FR02-01 | TC-ACAD-01 | Active |
| TC-FR02-02 | TC-ACAD-02 | Active |
| TC-FR02-03 | TC-ACAD-03 | Active |
| TC-FR02-04 | TC-ACAD-04 | Active |
| TC-FR02-05 | TC-ACAD-05 | Active |
| TC-FR02-06 | TC-ACAD-06 | Active |
| TC-FR02-07 | TC-ACAD-07 | Active |
| TC-FR02-08 | TC-ACAD-08 | Active |
| TC-FR02-09 | TC-ACAD-09 | Active |
| TC-FR02-10 | TC-ACAD-10 | Active |
| TC-FR02-11 | TC-ACAD-11 | Active |
| TC-FR02-12 | TC-ACAD-12 | Active |
| TC-FR02-13 | TC-ACAD-13 | Active |
| TC-FR02-14 | TC-ACAD-14 | Active |
| TC-FR02-15 | TC-ACAD-15 | Active |
| TC-FR02-16 | TC-ACAD-16 | Active |
| TC-FR02-17 | TC-ACAD-17 | Active |
| TC-FR02-18 | TC-ACAD-18 | Active |
| TC-FR02-19 | TC-ACAD-19 | Active |
| TC-FR02-20 | TC-ACAD-20 | Active |
| TC-FR02-21 | TC-ACAD-21 | Active |
| TC-FR02-22 | TC-ACAD-22 | Active |
| TC-FR02-23 | TC-ACAD-23 | Active |
| TC-FR02-24 | TC-ACAD-24 | Active |
| TC-FR02-25 | TC-ACAD-25 | Active |
| TC-FR02-26 | TC-ACAD-26 | Active |
| TC-FR02-27 | TC-ACAD-27 | Active |
| TC-FR02-28 | TC-ACAD-28 | Active |
| TC-FR02-29 | TC-ACAD-29 | Active |
| TC-FR02-30 | TC-ACAD-30 | Active |
| TC-FR02-31 | TC-ACAD-31 | Active |
| TC-FR02-32 | TC-ACAD-32 | Active |
| TC-FR02-33 | TC-ACAD-33 | Active |
| TC-FR02-34 | TC-ACAD-34 | Active |
| TC-FR02-35 | TC-ACAD-35 | Active |
| TC-FR02-36 | TC-ACAD-36 | Active |
| TC-FR02-37 | TC-ACAD-37 | Active |
| TC-FR02-38 | TC-ACAD-38 | Active |
| TC-FR02-39 | TC-ACAD-39 | Active |
| TC-FR02-40 | TC-ACAD-40 | Active |
| TC-FR02-41 | TC-ACAD-41 | Active |
| TC-FR02-42 | TC-ACAD-42 | Active |
| TC-FR02-43 | TC-ACAD-43 | Active |
| TC-FR02-44 | TC-ACAD-44 | Active |
| TC-FR02-45 | TC-ACAD-45 | Active |
| TC-FR02-46 | TC-ACAD-46 | Active |
| TC-FR02-47 | TC-ACAD-47 | Active |
| TC-FR02-48 | TC-ACAD-48 | Active |
| TC-FR02-49 | TC-ACAD-49 | Active |
| TC-FR02-50 | TC-ACAD-50 | Active |
| TC-FR02-51 | TC-ACAD-51 | Active |
| TC-FR02-52 | TC-ACAD-52 | Active |
| TC-FR03-01 | TC-ACAD-53 | Active |
| TC-FR03-02 | TC-ACAD-54 | Active |
| TC-FR03-03 | TC-ACAD-55 | Active |
| TC-FR03-04 | TC-ACAD-56 | Active |
| TC-FR03-05 | TC-ACAD-57 | Active |
| TC-FR03-06 | TC-ACAD-58 | Active |
| TC-FR03-07 | TC-ACAD-59 | Active |
| TC-FR03-08 | TC-ACAD-60 | Active |
| TC-FR03-09 | TC-ACAD-61 | Active |
| TC-FR03-10 | TC-ACAD-62 | Active |
| TC-FR03-11 | TC-ACAD-63 | Active |
| TC-FR03-12 | TC-ACAD-64 | Active |
| TC-FR03-13 | TC-ACAD-65 | Active |
| TC-FR03-14 | TC-ACAD-66 | Active |
| TC-FR03-15 | TC-ACAD-67 | Active |
| TC-FR03-16 | TC-ACAD-68 | Active |
| TC-FR03-17 | TC-ACAD-69 | Active |
| TC-FR03-18 | TC-ACAD-70 | Active |
| TC-FR03-19 | TC-ACAD-71 | Active |
| TC-FR03-20 | TC-ACAD-72 | Active |
| TC-FR03-21 | TC-ACAD-73 | Active |
| TC-FR03-22 | TC-ACAD-74 | Active |
| TC-FR03-23 | TC-ACAD-75 | Active |
| TC-FR03-24 | TC-ACAD-76 | Active |
| TC-FR03-25 | TC-ACAD-77 | Active |
| TC-FR03-26 | TC-ACAD-78 | Active |
| TC-FR03-27 | TC-ACAD-79 | Active |
| TC-FR03-28 | TC-ACAD-80 | Active |
| TC-FR03-29 | TC-ACAD-81 | Active |
| TC-FR03-30 | TC-ACAD-82 | Active |
| TC-FR03-31 | TC-ACAD-83 | Active |
| TC-FR03-32 | TC-ACAD-84 | Active |
| TC-FR03-33 | TC-ACAD-85 | Active |
| TC-FR03-34 | TC-ACAD-86 | Active |
| TC-FR03-35 | TC-ACAD-87 | Active |
| TC-FR03-36 | TC-ACAD-88 | Active |
| TC-FR03-37 | TC-ACAD-89 | Active |
| TC-FR03-38 | TC-ACAD-90 | Active |
| TC-FR03-39 | TC-ACAD-91 | Active |
| TC-FR03-40 | TC-ACAD-92 | Active |
| TC-FR03-41 | TC-ACAD-93 | Active |
| TC-FR03-42 | TC-ACAD-94 | Active |
| TC-FR03-43 | TC-ACAD-95 | Active |
| TC-FR03-44 | TC-ACAD-96 | Active |
| TC-FR03-45 | TC-ACAD-97 | Active |
| TC-FR03-46 | TC-ACAD-98 | Active |
| TC-FR04-01 | TC-ACAD-99 | Active |
| TC-FR04-02 | TC-ACAD-100 | Active |
| TC-FR04-03 | TC-ACAD-101 | Active |
| TC-FR04-04 | TC-ACAD-102 | Active |
| TC-FR04-05 | TC-ACAD-103 | Active |
| TC-FR04-06 | TC-ACAD-104 | Active |
| TC-FR04-07 | TC-ACAD-105 | Active |
| TC-FR04-08 | TC-ACAD-106 | Active |
| TC-FR04-09 | TC-ACAD-107 | Active |
| TC-FR04-10 | TC-ACAD-108 | Active |
| TC-FR04-11 | TC-ACAD-109 | Active |
| TC-FR04-12 | TC-ACAD-110 | Active |
| TC-FR04-13 | TC-ACAD-111 | Active |
| TC-FR04-14 | TC-ACAD-112 | Active |
| TC-FR04-15 | TC-ACAD-113 | Active |
| TC-FR04-16 | TC-ACAD-114 | Active |
| TC-FR04-17 | TC-ACAD-115 | Active |
| TC-FR04-18 | TC-ACAD-116 | Active |
| TC-FR04-19 | TC-ACAD-117 | Active |
| TC-FR04-20 | TC-ACAD-118 | Active |
| TC-FR04-21 | TC-ACAD-119 | Active |
| TC-FR04-22 | TC-ACAD-120 | Active |
| TC-FR05-01 | TC-CAL-01 | Active |
| TC-FR05-02 | TC-CAL-02 | Active |
| TC-FR05-03 | TC-CAL-03 | Active |
| TC-FR05-04 | TC-CAL-04 | Active |
| TC-FR05-05 | TC-CAL-05 | Active |
| TC-FR05-06 | TC-CAL-06 | Active |
| TC-FR05-07 | TC-CAL-07 | Active |
| TC-FR05-08 | TC-CAL-08 | Active |
| TC-FR05-09 | TC-CAL-09 | Active |
| TC-FR05-10 | TC-CAL-10 | Active |
| TC-FR05-11 | TC-CAL-11 | Active |
| TC-FR05-12 | TC-CAL-12 | Active |
| TC-FR05-13 | TC-CAL-13 | Active |
| TC-FR05-14 | TC-CAL-14 | Active |
| TC-FR05-15 | TC-CAL-15 | Active |
| TC-FR05-16 | TC-CAL-16 | Active |
| TC-FR05-17 | TC-CAL-17 | Active |
| TC-FR05-18 | TC-CAL-18 | Active |
| TC-FR05-19 | TC-CAL-19 | Active |
| TC-FR05-20 | TC-CAL-20 | Active |
| TC-FR05-21 | TC-CAL-21 | Active |
| TC-FR05-22 | TC-CAL-22 | Active |
| TC-FR05-23 | TC-CAL-23 | Active |
| TC-FR05-24 | TC-CAL-24 | Active |
| TC-FR05-25 | TC-CAL-25 | Active |
| TC-FR05-26 | TC-CAL-26 | Active |
| TC-FR05-27 | TC-CAL-27 | Active |
| TC-FR05-28 | TC-CAL-28 | Active |
| TC-FR05-29 | TC-CAL-29 | Active |
| TC-FR05-30 | TC-CAL-30 | Active |
| TC-FR05-31 | TC-CAL-31 | Active |
| TC-FR05-32 | TC-CAL-32 | Active |
| TC-FR05-33 | TC-CAL-33 | Active |
| TC-FR05-34 | TC-CAL-34 | Active |
| TC-FR05-35 | — | Removed (DEFERRED) |
| TC-FR05-36 | — | Removed (DEFERRED) |
| TC-FR05-37 | TC-CAL-35 | Active |
| TC-FR05-38 | TC-CAL-36 | Active |
| TC-FR05-39 | TC-CAL-37 | Active |
| TC-FR05-40 | TC-CAL-38 | Active |
| TC-FR05-41 | TC-CAL-39 | Active |
| TC-FR05-42 | TC-CAL-40 | Active |
| TC-FR05-43 | TC-CAL-41 | Active |
| TC-FR05-44 | TC-CAL-42 | Active |
| TC-FR05-45 | TC-CAL-43 | Active |
| TC-FR05-46 | TC-CAL-44 | Active |
| TC-FR05-47 | TC-CAL-45 | Active |
| TC-FR05-48 | TC-CAL-46 | Active |
| TC-FR06-01 | TC-ROOM-01 | Active |
| TC-FR06-02 | TC-ROOM-02 | Active |
| TC-FR06-03 | TC-ROOM-03 | Active |
| TC-FR06-04 | TC-ROOM-04 | Active |
| TC-FR06-05 | TC-ROOM-05 | Active |
| TC-FR06-06 | TC-ROOM-06 | Active |
| TC-FR06-07 | TC-ROOM-07 | Active |
| TC-FR06-08 | TC-ROOM-08 | Active |
| TC-FR06-09 | TC-ROOM-09 | Active |
| TC-FR06-10 | TC-ROOM-10 | Active |
| TC-FR06-11 | TC-ROOM-11 | Active |
| TC-FR06-12 | TC-ROOM-12 | Active |
| TC-FR06-13 | TC-ROOM-13 | Active |
| TC-FR06-14 | TC-ROOM-14 | Active |
| TC-FR06-15 | TC-ROOM-15 | Active |
| TC-FR06-16 | TC-ROOM-16 | Active |
| TC-FR06-17 | TC-ROOM-17 | Active |
| TC-FR06-18 | TC-ROOM-18 | Active |
| TC-FR06-19 | TC-ROOM-19 | Active |
| TC-FR06-20 | TC-ROOM-20 | Active |
| TC-FR06-21 | TC-ROOM-21 | Active |
| TC-FR06-22 | TC-ROOM-22 | Active |
| TC-FR06-23 | TC-ROOM-23 | Active |
| TC-FR06-24 | TC-ROOM-24 | Active |
| TC-FR06-25 | TC-ROOM-25 | Active |
| TC-FR06-26 | TC-ROOM-26 | Active |
| TC-FR06-27 | TC-ROOM-27 | Active |
| TC-FR06-28 | TC-ROOM-28 | Active |
| TC-FR06-29 | TC-ROOM-29 | Active |
| TC-FR06-30 | TC-ROOM-30 | Active |
| TC-FR06-31 | TC-ROOM-31 | Active |
| TC-FR06-32 | TC-ROOM-32 | Active |
| TC-FR06-33 | TC-ROOM-33 | Active |
| TC-FR06-34 | TC-ROOM-34 | Active |
| TC-FR07-01 | TC-SECT-01 | Active |
| TC-FR07-02 | TC-SECT-02 | Active |
| TC-FR07-03 | TC-SECT-03 | Active |
| TC-FR07-04 | TC-SECT-04 | Active |
| TC-FR07-05 | TC-SECT-05 | Active |
| TC-FR07-06 | TC-SECT-06 | Active |
| TC-FR07-07 | TC-SECT-07 | Active |
| TC-FR07-08 | TC-SECT-08 | Active |
| TC-FR07-09 | TC-SECT-09 | Active |
| TC-FR07-10 | TC-SECT-10 | Active |
| TC-FR07-11 | TC-SECT-11 | Active |
| TC-FR07-12 | TC-SECT-12 | Active |
| TC-FR07-13 | TC-SECT-13 | Active |
| TC-FR07-14 | TC-SECT-14 | Active |
| TC-FR07-15 | TC-SECT-15 | Active |
| TC-FR07-16 | TC-SECT-16 | Active |
| TC-FR07-17 | TC-SECT-17 | Active |
| TC-FR07-18 | TC-SECT-18 | Active |
| TC-FR07-19 | TC-SECT-19 | Active |
| TC-FR07-20 | TC-SECT-20 | Active |
| TC-FR07-21 | TC-SECT-21 | Active |
| TC-FR07-22 | TC-SECT-22 | Active |
| TC-FR07-23 | TC-SECT-23 | Active |
| TC-FR07-24 | TC-SECT-24 | Active |
| TC-FR07-25 | TC-SECT-25 | Active |
| TC-FR07-26 | TC-SECT-26 | Active |
| TC-FR07-27 | TC-SECT-27 | Active |
| TC-FR07-28 | TC-SECT-28 | Active |
| TC-FR07-29 | TC-SECT-29 | Active |
| TC-FR07-30 | TC-SECT-30 | Active |
| TC-FR08-01 | TC-PERS-01 | Active |
| TC-FR08-02 | TC-PERS-02 | Active |
| TC-FR08-03 | TC-PERS-03 | Active |
| TC-FR08-04 | TC-PERS-04 | Active |
| TC-FR08-05 | TC-PERS-05 | Active |
| TC-FR08-06 | TC-PERS-06 | Active |
| TC-FR08-07 | TC-PERS-07 | Active |
| TC-FR08-08 | TC-PERS-08 | Active |
| TC-FR08-09 | TC-PERS-09 | Active |
| TC-FR08-10 | TC-PERS-10 | Active |
| TC-FR08-11 | TC-PERS-11 | Active |
| TC-FR08-12 | TC-PERS-12 | Active |
| TC-FR08-13 | TC-PERS-13 | Active |
| TC-FR08-14 | TC-PERS-14 | Active |
| TC-FR08-15 | TC-PERS-15 | Active |
| TC-FR08-16 | TC-PERS-16 | Active |
| TC-FR08-17 | TC-PERS-17 | Active |
| TC-FR08-18 | TC-PERS-18 | Active |
| TC-FR08-19 | TC-PERS-19 | Active |
| TC-FR08-20 | TC-PERS-20 | Active |
| TC-FR08-21 | TC-PERS-21 | Active |
| TC-FR08-22 | TC-PERS-22 | Active |
| TC-FR08-23 | TC-PERS-23 | Active |
| TC-FR08-24 | TC-PERS-24 | Active |
| TC-FR08-25 | TC-PERS-25 | Active |
| TC-FR08-26 | TC-PERS-26 | Active |
| TC-FR08-27 | TC-PERS-27 | Active |
| TC-FR08-28 | TC-PERS-28 | Active |
| TC-FR08-29 | TC-PERS-29 | Active |
| TC-FR08-30 | TC-PERS-30 | Active |
| TC-FR08-31 | TC-PERS-31 | Active |
| TC-FR08-32 | TC-PERS-32 | Active |
| TC-FR08-33 | TC-PERS-33 | Active |
| TC-FR08-34 | TC-PERS-34 | Active |
| TC-FR08-35 | TC-PERS-35 | Active |
| TC-FR08-36 | TC-PERS-36 | Active |
| TC-FR08-37 | TC-PERS-37 | Active |
| TC-FR08-38 | TC-PERS-38 | Active |
| TC-FR09-01 | TC-SCHED-01 | Active |
| TC-FR09-02 | TC-SCHED-02 | Active |
| TC-FR09-03 | TC-SCHED-03 | Active |
| TC-FR09-04 | TC-SCHED-04 | Active |
| TC-FR09-05 | TC-SCHED-05 | Active |
| TC-FR09-06 | TC-SCHED-06 | Active |
| TC-FR09-07 | TC-SCHED-07 | Active |
| TC-FR09-08 | TC-SCHED-08 | Active |
| TC-FR09-09 | TC-SCHED-09 | Active |
| TC-FR09-10 | TC-SCHED-10 | Active |
| TC-FR09-11 | TC-SCHED-11 | Active |
| TC-FR09-12 | TC-SCHED-12 | Active |
| TC-FR09-13 | TC-SCHED-13 | Active |
| TC-FR09-14 | TC-SCHED-14 | Active |
| TC-FR09-15 | TC-SCHED-15 | Active |
| TC-FR09-16 | TC-SCHED-16 | Active |
| TC-FR09-17 | TC-SCHED-17 | Active |
| TC-FR09-18 | TC-SCHED-18 | Active |
| TC-FR09-19 | TC-SCHED-19 | Active |
| TC-FR09-20 | TC-SCHED-20 | Active |
| TC-FR09-21 | TC-SCHED-21 | Active |
| TC-FR09-22 | TC-SCHED-22 | Active |
| TC-FR09-23 | TC-SCHED-23 | Active |
| TC-FR09-24 | TC-SCHED-24 | Active |
| TC-FR09-25 | TC-SCHED-25 | Active |
| TC-FR09-26 | TC-SCHED-26 | Active |
| TC-FR09-27 | TC-SCHED-27 | Active |
| TC-FR09-28 | TC-SCHED-28 | Active |
| TC-FR09-29 | TC-SCHED-29 | Active |
| TC-FR09-30 | TC-SCHED-30 | Active |
| TC-FR09-31 | TC-SCHED-31 | Active |
| TC-FR09-32 | TC-SCHED-32 | Active |
| TC-FR09-33 | TC-SCHED-33 | Active |
| TC-FR09-34 | TC-SCHED-34 | Active |
| TC-FR09-35 | TC-SCHED-35 | Active |
| TC-FR09-36 | TC-SCHED-36 | Active |
| TC-FR09-37 | TC-SCHED-37 | Active |
| TC-FR09-38 | TC-SCHED-38 | Active |
| TC-FR09-39 | TC-SCHED-39 | Active |
| TC-FR09-40 | TC-SCHED-40 | Active |
| TC-FR09-41 | TC-SCHED-41 | Active |
| TC-FR09-42 | TC-SCHED-42 | Active |
| TC-FR09-43 | TC-SCHED-43 | Active |
| TC-FR09-44 | TC-SCHED-44 | Active |
| TC-FR09-45 | TC-SCHED-45 | Active |
| TC-FR09-46 | TC-SCHED-46 | Active |
| TC-FR09-47 | TC-SCHED-47 | Active |
| TC-FR09-48 | TC-SCHED-48 | Active |
| TC-FR09-49 | TC-SCHED-49 | Active |
| TC-FR09-50 | TC-SCHED-50 | Active |
| TC-FR09-51 | TC-SCHED-51 | Active |
| TC-FR09-52 | TC-SCHED-52 | Active |
| TC-FR09-53 | TC-SCHED-53 | Active |
| TC-FR09-54 | TC-SCHED-54 | Active |
| TC-FR09-55 | TC-SCHED-55 | Active |
| TC-FR10-01 | TC-SCHED-56 | Active |
| TC-FR10-02 | TC-SCHED-57 | Active |
| TC-FR10-03 | TC-SCHED-58 | Active |
| TC-FR10-04 | TC-SCHED-59 | Active |
| TC-FR10-05 | TC-SCHED-60 | Active |
| TC-FR10-06 | TC-SCHED-61 | Active |
| TC-FR10-07 | TC-SCHED-62 | Active |
| TC-FR10-08 | TC-SCHED-63 | Active |
| TC-FR10-09 | TC-SCHED-64 | Active |
| TC-FR10-10 | TC-SCHED-65 | Active |
| TC-FR10-11 | TC-SCHED-66 | Active |
| TC-FR10-12 | TC-SCHED-67 | Active |
| TC-FR10-13 | TC-SCHED-68 | Active |
| TC-FR10-14 | TC-SCHED-69 | Active |
| TC-FR10-15 | TC-SCHED-70 | Active |
| TC-FR10-16 | TC-SCHED-71 | Active |
| TC-FR10-17 | TC-SCHED-72 | Active |
| TC-FR10-18 | TC-SCHED-73 | Active |
| TC-FR10-19 | TC-SCHED-74 | Active |
| TC-FR10-20 | TC-SCHED-75 | Active |
| TC-FR10-21 | TC-SCHED-76 | Active |
| TC-FR10-22 | TC-SCHED-77 | Active |
| TC-FR10-23 | TC-SCHED-78 | Active |
| TC-FR10-24 | TC-SCHED-79 | Active |
| TC-FR10-25 | TC-SCHED-80 | Active |
| TC-FR10-26 | TC-SCHED-81 | Active |
| TC-FR10-27 | TC-SCHED-82 | Active |
| TC-FR10-28 | TC-SCHED-83 | Active |
| TC-FR10-29 | TC-SCHED-84 | Active |
| TC-FR10-30 | TC-SCHED-85 | Active |
| TC-FR10-31 | TC-SCHED-86 | Active |
| TC-FR10-32 | TC-SCHED-87 | Active |
| TC-FR10-33 | TC-SCHED-88 | Active |
| TC-FR10-34 | TC-SCHED-89 | Active |
| TC-FR10-35 | TC-SCHED-90 | Active |
| TC-FR10-36 | TC-SCHED-91 | Active |
| TC-FR10-37 | TC-SCHED-92 | Active |
| TC-FR10-38 | TC-SCHED-93 | Active |
| TC-FR10-39 | TC-SCHED-94 | Active |
| TC-FR10-40 | TC-SCHED-95 | Active |
| TC-FR10-41 | TC-SCHED-96 | Active |
| TC-FR10-42 | TC-SCHED-97 | Active |
| TC-FR10-43 | TC-SCHED-98 | Active |
| TC-FR10-44 | TC-SCHED-99 | Active |
| TC-FR10-45 | TC-SCHED-100 | Active |
| TC-FR10-46 | TC-SCHED-101 | Active |
| TC-FR10-47 | TC-SCHED-102 | Active |
| TC-FR10-48 | TC-SCHED-103 | Active |
| TC-FR10-49 | TC-SCHED-104 | Active |
| TC-FR10-50 | TC-SCHED-105 | Active |
| TC-FR11-01 | TC-PUB-01 | Active |
| TC-FR11-02 | TC-PUB-02 | Active |
| TC-FR11-03 | TC-PUB-03 | Active |
| TC-FR11-04 | TC-PUB-04 | Active |
| TC-FR11-05 | TC-PUB-05 | Active |
| TC-FR11-06 | TC-PUB-06 | Active |
| TC-FR11-07 | TC-PUB-07 | Active |
| TC-FR11-08 | TC-PUB-08 | Active |
| TC-FR11-09 | TC-PUB-09 | Active |
| TC-FR11-10 | TC-PUB-10 | Active |
| TC-FR11-11 | TC-PUB-11 | Active |
| TC-FR11-12 | TC-PUB-12 | Active |
| TC-FR11-13 | TC-PUB-13 | Active |
| TC-FR11-14 | TC-PUB-14 | Active |
| TC-FR11-15 | TC-PUB-15 | Active |
| TC-FR11-16 | TC-PUB-16 | Active |
| TC-FR11-17 | TC-PUB-17 | Active |
| TC-FR11-18 | TC-PUB-18 | Active |
| TC-FR11-19 | TC-PUB-19 | Active |
| TC-FR11-20 | TC-PUB-20 | Active |
| TC-FR11-21 | TC-PUB-21 | Active |
| TC-FR11-22 | TC-PUB-22 | Active |
| TC-FR11-23 | TC-PUB-23 | Active |
| TC-FR11-24 | TC-PUB-24 | Active |
| TC-FR11-25 | TC-PUB-25 | Active |
| TC-FR11-26 | TC-PUB-26 | Active |
| TC-FR11-27 | TC-PUB-27 | Active |
| TC-FR11-28 | TC-PUB-28 | Active |
| TC-FR13-01 | TC-EXAM-01 | Active |
| TC-FR13-02 | TC-EXAM-02 | Active |
| TC-FR13-03 | TC-EXAM-03 | Active |
| TC-FR13-04 | TC-EXAM-04 | Active |
| TC-FR13-05 | TC-EXAM-05 | Active |
| TC-FR13-06 | TC-EXAM-06 | Active |
| TC-FR13-07 | TC-EXAM-07 | Active |
| TC-FR13-08 | TC-EXAM-08 | Active |
| TC-FR13-09 | TC-EXAM-09 | Active |
| TC-FR13-10 | TC-EXAM-10 | Active |
| TC-FR13-11 | TC-EXAM-11 | Active |
| TC-FR13-12 | TC-EXAM-12 | Active |
| TC-FR13-13 | TC-EXAM-13 | Active |
| TC-FR13-14 | TC-EXAM-14 | Active |
| TC-FR13-15 | TC-EXAM-15 | Active |
| TC-FR13-16 | TC-EXAM-16 | Active |
| TC-FR13-17 | TC-EXAM-17 | Active |
| TC-FR13-18 | TC-EXAM-18 | Active |
| TC-FR13-19 | TC-EXAM-19 | Active |
| TC-FR13-20 | TC-EXAM-20 | Active |
| TC-FR13-21 | TC-EXAM-21 | Active |
| TC-FR13-22 | TC-EXAM-22 | Active |
| TC-FR13-23 | TC-EXAM-23 | Active |
| TC-FR13-24 | TC-EXAM-24 | Active |
| TC-FR13-25 | TC-EXAM-25 | Active |
| TC-FR13-26 | TC-EXAM-26 | Active |
| TC-FR13-27 | TC-EXAM-27 | Active |
| TC-FR13-28 | TC-EXAM-28 | Active |
| TC-FR13-29 | TC-EXAM-29 | Active |
| TC-FR13-30 | TC-EXAM-30 | Active |
| TC-FR13-31 | TC-EXAM-31 | Active |
| TC-FR13-32 | TC-EXAM-32 | Active |
| TC-FR14-01 | TC-TMPL-01 | Active |
| TC-FR14-02 | TC-TMPL-02 | Active |
| TC-FR14-03 | TC-TMPL-03 | Active |
| TC-FR14-04 | TC-TMPL-04 | Active |
| TC-FR14-05 | TC-TMPL-05 | Active |
| TC-FR14-06 | TC-TMPL-06 | Active |
| TC-FR14-07 | TC-TMPL-07 | Active |
| TC-FR14-08 | TC-TMPL-08 | Active |
| TC-FR14-09 | TC-TMPL-09 | Active |
| TC-FR14-10 | TC-TMPL-10 | Active |
| TC-FR14-11 | TC-TMPL-11 | Active |
| TC-FR14-12 | TC-TMPL-12 | Active |
| TC-FR14-13 | TC-TMPL-13 | Active |
| TC-FR14-14 | — | Removed (DEFERRED) |
| TC-FR14-15 | TC-TMPL-14 | Active |
| TC-FR14-16 | TC-TMPL-15 | Active |
| TC-FR14-17 | TC-TMPL-16 | Active |
| TC-FR14-18 | TC-TMPL-17 | Active |
| TC-FR14-19 | TC-TMPL-18 | Active |
| TC-FR14-20 | TC-TMPL-19 | Active |
| TC-FR14-21 | TC-TMPL-20 | Active |
| TC-FR14-22 | TC-TMPL-21 | Active |
| TC-FR14-23 | TC-TMPL-22 | Active |
| TC-FR14-24 | TC-TMPL-23 | Active |
| TC-FR14-25 | TC-TMPL-24 | Active |
| TC-FR14-26 | TC-TMPL-25 | Active |
| TC-FR14-27 | TC-TMPL-26 | Active |
| TC-FR14-28 | TC-TMPL-27 | Active |
| TC-FR15-01 | TC-IMP-01 | Active |
| TC-FR15-02 | TC-IMP-02 | Active |
| TC-FR15-03 | TC-IMP-03 | Active |
| TC-FR15-04 | TC-IMP-04 | Active |
| TC-FR15-05 | TC-IMP-05 | Active |
| TC-FR15-06 | TC-IMP-06 | Active |
| TC-FR15-07 | TC-IMP-07 | Active |
| TC-FR15-08 | TC-IMP-08 | Active |
| TC-FR15-09 | TC-IMP-09 | Active |
| TC-FR15-10 | TC-IMP-10 | Active |
| TC-FR15-11 | TC-IMP-11 | Active |
| TC-FR15-12 | TC-IMP-12 | Active |
| TC-FR15-13 | — | Removed (DEFERRED) |
| TC-FR15-14 | TC-IMP-13 | Active |
| TC-FR15-15 | TC-IMP-14 | Active |
| TC-FR15-16 | TC-IMP-15 | Active |
| TC-FR15-17 | TC-IMP-16 | Active |
| TC-FR15-18 | TC-IMP-17 | Active |
| TC-FR15-19 | TC-IMP-18 | Active |
| TC-FR15-20 | TC-IMP-19 | Active |
| TC-FR15-21 | TC-IMP-20 | Active |
| TC-FR15-22 | TC-IMP-21 | Active |
| TC-FR15-23 | TC-IMP-22 | Active |
| TC-FR15-24 | TC-IMP-23 | Active |
| TC-FR15-25 | TC-IMP-24 | Active |
| TC-FR15-26 | TC-IMP-25 | Active |
| TC-FR15-27 | TC-IMP-26 | Active |
| TC-FR15-28 | TC-IMP-27 | Active |
| TC-FR15-29 | TC-IMP-28 | Active |
| TC-FR15-30 | TC-IMP-29 | Active |
| TC-FR15-31 | TC-IMP-30 | Active |
| TC-FR15-32 | TC-IMP-31 | Active |
| TC-FR15-33 | TC-IMP-32 | Active |
| TC-FR15-34 | TC-IMP-33 | Active |
| TC-FR15-35 | TC-IMP-34 | Active |
| TC-FR15-36 | TC-IMP-35 | Active |
| TC-FR16-01 | TC-EXP-01 | Active |
| TC-FR16-02 | TC-EXP-02 | Active |
| TC-FR16-03 | TC-EXP-03 | Active |
| TC-FR16-04 | TC-EXP-04 | Active |
| TC-FR16-05 | TC-EXP-05 | Active |
| TC-FR16-06 | TC-EXP-06 | Active |
| TC-FR16-07 | TC-EXP-07 | Active |
| TC-FR16-08 | TC-EXP-08 | Active |
| TC-FR16-09 | TC-EXP-09 | Active |
| TC-FR16-10 | TC-EXP-10 | Active |
| TC-FR16-11 | — | Removed (DEFERRED) |
| TC-FR16-12 | — | Removed (DEFERRED) |
| TC-FR16-13 | — | Removed (DEFERRED) |
| TC-FR16-14 | — | Removed (DEFERRED) |
| TC-FR21-01 | TC-EXP-11 | Active |
| TC-FR21-02 | TC-EXP-12 | Active |
| TC-FR21-03 | TC-EXP-13 | Active |
| TC-FR21-04 | TC-EXP-14 | Active |
| TC-FR21-05 | TC-EXP-15 | Active |
| TC-FR21-06 | TC-EXP-16 | Active |
| TC-FR21-07 | TC-EXP-17 | Active |
| TC-FR22-01 | TC-EXP-18 | Active |
| TC-FR22-02 | TC-EXP-19 | Active |
| TC-FR22-03 | TC-EXP-20 | Active |
| TC-FR22-04 | TC-EXP-21 | Active |
| TC-FR22-05 | TC-EXP-22 | Active |
| TC-FR22-06 | — | Removed (DEFERRED) |
| TC-FR22-07 | TC-EXP-23 | Active |
| TC-FR23-01 | TC-EXP-24 | Active |
| TC-FR23-02 | TC-EXP-25 | Active |
| TC-FR23-03 | TC-EXP-26 | Active |
| TC-FR23-04 | TC-EXP-27 | Active |
| TC-FR23-05 | — | Removed (DEFERRED) |
| TC-FR23-06 | TC-EXP-28 | Active |
| TC-FR16-15 | TC-EXP-29 | Active |
| TC-FR21-08 | TC-EXP-30 | Active |
| TC-FR20-01 | TC-DASH-01 | Active |
| TC-FR20-02 | TC-DASH-02 | Active |
| TC-FR20-03 | TC-DASH-03 | Active |
| TC-FR20-04 | TC-DASH-04 | Active |
| TC-FR20-05 | TC-DASH-05 | Active |
| TC-FR20-06 | TC-DASH-06 | Active |
| TC-FR20-07 | TC-DASH-07 | Active |
| TC-FR20-08 | TC-DASH-08 | Active |
| TC-FR20-09 | TC-DASH-09 | Active |
| TC-FR20-10 | TC-DASH-10 | Active |
| TC-FR20-11 | TC-DASH-11 | Active |
| TC-FR20-12 | TC-DASH-12 | Active |
| TC-FR20-13 | TC-DASH-13 | Active |
| TC-FR20-14 | TC-DASH-14 | Active |
| TC-FR20-15 | TC-DASH-15 | Active |
| TC-FR20-16 | TC-DASH-16 | Active |
| TC-FR12-01 | TC-AUDIT-01 | Active |
| TC-FR12-02 | TC-AUDIT-02 | Active |
| TC-FR12-03 | TC-AUDIT-03 | Active |
| TC-FR12-04 | TC-AUDIT-04 | Active |
| TC-FR12-05 | TC-AUDIT-05 | Active |
| TC-FR12-06 | TC-AUDIT-06 | Active |
| TC-FR12-07 | TC-AUDIT-07 | Active |
| TC-FR12-08 | TC-AUDIT-08 | Active |
| TC-FR12-09 | TC-AUDIT-09 | Active |
| TC-FR12-10 | TC-AUDIT-10 | Active |
| TC-FR12-11 | TC-AUDIT-11 | Active |
| TC-FR12-12 | TC-AUDIT-12 | Active |
| TC-FR12-13 | TC-AUDIT-13 | Active |
| TC-FR12-14 | TC-AUDIT-14 | Active |
| TC-FR12-15 | TC-AUDIT-15 | Active |
| TC-FR12-16 | TC-AUDIT-16 | Active |
| TC-FR12-17 | TC-AUDIT-17 | Active |
| TC-FR12-18 | TC-AUDIT-18 | Active |
| TC-FR12-19 | TC-AUDIT-19 | Active |
| TC-FR12-20 | TC-AUDIT-20 | Active |
| TC-FR12-21 | — | Removed (DEFERRED) |
| TC-FR12-22 | TC-AUDIT-21 | Active |
| TC-FR19-01 | TC-BKUP-01 | Active |
| TC-FR19-02 | TC-BKUP-02 | Active |
| TC-FR19-03 | TC-BKUP-03 | Active |
| TC-FR19-04 | TC-BKUP-04 | Active |
| TC-FR19-05 | TC-BKUP-05 | Active |
| TC-FR19-06 | TC-BKUP-06 | Active |
| TC-FR19-07 | TC-BKUP-07 | Active |
| TC-FR19-08 | TC-BKUP-08 | Active |
| TC-FR19-09 | TC-BKUP-09 | Active |
| TC-FR19-10 | TC-BKUP-10 | Active |
| TC-FR19-11 | TC-BKUP-11 | Active |
| TC-FR19-12 | TC-BKUP-12 | Active |
| TC-FR19-13 | TC-BKUP-13 | Active |
| TC-FR19-14 | TC-BKUP-14 | Active |
| TC-FR19-15 | TC-BKUP-15 | Active |
| TC-FR19-16 | TC-BKUP-16 | Active |
| TC-FR19-17 | TC-BKUP-17 | Active |
| TC-FR19-18 | TC-BKUP-18 | Active |
| TC-FR19-19 | — | Removed (DEFERRED) |
| TC-FR19-20 | TC-BKUP-19 | Active |
| TC-FR19-21 | TC-BKUP-20 | Active |
| TC-FR19-22 | TC-BKUP-21 | Active |
| TC-FR19-23 | TC-BKUP-22 | Active |
| TC-FR19-24 | TC-BKUP-23 | Active |
| TC-FR19-25 | TC-BKUP-24 | Active |
| TC-FR19-26 | TC-BKUP-25 | Active |
| TC-FR19-27 | TC-BKUP-26 | Active |
| TC-FR19-28 | TC-BKUP-27 | Active |
| TC-TRS-01 | TC-TRASH-01 | Active |
| TC-TRS-02 | TC-TRASH-02 | Active |
| TC-TRS-03 | TC-TRASH-03 | Active |
| TC-TRS-04 | TC-TRASH-04 | Active |
| TC-TRS-05 | TC-TRASH-05 | Active |
| TC-TRS-06 | TC-TRASH-06 | Active |
| TC-TRS-07 | TC-TRASH-07 | Active |
| TC-TRS-08 | TC-TRASH-08 | Active |
| TC-TRS-09 | TC-TRASH-09 | Active |
| TC-TRS-10 | TC-TRASH-10 | Active |
| TC-TRS-11 | TC-TRASH-11 | Active |
| TC-TRS-12 | TC-TRASH-12 | Active |
| TC-TRS-13 | TC-TRASH-13 | Active |
| TC-TRS-14 | TC-TRASH-14 | Active |
| TC-TRS-15 | TC-TRASH-15 | Active |
| TC-TRS-16 | TC-TRASH-16 | Active |
| TC-TRS-17 | TC-TRASH-17 | Active |
| TC-TRS-18 | TC-TRASH-18 | Active |
| TC-TRS-19 | TC-TRASH-19 | Active |
| TC-TRS-20 | TC-TRASH-20 | Active |
| TC-EDG-001 | TC-EDGE-01 | Active |
| TC-EDG-002 | TC-EDGE-02 | Active |
| TC-EDG-003 | TC-EDGE-03 | Active |
| TC-EDG-004 | TC-EDGE-04 | Active |
| TC-EDG-005 | TC-EDGE-05 | Active |
| TC-EDG-006 | TC-EDGE-06 | Active |
| TC-EDG-007 | TC-EDGE-07 | Active |
| TC-EDG-008 | TC-EDGE-08 | Active |
| TC-EDG-009 | TC-EDGE-09 | Active |
| TC-EDG-010 | TC-EDGE-10 | Active |
| TC-EDG-011 | TC-EDGE-11 | Active |
| TC-EDG-012 | TC-EDGE-12 | Active |
| TC-EDG-013 | TC-EDGE-13 | Active |
| TC-EDG-014 | TC-EDGE-14 | Active |
| TC-EDG-015 | TC-EDGE-15 | Active |
| TC-EDG-016 | TC-EDGE-16 | Active |
| TC-EDG-017 | TC-EDGE-17 | Active |
| TC-EDG-018 | TC-EDGE-18 | Active |
| TC-EDG-019 | TC-EDGE-19 | Active |
| TC-EDG-020 | TC-EDGE-20 | Active |
| TC-EDG-021 | TC-EDGE-21 | Active |
| TC-EDG-022 | TC-EDGE-22 | Active |
| TC-EDG-023 | TC-EDGE-23 | Active |
| TC-EDG-024 | TC-EDGE-24 | Active |
| TC-EDG-025 | TC-EDGE-25 | Active |
| TC-EDG-026 | TC-EDGE-26 | Active |
| TC-EDG-027 | TC-EDGE-27 | Active |
| TC-EDG-028 | TC-EDGE-28 | Active |
| TC-EDG-029 | TC-EDGE-29 | Active |
| TC-EDG-030 | TC-EDGE-30 | Active |
| TC-NFR-001 | TC-NFR-01 | Active |
| TC-NFR-002 | TC-DEV-14 | Active |
| TC-NFR-003 | TC-DEV-15 | Active |
| TC-NFR-004 | TC-DEV-16 | Active |
| TC-NFR-005 | TC-NFR-02 | Active |
| TC-NFR-006 | TC-NFR-03 | Active |
| TC-NFR-007 | TC-NFR-04 | Active |
| TC-NFR-008 | TC-NFR-05 | Active |
| TC-NFR-009 | TC-DEV-17 | Active |
| TC-NFR-010 | TC-NFR-06 | Active |
| TC-NFR-011 | TC-DEV-18 | Active |
| TC-NFR-012 | TC-DEV-19 | Active |
| TC-NFR-013 | TC-NFR-07 | Active |
| TC-NFR-014 | TC-NFR-08 | Active |
| TC-NFR-015 | TC-NFR-09 | Active |
| TC-NFR-016 | TC-DEV-20 | Active |
| TC-NFR-017 | TC-NFR-10 | Active |
| TC-NFR-018 | TC-NFR-11 | Active |
| TC-NFR-019 | TC-NFR-12 | Active |
| TC-NFR-020 | TC-NFR-13 | Active |
| TC-NFR-021 | TC-NFR-14 | Active |
| TC-NFR-022 | TC-NFR-15 | Active |
| TC-NFR-023 | TC-NFR-16 | Active |
| TC-NFR-024 | TC-NFR-17 | Active |
| TC-NFR-025 | TC-NFR-18 | Active |
| TC-NFR-026 | TC-DEV-21 | Active |
| TC-NFR-027 | TC-NFR-19 | Active |
| TC-NFR-028 | TC-DEV-22 | Active |
| TC-NFR-029 | TC-NFR-20 | Active |
| TC-NFR-030 | TC-DEV-23 | Active |
| TC-NFR-031 | TC-NFR-21 | Active |
| TC-NFR-032 | TC-NFR-22 | Active |
| TC-NFR-033 | TC-NFR-23 | Active |
| TC-NFR-034 | TC-NFR-24 | Active |

</details>

---

## 7. Document Rules

> **Document Rules:**
> - This document is generated from the SRS acceptance criteria. When the SRS is updated, affected test cases must be updated to match.
> - Test IDs use the format `TC-PREFIX-NN` where PREFIX identifies the user journey (AUTH, ACAD, ROOM, etc.) and NN is a sequential number.
> - Test IDs (TC-PREFIX-NN) are permanent — never renumber them. If a test is removed, mark it as "Removed — [reason]" instead of deleting it.
> - Steps must be written in plain language. Do not use technical terms like API, endpoint, HTTP, database, status code, Bearer token, localStorage, cookie, backend, frontend, IPC, etc. Describe what the user sees and does on screen.
> - "What you need" must describe the setup in plain terms. Say "Logged in" not "Authenticated with role=admin".
> - **"Where" must specify the exact page or screen** using the sidebar label as it appears in the app (e.g., "Sidebar > Rooms", "Sidebar > Settings"). For pages not in the sidebar, describe how to reach them (e.g., "Login screen", "Setup screen"). If the test case writer cannot identify a UI location, this signals a missing feature — flag it immediately instead of writing a test that cannot be executed.
> - When a "Where" field cannot be identified because the feature's UI does not exist yet, add `⚠️ [missing page description]` to the "Where" field and include a skip notice explaining which part of the test cannot be executed.
> - "What should happen" must describe visible outcomes — a message, a page change, a button appearing, a number changing.
> - End-to-End Flows use a 4-column table: `Step | Who does it | What to do | What should happen`.
> - When filing a bug, always include the test ID (e.g., "Bug found in TC-AUTH-04").
> - Developer-only tests (requiring database browser, DevTools, or file system inspection) belong in Section 5, not in the main test cases.
> - **Depends on:** SRS document. When the SRS version changes, review this test plan for affected test cases.

