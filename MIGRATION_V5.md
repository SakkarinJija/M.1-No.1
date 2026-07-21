# Upgrade from Version 4 to Version 5 English

Version 5 converts the full interface and backend messages to English while keeping the existing database structure and student data.

## Website Files

1. Back up your current repository.
2. Upload the files from the Version 5 update package.
3. Do not overwrite your working `config.js`.
4. Commit the changes.
5. Hard-refresh the GitHub Pages website.

## Google Apps Script

1. Record your existing `CLASS_CODE` and `TEACHER_PIN`.
2. Replace the existing Apps Script code with `backend/Code.gs` from Version 5.
3. Restore the original `CLASS_CODE` and `TEACHER_PIN`.
4. Save the script.
5. Select `upgradeV5` and click **Run** once.
6. Choose **Deploy → Manage deployments → Edit → New version → Deploy**.
7. Continue using the same `/exec` URL.

No new Google Sheets file is required, and existing student data is preserved.
