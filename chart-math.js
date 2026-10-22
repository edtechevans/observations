/* Pure, testable chart calculations. Dates are UTC; no source records are changed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AISG_CHART_MATH=api;})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const DAY=86400000;
  const date=v=>v instanceof Date?new Date(v.getTime()):new Date(String(v).slice(0,10)+'T00:00:00Z');
  const iso=v=>date(v).toISOString().slice(0,10);
  const add=(v,n)=>new Date(+date(v)+n*DAY);
  const monday=v=>{const d=date(v);return add(d,-(d.getUTCDay()+6)%7);};
  const startYear=year=>new Date(Date.UTC(Number(String(year).slice(0,4)),7,1));
  const anchor=year=>monday(startYear(year));
  const week=(v,year)=>Math.floor((+monday(v)-+anchor(year))/(7*DAY));
  const pct=(n,d)=>d>0?100*n/d:null;
  const range=(a,b)=>[a,b].map(iso).join(' - ');
  function extent(rows){const ds=rows.map(r=>r.date).filter(Boolean).map(date).filter(d=>Number.isFinite(+d));return ds.length?{start:new Date(Math.min(...ds)),end:new Date(Math.max(...ds))}:null;}
  function weekly(rows,year,start,end){
    if(!start||!end||+date(start)>+date(end))return [];
    const count=new Map();for(const r of rows){const d=date(r.date);if(d<date(start)||d>date(end))continue;const key=week(d,year);count.set(key,(count.get(key)||0)+1);}
    const out=[];for(let m=monday(start);m<=date(end);m=add(m,7)){
      const from=new Date(Math.max(+m,+date(start))),to=new Date(Math.min(+add(m,6),+date(end))),key=week(m,year);
      out.push({key,start:iso(m),end:iso(add(m,6)),from:iso(from),to:iso(to),partial:+from>+m||+to<+add(m,6),count:count.get(key)||0});
    }return out;
  }
  function alignPrevious(current,previousRows,previousYear,available){
    const a=anchor(previousYear),schoolStart=startYear(previousYear),schoolEnd=add(startYear(Number(String(previousYear).slice(0,4))+1),-1);
    return current.map(w=>{
      const m=add(a,w.key*7),from=new Date(Math.max(+add(m,(+date(w.from)-+date(w.start))/DAY),+schoolStart)),to=new Date(Math.min(+add(m,(+date(w.to)-+date(w.start))/DAY),+schoolEnd));
      const known=available&&from>=date(available.start)&&to<=date(available.end)&&from<=to;
      const count=known?previousRows.filter(r=>date(r.date)>=from&&date(r.date)<=to).length:null;
      return {key:w.key,from:iso(from),to:iso(to),count,available:Boolean(known)};
    });
  }
  function windows(rows,start,end,days=28,maxWindows=6){
    if(!start||!end||+date(start)>+date(end))return [];
    const result=[];let to=date(end);
    while(to>=date(start)&&result.length<maxWindows){const raw=add(to,1-days),from=new Date(Math.max(+raw,+date(start)));result.push({start:iso(from),end:iso(to),partial:+from>+raw,rows:rows.filter(r=>date(r.date)>=from&&date(r.date)<=to)});to=add(raw,-1);}
    return result.reverse();
  }
  function segments(values){const result=[];let cur=[];values.forEach((v,i)=>{if(v===null||v===undefined||!Number.isFinite(Number(v))){if(cur.length)result.push(cur);cur=[];}else cur.push({index:i,value:Number(v)});});if(cur.length)result.push(cur);return result;}
  const lum=hex=>{const v=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
  function heat(value,limited=false){const t=limited?0:Math.max(0,Math.min(1,value/100)),lo=[241,246,250],hi=[17,50,97],rgb=lo.map((x,i)=>Math.round(x+(hi[i]-x)*t)),bg='#'+rgb.map(x=>x.toString(16).padStart(2,'0')).join('');const navy='#122a43',light='#ffffff';return {background:bg,color:contrast(bg,navy)>=4.5?navy:contrast(bg,light)>=4.5?light:'#000000'};}
  return {DAY,date,iso,add,monday,anchor,week,pct,range,extent,weekly,alignPrevious,windows,segments,contrast,heat};
});
