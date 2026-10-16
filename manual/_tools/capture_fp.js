// 소방시설 설치 검토 시스템 매뉴얼 화면 캡처 — usage: node capture_fp.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 (영상용 좁은 화면: MM_VW=720 MM_VH=1280 MM_DSF=2) · serviceWorkers block · _marks.json · _example.json
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=+(process.env.MM_VW||1440),VH=+(process.env.MM_VH||900),DSF=+(process.env.MM_DSF||1.25),PORT=8976;
const HIDE='.a4-overlay.show{position:absolute!important;inset:auto!important;left:0!important;top:0!important;width:100%!important;height:auto!important;min-height:100%!important;overflow:visible!important} #pwa-banner,.pwa-banner,#pwa-install-btn,#sw-update-bar{display:none!important} .input-panel{position:static!important} *{animation:none!important;transition:none!important}';
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__find=sel=>{if(sel.startsWith('up:')){const [n,q]=sel.slice(3).split('|');let e=[...document.querySelectorAll(q)].find(__vis);for(let i=0;i<+n&&e;i++)e=e.parentElement;return e;}
 if(sel.startsWith('sec:')){const t=sel.slice(4);return [...document.querySelectorAll('.form-section')].find(b=>__vis(b)&&b.querySelector('.form-section-title').textContent.includes(t))||null;}
 if(sel.startsWith('fs:')){const t=sel.slice(3);return [...document.querySelectorAll('.facility-section')].find(b=>__vis(b)&&b.querySelector('.facility-sec-title').textContent.includes(t))||null;}
 if(sel.startsWith('card:')){const t=sel.slice(5);return [...document.querySelectorAll('.facility-card')].find(b=>__vis(b)&&b.querySelector('.fc-name').textContent===t)||null;}
 if(sel.startsWith('row:')){const t=sel.slice(4);return [...document.querySelectorAll('.form-row')].find(b=>__vis(b)&&b.textContent.includes(t))||null;}
 if(sel.startsWith('ck:')){return document.querySelector('.check-item[data-key="'+sel.slice(3)+'"]');}
 if(sel.startsWith('nth:')){const [q,i]=sel.slice(4).split('|');return [...document.querySelectorAll(q)].filter(__vis)[+i]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__EX={
 A:{cat:'office',sub:'off',v:{'total-area':12000,'floors-above':12,'floors-below':3,'m4-area':1000,'bm-area':1500,'bsum-area':4200,'f12-area':2200,'occupants':800,'pk-in':3000,'pk-under':3000,'elec':350,'max-floor-area':1100},c:['specialStair']},
 B:{cat:'welfare',sub:'wLiving',v:{'total-area':450,'floors-above':2,'max-floor-area':300},c:[]},
 C:{cat:'neighborhood',sub:'etcN',v:{'total-area':900,'floors-above':4,'floors-below':2,'bsum-area':300,'bm-area':150,'m4-area':200},c:[]},
 D:{cat:'tunnel',sub:'tun',v:{'tun-len':1200},c:[]},
 E:{cat:'culture',sub:'perf',v:{'total-area':2800,'floors-above':3,'occupants':420,'stage':260,'bm-area':0},c:['stageLow']}};
window.__ex=k=>{const C=__EX[k];const cs=document.getElementById('bld-category');cs.value=C.cat;cs.dispatchEvent(new Event('change'));document.getElementById('bld-subtype').value=C.sub;
 document.querySelectorAll('.form-input').forEach(e=>{e.value=''});for(const id in C.v)document.getElementById(id).value=C.v[id];
 document.querySelectorAll('.check-item.checked').forEach(e=>e.click());C.c.forEach(q=>document.querySelector('.check-item[data-key="'+q+'"]').click());document.getElementById('calc-btn').click();};
window.__help=i=>{document.querySelector('#help-fab .help-fab').click();document.querySelectorAll('.help-tab')[i].click();};
window.__helpClose=()=>document.getElementById('help-close').click();`;
const EXA="__ex('A')";
const SHOTS=[
 {id:'s01_overview',pre:EXA+";window.scrollTo(0,0)",clip:'viewport',m:[['nth:.tb|0','탭 3개'],['#mm-manual-btn','📘 매뉴얼'],['.sum-bar','요약 바'],['.input-panel','입력'],['.result-header','결과']]},
 {id:'s02_header',clip:'.hdr-shell',m:[['.hdr-h1','도구 이름 · Ver-5.2'],['#mm-manual-btn','📘 매뉴얼 — 탭 막대 끝'],['.hdr-right','별표 4 · 제36728호 · 2026. 10. 2.'],['.tab-bar-inner','탭 3개']]},
 {id:'s03_use',clip:'sec:용도 분류',m:[['up:1|#bld-category','대분류 31종 (별표 2)'],['#sub-type-row','세부 용도']]},
 {id:'s04_scale',clip:'sec:규모 정보',m:[['row:연면적','연면적'],['row:층수 (지상)','층수 — 지하층 제외'],['row:지하층 수','지하층 수'],['row:수용인원','수용인원'],['row:해당 용도 바닥면적','해당 용도 면적 — 비우면 연면적']]},
 {id:'s05_floor',clip:'sec:층별 바닥면적',m:[['row:가장 넓은 층','가장 넓은 층'],['row:4층 이상 층','4층 이상 층 최대'],['row:지하층 · 무창층 중','지하 · 무창층 최대'],['row:지하층 바닥면적 합계','지하층 합계'],['row:1층 + 2층','1 · 2층 합계']]},
 {id:'s06_park',clip:'sec:주차',m:[['row:건축물 내부 차고','내부 차고 · 주차'],['row:지하 차고','지하 차고 · 주차'],['row:옥상 차고','옥상 차고 · 주차'],['row:기계식','기계식 주차'],['row:전기실','전기실 등'],['row:계약전류','계약전류']]},
 {id:'s07_checks',clip:'sec:특수 조건',m:[['ck:kitchen','주방'],['ck:specialStair','특별피난계단 · 승강장'],['ck:co2','CO2 대상'],['ck:noMain','상수도 배수관 없음'],['ck:monitor24','24시간 감시']]},
 {id:'s08_reshead',clip:'up:1|.summary-row',post:null,m:[['.result-header','적용 법령 · 규모'],['.summary-row','총 · 의무 · 확인 · 분류'],['nth:.out-btn|0','A4 · PDF · JPG']],crop:'head'},
 {id:'s09_fs1',clip:'fs:소화설비',m:[['card:옥내소화전설비','조항 3개 병기'],['card:스프링클러설비','6층 · 1,000 ㎡ 층'],['card:물분무등소화설비','주차 · 전기실']]},
 {id:'s10_fs2',clip:'fs:경보설비',m:[['card:자동화재탐지설비','자동화재탐지'],['card:비상방송설비','비상방송 — v5.2.0 신설']]},
 {id:'s11_fs3',clip:'fs:피난구조설비',m:[['card:피난기구','피난기구 — 1 · 2층 · 11층 이상 제외'],['card:피난유도선','확인 — NFTC 장소'],['card:비상조명등','5층 · 3,000 ㎡']]},
 {id:'s12_fs5',clip:'fs:소화활동설비',m:[['card:제연설비','부속실 · 승강장'],['card:비상콘센트설비','11층 이상 · 지하 3층'],['card:무선통신보조설비','지하층 3,000 ㎡']]},
 {id:'s13_notes',clip:'nth:#result-content > .fc-reason|0',m:[]},
 {id:'s14_caseB',pre:"__ex('B')",clip:'#result-content',post:EXA,m:[['card:간이스프링클러설비','노유자 생활시설'],['card:자동화재속보설비','속보'],['card:피난기구','노유자 1 · 2층']]},
 {id:'s15_caseC',pre:"__ex('C')",clip:'up:1|.summary-row',crop:'head',post:EXA,m:[['.summary-row','지상 4 · 지하 2 — 스프링클러 없음']]},
 {id:'s16_caseD',pre:"__ex('D')",clip:'#result-content',post:EXA,m:[['card:옥내소화전설비','1,000 m'],['card:비상조명등','500 m']]},
 {id:'s17_caseE',pre:"__ex('E')",clip:'sec:용도별 추가',m:[['row:무대부','무대부 면적'],['row:영화상영관 용도 층','영화상영관 층']]},
 {id:'s18_a4bar',pre:EXA+";document.getElementById('res-a4-btn').click();window.scrollTo(0,0)",wait:1200,clip:'viewport',m:[['.a4-toolbar','A4 미리보기'],['#a4-pdf-btn','🖨 인쇄 · PDF'],['#a4-jpg-btn','🖼 JPG 저장']]},
 {id:'s19_a4page',pre:"document.querySelector('.a4-toolbar').style.visibility='hidden'",clip:'#a4-paper',post:"document.querySelector('.a4-toolbar').style.visibility='';document.getElementById('a4-close-btn').click()",m:[]},
 {id:'s20_help_use',pre:"__help(0)",wait:500,fixed:true,clip:'#help-modal',m:[]},
 {id:'s21_help_law1',pre:"__help(1)",wait:400,fixed:true,clip:'#help-modal',m:[]},
 {id:'s22_help_law2',pre:"__help(2)",wait:400,fixed:true,clip:'#help-modal',post:"__helpClose()",m:[]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{errs.push('dialog '+d.message());d.dismiss();});
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(1500);
 await pg.addStyleTag({content:HIDE});await pg.evaluate(HELP);await pg.waitForTimeout(300);
 const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||500);
  if(S.clip!=='viewport'&&!S.fixed){await pg.evaluate(c=>{const e=__find(c);if(e){window.scrollTo(0,e.getBoundingClientRect().top+scrollY-40);}},S.clip);await pg.waitForTimeout(400);}
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);const P=S.fixed?0:10;clip={x:Math.max(0,a.x-P),y:Math.max(0,a.y-P),width:a.w+2*P,height:a.h+2*P};
     if(S.crop==='head'){const sr=document.querySelector('.summary-row');const r=abs(sr);clip.height=r.y+r.h+10-clip.y;}}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sy=await pg.evaluate(()=>scrollY),sx=await pg.evaluate(()=>scrollX);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:Math.max(0,c.x-sx),y:Math.max(0,c.y-sy),width:Math.min(c.width,VW),height:Math.min(c.height,VH-Math.max(0,c.y-sy))}});}
  else{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(300);}
 }
 const EX=await pg.evaluate(()=>{const r={};for(const k of 'ABCDE'){__ex(k);r[k]={n:window._RD.uniq.length,req:window._RD.reqCnt,chk:window._RD.condCnt,f:window._RD.uniq.map(u=>[u.f,u.cs,u.t])};}__ex('A');return r;});
 fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(EX,null,1));
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true,locale:'ko-KR'});await setup(mctx);
 const mp=await mctx.newPage();await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(1500);await mp.addStyleTag({content:HIDE});await mp.evaluate(HELP);
 await mp.screenshot({path:path.join(out,'s23_mobile_main.png')});meta['s23_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(EXA);await mp.waitForTimeout(600);await mp.evaluate(()=>{const e=document.querySelector('.result-header');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s24_mobile_result.png')});meta['s24_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{const e=[...document.querySelectorAll('.facility-section')][3]||document.querySelector('.facility-section');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s25_mobile_cards.png')});meta['s25_mobile_cards']={w:390,h:844,marks:[]};
 const mob=await mp.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5||m.w<=0||m.h<=0)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 console.log(JSON.stringify({mobile:mob,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
