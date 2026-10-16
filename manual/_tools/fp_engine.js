/* ═══════════════════════════════════════════════════════════════════════
   FPENG v5.2.0 — 소방시설 설치 및 관리에 관한 법률 시행령 [별표 4] 판정 엔진 (순수 함수)
   근거: 대통령령 제36728호(2026. 9. 29. 공포 · 2026. 10. 2. 시행) 별표 4 <개정 2026. 9. 29.> — LawMCP 원문 대조 2026-10-17
   화면 · A4 · 검증 도구(manual/_tools/verify_fp.py)가 이 함수 하나를 쓴다.
   층수 = 지상 층수(건축법 시행령 제119조제1항제9호 — 지하층은 층수에 산입하지 않음). 「지하층을 포함하는 층수」는 지상 + 지하.
   반환: [{f:소방시설, g:분류, c:조항, s:적용 범위, r:사유, t:'req'|'chk'}] — req = 원문 조건 충족(의무), chk = 화재안전기준 · 행정안전부령 · 협의로 확인할 것
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  function n(v) { v = +v; return isFinite(v) && v > 0 ? v : 0; }
  function F(v) { return (+v).toLocaleString('ko-KR'); }
  function check(D) {
    var cat = D.cat || '', sub = D.sub || '';
    var A = n(D.A), Fa = n(D.Fa), Fb = n(D.Fb), maxF = n(D.maxF), m4 = Fa >= 4 ? n(D.m4) : 0, bm = n(D.bm), bSum = n(D.bSum);
    var f12 = n(D.f12), useA = n(D.useA) || A, bUse = n(D.bUse), Oc = n(D.Oc);
    var pkIn = n(D.pkIn), pkUnder = n(D.pkUnder), pkRoof = n(D.pkRoof), mech = n(D.mech), elec = n(D.elec);
    var stage = n(D.stage), cinemaA = n(D.cinemaA), tunL = n(D.tunL), workers = n(D.workers), sc = n(D.sc);
    var amp = n(D.amp), gasT = n(D.gasT), hh = n(D.hh), rackA = n(D.rackA), ceil = n(D.ceil);
    var x = function (k) { return !!D[k]; };
    var R = [];
    function add(f, g, c, s, r, t) { R.push({ f: f, g: g, c: c, s: s, r: r, t: t || 'req' }); }
    var is = function () { for (var i = 0; i < arguments.length; i++) if (cat === arguments[i]) return true; return false; };
    var sb = function () { for (var i = 0; i < arguments.length; i++) if (sub === arguments[i]) return true; return false; };
    var gas = cat === 'hazmat' && sub === 'gas', tunnel = cat === 'tunnel', ug = cat === 'underground';
    var barn = cat === 'animal' && sub === 'barn';
    var aptEtc = cat === 'apartment' && sub === 'apt';
    var rowMulti = cat === 'apartment' && sb('row', 'multi');
    var dorm = (cat === 'apartment' && sub === 'dorm') || (cat === 'education' && sub === 'eduDorm') || (cat === 'training' && sub === 'tDorm');
    var hotelAll = cat === 'hotel';
    var welfareLiving = cat === 'welfare' && sub === 'wLiving';
    var tLodge = cat === 'training' && sub === 'tLodge';
    var hospGroup = cat === 'medical' && sb('hosp', 'nursing');
    var psyRehab = cat === 'medical' && sb('psych', 'rehab');
    var midwife = cat === 'neighborhood' && sub === 'midwife';
    var logis = cat === 'warehouse' && sub === 'logis';
    var storeNotLogis = cat === 'warehouse' && sub !== 'logis';
    var facWh = is('factory', 'warehouse');
    var ess = cat === 'power' && sb('ess', 'essUps');
    var market = cat === 'retail' && sub === 'market';
    var mall = cat === 'retail' && sub === 'mall';
    var um = cat === 'undermall';
    var woodTreasure = cat === 'heritage' && sub === 'woodTreasure';
    var nationalDefense = cat === 'correctional' && sub === 'military';
    var G1 = '소화설비', G2 = '경보설비', G3 = '피난구조설비', G4 = '소화용수설비', G5 = '소화활동설비';

    /* ── 1. 소화설비 ── */
    // 가. 소화기구
    if (A >= 33) add('소화기구', G1, '제1호 가목 1)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 33 ㎡' + (cat === 'welfare' ? ' — 노유자 시설은 투척용 소화용구 등으로 소화기 수량의 1/2 이상 대체 가능' : ''));
    else if (gas || ess || cat === 'heritage') add('소화기구', G1, '제1호 가목 2)', '해당 시설', '가스시설 · 전기저장시설 · 국가유산');
    else if (tunnel) add('소화기구', G1, '제1호 가목 3)', '터널', '터널');
    else if (ug) add('소화기구', G1, '제1호 가목 4)', '지하구', '지하구');
    // 나. 자동소화장치 — 후드 · 덕트 주방
    if (x('kitchen')) {
      if (aptEtc || (cat === 'office' && sub === 'officetel')) add('주거용 주방자동소화장치', G1, '제1호 나목 1)', '모든 층의 주방', '아파트등 · 오피스텔 — 후드 · 덕트 설치 주방');
      if (mall && x('mallRest')) add('상업용 주방자동소화장치', G1, '제1호 나목 2)가)', '해당 주방', '대규모점포 입점 일반음식점');
      if (x('canteen')) add('상업용 주방자동소화장치', G1, '제1호 나목 2)나)', '해당 주방', '식품위생법 제2조제12호 집단급식소');
    }
    // 다. 옥내소화전 — 가스시설 · 지하구 · 무인변전소(원격) 제외
    var noIndoor = gas || ug || (cat === 'office' && sub === 'substation');
    var indoor = false;
    if (!noIndoor) {
      if (A >= 3000 && !tunnel) { indoor = true; add('옥내소화전설비', G1, '제1호 다목 1)가)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 3,000 ㎡'); }
      if (bm >= 600 && !barn) { indoor = true; add('옥내소화전설비', G1, '제1호 다목 1)나)', '모든 층', '지하층 · 무창층 바닥면적 ' + F(bm) + ' ㎡ ≥ 600 ㎡'); }
      if (m4 >= 600) { indoor = true; add('옥내소화전설비', G1, '제1호 다목 1)다)', '모든 층', '4층 이상 층 바닥면적 ' + F(m4) + ' ㎡ ≥ 600 ㎡'); }
      var ic2 = is('neighborhood', 'retail', 'transport', 'medical', 'welfare', 'office', 'hotel', 'leisure', 'factory', 'warehouse', 'auto', 'broadcast', 'power', 'funeral', 'mixed') || nationalDefense;
      if (!indoor && ic2) {
        if (A >= 1500) { indoor = true; add('옥내소화전설비', G1, '제1호 다목 2)가)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 1,500 ㎡'); }
        if (bm >= 300) { indoor = true; add('옥내소화전설비', G1, '제1호 다목 2)나)', '모든 층', '지하층 · 무창층 바닥면적 ' + F(bm) + ' ㎡ ≥ 300 ㎡'); }
        if (m4 >= 300) { indoor = true; add('옥내소화전설비', G1, '제1호 다목 2)다)', '모든 층', '4층 이상 층 바닥면적 ' + F(m4) + ' ㎡ ≥ 300 ㎡'); }
      }
      if (pkRoof >= 200) add('옥내소화전설비', G1, '제1호 다목 3)', '옥상 차고 · 주차장 부분', '옥상 차고 · 주차장 ' + F(pkRoof) + ' ㎡ ≥ 200 ㎡');
      if (tunnel && tunL >= 1000) add('옥내소화전설비', G1, '제1호 다목 4)가)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 1,000 m');
      if (tunnel) add('옥내소화전설비', G1, '제1호 다목 4)나)', '터널', '예상교통량 · 경사도 등으로 행정안전부령이 정하는 터널이면 설치', 'chk');
      if (!indoor && facWh && sc >= 750) add('옥내소화전설비', G1, '제1호 다목 5)', '모든 층', '특수가연물 ' + F(sc) + '배 ≥ 750배');
    }
    // 라. 스프링클러 — 가스시설 · 지하구 제외
    if (!gas && !ug) {
      if (Fa >= 6) add('스프링클러설비', G1, '제1호 라목 1)', '모든 층', '층수 ' + F(Fa) + '층 ≥ 6층 (지하층 제외) — 기존 아파트등 리모델링 · 스프링클러 없는 기존 대상물 용도변경은 단서 확인');
      if ((dorm && cat !== 'apartment') || cat === 'mixed') { if (A >= 5000) add('스프링클러설비', G1, '제1호 라목 2)', '모든 층', (cat === 'mixed' ? '복합건축물' : '교육연구 · 수련시설 내 기숙사') + ' 연면적 ' + F(A) + ' ㎡ ≥ 5,000 ㎡'); }
      var sp3 = (cat === 'culture' && sub !== 'zoo') || (cat === 'religion' && sub !== 'religWood') || (cat === 'sports' && sub === 'sport');
      if (sp3) {
        if (Oc >= 100) add('스프링클러설비', G1, '제1호 라목 3)가)', '모든 층', '수용인원 ' + F(Oc) + '명 ≥ 100명');
        if (cat === 'culture' && sub === 'cinema' && cinemaA >= (x('cinemaLow') ? 500 : 1000)) add('스프링클러설비', G1, '제1호 라목 3)나)', '모든 층', '영화상영관 층 바닥면적 ' + F(cinemaA) + ' ㎡ ≥ ' + (x('cinemaLow') ? '500 ㎡(지하층 · 무창층)' : '1,000 ㎡'));
        if (stage >= (x('stageLow') ? 300 : 500)) add('스프링클러설비', G1, x('stageLow') ? '제1호 라목 3)다)' : '제1호 라목 3)라)', '모든 층', '무대부 ' + F(stage) + ' ㎡ ≥ ' + (x('stageLow') ? '300 ㎡(지하층 · 무창층 · 4층 이상)' : '500 ㎡'));
      }
      if ((cat === 'retail' || cat === 'transport' || logis) && (useA >= 5000 || Oc >= 500)) add('스프링클러설비', G1, '제1호 라목 4)', '모든 층', '판매 · 운수 · 물류터미널 바닥면적 합계 ' + F(useA) + ' ㎡' + (useA >= 5000 ? ' ≥ 5,000 ㎡' : '') + (Oc >= 500 ? ' · 수용인원 ' + F(Oc) + '명 ≥ 500명' : ''));
      var sp5 = midwife || (cat === 'medical' && sb('psych', 'hosp', 'nursing')) || cat === 'welfare' || tLodge || hotelAll;
      if (sp5 && useA >= 600) add('스프링클러설비', G1, '제1호 라목 5)', '모든 층', '해당 용도 바닥면적 합계 ' + F(useA) + ' ㎡ ≥ 600 ㎡');
      if (storeNotLogis && useA >= 5000) add('스프링클러설비', G1, '제1호 라목 6)', '모든 층', '창고시설 바닥면적 합계 ' + F(useA) + ' ㎡ ≥ 5,000 ㎡');
      if (Math.max(bm, m4) >= 1000 && !barn) add('스프링클러설비', G1, '제1호 라목 7)', '해당 층', '지하층 · 무창층 · 4층 이상 층 바닥면적 ' + F(Math.max(bm, m4)) + ' ㎡ ≥ 1,000 ㎡');
      var rack8 = cat === 'warehouse' && rackA >= 1500 && ceil > 10;
      if (rack8) add('스프링클러설비', G1, '제1호 라목 8)', '모든 층', '랙식 창고 — 천장 ' + F(ceil) + ' m > 10 m · 랙 부분 ' + F(rackA) + ' ㎡ ≥ 1,500 ㎡');
      if (facWh && sc >= 1000) add('스프링클러설비', G1, '제1호 라목 9)가)', '해당 시설', '특수가연물 ' + F(sc) + '배 ≥ 1,000배');
      if (cat === 'warehouse' && sub === 'radwaste' && x('radWater')) add('스프링클러설비', G1, '제1호 라목 9)나)', '해당 시설', '중 · 저준위방사성폐기물 저장시설 — 소화수 수집 · 처리설비 있음');
      if (facWh && x('nonFire')) {
        if (logis && !(useA >= 5000 || Oc >= 500) && (useA >= 2500 || Oc >= 250)) add('스프링클러설비', G1, '제1호 라목 10)가)', '모든 층', '지붕 · 외벽 비내화 물류터미널 — ' + F(useA) + ' ㎡ ≥ 2,500 ㎡ 또는 250명');
        if (storeNotLogis && useA < 5000 && useA >= 2500) add('스프링클러설비', G1, '제1호 라목 10)나)', '모든 층', '지붕 · 외벽 비내화 창고 — ' + F(useA) + ' ㎡ ≥ 2,500 ㎡');
        if (Math.max(bm, m4) < 1000 && Math.max(bm, m4) >= 500) add('스프링클러설비', G1, '제1호 라목 10)다)', '모든 층', '지붕 · 외벽 비내화 공장 · 창고 — 지하 · 무창 · 4층 이상 층 ' + F(Math.max(bm, m4)) + ' ㎡ ≥ 500 ㎡');
        if (cat === 'warehouse' && rackA > 0 && !rack8 && useA >= 750) add('스프링클러설비', G1, '제1호 라목 10)라)', '모든 층', '지붕 · 외벽 비내화 랙식 창고 — 바닥면적 합계 ' + F(useA) + ' ㎡ ≥ 750 ㎡');
        if (sc >= 500 && sc < 1000) add('스프링클러설비', G1, '제1호 라목 10)마)', '해당 시설', '지붕 · 외벽 비내화 — 특수가연물 ' + F(sc) + '배 ≥ 500배');
      }
      if (cat === 'correctional' && sub === 'prison') add('스프링클러설비', G1, '제1호 라목 11)가)', '수용거실', '보호감호소 · 교도소 · 구치소 · 보호관찰소 · 갱생보호 · 치료감호 · 소년원 · 소년분류심사원');
      if (cat === 'correctional' && sub === 'immig' && !x('leased')) add('스프링클러설비', G1, '제1호 라목 11)나)', '보호시설 부분', '출입국관리법 제52조제2항 보호시설(외국인보호소는 생활공간)');
      if (cat === 'correctional' && sub === 'lockup') add('스프링클러설비', G1, '제1호 라목 11)다)', '유치장', '경찰관 직무집행법 제9조 · 중대범죄수사청법 제46조제1항 유치장');
      if (um && A >= 1000) add('스프링클러설비', G1, '제1호 라목 12)', '모든 층', '지하상가 연면적 ' + F(A) + ' ㎡ ≥ 1,000 ㎡');
      if (ess) add('스프링클러설비', G1, '제1호 라목 13)', '해당 시설', '발전시설 중 전기저장시설');
    }
    // 마. 간이스프링클러
    if (rowMulti) add('간이스프링클러설비', G1, '제1호 마목 1)', '모든 층', '연립주택 · 다세대주택 — 주택전용 간이스프링클러설비');
    if (cat === 'neighborhood') {
      if (useA >= 1000) add('간이스프링클러설비', G1, '제1호 마목 2)가)', '모든 층', '근린생활시설 부분 바닥면적 합계 ' + F(useA) + ' ㎡ ≥ 1,000 ㎡');
      if (sub === 'clinicIn') add('간이스프링클러설비', G1, '제1호 마목 2)나)', '해당 시설', '의원 · 치과의원 · 한의원 — 입원실 또는 인공신장실');
      if (midwife && A < 600) add('간이스프링클러설비', G1, '제1호 마목 2)다)', '해당 시설', '조산원 · 산후조리원 연면적 ' + F(A) + ' ㎡ < 600 ㎡');
    }
    if (hospGroup && useA < 600) add('간이스프링클러설비', G1, '제1호 마목 3)가)', '해당 시설', '병원 · 요양병원 바닥면적 합계 ' + F(useA) + ' ㎡ < 600 ㎡');
    if (psyRehab && useA >= 300 && useA < 600) add('간이스프링클러설비', G1, '제1호 마목 3)나)', '해당 시설', '정신의료기관 · 의료재활시설 ' + F(useA) + ' ㎡ (300 이상 600 미만)');
    if (psyRehab && useA < 300 && x('bars')) add('간이스프링클러설비', G1, '제1호 마목 3)다)', '해당 시설', '정신의료기관 · 의료재활시설 300 ㎡ 미만 · 창살 설치');
    if (cat === 'education' && sub === 'eduCamp' && A >= 100) add('간이스프링클러설비', G1, '제1호 마목 4)', '모든 층', '교육연구시설 내 합숙소 연면적 ' + F(A) + ' ㎡ ≥ 100 ㎡');
    if (welfareLiving) add('간이스프링클러설비', G1, '제1호 마목 5)가)', '해당 시설', '노유자 생활시설(단독 · 공동주택 내 일부 시설 제외)');
    if (cat === 'welfare' && !welfareLiving && useA >= 300 && useA < 600) add('간이스프링클러설비', G1, '제1호 마목 5)나)', '해당 시설', '노유자 시설 ' + F(useA) + ' ㎡ (300 이상 600 미만)');
    if (cat === 'welfare' && !welfareLiving && useA < 300 && x('bars')) add('간이스프링클러설비', G1, '제1호 마목 5)다)', '해당 시설', '노유자 시설 300 ㎡ 미만 · 창살 설치');
    if (hotelAll && useA >= 300 && useA < 600) add('간이스프링클러설비', G1, '제1호 마목 6)', '해당 시설', '숙박시설 바닥면적 합계 ' + F(useA) + ' ㎡ (300 이상 600 미만)');
    if (cat === 'correctional' && sub === 'immig' && x('leased')) add('간이스프링클러설비', G1, '제1호 마목 7)', '보호시설 부분', '건물을 임차한 출입국관리법 보호시설');
    if (cat === 'mixed' && sub === 'mixB' && A >= 1000) add('간이스프링클러설비', G1, '제1호 마목 8)', '모든 층', '복합건축물(별표 2 제30호나목) 연면적 ' + F(A) + ' ㎡ ≥ 1,000 ㎡');
    // 바. 물분무등 — 가스시설 · ESS 중 UPS · 지하구 제외
    if (!gas && !ug && !(cat === 'power' && sub === 'essUps')) {
      if (cat === 'auto' && sub === 'hangar') add('물분무등소화설비', G1, '제1호 바목 1)', '해당 시설', '항공기 격납고');
      if (cat === 'auto' && sub === 'garage' && A >= 800) add('물분무등소화설비', G1, '제1호 바목 2)', '해당 시설', '차고 · 주차용 건축물 · 철골 조립식 주차시설 연면적 ' + F(A) + ' ㎡ ≥ 800 ㎡');
      if (pkIn >= 200 && !(rowMulti && hh > 0 && hh < 50)) add('물분무등소화설비', G1, '제1호 바목 3)', '차고 · 주차장 부분', '건축물 내부 차고 · 주차 면적 합계 ' + F(pkIn) + ' ㎡ ≥ 200 ㎡');
      if (mech >= 20) add('물분무등소화설비', G1, '제1호 바목 4)', '해당 시설', '기계식 주차시설 ' + F(mech) + '대 ≥ 20대');
      if (elec >= 300) add('물분무등소화설비', G1, '제1호 바목 5)', '전기실 등', '전기실 · 발전실 · 변전실 · 축전지실 · 통신기기실 · 전산실 ' + F(elec) + ' ㎡ ≥ 300 ㎡ (가연성 절연유 미사용 기기 · 상주 주조정실 단서 확인)');
      if (cat === 'warehouse' && sub === 'radwaste' && !x('radWater')) add('물분무등소화설비', G1, '제1호 바목 6)', '해당 시설', '중 · 저준위방사성폐기물 저장시설(소화수 처리설비 없음) — 이산화탄소 · 할론 · 할로겐화합물 및 불활성기체 소화설비');
      if (tunnel) add('물분무등소화설비', G1, '제1호 바목 7)', '터널', '행정안전부령이 정하는 터널이면 물분무소화설비', 'chk');
      if (cat === 'heritage') add('물분무등소화설비', G1, '제1호 바목 8)', '해당 시설', '지정문화유산 · 천연기념물등 중 소방청장이 국가유산청장과 협의하여 정하는 것', 'chk');
    }
    // 사. 옥외소화전 — 아파트등 · 가스시설 · 지하구 · 터널 제외
    if (!aptEtc && !gas && !ug && !tunnel) {
      if (f12 >= 9000) add('옥외소화전설비', G1, '제1호 사목 1)', '해당 대상물', '지상 1층 · 2층 바닥면적 합계 ' + F(f12) + ' ㎡ ≥ 9,000 ㎡ (같은 구내 연소 우려 구조는 하나로 봄)');
      if (woodTreasure) add('옥외소화전설비', G1, '제1호 사목 2)', '해당 대상물', '보물 · 국보로 지정된 목조건축물');
      if (f12 < 9000 && facWh && sc >= 750) add('옥외소화전설비', G1, '제1호 사목 3)', '해당 대상물', '공장 · 창고 특수가연물 ' + F(sc) + '배 ≥ 750배');
    }

    /* ── 2. 경보설비 ── */
    // 가. 단독경보형 감지기
    if (cat === 'education' && sb('eduDorm', 'eduCamp') && A < 2000) add('단독경보형 감지기', G2, '제2호 가목 1)', '해당 시설', '교육연구시설 내 기숙사 · 합숙소 연면적 ' + F(A) + ' ㎡ < 2,000 ㎡');
    if (cat === 'training' && sub === 'tDorm' && A < 2000) add('단독경보형 감지기', G2, '제2호 가목 2)', '해당 시설', '수련시설 내 기숙사 · 합숙소 연면적 ' + F(A) + ' ㎡ < 2,000 ㎡');
    if (tLodge && Oc < 100) add('단독경보형 감지기', G2, '제2호 가목 3)', '해당 시설', '숙박시설이 있는 수련시설(수용인원 100명 미만 — 다목 7) 비해당)');
    if (cat === 'education' && sub === 'kinder' && A < 400) add('단독경보형 감지기', G2, '제2호 가목 4)', '해당 시설', '유치원 연면적 ' + F(A) + ' ㎡ < 400 ㎡');
    if (rowMulti) add('단독경보형 감지기', G2, '제2호 가목 5)', '각 세대', '연립주택 · 다세대주택 — 연동형');
    if (pkUnder > 0 && pkUnder < 200) add('단독경보형 감지기', G2, '제2호 가목 6)', '지하 차고 · 주차장 부분', '지하 차고 · 주차 면적 ' + F(pkUnder) + ' ㎡ < 200 ㎡');
    // 나. 비상경보설비 — 불연재료 공장 · 창고 · 가스시설 · 축사 등 · 지하구 제외
    var noAlarm = (facWh && x('nonCombMat')) || gas || barn || ug;
    if (!noAlarm) {
      if (A >= 400) add('비상경보설비', G2, '제2호 나목 1)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 400 ㎡');
      var lim = cat === 'culture' && sub === 'perf' ? 100 : 150;
      if (bm >= lim) add('비상경보설비', G2, '제2호 나목 2)', '모든 층', '지하층 · 무창층 바닥면적 ' + F(bm) + ' ㎡ ≥ ' + lim + ' ㎡' + (lim === 100 ? '(공연장)' : ''));
      if (tunnel && tunL >= 500) add('비상경보설비', G2, '제2호 나목 3)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 500 m');
      if (workers >= 50) add('비상경보설비', G2, '제2호 나목 4)', '옥내 작업장', '근로자 ' + F(workers) + '명 ≥ 50명 옥내 작업장');
      if (pkUnder > 0 && pkUnder < 200) add('비상경보설비', G2, '제2호 나목 5)', '모든 층', '지하 차고 · 주차 면적 ' + F(pkUnder) + ' ㎡ < 200 ㎡');
    }
    // 다. 자동화재탐지설비
    var afd = [];
    function A_(c, s, r) { afd.push(c); add('자동화재탐지설비', G2, c, s, r); }
    if (aptEtc || (cat === 'apartment' && sub === 'dorm') || hotelAll) A_('제2호 다목 1)', '모든 층', '공동주택 중 아파트등 · 기숙사 · 숙박시설');
    if (Fa >= 6) A_('제2호 다목 2)', '모든 층', '층수 ' + F(Fa) + '층 ≥ 6층 (지하층 제외)');
    var a3 = (cat === 'neighborhood' && sub !== 'bath') || (cat === 'medical' && !sb('psych', 'nursing')) || is('leisure', 'funeral', 'mixed');
    if (a3 && A >= 600) A_('제2호 다목 3)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 600 ㎡');
    var a4 = (cat === 'neighborhood' && sub === 'bath') || is('culture', 'religion', 'retail', 'transport', 'sports', 'office', 'factory', 'warehouse', 'hazmat', 'auto', 'broadcast', 'power', 'tourist', 'undermall') || nationalDefense;
    if (a4 && A >= 1000) A_('제2호 다목 4)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 1,000 ㎡');
    var a5 = cat === 'education' || (cat === 'training' && !tLodge) || (cat === 'animal' && sub !== 'openAn' && sub !== 'barn') || cat === 'waste' || (cat === 'correctional' && !nationalDefense) || cat === 'cemetery';
    if (a5 && A >= 2000) A_('제2호 다목 5)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 2,000 ㎡');
    if (welfareLiving) A_('제2호 다목 6)', '모든 층', '노유자 생활시설');
    if ((cat === 'welfare' && !welfareLiving && A >= 400) || (tLodge && Oc >= 100)) A_('제2호 다목 7)', '모든 층', cat === 'welfare' ? '노유자 시설 연면적 ' + F(A) + ' ㎡ ≥ 400 ㎡' : '숙박시설이 있는 수련시설 수용인원 ' + F(Oc) + '명 ≥ 100명');
    if (cat === 'medical' && sub === 'nursing') A_('제2호 다목 8)가)', '모든 층', '요양병원');
    if (psyRehab && useA >= 300) A_('제2호 다목 8)나)', '모든 층', '정신의료기관 · 의료재활시설 ' + F(useA) + ' ㎡ ≥ 300 ㎡');
    if (psyRehab && useA < 300 && x('bars')) A_('제2호 다목 8)다)', '모든 층', '정신의료기관 · 의료재활시설 300 ㎡ 미만 · 창살 설치');
    if (market) A_('제2호 다목 9)', '모든 층', '판매시설 중 전통시장');
    if (tunnel && tunL >= 1000) A_('제2호 다목 10)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 1,000 m');
    if (ug) A_('제2호 다목 11)', '지하구', '지하구');
    if (midwife && A < 600) A_('제2호 다목 12)', '모든 층', '조산원 · 산후조리원(다목 3) 비해당)');
    if (facWh && sc >= 500 && !(A >= 1000)) A_('제2호 다목 13)', '모든 층', '특수가연물 ' + F(sc) + '배 ≥ 500배');
    if (ess && !(A >= 1000)) A_('제2호 다목 14)', '모든 층', '발전시설 중 전기저장시설');
    if (pkUnder >= 200) A_('제2호 다목 15)', '모든 층', '지하 차고 · 주차 면적 ' + F(pkUnder) + ' ㎡ ≥ 200 ㎡');
    // 라. 시각경보기 — 자동화재탐지설비 대상 중
    if (afd.length) {
      var v = is('neighborhood', 'culture', 'religion', 'retail', 'transport', 'medical', 'welfare', 'sports', 'office', 'hotel', 'leisure', 'power', 'funeral', 'undermall') || logis || (cat === 'education' && sub === 'library') || (cat === 'broadcast' && sub === 'station') || (cat === 'factory' && sub === 'lithium');
      if (v) add('시각경보기', G2, '제2호 라목', '해당 대상물', '자동화재탐지설비 대상 중 라목 1) ~ 5) 용도');
    }
    // 마. 화재알림설비
    if (market) add('화재알림설비', G2, '제2호 마목', '해당 시설', '판매시설 중 전통시장');
    // 바. 비상방송설비 — 가스시설 · 축사 등 · 터널 · 지하구 제외
    if (!gas && !barn && !tunnel && !ug) {
      if (A >= 3500) add('비상방송설비', G2, '제2호 바목 1)', '모든 층', '연면적 ' + F(A) + ' ㎡ ≥ 3,500 ㎡');
      if (Fa >= 11) add('비상방송설비', G2, '제2호 바목 2)', '모든 층', '층수 ' + F(Fa) + '층 ≥ 11층');
      if (Fb >= 3) add('비상방송설비', G2, '제2호 바목 3)', '모든 층', '지하층 ' + F(Fb) + '개 층 ≥ 3층');
    }
    // 사. 자동화재속보설비 — 24시간 감시 인원 근무 시 제외 가능(단서)
    var sok = [];
    if (welfareLiving) sok.push(['제2호 사목 1)', '노유자 생활시설']);
    if (cat === 'welfare' && !welfareLiving && maxF >= 500) sok.push(['제2호 사목 2)', '노유자 시설 — 바닥면적 ' + F(maxF) + ' ㎡ ≥ 500 ㎡인 층']);
    if (tLodge && maxF >= 500) sok.push(['제2호 사목 3)', '숙박시설이 있는 수련시설 — ' + F(maxF) + ' ㎡ ≥ 500 ㎡인 층']);
    if (woodTreasure) sok.push(['제2호 사목 4)', '보물 · 국보로 지정된 목조건축물']);
    if (cat === 'neighborhood' && sub === 'clinicIn') sok.push(['제2호 사목 5)가)', '의원 · 치과의원 · 한의원 입원실']);
    if (midwife) sok.push(['제2호 사목 5)나)', '조산원 · 산후조리원']);
    if (hospGroup) sok.push(['제2호 사목 6)가)', '종합병원 · 병원 · 치과병원 · 한방병원 · 요양병원']);
    if (psyRehab && maxF >= 500) sok.push(['제2호 사목 6)나)', '정신병원 · 의료재활시설 ' + F(maxF) + ' ㎡ ≥ 500 ㎡인 층']);
    if (market) sok.push(['제2호 사목 7)', '판매시설 중 전통시장']);
    sok.forEach(function (s) { add('자동화재속보설비', G2, s[0], '해당 시설', s[1] + (x('monitor24') ? ' — 방재실 등 24시간 감시 인원 근무: 설치하지 않을 수 있음(단서)' : ''), x('monitor24') ? 'chk' : 'req'); });
    // 아. 통합감시시설
    if (ug) add('통합감시시설', G2, '제2호 아목', '지하구', '지하구');
    // 자. 누전경보기
    if (amp > 100 && x('wireLath') && !gas && !tunnel && !ug) add('누전경보기', G2, '제2호 자목', '해당 대상물', '계약전류용량 ' + F(amp) + ' A > 100 A · 비내화 철망 마감');
    // 차. 가스누설경보기
    if (x('gasFac') && (is('culture', 'religion', 'retail', 'transport', 'medical', 'welfare', 'training', 'sports', 'hotel', 'factory', 'funeral') || logis)) add('가스누설경보기', G2, is('culture', 'religion', 'retail', 'transport', 'medical', 'welfare') ? '제2호 차목 1)' : '제2호 차목 2)', '가스시설 설치 장소', '가스시설이 설치된 차목 대상 용도');

    /* ── 3. 피난구조설비 ── */
    if (!gas && !tunnel && !ug) {
      var fl = [];
      if (Fb >= 1) fl.push('지하층');
      if (cat === 'welfare' && Fa >= 2) fl.push('지상 1 · 2층(피난층이 아닌 경우)');
      if (Fa >= 3) fl.push('지상 3층 ~ ' + Math.min(Fa, 10) + '층');
      if (fl.length) add('피난기구', G3, '제3호 가목', fl.join(' · '), '모든 층 — 피난층 · 지상 1 · 2층' + (cat === 'welfare' ? '(노유자 시설은 피난층이 아닌 1 · 2층 포함)' : '') + ' · 11층 이상 층 제외');
    }
    if (cat === 'hotel' && sub === 'tourist' && Fa + Fb >= 7) add('인명구조기구', G3, '제3호 나목 1)', '관광호텔 용도 층', '방열복 · 방화복 · 인공소생기 · 공기호흡기 — 지하층 포함 ' + F((Fa + Fb)) + '층 ≥ 7층');
    if (cat === 'medical' && sb('hosp', 'nursing', 'psych') && Fa + Fb >= 5) add('인명구조기구', G3, '제3호 나목 2)', '병원 용도 층', '방열복 · 방화복 · 공기호흡기 — 지하층 포함 ' + F((Fa + Fb)) + '층 ≥ 5층');
    var air = [];
    if (cat === 'culture' && sub === 'cinema' && Oc >= 100) air.push(['제3호 나목 3)가)', '영화상영관 수용인원 ' + F(Oc) + '명 ≥ 100명']);
    if (mall) air.push(['제3호 나목 3)나)', '판매시설 중 대규모점포']);
    if (cat === 'transport' && sub === 'subway') air.push(['제3호 나목 3)다)', '운수시설 중 지하역사']);
    if (um) air.push(['제3호 나목 3)라)', '지하상가']);
    if (x('co2')) air.push(['제3호 나목 3)마)', '이산화탄소소화설비(호스릴 제외) 설치 대상']);
    air.forEach(function (a) { add('인명구조기구', G3, a[0], '해당 대상물', '공기호흡기 — ' + a[1]); });
    if (!tunnel && !barn) add('유도등 · 유도표지', G3, '제3호 다목 1)', '모든 층', '피난구유도등 · 통로유도등 · 유도표지 — 모든 특정소방대상물(축사 사육 부분 · 터널 제외)');
    if ((cat === 'leisure' && sub === 'club') || is('culture', 'religion', 'sports')) add('객석유도등', G3, '제3호 다목 2)', '객석', '유흥주점(무대) · 문화 및 집회 · 종교 · 운동시설');
    if (!tunnel && !ug && !gas) add('피난유도선', G3, '제3호 다목 3)', '해당 장소', '화재안전기준(NFTC 303)에서 정하는 장소이면 설치', 'chk');
    var noEL = (cat === 'warehouse' && sb('store', 'dock')) || gas || barn;
    if (!noEL) {
      var el1 = Fa + Fb >= 5 && A >= 3000;
      if (el1) add('비상조명등', G3, '제3호 라목 1)', '모든 층', '지하층 포함 ' + F((Fa + Fb)) + '층 ≥ 5층 · 연면적 ' + F(A) + ' ㎡ ≥ 3,000 ㎡');
      if (!el1 && bm >= 450) add('비상조명등', G3, '제3호 라목 2)', '해당 층', '지하층 · 무창층 바닥면적 ' + F(bm) + ' ㎡ ≥ 450 ㎡');
      if (tunnel && tunL >= 500) add('비상조명등', G3, '제3호 라목 3)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 500 m');
    }
    if (hotelAll) add('휴대용비상조명등', G3, '제3호 마목 1)', '객실 등', '숙박시설');
    if ((cat === 'culture' && sub === 'cinema' && Oc >= 100) || mall || (cat === 'transport' && sub === 'subway') || um) add('휴대용비상조명등', G3, '제3호 마목 2)', '해당 대상물', '영화상영관 100명 · 대규모점포 · 지하역사 · 지하상가');

    /* ── 4. 소화용수설비 ── */
    var wn = x('noMain') ? '소화수조 또는 저수조' : '상수도소화용수설비';
    var wr = x('noMain') ? ' — 대지 경계 180 m 이내 75 ㎜ 상수도 배수관 없음(본문 단서)' : '';
    if (A >= 5000 && !gas && !tunnel && !ug) add(wn, G4, '제4호 가목', '해당 대상물', '연면적 ' + F(A) + ' ㎡ ≥ 5,000 ㎡' + wr);
    if (gas && gasT >= 100) add(wn, G4, '제4호 나목', '해당 시설', '가스시설 지상 노출 탱크 ' + F(gasT) + ' t ≥ 100 t' + wr);
    if (cat === 'waste' && sub === 'wasteRec') add(wn, G4, '제4호 다목', '해당 시설', '폐기물재활용시설 · 폐기물처분시설' + wr);

    /* ── 5. 소화활동설비 ── */
    if (is('culture', 'religion', 'sports') && stage >= 200) add('제연설비', G5, '제5호 가목 1)', '무대부', '무대부 바닥면적 ' + F(stage) + ' ㎡ ≥ 200 ㎡');
    if (cat === 'culture' && sub === 'cinema' && Oc >= 100) add('제연설비', G5, '제5호 가목 2)', '영화상영관', '수용인원 ' + F(Oc) + '명 ≥ 100명');
    if ((is('neighborhood', 'retail', 'transport', 'hotel', 'leisure', 'medical', 'welfare') || logis) && bUse >= 1000) add('제연설비', G5, '제5호 가목 3)', '해당 부분', '지하층 · 무창층의 해당 용도 바닥면적 합계 ' + F(bUse) + ' ㎡ ≥ 1,000 ㎡');
    if (cat === 'transport' && sb('bus', 'rail', 'subway', 'port') && bm >= 1000) add('제연설비', G5, '제5호 가목 4)', '모든 층', '대기실 · 휴게시설 — 지하층 · 무창층 ' + F(bm) + ' ㎡ ≥ 1,000 ㎡');
    if (um && A >= 1000) add('제연설비', G5, '제5호 가목 5)', '모든 층', '지하상가 연면적 ' + F(A) + ' ㎡ ≥ 1,000 ㎡');
    if (tunnel) add('제연설비', G5, '제5호 가목 6)', '터널', '행정안전부령이 정하는 터널이면 설치', 'chk');
    if (x('specialStair') && !(aptEtc && x('corridorApt'))) add('제연설비', G5, '제5호 가목 7)', '부속실 · 승강장', '특별피난계단 · 비상용 승강기 승강장 · 피난용 승강기 승강장(갓복도형 아파트등 제외) — NFTC 501A');
    else if (!x('specialStair') && (Fa >= 11 || Fb >= 3) && !(aptEtc && x('corridorApt'))) add('제연설비', G5, '제5호 가목 7)', '부속실 · 승강장', '11층 이상 또는 지하 3층 이하 — 건축법상 특별피난계단 · 비상용 승강기 설치 대상이면 부속실 제연(NFTC 501A)', 'chk');
    if (!gas && !ug) {
      var c1 = Fa >= 5 && A >= 6000, c2 = !c1 && Fa + Fb >= 7, c3 = !c1 && !c2 && Fb >= 3 && bSum >= 1000;
      if (c1) add('연결송수관설비', G5, '제5호 나목 1)', '모든 층', '층수 ' + F(Fa) + '층 ≥ 5층 · 연면적 ' + F(A) + ' ㎡ ≥ 6,000 ㎡');
      if (c2) add('연결송수관설비', G5, '제5호 나목 2)', '모든 층', '지하층 포함 ' + F((Fa + Fb)) + '층 ≥ 7층');
      if (c3) add('연결송수관설비', G5, '제5호 나목 3)', '모든 층', '지하 ' + F(Fb) + '층 ≥ 3층 · 지하층 합계 ' + F(bSum) + ' ㎡ ≥ 1,000 ㎡');
      if (tunnel && tunL >= 500) add('연결송수관설비', G5, '제5호 나목 4)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 500 m');
    }
    if (!ug) {
      if ((cat === 'retail' || cat === 'transport' || logis) && useA >= 1000) add('연결살수설비', G5, '제5호 다목 1)', '해당 시설', '판매 · 운수 · 물류터미널 바닥면적 합계 ' + F(useA) + ' ㎡ ≥ 1,000 ㎡');
      var lim2 = (x('nhApt') && cat === 'apartment') || (cat === 'education' && sub === 'school') ? 700 : 150;
      if (bSum >= lim2 && !x('bEvac')) add('연결살수설비', G5, '제5호 다목 2)', '지하층의 모든 층', '지하층 바닥면적 합계 ' + F(bSum) + ' ㎡ ≥ ' + lim2 + ' ㎡' + (lim2 === 700 ? '(국민주택규모 아파트 대피시설 · 학교 지하층)' : ''));
      if (gas && gasT >= 30) add('연결살수설비', G5, '제5호 다목 3)', '탱크시설', '가스시설 지상 노출 탱크 ' + F(gasT) + ' t ≥ 30 t');
      if (pkUnder > 0 && pkUnder < 200) add('연결살수설비', G5, '제5호 다목 5)', '지하 차고 · 주차장 부분', '지하 차고 · 주차 면적 ' + F(pkUnder) + ' ㎡ < 200 ㎡');
      if (mech > 0 && mech < 20 && x('mechCovered')) add('연결살수설비', G5, '제5호 다목 6)', '해당 시설', '기계식 주차시설 ' + F(mech) + '대 < 20대 · 지붕 · 외벽 있음');
    }
    if (!gas && !ug) {
      if (Fa >= 11) add('비상콘센트설비', G5, '제5호 라목 1)', '11층 이상의 층', '층수 ' + F(Fa) + '층 ≥ 11층');
      if (Fb >= 3 && bSum >= 1000) add('비상콘센트설비', G5, '제5호 라목 2)', '지하층의 모든 층', '지하 ' + F(Fb) + '층 ≥ 3층 · 지하층 합계 ' + F(bSum) + ' ㎡ ≥ 1,000 ㎡');
      if (tunnel && tunL >= 500) add('비상콘센트설비', G5, '제5호 라목 3)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 500 m');
    }
    if (!gas) {
      if (um && A >= 1000) add('무선통신보조설비', G5, '제5호 마목 1)', '모든 층', '지하상가 연면적 ' + F(A) + ' ㎡ ≥ 1,000 ㎡');
      if (bSum >= 3000 || (Fb >= 3 && bSum >= 1000)) add('무선통신보조설비', G5, '제5호 마목 2)', '지하층의 모든 층', bSum >= 3000 ? '지하층 바닥면적 합계 ' + F(bSum) + ' ㎡ ≥ 3,000 ㎡' : '지하 ' + F(Fb) + '층 ≥ 3층 · 지하층 합계 ' + F(bSum) + ' ㎡ ≥ 1,000 ㎡');
      if (tunnel && tunL >= 500) add('무선통신보조설비', G5, '제5호 마목 3)', '터널', '터널 길이 ' + F(tunL) + ' m ≥ 500 m');
      if (ug && sub === 'common') add('무선통신보조설비', G5, '제5호 마목 4)', '공동구', '지하구 중 공동구');
      if (Fa >= 30) add('무선통신보조설비', G5, '제5호 마목 5)', '16층 이상 부분의 모든 층', '층수 ' + F(Fa) + '층 ≥ 30층');
    }
    if (ug && sb('common', 'utility')) add('연소방지설비', G5, '제5호 바목', '지하구', '전력 · 통신사업용 지하구' + (sub === 'common' ? '(공동구 포함 여부는 수용 시설로 확인)' : ''));
    return R;
  }
  /* 같은 소방시설의 여러 조항을 한 줄로 묶는다 (화면 · A4용) */
  function merge(R) {
    var o = [], k = {};
    R.forEach(function (h) {
      var e = k[h.f];
      if (!e) { e = k[h.f] = { f: h.f, g: h.g, cs: [], ss: [], rs: [], t: 'chk' }; o.push(e); }
      e.cs.push(h.c); if (e.ss.indexOf(h.s) < 0) e.ss.push(h.s); e.rs.push(h.r); if (h.t === 'req') e.t = 'req';
    });
    return o;
  }
  var api = { check: check, merge: merge, VER: '5.2.0', LAW: '대통령령 제36728호(2026. 9. 29. 공포 · 2026. 10. 2. 시행) 별표 4' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FPENG = api;
})(this);
