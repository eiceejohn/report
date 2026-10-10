/* Import is entirely local to this browser. No case records are sent to a server. */
(() => {
 'use strict';
 const restore=document.querySelector('#resetData');if(restore)restore.hidden=true;
 const button=document.createElement('button');button.className='btn';button.type='button';button.textContent='Import local backup';button.id='importLocalBackup';
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;input.id='localBackupFile';
 document.querySelector('.report-tools .right').prepend(button,input);
 const note=document.createElement('p');note.className='callout public-data-note';note.textContent='Workbooks loaded: dengue — 1,374 (2025), 396 (2026); leptospirosis — 25 (2025), 16 (2026). New entries and edits are saved in this browser; they are not shared automatically.';document.querySelector('.content').prepend(note);
 button.onclick=()=>input.click();
 input.onchange=async()=>{
   const file=input.files[0];if(!file)return;
   try{
     if(file.size>25*1024*1024)throw Error('Please choose a backup smaller than 25 MB.');
     const backup=JSON.parse(await file.text());
     if(backup.format!=='binangonan-surveillance-v2'||!Array.isArray(backup.cases))throw Error('Use the JSON file created by Download data backup in the Binangonan app.');
     const ids=await CaseIdentity.index();
     for(const row of backup.cases){
       if(!row||typeof row!=='object'||typeof row.id!=='string'||!row.id.trim()||await ids.has(row)||!Number.isInteger(+row.year)||+row.year<1900||+row.year>2100||!Number.isInteger(+row.mw)||+row.mw<1||+row.mw>(row.disease==='dengue'&&+row.year===2025?53:BinangonanReport.weeksInYear(+row.year)))throw Error('The backup contains invalid or duplicate case records. No data was changed.');
       await ids.add(row);
     }
     const baselines=backup.baselines||{},signatories=backup.signatories||{};
     if(typeof baselines!=='object'||Array.isArray(baselines)||typeof signatories!=='object'||Array.isArray(signatories))throw Error('Invalid baseline or signatory settings. No data was changed.');
     if(!confirm(`Import ${backup.cases.length} case records into this browser? This replaces the current browser records and baseline settings. Keep a downloaded backup of any existing records first.`))return;
     if(backup.dengueDetails!==undefined&&(!backup.dengueDetails||typeof backup.dengueDetails!=='object'||Array.isArray(backup.dengueDetails)))throw Error('Invalid detailed report settings. No data was changed.');
     const values={'binangonan-leptos-cases-v1':JSON.stringify(backup.cases),'binangonan-threshold-baselines-v1':JSON.stringify(baselines),'binangonan-report-settings-v2':JSON.stringify(signatories)},previous={};if(backup.dengueDetails!==undefined)values['binangonan-dengue-details-v1']=JSON.stringify(backup.dengueDetails);Object.keys(values).forEach(key=>previous[key]=localStorage.getItem(key));
     try{Object.entries(values).forEach(([key,value])=>localStorage.setItem(key,value));}catch(error){Object.entries(previous).forEach(([key,value])=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}});throw Error('The browser could not save the import. Check available storage and your existing records before trying again.');}
     location.reload();
   }catch(error){alert(error.message||'The backup could not be read.');}finally{input.value='';}
 };
})();
