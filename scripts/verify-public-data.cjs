const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};
for(const f of ['seed-data.js','dengue-seed-data.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{timeout:1000});
const lepto=ctx.window.LEPTOS_SEED_DATA;
assert.equal(lepto.length,41);assert.equal(lepto.filter(r=>r.year===2025).length,25);assert.equal(lepto.filter(r=>r.year===2026).length,16);
const profileFields=['name','dob','dru','address','firstConsult','admitted'];
const leptoFields=new Set([...profileFields,'id','disease','year','mw','onset','sex','age','classification','outcome','city','province','barangay','exposure','exposurePlace','labResult','testType']);
assert.equal(new Set(lepto.map(r=>r.id)).size,41);
for(const r of lepto){assert(Object.keys(r).every(k=>leptoFields.has(k)),'Unexpected lepto field');assert(/^LEP-202[56]-[A-F0-9]{12}$/.test(r.id));assert.equal(r.disease,'leptospirosis');assert(Number.isInteger(r.mw)&&r.mw>=1&&r.mw<=52);}
console.log('Verified requested lepto dataset: 25 (2025), 16 (2026); approved profile fields only.');
const data=ctx.window.DENGUE_WORKBOOK_IMPORT;
const allowed=new Set([...profileFields,'id','disease','year','mw','onset','sex','age','classification','outcome','clinicalCategory','city','province','barangay','labResult','testType']);
assert.equal(data.cases.length,1770);assert.equal(data.cases.filter(r=>r.year===2025).length,1374);assert.equal(data.cases.filter(r=>r.year===2026).length,396);
const ids=new Set();for(const r of data.cases){assert(Object.keys(r).every(k=>allowed.has(k)),'Unapproved field');assert.equal(r.disease,'dengue');assert(/^DEN-202[56]-[A-F0-9]{12}$/.test(r.id));assert(!ids.has(r.id));ids.add(r.id);assert(Number.isInteger(r.mw)&&r.mw>=1&&r.mw<=(r.year===2025?53:52));}
assert.equal(data.baseline.epidemicMultiplier,1.65);
assert.equal(Object.keys(data.baseline.totals).length,260);
console.log('Verified approved dengue dataset: 1374 (2025), 396 (2026); approved fields only.');

const all=[...lepto,...data.cases];
assert.equal(all.length,1811);assert.equal(new Set(all.map(r=>r.id)).size,1811);
const coverage={name:1811,dob:1811,dru:1811,address:1750,firstConsult:1323,admitted:1811};
for(const [field,count] of Object.entries(coverage))assert.equal(all.filter(r=>typeof r[field]==='string'&&r[field].trim()).length,count,'Profile coverage mismatch: '+field);
for(const r of all){
 assert(profileFields.every(field=>typeof r[field]==='string'),'Invalid profile field type');
 assert(/^\d{4}-\d{2}-\d{2}$/.test(r.dob),'Invalid birth date');
 assert(!r.firstConsult||/^\d{4}-\d{2}-\d{2}$/.test(r.firstConsult),'Invalid consultation date');
 assert(['Yes','No'].includes(r.admitted),'Invalid admission status');
}
assert.equal(ctx.window.REGISTRY_ENRICHMENT.release,'profile-fields-only-20261012');
const html=fs.readFileSync('index.html','utf8');
assert(html.indexOf('case-identity.js')<html.indexOf('registry-enrichment.js')&&html.indexOf('registry-enrichment.js')<html.indexOf('surveillance-app.js'),'Incorrect migration script order');
assert(fs.readFileSync('.github/workflows/pages.yml','utf8').includes('registry-enrichment.js _site/'),'Profile migration missing from deployed assets');
console.log('Verified 1,811 authorized records; unique Case IDs; six approved profile fields and expected source blanks.');

vm.runInNewContext(fs.readFileSync('measles-seed-data.js','utf8'),ctx,{timeout:1000});
const measles=ctx.window.MEASLES_WORKBOOK_IMPORT;
assert.equal(measles.release,'binangonan-measles-20261012-latest-2025');assert.equal(measles.cases.length,31);
assert.equal(measles.cases.filter(r=>r.year===2025).length,18);assert.equal(measles.cases.filter(r=>r.year===2026).length,13);
const measlesFields=new Set(['id','disease','year','mw','name','dob','age','sex','dru','address','barangay','city','province','firstConsult','onset','admitted','classification','outcome','labResult','testType','sourceClassification','labInterpretation','consultAdmissionDate']);
const measlesIds=new Set();
for(const r of measles.cases){
 assert(Object.keys(r).every(k=>measlesFields.has(k)),'Unapproved Measles field');assert.equal(r.disease,'measles');
 assert(/^MEA-202[56]-[A-F0-9]{12}$/.test(r.id),'Invalid Measles ID');assert(!measlesIds.has(r.id));measlesIds.add(r.id);
 assert(Number.isInteger(r.mw)&&r.mw>=1&&r.mw<=52);assert.equal(r.city.toLowerCase(),'binangonan');
 assert(r.name&&/^\d{4}-\d{2}-\d{2}$/.test(r.dob)&&r.address);assert.equal(r.firstConsult,'');assert(['Yes','No'].includes(r.admitted));
 const clientClassification=['Positive','Equivocal'].includes(r.labResult)?'Confirmed':r.labResult==='Negative'?'Suspect':r.sourceClassification==='Laboratory Confirmed Measles'?'Confirmed':'Unknown';
 assert.equal(r.classification,clientClassification,'Measles client mapping mismatch');
}
assert.equal(measles.cases.filter(r=>r.dru).length,25);
assert.equal(Object.keys(measles.aliases).length,5);
assert.equal(measles.previousRelease,'binangonan-measles-20261012-year-correction');assert.equal(measles.addedCaseIds.length,12);assert(measles.addedCaseIds.every(id=>measles.cases.some(r=>r.id===id&&r.year===2025)));
for(const [alias,target] of Object.entries(measles.aliases)){assert(/^MEA-2026-[A-F0-9]{12}$/.test(alias));assert(measlesIds.has(target));assert(!measlesIds.has(alias));assert.equal(alias.slice(-12),target.slice(-12));assert(target.startsWith('MEA-2025-'));}
assert.equal(new Set([...all,...measles.cases].map(r=>r.id)).size,1842);
assert(html.indexOf('measles-seed-data.js')>html.indexOf('case-identity.js')&&html.indexOf('measles.js')>html.indexOf('measles-seed-data.js')&&html.indexOf('measles.js')<html.indexOf('surveillance-app.js'),'Incorrect Measles startup order');
assert(fs.readFileSync('.github/workflows/pages.yml','utf8').includes('measles-seed-data.js measles.js'),'Measles assets missing from deployment');
console.log('Verified approved Measles records: 18 (2025), 13 (2026); 5 source-ID year corrections; 1,842 unique case records across all diseases.');

assert.equal(measles.cases.filter(r=>r.consultAdmissionDate).length,11);
assert(measles.cases.every(r=>!r.consultAdmissionDate||/^\d{4}-\d{2}-\d{2}$/.test(r.consultAdmissionDate)));
assert.equal(measles.cases.filter(r=>r.year===2025&&r.classification==='Confirmed').length,1);
assert.equal(measles.additionsByRelease['binangonan-measles-20261012'].length,17);
assert.equal(measles.additionsByRelease['binangonan-measles-20261012-year-correction'].length,12);
