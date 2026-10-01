# Public GitHub Pages deployment

Open `index.html` at the repository root. In GitHub Pages settings, use GitHub Actions. The Pages workflow publishes the app files from `main`, checks that the public seed is empty, and excludes backups and development files from the deployed artifact.

The public seed is intentionally empty. Do not commit patient datasets, exported backups, or populated report PDFs. New cases and imported records are stored in the visitor's own browser profile using localStorage.

To move your local records to the browser on this site:

1. Open the original offline app in the same browser profile where the records were saved.
2. In **Report & print**, choose **Download data backup**.
3. Open the public site, go to **Report & print**, and choose **Import local backup**.
4. Select the downloaded JSON file and confirm the displayed record count. Import stays on the device and does not upload the file.

Changing origin from `file://` to GitHub Pages does not transfer browser storage automatically. Keep an exported backup before clearing browser data or changing browsers.

Removing the dataset from the current branch does not remove copies in Git history, previously deployed versions, or caches. Review repository history separately before treating the repository as free of patient data.
