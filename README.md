# English 6-Level Learning Journey — Version 6

Version 6 changes the dashboard from an activity tracker into a more complete classroom learning and assessment system.

## Core learning resources

- Read Along by Google: Levels 1–4
- ELLO: Levels 1–6
- British Council LearnEnglish Teens: Levels 1–6

## New in Version 6

### Student experience

- Weekly Assignments page with deadlines, objectives, evidence requirements, and success criteria
- Assignment evidence submission and reflection
- Six-skill matrix: Listening, Speaking, Reading, Writing, Vocabulary, and Grammar
- Baseline, progress, and post-assessment growth chart
- Primary skill field in every learning log
- Teacher verification status for learning evidence
- Reflection sentence starters for beginning learners
- Improved keyboard focus, Escape-to-close modals, skip link, and reduced-motion support

### Teacher experience

- Separate tabs for Overview, Students, Assignments, Assessments, and Class Settings
- Assignment creator with resource links, deadlines, skills, and success criteria
- Teacher-entered baseline, progress, and post-assessments
- Evidence verification: Verified, Pending, or Needs revision
- Assessment completion and growth summary
- Short-lived teacher sessions that expire after 30 minutes
- Failed-login limiting and an AuditLog sheet
- Soft deletion for learning logs so deleted rows are retained in Google Sheets

## Important security note

Version 6 is safer than earlier versions because the teacher PIN is exchanged for a temporary session token. However, the project still uses GitHub Pages, Google Apps Script, Google Sheets, and JSONP. It is suitable for small classroom use with non-sensitive learning records. It is not designed for confidential student information, school-wide identity management, or high-stakes assessment data.

Do not store national ID numbers, home addresses, health information, passwords, or other sensitive personal data.

## GitHub Pages setup

1. Upload the project files to a GitHub repository.
2. Keep `index.html`, `app.js`, `styles.css`, and `config.js` in the repository root.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save and open the published GitHub Pages URL.

## Google Apps Script setup

1. Open `script.google.com` and create or open the existing project.
2. Copy `backend/Code.gs` into the Apps Script editor.
3. Set `CLASS_CODE` and `TEACHER_PIN` at the top of the file.
4. Select `upgradeV6` and click **Run** once.
5. Approve permissions when Google asks.
6. Choose **Deploy → Manage deployments**.
7. Edit the existing Web app deployment.
8. Select **New version** and click **Deploy**.
9. Keep the existing `/exec` URL.
10. Confirm that the same URL and class code remain in `config.js`.

Running `upgradeV6` adds these structures without deleting old records:

- New columns in `Logs`: Skill, VerificationStatus, VerifiedAt, DeletedAt, UpdatedAt
- New sheet: Assignments
- New sheet: Submissions
- New sheet: Assessments
- New sheet: AuditLog

## Files

- `index.html` — interface and page structure
- `styles.css` — responsive design and accessibility styles
- `app.js` — dashboard, assignments, skills, assessments, and API calls
- `config.js` — Google Apps Script URL and class settings
- `backend/Code.gs` — Google Sheets backend
- `TEACHER_GUIDE.md` — teacher workflow
- `MIGRATION_V6.md` — upgrade instructions from Version 5
