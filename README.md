# English 6-Level Learning Journey — Version 5 English

A six-month student learning dashboard with a teacher progress tracker. The entire interface, notifications, charts, forms, and backend error messages are in English.

## Main Features

- Six-level English learning roadmap
- Read Along by Google: Levels 1–4
- ELLO: Levels 1–6
- British Council LearnEnglish Teens: Levels 1–6
- Weekly study goals, streaks, learning calendar, and achievement badges
- Editable student learning logs
- Teacher announcements and class goals
- Individual student detail view and private teacher support notes
- CSV export, JSON backup, print/PDF reports, dark mode, and PWA installation

## Publish with GitHub Pages

1. Create or open your GitHub repository.
2. Upload the website files.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Click **Save**.

The website opens immediately in demo mode. In demo mode, each student's data remains only in that browser.

## Connect the Shared Google Sheets Database

GitHub Pages is static, so Google Apps Script and Google Sheets provide the shared database.

1. Open `script.google.com` and create or open the existing project.
2. Copy `backend/Code.gs` into the Apps Script editor.
3. Restore your existing `CLASS_CODE` and `TEACHER_PIN`.
4. Select `upgradeV5` and click **Run** once.
5. Choose **Deploy → Manage deployments**.
6. Edit the existing web-app deployment.
7. Select **New version**, then click **Deploy**.
8. Continue using the same `/exec` URL.

For a new installation, run `setup` before deploying the web app. Set **Execute as: Me** and **Who has access: Anyone** when your Google Workspace policy allows it.

## Configuration

Keep your working values in `config.js`:

```javascript
window.APP_CONFIG = {
  API_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  CLASS_CODE: "YOUR_CLASS_CODE",
  APP_TITLE: "English 6-Level Learning Journey",
  SCHOOL_NAME: "Your School"
};
```

`CLASS_CODE` must exactly match the value in `Code.gs`.

## Important Notes

- The six levels are project learning stages, not official CEFR certification.
- The teacher PIN provides only basic access control. Do not store highly sensitive personal information in this system.
- Existing student, log, settings, and teacher-note data remain compatible with Version 5.
