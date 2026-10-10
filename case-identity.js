/* Case IDs identify duplicates; shared age/sex/barangay alone cannot identify a person. */
(() => {
  'use strict';
  const normalized = value => String(value ?? '').trim().toUpperCase().replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, '');
  const cache = new Map();
  async function digest(value) {
    if (!cache.has(value)) cache.set(value, crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(bytes => [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('').slice(0, 12).toUpperCase()));
    return cache.get(value);
  }
  async function aliases(row) {
    const raw = String(row.id ?? '').trim(), id = normalized(raw);
    if (!id) throw Error('Case ID is required.');
    if (/^(DEN|LEP)-\d{4}-[A-F0-9]{12}$/.test(id)) return [id];
    const prefix = `${row.disease === 'dengue' ? 'DEN' : 'LEP'}-${+row.year}-`;
    const canonical = prefix + await digest(id);
    return raw === id ? [id, canonical] : [id, canonical, prefix + await digest(raw)];
  }
  async function index(rows = []) {
    const ids = new Map();
    const add = async row => { for (const key of await aliases(row)) ids.set(key, row); };
    await Promise.all(rows.map(add));
    return { add, find: async row => (await aliases(row)).map(key => ids.get(key)).find(Boolean), has: async row => (await aliases(row)).some(key => ids.has(key)) };
  }
  window.CaseIdentity = { normalized, index, canonical: async row => { const keys = await aliases(row); return keys[1] || keys[0]; } };
})();
