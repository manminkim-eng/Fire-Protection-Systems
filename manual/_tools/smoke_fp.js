// 화면 동작 점검 — usage: node smoke_fp.js <repoDir> <outDir>
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const CASES=[
 {name:'업무 12층',cat:'office',sub:'off',v:{'total-area':12000,'floors-above':12,'floors-below':3,'m4-area':1000,'bm-area':1500,'bsum-area':4200,'f12-area':2200,'occupants':800,'pk-in':3000,'pk-under':3000,'elec':350},c:['specialStair'],
  expect:['스프링클러설비','비상방송설비','제연설비','무선통신보조설비','비상콘센트설비'],absent:['간이스프링클러설비']},
 {name:'노유자 생활시설 2층',cat:'welfare',sub:'wLiving',v:{'total-area':450,'floors-above':2,'max-floor-area':300},c:[],expect:['간이스프링클러설비','자동화재탐지설비','자동화재속보설비','피난기구'],absent:['스프링클러설비']},
 {name:'지상4 지하2',cat:'neighborhood',sub:'etcN',v:{'total-area':900,'floors-above':4,'floors-below':2,'bsum-area':300,'bm-area':150},c:[],expect:['비상경보설비','연결살수설비'],absent:['스프링클러설비','비상방송설비']},
 {name:'터널 1,200 m',cat:'tunnel',sub:'tun',v:{'tun-len':1200},c:[],expect:['옥내소화전설비','자동화재탐지설비','비상콘센트설비'],absent:['피난기구']},
];
const run=async(pg,C)=>{await pg.selectOption('#bld-category',C.cat);await pg.selectOption('#bld-subtype',C.sub);
 await pg.evaluate(v=>{document.querySelectorAll('.form-input').forEach(e=>{e.value=''});for(const k in v){document.getElementById(k).value=v[k];}},C.v);
 await pg.evaluate(cs=>{document.querySelectorAll('.check-item.checked').forEach(e=>e.click());cs.forEach(k=>document.querySelector('.check-item[data-key="'+k+'"]').click());},C.c);
 await pg.click('#calc-btn');await pg.waitForTimeout(300);
 return pg.evaluate(()=>({names:window._RD.uniq.map(u=>u.f),req:window._RD.reqCnt,chk:window._RD.condCnt,cards:document.querySelectorAll('.facility-card').length}));};
(async()=>{const s=await server(repo,8975);const b=await chromium.launch();const R=[];
 for(const [w,h,d] of [[1440,900,1],[390,844,2]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',dl=>{errs.push('dialog '+dl.message());dl.dismiss();});
  await pg.goto('http://127.0.0.1:8975/index.html');await pg.waitForTimeout(1200);
  for(const C of CASES){const r=await run(pg,C);R.push({w,case:C.name,ok:C.expect.every(n=>r.names.includes(n))&&C.absent.every(n=>!r.names.includes(n))&&r.cards===r.names.length,n:r.names.length,req:r.req,chk:r.chk,miss:C.expect.filter(n=>!r.names.includes(n)),extra:C.absent.filter(n=>r.names.includes(n))});}
  const show=await pg.evaluate(()=>{const el=document.getElementById('tun-len').closest('.form-row');return getComputedStyle(el).display});
  await run(pg,CASES[0]);await pg.screenshot({path:path.join(out,`result_${w}.png`),fullPage:true});
  await pg.click('#res-a4-btn');await pg.waitForTimeout(800);await pg.screenshot({path:path.join(out,`a4_${w}.png`),fullPage:true});
  const a4=await pg.evaluate(()=>({rows:document.querySelectorAll('#a4-paper .a4-table tbody tr').length,txt:document.getElementById('a4-paper').innerText.includes('제36728호')}));
  await pg.click('#a4-close-btn');await pg.waitForTimeout(300);
  const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  const man=await pg.evaluate(()=>{const a=document.getElementById('mm-manual-btn');return a&&a.parentElement.className+'|'+getComputedStyle(a).color;});
  R.push({w,tunnelFieldHiddenForOffice:show==='none',a4,ov,man,errs});await ctx.close();}
 console.log(JSON.stringify(R));await b.close();s.close();})();
