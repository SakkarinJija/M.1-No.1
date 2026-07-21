# Upgrade to Version 7

## What changes

- Teacher-created student accounts with personal access codes
- Four-hour student sessions and 30-minute teacher sessions
- Access codes are stored as SHA-256 hashes with a project-specific salt
- Assignment submission review, scores, feedback, and revision requests
- Safer PWA service worker that ignores Google Apps Script and other cross-origin requests
- Clear sync/offline status and improved keyboard focus inside dialogs

## Existing students

Existing students using the same browser can open **Profile**, create a new personal access code, and save. Existing students moving to a new device must ask the teacher to open their record and reset the access code.

## Upgrade steps

1. Back up the existing Google Sheet and GitHub repository.
2. Upload the Version 7 update files to GitHub. Keep the existing `config.js`.
3. Replace the Apps Script `Code.gs` with the Version 7 file. Restore your existing `CLASS_CODE` and `TEACHER_PIN`.
4. Run `upgradeV7` once.
5. Deploy a **New version** of the existing Web app. Keep the same `/exec` URL.
6. Hard-refresh the GitHub Pages site.

## Important limitation

Version 7 is suitable for a small classroom pilot using non-sensitive learning data. It is not a full school identity platform and should not store national identification numbers, health information, addresses, passwords, or confidential safeguarding records.
