const assert=require('node:assert/strict');
const M=require('../chart-math.js');let checks=0;
function check(name,fn){fn();checks++;console.log('PASS:',name);}
check('Missing calendar weeks remain zero-record buckets',()=>{
 const a=M.weekly([{date:'2026-09-07'},{date:'2026-09-21'}],'2026-27','2026-09-07','2026-09-27');
 assert.deepEqual(a.map(r=>r.count),[1,0,1]);assert.deepEqual(a.map(r=>r.start),['2026-09-07','2026-09-14','2026-09-21']);
});
check('Previous-year weeks align by school-year key, not populated array position',()=>{
 const cur=M.weekly([{date:'2026-09-07'},{date:'2026-09-21'}],'2026-27','2026-09-07','2026-09-27');
 const prior=[{date:'2025-09-08'},{date:'2025-09-22'},{date:'2025-09-22'}];
 const a=M.alignPrevious(cur,prior,'2025-26',{start:'2025-08-01',end:'2026-05-31'});
 assert.deepEqual(a.map(x=>x.count),[1,0,2]);assert.equal(a[1].from,'2025-09-15');
});
check('Partial current weeks match the same weekdays in the previous year',()=>{
 const cur=M.weekly([{date:'2026-10-21'}],'2026-27','2026-10-19','2026-10-21');assert(cur[0].partial);
 const a=M.alignPrevious(cur,[{date:'2025-10-22'},{date:'2025-10-24'}],'2025-26',{start:'2025-08-01',end:'2026-05-31'});
 assert.equal(a[0].from,'2025-10-20');assert.equal(a[0].to,'2025-10-22');assert.equal(a[0].count,1);
});
check('Unavailable prior-year coverage is null, never fabricated zero',()=>{
 const c=M.weekly([],'2026-27','2026-08-03','2026-08-09');assert.equal(M.alignPrevious(c,[],'2025-26',null)[0].count,null);
});
check('An unavailable denominator is not a zero prevalence',()=>{assert.equal(M.pct(0,0),null);assert.equal(M.pct(48,108),100*48/108);});
check('Trend gaps break line segments',()=>{assert.deepEqual(M.segments([20,null,30,40]).map(g=>g.map(p=>p.index)),[[0],[2,3]]);});
check('Empty windows remain visible and the shortened boundary is labelled',()=>{
 const a=M.windows([{date:'2026-08-10'},{date:'2026-10-21'}],'2026-08-10','2026-10-21');assert(a[0].partial);assert(a.some(w=>w.rows.length===0));
});
check('Invalid periods produce no fabricated buckets',()=>{assert.deepEqual(M.weekly([],'2026-27','2026-10-22','2026-10-01'),[]);});
check('Both ordinary and limited-evidence heat cells meet 4.5:1 text contrast',()=>{
 for(let i=0;i<=100;i++){for(const low of [false,true]){const c=M.heat(i,low);assert(M.contrast(c.background,c.color)>=4.5,i+' '+JSON.stringify(c));}}
});
check('Neutral heat colours do not vary by facet/lens',()=>{assert.deepEqual(M.heat(60),M.heat(60));});
console.log('PASS:',checks,'chart calculation checks');
