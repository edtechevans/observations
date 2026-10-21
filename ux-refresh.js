/* AISG Growth & Reflection • inquiry-first user experience
   This layer keeps the original observation analysis and URL state intact.
   Groups existing pages; offers contextual filters, faculty search and
   a clearly differentiated intentions-versus-observation-evidence lens. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const byId=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleCase=v=>String(v||'').replace(/\b\w/g,c=>c.toUpperCase());
  const fmt=n=>Number(n||0).toLocaleString('en-US');
  const names=['Personalization','Agency','Authenticity','Creativity','Collaboration','Taking Action'];
  const categories=[
    {id:'overview',label:'Overview',tabs:[['overview','Overview']]},
    {id:'growth',label:'Growth Focus',tabs:[['growth','Growth Focus']]},
    {id:'classroom',label:'Classroom Observations',tabs:[['facets','TLF Patterns'],['mtss','MTSS in Practice'],['coverage','Reach & Evidence']]},
    {id:'faculty',label:'Faculty & PLCs',tabs:[['facultyview','Faculty Overview'],['plcs','PLCs']]},
    {id:'explore',label:'Explore Evidence',tabs:[['explorer','Evidence Explorer']]},
    {id:'admin',label:'Admin',tabs:[['admin','Admin']]}
  ];
  const idToGroup=Object.fromEntries(categories.flatMap(g=>g.tabs.map(([id])=>[id,g.id])));
  const lastPage={classroom:'facets',faculty:'facultyview'};
  let refreshQueued=false,selectedFacet='',filterOpen=false,legacyInitialized=false,mainObserver=null;
  const obs=()=>window.AISG_GROWTH_BRIDGE||null;
  const goals=()=>window.AISG_GROWTH_PEOPLE_BRIDGE||null;
  const state=()=>obs()?.getState?.()||{};
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const currentTab=()=>$('.leadership-tabs .tab.active')?.dataset.tab||'overview';
  const groupOf=id=>idToGroup[id]||'overview';
  function navigate(page){
    const button=$('.leadership-tabs .tab[data-tab="'+page+'"]');
    if(button)button.click();
    else obs()?.goTo?.(page);
    renderNavigation();
    queue();
  }
  function goCategory(id){
    const cfg=categories.find(x=>x.id===id);
    if(!cfg)return;
    navigate(lastPage[id]||cfg.tabs[0][0]);
  }

  function buildNav(){
    const shell=$('.leadership-filter-shell'),main=byId('main');
    if(!shell||!main)return;
    const nav=document.createElement('nav');
    nav.id='uxPrimaryNav';nav.className='ux-primary-nav';nav.setAttribute('aria-label','Primary dashboard navigation');
    nav.innerHTML='<div class="ux-primary-links">'+
      categories.filter(c=>c.id!=='admin').map(c=>
        '<button type="button" class="ux-nav-button" data-ux-category="'+c.id+'">'+esc(c.label)+'</button>'
      ).join('')+
      '</div><div class="ux-nav-tools">'+
      '<form id="uxFacultySearch" role="search" class="ux-nav-search">'+
      '<label class="ux-visually-hidden" for="uxFacultyName">Find faculty member</label>'+
      '<span class="ux-search-symbol" aria-hidden="true">⌕</span>'+
      '<input id="uxFacultyName" name="faculty" type="search" list="uxFacultyNames" placeholder="Find faculty…" autocomplete="off" aria-label="Find faculty member" />'+
      '<datalist id="uxFacultyNames"></datalist></form>'+
      '<button type="button" class="ux-nav-button ux-nav-icon" data-ux-category="admin" title="Admin and calibration" aria-label="Admin and calibration">⚙</button>'+
      '</div>';
    const sub=document.createElement('nav');
    sub.id='uxSubnav';sub.className='ux-subnav';sub.hidden=true;sub.setAttribute('aria-label','Analysis section navigation');
    const context=document.createElement('section');
    context.id='uxContextBar';context.className='ux-context-bar';context.setAttribute('aria-label','Analysis scope and filters');
    context.innerHTML='<div class="ux-context-group"><span class="ux-context-title">Faculty growth goals</span>'+
      '<span id="uxContextYear" class="ux-evidence-scope"></span>'+
      '<div class="ux-division-choices" role="group" aria-label="Choose division">'+
      [['All','Whole school'],['Elementary','Elementary'],['Secondary','Secondary']].map(([value,label])=>
        '<button type="button" class="ux-division-choice" data-ux-division="'+value+'" aria-pressed="false">'+label+'</button>'
      ).join('')+'</div></div>'+
      '<div class="ux-context-group"><span class="ux-context-title">Observation evidence</span>'+
      '<span id="uxEvidenceScope" class="ux-evidence-scope"></span><button type="button" id="uxEditFilters" class="ux-edit-filters" aria-expanded="false" aria-controls="uxOriginalFilters">Edit filters ↓</button></div>'+
      '<div class="ux-filter-scope-note" id="uxScopeNote"></div>';
    main.insertBefore(nav,shell);main.insertBefore(sub,shell);main.insertBefore(context,shell);
    shell.id='uxOriginalFilters';
    shell.classList.add('ux-filters-closed');
    nav.addEventListener('click',e=>{
      const btn=e.target.closest('[data-ux-category]');
      if(btn)goCategory(btn.dataset.uxCategory);
    });
    sub.addEventListener('click',e=>{
      const btn=e.target.closest('[data-ux-page]');
      if(btn)navigate(btn.dataset.uxPage);
    });
    context.addEventListener('click',e=>{
      const btn=e.target.closest('[data-ux-division]');
      if(btn){const target=$('#divisionFilter button[data-value="'+btn.dataset.uxDivision+'"]');target?.click();}
      const edit=e.target.closest('#uxEditFilters');
      if(edit)toggleFilters(!filterOpen);
    });
    byId('uxFacultySearch').addEventListener('submit',e=>{e.preventDefault();openSearchPerson();});
    byId('uxFacultyName').addEventListener('change',()=>{
      // Native datalist selection is exact and therefore unambiguous.
      const input=byId('uxFacultyName');
      if(personOptions().some(x=>norm(x.name)===norm(input.value)))openSearchPerson();
    });
    nav.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.id==='uxFacultyName')e.target.blur();});
    mainObserver=new MutationObserver(()=>{
      // The original app uses several paths to switch views, including
      // observation drill-through. Reflect those without rewriting them.
      queue();
    });
    const oldNav=$('.leadership-tabs');
    if(oldNav) mainObserver.observe(oldNav,{subtree:true,attributes:true,attributeFilter:['class']});
    if(byId('growthViewMount')){
      mainObserver.observe(byId('growthViewMount'),{subtree:true,childList:true});
    }
    if(byId('growthNotice'))mainObserver.observe(byId('growthNotice'),{subtree:true,childList:true,characterData:true});
  }
  function toggleFilters(open){
    filterOpen=!!open;
    const shell=byId('uxOriginalFilters'),button=byId('uxEditFilters');
    shell?.classList.toggle('ux-filters-closed',!filterOpen);
    if(button){button.setAttribute('aria-expanded',String(filterOpen));button.textContent=filterOpen?'Close filters ↑':'Edit filters ↓';}
    if(filterOpen)shell?.scrollIntoView({block:'nearest',behavior:'smooth'});
    window.AISG_NAV?.schedule('replace');
  }
  function renderNavigation(){
    const tab=currentTab(),grp=groupOf(tab);
    if(lastPage[grp]!==undefined)lastPage[grp]=tab;
    $$('#uxPrimaryNav [data-ux-category]').forEach(button=>{
      const yes=button.dataset.uxCategory===grp;
      if(button.getAttribute('aria-current')!==(yes?'page':null)){
        if(yes)button.setAttribute('aria-current','page');
        else button.removeAttribute('aria-current');
      }
    });
    const sub=byId('uxSubnav'),category=categories.find(x=>x.id===grp);
    if(!sub)return;
    const show=category?.tabs.length>1;
    sub.hidden=!show;
    if(show&&sub.dataset.category!==grp){
      sub.innerHTML='<span class="ux-subnav-label">'+esc(category.label)+'</span>'+
        category.tabs.map(([id,label])=>'<button type="button" class="ux-sub-button" data-ux-page="'+esc(id)+'">'+esc(label)+'</button>').join('');
      sub.dataset.category=grp;
    }
    $$('#uxSubnav [data-ux-page]').forEach(btn=>{
      if(btn.dataset.uxPage===tab)btn.setAttribute('aria-current','page');
      else btn.removeAttribute('aria-current');
    });
  }
  function context(){
    const s=state(),selectedYear=s.year||'2026-27',division=s.division||'All';
    const year=byId('uxContextYear'),evidence=byId('uxEvidenceScope'),note=byId('uxScopeNote');
    if(year)year.textContent=selectedYear;
    $$('.ux-division-choice').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.uxDivision===division)));
    const period={schoolyear:'School year',30:'Last 30 days',60:'Last 60 days',semester:'Semester',custom:'Custom dates'}[s.period||'schoolyear']||'School year';
    const observers=s.observer&&s.observer!=='All'?s.observer:s.observerScope==='principals'?'Principals + APs':'All observers';
    const detail=[period,observers];
    if(s.time&&s.time!=='All')detail.push('Time: '+s.time);
    if(s.faculty)detail.push('Faculty: '+s.faculty);
    if(evidence)evidence.textContent=detail.join(' · ');
    if(note){
      const message=(selectedYear==='2026-27'
        ?'Goals = year-long faculty choices (division filter). Observation evidence = selected period, observer group and classroom filters.'
        :'Growth goals are recorded for 2026–27 only; the selected historical year displays classroom observation evidence.');
      if(note.textContent!==message)note.textContent=message;
    }
  }
  function personOptions(){
    const map=new Map();
    for(const g of goals()?.getAllGoals?.()||[])map.set(g.email.toLowerCase(),{email:g.email.toLowerCase(),name:g.faculty,goal:true});
    for(const r of obs()?.getRows?.()||[]){
      if(r.schoolYear!=='2026-27')continue;
      const email=String(r.email||'').trim().toLowerCase();
      if(!email||map.has(email))continue;
      map.set(email,{email,name:r.faculty,goal:false});
    }
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
  }
  function updatePersonList(){
    const names=personOptions(),list=byId('uxFacultyNames');
    if(!list)return;
    const sig=names.map(x=>x.email).join('|');
    if(list.dataset.signature===sig)return;
    list.dataset.signature=sig;
    list.innerHTML=names.map(p=>'<option value="'+esc(p.name)+'"></option>').join('');
  }
  function openSearchPerson(){
    const q=norm(byId('uxFacultyName')?.value);
    if(!q)return;
    const entries=personOptions();
    const exact=entries.filter(p=>norm(p.name)===q || norm(p.email)===q);
    const possible=exact.length?exact:entries.filter(p=>norm(p.name).includes(q));
    const selected=possible.length===1?possible[0]:null;
    if(!selected){
      const input=byId('uxFacultyName');input.setCustomValidity(possible.length?'Choose a full name from the suggestions.':'No faculty found.');input.reportValidity();
      input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});
      return;
    }
    const input=byId('uxFacultyName');input.setCustomValidity('');
    if(goals()?.openRecord){
      goals().openRecord(selected.email);
      return;
    }
    const person=entries.find(p=>p.email===selected.email);
    if(person){
      navigate('facultyview');
      const search=byId('facultyViewSearch');
      if(search){search.value=person.name;search.dispatchEvent(new Event('input',{bubbles:true}));}
    }
  }
  function dateNum(date){const t=Date.parse(String(date||'')+'T00:00:00Z');return Number.isFinite(t)?t:0;}
  function filteredEvidence(){return obs()?.getSelectedRows?.()||[];}
  function yearGoals(){
    if((state().year||'2026-27')!=='2026-27')return [];
    return goals()?.getGoals?.()||[];
  }
  function chosenFocus(){
    if(state().year&&state().year!=='2026-27')return ['Agency',0];
    const scoped=yearGoals();
    let counts={};
    scoped.forEach(g=>{if(names.includes(g.facet))counts[g.facet]=(counts[g.facet]||0)+1;});
    if(!scoped.length){
      const fall=goals()?.getSummary?.()?.facetCounts||{};
      counts=Object.fromEntries(names.map(n=>[n,fall[n]||0]));
    }
    return names.map(n=>[n,counts[n]||0]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]||['Agency',0];
  }
  function facetSignals(rows,facet){
    const commend=rows.filter(r=>(r.commendations||[]).includes(facet));
    const wonder=rows.filter(r=>r.wonderingFacet===facet);
    return {commend:commend.length,wonder:wonder.length,unique:new Set([...commend,...wonder].map(r=>r.id)).size};
  }
  function setText(id,v){const item=byId(id);if(item&&item.textContent!==String(v))item.textContent=String(v);}
  function createOverview(){
    const panel=byId('overview');
    if(!panel||legacyInitialized)return;
    legacyInitialized=true;
    const legacy=document.createElement('div');legacy.className='ux-analysis-body';
    [...panel.childNodes].forEach(node=>legacy.append(node));
    const hero=document.createElement('section');
    hero.className='ux-overview';hero.id='uxOverview';hero.setAttribute('aria-labelledby','uxOverviewTitle');
    hero.innerHTML='<div class="ux-overview-heading"><div>'+
      '<div class="ux-overview-kicker">AISG · Growth & Reflection</div>'+
      '<h2 id="uxOverviewTitle">What are we learning about our practice?</h2>'+
      '<p>Choose a starting question, examine the evidence, and use what you find to guide professional conversations and instructional decisions.</p>'+
      '</div></div>'+
      '<div class="ux-inquiry-grid">'+
      '<article class="ux-inquiry-card"><span class="ux-card-eyebrow">01 · Intention</span><h3>What are faculty choosing to develop?</h3>'+
      '<div class="ux-card-metric"><span id="uxGoalCount">—</span><small> faculty goals</small></div>'+
      '<p class="ux-card-description" id="uxGoalDescription">Loading year-long professional growth intentions.</p>'+
      '<button type="button" class="ux-card-cta" data-ux-task="goals">Explore goals and facets →</button></article>'+
      '<article class="ux-inquiry-card"><span class="ux-card-eyebrow">02 · Evidence</span><h3>What are we noticing in classrooms?</h3>'+
      '<div class="ux-card-metric"><span id="uxObservationCount">—</span><small> observations</small></div>'+
      '<p class="ux-card-description" id="uxEvidenceDescription">Loading current classroom observation evidence.</p>'+
      '<button type="button" class="ux-card-cta" data-ux-task="classroom">Explore classroom patterns →</button></article>'+
      '<article class="ux-inquiry-card"><span class="ux-card-eyebrow">03 · Inquiry</span><h3>Where might intentions and evidence connect?</h3>'+
      '<div class="ux-card-metric"><span id="uxConnectionCount">—</span><small> faculty chose the focus</small></div>'+
      '<p class="ux-card-description" id="uxConnectionDescription">Comparing growth choices with independent observation evidence.</p>'+
      '<button type="button" class="ux-card-cta" data-ux-task="compare">Compare intentions & evidence →</button></article>'+
      '</div>'+
      '<div class="ux-overview-foot"><span aria-hidden="true">ⓘ</span><span>Growth choices are intentions, not ratings. Classroom visits are snapshots of practice. Their relationship prompts inquiry; it is not a measure of goal attainment.</span></div>';
    const details=document.createElement('details');
    details.id='uxFullAnalysis';details.className='ux-full-analysis';
    details.innerHTML='<summary>View detailed observation analysis <span class="ux-visually-hidden">and existing charts</span></summary>';
    details.append(legacy);
    panel.prepend(hero);panel.append(details);
    details.addEventListener('toggle',()=>{
      if(details.open){
        // Hidden canvases/charts may have been measured while collapsed.
        // Trigger the original app's documented resize/rerender path.
        requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
      }
    });
    hero.addEventListener('click',e=>{
      const btn=e.target.closest('[data-ux-task]');
      if(!btn)return;
      if(btn.dataset.uxTask==='goals')navigate('growth');
      if(btn.dataset.uxTask==='classroom')navigate('facets');
      if(btn.dataset.uxTask==='compare'){navigate('growth');openCompare(true);}
    });
  }
  function renderOverview(){
    if(window.AISG_REFLECTION)return window.AISG_REFLECTION.renderOverview();
    const rows=filteredEvidence(),s=state(),faculties=new Set(rows.map(r=>String(r.email||r.faculty).toLowerCase()));
    const scope=yearGoals(),fall=(s.year||'2026-27')==='2026-27' ? goals()?.getSummary?.() : null;
    const goalCount=scope.length||fall?.includedFaculty||0,top=chosenFocus(),signals=facetSignals(rows,top[0]);
    setText('uxGoalCount',goalCount||'0');setText('uxObservationCount',fmt(rows.length));
    const goalDesc=(s.year&&s.year!=='2026-27')
      ?'Goals were collected for 2026–27. Switch the school year to explore those intentions.'
      :top[1] ? fmt(top[1])+' faculty selected '+top[0]+'. These are year-long priorities, not observation scores.'
      :'No matching faculty goals for this scope yet.';
    const evidenceDesc=fmt(faculties.size)+' faculty represented in the currently selected observation period and observer scope.';
    const connectDesc=top[1]
      ?fmt(top[1])+' chose '+top[0]+'; '+fmt(signals.unique)+' observations mention that facet ('+fmt(signals.commend)+' commendations, '+fmt(signals.wonder)+' wonderings).'
      :'Select 2026–27 to compare selected goals with classroom observations.';
    setText('uxGoalDescription',goalDesc);
    setText('uxEvidenceDescription',evidenceDesc);
    setText('uxConnectionCount',top[1]||'0');
    setText('uxConnectionDescription',connectDesc);
  }
  function ensureCompare(){
    const host=byId('growthViewMount');if(!host)return null;
    const chart=host.querySelector('.growth-chart-split');
    if(!chart)return null;
    let compare=byId('uxFacetCompare');
    if(compare&&!host.contains(compare))compare=null;
    if(!compare){
      compare=document.createElement('section');
      compare.className='ux-facet-compare';compare.id='uxFacetCompare';
      compare.setAttribute('aria-label','Compare faculty intentions and classroom evidence');
      compare.innerHTML='<div class="ux-compare-head"><h4>From intention to classroom evidence</h4>'+
        '<label for="uxCompareFacet">TLF facet <select id="uxCompareFacet">'+
        names.map(n=>'<option value="'+esc(n)+'">'+esc(n)+'</option>').join('')+'</select></label></div>'+
        '<div class="ux-pair-grid">'+
        '<article class="ux-pair"><span class="ux-card-eyebrow">Faculty-selected focus · 2026–27</span>'+
        '<strong id="uxCompareIntent">—</strong><p id="uxCompareIntentDesc"></p>'+
        '<button type="button" data-ux-compare="faculty">See faculty and goals →</button></article>'+
        '<article class="ux-pair"><span class="ux-card-eyebrow">Classroom observation evidence</span>'+
        '<strong id="uxCompareEvidence">—</strong><p id="uxCompareEvidenceDesc"></p>'+
        '<button type="button" data-ux-compare="evidence">Open tagged observations →</button></article></div>'+
        '<p class="ux-pair-explain">These counts answer different questions. Growth goals remain year-long choices; observation evidence responds to division, observer, time and period filters. Neither count measures progress or performance.</p>';
      chart.insertAdjacentElement('afterend',compare);
      compare.addEventListener('change',e=>{
        if(e.target.id==='uxCompareFacet'){selectedFacet=e.target.value;renderCompare();}
      });
      compare.addEventListener('click',e=>{
        const btn=e.target.closest('[data-ux-compare]');
        if(!btn)return;
        if(btn.dataset.uxCompare==='faculty')goFacetFaculty();
        if(btn.dataset.uxCompare==='evidence')goFacetEvidence();
      });
    }
    return compare;
  }
  function openCompare(focus=false){
    navigate('growth');
    if(!byId('uxFacetCompare')){
      const facetButton=$('#growthViewNav button[data-growth-pane="facets"]');
      facetButton?.click();
    }
    const compare=ensureCompare();
    if(!compare)return;
    const best=chosenFocus();
    if(!selectedFacet)selectedFacet=best[0];
    renderCompare();
    compare.scrollIntoView({block:'center',behavior:focus?'smooth':'instant'});
    if(focus)byId('uxCompareFacet')?.focus({preventScroll:true});
  }
  function renderCompare(){
    if(window.AISG_REFLECTION){ensureCompare();window.AISG_REFLECTION.renderCompare(selectedFacet||chosenFocus()[0]);return;}
    const compare=ensureCompare();if(!compare)return;
    const best=chosenFocus();
    if(!names.includes(selectedFacet))selectedFacet=best[0];
    const picker=byId('uxCompareFacet');if(picker&&picker.value!==selectedFacet)picker.value=selectedFacet;
    const goalRows=yearGoals(),total=goalRows.filter(g=>g.facet===selectedFacet).length,
       fallback=(state().year&&state().year!=='2026-27')?0:(goals()?.getSummary?.()?.facetCounts?.[selectedFacet]||0),intentions=goalRows.length?total:fallback;
    const signals=facetSignals(filteredEvidence(),selectedFacet);
    setText('uxCompareIntent',fmt(intentions)+' faculty');
    setText('uxCompareIntentDesc','Chose '+selectedFacet+' as the focus of their 2026–27 professional growth goal.');
    setText('uxCompareEvidence',fmt(signals.unique)+' visits');
    setText('uxCompareEvidenceDesc',fmt(signals.commend)+' commendations and '+fmt(signals.wonder)+' wonderings mention '+selectedFacet+' in the selected evidence scope.');
  }
  function goFacetFaculty(){
    if(window.AISG_REFLECTION)return window.AISG_REFLECTION.openFacultyList(selectedFacet);
    navigate('growth');
    $('#growthViewNav button[data-growth-pane="goals"]')?.click();
    const filter=byId('growthFacetFilter');
    if(filter){filter.value=selectedFacet;filter.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function goFacetEvidence(){
    if(window.AISG_REFLECTION)return window.AISG_REFLECTION.openTagged(selectedFacet);
    navigate('explorer');
    const filter=byId('explorerFacetQuick');
    if(filter){filter.value=selectedFacet;filter.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function renderEverything(){
    refreshQueued=false;
    renderNavigation();context();updatePersonList();renderOverview();
    window.AISG_REFLECTION?.renderContext();
    const pane=byId('growthViewMount');
    if(pane?.querySelector('.growth-chart-split')){ensureCompare();renderCompare();}
  }
  function queue(){
    if(refreshQueued)return;refreshQueued=true;
    requestAnimationFrame(renderEverything);
  }
  function captureFaculty(e){
    const target=e.target.closest('[data-growth-hover]');
    if(!target||target.closest('#growthRecordDialog')||target.closest('#growthGroupHoverCard'))return;
    const email=target.dataset.growthHover;
    if(!email || !personOptions().some(g=>g.email===email))return;
    if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    goals().openRecord(email);
  }
  window.AISG_UX={navigate,refresh:()=>queue(),getView:()=>({selectedFacet,filterOpen,analysisOpen:!!byId('uxFullAnalysis')?.open}),setView:view=>{if(names.includes(view?.selectedFacet))selectedFacet=view.selectedFacet;filterOpen=!!view?.filterOpen;byId('uxOriginalFilters')?.classList.toggle('ux-filters-closed',!filterOpen);if(byId('uxFullAnalysis'))byId('uxFullAnalysis').open=!!view?.analysisOpen;queue();}};
  function boot(){
    if(!byId('main')||!$('.leadership-tabs')||byId('uxPrimaryNav'))return;
    buildNav();createOverview();
    // Route every faculty name to a single consistent growth/evidence drawer;
    // preserve its explicit "Open Evidence Explorer" action.
    document.addEventListener('click',captureFaculty,true);
    document.addEventListener('keydown',captureFaculty,true);
    window.addEventListener('aisg:dashboardRendered',queue);
    window.addEventListener('resize',queue,{passive:true});
    const year=byId('yearFilter');if(year)year.addEventListener('change',queue);
    const scope=byId('uxContextBar');if(scope)scope.addEventListener('click',queue);
    queue();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
