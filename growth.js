/* AISG Growth & Reflection: public schoolwide and 2026–27 observed-faculty professional goals.
 * All goal records are readable from data/faculty-goals.json at the user's request.
 * This public site is NOT authenticated and must not be presented as faculty-specific private access.
 */
(() => {
  'use strict';
  const YEAR = '2026-27';
  const FACETS = ['Personalization', 'Agency', 'Authenticity', 'Creativity', 'Collaboration', 'Taking Action'];
  const LENS_OF = {Personalization:'Being',Agency:'Being',Authenticity:'Connecting',Creativity:'Connecting',Collaboration:'Doing','Taking Action':'Doing'};
  const DOMAIN_NAMES = {'1':'Purposeful & Inclusive Learning Design','2':'Inclusive Learning Culture & Environment','3':'Transformative, Culturally Responsive Learning in Action','4':'Collaborative Planning, Reflection & Professional Impact','other':'Other / not specified'};
  const RESTRICTED_LEADERS = new Set(['ckydd@aisgz.org','srogers@aisgz.org','tevans@aisgz.org','kjohnson@aisgz.org','jkennett@aisgz.org','remmerink@aisgz.org']);
  const LEADER_DOMAIN = /(?:^|\s)(instructional leadership|strategic & organizational leadership|personal, ethical & reflective leadership)\b/i;
  const SOURCE_NAME = 'Faculty growth goals · October 2026';
  const publicFallback = {schoolYear:YEAR,asOf:'2026-10-22',includedFaculty:108,observationRosterCount:109,facetCounts:{Personalization:32,Agency:48,Authenticity:7,Creativity:6,Collaboration:10,'Taking Action':5},lensCounts:{Being:80,Connecting:13,Doing:15},domainCounts:{},byDivision:{Elementary:{includedFaculty:54,facetCounts:{Personalization:24,Agency:23,Authenticity:2,Creativity:1,Collaboration:3,'Taking Action':1},lensCounts:{Being:47,Connecting:3,Doing:4},domainCounts:{}},Secondary:{includedFaculty:54,facetCounts:{Personalization:8,Agency:25,Authenticity:5,Creativity:5,Collaboration:7,'Taking Action':4},lensCounts:{Being:33,Connecting:10,Doing:11},domainCounts:{}}}};
  const local = {rows:null,summary:null,pane:'facets',query:'',facet:'All',domain:'All',status:'',error:false,sourceMeta:null};
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
  const currentYear = () => !roleBridge()?.getState()?.year || roleBridge().getState().year===YEAR;
  function primaryDivision(email){
    const rows=facultyMap().get(email)||[];
    const c={Elementary:0,Secondary:0};for(const r of rows)if(r.division in c)c[r.division]++;
    return c.Elementary>=c.Secondary?'Elementary':'Secondary';
  }
  const emptySummary=()=>({includedFaculty:0,facetCounts:{},lensCounts:{Being:0,Connecting:0,Doing:0},domainCounts:{},competencyCounts:{}});
  function activeGoals(){
    if(!local.rows)return null;
    if(!currentYear())return [];
    const d=division();
    return d==='All'?local.rows:local.rows.filter(g=>(g.division||primaryDivision(g.email))===d);
  }
  function summaryFor(rows){
    const facetCounts=counts(rows,r=>r.facet),domainCounts=counts(rows,r=>domainKey(r.domain));
    return {schoolYear:YEAR,includedFaculty:rows.length,observationRosterCount:new Set(rowsYtd().map(r=>r.email.toLowerCase().trim())).size,
      facetCounts,domainCounts,
      lensCounts:{Being:(facetCounts.Agency||0)+(facetCounts.Personalization||0),Connecting:(facetCounts.Authenticity||0)+(facetCounts.Creativity||0),Doing:(facetCounts.Collaboration||0)+(facetCounts['Taking Action']||0)}};
  }
  function summary(){
    if(!local.rows)return emptySummary();
    if(local.rows)return summaryFor(activeGoals());
    if(!currentYear())return emptySummary();
    const source=local.summary||publicFallback;
    const d=division();
    return source.byDivision?.[d]||(d==='Elementary'?emptySummary():source);
  }
  const tag = (facet) => '<span class="growth-facet-pill is-'+esc((LENS_OF[facet]||'other').toLowerCase())+'">'+esc(facet||'Not selected')+'</span>';

  function renderWelcome(){
    const s=summary(),total=s.includedFaculty||0,being=s.lensCounts?.Being||0,agency=s.facetCounts?.Agency||0;
    const host=byId('growthTopline');if(!host)return;
    host.innerHTML=[
      [nfmt(total),'Faculty growth goals',division()==='All'?'2026–27 observed faculty':'Filtered to '+division()],
      [nfmt(being),'Being lens','Personalization and Agency selected'],
      [nfmt(agency),'Agency focus','Faculty-selected TLF facet']
    ].map(([num,label,sub])=>'<article class="growth-overview-tile"><strong class="num">'+esc(num)+'</strong><span class="lbl">'+esc(label)+'</span><span class="sub">'+esc(sub)+'</span></article>').join('');
    const scope=byId('growthOverviewScope');
    if(scope)scope.textContent=(division()==='All'?'Whole school':division())+' · '+(local.rows?'Public faculty goals available':'Loading published faculty goals')+(currentYear()?'':' · Goals are available for 2026–27 only');
  }
  function renderStats(){
    const s=summary(),f=s.facetCounts||{},lens=s.lensCounts||{},total=s.includedFaculty||0;
    const highest=Object.entries(f).filter(([facet])=>FACETS.includes(facet)).sort((a,b)=>b[1]-a[1])[0];
    const values=[
      [total,'Faculty goals matched',division()==='All'?'Whole school':division()],
      [(lens.Being||0),'Being lens',total?Math.round((lens.Being||0)/total*100)+'% of faculty goals':'No goals in this view'],
      [highest?.[1]||0,highest?.[0]||'TLF focus',total?'Most frequently selected facet':'No goals in this view']
    ];
    byId('growthSummaryStats').innerHTML=values.map(([num,label,sub])=>'<div class="growth-stat"><strong>'+nfmt(num)+'</strong><span>'+esc(label)+'</span><small>'+esc(sub)+'</small></div>').join('');
    const notice=byId('growthNotice');
    if(!notice)return;
    if(local.rows){
      notice.className='growth-note is-public';
      notice.innerHTML='<strong>Faculty goals available.</strong> '+nfmt(local.rows.length)+' observed faculty goals are published and visible across the dashboard. Hover or focus a faculty name for their complete domain, facet and goal. <strong>Elementary and Secondary goals are included (54 matched faculty in each division).</strong>';
    }else if(local.error){
      notice.className='growth-note is-warning';
      notice.innerHTML='<strong>Unable to load faculty goals.</strong> '+esc(local.status)+' Try refreshing the page.';
    }else{
      notice.className='growth-note';
      notice.innerHTML='<strong>Loading published faculty goals…</strong> Schoolwide and divisional summaries remain visible while the goal records load.';
    }
  }
  function barRows(entries,total){
    return '<div class="cv-goal-axis" aria-hidden="true"><span>Faculty with an imported goal</span><span>0%<i>100%</i></span><span></span></div>'+entries.map(([name,value])=>{
      const lens=LENS_OF[name]||'other',width=total?100*value/total:0;
      return '<div class="growth-bar-row cv-goal-bar"><span class="growth-bar-name">'+esc(name)+'</span><div class="growth-track" role="img" aria-label="'+esc(name)+': '+value+' of '+total+' faculty, '+Math.round(width)+' percent"><div class="growth-bar-fill is-'+esc(lens.toLowerCase())+'" style="width:'+width.toFixed(3)+'%"></div></div><span class="growth-bar-val">'+Math.round(width)+'%<small>'+nfmt(value)+' of '+nfmt(total)+' faculty</small></span></div>';
    }).join('');
  }
  function goalTable(entries,total,title){return window.AISG_CHARTS.dataTable(['Category','Faculty choosing this focus','Faculty with imported goals','Share'],entries.map(([n,v])=>[n,v,total,total?Math.round(v/total*100)+'%':'Not available']),title);}
  function compareDivisions(mode){
    if(!local.rows||!currentYear())return '';
    const keys=mode==='facets'?FACETS:['1','2','3','4','other'];
    let html='<details class="cv-data cv-goal-compare"><summary>Compare Elementary and Secondary on the same scale</summary><p class="cv-note">Identical category order and 0-100% scales. Each denominator is the number of imported goals in that division, not the full staffing roster. The comparison intentionally shows both divisions.</p><div class="cv-two-panels">';
    for(const div of ['Elementary','Secondary']){
      const rows=local.rows.filter(g=>(g.division||primaryDivision(g.email))===div),c=counts(rows,g=>mode==='facets'?g.facet:domainKey(g.domain));
      const entries=keys.map(k=>({label:mode==='facets'?k:(k==='other'?'Other':'Domain '+k),value:rows.length?(c[k]||0)/rows.length*100:null,n:c[k]||0,d:rows.length}));
      html+='<section><h4>'+div+' - '+rows.length+' faculty goals</h4>'+window.AISG_CHARTS.bars(entries,{denominatorLabel:'faculty'})+goalTable(entries.map(e=>[e.label,e.n]),rows.length,div+' growth priorities')+'</section>';
    }return html+'</div></details>';
  }
  function evidenceFor(goal){
    const mine=facultyMap().get(goal.email)||[];
    const comm=mine.filter(r=>(r.commendations||[]).includes(goal.facet));
    const wondering=mine.filter(r=>r.wonderingFacet===goal.facet);
    return {rows:mine,commendations:comm,wonderings:wondering};
  }
  function renderFacets(){
    const s=summary(),f=s.facetCounts||{},lens=s.lensCounts||{},total=s.includedFaculty||0;
    if(!total)return '<div class="growth-empty"><strong>No matching faculty goals for '+esc(division())+'</strong><p>No eligible faculty goals currently match the selected division or school year. Schoolwide totals have not been carried over.</p></div>';
    const sorted=FACETS.map(name=>[name,f[name]||0]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    const biggest=Math.max(1,...sorted.map(x=>x[1]));
    let html='<h3>What are faculty choosing to develop?</h3><p class="growth-pane-lead">'+nfmt(total)+' faculty with goals · '+esc(division()==='All'?'whole school':division())+'. These choices describe professional intentions, not observed performance.</p>';
    html+='<div class="growth-chart-split"><div class="growth-bar-list">'+barRows(sorted,total)+'</div><aside>';
    for(const l of ['Being','Connecting','Doing'])html+='<div class="growth-lens is-'+l.toLowerCase()+'"><span class="growth-lens-title">'+l+' lens</span><strong>'+nfmt(lens[l]||0)+'</strong><small>'+({Being:'Personalization · Agency',Connecting:'Authenticity · Creativity',Doing:'Collaboration · Taking Action'}[l])+'</small></div>';
    html+='</aside></div>'+goalTable(sorted,total,'Faculty-selected TLF facets')+compareDivisions('facets');
    const top=sorted[0];html+='<div class="growth-inquiry"><strong>Leadership inquiry</strong><p>'+esc(top[0])+' is the most frequently chosen facet ('+nfmt(top[1])+' faculty). How might observation conversations illuminate this intentional area of growth?</p></div>';
    if(local.rows){
      const rows=activeGoals().filter(g=>FACETS.includes(g.facet));
      const comm=rows.filter(g=>evidenceFor(g).commendations.length).length,wond=rows.filter(g=>evidenceFor(g).wonderings.length).length;
      html+='<section class="growth-competencies"><h4>Year-to-date observation connections</h4><div class="growth-evidence-grid"><div class="growth-evidence-kpi"><strong>'+nfmt(rows.length)+'</strong><span>Faculty with selected facets</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(comm)+'</strong><span>Focus facet in a commendation</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(wond)+'</strong><span>Focus facet in a wondering</span></div></div><p class="growth-footnote">These coverage indicators use all 2026–27 observations, independent of the selected observer or period. The paired comparison above applies your evidence filters. Neither is a goal-attainment score.</p></section>';
      html+='<details class="growth-facet-members" open><summary>Explore faculty by chosen facet</summary><div class="growth-members-grid">';
      for(const [facet,count] of sorted){if(!count)continue;const people=rows.filter(g=>g.facet===facet).sort((a,b)=>a.faculty.localeCompare(b.faculty));
        html+='<section class="growth-members-group"><h4>'+tag(facet)+' <span>'+nfmt(count)+' faculty</span></h4><div class="growth-people">'+people.map(personButton).join('')+'</div></section>';
      }
      html+='</div></details>';
    }else html+='<p class="growth-footnote">Faculty detail records are loading…</p>';
    return html;
  }
  function renderDomains(){
    const s=summary(),d=s.domainCounts||{},total=s.includedFaculty||0;
    if(!total)return '<div class="growth-empty"><strong>No matching faculty goals for '+esc(division())+'</strong><p>No eligible faculty goals currently match the selected division or school year. Schoolwide totals have not been carried over.</p></div>';
    const max=Math.max(1,total);
    let html='<h3>Which areas of professional practice are the focus?</h3><p class="growth-pane-lead">Teacher Growth &amp; Reflection domains across '+nfmt(total)+' faculty goals · '+esc(division()==='All'?'whole school':division())+'.</p><div class="growth-domain-list">';
    for(const key of ['1','2','3','4','other']){
      const count=d[key]||0;if(key==='other'&&!count)continue;
      html+='<div class="growth-domain-item"><span class="growth-domain-n">'+(key==='other'?'–':key)+'</span><div><div class="growth-domain-t">'+esc(DOMAIN_NAMES[key])+'</div><div class="growth-domain-sub">'+nfmt(count)+' faculty selected this domain</div></div><div class="growth-track"><div class="growth-bar-fill" style="width:'+(100*count/max).toFixed(1)+'%"></div></div><span class="growth-bar-val">'+Math.round(count/total*100)+'%<small>'+count+' of '+total+' faculty</small></span></div>';
    }
    html+='</div>'+goalTable(Object.entries(d).map(([k,v])=>[DOMAIN_NAMES[k]||k,v]),total,'Faculty-selected domains')+compareDivisions('domains')+'<section class="growth-competencies"><h4>Chosen competencies</h4><div class="growth-competency-grid">';
    const domainCounts=local.rows?counts(activeGoals(),g=>g.domain):(s.competencyCounts||{});
    const sorted=Object.entries(domainCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    if(local.rows){html+=sorted.map(([name,count])=>'<details class="growth-competency"><summary><strong>'+esc(name)+'</strong><span>'+nfmt(count)+' faculty ▾</span></summary><div class="growth-people">'+activeGoals().filter(g=>g.domain===name).sort((a,b)=>a.faculty.localeCompare(b.faculty)).map(personButton).join('')+'</div></details>').join('');}
    else html+=sorted.map(([name,count])=>'<div class="growth-competency"><strong>'+esc(name)+'</strong><span>'+nfmt(count)+' faculty</span></div>').join('');
    html+='</div></section>';
    if(!local.rows)html+='<p class="growth-footnote">Faculty detail records are loading…</p>';
    html+='<div class="growth-inquiry"><strong>Leadership inquiry</strong><p>How could these priorities inform collaborative planning, professional learning and the evidence collected during observations?</p></div>';
    return html;
  }
  function personButton(g){return '<button class="growth-person" type="button" data-growth-hover="'+esc(g.email)+'" data-growth-open="'+esc(g.email)+'" aria-label="View goal for '+esc(g.faculty)+'">'+esc(g.faculty)+'</button>';}
  function goalRows(){
    let rows=activeGoals()||[];const q=local.query.toLowerCase().trim();
    return rows.filter(g=>(local.facet==='All'||g.facet===local.facet)&&(local.domain==='All'||domainKey(g.domain)===local.domain)&&(!q||[g.faculty,g.email,g.domain,g.facet,g.goal].join(' ').toLowerCase().includes(q)));
  }
  function renderGoals(){
    const total=summary().includedFaculty||0;
    if(!total)return '<div class="growth-empty"><strong>No matching faculty goals for '+esc(division())+'</strong><p>No eligible faculty goals currently match 2026–27 observations in this division.</p></div>';
    if(!local.rows)return '<h3>Individual faculty growth goals</h3><p class="growth-pane-lead">Loading publicly available faculty goals…</p>';
    let html='<h3>Faculty growth goals</h3><p class="growth-pane-lead">Hover or focus on a faculty name to read their <strong>chosen TLF facet, domain and complete goal statement</strong>. Click a name for the full growth record and related observation evidence.</p>';
    html+='<div class="growth-tools"><div class="growth-field grow"><label for="growthGoalSearch">Search faculty or goal statement</label><input id="growthGoalSearch" type="search" placeholder="Search names, keywords, or goal text" value="'+esc(local.query)+'" autocomplete="off" /></div><div class="growth-field"><label for="growthFacetFilter">TLF facet</label><select id="growthFacetFilter"><option value="All">All facets</option>'+FACETS.map(f=>'<option value="'+esc(f)+'"'+(local.facet===f?' selected':'')+'>'+esc(f)+'</option>').join('')+'</select></div><div class="growth-field"><label for="growthDomainFilter">Domain</label><select id="growthDomainFilter"><option value="All">All domains</option>'+['1','2','3','4','other'].map(k=>'<option value="'+k+'"'+(local.domain===k?' selected':'')+'>'+esc(k==='other'?'Other':k+' · '+DOMAIN_NAMES[k])+'</option>').join('')+'</select></div></div>';
    html+='<div id="growthResultArea"></div><p class="growth-footnote">Matches show where observation feedback mentions the teacher’s chosen TLF facet. They do not measure goal attainment.</p>';
    return html;
  }
  function renderGoalRows(){
    const host=byId('growthResultArea');if(!host||!local.rows)return;
    const rows=goalRows().sort((a,b)=>a.faculty.localeCompare(b.faculty));
    const message='<div class="growth-results">'+nfmt(rows.length)+' of '+nfmt(activeGoals().length)+' faculty goal records shown</div>';
    if(!rows.length){host.innerHTML=message+'<div class="growth-empty">No faculty goals match those filters.</div>';return;}
    let html=message+'<div class="growth-table-wrap"><table class="growth-table"><thead><tr><th>Faculty</th><th>Chosen TLF facet</th><th>Chosen domain / competency</th><th>Focus facet in observations</th><th>Review</th></tr></thead><tbody>';
    html+=rows.map(g=>{const e=evidenceFor(g);return '<tr><td>'+personButton(g)+'</td><td>'+tag(g.facet)+'</td><td>'+esc(g.domain)+'</td><td><strong>'+nfmt(e.commendations.length)+' comm. · '+nfmt(e.wonderings.length)+' wond.</strong><div class="muted">Across '+nfmt(e.rows.length)+' observations</div></td><td><button type="button" class="growth-open" data-growth-open="'+esc(g.email)+'" aria-label="Review growth record for '+esc(g.faculty)+'">Open record →</button></td></tr>';}).join('');
    html+='</tbody></table></div>';host.innerHTML=html;
  }
  function renderGrowth(){
    const host=byId('growthViewMount');if(!host)return;
    byId('growthViewNav')?.querySelectorAll('button[data-growth-pane]').forEach(b=>{const active=b.dataset.growthPane===local.pane;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    host.className='growth-pane';
    if(!local.rows){host.innerHTML='<div class="growth-empty" role="status"><strong>'+(local.error?'Goal data unavailable':'Loading faculty goals')+'</strong><p>'+(local.error?'Results cannot be shown. Refresh to retry.':'Please let the source records finish loading.')+'</p></div>';return;}
    host.innerHTML=local.pane==='facets'?renderFacets():local.pane==='domains'?renderDomains():renderGoals();
    if(local.pane==='goals')renderGoalRows();
  }
  function enhanceFacultyOverview(){
    const host=byId('facultyViewBody');if(!host||!local.rows)return;
    const byEmail=facultyMap(), map=new Map();
    for(const g of local.rows){const rows=byEmail.get(g.email)||[];for(const row of rows){const key=String(row.faculty||'').toLowerCase().trim();if(key)map.set(key,g);}}
    host.querySelectorAll('tr').forEach(tr=>{
      const name=tr.querySelector('[data-faculty-evidence]')?.getAttribute('data-faculty-evidence');if(!name)return;
      const goal=map.get(name.trim().toLowerCase());if(!goal)return;
      tr.querySelector('[data-faculty-evidence]')?.setAttribute('data-growth-hover',goal.email);
      if(tr.querySelector('.growth-faculty-quick'))return;
      const cell=tr.querySelector('td:last-child');if(!cell)return;
      const button=document.createElement('button');button.className='growth-faculty-quick';button.type='button';button.dataset.growthOpen=goal.email;button.dataset.growthHover=goal.email;button.textContent='Growth focus';button.setAttribute('aria-label','Open growth focus for '+name);cell.append(button);
    });
  }
  function update(){
    if(!byId('growthViewMount'))return;
    hideTooltip(true);
    renderWelcome();renderStats();renderGrowth();enhanceFacultyOverview();
    if(!local.rows){byId('growthSummaryStats')?.querySelectorAll('strong').forEach(n=>n.textContent=local.error?'Unavailable':'Loading');}
    window.dispatchEvent(new CustomEvent('aisg:growthRendered'));
  }
  function validateGoals(list,from){
    const observed=facultyMap();if(!observed.size)throw Error('Observation data must finish loading before unlocking goals.');
    const matched=new Map(),excluded={unobserved:0,leader:0,blank:0};
    for(const r of list){
      const email=String(r.email||'').trim().toLowerCase(),domain=String(r.domain||'').trim(),facet=String(r.facet||'').trim(),goal=String(r.goal||'').trim();
      if(RESTRICTED_LEADERS.has(email)||LEADER_DOMAIN.test(domain)){excluded.leader++;continue;}
      if(!observed.has(email)){excluded.unobserved++;continue;}
      if(!goal){excluded.blank++;continue;}
      matched.set(email,{email,faculty:observed.get(email)[0]?.faculty||String(r.faculty||'').trim()||email,domain,facet:facet||'Not selected',goal,division:primaryDivision(email)});
    }
    if(!matched.size)throw Error('No observed faculty with eligible goals were found.');
    local.rows=[...matched.values()].sort((a,b)=>a.faculty.localeCompare(b.faculty));
    local.status=from==='public'?'Loaded from public faculty goals dataset.':from==='encrypted'?'Verified encrypted dataset.':'Imported from local CSV.';
    local.error=false;local.query='';local.facet='All';local.domain='All';if(from!=='public')local.pane='goals';
    update();
    window.dispatchEvent(new CustomEvent('aisg:goalsReady'));
    return local.rows.length;
  }
  const tooltip={hideTimer:null};
  function hideTooltip(immediate=false){
    clearTimeout(tooltip.hideTimer);
    const clear=()=>{const el=byId('growthHoverCard');if(el)el.hidden=true;};
    if(immediate)clear();else tooltip.hideTimer=setTimeout(clear,260);
  }
  function showTooltip(anchor){
    const email=String(anchor?.dataset?.growthHover||'').trim().toLowerCase(),record=local.rows?.find(g=>g.email===email);
    if(!record){window.AISG_REFLECTION?.missingPreview(anchor);return;}
    clearTimeout(tooltip.hideTimer);
    const tip=byId('growthHoverCard');if(!tip)return;
    tip.innerHTML='<div class="growth-hover-kicker">FACULTY GROWTH FOCUS</div><div class="growth-hover-head"><strong>'+esc(record.faculty)+'</strong>'+tag(record.facet)+'</div><div class="growth-hover-label">CHOSEN DOMAIN</div><p>'+esc(record.domain)+'</p><div class="growth-hover-label">IDENTIFIED GOAL</div><p class="growth-hover-statement">'+esc(record.goal.length>300?record.goal.slice(0,297).trimEnd()+'…':record.goal)+'</p><small>Click the faculty name to read the full goal and observation evidence.</small>';
    tip.hidden=false;
    const rect=anchor.getBoundingClientRect(),t=tip.getBoundingClientRect();
    const left=Math.max(12,Math.min(window.innerWidth-t.width-12,rect.left));
    const idealY=rect.bottom+10;
    const top=idealY+t.height<window.innerHeight-12?idealY:Math.max(12,rect.top-t.height-10);
    tip.style.left=left+'px';tip.style.top=top+'px';
  }
  function selectRecord(email){
    if(window.AISG_REFLECTION)return window.AISG_REFLECTION.openRecord(email);
    const goal=local.rows?.find(g=>g.email===String(email||'').trim().toLowerCase());if(!goal)return;
    hideTooltip(true);const evidence=evidenceFor(goal),dialog=byId('growthRecordDialog');if(!dialog)return;
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
    content.innerHTML='<div class="growth-meta">'+tag(goal.facet)+'<span>'+esc(goal.domain)+'</span><span>'+YEAR+'</span></div><h3>Identified professional goal</h3><p class="growth-goal-text">'+esc(goal.goal)+'</p><h3>Classroom evidence connected to the chosen facet</h3><div class="growth-evidence-grid"><div class="growth-evidence-kpi"><strong>'+nfmt(evidence.rows.length)+'</strong><span>Observations YTD</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(evidence.commendations.length)+'</strong><span>Focus facet commendations</span></div><div class="growth-evidence-kpi"><strong>'+nfmt(evidence.wonderings.length)+'</strong><span>Focus facet wonderings</span></div></div><h3>Evidence excerpts</h3>'+(excerpts.length?excerpts.slice(0,5).map(x=>'<div class="growth-observation-excerpt '+(x.type==='Wondering'?'is-wondering':'')+'"><strong>'+esc(x.date)+' · '+esc(x.type)+'</strong><div>'+esc(x.text||'Related facet was recorded. Open Evidence Explorer for the complete observation.')+'</div></div>').join(''):'<p class="growth-footnote">No observations tagged with this faculty-selected facet yet. This is a prompt for inquiry, not a measure of progress.</p>')+'<div class="growth-inquiry"><strong>A prompt for reflection</strong><p>How does this evidence relate to the instructional change being pursued? What further evidence would be useful before deciding the next step?</p></div><div class="growth-dialog-footer"><small>Public faculty goal record · '+esc(SOURCE_NAME)+'</small><button id="growthOpenEvidence" type="button">Open Evidence Explorer →</button></div>';
    byId('growthOpenEvidence').onclick=()=>{dialog.close();roleBridge()?.openObservations?.(email);};
    if(!dialog.open)dialog.showModal();
  }
  async function loadPublicGoals(){
    const response=await fetch('./data/faculty-goals.json?v=20261022-both-divisions',{cache:'no-store'});
    if(!response.ok)throw Error('Published faculty goals could not be fetched (HTTP '+response.status+').');
    const payload=await response.json();
    if(payload.version!==1||payload.schoolYear!==YEAR||!Array.isArray(payload.rows))throw Error('Published goals file is invalid.');
    local.sourceMeta={asOf:payload.asOf,schoolYear:payload.schoolYear};
    // The 2.9 MB observation dataset may load after this much smaller goals file.
    // Wait for the main dashboard to finish its fetch before matching by email.
    if(!facultyMap().size){
      await new Promise(resolve=>{
        let timeout;
        const ready=()=>{
          if(!facultyMap().size)return;
          window.removeEventListener('aisg:dashboardRendered',ready);
          clearTimeout(timeout);resolve();
        };
        window.addEventListener('aisg:dashboardRendered',ready);
        timeout=setTimeout(()=>{window.removeEventListener('aisg:dashboardRendered',ready);resolve();},20000);
        ready();
      });
    }
    const n=validateGoals(payload.rows,'public');
    if(n!==108)console.warn('Public goals matched '+n+' faculty; 108 were expected for the combined Elementary and Secondary source.');
    return n;
  }
  window.AISG_GROWTH_PEOPLE_BRIDGE={
    getGoals:()=>activeGoals()||[],
    getAllGoals:()=>local.rows||[],
    getDivision:division,
    getYear:()=>roleBridge()?.getState()?.year||YEAR,
    getSummary:summary,
    getObservedRows:rowsYtd,
    openRecord:(email)=>selectRecord(email),
    getLoadState:()=>({state:local.error?'error':local.rows?'ready':'loading',error:local.error?local.status:'',asOf:local.sourceMeta?.asOf||''}),
    getView:()=>({pane:local.pane,facet:local.facet,domain:local.domain,query:local.query}),
    setView:view=>{if(['facets','domains','goals'].includes(view?.pane))local.pane=view.pane;if(typeof view?.facet==='string')local.facet=view.facet;if(typeof view?.domain==='string')local.domain=view.domain;if(typeof view?.query==='string')local.query=view.query;renderGrowth();},
    refresh:()=>update()
  };
  function setPane(name){if(!['facets','domains','goals'].includes(name))return;local.pane=name;renderGrowth();window.AISG_NAV?.schedule();}
  async function init(){
    const panel=byId('growthViewMount');if(!panel)return;
    byId('growthOpenFromWelcome')?.addEventListener('click',()=>roleBridge()?.goTo?.('growth'));

    byId('growthViewNav')?.addEventListener('keydown',event=>{const buttons=[...byId('growthViewNav').querySelectorAll('button')],i=buttons.indexOf(event.target);if(i<0)return;let j=i;if(event.key==='ArrowRight')j=(i+1)%buttons.length;else if(event.key==='ArrowLeft')j=(i+buttons.length-1)%buttons.length;else if(event.key==='Home')j=0;else if(event.key==='End')j=buttons.length-1;else return;event.preventDefault();buttons[j].click();buttons[j].focus();});
    byId('growthViewNav')?.addEventListener('click',event=>{const btn=event.target.closest('[data-growth-pane]');if(btn)setPane(btn.dataset.growthPane);});
    panel.addEventListener('input',event=>{if(event.target.id==='growthGoalSearch'){local.query=event.target.value;renderGoalRows();hideTooltip(true);}});
    panel.addEventListener('change',event=>{if(event.target.id==='growthFacetFilter'){local.facet=event.target.value;renderGoalRows();}if(event.target.id==='growthDomainFilter'){local.domain=event.target.value;renderGoalRows();}hideTooltip(true);});
    document.addEventListener('click',event=>{const btn=event.target.closest('button[data-growth-open]');if(btn)selectRecord(btn.dataset.growthOpen);});
    document.addEventListener('pointerover',event=>{const btn=event.target.closest('[data-growth-hover]');if(btn)showTooltip(btn);});
    document.addEventListener('pointerout',event=>{const btn=event.target.closest('[data-growth-hover]');if(btn&&!btn.contains(event.relatedTarget))hideTooltip();});
    document.addEventListener('focusin',event=>{const btn=event.target.closest('[data-growth-hover]');if(btn)showTooltip(btn);});
    document.addEventListener('focusout',event=>{if(event.target.closest('[data-growth-hover]'))hideTooltip();});
    byId('growthHoverCard')?.addEventListener('pointerenter',()=>clearTimeout(tooltip.hideTimer));
    byId('growthHoverCard')?.addEventListener('pointerleave',()=>hideTooltip());
    document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTooltip(true);});
    window.addEventListener('scroll',e=>{if(!byId('growthHoverCard')?.contains(e.target))hideTooltip(true);},true);
    byId('growthCloseDialog')?.addEventListener('click',()=>byId('growthRecordDialog')?.close());
    byId('growthRecordDialog')?.addEventListener('click',event=>{if(event.target===byId('growthRecordDialog'))byId('growthRecordDialog').close();});
    window.addEventListener('aisg:dashboardRendered',update);
    update();
    try{const response=await fetch('./data/growth-summary.json?v=20261022-both-divisions',{cache:'no-store'});if(!response.ok)throw Error('Aggregate data unavailable');const data=await response.json();if(data.schoolYear===YEAR&&Number.isFinite(data.includedFaculty))local.summary=data;}
    catch(err){console.warn('Using 2026–27 fallback growth aggregates.',err);}
    try{await loadPublicGoals();}
    catch(err){console.error('Published faculty goals failed to load.',err);local.error=true;local.status=err.message;update();}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
