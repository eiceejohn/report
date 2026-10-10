# Public GitHub Pages deployment

The owner explicitly authorized publishing the 1,770 dengue case records (2025–2026) on October 5, 2026, including age, sex, barangay, onset date, clinical classification, outcome and laboratory information, without patient names.

The public seed contains 1,374 dengue records for 2025 and 396 for 2026. The 2026 historical threshold baseline contains adjusted weekly aggregate counts for 2021–2025. No names, dates of birth, street addresses, source workbook row identifiers, or raw workbook files are included. The owner also requested publishing the supplied Leptos cases MW 38 workbook on October 6, 2026. The leptospirosis seed contains 25 records for 2025 and 16 for 2026, limited to pseudonymous case ID, year/week, onset date, age, sex, municipality/barangay, classification, outcome, exposure category/municipality and laboratory fields. Patient names, birth dates, street addresses and original patient/case identifiers are excluded.

The seed merges once per browser and preserves saved edits and manually entered cases. Later deletions are not restored on reload. New entries and changes remain in that browser; they are not synchronized across visitors. Backups can be exported and imported from Report & print.

Deploy through GitHub Actions. The build verifies the approved dataset count, fields and years, and copies only the listed app assets. Do not commit raw workbooks, backups, or generated reports.

Leptospirosis reports contain an A4 landscape bulletin followed by three Long/Folio portrait detail pages (8.5 × 13 inches). Dengue reports contain an A4 landscape bulletin followed by two Legal portrait detail pages (8.5 × 14 inches). The dashboard and reports calculate the summaries, age profiles, classifications and barangay totals from the selected disease, reporting year and morbidity weeks. Bulletin barangay tables show cases and deaths; detailed comparisons show cases and deaths for both years.

Dengue actions taken and recommendations default to the supplied DENGUE ACTIONS TAKEN document and remain editable per reporting year/week. Leptospirosis actions retain the supplied MESU text and prevention recommendations. Both reports include the supplied preparers and municipal health officer on the last page. Notes and signatories are included in data backups. Older population settings are retained in backups but are no longer displayed as table columns.

Manual entry, Batch upload and backup import check for duplicate Case IDs, including letter case, spacing and source IDs corresponding to published pseudonymous IDs. Manual duplicates are rejected, batch duplicates are skipped, and a backup containing duplicate IDs is rejected before replacement. Different IDs are not automatically treated as the same person based only on shared demographic fields. Existing saved records are not automatically removed.

Present report opens the currently selected disease and reporting period as a full-screen slide viewer. Use Previous/Next or arrow keys, Home/End, and Escape to exit. Fit page shows an entire page; Fit width allows scrolling through portrait pages. A full-window viewer works when browser fullscreen is unavailable. Print layouts and page sizes are unchanged.
