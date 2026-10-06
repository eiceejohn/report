# Public GitHub Pages deployment

The owner explicitly authorized publishing the 1,770 dengue case records (2025–2026) on October 5, 2026, including age, sex, barangay, onset date, clinical classification, outcome and laboratory information, without patient names.

The public seed contains 1,374 dengue records for 2025 and 396 for 2026. The 2026 historical threshold baseline contains adjusted weekly aggregate counts for 2021–2025. No names, dates of birth, street addresses, source workbook row identifiers, or raw workbook files are included. The leptospirosis seed remains empty.

The seed merges once per browser and preserves saved edits and manually entered cases. Later deletions are not restored on reload. New entries and changes remain in that browser; they are not synchronized across visitors. Backups can be exported and imported from Report & print.

Deploy through GitHub Actions. The build verifies the approved dataset count, fields and years, and copies only the listed app assets. Do not commit raw workbooks, backups, or generated reports.

Detailed dengue reports include the existing A4 landscape bulletin followed by two Legal portrait pages (8.5 × 14 inches). The dashboard and report calculate the summary, barangay comparison, classifications, age profile, and recent clustering from the selected reporting year and morbidity weeks. Population denominators come from the supplied sample PDF, whose reference year is unspecified; edit these in Report & print → Detailed dengue report settings when a newer source is available. Actual actions and recommendations are entered there and saved per year/week. The data backup includes these notes and population settings.
