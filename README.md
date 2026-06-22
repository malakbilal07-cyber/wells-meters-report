# Wells & Meters Field Report — Website

A free, static website built from `Wells_and_Meters_Comprehensive_Report_V_0_1.xlsx`.
It shows your Wells and Electrical Meters data in sortable/searchable tables, plots
wells on a map (using their Latitude/Longitude), and lets you add new wells or
meters straight from the browser — no server, no database, no cost.

## Files
- `index.html` — the page structure
- `app.js` — all the interactive logic (tables, map, forms, CSV export)
- `data.js` — your original spreadsheet data, converted to JSON and embedded

## How "Add New" works
New records you add are saved in **localStorage** — a small storage area inside
your browser. That means:
- They'll still be there next time you open the site **on the same browser, same device**.
- They will **not** appear for other people who open the link, and won't show up
  if you clear your browser data or switch browsers/devices.
- Use the **Export CSV** buttons on the Wells/Meters tabs any time to download
  a backup of everything (original + added rows) as a spreadsheet-ready file.

If later you want additions to be visible to everyone who visits the site (a
shared, permanent database), that needs a small free backend — happy to set
that up too (e.g. Google Sheets as a database, or Firebase) if you want it.

## Put it on GitHub Pages (free hosting)

1. Create a new repository on GitHub (e.g. `wells-meters-report`).
2. Upload these three files (`index.html`, `app.js`, `data.js`) to the
   repository — either drag-and-drop on the GitHub website ("Add file" →
   "Upload files"), or with git:
   ```bash
   git init
   git add index.html app.js data.js
   git commit -m "Wells and meters site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/wells-meters-report.git
   git push -u origin main
   ```
3. On GitHub: go to the repo → **Settings** → **Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch",
   pick branch **main** and folder **/ (root)**, then **Save**.
5. After a minute, GitHub gives you a live URL, usually:
   `https://YOUR-USERNAME.github.io/wells-meters-report/`

That's it — the site is live and free, and you can keep updating it by
re-uploading the files whenever your spreadsheet changes.

## Updating the data later
If your spreadsheet changes significantly, send me the updated `.xlsx` and
I'll regenerate `data.js` for you. Anything added through the website's
"Add New" form lives separately in each visitor's browser, so re-uploading
`data.js` won't erase what they've added locally.
