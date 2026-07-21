# English 6-Level Learning Journey — Version 7

Version 7 is a pilot-ready classroom dashboard for a six-month English learning journey. Students record practice, submit assignment evidence, and view skill development. Teachers create student accounts, review evidence, enter assessments, and identify students who need support.

## Core Features

### Student
- Protected sign-in using Student ID, Class, Class Code, and a personal access code
- Learning logs with primary skill, study time, score, confidence, evidence, and reflection
- Weekly assignments and evidence submission
- Practice-evidence skill matrix and teacher-entered assessment growth
- Weekly goal, streak, learning calendar, achievements, backup, print report, dark mode, and PWA installation

### Teacher
- Teacher-created student accounts and access-code reset
- Class overview, support alerts, consistency view, student records, and CSV export
- Assignment creation and a submission review queue
- Teacher feedback, optional scores, approval, and revision requests
- Evidence verification, support notes, and baseline/progress/post assessments
- Class announcements and weekly study goals

## Data and Security Model

- GitHub Pages hosts the static interface.
- Google Apps Script connects the interface to Google Sheets.
- Personal access codes are stored as salted SHA-256 hashes, not plain text.
- Student sessions last four hours. Teacher sessions last 30 minutes.
- The service worker handles only same-origin static assets and does not intercept Google Apps Script requests.

This architecture is intended for a small classroom pilot using non-sensitive learning data. Do not store national identification numbers, home addresses, health information, passwords, safeguarding records, or other confidential data.

## Upgrade from Version 6

Read `MIGRATION_V7.md`. Keep the existing `config.js`, replace `backend/Code.gs`, run `upgradeV7`, and deploy a new version of the existing Apps Script Web app.

## Files

- `index.html` — interface
- `styles.css` — responsive visual design
- `app.js` — student and teacher application logic
- `config.js` — API URL, class code, application title, and school name
- `service-worker.js` and `manifest.webmanifest` — installable PWA support
- `backend/Code.gs` — Google Apps Script database API
- `MIGRATION_V7.md` — upgrade instructions
- `TEACHER_GUIDE.md` — classroom workflow
