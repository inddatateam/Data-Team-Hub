# Data Team Hub

## Shared links and branding

### SOP library

The home page links to `sop.html` through SOP Zendesk. The document list and SOP search live on that separate page; individual SOPs are excluded from the home resource list.

`sop.resources.js` contains the eight original Word document URLs supplied by the user. The workflow copy and PDF are excluded. Open document uses the browser URL; Open in Word uses the same SharePoint document address without web=1. Live Microsoft access still depends on the user's sign-in and permissions; automated checks verify link construction, not authenticated access.

For each original Word/PDF file, use Share / Copy link in Microsoft, with existing team access or the appropriate company permission. Paste the file link into Add document link in the SOP library. Open document then takes users directly to that document in Microsoft, subject to sign-in and access. Edit link can replace it later.

Editing and saving the same original cloud document keeps hub users on that document's current saved content. The hub stores no document copy. Replacing/deleting the file or revoking/expiring its sharing link may require a new link. Unsaved or not-yet-synced desktop edits are not visible to other users.

To publish links for everyone, edit `sop.resources.js` directly, or export shared links after configuring them in the browser and replace the project's `resources.generated.js`, then redeploy. Browser-only saved links are not shared automatically. Keep `sop.resources.js` in the deployment as well.

The IND theme is in `ind-theme.css`. Brand colours are provisional, based on the supplied logo reference.

Weekly workspace prioritises KL Meeting Minutes, Data Team Dashboard, Weekly Team Checklist and the desktop tool. Existing SharePoint folder links remain in the library.

Needed to complete the workspace:

- Direct Power BI report URL for Data Team Dashboard (an approved secure embed URL is optional for an inline dashboard).
- Direct Excel workbook URL for Weekly Team Checklist, rather than the checklist folder.
- Direct tool download/file URL for Pole Pinning & Excel 360.
- Original IND logo PNG/SVG and brand colour codes, if available.

Changes made with Add link are saved to this browser only. Export shared links downloads a replacement `resources.generated.js`; replace the project's file with it and redeploy to share those links with the team. This does not upload files or save meeting notes. Notes are edited and saved in the linked Microsoft notebook.

A lightweight static web app for keeping data team resources in one place: Power BI reports, Excel files, shared folders, data sources, SOPs, and automation links.

## Open the app

Open `index.html` in a browser. No build step is needed.

From VS Code, the easiest local run is:

```powershell
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

If port `5500` is busy, use another port:

```powershell
python -m http.server 5501
```

## Add real resources

Use the **Add resource** button in the app. Items are saved in the browser with `localStorage`, so the same browser will remember them.

Examples of useful links:

- Power BI report URL from the Power BI service
- SharePoint or OneDrive folder links
- Excel file links from SharePoint or OneDrive
- Local file links such as `file:///C:/Users/YourName/Documents/file.xlsx`
- Internal SOP or documentation URLs

## Connect OneDrive synced folders

Because this is a static HTML app, the browser cannot automatically scan your OneDrive folder. Use the included PowerShell scanner from VS Code instead. By default it keeps the top-level OneDrive folder structure, so the hub stays clean:

```powershell
.\scan-onedrive.ps1 -RootPath "C:\Users\YOURNAME\OneDrive - IND Technology\IND.T Data Team - General"
```

The script writes `resources.generated.js`. Refresh `index.html` after running it and the hub will show the scanned OneDrive folders and files.

If your OneDrive path is detected automatically, this shorter command may work:

```powershell
.\scan-onedrive.ps1
```

To scan subfolders too, use:

```powershell
.\scan-onedrive.ps1 -IncludeNested -Depth 2
```

## Publishing to Vercel

Do not publish `file:///C:/Users/...` links to Vercel. Those links only work on the computer that generated them.

For a team-facing Vercel site, use OneDrive or SharePoint web links for each main folder. The simplest workflow is:

- Keep the hub as top-level folders.
- In OneDrive/SharePoint, copy the web link for each main folder.
- Paste those links into the hub with **Add resource**, or edit `resources.generated.js`.
- Deploy the static files to Vercel.

Users will open the hub from Vercel, then OneDrive/SharePoint will handle access permissions with their company account.

Desktop tools cannot be launched directly from a Vercel website for security reasons. For tools like `.exe` apps, link to the SharePoint folder or installer file so users can open or download it from OneDrive.

## Files

- `index.html` - app structure
- `styles.css` - dashboard styling and responsive layout
- `app.js` - search, filters, and local saved resources
- `resources.generated.js` - generated resource list from OneDrive
- `scan-onedrive.ps1` - OneDrive folder scanner
