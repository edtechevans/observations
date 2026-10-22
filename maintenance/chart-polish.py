"""Final visual QA corrections, with exact anchors and no data edits."""
from pathlib import Path
p=Path('chart-views.js');s=p.read_text()
a="text-anchor=\"middle\">'+Math.round(v)+unit+'</text>'"
b="text-anchor=\"'+(i===0?'start':i===N-1?'end':'middle')+'\">'+Math.round(v)+unit+'</text>'"
assert s.count(a)==1, 'Trend value-label anchor changed'
s=s.replace(a,b)
a="text-anchor=\"middle\">'+E(String(l).split('|')[0])+'</text>'"
b="text-anchor=\"'+(line&&i===0?'start':line&&i===N-1?'end':'middle')+'\">'+E(String(l).split('|')[0])+'</text>'"
assert s.count(a)==1, 'Trend date-label anchor changed'
s=s.replace(a,b)
a="text-anchor=\"middle\">n='+cfg.samples[i]+'</text>'"
b="text-anchor=\"'+(line&&i===0?'start':line&&i===N-1?'end':'middle')+'\">n='+cfg.samples[i]+'</text>'"
assert s.count(a)==1, 'Trend sample-label anchor changed'
s=s.replace(a,b);p.write_text(s)
p=Path('chart-standards.css');s=p.read_text()
s+='\n/* Keep categorical lens labels distinct from the numerical totals. */\n.growth-lens .growth-lens-title{display:block;margin-bottom:4px}\n.growth-lens strong{display:block;font-size:26px;line-height:1.2;margin-bottom:5px;font-variant-numeric:tabular-nums}\n'
p.write_text(s)
p=Path('index.html');s=p.read_text()
for asset in ['chart-math.js','chart-views.js','chart-standards.css']:
 a=asset+'?v=20261022-charts1';b=asset+'?v=20261022-charts2'
 assert s.count(a)==1,(asset,s.count(a))
 s=s.replace(a,b)
p.write_text(s)
p=Path('tests/charts-browser.py');s=p.read_text()
a="  check('Trend charts include sample sizes and exact date tables',page.locator('#trendBeing .cv-data').count()==1 and page.locator('#trendBeing .cv-sample').count()>0)"
b=a+"\n  check('First and last trend labels stay inside plot edges',page.locator('#trendDoing .cv-value').first.get_attribute('text-anchor')=='start' and page.locator('#trendDoing .cv-value').last.get_attribute('text-anchor')=='end')"
assert s.count(a)==1
s=s.replace(a,b)
# Element screenshots should not acquire a floating app header mid-chart.
for target in ['growthViewMount','facets','monthlyChart','mtssStudentExperience','plcMatrix']:
 old=f"page.locator('#{target}').screenshot(path="
 if old in s:s=s.replace(old,f"page.locator('#{target}').screenshot(style='.app-header{{visibility:hidden!important}}',path=")
p.write_text(s)
