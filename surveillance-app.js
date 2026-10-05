(() => {
 'use strict';
 const KEY='binangonan-leptos-cases-v1',seed=window.LEPTOS_SEED_DATA||[],$=s=>document.querySelector(s),e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),norm=v=>String(v||'').trim().toLowerCase();
 let cases=[],storageError='';
 try{const saved=localStorage.getItem(KEY);cases=saved?JSON.parse(saved):seed.map(c=>({...c}));if(!Array.isArray(cases))throw Error('Invalid saved case list');}catch(err){storageError='Saved records could not be read. They have not been overwritten. Please restore a valid backup before saving changes.';}
 const diseaseOf=c=>c.disease==='dengue'?'dengue':'leptospirosis';
 let disease=localStorage.getItem('binangonan-active-disease')==='dengue'?'dengue':'leptospirosis',year=String(Math.max(new Date().getFullYear(),...cases.map(c=>+c.year||0))),view='dashboard',editing=null,thresholdDirty=false;
 const name=()=>disease==='dengue'?'Dengue':'Leptospirosis',all=()=>cases.filter(c=>diseaseOf(c)===disease),week=()=>Math.max(1,Math.min(+$('#reportWeek').value||35,BinangonanReport.weeksInYear(year)));
 const thresholds=()=>SurveillanceThresholds.get(disease,+year,cases);
 const notice=message=>{$('#appNotice').textContent=message;$('#appNotice').hidden=!message;};
 const persist=()=>{if(storageError){notice(storageError);return false;}try{localStorage.setItem(KEY,JSON.stringify(cases));return true;}catch{notice('The browser could not save these records. Free local storage space and try again.');return false;}};
 function populate(){
   const years=[...new Set([+year,new Date().getFullYear(),...cases.map(c=>+c.year).filter(Boolean)])].sort((a,b)=>b-a);
   ['#dashYear','#reportYear','#thresholdYear'].forEach(id=>$(id).innerHTML=years.map(y=>`<option value="${y}" ${String(y)===year?'selected':''}>${y}</option>`).join(''));
   $('#diseaseSelect').value=disease;$('#dashWeek').value=week();$('#dashWeek').max=BinangonanReport.weeksInYear(year);$('#reportWeek').max=BinangonanReport.weeksInYear(year);
   $('#reportEnd').min=BinangonanReport.dateForWeek(year,1);$('#reportEnd').max=BinangonanReport.dateForWeek(year,BinangonanReport.weeksInYear(year));
   document.body.classList.toggle('disease-dengue',disease==='dengue');
   $('#dashboardDescription').textContent=disease==='dengue'?'Weekly cases, annual comparison, age and sex, and barangay clustering.':'Weekly monitoring for case counts, demographics, classification, exposure, and laboratory results.';
   $('#reportHint').textContent=disease==='dengue'?'1 page · A4 landscape. Print at 100%, with background graphics on and headers/footers off.':'3 pages · 13 × 8.5 inches (Long / Folio), landscape. Print at 100%, with background graphics on and headers/footers off.';
   $('#registryDiseaseColumn').textContent=disease==='dengue'?'Clinical category':'Exposure';
   document.title=`Binangonan ${name()} Surveillance`;
   $('#pageTitle').textContent=view==='dashboard'?`${name()} surveillance dashboard`:view==='cases'?`${name()} case registry`:view==='thresholds'?`${name()} automatic thresholds`:`${name()} report preview`;
 }
 function card(no,title,sub,chart,wide=false){return `<article class="figure-card ${wide?'wide':''}"><div class="figure-head"><div><div class="figure-number">Figure ${no}</div><h3>${title}</h3><p>${e(sub)}</p></div></div>${chart}</article>`;}
 function renderDashboard(){
   const w=week(),s=BinangonanReport.stats(all(),+year,w),data=s.rows,prev=s.prev,pct=(a,b)=>b?(100*a/b).toFixed(1):'0.0',th=thresholds();
   $('#stats').innerHTML=[['Total cases',data.length,`MW 1–${w} · ${year}`,''],['Total deaths',s.deaths,`CFR ${pct(s.deaths,data.length)}%`,'red'],[disease==='dengue'?'Previous-year cases':'Male cases',disease==='dengue'?prev.length:s.male,disease==='dengue'?`Same weeks · ${+year-1}`:`${pct(s.male,data.length)}% of selected cases`,'teal'],['Reporting week',w,`Week ending ${$('#reportEnd').value}`,'amber']].map(([label,value,detail,cls])=>`<div class="stat ${cls}"><div class="label">${label}</div><div class="value">${value}</div><div class="detail">${e(detail)}</div></div>`).join('');
   $('#insightTitle').textContent=data.length?`${name()} surveillance snapshot`:'No cases in this reporting period';$('#insightText').textContent=data.length?`${data.length} reported cases and ${s.deaths} deaths in Binangonan through MW ${w}.`:`Add ${name().toLowerCase()} cases to populate this dashboard. Historical records support automatic thresholds.`;$('#insightBadge').textContent=th.kind==='automatic'?'Automatic thresholds':th.kind==='reference'?'Rizal reference':'Baseline needed';
   if(disease==='dengue'){$('#dashboardFigures').innerHTML=DengueReport.dashboard(data,prev,{year:+year,week:w,end:$('#reportEnd').value,thresholds:th});return;}
   const sub=`Binangonan · ${year} · MW 1–${w} · N=${data.length}`;
   $('#dashboardFigures').innerHTML=card(1,'Distribution by morbidity week, alert and epidemic threshold',sub,BinangonanReport.charts.weekly(data,th)+`<div class="threshold-source"><strong>${e(th.label)}</strong>${e(th.note)}</div>`,true)+card(2,'Distribution by sex and age group',sub,BinangonanReport.charts.ageSex(data))+card(3,'Case classification',sub,BinangonanReport.charts.classification(data))+card(4,'Distribution by exposure',sub,BinangonanReport.charts.exposure(data))+card(5,'Laboratory results by type of test',sub,BinangonanReport.charts.labs(data),true);
 }
 function renderCases(){
   const q=norm($('#caseSearch').value),filtered=all().filter(c=>!q||[c.id,c.barangay,c.exposure,c.classification,c.clinicalCategory,c.year].join(' ').toLowerCase().includes(q)).sort((a,b)=>+b.year-+a.year||+b.mw-+a.mw);
   $('#caseStatus').textContent=`${filtered.length} ${name().toLowerCase()} records shown · ${all().length} for this disease · ${cases.length} across both diseases`;
   $('#casesTable').innerHTML=filtered.length?filtered.map(c=>`<tr><td><strong>${e(c.id)}</strong></td><td>${e(c.year)} / MW ${e(c.mw)}</td><td>${e(c.sex)}</td><td>${e(c.age)}</td><td>${e(c.barangay||'Unknown')}</td><td><span class="tag ${e(norm(c.classification))}">${e(c.classification)}</span></td><td>${e(disease==='dengue'?c.clinicalCategory||'Not recorded':c.exposure||'Unknown')}</td><td><span class="tag ${e(norm(c.outcome))}">${e(c.outcome)}</span></td><td><div class="case-actions"><button class="btn edit-case" data-id="${e(c.id)}">Edit</button><button class="btn danger delete-case" data-id="${e(c.id)}">Delete</button></div></td></tr>`).join(''):'<tr><td colspan="9"><div class="empty">No cases for this disease and search.</div></td></tr>';
   document.querySelectorAll('.edit-case').forEach(btn=>btn.onclick=()=>openModal(all().find(c=>c.id===btn.dataset.id)));
   document.querySelectorAll('.delete-case').forEach(btn=>btn.onclick=()=>{if(confirm(`Delete ${name().toLowerCase()} case ${btn.dataset.id}?`)){const old=cases;cases=cases.filter(c=>!(diseaseOf(c)===disease&&c.id===btn.dataset.id));if(!persist())cases=old;renderAll();}});
 }
 const signers=['reportPrepared','preparedRole','reviewed','reviewedRole','noted','notedRole'];
 try{const prefs=JSON.parse(localStorage.getItem('binangonan-report-settings-v2')||'{}');signers.forEach(id=>{if(prefs[id]!==undefined)$('#'+id).value=prefs[id];});}catch{}
 function renderReport(){const opt={year:+year,week:week(),end:$('#reportEnd').value,prepared:$('#reportPrepared').value,thresholds:thresholds()};signers.slice(1).forEach(id=>opt[id]=$('#'+id).value);$('#reportPreview').innerHTML=disease==='dengue'?DengueReport.render(all(),opt):BinangonanReport.render(all(),opt);}
 function feedback(text,error=false){$('#baselineFeedback').textContent=text;$('#baselineFeedback').classList.toggle('error',error);}
 function renderThresholdEditor(){
   $('#baselineEditor').innerHTML=SurveillanceThresholds.renderEditor(disease,+year,cases);thresholdDirty=false;
   $('#baselineEditor').oninput=()=>{thresholdDirty=true;feedback('Unsaved baseline changes');try{const cfg=SurveillanceThresholds.readEditor($('#baselineEditor')),calc=SurveillanceThresholds.calculate(disease,+year,cases,cfg);calc.alert.forEach((v,i)=>{$(`[data-alert="${i}"]`).textContent=v??'—';$(`[data-epidemic="${i}"]`).textContent=calc.epidemic[i]??'—';});}catch(err){feedback(err.message,true);}};
   $('#applyBaselinePaste').onclick=()=>{try{const count=SurveillanceThresholds.paste($('#baselineEditor'));$('#baselineEditor').dispatchEvent(new Event('input'));feedback(`${count} totals applied to the table. Save baseline to update the dashboard.`);}catch(err){feedback(err.message,true);}};
 }
 function saveBaseline(){try{SurveillanceThresholds.save(disease,+year,$('#baselineEditor'));thresholdDirty=false;renderDashboard();renderReport();renderThresholdEditor();feedback('Baseline saved. Thresholds recalculate automatically when records change.');return true;}catch(err){feedback(err.message,true);return false;}}
 function renderAll(){populate();renderDashboard();renderCases();renderReport();if(view==='thresholds')renderThresholdEditor();}
 function switchView(next){if(thresholdDirty&&!saveBaseline())return;view=next;document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===view+'View'));document.querySelectorAll('.nav button').forEach(el=>el.classList.toggle('active',el.dataset.view===view));populate();if(view==='thresholds')renderThresholdEditor();if(view==='dashboard')renderDashboard();if(view==='cases')renderCases();if(view==='report')renderReport();}
 function setWeek(w){$('#reportWeek').value=Math.max(1,Math.min(+w||1,BinangonanReport.weeksInYear(year)));$('#reportEnd').value=BinangonanReport.dateForWeek(year,week());renderAll();}
 function setYear(value){if(thresholdDirty&&!saveBaseline())return;year=String(value);setWeek(week());}
 function openModal(record=null){
   const f=$('#caseForm');f.reset();editing=record||null;f.elements.year.value=record?.year||year;f.elements.mw.value=record?.mw||week();
   let suffix=cases.length+1,id;do{id=`${year}-BIN-${disease==='dengue'?'DEN':'LEP'}-${String(suffix++).padStart(4,'0')}`;}while(cases.some(c=>c.id===id));f.elements.id.value=id;
   if(record)Object.keys(record).forEach(k=>{if(f.elements[k])f.elements[k].value=k==='onset'?String(record[k]||'').slice(0,10):record[k]??'';});
   f.elements.mw.max=BinangonanReport.weeksInYear(+f.elements.year.value);f.elements.testType.placeholder=disease==='dengue'?'NS1, IgM, IgG, RT-PCR...':'RT-PCR, MAT...';
   document.querySelectorAll('[data-leptos-only]').forEach(el=>el.hidden=disease==='dengue');document.querySelectorAll('[data-dengue-only]').forEach(el=>el.hidden=disease!=='dengue');
   $('#modalTitle').textContent=`${record?'Edit':'Add new'} ${name().toLowerCase()} case`;$('#caseModal').classList.add('open');f.elements.id.focus();
 }
 const close=()=>{$('#caseModal').classList.remove('open');editing=null;};
 $('#caseForm').onsubmit=event=>{
   event.preventDefault();const form=event.target,f=new FormData(form),record={...(editing||{}),disease,id:f.get('id').trim(),year:+f.get('year'),mw:+f.get('mw'),onset:f.get('onset'),sex:f.get('sex'),age:+f.get('age'),classification:f.get('classification'),outcome:f.get('outcome'),exposure:disease==='leptospirosis'?f.get('exposure'):'Unknown',exposurePlace:disease==='leptospirosis'?f.get('exposurePlace').trim()||'Unknown':'Unknown',province:editing?.province||'Rizal',city:editing?.city||'Binangonan',barangay:f.get('barangay').trim(),labResult:f.get('labResult'),testType:f.get('testType').trim()||'Not specified',clinicalCategory:disease==='dengue'?f.get('clinicalCategory'):'',name:editing?.name||''};
   if(!record.id){alert('Case ID is required.');return;}if(cases.some(c=>c!==editing&&c.id===record.id)){alert('Case ID already exists.');return;}if(record.mw>BinangonanReport.weeksInYear(record.year)){alert('Invalid morbidity week for this year.');return;}
   const old=cases;cases=editing?cases.map(c=>c===editing?record:c):[...cases,record];if(!persist()){cases=old;return;}close();renderAll();switchView('cases');
 };
 $('#caseForm').elements.year.oninput=event=>$('#caseForm').elements.mw.max=BinangonanReport.weeksInYear(+event.target.value||+year);
 $('#diseaseSelect').onchange=event=>{if(thresholdDirty&&!saveBaseline())return;disease=event.target.value;localStorage.setItem('binangonan-active-disease',disease);$('#caseSearch').value='';renderAll();};
 ['#dashYear','#reportYear','#thresholdYear'].forEach(id=>$(id).onchange=event=>setYear(event.target.value));
 $('#dashWeek').onchange=event=>{if(event.target.checkValidity())setWeek(event.target.value);};$('#reportWeek').onchange=event=>{if(event.target.checkValidity())setWeek(event.target.value);};
 $('#reportEnd').onchange=event=>{if(event.target.checkValidity())setWeek(BinangonanReport.weekForDate(year,event.target.value));};
 signers.forEach(id=>$('#'+id).oninput=()=>{const prefs={};signers.forEach(k=>prefs[k]=$('#'+k).value);localStorage.setItem('binangonan-report-settings-v2',JSON.stringify(prefs));renderReport();});
 document.querySelectorAll('.nav button').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));
 ['#topAdd','#addCase'].forEach(id=>$(id).onclick=()=>openModal());['#closeModal','#cancelCase'].forEach(id=>$(id).onclick=close);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
 $('#caseSearch').oninput=renderCases;$('#saveBaseline').onclick=saveBaseline;
 const print=async()=>{switchView('report');await Promise.all([...$('#reportPreview').querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));window.print();};$('#topPrint').onclick=print;$('#reportPrint').onclick=print;window.addEventListener('beforeprint',renderReport);
 $('#resetData').onclick=()=>{if(confirm('Restore only leptospirosis records from the supplied workbook? Locally added leptospirosis records will be removed. Dengue records will be kept.')){const old=cases;cases=[...cases.filter(c=>diseaseOf(c)==='dengue'),...seed.map(c=>({...c,disease:'leptospirosis'}))];if(!persist())cases=old;renderAll();}};
 $('#exportData').onclick=()=>{const data={format:'binangonan-surveillance-v2',cases,baselines:JSON.parse(localStorage.getItem('binangonan-threshold-baselines-v1')||'{}'),signatories:JSON.parse(localStorage.getItem('binangonan-report-settings-v2')||'{}')},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`binangonan-surveillance-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('#reportWeek').value=35;$('#reportEnd').value=BinangonanReport.dateForWeek(year,35);notice(storageError);renderAll();
})();
