"""Data audit including zero-valued categories; no spreadsheet exports modified."""
import csv,json,re
from pathlib import Path
from collections import Counter
root=Path(__file__).resolve().parents[1]
g=json.loads((root/'data/faculty-goals.json').read_text())
s=json.loads((root/'data/growth-summary.json').read_text())
rows=g['rows'];assert len(rows)==108
assert len({r['email'].lower() for r in rows})==108
assert Counter(r['division'] for r in rows)=={'Elementary':54,'Secondary':54}
obs={}
with (root/'data/observations-full.csv').open(encoding='utf-8-sig',newline='') as f:
 for row in csv.DictReader(f):
  d=row['Date'].split('/')
  if len(d)!=3 or int(d[2])!=2026 or int(d[0])<8:continue
  division='Elementary' if 'elementary' in row['Division'].lower() else 'Secondary'
  obs.setdefault(row['Email'].strip().lower(),set()).add(division)
for r in rows:
 assert r['division'] in obs.get(r['email'],set())
 assert all(r.get(k) for k in ['faculty','domain','facet','goal'])
for d in ['All','Elementary','Secondary']:
 cohort=rows if d=='All' else [r for r in rows if r['division']==d]
 expected=s['byDivision'][d]
 actual=Counter(r['facet'] for r in cohort)
 assert actual==Counter(expected['facetCounts'])
 domains=Counter((m.group(1) if (m:=re.match(r'^\s*([1-4])\s*[a-e]?\s*\.',r['domain'])) else 'other') for r in cohort)
 assert domains==Counter(expected['domainCounts']), (d,domains,expected['domainCounts'])
 assert Counter(r['domain'] for r in cohort)==Counter(expected['competencyCounts'])
assert s['observationRosterCount']==len(obs)==109
print('PASS: 108 unique faculty goals, 54 each division, observed faculty identity, facets, domains and competencies.')
