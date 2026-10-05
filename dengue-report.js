/* Offline dengue bulletin. All figures come from the selected local case records. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = value => String(value ?? '').trim().toLowerCase();
  const died = row => norm(row.outcome) === 'died';
  const percent = (value,total) => total ? 100*value/total : 0;
  const ageGroups = ['>50','41–50','31–40','21–30','11–20','1–10','<1'];
  const ageGroup = value => { if(value === '' || value == null || !Number.isFinite(+value) || +value < 0) return null; const a=+value; return a<1?'<1':a<=10?'1–10':a<=20?'11–20':a<=30?'21–30':a<=40?'31–40':a<=50?'41–50':'>50'; };
  const colors = {male:'#8fb9dd',maleDeath:'#d8595d',female:'#e4e83e',femaleDeath:'#864f63'};
  const svgText = (x,y,value,extra='') => `<text x="${x}" y="${y}" ${extra}>${esc(value)}</text>`;
  const rect = (x,y,width,height,fill) => `<rect x="${x}" y="${y}" width="${Math.max(0,width)}" height="${Math.max(0,height)}" fill="${fill}" stroke="#476055" stroke-width=".35"/>`;

  function comparison(rows,prev,year){
    const current=rows.length,previous=prev.length,delta=previous ? 100*(current-previous)/previous : null;
    const display=delta==null ? 'N/A' : `${delta>0?'↑':delta<0?'↓':'↔'}${Number(Math.abs(delta).toFixed(1))}%`;
    const explanation=delta==null ? 'No recorded cases in the prior-year period' : delta>0?'Increase in reported cases':delta<0?'Decrease in reported cases':'No change in reported cases';
    return `<div class="dg-comparison"><div class="dg-years">${[[year,rows],[year-1,prev]].map(([y,data])=>`<div class="dg-year"><h3>${y}</h3><div class="dg-count-pair"><div><span>CASES</span><strong>${data.length}</strong></div><div><span>DEATHS</span><strong>${data.filter(died).length}</strong></div><div class="dg-class-count" data-classification="probable"><span>PROBABLE</span><strong>${data.filter(row=>norm(row.classification)==='probable').length}</strong></div><div class="dg-class-count" data-classification="suspect"><span>SUSPECT</span><strong>${data.filter(row=>norm(row.classification)==='suspect').length}</strong></div></div></div>`).join('')}</div><div class="dg-change"><span>Reported Cases<br>Same Period<br>Last Year</span><strong>${display}</strong><small>${explanation}</small></div></div>`;
  }

  function pyramid(rows){
    const w=480,h=292,left=48,right=18,top=20,bottom=63,plotW=w-left-right,mid=left+plotW/2,rowH=(h-top-bottom)/ageGroups.length;
    const series=ageGroups.map(group=>({group,male:0,maleDeath:0,female:0,femaleDeath:0}));
    let omitted=0;
    rows.forEach(row=>{const group=ageGroup(row.age),sex=norm(row.sex);if(!group || !['male','female'].includes(sex)){omitted++;return;}series.find(s=>s.group===group)[sex+(died(row)?'Death':'')]++;});
    const observed=Math.max(0,...series.flatMap(s=>[percent(s.male+s.maleDeath,rows.length),percent(s.female+s.femaleDeath,rows.length)]));
    const bound=Math.max(10,Math.ceil(observed/10)*10),unit=(plotW/2)/bound;
    let body='';
    for(let tick=-bound;tick<=bound;tick+=Math.max(5,Math.ceil(bound/4/5)*5)){
      const x=mid+tick*unit;
      body+=`<line x1="${x}" y1="${top}" x2="${x}" y2="${h-bottom}" stroke="${tick===0?'#254e3d':'#dbe4d8'}" stroke-width="${tick===0?'.9':'.45'}"/>`;
      body+=svgText(x,h-bottom+16,Math.abs(tick),'text-anchor="middle" font-size="10"');
    }
    series.forEach((s,i)=>{
      const y=top+i*rowH,bh=rowH-2,ma=percent(s.male,rows.length)*unit,md=percent(s.maleDeath,rows.length)*unit,fa=percent(s.female,rows.length)*unit,fd=percent(s.femaleDeath,rows.length)*unit;
      body+=svgText(left-8,y+rowH/2+4,s.group,'text-anchor="end" font-size="11"');
      body+=rect(mid-ma,y,ma,bh,colors.male)+rect(mid-ma-md,y,md,bh,colors.maleDeath)+rect(mid,y,fa,bh,colors.female)+rect(mid+fa,y,fd,bh,colors.femaleDeath);
    });
    body+=svgText(mid,h-29,'Percentage of all reported cases (%)','text-anchor="middle" font-size="10"');
    const legend=[['Male alive',colors.male],['Male death',colors.maleDeath],['Female alive',colors.female],['Female death',colors.femaleDeath]];
    legend.forEach(([label,color],i)=>{const x=40+i*110;body+=rect(x,h-15,7,7,color)+svgText(x+11,h-8,label,'font-size="9"');});
    if(!rows.length)body+=svgText(mid,top+80,'No cases recorded','text-anchor="middle" font-size="13" fill="#49705e"');
    return `<svg class="dg-pyramid-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Percentage of dengue cases and deaths by sex and age group"><title>Dengue cases and deaths by sex and age group</title>${body}</svg>${omitted?`<p class="dg-data-note">${omitted} case${omitted===1?'':'s'} with missing age or sex excluded from bars; percentages use all ${rows.length} cases.</p>`:''}`;
  }

  function barangays(rows,week){
    const groups=new Map();
    rows.forEach(row=>{
      const label=String(row.barangay||'Unknown').trim()||'Unknown',key=norm(label);
      if(!groups.has(key))groups.set(key,{name:label,count:0,deaths:0,recent:0,cluster:false});
      const item=groups.get(key);item.count++;item.deaths+=died(row)?1:0;
      if(+row.mw>=Math.max(1,+week-3)&&+row.mw<=+week)item.recent++;
    });
    return [...groups.values()].map(item=>({...item,cluster:!['unknown','not specified','unspecified','n/a'].includes(norm(item.name))&&item.recent>=3})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  }

  function tablePart(items,totals,showTotal){
    return `<table class="dg-table"><thead><tr><th>BARANGAY</th><th>CASES</th><th>DEATHS</th><th>LAST<br>4 MW</th><th>CLUSTER*</th></tr></thead><tbody>${items.length?items.map(item=>`<tr><td>${esc(item.name)}</td><td>${item.count}</td><td>${item.deaths}</td><td>${item.recent}</td><td>${item.cluster?'●':'–'}</td></tr>`).join(''):'<tr><td colspan="5" class="dg-empty-table">No cases recorded for this period</td></tr>'}${showTotal?`<tr class="dg-total"><td>TOTAL</td><td>${totals.count}</td><td>${totals.deaths}</td><td>${totals.recent}</td><td>${totals.cluster}</td></tr>`:''}</tbody></table>`;
  }

  function distribution(rows,week,forceSplit=false){
    const items=barangays(rows,week),totals=items.reduce((total,item)=>({count:total.count+item.count,deaths:total.deaths+item.deaths,recent:total.recent+item.recent,cluster:total.cluster+(item.cluster?1:0)}),{count:0,deaths:0,recent:0,cluster:0});
    const split=forceSplit&&items.length>22,half=Math.ceil(items.length/2);
    return `<div class="dg-tables ${split?'dg-two-tables':''}">${split?tablePart(items.slice(0,half),totals,false)+tablePart(items.slice(half),totals,true):tablePart(items,totals,true)}</div><p class="dg-cluster-note">*Cluster marker: at least 3 reported cases in the same barangay within MW ${Math.max(1,+week-3)}–${+week}. This is a screening indicator, not an official hotspot declaration. Unknown barangays are excluded.</p>`;
  }

  function weekly(rows,opt){
    return window.BinangonanReport.charts.weekly(rows,opt.thresholds).replace(/Leptospirosis cases by morbidity week/g,'Dengue cases by morbidity week');
  }
  function period(opt){if(opt.period)return opt.period;return window.BinangonanReport.periodLabel(+opt.year,opt.end||window.BinangonanReport.dateForWeek(+opt.year,+opt.week));}
  function chartTitle(title,rows,opt){return `<h2>${title.replace(/<br>/g,'<br> ')}</h2><p class="dg-chart-period">BINANGONAN, RIZAL · MW 1–${+opt.week}, ${+opt.year}<br> N=${rows.length}</p>`;}
  function thresholdNote(opt){return `<p class="dg-threshold-note">${esc(opt.thresholds?.note||opt.thresholds?.label||'Thresholds are not configured for this reporting year.')}</p>`;}

  function dashboard(rows,prev,opt){
    const year=+opt.year,week=+opt.week||52,settings={...opt,year,week};
    return `<div class="dg-dashboard"><article class="dg-dashboard-card dg-dashboard-wide"><span class="dg-eyebrow">DENGUE SURVEILLANCE</span><h2>Cases by morbidity week, alert and epidemic threshold</h2><p class="dg-card-period">Binangonan · ${year} · MW 1–${week} · N=${rows.length}</p><div class="dg-weekly">${weekly(rows,settings)}</div>${thresholdNote(settings)}</article><article class="dg-dashboard-card"><span class="dg-eyebrow">SAME-PERIOD COMPARISON</span><h2>Reported cases and deaths</h2>${comparison(rows,prev,year)}<p class="dg-data-note">Comparison uses records for MW 1–${week} in both years. Missing prior-year records do not establish zero disease occurrence.</p></article><article class="dg-dashboard-card"><span class="dg-eyebrow">SEX & AGE GROUP</span><h2>Proportion of cases and deaths</h2>${pyramid(rows)}</article><article class="dg-dashboard-card dg-dashboard-wide"><span class="dg-eyebrow">BARANGAY DISTRIBUTION</span><h2>Reported cases, deaths, and recent clusters</h2>${distribution(rows,week)}</article></div>`;
  }

  function render(all,opt){
    const settings={...opt,year:+opt.year,week:+opt.week||window.BinangonanReport.weekForDate(opt.year,opt.end)},s=window.BinangonanReport.stats(all,settings.year,settings.week),dense=barangays(s.rows,settings.week).length>22;
    const logos=`<div class="dg-seals"><img src="assets/municipality.png" alt="Municipality of Binangonan"><img src="assets/health-office.png" alt="Municipal Health Office"><img src="assets/surveillance.png" alt="Epidemiology and Surveillance Unit"></div>`;
    return `<section class="dengue-page ${dense?'dg-dense':''}" data-page="1"><header class="dg-header"><img class="dg-wordmark" src="assets/binangonan-wordmark.png" alt="Mahal Kong Binangonan"><div class="dg-heading"><h1>DENGUE CASE BULLETIN</h1><h2>AS OF MORBIDITY WEEK 1–${settings.week}</h2><p>(${esc(period(settings)).toUpperCase()})</p></div><div class="dg-office"><p>Municipality of Binangonan, Rizal<br><strong>Municipal Health Office</strong><br>Epidemiology and Surveillance Unit</p>${logos}</div></header><div class="dg-body"><div class="dg-left"><section class="dg-trend">${chartTitle('DISTRIBUTION OF DENGUE CASES<br>BY MORBIDITY WEEK',s.rows,settings)}<div class="dg-weekly">${weekly(s.rows,settings)}</div>${thresholdNote(settings)}</section><div class="dg-overview">${comparison(s.rows,s.prev,settings.year)}<section class="dg-demographics">${chartTitle('% PROPORTION OF CASES AND DEATHS<br>BY SEX AND AGE GROUP',s.rows,settings)}${pyramid(s.rows)}</section></div></div><section class="dg-distribution">${chartTitle('DISTRIBUTION OF DENGUE CASES<br>PER BARANGAY',s.rows,settings)}${distribution(s.rows,settings.week,true)}</section></div><footer class="dg-footer"><div><strong>BINANGONAN MUNICIPAL HEALTH OFFICE</strong><br>Epidemiology and Surveillance Unit<p>Source: local case registry. Figures are provisional and subject to validation and delayed reports. Prior-year comparison uses the same morbidity weeks.</p></div></footer></section>`;
  }
  window.DengueReport={render,dashboard,charts:{pyramid},barangays};
})();
