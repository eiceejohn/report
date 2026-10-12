/* Measles bulletin uses the client's reporting categories, retaining source lab details. */
(() => {
 'use strict';
 const norm=value=>String(value??'').trim().toLowerCase();
 const classification=(lab,current='Unknown')=>['positive','equivocal'].includes(norm(lab))?'Confirmed':norm(lab)==='negative'?'Suspect':['Suspect','Probable','Confirmed'].includes(current)?current:'Unknown';
 const normalize=row=>({...row,disease:'measles',classification:classification(row.labResult,row.classification)});
 const ruleNote='Client reporting categories: Negative = Suspect; Positive / Equivocal = Confirmed. Cases with no recorded result or classification remain unclassified.';
 const dashboard=(rows,prev,opt)=>DengueReport.summaryDashboard(rows,prev,{...opt,disease:'measles'})+`<p class="callout">${ruleNote}</p>`;
 const report=(all,opt)=>DengueReport.bulletin(all,{...opt,disease:'measles'}).replace('Source: local case registry.', 'Source: local case registry. '+ruleNote);
 window.Measles={classification,normalize,dashboard,report};
 window.MEASLES_IMPORT_READY=(async()=>{
  await window.REGISTRY_ENRICHMENT_READY;
  const incoming=window.MEASLES_WORKBOOK_IMPORT;if(!incoming)return;
  const marker='binangonan-measles-workbook-import',key='binangonan-leptos-cases-v1';
  try{
   if(localStorage.getItem(marker)===incoming.release)return;
   const saved=localStorage.getItem(key),rows=saved===null?[]:JSON.parse(saved);
   if(!Array.isArray(rows))throw Error('Saved cases are not a valid list.');
   const ids=await CaseIdentity.index(rows),added=[];
   for(const source of incoming.cases){const row=normalize(source);if(!await ids.has(row)){added.push(row);await ids.add(row);}}
   localStorage.setItem(key,JSON.stringify([...rows,...added]));localStorage.setItem(marker,incoming.release);
  }catch(error){window.MEASLES_IMPORT_ERROR='Measles workbook could not load: '+error.message;}
 })();
})();
