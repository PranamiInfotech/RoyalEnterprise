# Royal Enterprise GST Invoice Generator — Google Drive Edition

This is the updated static GitHub Pages version of the Royal Enterprise invoice generator.

## Included

- Original Royal Enterprise-style A4 invoice preview.
- Six board-type dropdown choices and editable Size / GSM field.
- INR, CGST/SGST, IGST, amount in words, customer/product management and local invoice history.
- Google Drive OAuth 2.0 connection from the browser.
- Manual upload from Invoice Preview or Invoice History.
- Automatic upload after clicking **Save invoice to history**, when Drive is already connected and the access token is still valid.
- Monthly folders: `Royal Enterprise Invoices / YYYY / Month`.
- Both PDF and JSON invoice backup are uploaded.
- If a file with the same generated name already exists in that month folder, the integration updates it instead of creating another copy.

## Important behavior and security

- This is a static GitHub Pages app. No backend or Google client secret is required.
- The OAuth **Client ID** is public and belongs in the website settings. Never put a client secret in this app.
- The app requests the narrow `https://www.googleapis.com/auth/drive.file` scope. It can create/manage files created by this app, rather than requesting broad access to every file in Drive.
- The Google access token is held in JavaScript memory only. It is not stored in localStorage. The user may need to reconnect after the token expires or after refreshing the page.
- Automatic upload occurs only when the user has connected Drive and the in-memory token is still valid. Otherwise the invoice is safely saved in local browser history and can be uploaded manually after reconnecting.
- Browser invoice history and customer/product data remain in that browser's localStorage. Google Drive receives invoice PDF and JSON copies, not a live synchronized database.
- PDF creation uses html2pdf.js loaded from cdnjs; Google OAuth uses Google Identity Services. The browser needs an internet connection for these libraries and Drive API calls.

## Google Cloud setup

### 1. Create a Google Cloud project
1. Open https://console.cloud.google.com/
2. Create a project, for example `Royal Enterprise Invoice App`.
3. Select that project.

### 2. Enable Google Drive API
1. Open https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Select the project.
3. Click **Enable**.

### 3. Configure Google Auth Platform / OAuth consent
1. Open https://console.cloud.google.com/auth/overview
2. If prompted, click **Get started**.
3. Set App name to `Royal Enterprise Invoice Generator`.
4. Select a support email and developer contact email.
5. Choose **External** audience for a regular personal Google account.
6. If the app is in Testing mode, add the Google account that will store the invoices under **Test users**.
7. Under **Data Access**, add the scope `https://www.googleapis.com/auth/drive.file` if the console asks you to declare scopes.
8. Save.

For personal use with only your own Google account, keep the app in Testing and add your account as a test user. Google may show an unverified-app warning during authorization. Do not distribute the app publicly without completing Google's applicable verification requirements.

### 4. Create OAuth Client ID
1. Open Google Auth Platform → **Clients**.
2. Click **Create client**.
3. Application type: **Web application**.
4. Name: `Royal Enterprise GitHub Pages`.
5. Under **Authorized JavaScript origins**, add the origin only (no repository path), for example:
   `https://YOUR-GITHUB-USERNAME.github.io`
6. If you use a custom domain, add its origin too, e.g. `https://invoices.example.com`.
7. For local testing, optionally add the exact local origin such as `http://localhost:5500`.
8. Click Create and copy the **Client ID**.
9. Do not add a client secret to this static website. A browser-based OAuth client does not use one.

### 5. Configure the website
1. Deploy the updated `index.html` to the root of your existing GitHub Pages repository, replacing the old one.
2. Open the published website using the exact HTTPS GitHub Pages URL.
3. Open **Company Settings**.
4. In **Google Drive integration**, paste the OAuth Client ID.
5. Click **Save Drive configuration**.
6. Click **Connect Google Drive** and select the Google account where invoices should be stored.
7. Approve the requested Drive file access.

### 6. Test
1. Create a clearly marked test invoice with dummy customer details.
2. Click **Save invoice to history** while Drive is connected. This tests automatic upload.
3. Open Google Drive → `Royal Enterprise Invoices` → year → month.
4. Confirm both `.pdf` and `.json` files exist.
5. To test manual upload, open an invoice from history or preview and click **Save PDF + JSON to Drive**.

## Troubleshooting

- **origin_mismatch**: the Authorized JavaScript origin must match the website origin exactly. For a GitHub Pages project site, use `https://USERNAME.github.io`, not the full `/repository/` path.
- **Access blocked / app not configured**: check OAuth audience, test users, and the Drive API enablement.
- **Google authorization library did not load**: refresh with internet access; allow `accounts.google.com` scripts/popups.
- **Token expired**: go to Company Settings and click Connect Google Drive again.
- **PDF generator library did not load**: check internet access or CDN availability and reload.
- **Upload failed / insufficient permissions**: disconnect, reconnect and approve the `drive.file` permission.
- **No upload on automatic save**: automatic upload requires a currently valid in-memory Google token. Connect Drive after each page refresh, then save; otherwise use manual upload.

## Deploying updates to GitHub Pages

Replace the existing repository-root `index.html` with this version and commit the change. GitHub Pages keeps the same website URL. Keep your existing browser data; do not clear site storage during the update.

## Legal / accounting reminder

Verify seller and buyer GST details, HSN codes, tax rates, tax treatment and invoice requirements with your accountant before issuing invoices. This software is an invoice-generation aid, not a GST compliance or e-invoicing filing service.
