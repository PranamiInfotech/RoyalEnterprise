# Google Cloud OAuth setup checklist

- [ ] Create/select a Google Cloud project.
- [ ] Enable Google Drive API.
- [ ] Configure Google Auth Platform branding and audience.
- [ ] Add your Google account as a Test user if app is External + Testing.
- [ ] Add scope: `https://www.googleapis.com/auth/drive.file`.
- [ ] Create OAuth Client ID → Web application.
- [ ] Authorized JavaScript origin: `https://YOUR-USERNAME.github.io` (origin only).
- [ ] Copy Client ID (do not use a client secret).
- [ ] Deploy `index.html` to GitHub Pages.
- [ ] Paste Client ID into Company Settings → Google Drive integration.
- [ ] Save configuration and click Connect Google Drive.
- [ ] Test a sample invoice and confirm PDF + JSON in Drive.
