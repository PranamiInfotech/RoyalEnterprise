# Royal Enterprise GST Invoice Generator

A static, browser-based INR invoice generator inspired by the uploaded Royal Enterprise tax invoice.

## Files
- `index.html` — complete application (HTML, CSS and JavaScript in one file).

## Publish with GitHub Pages
1. Sign in to GitHub and create a new repository, for example `royal-enterprise-invoice`.
2. Choose **Public** (or check the GitHub Pages availability for your account/repository type).
3. Upload `index.html` to the repository root and commit the file.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch **main** and folder **/(root)**, then click **Save**.
7. Wait for GitHub Pages to publish. The URL will be shown on the Pages settings screen, usually `https://YOUR-USERNAME.github.io/royal-enterprise-invoice/`.

## How to use
1. Open the website and go to **Company Settings**. Verify/edit seller details, GSTIN, bank details, state and default GST rate.
2. Add customers in **Customers** and products in **Products**, or enter customer details directly while creating an invoice.
3. On **Create Invoice**, add line items, quantities and rates. Choose CGST+SGST for intra-state supply, IGST for inter-state supply, or No GST.
4. Check the totals and amount in words, then select **Save invoice to history**.
5. Select **Invoice Preview → Print / Save PDF**. In the print dialog, choose **Save as PDF**.
6. Use **Export backup (JSON)** on the Invoice History page regularly. Import the JSON backup to restore data in the same or another browser.

## Important notes
- This is a front-end-only application. Customers, products and invoices are stored in the browser's `localStorage` on that device/browser. It does not sync between devices or users and has no login or server database.
- Do not clear browser storage without exporting a backup first.
- The reference invoice details were transcribed as initial editable defaults. Verify all seller details, GSTIN, bank information, tax rate, HSN and tax treatment before issuing any real tax invoice.
- GST calculation is a convenience, not tax advice. Confirm applicable GST rate, place of supply, invoice requirements and rounding with your accountant/tax adviser.
- The initial invoice number starts at 678 to follow the sample invoice's bill number. Change the `nextNumber` value in the `defaultData` object in `index.html` if you want a different starting sequence. Once data has been saved in a browser, its stored sequence takes precedence.
- For a business-critical multi-user system, use authentication and a secure database rather than browser-only storage.
