/* Local historical baselines. Current-year cases never enter their own threshold. */
(() => {
  'use strict';
  const KEY='binangonan-threshold-baselines-v1';
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let stored={};try{stored=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  const key=(d,y)=>`${d}:${y}`;
  const config=(d,y)=>stored[d]||stored[key(d,y)]||{complete:[],totals:{}};
  const historicalYears=y=>Array.from({length:5},(_,i)=>+y-5+i);
  const rowDisease=r=>r.disease==='dengue'?'dengue':'leptospirosis';
  function counts(rows,d,y){return Array.from({length:53},(_,i)=>rows.filter(r=>rowDisease(r)===d&&+r.year===+y&&+r.mw===i+1&&String(r.city||'Binangonan').trim().toLowerCase()==='binangonan').length);}
  function calculate(d,y,rows,cfg=config(d,y)){
    const years=historicalYears(y),weeks=BinangonanReport.weeksInYear(y),hist=years.map(yr=>({year:yr,values:counts(rows,d,yr)}));
    const alert=[],epidemic=[],samples=[],epidemicMultiplier=Number.isFinite(+cfg.epidemicMultiplier)?+cfg.epidemicMultiplier:2;
    for(let i=0;i<weeks;i++){
      const values=hist.map(h=>{if(i>=BinangonanReport.weeksInYear(h.year))return null;const raw=cfg.totals?.[`${h.year}:${i+1}`];if(raw!==undefined&&raw!==''&&raw!==null)return Number(raw);return cfg.complete?.includes(h.year)?h.values[i]:null;}).filter(v=>v!==null&&Number.isFinite(v)&&v>=0);
      samples.push(values.length);
      if(values.length<3){alert.push(null);epidemic.push(null);continue;}
      const mean=values.reduce((a,b)=>a+b,0)/values.length,sd=Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(values.length-1));
      alert.push(+(mean+sd).toFixed(2));epidemic.push(+(mean+epidemicMultiplier*sd).toFixed(2));
    }
    return {alert,epidemic,samples,weeks,years,epidemicMultiplier,sourceLabel:cfg.sourceLabel||""};
  }
  function get(d,y,rows){
    const v=calculate(d,+y,rows),valid=v.alert.filter(n=>n!==null).length;
    if(valid){return {...v,kind:'automatic',label:'Automatic Binangonan thresholds',note:v.sourceLabel?`Workbook adjusted-week totals for ${v.years[0]}–${v.years[4]}. Mean + 1 sample SD (alert) / + ${v.epidemicMultiplier} sample SD (epidemic). ${valid}/${v.weeks} weeks calculated; current-year records excluded.`:`Historical weekly mean + 1 sample SD (alert) / + ${v.epidemicMultiplier} sample SD (epidemic), using 3–5 available years from ${v.years[0]}–${v.years[4]}. ${valid}/${v.weeks} weeks calculated; missing baseline weeks have no line. Current-year records are excluded.${v.sourceLabel?" Source: "+v.sourceLabel+".":""}`};}
    const reference=window.RIZAL_THRESHOLDS;
    if(d==='leptospirosis'&&+y===2026&&reference){return {...reference,weeks:v.weeks,kind:'reference',label:'Rizal provincial reference · 2026',note:'Approximate curves transcribed from the supplied Rizal LeptoMW35 bulletin; not Binangonan thresholds. Automatic municipal thresholds require at least 3 historical values for each week.'};}
    return {...v,kind:'missing',label:'Historical baseline needed',note:'Enter at least 3 prior years of weekly data to calculate alert and epidemic thresholds automatically. Blank historical weeks are missing, not zero. Current-year records are excluded.'};
  }
  function renderEditor(d,y,rows){
    const cfg=config(d,y),calc=calculate(d,+y,rows),selected=get(d,y,rows),hist=Object.fromEntries(calc.years.map(yr=>[yr,counts(rows,d,yr)]));
    return `<div class="baseline-note"><strong>${e(selected.label)}</strong><p>${e(selected.note)}</p><p>Automatic formula: alert = weekly historical mean + 1 sample standard deviation; epidemic = mean + ${calc.epidemicMultiplier} sample standard deviations. Uses 3–5 prior years for the same morbidity week. A recorded case in an earlier year updates its weekly count automatically.</p></div>
    <div class="baseline-complete"><strong>Complete historical years</strong><p>Check a year only when its entire case line list is complete. Then weeks without records count as zero. Leave incomplete years unchecked.</p>${calc.years.map(yr=>`<label><input type="checkbox" name="completeYear" value="${yr}" ${cfg.complete?.includes(yr)?'checked':''}> ${yr} complete (${hist[yr].reduce((a,b)=>a+b,0)} records)</label>`).join('')}</div>
    <details class="baseline-help"><summary>Enter or paste historical weekly totals</summary><p>Optional totals below replace the line-list count for that week. Leave a cell blank to use records. Enter 0 only for a verified zero week. If new cases are added to an overridden week, update or clear its total.</p><label for="baselinePaste">Paste CSV: year,week,cases (one row per week)</label><textarea id="baselinePaste" rows="4" placeholder="year,week,cases&#10;2023,1,0&#10;2024,1,2&#10;2025,1,1"></textarea><button class="btn" id="applyBaselinePaste" type="button">Apply pasted totals to table</button></details>
    <div class="baseline-table-wrap"><table class="baseline-table"><thead><tr><th>MW</th>${calc.years.map(yr=>`<th>${yr}</th>`).join('')}<th>Alert</th><th>Epidemic</th></tr></thead><tbody>${Array.from({length:calc.weeks},(_,i)=>`<tr><th>${i+1}</th>${calc.years.map(yr=>`<td>${i<BinangonanReport.weeksInYear(yr)?`<input aria-label="${yr} week ${i+1} historical total" type="number" min="0" max="10000000" step="1" data-baseline="${yr}:${i+1}" value="${e(cfg.totals?.[`${yr}:${i+1}`]??'')}" placeholder="${hist[yr][i]||cfg.complete?.includes(yr)?hist[yr][i]:'—'}"><small>${hist[yr][i]} records</small>`:'N/A'}</td>`).join('')}<td data-alert="${i}">${calc.alert[i]??'—'}</td><td data-epidemic="${i}">${calc.epidemic[i]??'—'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function readEditor(root){const totals={};root.querySelectorAll('[data-baseline]').forEach(input=>{if(!input.checkValidity())throw Error('Historical totals must be whole numbers of 0 or more.');if(input.value!=='')totals[input.dataset.baseline]=Number(input.value);});return {complete:[...root.querySelectorAll('[name="completeYear"]:checked')].map(el=>+el.value),totals};}
  function save(d,y,root){const cfg=readEditor(root),old=config(d,y),years=historicalYears(y),totals={...(old.totals||{})};Object.keys(totals).forEach(k=>{if(years.includes(+k.split(':')[0]))delete totals[k];});Object.assign(totals,cfg.totals);const merged={...old,complete:[...(old.complete||[]).filter(v=>!years.includes(v)),...cfg.complete],totals},next={...stored,[old.sourceReportingYear?key(d,y):d]:merged};localStorage.setItem(KEY,JSON.stringify(next));stored=next;return merged;}
  function paste(root){const lines=root.querySelector('#baselinePaste').value.trim().split(/\r?\n/).filter(Boolean),pending=[];for(let i=0;i<lines.length;i++){const cells=lines[i].split(/[,\t;]/).map(s=>s.trim());if(i===0&&/year/i.test(cells[0]))continue;if(cells.length!==3||!cells.every(s=>/^\d+$/.test(s)))throw Error(`CSV row ${i+1}: expected year,week,cases as whole numbers.`);const [year,week,value]=cells.map(Number),input=root.querySelector(`[data-baseline="${year}:${week}"]`);if(!input||value>10000000)throw Error(`CSV row ${i+1}: year/week outside this baseline or invalid count.`);pending.push([input,value]);}if(!pending.length)throw Error('Paste at least one historical weekly total.');pending.forEach(([input,value])=>input.value=value);return pending.length;}
  window.SurveillanceThresholds={get,calculate,renderEditor,save,paste,readEditor};
})();
