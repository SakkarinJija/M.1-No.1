# Upgrade from Version 5 to Version 6

## 1. Back up the current project

Download the existing GitHub repository as a ZIP and make a copy of the Google Sheet.

## 2. Update GitHub

Use the Version 6 update package. It does not include `config.js`, so the current API URL, class code, school name, and application title are preserved.

Upload the files and commit them to the same branch used by GitHub Pages.

## 3. Update Google Apps Script

1. Open the existing Apps Script project.
2. Copy the existing `CLASS_CODE` and `TEACHER_PIN` values.
3. Replace the old `Code.gs` with `backend/Code.gs` from Version 6.
4. Restore the existing `CLASS_CODE` and `TEACHER_PIN` values.
5. Save the script.
6. Select `upgradeV6` from the function menu.
7. Click **Run** and approve permissions if requested.

Do not run `setup` again. Version 6 uses the existing database.

## 4. Update the deployment

Choose:

`Deploy → Manage deployments → Edit → New version → Deploy`

Keep the existing `/exec` URL.

## 5. Refresh the website

- Windows: `Ctrl + Shift + R`
- Mac: `Command + Shift + R`

Teacher sessions from earlier versions will not remain active. Sign in again with the teacher PIN.

## Data migration

Version 6 retains the existing Students, Logs, TeacherNotes, and Settings sheets. It appends new columns and creates Assignments, Submissions, Assessments, and AuditLog sheets. Existing logs without a skill remain valid and can be edited later to add one.
