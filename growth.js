/* AISG Growth & Reflection: schoolwide goal aggregates and session-only leader goal review.
 * No individual goal text is fetched from or published to GitHub Pages.
 * Faculty self-service requires a separate authenticated backend before rollout.
 */
(() => {
  'use strict';
  const YEAR = '2026-27';
  const FACETS = ['Personalization', 'Agency', 'Authenticity', 'Creativity', 'Collaboration', 'Taking Action'];
  const LENS_OF = {Personalization:'Being',Agency:'Being',Authenticity:'Connecting',Creativity:'Connecting',Collaboration:'Doing','Taking Action':'Doing'};
  const DOMAIN_NAMES = {'1':'Purposeful & Inclusive Learning Design','2':'Inclusive Learning Culture & Environment','3':'Transformative, Culturally Responsive Learning in Action','4':'Collaborative Planning, Reflection & Professional Impact','other':'Other / not specified'};
  const RESTRICTED_LEADERS = new Set(['ckydd@aisgz.org','srogers@aisgz.org','tevans@aisgz.org','kjohnson@aisgz.org','jkennett@aisgz.org','remmerink@aisgz.org']);
  const LEADER_DOMAIN = /(?:^|\s)(instructional leadership|strategic & organizational leadership|personal, ethical & reflective leadership)\b/i;
  const SOURCE_NAME = 'Faculty goals selected 20 Oct 2026';
  const publicFallback = {schoolYear:YEAR,asOf:'2026-10-20',includedFaculty:54,observationRosterCount:109,facetCounts:{Personalization:8,Agency:25,Authenticity:5,Creativity:5,Collaboration:7,'Taking Action':4,Other:0,'Pending selection':0},lensCounts:{Being:33,Connecting:10,Doing:11},domainCounts:{'1':14,'2':7,'3':14,'4':18,other:1}};
  const local = {rows:null,summary:null,pane:'facets',query:'',facet:'All',domain:'All',status:'',error:false};
  const byId = id => document.getElementById(id);
  const esc = input => String(input == null ? '' : input).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nfmt = number => Number(number||0).toLocaleString('en-US');
  const roleBridge = () => window.AISG_GROWTH_BRIDGE || null;
  const counts = (rows,key) => rows.reduce((a,row) => {const k=key(row);a[k]=(a[k]||0)+1;return a;},{});
  const domainKey = domain => {const m=String(domain||'').match(/^\s*([1-4])\s*[a-e]?\s*\./);return m?m[1]:'other';};
  const rowsYtd = () => (roleBridge()?.getRows()||[]).filter(r=>r.schoolYear===YEAR && String(r.email||'').includes('@'));
  const facultyMap = () => {
    const m=new Map();
    rowsYtd().forEach(r=>{const email=String(r.email||'').trim().toLowerCase();if(!email)return;if(!m.has(email))m.set(email,[]);m.get(email).push(r);});
    return m;
  };
  const division = () => roleBridge()?.getState()?.division || 'All';
  function activeGoals(){
    if(!local.rows)return null;
    const selectedDivision=division();
    if(selectedDivision==='All')return local.rows;
    const obs=facultyMap();
    return local.rows.filter(goal=>(obs.get(goal.email)||[]).some(r=>r.division===selectedDivision));
  }
  function summaryFor(rows){
    const facetCounts=counts(rows,r=>r.facet),domainCounts=counts(rows,r=>domainKey(r.domain));
    return {schoolYear:YEAR,includedFaculty:rows.length,observationRosterCount:new Set(rowsYtd().map(r=>r.email.toLowerCase().trim())).size,
      facetCounts,domainCounts,
      lensCounts:{Being:(facetCounts.Agency||0)+(facetCounts.Personalization||0),Connecting:(facetCounts.Authenticity||0)+(facetCounts.Creativity||0),Doing:(facetCounts.Collaboration||0)+(facetCounts['Taking Action']||0)}};
  }
  const summary = () => local.rows ? summaryFor(activeGoals()) : (local.summary || publicFallback);
  const tag = (facet) => '<span class="growth-facet-pill is-'+esc((LENS_OF[facet]||'other').toLowerCase())+'">'+esc(facet||'Not selected')+'</span>';
  const openSession = () => byId('growthGoalsInput')?.click();

  function renderWelcome(){
    const s=summary(),total=s.includedFaculty||0,being=s.lensCounts?.Being||0,agency=s.facetCounts?.Agency||0;
    const host=byId('growthTopline');if(!host)return;
    host.innerHTML=[
      [nfmt(total),'Faculty growth goals','Matched to current-year observation records'],
      [nfmt(being),'Being lens','Personalization and Agency selected'],
      [nfmt(agency),'Agency','Most frequently selected TLF facet']
    ].map(([num,label,sub])=>'<article class="growth-overview-tile"><strong class="num">'+esc(num)+'</strong><span class="lbl">'+esc(label)+'</span><span class="sub">'+esc(sub)+'</span></article>').join('');
    const filterNotice=byId('growthOverviewScope');
    if(filterNotice)filterNotice.textContent=local.rows ? (division()==='All'?'Schoolwide':'Filtered to '+division())+' · Private goal records loaded for this browser session' : 'Schoolwide summary · 20 October 2026 · Faculty with current-year observations only';
  }
  function renderStats(){
    const s=summary(), f=s.facetCounts||{},lens=s.lensCounts||{};
    const values=[
      [s.includedFaculty||0,'Faculty goals matched',local.rows?(division()==='All'?'Whole school':'Selected division'):'Schoolwide'],
      [(lens.Being||0),'Being lens',nfmt(Math.round(((lens.Being||0)/Math.max(1,s.includedFaculty))*100))+'% of selected goals'],
      [(f.Agency||0),'Agency focus','Most commonly selected facet'],
      [publicFallback.observationRosterCount,'Faculty with observations','2026–27 source roster']
    ];
    byId('growthSummaryStats').innerHTML=values.map(([num,label,sub])=>'<div class="growth-stat"><strong>'+nfmt(num)+'</strong><span>'+esc(label)+'</span><small>'+esc(sub)+'</small></div>').join('');
    const notice=byId('growthNotice'),clear=byId('growthClearBtn');
    if(clear)clear.hidden=!local.rows;
    if(!notice)return;
    if(local.rows){notice.className='growth-note is-private';notice.innerHTML='<strong>Private leader review.</strong> '+nfmt(local.rows.length)+' verified, observed faculty goal records are available in this browser session only. No names or goal text have been published to GitHub. '+esc(local.status)+' Individual faculty access is not enabled on this public site.';}
    else if(local.error){notice.className='growth-note is-warning';notice.innerHTML='<strong>Goal file not loaded.</strong> '+esc(local.status)+' Schoolwide summary figures remain available.';}
    else {notice.className='growth-note';notice.innerHTML='<strong>Schoolwide growth intentions.</strong> These summaries include '+nfmt(publicFallback.includedFaculty)+' observed faculty with goals, excluding leaders and staff without 2026–27 observations. To explore individual goals, authorized leaders can load the filtered CSV for this session. This public website does not provide secure faculty-specific access.';}
  }
  function barRows(entries,max){
    return entries.map(([name,value])=>{
      const lens=LENS_OF[name]||'other';const width=max?Math.max(0,Math.min(100,100*value/max)):0;
      return '<div class="growth-bar-row"><span class="growth-bar-name">'+esc(name)+'</span><div class="growth-track" role="img" aria-label="'+esc(name)+': '+nfmt(value)+' faculty"><div class="growth-bar-fill is-'+esc(lens.toLowerCase())+'" style="width:'+width.toFixed(1)+'%"></div></div><span class="growth-bar-val">'+nfmt(value)+'</span></div>';
    }).join('');
  }
  function evidenceFor(goal){
    const mine=facultyMap().get(goal.email)||[];
    const comm=mine.filter(r=>(r.commendations||[]).includes(goal.facet));
    const wondering=mine.filter(r=>r.wonderingFacet===goal.facet);
    return {rows:mine,commendations:comm,wonderings:wondering};
  }
  function renderFacets(){
    const s=summary(),facetCounts=s.facetCounts||{},lens=s.lensCounts||{};
    const sorted=FACETS.map(f=>[f,facetCounts[f]||0]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    const biggest=Math.max(1,...sorted.map(x=>x[1]));
    const scope=local.rows?(division()==='All'?'whole-school':'selected-division'):'schoolwide published';
    let html='<h3>What are faculty choosing to develop?</h3><p class="growth-pane-lead">Faculty-selected TLF facets across '+esc(scope)+' growth goals. These describe professional intentions, not observed performance.</p>';
    html+='<div class="growth-chart-split"><div class="growth-bar-list">'+barRows(sorted,biggest)+'</div><aside>';
    for(const l of ['Being','Connecting','Doing'])html+='<div class="growth-lens is-'+l.toLowerCase()+'"><span class="growth-lens-title">'+l+' lens</span><strong>'+nfmt(lens[l]||0)+'</strong><small>'+({Being:'Personalization · Agency',Connecting:'Authenticity · Creativity',Doing:'Collaboration · Taking Action'}[l])+'</small></div>';
    html+='</aside></div>';
    const top=sorted[0];
    html+='<div class="growth-inquiry"><strong>Leadership inquiry</strong><p>'+esc(top[0])+' is the most frequently chosen facet ('+nfmt(top[1])+' faculty). How are the observation conversations connecting to this intentional area of growth?</p></div>';
    if(local.rows){
      const rows=activeGoals().filter(g=>FACETS.includes(g.facet));
      const sameComm=rows.filter(g=>evidenceFor(g).commendations.length).length,sameWonder=rows.filter(g=>evidenceFor(g).wonderings.length).length;
      html+='<div class="growth-competencies"><h4>Goal-focus signals in classroom observations</h4><div class="growth-evidence-grid"><div class="growth-evidence-kpi"><strong>'+nfmt(rows.length)+'</strong><span>Faculty with selected facets</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(sameComm)+'</strong><span>Focus facet in at least one commendation</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(sameWonder)+'</strong><span>Focus facet in at least one wondering</span></div></div><p class="growth-footnote">A matched facet is a sign that it appeared in observation feedback, not proof of goal attainment. Counts refer to unique faculty, using all 2026–27 observations.</p></div>';
    }else html+='<p class="growth-footnote">Individual goal–observation connections are only calculated after an authorized leader privately loads the filtered goal CSV.</p>';
    return html;
  }
  function renderDomains(){
    const s=summary(), domainCounts=s.domainCounts||{},max=Math.max(1,...Object.values(domainCounts).map(Number));
    let html='<h3>Which areas of professional practice are the focus?</h3><p class="growth-pane-lead">Four Teacher Growth & Reflection domains, based on recorded selections. A separate category preserves entries without a mapped teacher domain.</p><div class="growth-domain-list">';
    for(const key of ['1','2','3','4','other']){
      const count=domainCounts[key]||0;if(key==='other'&&!count)continue;
      html+='<div class="growth-domain-item"><span class="growth-domain-n">'+(key==='other'?'–':key)+'</span><div><div class="growth-domain-t">'+esc(DOMAIN_NAMES[key])+'</div><div class="growth-domain-sub">'+nfmt(count)+' faculty selected this domain</div></div><div class="growth-track"><div class="growth-bar-fill" style="width:'+(100*count/max).toFixed(1)+'%"></div></div><span class="growth-bar-val">'+nfmt(count)+'</span></div>';
    }
    html+='</div>';
    if(local.rows){
      const c=counts(activeGoals(),g=>g.domain);let sorted=Object.entries(c).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
      html+='<section class="growth-competencies"><h4>Chosen competencies within these domains</h4><div class="growth-competency-grid">';
      html+=sorted.map(([name,count])=>'<div class="growth-competency"><strong>'+esc(name)+'</strong><span>'+nfmt(count)+' faculty</span></div>').join('');
      html+='</div></section>';
    }else html+='<p class="growth-footnote">Load the private, filtered goal CSV to explore specific competencies and connect them to individual faculty evidence.</p>';
    html+='<div class="growth-inquiry"><strong>Leadership inquiry</strong><p>How might faculty-selected domain priorities inform professional learning opportunities, PLC conversations and the evidence we gather through observation?</p></div>';
    return html;
  }
  function goalRows(){
    let rows=activeGoals()||[];const q=local.query.toLowerCase().trim();
    return rows.filter(g=>(local.facet==='All'||g.facet===local.facet)&&(local.domain==='All'||domainKey(g.domain)===local.domain)&&(!q||[g.faculty,g.email,g.domain,g.facet,g.goal].join(' ').toLowerCase().includes(q)));
  }
  function renderGoals(){
    if(!local.rows){return '<h3>Individual faculty growth goals</h3><p class="growth-pane-lead">Search complete goals, review their selected TLF facets and domains, and open the related observation evidence.</p><div class="growth-private-prompt"><div class="glyph" aria-hidden="true">✦</div><div><h4>Individual goals are not published to the public site</h4><p>For authorized leadership review, load the prepared <strong>faculty-only CSV</strong>. Only staff who have 2026–27 observations are accepted; leadership goal records are excluded. The file stays in memory in this browser session and is cleared when you reload.</p><button class="button button-secondary" type="button" id="growthPromptUpload">Load private faculty goals</button></div></div><p class="growth-footnote">A genuinely faculty-specific experience requires AISG single sign-on and server-enforced access control. Filtering this GitHub Pages site by name would not make records private.</p>';}
    let html='<h3>Faculty growth goals</h3><p class="growth-pane-lead">A working conversation resource for authorized leaders. Select a goal to explore its full text and the classroom observation evidence available for that teacher.</p>';
    html+='<div class="growth-tools"><div class="growth-field grow"><label for="growthGoalSearch">Search faculty or goal text</label><input id="growthGoalSearch" type="search" placeholder="Search names, instructional practice, or goal wording" value="'+esc(local.query)+'" autocomplete="off" /></div><div class="growth-field"><label for="growthFacetFilter">TLF facet</label><select id="growthFacetFilter"><option value="All">All facets</option>'+FACETS.map(f=>'<option value="'+esc(f)+'"'+(local.facet===f?' selected':'')+'>'+esc(f)+'</option>').join('')+'</select></div><div class="growth-field"><label for="growthDomainFilter">Domain</label><select id="growthDomainFilter"><option value="All">All domains</option>'+['1','2','3','4','other'].map(k=>'<option value="'+k+'"'+(local.domain===k?' selected':'')+'>'+esc(k==='other'?'Other':k+' · '+DOMAIN_NAMES[k])+'</option>').join('')+'</select></div></div>';
    html+='<div id="growthResultArea"></div><p class="growth-footnote">Goal-focus matches are for inquiry only, not evaluation; teachers may be making progress even when a particular facet does not appear in an observation.</p>';
    return html;
  }
  function renderGoalRows(){
    const host=byId('growthResultArea');if(!host||!local.rows)return;
    const rows=goalRows().sort((a,b)=>a.faculty.localeCompare(b.faculty));
    const message='<div class="growth-results">'+nfmt(rows.length)+' of '+nfmt(activeGoals().length)+' faculty goal records shown</div>';
    if(!rows.length){host.innerHTML=message+'<div class="growth-empty">No faculty goals match those filters.</div>';return;}
    let html=message+'<div class="growth-table-wrap"><table class="growth-table"><thead><tr><th>Faculty</th><th>Chosen TLF facet</th><th>Chosen domain / competency</th><th>Focus facet in observations</th><th>Review</th></tr></thead><tbody>';
    html+=rows.map(g=>{const e=evidenceFor(g);return '<tr><td><strong>'+esc(g.faculty)+'</strong></td><td>'+tag(g.facet)+'</td><td>'+esc(g.domain)+'</td><td><strong>'+nfmt(e.commendations.length)+' comm. · '+nfmt(e.wonderings.length)+' wond.</strong><div class="muted">Across '+nfmt(e.rows.length)+' observations</div></td><td><button type="button" class="growth-open" data-growth-open="'+esc(g.email)+'" aria-label="Review growth record for '+esc(g.faculty)+'">Open record →</button></td></tr>';}).join('');
    html+='</tbody></table></div>';host.innerHTML=html;
  }
  function renderGrowth(){
    const host=byId('growthViewMount');if(!host)return;
    byId('growthViewNav')?.querySelectorAll('button[data-growth-pane]').forEach(b=>{const active=b.dataset.growthPane===local.pane;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    host.className='growth-pane';
    host.innerHTML=local.pane==='facets'?renderFacets():local.pane==='domains'?renderDomains():renderGoals();
    if(local.pane==='goals')renderGoalRows();
  }
  function enhanceFacultyOverview(){
    const host=byId('facultyViewBody');if(!host||!local.rows)return;
    const byEmail=facultyMap(), map=new Map();
    for(const g of local.rows){const rows=byEmail.get(g.email)||[];for(const row of rows){const key=String(row.faculty||'').toLowerCase().trim();if(key)map.set(key,g);}}
    host.querySelectorAll('tr').forEach(tr=>{
      const name=tr.querySelector('[data-faculty-evidence]')?.getAttribute('data-faculty-evidence');if(!name)return;
      const goal=map.get(name.trim().toLowerCase());if(!goal||tr.querySelector('.growth-faculty-quick'))return;
      const cell=tr.querySelector('td:last-child');if(!cell)return;
      const button=document.createElement('button');button.className='growth-faculty-quick';button.type='button';button.dataset.growthOpen=goal.email;button.textContent='Growth focus';button.setAttribute('aria-label','Open growth focus for '+name);cell.append(button);
    });
  }
  function update(){
    if(!byId('growthViewMount'))return;
    renderWelcome();renderStats();renderGrowth();enhanceFacultyOverview();
  }
  function parseCsv(text){
    const parsed=[];let row=[],field='',quoted=false;
    text=String(text||'').replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
      else if(!quoted&&c===','){row.push(field);field='';}
      else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>String(x).trim()))parsed.push(row);row=[];field='';}
      else field+=c;
    }
    if(field||row.length){row.push(field);if(row.some(x=>String(x).trim()))parsed.push(row);}
    if(quoted)throw Error('The CSV contains an unfinished quoted field.');
    return parsed;
  }
  async function loadGoals(file){
    if(!file)return;
    if(file.size>6_000_000)throw Error('Choose a faculty goals CSV smaller than 6 MB.');
    if(!String(file.name).toLowerCase().endsWith('.csv'))throw Error('Choose a .csv file. Use the prepared faculty-only CSV, not the original Excel workbook.');
    const observed=facultyMap();if(!observed.size)throw Error('Observation data is not loaded yet. Reload the dashboard and try again.');
    const raw=parseCsv(await file.text());if(raw.length<2)throw Error('The goals CSV has no data rows.');
    const headers=raw.shift().map(h=>h.trim().toLowerCase().replace(/[^a-z0-9]+/g,''));
    const at=(r,k)=>String(r[headers.indexOf(k)]||'').trim();
    if(!headers.includes('email')||!headers.includes('tlffacet')||!headers.includes('domain')||!headers.includes('goal'))throw Error('The CSV needs Email, Domain, TLF Facet, and Goal columns.');
    const matched=new Map();let nonObserved=0,leaders=0,blank=0;
    for(const row of raw){
      const email=at(row,'email').toLowerCase();if(!email.includes('@'))continue;
      const domain=at(row,'domain');
      if(RESTRICTED_LEADERS.has(email)||LEADER_DOMAIN.test(domain)){leaders++;continue;}
      if(!observed.has(email)){nonObserved++;continue;}
      const goal=at(row,'goal');if(!goal){blank++;continue;}
      const name=observed.get(email)[0]?.faculty||at(row,'faculty')||at(row,'lastfirstname')||email;
      matched.set(email,{email,faculty:name,domain,facet:at(row,'tlffacet')||'Not selected',goal});
    }
    if(!matched.size)throw Error('No eligible, already-observed faculty goals matched by email. No records have been loaded.');
    local.rows=[...matched.values()].sort((a,b)=>a.faculty.localeCompare(b.faculty));
    local.status=(nonObserved+leaders+blank)?'Excluded from this import: '+[leaders+' leadership',nonObserved+' without current-year observations',blank+' blank goals'].join(' · ')+'.':'';
    local.error=false;local.query='';local.facet='All';local.domain='All';local.pane='goals';
    update();
    byId('growth')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function selectRecord(email){
    const goal=local.rows?.find(g=>g.email===String(email||'').trim().toLowerCase());if(!goal)return;
    const evidence=evidenceFor(goal),dialog=byId('growthRecordDialog');if(!dialog)return;
    const excerpts=[];
    for(const r of evidence.rows.slice().sort((a,b)=>b.date.localeCompare(a.date))){
      if((r.commendations||[]).includes(goal.facet)){
        const index=(r.commendations||[]).indexOf(goal.facet);
        const body=(r.commendationText||[])[index]||r.notes||'';
        excerpts.push({date:r.date,type:'Commendation',text:body});
      }
      if(r.wonderingFacet===goal.facet)excerpts.push({date:r.date,type:'Wondering',text:r.wonderingText||r.notes||''});
    }
    byId('growthRecordName').textContent=goal.faculty;
    const content=byId('growthRecordContent');
    content.innerHTML='<div class="growth-meta">'+tag(goal.facet)+'<span>'+esc(goal.domain)+'</span><span>'+YEAR+'</span></div><h3>Identified professional goal</h3><p class="growth-goal-text">'+esc(goal.goal)+'</p><h3>Classroom evidence connected to the chosen facet</h3><div class="growth-evidence-grid"><div class="growth-evidence-kpi"><strong>'+nfmt(evidence.rows.length)+'</strong><span>Observations YTD</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(evidence.commendations.length)+'</strong><span>Focus facet commendations</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(evidence.wonderings.length)+'</strong><span>Focus facet wonderings</span></div></div><h3>Evidence excerpts</h3>'+(excerpts.length?excerpts.slice(0,5).map(x=>'<div class="growth-observation-excerpt '+(x.type==='Wondering'?'is-wondering':'')+'"><strong>'+esc(x.date)+' · '+esc(x.type)+'</strong><div>'+esc(x.text||'Related facet was recorded. Open Evidence Explorer for the complete observation.')+'</div></div>').join(''):'<p class="growth-footnote">No observations tagged with this faculty-selected facet yet. This is a prompt for inquiry, not a measure of progress.</p>')+'<div class="growth-inquiry"><strong>A prompt for reflection</strong><p>How does this evidence relate to the instructional change being pursued? What further evidence would be useful before deciding the next step?</p></div><div class="growth-dialog-footer"><small>Private browser session · '+esc(SOURCE_NAME)+'</small><button id="growthOpenEvidence" type="button">Open Evidence Explorer →</button></div>';
    byId('growthOpenEvidence').onclick=()=>{dialog.close();roleBridge()?.openObservations?.(email);};
    if(!dialog.open)dialog.showModal();
  }
  function setPane(name){if(!['facets','domains','goals'].includes(name))return;local.pane=name;renderGrowth();}
  async function init(){
    const panel=byId('growthViewMount');if(!panel)return;
    byId('growthExploreBtn')?.addEventListener('click',()=>roleBridge()?.goTo?.('growth'));
    byId('growthOpenFromWelcome')?.addEventListener('click',()=>roleBridge()?.goTo?.('growth'));
    byId('growthUploadBtn')?.addEventListener('click',openSession);
    byId('growthClearBtn')?.addEventListener('click',()=>{local.rows=null;local.status='';local.error=false;local.query='';local.facet='All';local.domain='All';if(byId('growthGoalsInput'))byId('growthGoalsInput').value='';update();});
    byId('growthGoalsInput')?.addEventListener('change',async event=>{
      try{await loadGoals(event.target.files?.[0]);}catch(err){local.error=true;local.status=err.message;update();}
      finally{event.target.value='';}
    });
    byId('growthViewNav')?.addEventListener('click',event=>{const btn=event.target.closest('[data-growth-pane]');if(btn)setPane(btn.dataset.growthPane);});
    panel.addEventListener('click',event=>{if(event.target.closest('#growthPromptUpload'))openSession();});
    panel.addEventListener('input',event=>{if(event.target.id==='growthGoalSearch'){local.query=event.target.value;renderGoalRows();}});
    panel.addEventListener('change',event=>{if(event.target.id==='growthFacetFilter'){local.facet=event.target.value;renderGoalRows();}if(event.target.id==='growthDomainFilter'){local.domain=event.target.value;renderGoalRows();}});
    document.addEventListener('click',event=>{const btn=event.target.closest('button[data-growth-open]');if(btn)selectRecord(btn.dataset.growthOpen);});
    byId('growthCloseDialog')?.addEventListener('click',()=>byId('growthRecordDialog')?.close());
    byId('growthRecordDialog')?.addEventListener('click',event=>{if(event.target===byId('growthRecordDialog'))byId('growthRecordDialog').close();});
    window.addEventListener('aisg:dashboardRendered',update);
    update();
    try{const response=await fetch('./data/growth-summary.json?v=20261021',{cache:'no-store'});if(!response.ok)throw new Error('Aggregate data unavailable');const data=await response.json();if(data.schoolYear===YEAR&&Number.isFinite(data.includedFaculty))local.summary=data;}
    catch(err){console.warn('Using verified October 20 faculty-only summary.',err);}
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
