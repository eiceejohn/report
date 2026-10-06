const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};
for(const f of ['seed-data.js','dengue-seed-data.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{timeout:1000});
const lepto=ctx.window.LEPTOS_SEED_DATA;
assert.equal(lepto.length,41);assert.equal(lepto.filter(r=>r.year===2025).length,25);assert.equal(lepto.filter(r=>r.year===2026).length,16);
const leptoFields=new Set(['id','disease','year','mw','onset','sex','age','classification','outcome','city','province','barangay','exposure','exposurePlace','labResult','testType']);
assert.equal(new Set(lepto.map(r=>r.id)).size,41);
for(const r of lepto){assert(Object.keys(r).every(k=>leptoFields.has(k)),'Unexpected lepto field');assert(/^LEP-202[56]-[A-F0-9]{12}$/.test(r.id));assert.equal(r.disease,'leptospirosis');assert(Number.isInteger(r.mw)&&r.mw>=1&&r.mw<=52);}
console.log('Verified requested lepto dataset: 25 (2025), 16 (2026); patient identifiers excluded.');
const data=ctx.window.DENGUE_WORKBOOK_IMPORT;
const allowed=new Set(['id','disease','year','mw','onset','sex','age','classification','outcome','clinicalCategory','city','province','barangay','labResult','testType']);
assert.equal(data.cases.length,1770);assert.equal(data.cases.filter(r=>r.year===2025).length,1374);assert.equal(data.cases.filter(r=>r.year===2026).length,396);
const ids=new Set();for(const r of data.cases){assert(Object.keys(r).every(k=>allowed.has(k)),'Unapproved field');assert.equal(r.disease,'dengue');assert(/^DEN-202[56]-[A-F0-9]{12}$/.test(r.id));assert(!ids.has(r.id));ids.add(r.id);assert(Number.isInteger(r.mw)&&r.mw>=1&&r.mw<=(r.year===2025?53:52));}
assert.equal(data.baseline.epidemicMultiplier,1.65);
assert.equal(Object.keys(data.baseline.totals).length,260);
console.log('Verified approved dengue dataset: 1374 (2025), 396 (2026); approved fields only.');
