"""Append only the twelve missing observations in the authorized October window."""
from pathlib import Path
from collections import Counter
from datetime import datetime, date
import base64, bz2, csv, hashlib, io, json, re

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'data/observations-full.csv'
AUDIT = ROOT / 'data/refresh-20261022.json'
BASE_SHA256 = '4ea66d8f96ce272e30bcdbbe8dee980782fb26a4295bc565f52b469bf3bf89e2'
NEW_SHA256 = 'ee892516de8634296a7dc5a8232841729dbbb034be9793d1bea32ce6690fd0f8'
PAYLOAD_SHA256 = '0f032fb2fa5d54f7ccfcdb75c4191c16dd568430aa62a81ca0296526ed995aa8'
SOURCE_SHA256 = '3d5141f01d89783852919b6ec11d3a512f0baac0ca11ff418ce6df333185fc74'
EXCLUDED = {'Silky Vyas', 'Santisha Sonilal'}
START, END = date(2026, 10, 16), date(2026, 10, 22)
sha = lambda b: hashlib.sha256(b).hexdigest()
parse_date = lambda r: datetime.strptime(r['Date'], '%m/%d/%Y').date()

def main():
    original = TARGET.read_bytes()
    if sha(original) == NEW_SHA256 and AUDIT.exists():
        print('Already applied: twelve observations are present; no files changed.')
        return
    assert sha(original) == BASE_SHA256, 'The published CSV changed; reconcile before importing.'
    pieces = [ROOT / f'maintenance/observations-20261022-{i}.b64' for i in (1, 2, 3)]
    encoded = ''.join(p.read_text(encoding='ascii').strip() for p in pieces)
    payload = bz2.decompress(base64.b64decode(encoded, validate=True))
    assert sha(payload) == PAYLOAD_SHA256, 'Import payload checksum mismatch.'
    document = json.loads(payload)
    reader = csv.DictReader(io.StringIO(original.decode('utf-8-sig'), newline=''))
    old = list(reader)
    fields = reader.fieldnames
    assert document['fieldnames'] == fields, 'Column schema mismatch.'
    new = document['rows']
    assert len(old) == 829 and len(new) == 12
    ids = {r['ID'] for r in old}
    powers = {r['__PowerAppsId__'].strip() for r in old if r['__PowerAppsId__'].strip()}
    assert len(ids) == len(old)
    for r in new:
        assert set(r) == set(fields)
        assert r['ID'] and r['ID'] not in ids, 'Existing or duplicate observation ID.'
        power = r['__PowerAppsId__'].strip()
        assert not power or power not in powers, 'Duplicate PowerApps record.'
        assert START <= parse_date(r) <= END, 'Observation outside the requested date window.'
        assert r['Observing'].strip() not in EXCLUDED, 'Excluded faculty cannot be imported.'
        assert '@' in r['Email'] and r['Observer'].strip()
        ids.add(r['ID'])
        if power: powers.add(power)
    by_date = Counter(parse_date(r).isoformat() for r in new)
    by_division = Counter('Elementary' if 'elementary' in r['Division'].lower() else 'Secondary' for r in new)
    assert by_date == {'2026-10-19': 2, '2026-10-20': 2, '2026-10-21': 8}
    assert by_division == {'Elementary': 3, 'Secondary': 9}
    buffer = io.StringIO(newline='')
    csv.DictWriter(buffer, fieldnames=fields, lineterminator='\n').writerows(new)
    updated = original + (b'' if original.endswith(b'\n') else b'\n') + buffer.getvalue().encode('utf-8')
    assert updated[:len(original)] == original, 'Historical bytes changed.'
    assert sha(updated) == NEW_SHA256, 'Final CSV checksum mismatch.'
    merged = list(csv.DictReader(io.StringIO(updated.decode('utf-8'), newline='')))
    assert merged[:len(old)] == old and merged[len(old):] == new
    assert len(merged) == len({r['ID'] for r in merged}) == 841
    audit = {}
    for year in ('2025-26', '2026-27'):
        y = int(year[:4])
        cohort = [r for r in merged if date(y, 8, 1) <= parse_date(r) < date(y + 1, 8, 1)]
        dates = [parse_date(r) for r in cohort]
        audit[year] = dict(
            observations=len(cohort), faculty=len({r['Email'].strip().lower() for r in cohort}),
            responses=sum(bool(r['Response'].strip()) for r in cohort),
            elementary=sum('elementary' in r['Division'].lower() for r in cohort),
            secondary=sum('secondary' in r['Division'].lower() for r in cohort),
            beginning=sum(r['TimeOfClass']=='Beginning' for r in cohort),
            middle=sum(r['TimeOfClass']=='Middle' for r in cohort),
            end=sum(r['TimeOfClass']=='End' for r in cohort),
            minDate=int(min(dates).strftime('%Y%m%d')), maxDate=int(max(dates).strftime('%Y%m%d')))
    assert audit['2025-26']['observations'] == 535
    assert audit['2026-27']['observations'] == 306 and audit['2026-27']['faculty'] == 109
    index = ROOT / 'index.html'
    html = index.read_text(encoding='utf-8')
    pattern = r'window\.OBS_PUBLIC_DATA=(\{[^\r\n]+\});'
    match = re.search(pattern, html)
    assert match, 'Missing existing inline observation audit.'
    metadata = json.loads(match[1])
    assert metadata['audit']['2025-26'] == audit['2025-26'], 'Historical audit changed.'
    metadata.update(audit=audit, sourceRows=len(merged))
    html = html[:match.start(1)] + json.dumps(metadata, ensure_ascii=False, separators=(',', ':')) + html[match.end(1):]
    old_url = './data/observations-full.csv?v=20261019-append-missing'
    assert html.count(old_url) == 1, 'Unexpected observation loader revision.'
    html = html.replace(old_url, './data/observations-full.csv?v=20261022-append-missing')
    report = dict(
        window_start_inclusive=START.isoformat(), window_end_inclusive=END.isoformat(),
        data_through='2026-10-21', source_file='Observation_final(Sheet1) (11).csv',
        source_rows=848, window_rows=16, already_present_window_rows=4, added_rows=12,
        added_by_date=dict(sorted(by_date.items())), added_by_division=dict(by_division),
        added_ids=[r['ID'] for r in new], updated_existing_rows=0, removed_rows=0,
        preserved_rows=len(old), existing_csv_prefix_bytes=len(original),
        existing_csv_prefix_byte_identical=True, baseline_data_sha256=sha(original),
        data_sha256=sha(updated), source_sha256=SOURCE_SHA256,
        skipped_before_window=3, standing_exclusions_not_reintroduced=4,
        preserved_existing_source_differences=71, faculty_goals_unchanged=True, audit=audit)
    TARGET.write_bytes(updated)
    index.write_text(html, encoding='utf-8')
    AUDIT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'added':12, 'by_date':dict(by_date), 'by_division':dict(by_division),
                      'total':841, 'current_year':306, 'latest':'2026-10-21',
                      'preserved_byte_identically':829, 'goals_unchanged':True}, indent=2))

if __name__ == '__main__':
    main()
