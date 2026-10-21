from pathlib import Path
p=Path('ux-refresh.js');s=p.read_text()
a="    if(filterOpen)shell?.scrollIntoView({block:'nearest',behavior:'smooth'});"
assert s.count(a)==1
s=s.replace(a,a+"\n    window.AISG_NAV?.schedule('replace');")
p.write_text(s)
p=Path('growth.js');s=p.read_text()
a="function setPane(name){if(!['facets','domains','goals'].includes(name))return;local.pane=name;renderGrowth();}"
assert s.count(a)==1
s=s.replace(a,"function setPane(name){if(!['facets','domains','goals'].includes(name))return;local.pane=name;renderGrowth();window.AISG_NAV?.schedule();}")
p.write_text(s)
p=Path('tests/reflection-browser.py');s=p.read_text()
a="        check('Closing record restores previous facet, division and observation period',page.evaluate(\"window.AISG_GROWTH_BRIDGE.getState().division==='Secondary'&&window.AISG_GROWTH_BRIDGE.getState().period==='30'\"))"
assert s.count(a)==1
s=s.replace(a,a+"\n        expect(page.locator('#uxOriginalFilters')).not_to_be_visible()\n        check('Returning from a record preserves the closed filter panel',True)")
p.write_text(s)
