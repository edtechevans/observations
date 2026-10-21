"""Task-based browser regression, not a substitute for evaluation by real leaders.
Run: python tests/reflection-browser.py
Requires: pip install playwright; playwright install --with-deps chromium
The assertions use original school records; no records are modified.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
import json, os, shutil
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results'; OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/'
report=[]
def check(name,condition):
    assert condition, name
    report.append({'test':name,'result':'pass'}); print('PASS:',name,flush=True)
def ready(page):
    page.wait_for_function("window.AISG_GROWTH_PEOPLE_BRIDGE?.getAllGoals().length===108 && history.state?.aisgReflection===1")
    page.wait_for_timeout(400)
def pause(page): page.wait_for_timeout(250)
with sync_playwright() as pw:
    launch={'headless':True}
    if os.environ.get('CHROMIUM_PATH'): launch['executable_path']=os.environ['CHROMIUM_PATH']
    b=pw.chromium.launch(**launch)
    ctx=b.new_context(viewport={'width':1440,'height':1000})
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    ctx.tracing.start(screenshots=True,snapshots=True)
    try:
        page.goto(BASE);ready(page)
        expect(page.locator('#uxPrimaryNav')).to_be_visible()
        check('Classroom Observations tab label',page.locator('[data-ux-category="classroom"]').inner_text()=='Classroom Observations')
        page.locator('[data-ux-category="growth"]').click();pause(page)
        page.locator('#uxCompareFacet').select_option('Agency');pause(page)
        c=page.evaluate('window.AISG_REFLECTION.comparison()')
        check('Default comparison uses same-teacher cohort',page.locator('[name="rfScope"][value="focus"]').is_checked())
        check('Cohort observations all belong to teachers choosing Agency',all(r['email'].lower() in {g['email'].lower() for g in c['chosen']} for r in c['rows']))
        check('Coverage categories are mutually exhaustive',len(c['withFacet'])+len(c['withoutFacet'])+len(c['withoutVisits'])==len(c['chosen']))
        chosen_count=len(c['chosen']);matching_count=len(c['tagged'])
        expect(page.locator('#rfVisitCount')).to_have_text(f'{matching_count} observations')
        page.locator('[name="rfScope"][value="all"]').check();pause(page)
        check('All-faculty mode never reduces observation population',len(page.evaluate('window.AISG_REFLECTION.comparison().rows'))>=len(c['rows']))
        page.locator('[name="rfScope"][value="focus"]').check();pause(page)
        page.locator('#rfViewVisits').click();pause(page)
        check('Observation drill-down retains exact cohort',page.evaluate("window.AISG_GROWTH_BRIDGE.getState().explorerCohortFacet")=='Agency')
        expect(page.locator('#rfCohortBanner')).to_be_visible()
        page.go_back();pause(page)
        check('Back restores comparison screen',page.locator('#growth').is_visible())
        expect(page.locator('#uxCompareFacet')).to_have_value('Agency')
        page.locator('[data-ux-division="Secondary"]').click();pause(page)
        page.locator('#uxEditFilters').click();page.locator('#periodFilter [data-value="30"]').click();pause(page)
        page.locator('#uxEditFilters').click();pause(page)
        expect(page.locator('#uxEvidenceScope')).to_contain_text('Latest 30 days of available evidence:')
        expect(page.locator('#rfFreshness')).to_contain_text('Latest observation:')
        expect(page.locator('#rfFreshness')).to_contain_text('Goals imported: 22 Oct 2026')
        check('Goal cohort unchanged by observation period',len(page.evaluate('window.AISG_REFLECTION.comparison().chosen'))==25)
        page.locator('#uxFacetCompare').screenshot(path=str(OUT/'comparison-desktop.png'))
        candidate=page.evaluate("""()=>{
          const rows=window.AISG_GROWTH_BRIDGE.getRows();
          const g=window.AISG_GROWTH_PEOPLE_BRIDGE.getAllGoals().find(g=>g.division==='Secondary'&&rows.filter(r=>r.email.toLowerCase()===g.email&&r.schoolYear==='2026-27'&&r.response).length>1);
          return {goal:g,rows:rows.filter(r=>r.email.toLowerCase()===g.email&&r.schoolYear==='2026-27').sort((a,b)=>a.date.localeCompare(b.date))};
        }""")
        page.locator('#uxFacultyName').fill(candidate['goal']['faculty']);page.locator('#uxFacultyName').press('Enter');pause(page)
        expect(page.locator('#growthRecordDialog')).to_be_visible()
        expect(page.locator('.growth-goal-text')).to_have_text(candidate['goal']['goal'])
        check('Timeline visits remain chronological',page.locator('.rf-timeline-visit time').evaluate_all('(els)=>els.map(e=>e.dateTime)')==[r['date'] for r in candidate['rows']])
        for row in candidate['rows']:
            node=page.locator(f'[data-rf-observation="{row["id"]}"] .rf-response p')
            if row.get('response'): expect(node).to_have_text(row['response'])
            else: expect(node).to_have_text('No teacher response recorded in the source.')
        check('Complete teacher responses retained beside each observation',True)
        page.locator('[data-rf-timeline="focus"]').click();pause(page)
        expected=[r for r in candidate['rows'] if candidate['goal']['facet'] in r['commendations'] or r['wonderingFacet']==candidate['goal']['facet']]
        check('Chosen-facet timeline filter',page.locator('.rf-timeline-visit').count()==len(expected))
        page.locator('[data-rf-timeline="all"]').click();pause(page)
        visit=page.locator('.rf-timeline-visit').last
        if visit.get_attribute('open') is None: visit.locator('summary').click()
        visit.locator('[data-rf-open-observation]').click();pause(page)
        expect(page.locator('#observationDrawer')).to_have_class('drawer open')
        page.go_back();pause(page)
        expect(page.locator('#growthRecordDialog')).to_be_visible()
        expect(page.locator('#growthRecordName')).to_have_text(candidate['goal']['faculty'])
        check('Back returns from complete observation to teacher timeline',True)
        page.locator('#growthRecordDialog').screenshot(path=str(OUT/'reflection-timeline.png'))
        page.locator('#growthCloseDialog').click();pause(page)
        expect(page.locator('#growthRecordDialog')).not_to_be_visible()
        expect(page.locator('#uxCompareFacet')).to_have_value('Agency')
        check('Closing record restores previous facet, division and observation period',page.evaluate("window.AISG_GROWTH_BRIDGE.getState().division==='Secondary'&&window.AISG_GROWTH_BRIDGE.getState().period==='30'"))
        expect(page.locator('#uxOriginalFilters')).not_to_be_visible()
        check('Returning from a record preserves the closed filter panel',True)
        page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:async v=>{window.copiedView=v;}},configurable:true})")
        page.locator('#rfCopyView').click();pause(page);url=page.evaluate('window.copiedView')
        check('Copy view includes comparison facet and cohort','cf=Agency' in url and 'cohort=focus' in url)
        other=ctx.new_page();other.goto(url);ready(other)
        expect(other.locator('#uxCompareFacet')).to_have_value('Agency')
        check('Shared view restores division and period',other.evaluate("window.AISG_GROWTH_BRIDGE.getState().division==='Secondary'&&window.AISG_GROWTH_BRIDGE.getState().period==='30'"))
        check('Shared view restores same-teacher mode',other.locator('[name="rfScope"][value="focus"]').is_checked());other.close()
        page.locator('#uxFacultyName').fill('Jane McGennisken');page.locator('#uxFacultyName').press('Enter');pause(page)
        expect(page.locator('#growthRecordContent')).to_contain_text('No goal available in the current import.')
        check('Observed faculty without imported goals still have a timeline',page.locator('.rf-timeline-visit').count()>0)
        page.locator('#growthCloseDialog').click();pause(page)
        # An empty future period must not be confused with missing source data.
        page.locator('#uxEditFilters').click();page.locator('#periodFilter [data-value="custom"]').click();pause(page)
        page.locator('#moreFilters').evaluate('(n)=>n.open=true')
        page.locator('#customStart').fill('2099-01-01');page.locator('#customStart').dispatch_event('change')
        page.locator('#customEnd').fill('2099-01-31');page.locator('#customEnd').dispatch_event('change');pause(page)
        check('Empty selected period is genuinely empty',page.evaluate('window.AISG_GROWTH_BRIDGE.getSelectedRows().length')==0)
        expect(page.locator('#rfWithoutVisits')).to_have_text('25')
        check('Missing observations distinguished from absent goal',True)
        # Source failure does not substitute stale aggregate totals.
        failed=ctx.new_page();failed.route('**/data/faculty-goals.json*',lambda r:r.fulfill(status=503,body='Unavailable'))
        failed.goto(BASE);failed.wait_for_function("window.AISG_GROWTH_PEOPLE_BRIDGE?.getLoadState().state==='error'");pause(failed)
        expect(failed.locator('#uxGoalCount')).to_have_text('Unavailable')
        failed.locator('[data-ux-category="growth"]').click();pause(failed)
        expect(failed.locator('#growthViewMount')).to_contain_text('Goal data unavailable')
        check('Goal-source failure never becomes a zero or stale count',True);failed.close()
        mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);mp=mobile.new_page();mp.goto(BASE);ready(mp)
        check('Mobile page does not overflow viewport',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        mp.locator('[data-ux-category="growth"]').click();pause(mp)
        mp.locator('#uxCompareFacet').select_option('Personalization');pause(mp)
        mp.screenshot(path=str(OUT/'mobile-growth.png'),full_page=True)
        check('Touch controls switch cohort mode',mp.locator('[name="rfScope"][value="all"]').count()==1)
        mobile.close()
        # Keyboard accessibility and hover dismissal.
        page.goto(BASE+'?tab=growth');ready(page)
        person=page.locator('[data-growth-hover]').first
        person.focus();pause(page);page.keyboard.press('Escape');pause(page)
        check('Escape dismisses goal hover preview',not page.locator('#growthHoverCard').is_visible())
        page.locator('#growthViewNav [data-growth-pane="facets"]').focus();page.keyboard.press('ArrowRight');pause(page)
        check('Keyboard switches Growth Focus tabs',page.locator('#growthViewNav [data-growth-pane="domains"]').get_attribute('aria-selected')=='true')
        check('No uncaught application errors',not errors)
        (OUT/'reflection-report.json').write_text(json.dumps({'checks':report,'errors':errors},indent=2))
        print(json.dumps({'passed':len(report),'errors':errors,'checks':report},indent=2))
    except Exception:
        page.screenshot(path=str(OUT/'failure.png'),full_page=True)
        (OUT/'failure-state.json').write_text(json.dumps({'url':page.url,'errors':errors,'checks':report,'state':page.evaluate('window.AISG_NAV?.getSnapshot()')},indent=2))
        ctx.tracing.stop(path=str(OUT/'failure-trace.zip'))
        raise
    b.close()
server.shutdown()
