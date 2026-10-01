(() => {
  const STORAGE_KEY = 'binangonan-leptos-cases-v1';
  const seed = Array.isArray(window.LEPTOS_SEED_DATA) ? window.LEPTOS_SEED_DATA : [];
  const saved = localStorage.getItem(STORAGE_KEY);
  let cases = saved ? JSON.parse(saved) : seed.map(c => ({...c}));
  let activeYear = String(Math.max(...cases.map(c => Number(c.year) || 0), new Date().getFullYear()));
  let activeCity = 'Binangonan';

  const $ = sel => document.querySelector(sel);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const cap = value => String(value || '').replace(/\b\w/g, m => m.toUpperCase());
  const num = value => Number(value) || 0;
  const norm = value => String(value || '').trim().toLowerCase();
  const pct = (a,b) => b ? a / b * 100 : 0;
  const sum = arr => arr.reduce((a,b)=>a+num(b),0);
  const fmtDate = value => value ? new Date(value + (value.length===10 ? 'T00:00:00' : '')).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}) : '';
  const years = () => [...new Set(cases.map(c => Number(c.year)).filter(Boolean))].sort((a,b)=>b-a);
  const cities = () => [...new Set(cases.map(c => c.city || 'Binangonan').filter(Boolean))].sort();
  const yearCases = (year=activeYear) => cases.filter(c => String(c.year) === String(year) && (!activeCity || (c.city || 'Binangonan') === activeCity));
  const allYearCases = year => cases.filter(c => String(c.year) === String(year));
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  const setText = (id,text) => { const el=$(id); if(el) el.textContent=text; };

  function populateSelectors(){
    const y = years();
    ['#dashYear','#reportYear'].forEach(id => {
      const el=$(id);
      el.innerHTML = y.map(v => '<option value="'+v+'" '+(String(v)===String(activeYear)?'selected':'')+'>'+v+'</option>').join('');
    });
    const opts = ['Binangonan', ...cities().filter(c=>c!=='Binangonan')];
    $('#dashCity').innerHTML = opts.map(c => '<option '+(c===activeCity?'selected':'')+'>'+esc(c)+'</option>').join('');
  }
  function svgText(x,y,text,attrs=''){return '<text x="'+x+'" y="'+y+'" '+attrs+'>'+esc(text)+'</text>';}
  function chartFrame(w,h){return '<rect x="0" y="0" width="'+w+'" height="'+h+'" rx="8" fill="#fbfdff"/>';}

  const figure1 = data => BinangonanReport.charts.weekly(data);
  const figure2 = data => BinangonanReport.charts.ageSex(data);
  const figure3 = data => BinangonanReport.charts.classification(data);
  const figure4 = data => BinangonanReport.charts.exposure(data);
  const figure5 = data => BinangonanReport.charts.labs(data);
  function figureCard(no,title,subtitle,svg,wide=false){return '<article class="figure-card '+(wide?'wide':'')+'"><div class="figure-head"><div><div class="figure-number">Figure '+no+'</div><h3>'+title+'</h3><p>'+subtitle+'</p></div></div>'+svg+'</article>';}
  function renderDashboard(){
    const data=yearCases(),deaths=data.filter(c=>cap(c.outcome)==='Died').length,male=data.filter(c=>c.sex==='Male').length,week=Math.max(0,...data.map(c=>num(c.mw)));
    $('#stats').innerHTML='<div class="stat"><div class="label">Total cases</div><div class="value">'+data.length+'</div><div class="detail">Selected year · '+esc(activeCity)+'</div></div><div class="stat red"><div class="label">Total deaths</div><div class="value">'+deaths+'</div><div class="detail">CFR '+pct(deaths,data.length).toFixed(2)+'%</div></div><div class="stat teal"><div class="label">Male cases</div><div class="value">'+male+'</div><div class="detail">'+pct(male,data.length).toFixed(1)+'% of selected cases</div></div><div class="stat amber"><div class="label">Latest MW</div><div class="value">'+(week||'—')+'</div><div class="detail">Highest week in selected records</div></div>';
    const topExp=Object.entries(data.reduce((o,c)=>(o[c.exposure||'Unknown']=(o[c.exposure||'Unknown']||0)+1,o),{})).sort((a,b)=>b[1]-a[1])[0];
    setText('insightTitle',data.length?'Binangonan surveillance snapshot':'No cases in this filter');setText('insightText',data.length?data.length+' reported case'+(data.length===1?'':'s')+' in '+activeYear+', with '+deaths+' death'+(deaths===1?'':'s')+'. Most recorded exposure: '+(topExp?topExp[0]:'n/a')+'.':'Add a case or switch the reporting year.');setText('insightBadge',data.length?'Updated '+new Date().toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}):'Awaiting data');
    const asOf='Binangonan · '+activeYear+' · N='+data.length;
    $('#dashboardFigures').innerHTML=figureCard(1,'Distribution by morbidity week, alert and epidemic threshold',asOf,figure1(data),true)+figureCard(2,'Distribution by sex and age group',asOf,figure2(data))+figureCard(3,'Case classification',asOf,figure3(data))+figureCard(4,'Distribution by exposure',asOf,figure4(data))+figureCard(5,'Laboratory results by type of test',asOf,figure5(data),true);
  }
  function renderCases(){
    const q=($('#caseSearch').value||'').toLowerCase().trim(),rows=cases.filter(c=>!q||[c.id,c.barangay,c.exposure,c.classification,c.city].join(' ').toLowerCase().includes(q)).sort((a,b)=>Number(b.year)-Number(a.year)||Number(b.mw)-Number(a.mw));
    $('#caseStatus').textContent=rows.length+' record'+(rows.length===1?'':'s')+' shown · '+cases.length+' total on this device';
    $('#casesTable').innerHTML=rows.length?rows.map(c=>'<tr><td><strong>'+esc(c.id)+'</strong></td><td>'+esc(c.year)+' / MW '+esc(c.mw)+'</td><td>'+esc(c.sex)+'</td><td>'+esc(c.age)+'</td><td>'+esc(c.barangay||'—')+'</td><td><span class="tag '+String(c.classification).toLowerCase()+'">'+esc(c.classification)+'</span></td><td>'+esc(c.exposure||'—')+'</td><td><span class="tag '+String(c.outcome).toLowerCase()+'">'+esc(c.outcome)+'</span></td><td><button class="btn danger delete-case" data-id="'+esc(c.id)+'">Delete</button></td></tr>').join(''):'<tr><td colspan="9"><div class="empty">No records match the current search.</div></td></tr>';
    document.querySelectorAll('.delete-case').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.id;if(confirm('Delete case '+id+'?')){cases=cases.filter(c=>c.id!==id);persist();renderAll();}}));
  }
  const signerIds=['reportPrepared','preparedRole','reviewed','reviewedRole','noted','notedRole'];
  let reportPrefs={};
  try{reportPrefs=JSON.parse(localStorage.getItem('binangonan-report-settings-v2')||'{}');}catch{}
  signerIds.forEach(id=>{if(reportPrefs[id]!==undefined)$('#'+id).value=reportPrefs[id];});
  function renderReport(){
    const end=$('#reportEnd').value||BinangonanReport.dateForWeek(activeYear,35);
    $('#reportWeek').value=BinangonanReport.weekForDate(activeYear,end);
    $('#reportWeek').max=BinangonanReport.weeksInYear(activeYear);
    $('#reportEnd').min=BinangonanReport.dateForWeek(activeYear,1);
    $('#reportEnd').max=BinangonanReport.dateForWeek(activeYear,BinangonanReport.weeksInYear(activeYear));
    const options={year:activeYear,end,prepared:$('#reportPrepared').value};
    signerIds.slice(1).forEach(id=>options[id]=$('#'+id).value);
    $('#reportPreview').innerHTML=BinangonanReport.render(cases,options);
  }
  function showView(view){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===view+'View'));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));setText('pageTitle',view==='dashboard'?'Leptospirosis surveillance dashboard':view==='cases'?'Reported cases':'Report preview');if(view==='dashboard')renderDashboard();if(view==='cases')renderCases();if(view==='report')renderReport();}
  function renderAll(){populateSelectors();renderDashboard();renderCases();renderReport();}
  function openModal(){const f=$('#caseForm');f.reset();f.elements.year.value=activeYear;f.elements.mw.value=Math.max(1,...yearCases().map(c=>num(c.mw)),0);f.elements.id.value=activeYear+'-BIN-'+String(cases.length+1).padStart(4,'0');f.elements.mw.max=BinangonanReport.weeksInYear(+f.elements.year.value);$('#caseModal').classList.add('open');f.elements.id.focus();}
  function closeModal(){$('#caseModal').classList.remove('open');}

  $('#dashYear').addEventListener('change',e=>{activeYear=e.target.value;$('#reportEnd').value=BinangonanReport.dateForWeek(activeYear,35);renderAll();});
  $('#dashCity').addEventListener('change',e=>{activeCity=e.target.value;renderAll();});
  $('#reportYear').addEventListener('change',e=>{const week=+$('#reportWeek').value||35;activeYear=e.target.value;$('#reportEnd').value=BinangonanReport.dateForWeek(activeYear,Math.min(week,BinangonanReport.weeksInYear(activeYear)));renderAll();});
  signerIds.forEach(id=>$('#'+id).addEventListener('input',()=>{const prefs={};signerIds.forEach(key=>prefs[key]=$('#'+key).value);localStorage.setItem('binangonan-report-settings-v2',JSON.stringify(prefs));renderReport();}));
  $('#reportEnd').addEventListener('change',()=>{if($('#reportEnd').checkValidity()){$('#reportEnd').value=BinangonanReport.dateForWeek(activeYear,BinangonanReport.weekForDate(activeYear,$('#reportEnd').value));renderReport();}});
  $('#reportWeek').addEventListener('change',()=>{if($('#reportWeek').checkValidity()){$('#reportEnd').value=BinangonanReport.dateForWeek(activeYear,+$('#reportWeek').value);renderReport();}});
  window.addEventListener('beforeprint',renderReport);
  $('#reportEnd').value=BinangonanReport.dateForWeek(activeYear,35);
  $('#caseSearch').addEventListener('input',renderCases);
  $('#caseForm').elements.year.addEventListener('input',()=>{$('#caseForm').elements.mw.max=BinangonanReport.weeksInYear(+$('#caseForm').elements.year.value||+activeYear);});
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('#topAdd').addEventListener('click',openModal);$('#addCase').addEventListener('click',openModal);$('#closeModal').addEventListener('click',closeModal);$('#cancelCase').addEventListener('click',closeModal);
  $('#topPrint').addEventListener('click',()=>{showView('report');setTimeout(()=>window.print(),120);});$('#reportPrint').addEventListener('click',()=>window.print());
  $('#resetData').addEventListener('click',()=>{if(confirm('Restore the supplied workbook seed and remove locally added records?')){cases=seed.map(c=>({...c}));persist();renderAll();}});
  $('#caseForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),record={id:f.get('id').trim(),year:num(f.get('year')),mw:num(f.get('mw')),onset:f.get('onset'),sex:f.get('sex'),age:num(f.get('age')),classification:f.get('classification'),outcome:f.get('outcome'),exposure:f.get('exposure'),exposurePlace:f.get('exposurePlace').trim()||'Unknown',province:'Rizal',city:'Binangonan',barangay:f.get('barangay').trim(),labResult:f.get('labResult'),testType:f.get('testType').trim()||'Not specified',name:''};if(!record.id){alert('Case ID is required.');return;}if(cases.some(c=>c.id===record.id)){alert('Case ID already exists.');return;}cases.push(record);persist();closeModal();renderAll();showView('cases');});
  populateSelectors();renderAll();
})();




