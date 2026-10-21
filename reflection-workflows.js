/* AISG: same-teacher inquiry, recorded reflection timelines and resumable views.
   No observation/goal text is changed or written back by this module. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), core=()=>window.AISG_GROWTH_BRIDGE,
    growth=()=>window.AISG_GROWTH_PEOPLE_BRIDGE, ux=()=>window.AISG_UX;
  const FACETS=['Personalization','Agency','Authenticity','Creativity','Collaboration','Taking Action'];
  const TABS=['overview','growth','facets','mtss','plcs','facultyview','coverage','explorer','admin'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const email=v=>String(v||'').trim().toLowerCase(), state=()=>core()?.getState?.()||{}, all=()=>core()?.getRows?.()||[],
    goalState=()=>growth()?.getLoadState?.()||{state:'loading'}, obsState=()=>core()?.getStatus?.()||{state:'loading'};
  const live={facet:'',scope:'focus',record:'',timeline:'all',open:[],originRecord:''};
  let restoring=false,started=false,queued=false,last=null,depth=0,pending=null,recordParent=null,initialUrl=location.href;
  const nativeReplace=history.replaceState.bind(history),nativePush=history.pushState.bind(history);
  const clone=x=>JSON.parse(JSON.stringify(x));
  function text(id,value){const n=$(id);if(n&&n.textContent!==String(value))n.textContent=String(value);}
  function date(value){if(!value)return 'Not available';const d=value instanceof Date?value:new Date(String(value).slice(0,10)+'T00:00:00Z');return isNaN(d)?'Not available':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});}
  function year(){return state().year||'2026-27';}
  function goals(){return year()==='2026-27'?(growth()?.getGoals?.()||[]):[];}
  function evidence(){return core()?.getSelectedRows?.()||[];}
  function matches(r,f){return (r.commendations||[]).includes(f)||r.wonderingFacet===f;}
  function validFacet(f){return FACETS.includes(f)?f:FACETS[0];}
  function topFacet(){const counts=new Map(FACETS.map(f=>[f,0]));goals().forEach(g=>counts.set(g.facet,(counts.get(g.facet)||0)+1));return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||'Agency';}
  function comparison(f=live.facet,scope=live.scope){
    const chosen=goals().filter(g=>g.facet===f),ids=new Set(chosen.map(g=>email(g.email))),rows=evidence();
    const cohort=rows.filter(r=>ids.has(email(r.email))),view=scope==='focus'?cohort:rows;
    const tagged=view.filter(r=>matches(r,f)),withObs=new Set(cohort.map(r=>email(r.email))),withFacet=new Set(cohort.filter(r=>matches(r,f)).map(r=>email(r.email)));
    return {chosen,rows:view,tagged,commendations:view.filter(r=>(r.commendations||[]).includes(f)).length,wonderings:view.filter(r=>r.wonderingFacet===f).length,
      withFacet:chosen.filter(g=>withFacet.has(email(g.email))),withoutFacet:chosen.filter(g=>withObs.has(email(g.email))&&!withFacet.has(email(g.email))),withoutVisits:chosen.filter(g=>!withObs.has(email(g.email)))};
  }
  function range(){
    if(obsState().state!=='ready')return obsState().state==='error'?'Observation data unavailable':'Loading observation dates';
    const b=core()?.getPeriodBounds?.(),s=state();
    if(s.period==='custom'&&s.customStart&&s.customEnd&&s.customStart>s.customEnd)return 'Invalid date range: From must not be after To';
    const label=s.period==='30'?'Latest 30 days of available evidence':s.period==='60'?'Latest 60 days of available evidence':s.period==='semester'?'Semester of latest available observation':s.period==='custom'?'Selected observation dates':'Available school-year evidence';
    if(!b){if(s.period==='custom'&&s.customStart&&s.customEnd)return label+': '+date(s.customStart)+' - '+date(s.customEnd)+' (no observations)';return 'No observations in this evidence view';}
    return label+': '+date(b.start)+' - '+date(b.end);
  }
  function mountContext(){
    const bar=$('uxContextBar');if(!bar)return;
    if(!$('rfFreshness')){
      const box=document.createElement('div');box.id='rfFreshness';box.className='rf-freshness';box.setAttribute('aria-label','Source dates');bar.append(box);
      const button=document.createElement('button');button.id='rfCopyView';button.className='ux-edit-filters';button.textContent='Copy this view';button.type='button';button.onclick=copyView;bar.append(button);
      const status=document.createElement('span');status.id='rfCopyStatus';status.className='rf-status';status.setAttribute('role','status');bar.append(status);
    }
  }
  function renderContext(){
    mountContext();
    const latest=all().map(r=>r.date).filter(Boolean).sort().at(-1),gs=goalState();
    text('rfFreshness','Latest observation: '+(obsState().state==='ready'?date(latest):obsState().state==='error'?'Data unavailable':'Loading')+' | Goals imported: '+(gs.state==='ready'?date(gs.asOf):gs.state==='error'?'Data unavailable':'Loading'));
    const s=state(),observer=s.observer&&s.observer!=='All'?s.observer:s.observerScope==='principals'?'Principals + APs':'All observers';
    text('uxEvidenceScope',range()+' | '+observer+(s.time&&s.time!=='All'?' | Lesson: '+s.time:'')+(s.faculty?' | Faculty: '+s.faculty:''));
    // Import and last observation dates are different facts, not a single "updated" date.
    if(obsState().state==='ready')text('dataFreshness','Latest observation: '+date(latest));
    const explorer=$('explorer');
    if(explorer){let n=$('rfCohortBanner');if(!n){n=document.createElement('div');n.id='rfCohortBanner';n.className='rf-note';explorer.prepend(n);}
      const cohort=s.explorerCohortFacet||'';n.hidden=!cohort;
      if(cohort&&n.dataset.value!==cohort){n.dataset.value=cohort;n.innerHTML='<strong>Same-teacher view:</strong> only observations of faculty who chose '+esc(cohort)+'. <button type="button" id="rfClearCohort">Show all faculty instead</button>';n.querySelector('button').onclick=()=>{core().getState().explorerCohortFacet='';core().refresh();};}
    }
  }
  function renderCompare(facet){
    const host=$('uxFacetCompare');if(!host)return;
    if(!live.facet)live.facet=validFacet(facet||topFacet());
    // The original UX picker remains compatible with the new saved-view state.
    if(!host.dataset.reflection){
      host.dataset.reflection='1';host.innerHTML='<div class="ux-compare-head"><h4>Intentions and classroom observations</h4><label for="uxCompareFacet">TLF facet <select id="uxCompareFacet">'+FACETS.map(f=>'<option>'+f+'</option>').join('')+'</select></label></div>'+
        '<fieldset class="rf-cohort"><legend>Whose observations are being compared?</legend><label><input type="radio" name="rfScope" value="focus"> Faculty who selected this facet</label><label><input type="radio" name="rfScope" value="all"> All faculty in this view</label></fieldset>'+
        '<div class="ux-pair-grid"><article class="ux-pair"><span class="ux-card-eyebrow">Faculty-selected intention</span><strong id="rfIntentCount"></strong><p id="rfIntentNote"></p><button type="button" id="rfViewFaculty">See faculty and goals</button></article><article class="ux-pair"><span class="ux-card-eyebrow">Recorded classroom observations</span><strong id="rfVisitCount"></strong><p id="rfVisitNote"></p><button type="button" id="rfViewVisits">Open matching observations</button></article></div>'+
        '<section aria-labelledby="rfCoverageTitle"><h4 id="rfCoverageTitle">Evidence coverage for teachers who chose this facet</h4><div class="rf-coverage"><button type="button" data-rf-list="withFacet"><strong id="rfWithFacet"></strong>Chosen facet recorded</button><button type="button" data-rf-list="withoutFacet"><strong id="rfWithoutFacet"></strong>Observed; chosen facet not recorded</button><button type="button" data-rf-list="withoutVisits"><strong id="rfWithoutVisits"></strong>No observations in this evidence view</button></div><div id="rfCoverageMembers" aria-live="polite"></div></section>'+
        '<p class="ux-pair-explain" id="rfCompareGuardrail"></p>';
      host.addEventListener('change',e=>{e.stopImmediatePropagation();if(e.target.id==='uxCompareFacet'){live.facet=e.target.value;ux()?.setView({...ux().getView(),selectedFacet:live.facet});}if(e.target.name==='rfScope')live.scope=e.target.value;renderCompare();schedule();},true);
      host.querySelector('#rfViewFaculty').onclick=()=>openFacultyList();host.querySelector('#rfViewVisits').onclick=()=>openTagged();
      host.addEventListener('click',e=>{const b=e.target.closest('[data-rf-list]');if(b){const c=comparison();$('rfCoverageMembers').innerHTML=c[b.dataset.rfList].length?c[b.dataset.rfList].map(g=>'<button type="button" class="growth-person" data-growth-open="'+esc(g.email)+'">'+esc(g.faculty)+'</button>').join(''):'<p>No faculty in this category.</p>';}});
    }
    const picker=$('uxCompareFacet');if(picker.value!==live.facet)picker.value=live.facet;
    host.querySelectorAll('[name="rfScope"]').forEach(n=>n.checked=n.value===live.scope);
    const c=comparison(),ok=goalState().state==='ready'&&obsState().state==='ready';
    text('rfIntentCount',goalState().state==='ready'?c.chosen.length+' faculty':goalState().state==='error'?'Data unavailable':'Loading');
    text('rfVisitCount',ok?c.tagged.length+' observations':'Data unavailable');
    text('rfIntentNote',year()==='2026-27'?'Chose '+live.facet+' in their year-long professional growth goal.':'No goal available for the selected school year.');
    text('rfVisitNote',ok?(c.commendations+' visits with a commendation and '+c.wonderings+' with a wondering about '+live.facet+'. '+(live.scope==='focus'?'Only the '+c.chosen.length+' teachers who chose this facet are included.':'All faculty in the current observation view are included; these are not necessarily the teachers who chose this facet.')):'Source records must load before results can be shown.');
    for(const [id,key] of [['rfWithFacet','withFacet'],['rfWithoutFacet','withoutFacet'],['rfWithoutVisits','withoutVisits']])text(id,ok?c[key].length:'-');
    const signature=[live.facet,live.scope,year(),state().division,state().period,state().observer,state().time,state().faculty].join('|');
    if(host.dataset.signature!==signature){host.dataset.signature=signature;$('rfCoverageMembers').textContent='';}
    text('rfCompareGuardrail','Observation period: '+range()+'. Coverage categories use the current period, observer and classroom filters. No recorded facet is not evidence of no progress. Counts describe coverage, not performance or goal attainment.');
    $('rfViewVisits').disabled=!ok;$('rfViewFaculty').disabled=goalState().state!=='ready';
  }
  function renderOverview(){
    const g=goalState(),o=obsState(),scopeGoals=goals(),rows=evidence(),focus=topFacet(),same=comparison(focus,'focus');
    text('uxGoalCount',g.state==='ready'?scopeGoals.length:g.state==='error'?'Unavailable':'Loading');
    text('uxObservationCount',o.state==='ready'?rows.length:o.state==='error'?'Unavailable':'Loading');
    text('uxConnectionCount',g.state==='ready'?same.chosen.length:'-');
    text('uxGoalDescription',g.state==='error'?'Goal data unavailable. Results cannot be shown.':g.state!=='ready'?'Loading imported faculty goals.':year()!=='2026-27'?'No goal available for this school year. Current imported goals are for 2026-27.':same.chosen.length+' faculty chose '+focus+'. These are year-long intentions, not ratings.');
    text('uxEvidenceDescription',o.state==='error'?'Observation data unavailable. Results cannot be shown.':o.state!=='ready'?'Loading observations.':rows.length?new Set(rows.map(r=>email(r.email))).size+' faculty represented. '+range()+'.':'No observations in this period and evidence scope.');
    text('uxConnectionDescription',g.state==='ready'&&o.state==='ready'?same.withFacet.length+' of the '+same.chosen.length+' teachers who chose '+focus+' have that facet recorded in this observation view. Inspect their feedback and recorded responses.':'Both sources must be available for a same-teacher comparison.');
  }
  function openTagged(){
    live.originRecord=live.record;closeRecordSilently();core()?.openTagged?.(live.facet,live.scope==='focus');schedule();
  }
  function openFacultyList(){ux()?.navigate('growth');growth()?.setView({pane:'goals',facet:live.facet,domain:'All',query:''});schedule();}
  function missingPreview(anchor){
    const r=all().find(r=>email(r.email)===email(anchor?.dataset.growthHover));if(!r)return;
    const tip=$('growthHoverCard');if(!tip)return;tip.innerHTML='<strong>'+esc(r.faculty)+'</strong><p>No goal available in the current import.</p><small>Click to read the observation and response timeline.</small>';tip.hidden=false;
    const b=anchor.getBoundingClientRect();tip.style.left=Math.max(12,Math.min(b.left,innerWidth-492))+'px';tip.style.top=Math.max(12,Math.min(b.bottom+8,innerHeight-tip.offsetHeight-12))+'px';
  }
  function openRecord(value){
    const id=email(value);if(!all().some(r=>email(r.email)===id)&&!growth()?.getAllGoals?.().some(g=>email(g.email)===id))return;
    if(!live.record&&!restoring)recordParent=depth;
    live.record=id;live.timeline='all';live.open=[];core()?.closeObservation?.();renderRecord();schedule();
  }
  function closeRecordSilently(){live.record='';const d=$('growthRecordDialog');if(d?.open)d.close();}
  function recordData(){
    const goal=year()==='2026-27'?(growth()?.getAllGoals?.()||[]).find(g=>email(g.email)===live.record):null;
    const rows=all().filter(r=>email(r.email)===live.record&&r.schoolYear===year()).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
    const name=goal?.faculty||rows[0]?.faculty||all().find(r=>email(r.email)===live.record)?.faculty||live.record;
    return {goal,rows,name};
  }
  function block(title,body,cls=''){return '<section class="rf-timeline-block '+cls+'"><h5>'+esc(title)+'</h5><p>'+esc(body)+'</p></section>';}
  function renderRecord(){
    if(!live.record)return;
    const d=$('growthRecordDialog'),host=$('growthRecordContent');if(!d||!host)return;
    const {goal,rows,name}=recordData(),subset=live.timeline==='focus'?(goal?rows.filter(r=>matches(r,goal.facet)):[]):rows;
    text('growthRecordName',name);
    const empty=goalState().state==='error'?'Goal data unavailable. Results cannot be shown.':goalState().state!=='ready'?'Loading goal record.':year()!=='2026-27'?'No goal available for this school year.':'No goal available in the current import.';
    const goalHtml=goal?'<div class="growth-meta"><span>'+esc(goal.facet)+'</span><span>'+esc(goal.domain)+'</span></div><h3>Current imported professional goal</h3><p class="growth-goal-text">'+esc(goal.goal)+'</p>':'<div class="rf-note" role="status">'+esc(empty)+'</div>';
    host.innerHTML='<p class="rf-timeline-scope">Full '+esc(year())+' timeline. This record does not inherit the dashboard\'s observer or period filters.</p>'+goalHtml+
      '<h3>Observations and teacher reflections</h3><div class="rf-timeline-controls" role="group" aria-label="Timeline observations"><button type="button" data-rf-timeline="all" aria-pressed="'+(live.timeline==='all')+'">All observations ('+rows.length+')</button><button type="button" data-rf-timeline="focus" aria-pressed="'+(live.timeline==='focus')+'" '+(!goal?'disabled':'')+'>Linked to chosen facet ('+(goal?rows.filter(r=>matches(r,goal.facet)).length:0)+')</button></div>'+
      (goal?'<p class="rf-timeline-scope">Facet links use the current imported goal, not a judgement of goal attainment. The source does not give the date this goal was originally set.</p>':'')+
      '<div class="rf-timeline">'+(subset.length?subset.map((r,i)=>{
        const shouldOpen=live.open.includes(String(r.id))||(!live.open.length&&i===subset.length-1);
        const stars=(r.commendationText||[]).map((t,j)=>t?block('Commendation'+((r.commendations||[])[j]?' - '+r.commendations[j]:''),t):'').join('');
        return '<details class="rf-timeline-visit" data-rf-observation="'+esc(r.id)+'" '+(shouldOpen?'open':'')+'><summary><time datetime="'+esc(r.date)+'">'+esc(date(r.date))+'</time><span>'+esc(r.observer||'Observer not recorded')+'</span><small>'+(r.response?'Teacher response recorded':'No teacher response in source')+'</small></summary><div class="rf-visit-body">'+
          (r.notes?block('Observation notes',r.notes):'')+stars+(r.wonderingText?block('Wondering'+(r.wonderingFacet?' - '+r.wonderingFacet:''),r.wonderingText,'rf-wondering'):'')+
          block('Teacher response / reflection',r.response||'No teacher response recorded in the source.','rf-response')+
          '<button type="button" class="ux-edit-filters" data-rf-open-observation="'+esc(r.id)+'">Open complete observation</button></div></details>';
      }).join(''):'<div class="rf-note" role="status">'+(obsState().state==='error'?'Observation data unavailable. Results cannot be shown.':live.timeline==='focus'?'Chosen facet not recorded in this evidence. Other observations may still be relevant.':'No observations in this school year.')+'</div>')+'</div>'+
      '<p class="rf-timeline-scope">Goal import: '+esc(date(goalState().asOf))+'. Responses are shown exactly as recorded; a missing response does not imply a lack of reflection.</p>';
    host.querySelectorAll('[data-rf-timeline]').forEach(b=>b.onclick=()=>{live.timeline=b.dataset.rfTimeline;live.open=[];renderRecord();schedule();});
    host.querySelectorAll('[data-rf-open-observation]').forEach(b=>b.onclick=()=>{live.originRecord=live.record;closeRecordSilently();core().openObservation(b.dataset.rfOpenObservation);addObservationBack();schedule();});
    host.querySelectorAll('[data-rf-observation]').forEach(n=>n.addEventListener('toggle',()=>{live.open=[...host.querySelectorAll('[data-rf-observation][open]')].map(x=>x.dataset.rfObservation);schedule('replace');}));
    const tip=$('growthHoverCard');if(tip)tip.hidden=true;
    if(!d.open)d.showModal();
  }
  function addObservationBack(){
    const host=$('drawerContent');if(!host||!window.AISG_OPEN_OBSERVATION||!live.originRecord||host.querySelector('#rfReturnRecord'))return;
    const b=document.createElement('button');b.id='rfReturnRecord';b.type='button';b.className='ux-edit-filters';b.textContent='Back to growth record';b.onclick=()=>{if(depth>0)history.back();else openRecord(live.originRecord);};host.prepend(b);
  }
  // A single history controller owns navigation; original serializers call schedule.
  const BASE={year:'year',division:'division',scope:'observerScope',observer:'observer',period:'period',from:'customStart',to:'customEnd',time:'time',faculty:'faculty',facet:'explorerFacet',evidence:'explorerEvidenceType',plc:'plc',eplc:'explorerPlc',search:'explorerSearch',cohortFacet:'explorerCohortFacet'};
  function snapshot(){return {tab:document.querySelector('.leadership-tabs .tab.active')?.dataset.tab||'overview',core:core()?.getSnapshot?.()||{},growth:growth()?.getView?.()||{},ux:ux()?.getView?.()||{},reflection:clone(live),observation:window.AISG_OPEN_OBSERVATION||''};}
  function serialize(v){
    const q=new URLSearchParams();q.set('tab',v.tab);q.set('year',v.core.year||'2026-27');
    for(const [param,key] of Object.entries(BASE)){const val=v.core[key];if(val&&val!=='All'&&val!=='all'&&val!=='schoolyear'&&param!=='year')q.set(param,val);}
    if(v.core.explorerOnePerFaculty)q.set('one','1');
    if(v.reflection.facet)q.set('cf',v.reflection.facet);q.set('cohort',v.reflection.scope);
    if(v.growth.pane&&v.growth.pane!=='facets')q.set('gp',v.growth.pane);
    if(v.growth.facet&&v.growth.facet!=='All')q.set('gf',v.growth.facet);
    if(v.growth.domain&&v.growth.domain!=='All')q.set('gd',v.growth.domain);
    if(v.growth.query)q.set('gq',v.growth.query);
    if(v.reflection.record)q.set('person',v.reflection.record);
    if(v.reflection.timeline==='focus')q.set('timeline','focus');
    if(v.observation)q.set('observation',v.observation);
    if(v.reflection.originRecord)q.set('origin',v.reflection.originRecord);
    if(v.reflection.open.length)q.set('opened',v.reflection.open.join(','));
    if(v.ux.filterOpen)q.set('filters','1');if(v.ux.analysisOpen)q.set('analysis','1');
    const extra={};for(const [k,val] of Object.entries(v.core))if(!Object.values(BASE).includes(k)&&k!=='explorerOnePerFaculty'&&val!==''&&val!==false&&val!=null&&val!=='All')extra[k]=val;
    if(Object.keys(extra).length)q.set('ui',JSON.stringify(extra));
    return location.pathname+'?'+q.toString();
  }
  function parse(url){
    const q=new URL(url).searchParams,v=snapshot(),defaults={year:'2026-27',division:'All',observerScope:'all',observer:'All',period:'schoolyear',customStart:'',customEnd:'',time:'All',faculty:'',explorerFacet:'',explorerCohortFacet:'',explorerEvidenceType:'all',explorerSearch:'',explorerPlc:'',plc:'All',explorerMtss:null,explorerOnePerFaculty:false,facultyViewSearch:'',facultyViewPlc:'All',facultyViewVisits:'all',facultyViewSort:'name',explorerPage:1};
    Object.assign(v.core,defaults);
    for(const [param,key] of Object.entries(BASE))if(q.has(param))v.core[key]=q.get(param);
    v.core.explorerOnePerFaculty=q.get('one')==='1';
    try{const extra=JSON.parse(q.get('ui')||'{}');for(const k of Object.keys(v.core))if(k in extra&&['string','boolean','number','object'].includes(typeof extra[k]))v.core[k]=extra[k];}catch(_){}
    v.tab=TABS.includes(q.get('tab'))?q.get('tab'):'overview';v.growth={pane:['facets','domains','goals'].includes(q.get('gp'))?q.get('gp'):'facets',facet:q.get('gf')||'All',domain:q.get('gd')||'All',query:q.get('gq')||''};
    v.ux={selectedFacet:FACETS.includes(q.get('cf'))?q.get('cf'):'',filterOpen:q.get('filters')==='1',analysisOpen:q.get('analysis')==='1'};
    v.reflection={facet:v.ux.selectedFacet,scope:q.get('cohort')==='all'?'all':'focus',record:email(q.get('person')),timeline:q.get('timeline')==='focus'?'focus':'all',open:(q.get('opened')||'').split(',').filter(Boolean),originRecord:email(q.get('origin'))};v.observation=q.get('observation')||'';return v;
  }
  function position(){const a=document.activeElement;return {x:scrollX,y:scrollY,drawer:$('growthRecordContent')?.scrollTop||0,observation:$('drawerContent')?.scrollTop||0,focus:a?.id||'',name:a?.dataset?.growthHover||''};}
  function historyState(v,pos=position()){return {aisgReflection:1,depth,view:clone(v),position:pos};}
  function schedule(mode='push'){
    if(restoring)return;pending=mode==='replace'&&pending!=='push'?'replace':'push';
    if(queued)return;queued=true;requestAnimationFrame(commit);
  }
  function commit(){
    queued=false;if(restoring)return;
    if(!started){start();return;}
    const next=snapshot(),url=serialize(next),sig=JSON.stringify(next),oldSig=JSON.stringify(last?.view);
    if(sig===oldSig){pending=null;return;}
    const mode=pending||'push';pending=null;
    if(last&&mode!=='replace'){nativeReplace(last,'',serialize(last.view));depth++;nativePush(historyState(next),'',url);}
    else nativeReplace(historyState(next),'',url);
    last=history.state;
  }
  function restore(v,pos){
    restoring=true;pending=null;closeRecordSilently();core()?.closeObservation?.();Object.assign(live,v.reflection);
    core()?.restore?.(v.core,v.tab);growth()?.setView?.(v.growth);ux()?.setView?.(v.ux);
    if(live.record)renderRecord();if(v.observation){core()?.openObservation?.(v.observation);addObservationBack();}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      renderContext();renderCompare();
      if(pos){scrollTo(pos.x||0,pos.y||0);if($('growthRecordContent'))$('growthRecordContent').scrollTop=pos.drawer||0;if($('drawerContent'))$('drawerContent').scrollTop=pos.observation||0;
        const focus=pos.focus?$(pos.focus):pos.name?document.querySelector('[data-growth-hover="'+CSS.escape(pos.name)+'"]'):null;focus?.focus({preventScroll:true});}
      restoring=false;last=history.state;
    }));
  }
  function start(){
    if(started||restoring||obsState().state==='loading'||goalState().state==='loading')return;
    started=true;history.scrollRestoration='manual';const v=parse(initialUrl);depth=0;
    nativeReplace(historyState(v),'',serialize(v));last=history.state;restore(v,last.position);
  }
  async function copyView(){
    if(!started){text('rfCopyStatus','Wait for the source data to finish loading.');return;}
    if(queued)commit();const value=new URL(serialize(snapshot()),location.origin).href;
    try{if(!navigator.clipboard)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);text('rfCopyStatus','View link copied.');}
    catch(_){let d=$('rfCopyDialog');if(!d){d=document.createElement('dialog');d.id='rfCopyDialog';d.className='rf-copy-dialog';d.innerHTML='<form method="dialog"><h3>Copy this view</h3><p>Clipboard access is unavailable. Copy the selected link below.</p><label for="rfCopyUrl">View link</label><textarea id="rfCopyUrl" readonly></textarea><button>Close</button></form>';document.body.append(d);}d.showModal();$('rfCopyUrl').value=value;$('rfCopyUrl').select();text('rfCopyStatus','Copy the link from the dialog.');}
  }
  function boot(){
    if(!core()||!growth())return;
    mountContext();
    for(const event of ['aisg:dashboardRendered','aisg:goalsReady','aisg:growthRendered'])window.addEventListener(event,()=>{renderContext();renderOverview();if(live.record&&restoring===false&&event==='aisg:goalsReady')renderRecord();start();});
    document.addEventListener('pointerdown',()=>{if(started&&!restoring&&last){last={...last,position:position()};nativeReplace(last,'',serialize(last.view));}},true);
    document.addEventListener('change',e=>{if(e.target.closest('#main'))schedule();});
    let typing;document.addEventListener('input',e=>{if(e.target.closest('#main')){clearTimeout(typing);typing=setTimeout(()=>schedule('replace'),400);}});
    document.addEventListener('toggle',e=>{if(e.target.id==='uxFullAnalysis')schedule();},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){const tip=$('growthHoverCard');if(tip&&!tip.hidden){tip.hidden=true;e.stopPropagation();}}},true);
    $('growthRecordDialog')?.addEventListener('close',()=>{
      if(restoring||!live.record)return;live.record='';live.open=[];
      if(recordParent!==null&&depth>recordParent){const steps=depth-recordParent;recordParent=null;history.go(-steps);}else schedule('replace');
    });
    window.addEventListener('popstate',e=>{if(!e.state?.aisgReflection)return;depth=e.state.depth;last=e.state;restore(e.state.view,e.state.position);});
    window.addEventListener('pagehide',()=>{if(started&&!restoring)nativeReplace(historyState(snapshot()),'',serialize(snapshot()));});
    // Persist outgoing scroll without creating a new history entry.
    let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(started&&!restoring&&last){last={...last,position:position()};nativeReplace(last,'',serialize(last.view));}},120);},{passive:true});
    start();
  }
  window.AISG_NAV={schedule,copyView,getSnapshot:snapshot};
  window.AISG_REFLECTION={comparison,renderCompare,renderOverview,renderContext,openRecord,missingPreview,openTagged,openFacultyList,getView:()=>clone(live),range};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
