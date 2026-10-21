/* AISG Growth & Reflection | faculty and facet/domain hover exploration
   Accessible mouse, keyboard and touch interactions. Public professional goals are
   supplied only by data/faculty-goals.json, via the verified Growth Focus bridge. */
(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const api=()=>window.AISG_GROWTH_PEOPLE_BRIDGE;
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const GROUPS=['facet','domain','competency','lens'];
  const LENSES={Being:['Personalization','Agency'],Connecting:['Authenticity','Creativity'],Doing:['Collaboration','Taking Action']};
  const DOMAIN={'1':'Purposeful & Inclusive Learning Design','2':'Inclusive Learning Culture & Environment','3':'Transformative, Culturally Responsive Learning in Action','4':'Collaborative Planning, Reflection & Professional Impact','other':'Other / not specified'};
  let popup=null,active=null,hideTimer=null,scheduled=false,lookup=new Map();

  function allGoals(){return api()?.getAllGoals?.()||[];}
  function scoped(){return api()?.getGoals?.()||[];}
  function labels(){
    const m=new Map();
    const rows=api()?.getObservedRows?.()||[];
    const byEmail=new Map();
    for(const row of rows){
      const email=String(row.email||'').trim().toLowerCase();
      if(!byEmail.has(email))byEmail.set(email,[]);
      byEmail.get(email).push(String(row.faculty||''));
    }
    for(const goal of allGoals()){
      const names=[goal.faculty].concat(byEmail.get(goal.email)||[]);
      for(const n of names){
        if(n && !m.has(norm(n)))m.set(norm(n),goal.email);
        if(n && n.includes(',')){
          const i=n.indexOf(',');
          const reversed=n.slice(i+1).trim()+' '+n.slice(0,i).trim();
          if(!m.has(norm(reversed)))m.set(norm(reversed),goal.email);
        }
      }
    }
    lookup=m;
  }
  function matching(kind,key){
    let goals=scoped();
    if(kind==='facet')goals=goals.filter(g=>g.facet===key);
    else if(kind==='lens')goals=goals.filter(g=>(LENSES[key]||[]).includes(g.facet));
    else if(kind==='domain')goals=goals.filter(g=>{const m=String(g.domain||'').match(/^\s*([1-4])\s*[a-e]?\s*\./);return key==='other'?!m:m?.[1]===key;});
    else if(kind==='competency')goals=goals.filter(g=>g.domain===key);
    else return [];
    return goals.sort((a,b)=>a.faculty.localeCompare(b.faculty));
  }
  function groupText(kind,key){
    if(kind==='facet')return 'TLF facet · '+key;
    if(kind==='lens')return 'TLF lens · '+key;
    if(kind==='domain')return 'Domain '+(key==='other'?'other':key)+' · '+(DOMAIN[key]||key);
    return 'Chosen competency · '+key;
  }
  function attachGroup(node,kind,key){
    if(!node||!GROUPS.includes(kind))return;
    const matches=matching(kind,key);
    if(!matches.length){node.removeAttribute('data-growth-group');node.removeAttribute('tabindex');node.classList.remove('growth-group-target');return;}
    node.dataset.growthGroup=kind+'|'+key;
    node.classList.add('growth-group-target');
    if(!['BUTTON','A','SUMMARY'].includes(node.tagName)){
      node.tabIndex=0;
      node.setAttribute('role','button');
    }
    node.setAttribute('aria-haspopup','dialog');
    node.setAttribute('aria-label',groupText(kind,key)+': '+matches.length+' faculty. Hover, focus or select to view names.');
  }
  function decorateGroups(){
    const host=el('growthViewMount');
    if(!host||!allGoals().length)return;
    host.querySelectorAll('.growth-bar-row').forEach(node=>{
      const name=node.querySelector('.growth-bar-name')?.textContent?.trim();
      if(name)attachGroup(node,'facet',name);
    });
    host.querySelectorAll('.growth-lens').forEach(node=>{
      const name=node.querySelector('.growth-lens-title')?.textContent?.trim().replace(/\s+lens$/i,'');
      if(name)attachGroup(node,'lens',name);
    });
    host.querySelectorAll('.growth-domain-item').forEach(node=>{
      const id=node.querySelector('.growth-domain-n')?.textContent?.trim();
      if(id)attachGroup(node,'domain',id==='–'?'other':id);
    });
    host.querySelectorAll('.growth-competency').forEach(node=>{
      const summary=node.querySelector('summary');
      const name=summary?.querySelector('strong')?.textContent?.trim() || node.querySelector('strong')?.textContent?.trim();
      if(summary&&name)attachGroup(summary,'competency',name);
    });
    const lead=host.querySelector('.growth-pane-lead');
    if(lead&&!lead.querySelector('.growth-hover-instruction')){
      const note=document.createElement('span');
      note.className='growth-hover-instruction';
      note.textContent=' Hover or select any facet, lens, domain or competency to see the faculty who chose it.';
      lead.appendChild(note);
    }
  }
  function decorateNames(){
    if(!allGoals().length)return;
    labels();
    const root=el('main');
    if(!root)return;
    const selector='button, a, span, strong, td, th, h3, h4, label, [data-faculty-link], [data-faculty-evidence]';
    root.querySelectorAll(selector).forEach(node=>{
      if(node.hasAttribute('data-growth-hover'))return;
      if(node.closest('#growthViewMount .growth-group-card, #growthHoverCard, #growthRecordDialog'))return;
      const explicit=node.getAttribute('data-faculty-link')||node.getAttribute('data-faculty-evidence')||'';
      if(!explicit && node.children.length) return;
      const raw=(explicit||node.textContent||'').trim();
      if(!raw||raw.length>80)return;
      const email=lookup.get(norm(raw));
      if(!email)return;
      node.dataset.growthHover=email;
      node.classList.add('growth-global-name');
      if(!node.matches('button, a, input, summary')&&node.tabIndex<0)node.tabIndex=0;
      if(!node.getAttribute('aria-label'))node.setAttribute('aria-label',raw+' · Hover or focus to see chosen TLF facet, domain and goal');
    });
  }
  function decorate(){
    scheduled=false;
    if(!allGoals().length)return;
    decorateGroups();
    decorateNames();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(decorate);
  }
  function dismiss(immediate){
    clearTimeout(hideTimer);hideTimer=null;
    const close=()=>{
      if(active)active.setAttribute('aria-expanded','false');
      if(popup)popup.hidden=true;
      active=null;
    };
    if(immediate)close();else hideTimer=setTimeout(close,310);
  }
  function keep(){clearTimeout(hideTimer);hideTimer=null;}
  function position(anchor){
    if(!popup||!anchor)return;
    const r=anchor.getBoundingClientRect(),w=popup.getBoundingClientRect();
    const x=Math.max(12,Math.min(window.innerWidth-w.width-12,r.left+32));
    const y=Math.max(12,Math.min(window.innerHeight-w.height-12,r.bottom+10));
    popup.style.left=x+'px';popup.style.top=y+'px';
  }
  function preview(email){
    const goal=scoped().find(g=>g.email===String(email||'').toLowerCase());
    const holder=el('growthMemberPreview');if(!holder||!goal)return;
    holder.innerHTML='<span class="growth-group-preview-label">GOAL PREVIEW · '+esc(goal.facet)+'</span>'+
      '<strong>'+esc(goal.faculty)+'</strong><span>'+esc(goal.domain)+'</span><p>'+esc(goal.goal.length>300?goal.goal.slice(0,297).trimEnd()+'…':goal.goal)+'</p>'+
      '<small>Click this name to open their complete growth record and observation evidence.</small>';
    if(active)position(active);
  }
  function show(anchor){
    const value=anchor?.dataset?.growthGroup||'',split=value.indexOf('|');
    if(split<1)return;
    const kind=value.slice(0,split),key=value.slice(split+1);
    const people=matching(kind,key);
    if(!people.length)return;
    keep();
    if(active&&active!==anchor)active.setAttribute('aria-expanded','false');
    active=anchor;active.setAttribute('aria-expanded','true');
    if(!popup)return;
    const html='<div class="growth-group-eyebrow">FACULTY GROWTH INTENTIONS · 2026–27</div>'+
      '<div class="growth-group-heading"><strong>'+esc(groupText(kind,key))+'</strong><span>'+people.length+' faculty</span></div>'+
      '<p class="growth-group-subtitle">These faculty selected this '+(kind==='competency'?'competency':kind)+'. Hover a name to preview the full goal; click to open its observation evidence.</p>'+
      '<div class="growth-group-list" role="list" aria-label="Faculty who selected '+esc(key)+'">'+
      people.map(g=>'<button role="listitem" type="button" class="growth-group-person" data-growth-member="'+esc(g.email)+'" data-growth-open="'+esc(g.email)+'">'+esc(g.faculty)+'</button>').join('')+
      '</div><section id="growthMemberPreview" class="growth-group-preview" aria-live="polite"><p>Hover or focus on a name to preview the goal; click to read it in full.</p></section>';
    popup.innerHTML=html;popup.hidden=false;
    position(anchor);
  }
  function begin(){
    if(!api())return;
    popup=document.createElement('div');
    popup.id='growthGroupHoverCard';
    popup.className='growth-group-card';
    popup.setAttribute('role','dialog');
    popup.setAttribute('aria-label','Faculty by selected growth focus');
    popup.hidden=true;
    document.body.appendChild(popup);
    popup.addEventListener('pointerenter',keep);
    popup.addEventListener('pointerleave',()=>dismiss(false));
    popup.addEventListener('focusin',event=>{keep();const item=event.target.closest('[data-growth-member]');if(item)preview(item.dataset.growthMember);});
    popup.addEventListener('focusout',event=>{if(!popup.contains(event.relatedTarget))dismiss(false);});
    popup.addEventListener('pointerover',event=>{keep();const item=event.target.closest('[data-growth-member]');if(item)preview(item.dataset.growthMember);});
    popup.addEventListener('click',event=>{
      if(event.target.closest('[data-growth-member]'))dismiss(true);
    });
    document.addEventListener('pointerover',event=>{
      if(event.target.closest('#growthGroupHoverCard'))return;
      const anchor=event.target.closest('[data-growth-group]');
      if(anchor&&anchor!==active)show(anchor);
    });
    document.addEventListener('pointerout',event=>{
      const anchor=event.target.closest('[data-growth-group]');
      if(anchor&&!anchor.contains(event.relatedTarget))dismiss(false);
    });
    document.addEventListener('focusin',event=>{
      const anchor=event.target.closest('[data-growth-group]');
      if(anchor)show(anchor);
    });
    document.addEventListener('focusout',event=>{
      const anchor=event.target.closest('[data-growth-group]');
      if(anchor&&!anchor.contains(event.relatedTarget))dismiss(false);
    });
    document.addEventListener('click',event=>{
      const anchor=event.target.closest('[data-growth-group]');
      if(anchor){show(anchor);return;}
      if(!event.target.closest('#growthGroupHoverCard'))dismiss(true);
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){dismiss(true);return;}
      if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-growth-group]')){
        event.preventDefault();show(event.target);
        popup.querySelector('[data-growth-member]')?.focus();
      }
    });
    window.addEventListener('scroll',event=>{
      if(popup?.contains(event.target))return;
      dismiss(true);
    },true);
    window.addEventListener('resize',()=>dismiss(true));
    window.addEventListener('aisg:dashboardRendered',schedule);
    const main=el('main');
    if(main){
      const mutation=new MutationObserver(items=>{
        if(items.some(m=>[...m.addedNodes].some(n=>n.nodeType===1||n.nodeType===3)))schedule();
      });
      mutation.observe(main,{subtree:true,childList:true});
    }
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
})();
