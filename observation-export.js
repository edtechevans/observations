/* AISG Observation Data Export — full-fidelity, client-side Excel downloads.
 * This PUBLIC GitHub Pages dashboard has no authentication. Do not imply user-level permissions.
 * No observation content is sent to an Excel conversion service.
 */
(function () {
  'use strict';
  const ROOT = 'aisg-observation-export';
  const FILTERS = [
    {id:'years',label:'School Years'},
    {id:'divisions',label:'Divisions'},
    {id:'observers',label:'Observers'},
    {id:'teachers',label:'Teachers'},
    {id:'facets',label:'Observed TLF Facets'},
    {id:'goalFacets',label:'Chosen Growth Facets'},
    {id:'domains',label:'Chosen Growth Domains'},
    {id:'times',label:'Lesson Timing'}
  ];
  const EMPTY = 'Not recorded';
  const encoder = new TextEncoder();
  const escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const optionLabel = value => value === EMPTY ? 'Not recorded / unmatched' : value;
  const norm = value => String(value == null ? '' : value).trim();
  const collator = new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  const bridge = () => window.AISG_GROWTH_BRIDGE;
  let goals = new Map();
  let goalError = false;
  let dialog, launch, filterRoot, counter, exportButton;
  let searchInputs = {};
  let selections = {};
  let fromDate = '', toDate = '', textQuery = '', facetType = 'either', responseStatus = 'all';
  let confirmed = false;
  let downloading = false;
  let goalPromise = null;

  function selectedSet(id) {
    if (!selections[id]) selections[id] = new Set();
    return selections[id];
  }
  function linkedGoal(row) {
    if (row.schoolYear !== '2026-27') return null;
    return goals.get(norm(row.email).toLowerCase()) || null;
  }
  function observedFacets(row) {
    const result = [];
    if (facetType !== 'wondering') result.push(...(row.commendations || []));
    if (facetType !== 'commendation' && row.wonderingFacet) result.push(row.wonderingFacet);
    return result.map(norm).filter(Boolean);
  }
  function valuesFor(row,id) {
    const goal = linkedGoal(row);
    switch(id) {
      case 'years': return [norm(row.schoolYear) || EMPTY];
      case 'divisions': return [norm(row.division) || EMPTY];
      case 'observers': return [norm(row.observer) || EMPTY];
      case 'teachers': return [norm(row.faculty) || EMPTY];
      case 'facets': return observedFacets(row).length ? observedFacets(row) : [EMPTY];
      case 'goalFacets': return [goal && norm(goal.facet) || EMPTY];
      case 'domains': return [goal && norm(goal.domain) || EMPTY];
      case 'times': return [norm(row.timeOfClass) || EMPTY];
      default: return [];
    }
  }
  function allRows() { return bridge() && bridge().getRows() || []; }
  function dataReady() {
    const status = bridge() && bridge().getStatus();
    return status && status.state === 'ready' && status.mode !== 'public-fallback' && status.mode !== 'public-error';
  }
  function distinct(id) {
    const values = new Set();
    allRows().forEach(row => {
      // Non-current-year growth attributes are unmatched by design; option is useful for mixed-year exports.
      valuesFor(row,id).forEach(value => values.add(value));
      if(id === 'facets' && facetType !== 'either') {
        (row.commendations || []).forEach(v => { if(v) values.add(v); });
        if(row.wonderingFacet) values.add(row.wonderingFacet);
      }
    });
    return [...values].sort((a,b) => {
      if(a === EMPTY) return 1;
      if(b === EMPTY) return -1;
      return collator.compare(a,b);
    });
  }
  function getMatches() {
    const terms = textQuery.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const seen = new Set();
    return allRows().filter(row => {
      const key = norm(row.id) || [row.date,row.observer,row.faculty].join('|');
      if(seen.has(key)) return false;
      seen.add(key);
      if(fromDate && row.date < fromDate) return false;
      if(toDate && row.date > toDate) return false;
      if(responseStatus === 'yes' && !row.hasResponse) return false;
      if(responseStatus === 'no' && row.hasResponse) return false;
      for(const {id} of FILTERS) {
        const selected = selectedSet(id);
        if(selected.size && !valuesFor(row,id).some(value => selected.has(value))) return false;
      }
      if(terms.length) {
        const goal = linkedGoal(row);
        const haystack = [row.faculty,row.email,row.observer,row.notes,row.response,
          row.wonderingText,row.wonderingFacet,...(row.commendationText || []),
          ...(row.guidingQuestions || []),...(row.commendations || []),
          goal && goal.goal].join(' ').toLocaleLowerCase();
        if(!terms.every(word => haystack.includes(word))) return false;
      }
      return true;
    }).sort((a,b) => (a.date || '').localeCompare(b.date || '') || collator.compare(a.faculty,b.faculty) || collator.compare(a.id,b.id));
  }
  function dateISO(d) {
    if(!d) return '';
    if(typeof d === 'string') return d.slice(0,10);
    return !isNaN(d.getTime()) ? d.toISOString().slice(0,10) : '';
  }
  function applyDashboardFilters() {
    FILTERS.forEach(({id}) => { selections[id] = new Set(); searchInputs[id] = ''; });
    fromDate = ''; toDate = '';
    textQuery = ''; facetType = 'either'; responseStatus = 'all'; confirmed = false;
    const app = bridge();
    if(app) {
      const state = app.getState() || {};
      if(state.year) selectedSet('years').add(state.year);
      if(state.division && state.division !== 'All') selectedSet('divisions').add(state.division);
      if(state.observer && state.observer !== 'All') selectedSet('observers').add(state.observer);
      if(state.faculty) {
        const fragment = norm(state.faculty).toLowerCase();
        distinct('teachers').filter(v => v.toLowerCase().includes(fragment)).forEach(v => selectedSet('teachers').add(v));
      }
      if(state.time && state.time !== 'All') selectedSet('times').add(state.time);
      if(state.observerScope === 'principals') {
        // Group scope is not a security rule: explicitly select the leader names from the existing dashboard controls.
        const menu = document.getElementById('observerFilter');
        const visible = menu ? [...menu.options].map(o => o.value).filter(v => v && v !== 'All') : [];
        if(visible.length) selections.observers = new Set(visible.filter(v => !selections.observers.size || selections.observers.has(v)));
      }
      const bounds = app.getPeriodBounds && app.getPeriodBounds();
      if(bounds) {
        fromDate = dateISO(bounds.start);
        toDate = dateISO(bounds.end);
      }
    }
  }
  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.id = ROOT;
    dialog.className = 'aisg-export-modal';
    dialog.setAttribute('aria-labelledby','aisgExportTitle');
    dialog.innerHTML = [
      '<div class="aisg-export-header"><div><p class="aisg-export-kicker">Evidence Explorer · Data export</p>',
      '<h2 id="aisgExportTitle">Export Observation Data</h2>',
      '<p>Choose multiple values within each filter. The filters work together to select complete records.</p></div>',
      '<button type="button" class="aisg-export-close" data-action="close" aria-label="Close export panel">×</button></div>',
      '<div class="aisg-export-body">',
      '<div class="aisg-export-quick"><button type="button" data-action="dashboard">Use Dashboard Filters</button>',
      '<button type="button" data-action="reset">Clear All Filters</button>',
      '<span id="aisgExportSource" role="status"></span></div>',
      '<div class="aisg-export-section-title"><h3>People, divisions and learning evidence</h3>',
      '<span>Search lists and tick as many options as needed</span></div>',
      '<div id="aisgExportFilterGrid" class="aisg-export-grid"></div>',
      '<div class="aisg-export-section-title"><h3>Dates and evidence details</h3><span>Dates include both endpoints</span></div>',
      '<div class="aisg-export-extras">',
      '<label>From date<input id="aisgExportFrom" type="date"></label>',
      '<label>To date<input id="aisgExportTo" type="date"></label>',
      '<label>Facet evidence<select id="aisgExportFacetType"><option value="either">Commendations or wonderings</option>',
      '<option value="commendation">Commendations only</option><option value="wondering">Wonderings only</option></select></label>',
      '<label>Faculty response<select id="aisgExportResponse"><option value="all">All observations</option>',
      '<option value="yes">Response submitted</option><option value="no">No response</option></select></label>',
      '<label class="aisg-export-search-wide">Search full observation text<input id="aisgExportText" type="search" placeholder="Words in notes, feedback, responses or growth goals"></label>',
      '</div>',
      '<p class="aisg-export-domain-note">Growth Domains and Chosen Growth Facets are linked to current 2026–27 faculty goals; they are not ratings of an observation. Older records may show “Not recorded / unmatched”.</p>',
      '<div class="aisg-export-warning"><strong>Confidentiality reminder</strong><p>This dashboard currently has no AISG sign-in or role-based access. The workbook contains identifiable faculty observations, written feedback and responses. Store and share it only in approved AISG systems.</p></div>',
      '<label class="aisg-export-ack"><input id="aisgExportAcknowledge" type="checkbox"><span>I understand that these exports contain identifiable faculty information.</span></label>',
      '</div>',
      '<div class="aisg-export-footer"><div><strong id="aisgExportCount" aria-live="polite">Loading observations…</strong>',
      '<small>All matching records, not just the current table page. Excel includes Export Details.</small></div>',
      '<button id="aisgExportDownload" type="button" data-action="export" disabled>Download Excel (.xlsx)</button></div>'
    ].join('');
    document.body.appendChild(dialog);
    filterRoot = document.getElementById('aisgExportFilterGrid');
    counter = document.getElementById('aisgExportCount');
    exportButton = document.getElementById('aisgExportDownload');
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('change', onChange);
    dialog.addEventListener('input', onInput);
    dialog.addEventListener('close', () => { downloading = false; });
  }
  function renderGroups() {
    filterRoot.innerHTML = FILTERS.map(({id,label}) => [
      '<section class="aisg-export-filter" data-group="',id,'"><div class="aisg-export-filter-title">',
      '<strong>',escapeHTML(label),'</strong><span id="aisg-count-',id,'"></span></div>',
      '<input type="search" class="aisg-export-option-search" data-search="',id,'" placeholder="Find ',escapeHTML(label.toLowerCase()),'..." value="',escapeHTML(searchInputs[id] || ''),'" aria-label="Search ',escapeHTML(label),'">',
      '<div class="aisg-export-options" id="aisg-options-',id,'"></div>',
      '<div class="aisg-export-filter-actions"><button type="button" data-action="select-visible" data-group="',id,'">Select Shown</button>',
      '<button type="button" data-action="clear-group" data-group="',id,'">All / Clear</button></div></section>'
    ].join('')).join('');
    FILTERS.forEach(({id}) => renderGroupOptions(id));
  }
  function renderGroupOptions(id) {
    const list = document.getElementById('aisg-options-'+id);
    if(!list) return;
    const query = norm(searchInputs[id]).toLocaleLowerCase();
    const options = distinct(id).filter(v => !query || optionLabel(v).toLocaleLowerCase().includes(query));
    list.innerHTML = options.length ? options.map(v => [
      '<label class="aisg-export-option"><input type="checkbox" data-check="',id,'" value="',escapeHTML(v),'"',
      selectedSet(id).has(v) ? ' checked' : '', '><span title="',escapeHTML(optionLabel(v)),'">',
      escapeHTML(optionLabel(v)),'</span></label>'
    ].join('')).join('') : '<span class="aisg-export-none">No matching options</span>';
    const total = selectedSet(id).size;
    document.getElementById('aisg-count-'+id).textContent = total ? total+' selected' : 'All';
  }
  function syncInputs() {
    document.getElementById('aisgExportFrom').value = fromDate;
    document.getElementById('aisgExportTo').value = toDate;
    document.getElementById('aisgExportText').value = textQuery;
    document.getElementById('aisgExportFacetType').value = facetType;
    document.getElementById('aisgExportResponse').value = responseStatus;
    document.getElementById('aisgExportAcknowledge').checked = confirmed;
    document.getElementById('aisgExportSource').textContent = goalError ? 'Goal metadata unavailable; observation export still works' : 'Exports are built locally in Chrome';
  }
  function refreshCount() {
    const ready = dataReady();
    const invalid = !!(fromDate && toDate && fromDate > toDate);
    const matches = ready && !invalid ? getMatches() : [];
    counter.textContent = invalid ? 'Check the dates: From must precede To' :
      ready ? matches.length.toLocaleString('en-US')+' matching observation'+(matches.length === 1 ? '' : 's') :
      'Complete observation data is not loaded';
    exportButton.disabled = !ready || invalid || !confirmed || !matches.length || downloading;
    exportButton.textContent = downloading ? 'Preparing Excel…' : 'Download Excel (.xlsx)';
    return matches;
  }
  function onClick(event) {
    const control = event.target.closest('[data-action]');
    if(!control) return;
    const action = control.dataset.action;
    if(action === 'close') { dialog.close(); return; }
    if(action === 'dashboard' || action === 'reset') {
      applyDashboardFilters();
      if(action === 'reset') { FILTERS.forEach(({id}) => selectedSet(id).clear()); fromDate = ''; toDate = ''; }
      renderGroups(); syncInputs(); refreshCount(); return;
    }
    if(action === 'clear-group' || action === 'select-visible') {
      const id = control.dataset.group;
      if(!FILTERS.some(f => f.id === id)) return;
      const set = selectedSet(id);
      if(action === 'clear-group') set.clear();
      else {
        const query = norm(searchInputs[id]).toLocaleLowerCase();
        distinct(id).filter(v => !query || optionLabel(v).toLocaleLowerCase().includes(query)).forEach(v => set.add(v));
      }
      renderGroupOptions(id); refreshCount(); return;
    }
    if(action === 'export') exportWorkbook();
  }
  function onChange(event) {
    const item = event.target;
    if(item.dataset.check) {
      const set = selectedSet(item.dataset.check);
      if(item.checked) set.add(item.value); else set.delete(item.value);
      document.getElementById('aisg-count-'+item.dataset.check).textContent = set.size ? set.size+' selected' : 'All';
    } else if(item.id === 'aisgExportFrom') fromDate = item.value;
    else if(item.id === 'aisgExportTo') toDate = item.value;
    else if(item.id === 'aisgExportFacetType') {
      facetType = item.value;
      renderGroupOptions('facets');
    } else if(item.id === 'aisgExportResponse') responseStatus = item.value;
    else if(item.id === 'aisgExportAcknowledge') confirmed = item.checked;
    refreshCount();
  }
  function onInput(event) {
    const item = event.target;
    if(item.dataset.search) {
      searchInputs[item.dataset.search] = item.value;
      renderGroupOptions(item.dataset.search);
    } else if(item.id === 'aisgExportText') { textQuery = item.value; refreshCount(); }
  }
  async function loadGoals() {
    if(goalPromise) return goalPromise;
    goalPromise = fetch('./data/faculty-goals.json?v=20261028-export', {cache:'no-store'})
      .then(response => {if(!response.ok) throw Error('Goals unavailable'); return response.json();})
      .then(payload => {
        if(!payload || !Array.isArray(payload.rows)) throw Error('Invalid goals dataset');
        goals = new Map(payload.rows.filter(r => r.email).map(r => [norm(r.email).toLowerCase(),r]));
        goalError = false;
        if(dialog && dialog.open) { renderGroupOptions('domains'); renderGroupOptions('goalFacets'); syncInputs(); refreshCount(); }
      })
      .catch(error => {goalError = true; console.warn('Goal metadata not loaded for export',error); if(dialog && dialog.open) syncInputs();});
    return goalPromise;
  }
  function openDialog() {
    if(!dialog) buildDialog();
    applyDashboardFilters();
    renderGroups();
    syncInputs();
    refreshCount();
    dialog.showModal();
    loadGoals();
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }
  function colName(index) {
    let n = index+1, str = '';
    while(n) { n--; str = String.fromCharCode(65+n%26)+str; n = Math.floor(n/26); }
    return str;
  }
  function excelDate(value) {
    const t = Date.parse(String(value)+'T00:00:00Z');
    return Number.isFinite(t) ? Math.round(t/86400000+25569) : null;
  }
  function sheetXml(table,{dateColumn=-1,widths=[],filter=false}={}) {
    const cells = table.map((row,ri) => {
      const body = row.map((value,ci) => {
        if(value == null || value === '') return '';
        const address = colName(ci)+(ri+1);
        const asDate = ri>0 && ci===dateColumn ? excelDate(value) : null;
        if(asDate != null) return '<c r="'+address+'" s="2"><v>'+asDate+'</v></c>';
        if(typeof value === 'number') return '<c r="'+address+'"><v>'+value+'</v></c>';
        return '<c r="'+address+'" t="inlineStr" s="'+(ri === 0 ? 1 : 3)+'"><is><t xml:space="preserve">'+xmlEscape(value)+'</t></is></c>';
      }).join('');
      return '<row r="'+(ri+1)+'"'+(ri===0?' ht="30" customHeight="1"':'')+'>'+body+'</row>';
    }).join('');
    const columns = widths.length ? '<cols>'+widths.map((w,i) => '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols>' : '';
    const last = colName(Math.max(0,table[0].length-1))+table.length;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'+
      '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>'+
      '<sheetFormatPr defaultRowHeight="21"/>'+columns+'<sheetData>'+cells+'</sheetData>'+
      (filter?'<autoFilter ref="A1:'+last+'"/>':'')+'</worksheet>';
  }
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for(let i=0;i<256;i++) {
      let c = i;
      for(let j=0;j<8;j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for(let i=0;i<bytes.length;i++) c = crcTable[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zipStored(files) {
    const localParts = [], centerParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 31)<<11)|((now.getMinutes() & 63)<<5)|((Math.floor(now.getSeconds()/2)) & 31);
    const dosDate = (((now.getFullYear()-1980) & 127)<<9)|(((now.getMonth()+1) & 15)<<5)|(now.getDate() & 31);
    for(const [name,content] of files) {
      const n = encoder.encode(name);
      const data = encoder.encode(content);
      const crc = crc32(data);
      const local = new Uint8Array(30+n.length), head = new DataView(local.buffer);
      head.setUint32(0,0x04034b50,true); head.setUint16(4,20,true);
      head.setUint16(6,0x0800,true); head.setUint16(8,0,true);
      head.setUint16(10,dosTime,true); head.setUint16(12,dosDate,true);
      head.setUint32(14,crc,true); head.setUint32(18,data.length,true); head.setUint32(22,data.length,true);
      head.setUint16(26,n.length,true); local.set(n,30);
      localParts.push(local,data);
      const center = new Uint8Array(46+n.length), cp = new DataView(center.buffer);
      cp.setUint32(0,0x02014b50,true); cp.setUint16(4,20,true); cp.setUint16(6,20,true);
      cp.setUint16(8,0x0800,true); cp.setUint16(10,0,true);
      cp.setUint16(12,dosTime,true); cp.setUint16(14,dosDate,true);
      cp.setUint32(16,crc,true); cp.setUint32(20,data.length,true); cp.setUint32(24,data.length,true);
      cp.setUint16(28,n.length,true); cp.setUint32(42,offset,true); center.set(n,46);
      centerParts.push(center);
      offset += local.length+data.length;
    }
    const centerSize = centerParts.reduce((sum,p) => sum+p.length,0);
    const tail = new Uint8Array(22), end = new DataView(tail.buffer);
    end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true);
    end.setUint16(10,files.length,true); end.setUint32(12,centerSize,true); end.setUint32(16,offset,true);
    return new Blob([...localParts,...centerParts,tail],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  function makeWorkbook(observations,details) {
    const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
      '<sheets><sheet name="Observations" sheetId="1" r:id="rId1"/><sheet name="Export Details" sheetId="2" r:id="rId2"/></sheets></workbook>';
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts>'+
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
      '<fill><patternFill patternType="solid"><fgColor rgb="FF113261"/><bgColor indexed="64"/></patternFill></fill></fills>'+
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
      '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment wrapText="1" vertical="center"/></xf>'+
      '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'+
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="top"/></xf></cellXfs></styleSheet>';
    const types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
      '<Default Extension="xml" ContentType="application/xml"/>'+
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
      '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'+
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const widths = [20,17,15,18,21,24,24,33,19,23,43,77,23,43,77,23,43,77,90,90,20,55,25,95,28];
    return zipStored([
      ['[Content_Types].xml',types],['_rels/.rels',rels],
      ['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',wbRels],['xl/styles.xml',styles],
      ['xl/worksheets/sheet1.xml',sheetXml(observations,{dateColumn:1,widths,filter:true})],
      ['xl/worksheets/sheet2.xml',sheetXml(details,{widths:[32,110],filter:false})]
    ]);
  }
  const headers = [
    'Observation ID','Date','School Year','Division','Original Division','Observer','Teacher',
    'Teacher Email','Lesson Timing','Commendation 1 Facet','Commendation 1 Guiding Question',
    'Commendation 1 Feedback','Commendation 2 Facet','Commendation 2 Guiding Question',
    'Commendation 2 Feedback','Wondering Facet','Wondering Guiding Question','Wondering Feedback',
    'Observation Notes','Faculty Response','Response Submitted','Chosen Growth Domain',
    'Chosen Growth Facet','Faculty Growth Goal (2026-27)','PowerApps ID'
  ];
  function observationTable(rows) {
    return [headers,...rows.map(row => {
      const goal = linkedGoal(row);
      return [
        row.id,row.date,row.schoolYear,row.division,row.divisionOriginal,row.observer,row.faculty,
        row.email,row.timeOfClass,(row.commendations||[])[0] || '',
        (row.guidingQuestions||[])[0] || '',(row.commendationText||[])[0] || '',
        (row.commendations||[])[1] || '',(row.guidingQuestions||[])[1] || '',
        (row.commendationText||[])[1] || '',row.wonderingFacet,
        (row.guidingQuestions||[])[2] || '',row.wonderingText,row.notes,row.response,
        row.hasResponse ? 'Yes':'No',goal && goal.domain || '',goal && goal.facet || '',
        goal && goal.goal || '',row.powerAppsId || ''
      ];
    })];
  }
  function detailsTable(rows) {
    const teacherCount = new Set(rows.map(r => norm(r.email).toLowerCase() || norm(r.faculty))).size;
    const observerCount = new Set(rows.map(r => norm(r.observer))).size;
    const years = [...new Set(rows.map(r => r.schoolYear))].sort();
    const dateRange = rows.map(r => r.date).sort();
    const table = [['Export Detail','Value'],['Export date / time',new Date().toLocaleString('en-GB')],
      ['Matching observations',rows.length],['Distinct teachers',teacherCount],['Distinct observers',observerCount],
      ['School years present',years.join(', ')],['First observation',dateRange[0] || ''],
      ['Last observation',dateRange[dateRange.length-1] || ''],
      ['Source','AISG Growth & Reflection Dashboard (complete loaded observation records)'],
      ['Data handling','Client-side export; no external conversion or upload service'],
      ['Privacy','Identifiable observations; protect in approved AISG systems'],
      ['Growth metadata','Chosen goals/domains are 2026–27 faculty-selected intentions, not observation ratings'],
      ['',''],['Applied Filters','']];
    FILTERS.forEach(({id,label}) => table.push([label,selectedSet(id).size ? [...selectedSet(id)].sort(collator.compare).join(' | ') : 'All']));
    table.push(['From date',fromDate || 'All'],['To date',toDate || 'All'],
      ['Facet evidence',facetType],['Faculty response',responseStatus],
      ['Text query',textQuery || 'None'],['',''],['By Division','Observations']);
    const divisions = [...new Set(rows.map(r => r.division))].sort(collator.compare);
    divisions.forEach(name => table.push([name,rows.filter(r => r.division===name).length]));
    table.push(['',''],['By Observer','Observations']);
    [...new Set(rows.map(r => r.observer))].sort(collator.compare).forEach(name =>
      table.push([name,rows.filter(r => r.observer===name).length]));
    return table;
  }
  function exportWorkbook() {
    if(downloading || !confirmed || !dataReady()) return;
    const rows = refreshCount();
    if(!rows.length) return;
    downloading = true; refreshCount();
    // Give Chrome a paint opportunity before encoding potentially large narrative text.
    requestAnimationFrame(() => {
      try {
        const blob = makeWorkbook(observationTable(rows),detailsTable(rows));
        const years = [...selectedSet('years')];
        const suffix = years.length === 1 ? years[0] : 'Selected';
        const filename = 'AISG_Observations_'+suffix+'_'+new Date().toISOString().slice(0,10)+'.xlsx';
        const url = URL.createObjectURL(blob), anchor = document.createElement('a');
        anchor.href = url; anchor.download = filename;
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url),30000);
        counter.textContent = rows.length.toLocaleString('en-US')+' observations exported';
      } catch (error) {
        console.error('Observation Excel export failed',error);
        counter.textContent = 'Export failed: '+error.message;
      } finally {
        downloading = false;
        exportButton.disabled = false;
        exportButton.textContent = 'Download Excel (.xlsx)';
      }
    });
  }
  function install() {
    if(document.getElementById('aisgExportLauncher')) return;
    const explorer = document.getElementById('explorer');
    if(!explorer) return;
    const heading = explorer.querySelector('.explorer-heading');
    if(!heading) return;
    launch = document.createElement('button');
    launch.id = 'aisgExportLauncher';
    launch.type = 'button';
    launch.className = 'aisg-export-launcher';
    launch.textContent = 'Export to Excel';
    launch.setAttribute('aria-label','Export complete observation data with multiple filters');
    launch.addEventListener('click',openDialog);
    heading.appendChild(launch);
    // A second entry point in Admin, with the same exact export workflow.
    const admin = document.getElementById('admin');
    const adminHeading = admin && admin.querySelector('.section-heading');
    if(adminHeading) {
      const second = launch.cloneNode(true);
      second.id = 'aisgExportAdminLauncher';
      second.addEventListener('click',openDialog);
      adminHeading.appendChild(second);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
