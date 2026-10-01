/* Offline, data-driven reproduction of the supplied 8.5 x 13 inch bulletin. */
(() => {
  'use strict';
  const blue = '#002060', orange = '#e97132';
  const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = v => String(v ?? '').trim().toLowerCase();
  const count = (rows, field, value) => rows.filter(r => n(r[field]) === n(value)).length;
  const pc = (a, b) => b ? (100*a/b).toFixed(2) : '0.00';
  const text = (x,y,s,attrs='') => `<text x="${x}" y="${y}" ${attrs.includes('font-size=')?'':'font-size="9"'} ${attrs}>${e(s)}</text>`;
  const line = (x1,y1,x2,y2,attrs='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b9b9b9" stroke-width=".6" ${attrs}/>`;
  const rect = (x,y,w,h,color) => `<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${color}"/>`;
  const svg = (w,h,body,label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(label)}"><rect width="100%" height="100%" fill="white"/>${body}</svg>`;
  const niceMax = max => Math.max(1, Math.ceil(max / Math.max(1,10**Math.floor(Math.log10(Math.max(max,1)))))*Math.max(1,10**Math.floor(Math.log10(Math.max(max,1)))));
  function firstSunday(year){const d=new Date(Date.UTC(+year,0,1));d.setUTCDate(1+(7-d.getUTCDay())%7);return d;}
  function weeksInYear(year){return Math.round((firstSunday(+year+1)-firstSunday(year))/604800000);}
  function weekForDate(year,date){const d=new Date(date+'T00:00:00Z');return Math.min(weeksInYear(year),Math.max(1,Math.floor((d-firstSunday(year))/604800000)+1));}
  function dateForWeek(year,week){const d=firstSunday(year);d.setUTCDate(d.getUTCDate()+(+week-1)*7+6);return d.toISOString().slice(0,10);}
  function periodLabel(year,date){const start=firstSunday(year).getUTCDate();const end=new Date(date+'T00:00:00Z');return `January ${start} - ${end.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})}`;}

  function weekly(rows,thresholds={}){
    const w=557,h=232,l=37,r=11,t=16,b=32,cw=w-l-r,ch=h-t-b;
    const weeks=thresholds.weeks||((rows.some(c=>+c.mw===53))?53:52),vals=Array.from({length:weeks},(_,i)=>rows.filter(c=>+c.mw===i+1).length),alerts=thresholds.alert||[],epidemics=thresholds.epidemic||[];
    const peak=Math.max(1,...vals,...alerts.filter(v=>v!==null&&Number.isFinite(v)),...epidemics.filter(v=>v!==null&&Number.isFinite(v))),power=10**Math.floor(Math.log10(peak/5)),raw=peak/5/power,step=Math.max(1,(raw<=1?1:raw<=2?2:raw<=5?5:10)*power),max=Math.ceil(peak/step)*step;
    const x=i=>l+(i+.5)*cw/weeks,y=v=>t+ch-v/max*ch;
    let s='';for(let v=0;v<=max;v+=step)s+=text(l-7,y(v)+3,Number(v.toFixed(2)),'text-anchor="end" font-size="8"');
    s+=line(l,t+ch,w-r,t+ch);
    vals.forEach((v,i)=>s+=rect(l+i*cw/weeks,y(v),cw/weeks-.7,v/max*ch,blue));
    const curve=(series,color,dashed,kind)=>{let d='',started=false;series.slice(0,weeks).forEach((v,i)=>{if(v===null||!Number.isFinite(v)){started=false;return;}d+=(started?' L':' M')+x(i).toFixed(2)+' '+y(v).toFixed(2);started=true;});const points=series.slice(0,weeks).map((v,i)=>v!==null&&Number.isFinite(v)&&!Number.isFinite(series[i-1])&&!Number.isFinite(series[i+1])?'<circle cx="'+x(i).toFixed(2)+'" cy="'+y(v).toFixed(2)+'" r="2" fill="'+color+'"/>':'').join('');return d?'<path class="threshold-line '+kind+'" d="'+d+'" fill="none" stroke="'+color+'" stroke-width="1.6" '+(dashed?'stroke-dasharray="6 4"':'')+'/>'+points:'';};
    s+=curve(epidemics,'#ff0000',false,'epidemic')+curve(alerts,'#ffc000',true,'alert');
    for(let i=1;i<=weeks;i+=2)s+=text(x(i-1),h-18,i,'text-anchor="middle" font-size="8"');
    s+=text(w/2,h-4,'Morbidity Week','text-anchor="middle"')+text(10,h/2,'No. of Cases',`text-anchor="middle" transform="rotate(-90 10 ${h/2})"`);
    s+='<rect x="98" y="7" width="132" height="43" fill="white" fill-opacity=".92"/>';
    s+=rect(102,13,25,5,blue)+text(129,18,'Current Year','font-size="8"');
    s+=line(102,28,127,28,'style="stroke:#ffc000;stroke-width:1.5;stroke-dasharray:6 4"')+text(129,31,'Alert Threshold','font-size="8"');
    s+=line(102,41,127,41,'style="stroke:red;stroke-width:1.7"')+text(129,44,'Epidemic Threshold','font-size="8"');
    if(thresholds.kind==='missing')s+=text(330,26,'Historical baseline needed','text-anchor="middle" font-size="8"');
    if(thresholds.kind==='reference')s+=text(400,26,'Rizal reference · not municipal','text-anchor="middle" font-size="8" class="threshold-reference-badge"');
    return svg(w,h,s,'Cases by morbidity week with alert and epidemic thresholds');
  }
  function ageSex(rows){
    const w=260,h=204,l=31,r=11,t=32,b=31,groups=['>60','51-60','41-50','31-40','21-30','11-20','1-10','<1'];
    const bucket=a=>a<1?'<1':a<=10?'1-10':a<=20?'11-20':a<=30?'21-30':a<=40?'31-40':a<=50?'41-50':a<=60?'51-60':'>60';
    const male=groups.map(g=>rows.filter(c=>bucket(+c.age)===g&&n(c.sex)==='male').length), female=groups.map(g=>rows.filter(c=>bucket(+c.age)===g&&n(c.sex)==='female').length);
    const max=niceMax(Math.max(1,...male)),rightMax=niceMax(Math.max(1,...female)),unit=(w-l-r-6)/(max+rightMax),mid=l+6+max*unit,rh=(h-t-b)/8;
    let s=text(8,18,'Age Group','font-size="12"')+line(mid,t,mid,h-b);
    groups.forEach((g,i)=>{const y=t+i*rh;s+=text(l-5,y+11,g,'text-anchor="end" font-size="8"')+rect(mid-male[i]*unit,y,male[i]*unit,rh-2,blue)+rect(mid,y,Math.min(female[i]*unit,w-mid-12),rh-2,orange);});
    for(let v=0;v<=max;v+=Math.max(1,Math.ceil(max/4)))s+=text(mid-v*unit,h-19,v,'text-anchor="middle" font-size="8"');
    for(let v=1;v<=rightMax;v+=Math.max(1,Math.ceil(rightMax/3)))s+=text(mid+v*unit,h-19,v,'text-anchor="middle" font-size="8"');
    s+=rect(103,h-6,4,4,blue)+text(109,h-2,'Male','font-size="8"')+rect(138,h-6,4,4,orange)+text(144,h-2,'Female','font-size="8"');
    return svg(w,h,s,'Cases by sex and age group');
  }
  function classification(rows){
    const w=260,h=204,l=27,r=11,t=16,b=26,names=['Suspect','Probable','Confirmed'],vals=names.map(k=>count(rows,'classification',k)),max=niceMax(Math.max(1,...vals)),ch=h-t-b,cw=w-l-r;
    let s=line(l,h-b,w-r,h-b);
    for(let v=0;v<=max;v+=Math.max(1,Math.ceil(max/5)))s+=text(l-7,h-b-v/max*ch+3,v,'text-anchor="end" font-size="8"');
    vals.forEach((v,i)=>{const x=l+i*cw/3+5,bh=v/max*ch,bw=cw/3-10;s+=rect(x,h-b-bh,bw,bh,blue)+text(x+bw/2,h-11,names[i],'text-anchor="middle" font-size="8"');if(bh>39){s+=text(x+bw/2,h-b-bh/2,pc(v,rows.length)+'%,','text-anchor="middle" style="fill:white;font-weight:bold"')+text(x+bw/2,h-b-bh/2+12,v,'text-anchor="middle" style="fill:white;font-weight:bold"');}else s+=text(x+bw/2,h-b-bh-5,pc(v,rows.length)+'%, '+v,'text-anchor="middle" font-size="8" font-weight="bold"');});
    return svg(w,h,s,'Case classification');
  }
  function horizontal(labels,vals,w,h,left=104){
    const top=12,bottom=23,cw=w-left-30,rh=(h-top-bottom)/Math.max(labels.length,1),max=niceMax(Math.max(1,...vals));let s=line(left,top,left,h-bottom);
    labels.forEach((label,i)=>{const y=top+i*rh,parts=Array.isArray(label)?label:[label];parts.forEach((p,j)=>s+=text(left-7,y+rh/2+(j-(parts.length-1)/2)*10+3,p,'text-anchor="end" font-size="8"'));s+=rect(left,y+rh*.12,vals[i]/max*cw,rh*.76,blue)+text(left+vals[i]/max*cw+6,y+rh/2+3,vals[i],'font-size="8"');});
    for(let v=0;v<=max;v+=Math.max(1,Math.ceil(max/5)))s+=text(left+v/max*cw,h-7,v,'text-anchor="middle" font-size="8"');return svg(w,h,s,'Cases by exposure');
  }
  function exposure(rows){const names=['Unknown','Others','Ingestion of contaminated foods/drinks','Mud Exposure','Agriculture related','Flood related'];return horizontal(names.map(s=>s.startsWith('Ingestion')?['Ingestion of contaminated','foods/drinks']:s),names.map(k=>count(rows,'exposure',k)),260,201,104);}
  const tests=['IgM and IgG Antibody Test','IgM Antibody Test','IgG Antibody Test','Microscopic Agglutination Test','Real-Time Polymerase Chain Reaction (RT-PCR)','Rapid Diagnostic Test'];
  function labKey(c){const k=n(c.testType);if(k.includes('igm')&&k.includes('igg'))return tests[0];if(k.includes('igm'))return tests[1];if(k.includes('igg'))return tests[2];if(k.includes('agglutination')||k==='mat')return tests[3];if(k.includes('pcr'))return tests[4];if(k.includes('rapid')||k==='rdt')return tests[5];return 'Test not specified';}
  function labs(rows){
    const valid=rows.filter(c=>['positive','negative'].includes(n(c.labResult))),labels=[...tests];if(valid.some(c=>labKey(c)==='Test not specified'))labels.push('Test not specified');
    const w=260,h=214,left=126,top=8,bottom=28,cw=w-left-20,rh=(h-top-bottom)/labels.length,neg=labels.map(k=>valid.filter(c=>labKey(c)===k&&n(c.labResult)==='negative').length),pos=labels.map(k=>valid.filter(c=>labKey(c)===k&&n(c.labResult)==='positive').length),max=niceMax(Math.max(1,...neg,...pos));let s=line(left,top,left,h-bottom);
    labels.forEach((label,i)=>{const y=top+i*rh,parts=label===tests[4]?['Real-Time Polymerase Chain','Reaction (RT-PCR)']:label===tests[3]?['Microscopic Agglutination Test']:[label];parts.forEach((p,j)=>s+=text(left-7,y+rh/2+(j-(parts.length-1)/2)*9+2,p,'text-anchor="end" font-size="7.1"'));s+=rect(left,y,neg[i]/max*cw,rh*.4,orange)+rect(left,y+rh*.43,pos[i]/max*cw,rh*.4,blue);if(neg[i])s+=text(left+neg[i]/max*cw+4,y+rh*.3,neg[i],'font-size="7"');if(pos[i])s+=text(left+pos[i]/max*cw+4,y+rh*.74,pos[i],'font-size="7"');});
    for(let v=0;v<=max;v+=Math.max(1,Math.ceil(max/4)))s+=text(left+v/max*cw,h-16,v,'text-anchor="middle" font-size="7"');
    s+=rect(111,h-7,4,4,orange)+text(117,h-3,'Neg','font-size="8"')+rect(141,h-7,4,4,blue)+text(147,h-3,'Pos','font-size="8"');return svg(w,h,s,'Laboratory results by type of test');
  }
  function place(rows){const obj={};rows.forEach(c=>{const k=String(c.exposurePlace||c.province||'Unknown').trim();obj[k]=(obj[k]||0)+1;});let pairs=Object.entries(obj).sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]));if(pairs.length>10){pairs=[['Other places',pairs.slice(0,-9).reduce((a,b)=>a+b[1],0)],...pairs.slice(-9)];}return horizontal(pairs.map(p=>p[0]),pairs.map(p=>p[1]),353,219,77);}

  function stats(all,year,week){
    const residents=all.filter(c=>n(c.city||'Binangonan')==='binangonan');
    const rows=residents.filter(c=>+c.year===+year&&+c.mw>=1&&+c.mw<=week),prev=residents.filter(c=>+c.year===year-1&&+c.mw>=1&&+c.mw<=week);
    const ages=rows.filter(c=>c.age!==''&&Number.isFinite(+c.age)).map(c=>+c.age).sort((a,b)=>a-b);
    return {rows,prev,deaths:count(rows,'outcome','Died'),prevDeaths:count(prev,'outcome','Died'),male:count(rows,'sex','Male'),female:count(rows,'sex','Female'),min:ages[0],max:ages.at(-1),median:ages.length?(ages[Math.floor((ages.length-1)/2)]+ages[Math.ceil((ages.length-1)/2)])/2:null};
  }
  function change(current,prior){if(!prior)return current?'N/A':'No Change ↔';const p=100*(current-prior)/prior;return p?Math.abs(p).toFixed(2)+'% '+(p>0?'↑':'↓'):'No Change ↔';}
  function barangayRows(s){const names=[...new Set([...s.rows,...s.prev].map(c=>String(c.barangay||'Unknown').trim()))].sort((a,b)=>a.localeCompare(b));return names.map(name=>{const cur=s.rows.filter(c=>String(c.barangay||'Unknown').trim()===name),old=s.prev.filter(c=>String(c.barangay||'Unknown').trim()===name);return{name,current:cur.length,prior:old.length,deaths:count(cur,'outcome','Died'),oldDeaths:count(old,'outcome','Died')};});}
  function tablePart(rows,s,year,total=true){return `<table class="source-table"><thead><tr><th></th><th colspan="2">${year-1}</th><th colspan="2">${year}</th><th colspan="3"></th></tr><tr><th>Barangay</th><th>Cases</th><th>Death</th><th>Cases</th><th>Death</th><th>Case %</th><th>% Change</th><th>CFR</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${e(r.name)}</td><td>${r.prior}</td><td>${r.oldDeaths}</td><td>${r.current}</td><td>${r.deaths}</td><td>${pc(r.current,s.rows.length)}</td><td class="delta">${change(r.current,r.prior)}</td><td>${pc(r.deaths,r.current)}%</td></tr>`).join('')}${total?`<tr class="source-total"><td>Total</td><td>${s.prev.length}</td><td>${s.prevDeaths}</td><td>${s.rows.length}</td><td>${s.deaths}</td><td>${s.rows.length?100:0}</td><td>${change(s.rows.length,s.prev.length)}</td><td>${pc(s.deaths,s.rows.length)}%</td></tr>`:''}</tbody></table>`;}
  function caption(title,period){return `<figcaption><span class="figure-title">${e(title)}</span><span class="figure-period">Municipality of Binangonan, as of ${e(period)}</span></figcaption>`;}
  function figure(cls,title,period,chart){return `<figure class="source-figure ${cls}">${caption(title,period)}<div class="chart">${chart}</div></figure>`;}
  function header(){return `<div class="source-head block"><img src="assets/municipality.png" alt="Municipality of Binangonan"><img src="assets/health-office.png" alt="Municipal Health Office"><div class="head-text">Republic of the Philippines<br>Province of Rizal<br><strong>Municipality of Binangonan</strong>Municipal Health Office<br><strong>Epidemiology and Surveillance Unit</strong></div><img src="assets/surveillance.png" alt="Epidemiology and Surveillance Unit"><img class="wordmark" src="assets/binangonan-wordmark.png" alt="Mahal Kong Binangonan"></div>`;}
  function page1(s,opt,period){
    const rows=barangayRows(s),top=[...rows].sort((a,b)=>b.current-a.current||a.name.localeCompare(b.name))[0],newCases=s.rows.filter(c=>+c.mw===opt.week).length,newDeaths=s.rows.filter(c=>+c.mw===opt.week&&n(c.outcome)==='died').length;
    const delta=s.prev.length?`This is ${Math.abs(100*(s.rows.length-s.prev.length)/s.prev.length).toFixed(1)}% ${s.rows.length>=s.prev.length?'higher':'lower'} compared to the same time period last year (${s.prev.length} cases).`:'No prior-year cases were recorded for the same reporting period.';
    const sex=s.male>=s.female?'male':'female',sexCount=Math.max(s.male,s.female);
    const topText=top&&top.current?`Barangay ${e(top.name)} has the highest number of Leptospirosis cases (${top.current}, ${pc(top.current,s.rows.length)}%). [Table 1]`:'No Leptospirosis cases were recorded for the selected reporting period. [Table 1]';
    const table=rows.length>23?`<div class="table-columns">${tablePart(rows.slice(0,Math.ceil(rows.length/2)),s,opt.year,false)}${tablePart(rows.slice(Math.ceil(rows.length/2)),s,opt.year)}</div>`:tablePart(rows,s,opt.year);
    return `<section class="source-page" data-page="1">${header()}<div class="source-banner block"><div>Epidemic- prone Diseases Case Surveillance (EDCS)<br>Weekly Leptospirosis Surveillance Report</div><div>Morbidity Week<br>${e(period)}</div><b>${opt.week}</b></div>
    <div class="source-intro block"><img src="assets/disease-icon.png" alt="Floodwater exposure"><p>Leptospirosis is a group of zoonotic bacterial diseases with variable manifestations. Disease transmission may be through: contact of the skin, especially if abraded, or of mucous membranes with moist soil, vegetation (rice fields, sugarcane plantation) contaminated with the urine of infected animals or contaminated water, as in swimming, wading in floodwaters, accidental immersion or occupational abrasion; direct contact with urine or tissues of infected animals.</p></div>
    <div class="case-definitions block"><h3>Suspected Case</h3><p>History of fever within the past 2 weeks and at least two of the following clinical findings: myalgia, headache, jaundice, conjunctival suffusion without purulent discharge, or rash (maculopapular or petechial) or, at least one of the following clinical findings: Aseptic meningitis, GI symptoms, Pulmonary complications, Cardiac arrhythmias, Renal insufficiencies, Hemorrhage, Jaundice, with acute renal failure.</p><h3 class="probable">Probable Case</h3><p>A clinically compatible case with at least one of the following: Involvement in an exposure event, with known associated cases or presumptive laboratory findings but without confirmatory laboratory evidence of Leptospira infection or a suspected case in an ongoing epidemic or epidemiologically linked to a confirmed case OR a clinically tested positive by Rapid Test Kits</p><h3 class="confirmed">Confirmed Case</h3><p>A suspect case that is laboratory confirmed.</p></div>
    <div class="source-counters block"><div class="source-counter"><strong>TOTAL CASES</strong><b>${s.rows.length}</b><em>${newCases} additional case${newCases===1?'':'s'} for the current week.</em></div><div class="source-counter deaths"><strong>TOTAL DEATHS</strong><b>${s.deaths}</b><em>${newDeaths?`${newDeaths} new death case${newDeaths===1?'':'s'} for`:'No new added death case for'}<br>the current week.</em></div><p class="source-exposure">Possibly <b>AFTER</b> exposure to infected animals<br>or an environment contaminated with animal<br>urine</p></div>
    <div class="source-summary block"><h3>SUMMARY</h3><ul><li>A total of ${s.rows.length} Leptospirosis cases with ${s.deaths} deaths (CFR: ${pc(s.deaths,s.rows.length)}%) were reported in the Municipality of Binangonan from ${e(period)}. ${delta} [Table 1]</li><li>${topText}</li><li>${s.rows.length?`Majority of the cases were ${sex} (${sexCount}, ${pc(sexCount,s.rows.length)}%) and ages ranged from ${s.min} to ${s.max} yrs. old (Median: ${s.median} years old).`:'Age and sex distribution: no cases in the selected period.'} [Figure 2]</li><li>Among the reported cases, there were ${count(s.rows,'classification','Suspect')} (${pc(count(s.rows,'classification','Suspect'),s.rows.length)}%) suspect cases, ${count(s.rows,'classification','Probable')} (${pc(count(s.rows,'classification','Probable'),s.rows.length)}%) probable cases and ${count(s.rows,'classification','Confirmed')} (${pc(count(s.rows,'classification','Confirmed'),s.rows.length)}%) confirmed cases [Figure 3].</li></ul></div>
    <div class="source-table-wrap block ${rows.length>17?'dense':''}"><div class="source-caption">Table 1. Distribution of Leptospirosis Cases per Barangay (N=${s.rows.length})<br>Municipality of Binangonan, as of ${e(period)}</div>${table}</div></section>`;
  }
  function page2(s,period,thresholds={}){const N=s.rows.length,labN=s.rows.filter(c=>['positive','negative'].includes(n(c.labResult))).length;return `<section class="source-page" data-page="2">${figure('source-weekly block',`Figure 1. Distribution of Leptospirosis Cases by Morbidity Week, Alert and Epidemic Threshold (N=${N})`,period,weekly(s.rows,thresholds))}<div class="source-threshold-note block"><b>${e(thresholds.label||"Historical baseline needed")}</b><br>${e(thresholds.note||"Enter historical weekly data to calculate municipal thresholds.")}</div><div class="source-grid block">${figure('',`Figure 2. Distribution of Leptospirosis Cases by Sex and Age group (N=${N})`,period,ageSex(s.rows))}${figure('',`Figure 3. Distribution of Leptospirosis Case Classification (N=${N})`,period,classification(s.rows))}${figure('',`Figure 4. Distribution of Leptospirosis Cases by Exposure (N=${N})`,period,exposure(s.rows))}${figure('',`Figure 5. Leptospirosis Cases by Laboratory Results (n=${labN})`,period,labs(s.rows))}</div></section>`;}
  function signature(label,name,role){return `<div><b>${e(label)}:</b>${name?`<span class="signature-name">${e(name)}</span>`:'<span class="blank-signature"></span>'}${e(role)}</div>`;}
  function page3(s,opt,period){return `<section class="source-page" data-page="3">${figure('source-place block',`Figure 5. Leptospirosis Cases by Place of exposure (N=${s.rows.length})`,period,place(s.rows))}<div class="source-actions block"><h3>Actions taken:</h3><p class="action-paragraph">▪ MESU DSO – generated analysis and relay it to all concerned barangays, ESUs, and other partner stakeholders for verification and necessary actions.</p><h3>Recommendations:</h3><p class="recommend-intro">▪ To strengthen the surveillance system of high risk spot/areas.<br>▪ To intensify information dissemination and public health awareness and implementing preventive measures on Leptospirosis prevention campaign such as the following:</p>
    <p class="rec">1. <b>Avoid Wading in Floodwaters or Mud:</b> Leptospirosis is commonly spread through water or soil contaminated by urine from infected animals (such as rats). Avoid walking through flooded areas, especially if you have open wounds.</p>
    <p class="rec">2. <b>Wear Protective Clothing and Footwear:</b> If you must wade through water, wear boots, gloves, and protective clothing to minimize direct contact with potentially contaminated water or soil.</p>
    <p class="rec">3. <b>Proper Hygiene:</b> Wash your hands and feet thoroughly with clean water and soap after exposure to floodwaters or dirt, especially before eating or touching your face.</p>
    <p class="rec">4. <b>Disinfect Wounds:</b> Cover cuts or open wounds with waterproof bandages to prevent infection. If they come into contact with floodwater, clean them immediately with soap and water.</p>
    <p class="rec">5. <b>Control Rodents:</b> Since rodents are the primary carriers of leptospirosis, ensure proper waste management to reduce rodent populations. Keep food and garbage stored securely, and eliminate potential rat nests around your home.</p>
    <p class="rec">6. <b>Safe Drinking Water:</b> Drink only safe, clean water. Boil or treat water if you're unsure of its quality, as leptospirosis can be transmitted through contaminated water.</p>
    <p class="rec">7. <b>Seek Medical Attention Early:</b> If you develop symptoms such as fever or muscle pain, seek medical attention early.</p></div>
    <div class="source-signatures block">${signature('Prepared by',opt.prepared,opt.preparedRole||'Disease Surveillance Officer')}${signature('Reviewed by',opt.reviewed,opt.reviewedRole||'Municipal Health Office')}${signature('Noted by',opt.noted,opt.notedRole||'Municipal Health Officer')}</div>
    <div class="source-disclaimer block"><b>DISCLAIMER:</b>Every effort has been made to provide accurate and updated information. However, errors still can occur. Case counts report here DO NOT represent the final numbers and are subject to change after inclusion of delayed reports, and update in the status of the case following case review. By using the information contained in this report, the reader assumes all risk in with such use. The Municipal Health Office - Binangonan shall not be held responsible for errors, nor liable for damage(s) resulting from use or reliance upon this matter.</div></section>`;}
  function render(all,opt){const settings={...opt,year:+opt.year,week:weekForDate(opt.year,opt.end)},s=stats(all,settings.year,settings.week),period=periodLabel(settings.year,settings.end);return page1(s,settings,period)+page2(s,period,settings.thresholds)+page3(s,settings,period);}
  window.BinangonanReport={render,stats,weeksInYear,weekForDate,dateForWeek,periodLabel,charts:{weekly,ageSex,classification,exposure,labs,place}};
})();
