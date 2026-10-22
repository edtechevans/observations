"""Charts: calculation, rendering, drill-down, keyboard and responsive regressions.
Uses the same published data; creates no personnel records or assessments.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright, expect
import os,json,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-results/charts';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}/';checks=[]
def check(name,ok):
 assert ok,name
 checks.append(name);print('PASS:',name,flush=True)
def ready(page):
 page.wait_for_function("window.AISG_GROWTH_PEOPLE_BRIDGE?.getAllGoals().length===108&&history.state?.aisgReflection===1&&window.AISG_CHART_AUDIT?.monthlyChart")
 page.wait_for_timeout(350)
def pause(page):page.wait_for_timeout(350)
with sync_playwright() as pw:
 launch={'headless':True}
 if os.environ.get('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**launch);ctx=browser.new_context(viewport={'width':1440,'height':1000});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE);ready(page)
  check('All original observations and goals load',page.evaluate("window.AISG_GROWTH_BRIDGE.getRows().length===841&&window.AISG_GROWTH_PEOPLE_BRIDGE.getAllGoals().length===108"))
  page.locator('[data-ux-category="growth"]').click();pause(page)
  agency=page.locator('.growth-bar-row').filter(has=page.get_by_text('Agency',exact=True)).first
  expect(agency).to_contain_text('48 of 108 faculty');expect(agency).to_contain_text('44%')
  check('Agency bar uses the cohort denominator, not the maximum category',abs(float(agency.locator('.growth-bar-fill').evaluate('e=>parseFloat(e.style.width)'))-48/108*100)<.01)
  page.locator('.cv-goal-compare>summary').click();pause(page)
  labels=page.locator('.cv-two-panels section').evaluate_all("panels=>panels.map(p=>[...p.querySelectorAll('.cv-bar-label')].map(x=>x.textContent))")
  check('Division panels use identical facet order',labels[0]==labels[1] and len(labels[0])==6)
  check('Teacher coverage segments form a full cohort',page.evaluate("Math.abs([...document.querySelectorAll('#cvTeacherCoverage .cv-segment')].reduce((a,b)=>a+parseFloat(b.style.width),0)-100)<.01"))
  expect(page.locator('#rfVisitNote')).to_contain_text('do not add')
  page.locator('#growthViewMount').screenshot(style='.app-header{visibility:hidden!important}',path=str(OUT/'growth-desktop.png'))
  page.locator('#growthViewNav [data-growth-pane="domains"]').click();pause(page)
  check('Domain bars are true shares of imported goals',page.evaluate("[...document.querySelectorAll('.growth-domain-item .growth-bar-fill')].reduce((n,e)=>n+parseFloat(e.style.width),0)>99.9&&[...document.querySelectorAll('.growth-domain-item .growth-bar-fill')].reduce((n,e)=>n+parseFloat(e.style.width),0)<100.1"))
  page.locator('[data-ux-category="classroom"]').click();pause(page)
  expect(page.locator('#tlfDetailProfile')).to_contain_text('observations')
  check('TLF profile defaults to observation denominators and 0-100%',page.evaluate("window.AISG_CHART_AUDIT.tlfDetailProfile.mode==='observations'&&window.AISG_CHART_AUDIT.tlfDetailProfile.max===100"))
  page.locator('#facetMetricToggle [data-value="count"]').click();pause(page)
  check('Count control changes the actual scale and values',page.evaluate("window.AISG_CHART_AUDIT.tlfDetailProfile.metric==='count'&&window.AISG_CHART_AUDIT.tlfDetailProfile.max===306"))
  page.locator('#tlfDetailProfile [data-cv-denominator="faculty"]').click();pause(page)
  check('Faculty denominators are the observed faculty',page.evaluate("window.AISG_CHART_AUDIT.tlfDetailProfile.denominator===109&&window.AISG_CHART_AUDIT.tlfDetailProfile.max===109"))
  page.locator('#facetMetricToggle [data-value="rate"]').click();pause(page)
  page.locator('#facets').screenshot(style='.app-header{visibility:hidden!important}',path=str(OUT/'facets-desktop.png'))
  check('Division comparison uses a fixed percentage scale',page.evaluate('window.AISG_CHART_AUDIT.divisionFacetChart.max===100'))
  page.locator('#divisionFacetChart [data-cv-division="Secondary"]').first.click();pause(page)
  check('Division-facet drilldown retains explicit common dates',page.evaluate("(()=>{const s=window.AISG_GROWTH_BRIDGE.getState();return s.division==='Secondary'&&s.period==='custom'&&s.explorerEvidenceType==='commendation'&&!!s.customStart&&!!s.customEnd})()"))
  page.go_back();pause(page)
  page.locator('[data-ux-division="All"]').click();pause(page)
  # Load a fresh canonical view before time-series assertions.
  page.goto(BASE);ready(page);page.locator('#uxFullAnalysis>summary').click();pause(page)
  check('All lens trends have the same 100% maximum',page.evaluate("['Being','Connecting','Doing'].every(l=>window.AISG_CHART_AUDIT['trend'+l].max===100)"))
  check('Trend charts include sample sizes and exact date tables',page.locator('#trendBeing .cv-data').count()==1 and page.locator('#trendBeing .cv-sample').count()>0)
  check('First and last trend labels stay inside plot edges',page.locator('#trendDoing .cv-value').first.get_attribute('text-anchor')=='start' and page.locator('#trendDoing .cv-value').last.get_attribute('text-anchor')=='end')
  page.locator('.trend-grid').screenshot(path=str(OUT/'trends-desktop.png'))
  page.locator('[data-ux-category="classroom"]').click();pause(page);page.locator('[data-ux-page="coverage"]').click();pause(page)
  weeks=page.evaluate('window.AISG_CHART_AUDIT.monthlyChart.weeks')
  check('Every intervening week is retained',all((__import__('datetime').date.fromisoformat(b['start'])-__import__('datetime').date.fromisoformat(a['start'])).days==7 for a,b in zip(weeks,weeks[1:])))
  check('Weekly totals reconcile to selected observations',sum(w['count'] for w in weeks)==306)
  check('Latest available week is explicitly partial',weeks[-1]['partial'])
  page.locator('#comparePrevious').check();pause(page)
  check('Previous-year comparison joins all current week keys',page.evaluate("window.AISG_CHART_AUDIT.monthlyChart.weeks.length===window.AISG_CHART_AUDIT.monthlyChart.previous.length&&window.AISG_CHART_AUDIT.monthlyChart.weeks.every((w,i)=>w.key===window.AISG_CHART_AUDIT.monthlyChart.previous[i].key)"))
  page.locator('#monthlyChart').screenshot(style='.app-header{visibility:hidden!important}',path=str(OUT/'weekly-desktop.png'))
  page.locator('#coverageChart [data-cv-index]').nth(1).click();pause(page)
  check('Coverage bucket opens named faculty without a performance score',page.locator('#coverageChart .cv-coverage-members button').count()>0)
  expect(page.locator('#timeChart')).to_contain_text('Equal thirds are not a target')
  check('Sampling chart offers counts and a data table',page.locator('#timeChart .cv-data table tbody tr').count()>=6)
  page.locator('[data-ux-page="mtss"]').click();pause(page)
  expect(page.locator('#mtssStudentExperience')).to_contain_text('not a share of students')
  check('MTSS feedback is independent indicators, not a funnel',page.locator('#mtssFeedbackAction .mtss-feedback-flow').count()==0 and page.locator('#mtssFeedbackAction .cv-bar-row').count()==4)
  expect(page.locator('#mtssFeedbackAction')).to_contain_text('full observation narrative')
  page.locator('#mtssStudentExperience').screenshot(style='.app-header{visibility:hidden!important}',path=str(OUT/'mtss-desktop.png'))
  page.locator('[data-ux-category="faculty"]').click();pause(page);page.locator('[data-ux-page="plcs"]').click();pause(page)
  check('PLC heatmap uses full facet headings',page.locator('#plcMatrix thead').inner_text().find('Personalization')>=0)
  check('PLC heatmap supplies fractions and limited-evidence labels',page.locator('#plcMatrix .cv-heat-cell small').count()>0 and page.locator('#plcMatrix .cv-limited').count()>0)
  page.locator('#plcMatrix').screenshot(style='.app-header{visibility:hidden!important}',path=str(OUT/'plc-matrix-desktop.png'))
  page.locator('[data-ux-category="admin"]').click();pause(page)
  check('Observer heatmap describes recorded patterns rather than agreement', 'not observer rankings' in page.locator('#observerCalibration').inner_text())
  check('All heatmap text colours pass calculated 4.5:1 contrast',page.evaluate("(()=>{const hex=x=>'#'+x.match(/\\d+/g).slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('');return [...document.querySelectorAll('.cv-heat-cell')].every(e=>{const c=getComputedStyle(e);return AISG_CHART_MATH.contrast(hex(c.backgroundColor),hex(c.color))>=4.5;});})()"))
  # Keyboard access and responsive reflow.
  page.locator('#observerCalibration .cv-table-scroll').focus();check('Scrollable tables accept keyboard focus',page.locator('#observerCalibration .cv-table-scroll').evaluate('e=>e===document.activeElement'))
  mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);mp=mobile.new_page();mp.on('pageerror',lambda e:errors.append(str(e)));mp.goto(BASE);ready(mp)
  for tab in ['growth','facets','coverage','mtss','plcs','admin']:
   mp.evaluate('(tab)=>window.AISG_GROWTH_BRIDGE.goTo(tab)',tab);pause(mp)
   check('No page overflow on mobile: '+tab,mp.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  mp.evaluate("window.AISG_GROWTH_BRIDGE.goTo('growth')");pause(mp);mp.locator('#growthViewMount').screenshot(path=str(OUT/'growth-mobile.png'))
  page.set_viewport_size({'width':720,'height':900});page.evaluate("window.AISG_GROWTH_BRIDGE.goTo('facets')");pause(page)
  check('Narrow desktop layout supports a zoom-equivalent viewport',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  check('No uncaught chart or application errors',not errors)
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors},indent=2));print('COMPLETE',len(checks),'checks',flush=True)
 except Exception:
  page.screenshot(path=str(OUT/'failure.png'),full_page=True);(OUT/'failure.json').write_text(json.dumps({'checks':checks,'errors':errors,'url':page.url},indent=2));raise
 finally:browser.close();server.shutdown()
