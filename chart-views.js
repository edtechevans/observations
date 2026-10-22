/* Accessible chart views. Install receives the existing dashboard's authoritative
 * filters and evidence functions; no observations, classifications or goals are edited. */
(function(){
  'use strict';
  const M=window.AISG_CHART_MATH;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const F=n=>Number(n||0).toLocaleString('en-GB');
  const P=(n,d)=>d?Math.round(n/d*100)+'%':'Not available';
  const day=v=>M.date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  function dataTable(headers,rows,caption='Chart values',expanded=false){return '<details class="cv-data" '+(expanded?'open':'')+'><summary>View data table</summary><div class="cv-table-scroll" tabindex="0" role="region" aria-label="'+E(caption)+'"><table><caption>'+E(caption)+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+E(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((v,i)=>i?'<td>'+E(v??'Not available')+'</td>':'<th scope="row">'+E(v)+'</th>').join('')+'</tr>').join('')+'</tbody></table></div></details>';}
  function scope(rows,year,division,bounds){const ext=bounds||M.extent(rows),people=new Set(rows.map(r=>String(r.email||r.faculty).trim().toLowerCase())).size;return (division==='All'?'Whole school':division)+' | '+year+(ext?' | '+day(ext.start)+' - '+day(ext.end):'')+' | '+F(rows.length)+' observations | '+F(people)+' faculty represented';}
  function bars(entries,{max=100,unit='%',denominatorLabel='observations',action='',className=''}={}){
    return '<div class="cv-bars '+className+'"><div class="cv-scale" aria-hidden="true"><span></span><span>0'+unit+'<i>'+E(max)+unit+'</i></span><span></span></div>'+entries.map((r,i)=>{
      const known=r.value!==null&&Number.isFinite(Number(r.value)),width=known?Math.max(0,Math.min(100,r.value/max*100)):0;
      return '<div class="cv-bar-row"><'+(action?'button type="button" data-cv-index="'+i+'"':'span')+' class="cv-bar-label">'+E(r.label)+'</'+(action?'button':'span')+'><span class="cv-bar-track" aria-hidden="true"><i class="'+(r.outline?'cv-outline':'')+'" style="width:'+width+'%;--cv-color:'+E(r.color||'#113261')+'"></i></span><span class="cv-bar-value">'+(known?E(unit==='%'?Math.round(r.value)+'%':F(r.value)):'Not available')+(r.n!==undefined?'<small>'+F(r.n)+' of '+F(r.d)+' '+E(denominatorLabel)+'</small>':'')+'</span></div>';
    }).join('')+'</div>';
  }
  function install(C){
    const {el,state,FACETS,LENS,LENS_FACETS}=C;
    const audit=window.AISG_CHART_AUDIT={};
    const status=()=>C.getStatus();
    const context=rows=>scope(rows,state.year,state.division);
    const empty=(host,rows)=>{if(status()==='error'){host.innerHTML='<p class="cv-empty" role="status">Observation data unavailable. Chart results cannot be shown.</p>';return true;}if(!rows.length){host.innerHTML='<p class="cv-empty" role="status">No observations match this view. This is not a zero performance score.</p>';return true;}return false;};
    const initHost=host=>{host.classList.add('cv-chart');const wrap=host.closest('.chart-box');if(wrap)wrap.classList.add('cv-auto');};
    function makeChart(id,type,data,options={}){
      const root=el(id);if(!root)return;C.charts[id]=root;initHost(root);
      const cfg=options.cv||{},isPct=cfg.unit==='%',sets=data.datasets||[],labels=data.labels||[],values=sets.flatMap(s=>s.data||[]).filter(v=>v!==null&&v!==undefined).map(Number).filter(Number.isFinite);
      const maximum=cfg.max??(isPct?100:Math.max(1,Math.ceil(Math.max(0,...values)/5)*5)),unit=isPct?'%':'',title=cfg.title||root.getAttribute('aria-label')||id;
      const desc=cfg.description||'Direct labels and the accompanying data table describe this chart. '+(isPct?'Common scale: 0 to 100 percent.':'Counts start at zero.');
      const headers=cfg.headers||['Category',...sets.map(s=>s.label||'Value')];
      const rows=cfg.rows||labels.map((l,i)=>[l,...sets.map(s=>s.data[i]===null||s.data[i]===undefined?'Not available':(isPct?Math.round(s.data[i])+'%':F(s.data[i]))) ]);
      audit[id]={type,unit:cfg.unit||'count',max:maximum,labels,data:sets.map(s=>({label:s.label,data:s.data})),headers,rows};
      if(status()==='error'){empty(root,[]);return;}
      if(!labels.length){root.innerHTML='<p class="cv-empty">No chart records match the current view.</p>';return;}
      const colors=['#113261','#49677f','#ad2a26'];
      const legend=sets.length>1?'<div class="cv-legend">'+sets.map((s,i)=>'<span><i class="'+(s.cvOutline?'cv-outline':'')+'" style="--cv-color:'+E(typeof s.backgroundColor==='string'?s.backgroundColor:s.borderColor||colors[i%3])+'"></i>'+E(s.label)+'</span>').join('')+'</div>':'';
      if(options.indexAxis==='y'&&sets.length===1){
        const s=sets[0],entries=labels.map((l,i)=>({label:l,value:s.data[i],color:typeof s.backgroundColor==='string'?s.backgroundColor:colors[0]}));
        root.innerHTML='<p class="cv-scope">'+E(cfg.scope||context(C.selectedRows()))+'</p>'+bars(entries,{max:maximum,unit,action:cfg.onSelect?'select':''})+dataTable(headers,rows,title);
        if(cfg.onSelect)root.querySelectorAll('[data-cv-index]').forEach(b=>b.onclick=()=>cfg.onSelect(+b.dataset.cvIndex));
        return;
      }
      const line=type==='line',N=labels.length,W=line?Math.max(320,root.clientWidth||400):Math.max(400,root.clientWidth||600,N*60),H=line?280:320,left=48,right=24,top=30,bottom=75,plotW=W-left-right,plotH=H-top-bottom;
      const y=v=>H-bottom-plotH*(v/maximum),x=i=>left+(line?(N===1?plotW/2:plotW*i/(N-1)):plotW*(i+.5)/N),labelEvery=Math.max(1,Math.ceil(N/(W/90)));
      let svg='<svg class="cv-svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-labelledby="'+id+'-cvtitle '+id+'-cvdesc"><title id="'+id+'-cvtitle">'+E(title)+'</title><desc id="'+id+'-cvdesc">'+E(desc)+' Full values follow in the data table.</desc>';
      let ticks=isPct?[0,25,50,75,100]:[...new Set(Array.from({length:6},(_,i)=>Math.round(i*maximum/5)))];
      ticks.forEach(v=>svg+='<line class="cv-grid" x1="'+left+'" x2="'+(W-right)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text x="'+(left-9)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+unit+'</text>');
      labels.forEach((l,i)=>{if(i%labelEvery===0||i===N-1)svg+='<text x="'+x(i)+'" y="'+(H-bottom+25)+'" text-anchor="middle">'+E(String(l).split('|')[0])+'</text>';if(cfg.samples&&cfg.samples[i]!==undefined)svg+='<text class="cv-sample" x="'+x(i)+'" y="'+(H-bottom+46)+'" text-anchor="middle">n='+cfg.samples[i]+'</text>';});
      sets.forEach((s,si)=>{
        const color=typeof s.backgroundColor==='string'?s.backgroundColor:s.borderColor||colors[si%3];
        if(line){
          M.segments(s.data||[]).forEach(seg=>{if(seg.length>1)svg+='<polyline points="'+seg.map(p=>x(p.index)+','+y(p.value)).join(' ')+'" fill="none" stroke="'+E(color)+'" stroke-width="2.5" '+(s.borderDash?'stroke-dasharray="6 5"':'')+'/>';});
          (s.data||[]).forEach((v,i)=>{if(v===null||v===undefined)return;const thin=cfg.samples&&cfg.samples[i]<10;svg+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="4.5" fill="'+(thin?'#fff':E(color))+'" stroke="'+E(color)+'" stroke-width="2"><title>'+E(labels[i])+': '+Math.round(v)+unit+(thin?' (limited evidence)':'')+'</title></circle><text class="cv-value" x="'+x(i)+'" y="'+Math.max(14,y(v)-10)+'" text-anchor="middle">'+Math.round(v)+unit+'</text>';});
        }else{
          const group=plotW/N,bw=Math.min(42,(group-12)/Math.max(1,sets.length)),offset=sets.length*bw/2;
          (s.data||[]).forEach((v,i)=>{if(v===null||v===undefined){svg+='<text x="'+(x(i)-offset+(si+.5)*bw)+'" y="'+(H-bottom-8)+'" text-anchor="middle">n/a</text>';return;}
            const xx=x(i)-offset+si*bw+2,partial=s.cvPartial?.[i],outline=s.cvOutline;
            svg+='<rect x="'+xx+'" y="'+y(v)+'" width="'+Math.max(1,bw-4)+'" height="'+Math.max(0,y(0)-y(v))+'" fill="'+(outline?'#fff':E(color))+'" stroke="'+E(color)+'" stroke-width="1.5" '+(partial?'stroke-dasharray="4 3" opacity=".65"':'')+'><title>'+E(labels[i])+': '+v+(partial?' (partial week)':'')+'</title></rect><text class="cv-value" x="'+(xx+(bw-4)/2)+'" y="'+Math.max(16,y(v)-8)+'" text-anchor="middle">'+F(v)+'</text>';
          });
        }
      });svg+='</svg>';
      root.innerHTML='<p class="cv-scope">'+E(cfg.scope||context(C.selectedRows()))+'</p>'+legend+'<div class="cv-chart-scroll" tabindex="0" role="region" aria-label="'+E(title)+'">'+svg+'</div><p class="cv-note">'+E(desc)+'</p>'+dataTable(headers,rows,title);
    }
    function boundsFor(rows){return C.periodBounds(C.baseSelectedRows())||M.extent(rows);}
    function weeklyBuckets(rows){const b=boundsFor(rows);return b?M.weekly(rows,state.year,b.start,b.end):[];}
    function renderMonthly(rows){
      const b=boundsFor(rows),weeks=b?M.weekly(rows,state.year,b.start,b.end):[],prevYear=(Number(state.year.slice(0,4))-1)+'-'+state.year.slice(2,4),priorAll=C.getRows().filter(r=>r.schoolYear===prevYear),prior=C.selectedRows({ignoreYear:true,ignorePeriod:true}).filter(r=>r.schoolYear===prevYear),aligned=M.alignPrevious(weeks,prior,prevYear,M.extent(priorAll));
      const sets=[{label:state.year,data:weeks.map(w=>w.count),backgroundColor:'#113261',cvPartial:weeks.map(w=>w.partial)}];
      if(state.comparePrevious)sets.push({label:prevYear+' matched school-year week',data:aligned.map(w=>w.count),backgroundColor:'#49677f',cvOutline:true,cvPartial:weeks.map(w=>w.partial)});
      const rowsTable=weeks.map((w,i)=>['Week '+(w.key+1),day(w.from)+' - '+day(w.to),w.count,w.partial?'Partial week':'Complete week',...(state.comparePrevious?[day(aligned[i].from)+' - '+day(aligned[i].to),aligned[i].count===null?'Not available in source':aligned[i].count]:[])]);
      const description='Calendar weeks include zero-record weeks. Dashed bars mark partial observation weeks. '+(state.comparePrevious?'Years match by Monday-based school-year week (week 1 contains 1 August) and the same weekdays, not by row position. Holidays may differ. n/a is outside prior source coverage.':'A zero means no records within the available source range; it does not establish that school was in session.');
      if(el('monthlyDescription'))el('monthlyDescription').textContent=description;
      makeChart('monthlyChart','bar',{labels:weeks.map(w=>M.date(w.start).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})+(w.partial?' *':'')),datasets:sets},{cv:{title:'Weekly classroom observations',description,scope:scope(rows,state.year,state.division,b),headers:['School-year week','Current dates','Observations','Window',...(state.comparePrevious?['Prior-year dates','Prior-year observations']:[])],rows:rowsTable}});
      audit.monthlyChart.weeks=weeks;audit.monthlyChart.previous=aligned;
    }
    function renderTlfTrends(rows){
      const b=boundsFor(rows),windows=b?M.windows(rows,b.start,b.end):[];
      if(el('tlfTrendNote'))el('tlfTrendNote').textContent='Shared 0-100% scales. Each point is the share of observations with a commendation in that lens. n = observations in that period. Hollow points: fewer than 10; gaps: no observations. Not a measure of improvement.';
      Object.keys(LENS_FACETS).forEach(lens=>{
        const es=windows.map(w=>C.lensEvidence(w.rows,lens,'commendation'));
        makeChart('trend'+lens,'line',{labels:windows.map(w=>M.date(w.end).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})+(w.partial?' *':'')),datasets:[{label:lens+' recorded in commendations',data:es.map((e,i)=>M.pct(e.observations,windows[i].rows.length)),borderColor:C.lensColor(lens)}]},{cv:{title:lens+': recorded lens prevalence',unit:'%',max:100,samples:windows.map(w=>w.rows.length),description:'Common 0-100% scale. * marks a shorter boundary window; hollow points have fewer than 10 observations (a display caution, not a confidence test). Empty periods are gaps, not zero.',headers:['Period','Window','Matching observations','All observations','Recorded prevalence'],rows:windows.map((w,i)=>[day(w.start)+' - '+day(w.end),w.partial?'Partial 28-day window':'28 days',es[i].observations,w.rows.length,P(es[i].observations,w.rows.length)])}});
      });
    }
    function openFacet(facet,type='all',extra={}){C.openFacet(facet,type,extra);}
    function renderTlfProfileInto(id,rows,opts={}){
      const host=el(id);if(!host)return;if(empty(host,rows))return;
      const mode=state.chartProfileDenominator||'observations',counts=state.facetMetric==='count',kind=opts.type||state.facetType||'both',types=kind==='both'?['commendation','wondering']:[kind],den=mode==='observations'?rows.length:new Set(rows.map(r=>r.faculty).filter(Boolean)).size,max=counts?Math.max(1,den):100;
      let html='<p class="cv-scope">'+E(context(rows))+'</p><div class="cv-controls" role="group" aria-label="Chart denominator">'+[['observations','Observations containing the facet'],['faculty','Among observed faculty']].map(([v,l])=>'<button type="button" data-cv-denominator="'+v+'" aria-pressed="'+(mode===v)+'">'+l+'</button>').join('')+'</div><p class="cv-note">'+(mode==='faculty'?'Denominator: '+den+' teachers represented in this observation view, not the full school roster.':'Denominator: '+den+' observations in this view. Each facet is counted at most once per observation.')+' Commendations and wonderings may overlap and must not be added.</p><div class="cv-legend"><span><i></i>Commendation</span><span><i class="cv-outline"></i>Wondering</span></div><div class="cv-profile">';
      const tableRows=[];
      for(const f of FACETS){html+='<section class="cv-profile-row"><div class="cv-profile-label"><button type="button" data-cv-facet="'+E(f)+'">'+E(f)+'</button><small>'+E(LENS[f])+'</small></div><div class="cv-series">';
        for(const t of types){const ev=C.facetEvidence(rows,f,t),n=mode==='observations'?ev.observations:ev.faculty,raw=M.pct(n,den),value=counts?n:raw,label=t==='commendation'?'Commendation':'Wondering';html+='<div class="cv-profile-series"><span>'+label+'</span><span class="cv-bar-track" aria-hidden="true"><i class="'+(t==='wondering'?'cv-outline':'')+'" style="width:'+Math.min(100,value/max*100)+'%"></i></span><button type="button" class="cv-read-value" data-cv-facet="'+E(f)+'" data-cv-type="'+t+'">'+(counts?F(n):Math.round(raw)+'%')+'<small>'+F(n)+' of '+F(den)+' '+(mode==='observations'?'observations':'faculty')+'</small></button></div>';tableRows.push([f,label,ev.observations+' of '+rows.length,P(ev.observations,rows.length),ev.faculty+' of '+ev.facultyTotal,P(ev.faculty,ev.facultyTotal)]);}
        html+='</div></section>';
      }
      html+='</div><p class="cv-note">Bar scale: 0 to '+max+(counts?' '+(mode==='observations'?'observations':'faculty'):'%')+'. Filled and outlined marks distinguish feedback types without colour alone.</p>'+dataTable(['Facet','Feedback type','Observations','% of observations','Observed faculty','% of observed faculty'],tableRows,'TLF profile: exact counts and explicit denominators');
      host.innerHTML=html;host.querySelectorAll('[data-cv-denominator]').forEach(btn=>btn.onclick=()=>{state.chartProfileDenominator=btn.dataset.cvDenominator;C.refresh();});host.querySelectorAll('[data-cv-facet]').forEach(btn=>btn.onclick=()=>openFacet(btn.dataset.cvFacet,btn.dataset.cvType||kind));
      audit[id]={max,denominator:den,metric:counts?'count':'percentage',mode,tableRows};
    }
    function renderDivisionFacet(){
      const host=el('divisionFacetChart');if(!host)return;initHost(host);
      // Preserve one date window for both divisions; do not recompute the window per group.
      const base=C.baseSelectedRows({ignoreDivision:true}),b=C.periodBounds(base),rows=b?base.filter(r=>M.date(r.date)>=b.start&&M.date(r.date)<=b.end):[];
      if(empty(host,rows))return;
      const groups=['Elementary','Secondary'],rs=groups.map(d=>rows.filter(r=>r.division===d));
      const tableRows=[];let html='<p class="cv-scope">'+E(scope(rows,state.year,'All',b))+'</p><p class="cv-note">Both divisions use these same dates and observer filters. Filled = Elementary; outlined = Secondary. Counts are observation mentions, not ratings.</p><div class="cv-profile">';
      FACETS.forEach(f=>{html+='<section class="cv-profile-row"><div class="cv-profile-label"><span>'+E(f)+'</span></div><div class="cv-series">';groups.forEach((d,i)=>{const e=C.facetEvidence(rs[i],f,'commendation'),p=M.pct(e.observations,rs[i].length);html+='<div class="cv-profile-series"><span>'+d+'</span><span class="cv-bar-track" aria-hidden="true"><i class="'+(i?'cv-outline':'')+'" style="width:'+(p??0)+'%"></i></span><button type="button" class="cv-read-value" data-cv-division="'+d+'" data-cv-facet="'+E(f)+'">'+(p===null?'Not available':Math.round(p)+'%')+'<small>'+e.observations+' of '+rs[i].length+' observations</small></button></div>';tableRows.push([f,d,e.observations,rs[i].length,P(e.observations,rs[i].length)]);});html+='</div></section>';});
      html+='</div><p class="cv-note">Common scale: 0-100%. The selected division does not change series colour or position.</p>'+dataTable(['Facet','Division','Matching observations','All observations','Recorded prevalence'],tableRows,'Division comparison');host.innerHTML=html;host.querySelectorAll('[data-cv-division]').forEach(btn=>btn.onclick=()=>openFacet(btn.dataset.cvFacet,'commendation',{division:btn.dataset.cvDivision,start:M.iso(b.start),end:M.iso(b.end)}));
      if(el('divisionFacetDescription'))el('divisionFacetDescription').textContent='Commendation facets within a shared date range; each division has its own clearly labelled observation denominator.';audit.divisionFacetChart={max:100,rows:tableRows};
    }
    function heatCell(n,d,limited,extra=''){
      if(!d)return '<td class="cv-heat-empty">Not available</td>';
      const v=n/d*100,c=M.heat(v,limited);
      return '<td class="cv-heat-cell '+(limited?'cv-limited':'')+'" style="background:'+c.background+';color:'+c.color+'"><button type="button" '+extra+'>'+Math.round(v)+'%<small>'+n+' of '+d+'</small></button></td>';
    }
    const heatLegend=()=>'<p class="cv-note">One numerical colour scale: 0% (light) to 100% (dark). Darker means more recorded mentions, not better practice. Rows below 10 observations are unshaded and labelled limited evidence; this is a display caution, not a statistical confidence threshold.</p>';
    function renderPlcMatrix(plcs,baseRows){
      const host=el('plcMatrix');if(!host)return;
      const type=state.plcMatrixType,metric=state.plcMatrixMetric,denLabel=metric==='breadth'?'Full PLC roster':'PLC observations';
      let html='<p class="cv-scope">'+E(context(baseRows))+'</p><p class="cv-note">'+E(type==='wondering'?'Wondering':'Commendation')+' mentions. Cell denominators: '+denLabel+'. Cross-appointed members may appear in more than one PLC; do not add PLC totals.</p><div class="cv-table-scroll" tabindex="0" role="region" aria-label="PLC facet matrix"><table class="cv-heat"><caption>Facet mentions by PLC - '+denLabel+'</caption><thead><tr><th scope="col">PLC</th><th scope="col">Sampling</th>'+FACETS.map(f=>'<th scope="col">'+E(f)+'<small class="cv-lens-label">'+E(LENS[f])+'</small></th>').join('')+'</tr></thead><tbody>';
      for(const division of ['Elementary','Secondary']){const members=plcs.filter(p=>C.plcDivision(p)===division);if(!members.length)continue;html+='<tr class="cv-group"><th colspan="8" scope="rowgroup">'+division+'</th></tr>';for(const p of members){const rows=C.rowsForPlc(baseRows,p),roster=C.plcMembers(p),represented=new Set(rows.map(r=>C.canonicalPlcName(r.faculty)).filter(n=>roster.includes(n))).size,limited=rows.length<10;html+='<tr><th scope="row"><button type="button" data-cv-plc="'+E(p)+'">'+E(p)+'</button></th><td class="cv-sampling">'+rows.length+' observations<small>'+represented+' of '+roster.length+' roster members observed</small>'+(limited?'<b>Limited evidence</b>':'')+'</td>';for(const f of FACETS){const ev=C.plcFacetEvidence(p,rows,f,type);html+=rows.length?heatCell(metric==='breadth'?ev.faculty:ev.observations,metric==='breadth'?roster.length:rows.length,limited,'data-cv-cell-plc="'+E(p)+'" data-cv-facet="'+E(f)+'"'):'<td class="cv-heat-empty">No observations</td>';}html+='</tr>';}}
      host.innerHTML=html+'</tbody></table></div>'+heatLegend();host.querySelectorAll('[data-cv-plc]').forEach(btn=>btn.onclick=()=>C.setPlc(btn.dataset.cvPlc));host.querySelectorAll('[data-cv-cell-plc]').forEach(btn=>btn.onclick=()=>openFacet(btn.dataset.cvFacet,type,{plc:btn.dataset.cvCellPlc}));
    }
    function renderObserverCalibration(rows){
      const host=el('observerCalibration');if(!host)return;if(empty(host,rows))return;
      const groups=[['Principals',['Virginia Udall','Laura Earwood']],['Assistant Principals',['DJ MacPherson','Tania Mansfield','John Kennett','Andrew Hamilton']],['Coordinators',['Katriona Hoskins','Ralph Emmerink','Flavia Di Luccio','Samantha Rogers']]];
      const known=new Set(groups.flatMap(g=>g[1])),others=[...new Set(rows.map(r=>r.observer))].filter(n=>!known.has(n)).sort();if(others.length)groups.push(['Other observers',others]);
      let html='<p class="cv-scope">'+E(context(rows))+'</p><p class="cv-note">Patterns in what observers recorded, not observer rankings or inter-observer agreement. Denominator: observations by that observer. The individual Observer filter is intentionally ignored.</p><div class="cv-table-scroll" tabindex="0" role="region" aria-label="Observer facet matrix"><table class="cv-heat"><caption>Recorded commendation facets by observer</caption><thead><tr><th scope="col">Observer</th><th scope="col">Sample</th>'+FACETS.map(f=>'<th scope="col">'+E(f)+'</th>').join('')+'</tr></thead><tbody>';
      for(const [label,names] of groups){const present=names.filter(n=>rows.some(r=>r.observer===n));if(!present.length)continue;html+='<tr class="cv-group"><th scope="rowgroup" colspan="8">'+label+'</th></tr>';for(const name of present){const rr=rows.filter(r=>r.observer===name),limited=rr.length<10;html+='<tr><th scope="row"><button type="button" data-cv-observer="'+E(name)+'">'+E(name)+'</button></th><td class="cv-sampling">'+rr.length+' observations'+(limited?'<b>Limited evidence</b>':'')+'</td>'+FACETS.map(f=>heatCell(C.facetEvidence(rr,f,'commendation').observations,rr.length,limited,'data-cv-observer-facet="'+E(f)+'" data-cv-name="'+E(name)+'"')).join('')+'</tr>';}}
      host.innerHTML=html+'</tbody></table></div>'+heatLegend();host.querySelectorAll('[data-cv-observer]').forEach(btn=>btn.onclick=()=>C.setObserver(btn.dataset.cvObserver));host.querySelectorAll('[data-cv-observer-facet]').forEach(btn=>btn.onclick=()=>openFacet(btn.dataset.cvObserverFacet,'commendation',{observer:btn.dataset.cvName}));
    }
    function renderPlcFacetProfile(plc,rows){
      const host=el('plcTlfProfile');if(!host)return;if(empty(host,rows))return;
      const type=state.plcDetailType||'commendation',roster=C.plcMembers(plc),entries=FACETS.map(f=>{const e=C.plcFacetEvidence(plc,rows,f,type);return {label:f,value:e.frequency,n:e.observations,d:rows.length,color:C.lensColor(LENS[f]),faculty:e.faculty};});
      host.innerHTML='<p class="cv-note">'+E(type==='wondering'?'Wonderings':'Commendations')+' containing each facet. Bars use observations, not full PLC membership. Common scale: 0-100%.</p>'+bars(entries,{action:'facet'})+dataTable(['Facet','Matching observations','% of observations','PLC members with this facet','% of full PLC roster'],entries.map(r=>[r.label,r.n+' of '+r.d,P(r.n,r.d),r.faculty+' of '+roster.length,P(r.faculty,roster.length)]),'PLC facet counts: observation and full-roster denominators');
      host.querySelectorAll('[data-cv-index]').forEach(btn=>btn.onclick=()=>openFacet(entries[+btn.dataset.cvIndex].label,type,{plc}));
    }
    function movementTable(host,entries,periods,scopeNote){
      const thin=periods.current.length<15||periods.previous.length<15;
      host.innerHTML='<p class="cv-note">'+(thin?'Limited evidence: fewer than 15 observations in at least one period. Counts are shown descriptively; no trend is inferred. ':'')+E(scopeNote)+' Changes are in recorded mentions, not proven improvement. Percentage-point differences are not statistical significance tests.</p><div class="cv-table-scroll" tabindex="0" role="region" aria-label="Period comparison"><table class="cv-data-table"><caption>Previous and current recorded mentions</caption><thead><tr><th scope="col">Indicator</th><th scope="col">Previous</th><th scope="col">Current</th><th scope="col">Change</th></tr></thead><tbody>'+entries.map(r=>{const prev=M.pct(r.previous,periods.previous.length),cur=M.pct(r.current,periods.current.length),delta=prev===null||cur===null?null:cur-prev;return '<tr><th scope="row">'+E(r.label)+'</th><td>'+P(r.previous,periods.previous.length)+'<small>'+r.previous+' of '+periods.previous.length+'</small></td><td>'+P(r.current,periods.current.length)+'<small>'+r.current+' of '+periods.current.length+'</small></td><td>'+(delta===null?'Not available':(delta>0?'+':'')+Math.round(delta)+' percentage points')+'</td></tr>';}).join('')+'</tbody></table></div>';
    }
    function renderPlcMovement(rows){
      const host=el('plcMovement');if(!host)return;const p=C.plcComparablePeriods(rows);if(!p){host.innerHTML='<p class="cv-empty">Not enough dated records for two equal periods of at least 14 days. No trend is inferred.</p>';if(el('plcMovementNote'))el('plcMovementNote').textContent='Build comparable observation periods before interpreting movement.';return;}
      const end=M.extent(rows).end,cStart=M.add(end,1-p.days),pEnd=M.add(cStart,-1),pStart=M.add(pEnd,1-p.days),note='Previous: '+day(pStart)+' - '+day(pEnd)+' (n='+p.previous.length+'). Current: '+day(cStart)+' - '+day(end)+' (n='+p.current.length+').';
      if(el('plcMovementNote'))el('plcMovementNote').textContent=note;movementTable(host,Object.keys(LENS_FACETS).map(l=>({label:l,previous:C.lensEvidence(p.previous,l,'commendation').observations,current:C.lensEvidence(p.current,l,'commendation').observations})),p,'Equal '+p.days+'-day windows.');
    }
    function renderMtssProfile(id,rows,setName){
      const host=el(id);if(!host)return;if(empty(host,rows))return;
      const rules=C.mtssRuleSet(setName),type=state.mtssEvidenceType,entries=rules.map(r=>{const e=C.mtssSignalEvidence(rows,setName,r.id,type);return {label:r.label,value:e.frequency,n:e.observations,d:rows.length,faculty:e.faculty,rule:r};}),faculty=new Set(rows.map(r=>r.faculty)).size;
      host.innerHTML='<p class="cv-scope">'+E(context(rows))+'</p><p class="cv-note">Indicators found by keyword matching in '+E(type)+' comments. This is a share of observation records, not a share of students or a measure of impact. Inspect the narrative before interpreting the signal.</p>'+bars(entries,{action:'signal'})+dataTable(['Text indicator','Matching observations','% of observations','Observed faculty with a match','% of observed faculty'],entries.map(r=>[r.label,r.n+' of '+r.d,P(r.n,r.d),r.faculty+' of '+faculty,P(r.faculty,faculty)]),'Keyword-matched observation indicators')+'<details class="cv-data"><summary>How these indicators are identified</summary><p class="cv-note">A record can match several indicators. A phrase may describe an intention, an absence or a proposed practice; a match does not establish effectiveness.</p>'+rules.map(r=>'<p class="cv-note"><strong>'+E(r.label)+':</strong> '+E(r.terms.join(', '))+'</p>').join('')+'</details>';
      host.querySelectorAll('[data-cv-index]').forEach(btn=>{const r=entries[+btn.dataset.cvIndex];btn.onclick=()=>C.openMtssEvidence(setName,r.rule.id,type,r.label);});
    }
    function renderMtssPractices(rows){
      const host=el('mtssPractices');if(!host)return;if(empty(host,rows))return;
      if(el('mtssPracticesTitle'))el('mtssPracticesTitle').textContent='Practices mentioned in observation comments';
      if(el('mtssPracticesCopy'))el('mtssPracticesCopy').textContent='Keyword-matched '+state.mtssEvidenceType+' text, not a verified implementation measure. Bars use a common 0-100% scale.';
      const entries=C.mtssRuleSet('practices').map(rule=>{const e=C.mtssSignalEvidence(rows,'practices',rule.id,state.mtssEvidenceType);return {label:rule.label,value:e.frequency,n:e.observations,d:rows.length,rule};}).sort((a,b)=>b.n-a.n||a.label.localeCompare(b.label));
      host.innerHTML=bars(entries.slice(0,7),{action:'practice'})+dataTable(['Practice indicator','Matching observations','All observations','Recorded prevalence'],entries.map(r=>[r.label,r.n,r.d,P(r.n,r.d)]),'All practice indicators; chart shows seven most-mentioned');host.querySelectorAll('[data-cv-index]').forEach(btn=>{const r=entries[+btn.dataset.cvIndex];btn.onclick=()=>C.openMtssEvidence('practices',r.rule.id,state.mtssEvidenceType,r.label);});
    }
    function renderMtssFeedback(rows){
      const host=el('mtssFeedbackAction');if(!host)return;if(empty(host,rows))return;
      // The existing feedback matcher reads the full narrative for every record.
      // Keep that source definition and say so; never claim a longitudinal sequence.
      const entries=C.mtssRuleSet('feedback').map(rule=>{const ev=C.mtssSignalEvidence(rows,'feedback',rule.id,'all');return {label:rule.label,value:ev.frequency,n:ev.observations,d:rows.length,rule};});
      host.innerHTML='<p class="cv-scope">'+E(context(rows))+'</p><p class="cv-note">Four independent keyword indicators in the full observation narrative (notes, feedback and recorded response). One record may match several indicators. These are not successive stages, a funnel or evidence that the same feedback was followed through. The feedback-type toggle does not change this all-narrative view.</p>'+bars(entries,{action:'feedback'})+dataTable(['Independent indicator','Matched records','All observations','Recorded prevalence'],entries.map(r=>[r.label,r.n,r.d,P(r.n,r.d)]),'Independent feedback text indicators');host.querySelectorAll('[data-cv-index]').forEach(btn=>{const r=entries[+btn.dataset.cvIndex];btn.onclick=()=>C.openMtssEvidence('feedback',r.rule.id,'all',r.label);});
    }
    function renderMtssMovement(){
      const host=el('mtssMovement');if(!host)return;const base=C.baseSelectedRows(),b=C.periodBounds(base);if(!b){empty(host,[]);return;}
      let end=b.end,days=state.period==='30'||state.period==='60'?30:28;
      if(state.period==='custom'){const span=Math.floor((+b.end-+b.start)/M.DAY)+1;days=Math.floor(span/2);}
      if(days<1){host.innerHTML='<p class="cv-empty">Choose at least two days to form equal comparison periods.</p>';return;}
      const currentStart=M.add(end,1-days),previousEnd=M.add(currentStart,-1),previousStart=M.add(previousEnd,1-days),p={current:base.filter(r=>M.date(r.date)>=currentStart&&M.date(r.date)<=end),previous:base.filter(r=>M.date(r.date)>=previousStart&&M.date(r.date)<=previousEnd)};
      const setName=state.mtssMovementView==='conditions'?'conditions':'student',type=state.mtssEvidenceType;
      const note='Previous: '+day(previousStart)+' - '+day(previousEnd)+' (n='+p.previous.length+'). Current: '+day(currentStart)+' - '+day(end)+' (n='+p.current.length+'). '+(state.period==='30'?'The previous comparison period precedes the active 30-day window.':'');
      if(el('mtssMovementNote'))el('mtssMovementNote').textContent=note;
      movementTable(host,C.mtssRuleSet(setName).map(r=>({label:r.label,previous:C.mtssSignalEvidence(p.previous,setName,r.id,type).observations,current:C.mtssSignalEvidence(p.current,setName,r.id,type).observations})),p,'Equal '+days+'-day windows of keyword-matched '+type+' text.');
    }
    function renderTimeChart(rows){
      const host=el('timeChart');if(!host)return;if(empty(host,rows))return;let html='<p class="cv-scope">'+E(context(rows))+'</p>',trs=[];
      for(const d of state.division==='All'?['Elementary','Secondary']:[state.division]){const rr=rows.filter(r=>r.division===d);if(!rr.length){html+='<p>'+E(d)+': no observations in this view.</p>';continue;}
        const labels=['Beginning','Middle','End','Not recorded'],counts=labels.map(l=>rr.filter(r=>(['Beginning','Middle','End'].includes(r.timeOfClass)?r.timeOfClass:'Not recorded')===l).length);
        html+='<section class="cv-sampling-row"><h4>'+d+' - '+rr.length+' observations</h4><div class="cv-stack" role="img" aria-label="'+E(labels.map((l,i)=>l+': '+counts[i]+' of '+rr.length).join('; '))+'">'+counts.map((n,i)=>n?'<span class="cv-segment cv-neutral-'+i+'" style="width:'+100*n/rr.length+'%" aria-hidden="true">'+(n/rr.length>.13?Math.round(100*n/rr.length)+'%':'')+'</span>':'').join('')+'</div><div class="cv-stack-labels">'+labels.map((l,i)=>'<span><i class="cv-neutral-'+i+'"></i>'+l+': <strong>'+counts[i]+' / '+rr.length+' ('+P(counts[i],rr.length)+')</strong></span>').join('')+'</div></section>';labels.forEach((l,i)=>trs.push([d,l,counts[i],rr.length,P(counts[i],rr.length)]));
      }
      host.innerHTML=html+'<p class="cv-note">Sampling context only. Equal thirds are not a target; select observation times appropriate to the practice being investigated.</p>'+dataTable(['Division','Lesson position','Observations','All observations','Share'],trs,'Lesson-position sampling');
    }
    function renderCoverageChart(rows){
      const host=el('coverageChart');if(!host)return;initHost(host);if(status()==='error'){empty(host,[]);return;}
      const counts=new Map();rows.forEach(r=>{const k=C.facultyKey(r.faculty,r.schoolYear);if(k)counts.set(k,(counts.get(k)||0)+1);});
      const roster=C.rosterForView(),names=roster?roster.map(r=>r.name):[...counts.keys()],buckets=roster?['0','1','2','3','4+']:['1','2','3','4+'],groups=buckets.map(b=>names.filter(n=>b==='4+'?(counts.get(n)||0)>=4:(counts.get(n)||0)===Number(b)));
      host.innerHTML='<p class="cv-scope">'+E(context(rows))+'</p><p class="cv-note">Denominator: '+names.length+' '+(roster?'members of the working roster (not an authoritative HR roster).':'observed teachers only; zero-visit coverage cannot be established without a roster.')+' More visits do not imply better practice.</p>'+bars(buckets.map((b,i)=>({label:b+' observations',value:groups[i].length,n:groups[i].length,d:names.length})),{max:Math.max(1,names.length),unit:'',denominatorLabel:'faculty',action:'bucket'})+'<div class="cv-coverage-members" aria-live="polite"></div>'+dataTable(['Observation-count bucket','Faculty','Roster denominator','Share'],buckets.map((b,i)=>[b,groups[i].length,names.length,P(groups[i].length,names.length)]),'Observation distribution');
      host.querySelectorAll('[data-cv-index]').forEach(btn=>btn.onclick=()=>{const people=groups[+btn.dataset.cvIndex];host.querySelector('.cv-coverage-members').innerHTML=people.length?'<h4>'+E(btn.textContent)+'</h4>'+people.map(n=>'<button type="button" class="growth-person" data-cv-person="'+E(n)+'">'+E(n)+'</button>').join(''):'<p>No faculty in this bucket.</p>';host.querySelectorAll('[data-cv-person]').forEach(b=>b.onclick=()=>C.openPerson(b.dataset.cvPerson));});
    }
    function renderObserverChart(rows){
      const entries=[...new Set(rows.map(r=>r.observer||'Not recorded'))].sort().map(n=>[n,rows.filter(r=>(r.observer||'Not recorded')===n).length]);
      makeChart('observerChart','bar',{labels:entries.map(r=>r[0]),datasets:[{label:'Recorded observations',data:entries.map(r=>r[1]),backgroundColor:'#113261'}]},{indexAxis:'y',cv:{title:'Observer contribution and workload',description:'Alphabetical order; counts describe recording activity and workload, not observer quality.',onSelect:i=>C.setObserver(entries[i][0])}});
    }
    return {makeChart,weeklyBuckets,renderMonthly,renderTlfTrends,renderTlfProfileInto,renderDivisionFacet,renderPlcMatrix,renderObserverCalibration,renderPlcFacetProfile,renderPlcMovement,renderMtssProfile,renderMtssPractices,renderMtssFeedback,renderMtssMovement,renderTimeChart,renderCoverageChart,renderObserverChart};
  }
  window.AISG_CHARTS={install,dataTable,bars,scope};
})();
