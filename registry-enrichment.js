/* Fill newly available profile fields once, without adding or replacing cases. */
window.REGISTRY_ENRICHMENT_READY = (async () => {
  await window.LEPTOS_IMPORT_READY;
  const release=window.REGISTRY_ENRICHMENT;
  if(!release)return;
  const key='binangonan-leptos-cases-v1',marker='binangonan-registry-enrichment';
  let saved,previous;
  try{
    previous=localStorage.getItem(marker);if(previous===release.release)return;
    saved=localStorage.getItem(key);
    const sources=[...(window.LEPTOS_SEED_DATA||[]),...(window.DENGUE_WORKBOOK_IMPORT?.cases||[])];
    const existing=saved===null?sources:JSON.parse(saved);
    if(!Array.isArray(existing))throw Error('Saved cases are not a valid list.');
    const sourceIndex=await CaseIdentity.index(sources);
    const fields=['name','dob','dru','address','firstConsult','admitted'];
    const missing=value=>value==null||['','unknown','not recorded','not specified'].includes(String(value).trim().toLowerCase());
    const enriched=await Promise.all(existing.map(async row=>{
      const source=await sourceIndex.find(row);
      if(!source)return row;
      const result={...row};
      for(const field of fields)if(missing(result[field])&&!missing(source[field]))result[field]=source[field];
      return result;
    }));
    localStorage.setItem(key,JSON.stringify(enriched));
    localStorage.setItem(marker,release.release);
  }catch(error){
    if(saved!==undefined){try{if(saved===null)localStorage.removeItem(key);else localStorage.setItem(key,saved);if(previous===null)localStorage.removeItem(marker);else if(previous!==undefined)localStorage.setItem(marker,previous);}catch{}}
    window.REGISTRY_ENRICHMENT_ERROR='The workbook update could not finish: '+error.message+' Please check your saved data and browser storage.';
  }
})();
