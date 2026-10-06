/* Merge this workbook release once; preserve locally edited and unrelated records. */
window.LEPTOS_IMPORT_READY = (async () => {
  const release = window.LEPTOS_WORKBOOK_IMPORT;
  if (!release) return;
  const marker = 'binangonan-lepto-workbook-import', key = 'binangonan-leptos-cases-v1';
  try {
    if (localStorage.getItem(marker) === release.release) return;
    const saved = localStorage.getItem(key), existing = saved === null ? [] : JSON.parse(saved);
    if (!Array.isArray(existing)) throw Error('Saved cases are not a valid list.');
    const incoming = window.LEPTOS_SEED_DATA || [], importedIds = new Set(incoming.map(r => r.id));
    const merged = await Promise.all(existing.map(async row => {
      if (row.disease === 'dengue' || /^LEP-\d{4}-[A-F0-9]{12}$/.test(row.id)) return row;
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(row.id).trim()));
      const id = `LEP-${row.year}-` + [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase();
      return importedIds.has(id) ? { ...row, id, disease: 'leptospirosis' } : row;
    }));
    const ids = new Set(merged.map(r => r.id));
    for (const row of incoming) if (!ids.has(row.id)) { merged.push({ ...row }); ids.add(row.id); }
    localStorage.setItem(key, JSON.stringify(merged));
    localStorage.setItem(marker, release.release);
  } catch (error) {
    window.LEPTOS_IMPORT_ERROR = 'Leptos workbook import could not finish: ' + error.message + ' Existing records were kept.';
  }
})();
