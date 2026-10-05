/* Merge the requested local workbook once, without replacing existing case edits. */
(() => {
 const imported=window.DENGUE_WORKBOOK_IMPORT;if(!imported)return;
 const revisionKey='binangonan-dengue-workbook-import',caseKey='binangonan-leptos-cases-v1',baselineKey='binangonan-threshold-baselines-v1';
 try{
   if(localStorage.getItem(revisionKey)===imported.release)return;
   const saved=localStorage.getItem(caseKey),existing=saved===null?(window.LEPTOS_SEED_DATA||[]).map(r=>({...r})):JSON.parse(saved);
   if(!Array.isArray(existing))throw Error('Saved cases are not a valid list.');
   const ids=new Set(existing.map(r=>r.id)),added=imported.cases.filter(r=>!ids.has(r.id));
   localStorage.setItem(caseKey,JSON.stringify([...existing,...added]));
   const baselines=JSON.parse(localStorage.getItem(baselineKey)||'{}');
   if(!baselines.dengue&&!baselines['dengue:2026']){baselines['dengue:2026']=imported.baseline;localStorage.setItem(baselineKey,JSON.stringify(baselines));}
   localStorage.setItem('binangonan-active-disease','dengue');
   localStorage.setItem(revisionKey,imported.release);
 }catch(error){window.DENGUE_IMPORT_ERROR='Dengue import could not finish: '+error.message+' Your existing records were not replaced. Reopen after checking browser storage.';}
})();
