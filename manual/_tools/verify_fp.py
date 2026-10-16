#!/usr/bin/env python3
"""소방시설 설치 검토 v5.2.0 — 판정 엔진 독립 검증
usage: python3 verify_fp.py <fp_engine.js 또는 index.html> [--inject] [N]
시행령 별표 4(대통령령 제36728호, 2026. 10. 2. 시행) 조항을 파이썬으로 다시 옮겨 적은 표(RULES)와 앱 엔진(FPENG.check)을
경계값 중심 무작위 입력 N건(기본 40,000)에 대해 (소방시설, 조항, 구분) 집합으로 대조한다. --inject 는 엔진에 오류 4종을 넣어 검출 여부 확인."""
import sys, re, json, random, subprocess, tempfile, os

SRC = open(sys.argv[1], encoding='utf-8').read()
m = re.search(r'/\* ═+\s*\n\s*FPENG v5\.2\.0.*?\}\)\(this\);', SRC, re.S)
ENG = m.group(0) if m else SRC
N = int([a for a in sys.argv[2:] if a.isdigit()][0]) if any(a.isdigit() for a in sys.argv[2:]) else 40000

SUBS = {
 'apartment': ['apt', 'row', 'multi', 'dorm'], 'neighborhood': ['clinicIn', 'clinic', 'midwife', 'bath', 'etcN'],
 'culture': ['perf', 'hall', 'exhib', 'zoo', 'cinema'], 'religion': ['relig', 'religWood'], 'retail': ['mall', 'market', 'etcR'],
 'transport': ['bus', 'rail', 'subway', 'port', 'etcT'], 'medical': ['hosp', 'nursing', 'psych', 'rehab'],
 'education': ['school', 'kinder', 'library', 'research', 'eduDorm', 'eduCamp'], 'welfare': ['wLiving', 'wEtc'],
 'training': ['tLodge', 'tNo', 'tDorm'], 'sports': ['sport', 'waterpark', 'sportBare'], 'office': ['off', 'officetel', 'substation'],
 'hotel': ['tourist', 'lodge'], 'leisure': ['club', 'etcL'], 'factory': ['fac', 'lithium'], 'warehouse': ['store', 'logis', 'dock', 'radwaste'],
 'hazmat': ['gas', 'etcH'], 'auto': ['hangar', 'garage', 'etcA'], 'correctional': ['prison', 'immig', 'lockup', 'military'],
 'broadcast': ['station', 'etcB'], 'power': ['ess', 'essUps', 'etcP'], 'funeral': ['fun'], 'mixed': ['mixA', 'mixB'], 'undermall': ['um'],
 'tunnel': ['tun'], 'underground': ['common', 'utility', 'etcU'], 'tourist': ['tour'], 'animal': ['barn', 'openAn', 'etcAn'],
 'waste': ['wasteRec', 'etcW'], 'cemetery': ['cem'], 'heritage': ['woodTreasure', 'heritageEtc']}
BOOL = ['kitchen', 'mallRest', 'canteen', 'nonFire', 'nonCombMat', 'bars', 'leased', 'radWater', 'co2', 'specialStair', 'corridorApt',
        'noMain', 'monitor24', 'wireLath', 'gasFac', 'bEvac', 'nhApt', 'mechCovered', 'cinemaLow', 'stageLow']
EDGE = {'A': [0, 32, 33, 99, 100, 299, 300, 399, 400, 599, 600, 799, 800, 999, 1000, 1499, 1500, 1999, 2000, 2499, 2500, 2999, 3000, 3499, 3500, 4999, 5000, 5999, 6000, 12000],
        'Fa': [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 15, 29, 30, 31], 'Fb': [0, 1, 2, 3, 4], 'maxF': [0, 499, 500, 1200],
        'm4': [0, 299, 300, 499, 500, 599, 600, 999, 1000], 'bm': [0, 99, 100, 149, 150, 299, 300, 449, 450, 499, 500, 599, 600, 999, 1000],
        'bSum': [0, 149, 150, 699, 700, 999, 1000, 2999, 3000], 'f12': [0, 8999, 9000], 'useA': [0, 99, 100, 249, 299, 300, 599, 600, 749, 750, 999, 1000, 2499, 2500, 4999, 5000],
        'bUse': [0, 999, 1000], 'Oc': [0, 99, 100, 249, 250, 499, 500], 'pkIn': [0, 199, 200], 'pkUnder': [0, 150, 199, 200], 'pkRoof': [0, 199, 200],
        'mech': [0, 10, 19, 20], 'elec': [0, 299, 300], 'stage': [0, 199, 200, 299, 300, 499, 500], 'cinemaA': [0, 499, 500, 999, 1000],
        'tunL': [0, 499, 500, 999, 1000], 'workers': [0, 49, 50], 'sc': [0, 499, 500, 749, 750, 999, 1000], 'amp': [0, 100, 101],
        'gasT': [0, 29, 30, 99, 100], 'hh': [0, 30, 49, 50], 'rackA': [0, 500, 1499, 1500], 'ceil': [0, 10, 10.5]}

# ── 별표 4 조항 옮겨 적기(독립 구현) ───────────────────────────────
def rules(d):
    c, s = d['cat'], d['sub']; g = lambda k: d.get(k) or 0; b = lambda k: bool(d.get(k))
    A, Fa, Fb, maxF = g('A'), g('Fa'), g('Fb'), g('maxF'); m4 = g('m4') if Fa >= 4 else 0
    bm, bSum, f12, bUse, Oc = g('bm'), g('bSum'), g('f12'), g('bUse'), g('Oc'); useA = g('useA') or A
    T = set(); add = lambda f, cl, t='req': T.add((f, cl, t))
    gas = (c, s) == ('hazmat', 'gas'); tun = c == 'tunnel'; ugd = c == 'underground'; barn = (c, s) == ('animal', 'barn')
    apt = (c, s) == ('apartment', 'apt'); rm = c == 'apartment' and s in ('row', 'multi'); hotel = c == 'hotel'
    wl = (c, s) == ('welfare', 'wLiving'); tl = (c, s) == ('training', 'tLodge'); mid = (c, s) == ('neighborhood', 'midwife')
    logi = (c, s) == ('warehouse', 'logis'); fw = c in ('factory', 'warehouse'); ess = c == 'power' and s in ('ess', 'essUps')
    mkt = (c, s) == ('retail', 'market'); mall = (c, s) == ('retail', 'mall'); um = c == 'undermall'; mil = (c, s) == ('correctional', 'military')
    psy = c == 'medical' and s in ('psych', 'rehab'); hosp = c == 'medical' and s in ('hosp', 'nursing'); wood = (c, s) == ('heritage', 'woodTreasure')
    cin = (c, s) == ('culture', 'cinema'); sub_way = (c, s) == ('transport', 'subway')
    # 1가
    if A >= 33: add('소화기구', '제1호 가목 1)')
    elif gas or ess or c == 'heritage': add('소화기구', '제1호 가목 2)')
    elif tun: add('소화기구', '제1호 가목 3)')
    elif ugd: add('소화기구', '제1호 가목 4)')
    # 1나
    if b('kitchen'):
        if apt or (c, s) == ('office', 'officetel'): add('주거용 주방자동소화장치', '제1호 나목 1)')
        if mall and b('mallRest'): add('상업용 주방자동소화장치', '제1호 나목 2)가)')
        if b('canteen'): add('상업용 주방자동소화장치', '제1호 나목 2)나)')
    # 1다
    if not (gas or ugd or (c, s) == ('office', 'substation')):
        one = [A >= 3000 and not tun, bm >= 600 and not barn, m4 >= 600]
        for k, ok in zip('가나다', one):
            if ok: add('옥내소화전설비', '제1호 다목 1)%s)' % k)
        grp = c in ('neighborhood', 'retail', 'transport', 'medical', 'welfare', 'office', 'hotel', 'leisure', 'factory', 'warehouse', 'auto', 'broadcast', 'power', 'funeral', 'mixed') or mil
        two = [A >= 1500, bm >= 300, m4 >= 300] if (grp and not any(one)) else [False] * 3
        for k, ok in zip('가나다', two):
            if ok: add('옥내소화전설비', '제1호 다목 2)%s)' % k)
        if g('pkRoof') >= 200: add('옥내소화전설비', '제1호 다목 3)')
        if tun and g('tunL') >= 1000: add('옥내소화전설비', '제1호 다목 4)가)')
        if tun: add('옥내소화전설비', '제1호 다목 4)나)', 'chk')
        if fw and g('sc') >= 750 and not any(one) and not any(two): add('옥내소화전설비', '제1호 다목 5)')
    # 1라
    if not (gas or ugd):
        if Fa >= 6: add('스프링클러설비', '제1호 라목 1)')
        if (c, s) in (('education', 'eduDorm'), ('training', 'tDorm')) or c == 'mixed':
            if A >= 5000: add('스프링클러설비', '제1호 라목 2)')
        if (c == 'culture' and s != 'zoo') or (c == 'religion' and s != 'religWood') or (c, s) == ('sports', 'sport'):
            if Oc >= 100: add('스프링클러설비', '제1호 라목 3)가)')
            if cin and g('cinemaA') >= (500 if b('cinemaLow') else 1000): add('스프링클러설비', '제1호 라목 3)나)')
            if b('stageLow') and g('stage') >= 300: add('스프링클러설비', '제1호 라목 3)다)')
            if not b('stageLow') and g('stage') >= 500: add('스프링클러설비', '제1호 라목 3)라)')
        if (c in ('retail', 'transport') or logi) and (useA >= 5000 or Oc >= 500): add('스프링클러설비', '제1호 라목 4)')
        if (mid or (c == 'medical' and s != 'rehab') or c == 'welfare' or tl or hotel) and useA >= 600: add('스프링클러설비', '제1호 라목 5)')
        if c == 'warehouse' and s != 'logis' and useA >= 5000: add('스프링클러설비', '제1호 라목 6)')
        big = max(bm, m4)
        if big >= 1000 and not barn: add('스프링클러설비', '제1호 라목 7)')
        r8 = c == 'warehouse' and g('ceil') > 10 and g('rackA') >= 1500
        if r8: add('스프링클러설비', '제1호 라목 8)')
        if fw and g('sc') >= 1000: add('스프링클러설비', '제1호 라목 9)가)')
        if (c, s) == ('warehouse', 'radwaste') and b('radWater'): add('스프링클러설비', '제1호 라목 9)나)')
        if fw and b('nonFire'):
            if logi and not (useA >= 5000 or Oc >= 500) and (useA >= 2500 or Oc >= 250): add('스프링클러설비', '제1호 라목 10)가)')
            if c == 'warehouse' and s != 'logis' and 2500 <= useA < 5000: add('스프링클러설비', '제1호 라목 10)나)')
            if 500 <= big < 1000: add('스프링클러설비', '제1호 라목 10)다)')
            if c == 'warehouse' and g('rackA') > 0 and not r8 and useA >= 750: add('스프링클러설비', '제1호 라목 10)라)')
            if 500 <= g('sc') < 1000: add('스프링클러설비', '제1호 라목 10)마)')
        if (c, s) == ('correctional', 'prison'): add('스프링클러설비', '제1호 라목 11)가)')
        if (c, s) == ('correctional', 'immig') and not b('leased'): add('스프링클러설비', '제1호 라목 11)나)')
        if (c, s) == ('correctional', 'lockup'): add('스프링클러설비', '제1호 라목 11)다)')
        if um and A >= 1000: add('스프링클러설비', '제1호 라목 12)')
        if ess: add('스프링클러설비', '제1호 라목 13)')
    # 1마
    if rm: add('간이스프링클러설비', '제1호 마목 1)')
    if c == 'neighborhood':
        if useA >= 1000: add('간이스프링클러설비', '제1호 마목 2)가)')
        if s == 'clinicIn': add('간이스프링클러설비', '제1호 마목 2)나)')
        if mid and A < 600: add('간이스프링클러설비', '제1호 마목 2)다)')
    if hosp and useA < 600: add('간이스프링클러설비', '제1호 마목 3)가)')
    if psy and 300 <= useA < 600: add('간이스프링클러설비', '제1호 마목 3)나)')
    if psy and useA < 300 and b('bars'): add('간이스프링클러설비', '제1호 마목 3)다)')
    if (c, s) == ('education', 'eduCamp') and A >= 100: add('간이스프링클러설비', '제1호 마목 4)')
    if wl: add('간이스프링클러설비', '제1호 마목 5)가)')
    if c == 'welfare' and not wl and 300 <= useA < 600: add('간이스프링클러설비', '제1호 마목 5)나)')
    if c == 'welfare' and not wl and useA < 300 and b('bars'): add('간이스프링클러설비', '제1호 마목 5)다)')
    if hotel and 300 <= useA < 600: add('간이스프링클러설비', '제1호 마목 6)')
    if (c, s) == ('correctional', 'immig') and b('leased'): add('간이스프링클러설비', '제1호 마목 7)')
    if (c, s) == ('mixed', 'mixB') and A >= 1000: add('간이스프링클러설비', '제1호 마목 8)')
    # 1바
    if not (gas or ugd or (c, s) == ('power', 'essUps')):
        if (c, s) == ('auto', 'hangar'): add('물분무등소화설비', '제1호 바목 1)')
        if (c, s) == ('auto', 'garage') and A >= 800: add('물분무등소화설비', '제1호 바목 2)')
        if g('pkIn') >= 200 and not (rm and 0 < g('hh') < 50): add('물분무등소화설비', '제1호 바목 3)')
        if g('mech') >= 20: add('물분무등소화설비', '제1호 바목 4)')
        if g('elec') >= 300: add('물분무등소화설비', '제1호 바목 5)')
        if (c, s) == ('warehouse', 'radwaste') and not b('radWater'): add('물분무등소화설비', '제1호 바목 6)')
        if tun: add('물분무등소화설비', '제1호 바목 7)', 'chk')
        if c == 'heritage': add('물분무등소화설비', '제1호 바목 8)', 'chk')
    # 1사
    if not (apt or gas or ugd or tun):
        if f12 >= 9000: add('옥외소화전설비', '제1호 사목 1)')
        if wood: add('옥외소화전설비', '제1호 사목 2)')
        if f12 < 9000 and fw and g('sc') >= 750: add('옥외소화전설비', '제1호 사목 3)')
    # 2가
    if c == 'education' and s in ('eduDorm', 'eduCamp') and A < 2000: add('단독경보형 감지기', '제2호 가목 1)')
    if (c, s) == ('training', 'tDorm') and A < 2000: add('단독경보형 감지기', '제2호 가목 2)')
    if tl and Oc < 100: add('단독경보형 감지기', '제2호 가목 3)')
    if (c, s) == ('education', 'kinder') and A < 400: add('단독경보형 감지기', '제2호 가목 4)')
    if rm: add('단독경보형 감지기', '제2호 가목 5)')
    if 0 < g('pkUnder') < 200: add('단독경보형 감지기', '제2호 가목 6)')
    # 2나
    if not ((fw and b('nonCombMat')) or gas or barn or ugd):
        if A >= 400: add('비상경보설비', '제2호 나목 1)')
        if bm >= (100 if (c, s) == ('culture', 'perf') else 150): add('비상경보설비', '제2호 나목 2)')
        if tun and g('tunL') >= 500: add('비상경보설비', '제2호 나목 3)')
        if g('workers') >= 50: add('비상경보설비', '제2호 나목 4)')
        if 0 < g('pkUnder') < 200: add('비상경보설비', '제2호 나목 5)')
    # 2다
    af = set()
    def AF(cl):
        af.add(cl); add('자동화재탐지설비', cl)
    if apt or (c, s) == ('apartment', 'dorm') or hotel: AF('제2호 다목 1)')
    if Fa >= 6: AF('제2호 다목 2)')
    if ((c == 'neighborhood' and s != 'bath') or (c == 'medical' and s not in ('psych', 'nursing')) or c in ('leisure', 'funeral', 'mixed')) and A >= 600: AF('제2호 다목 3)')
    if ((c, s) == ('neighborhood', 'bath') or c in ('culture', 'religion', 'retail', 'transport', 'sports', 'office', 'factory', 'warehouse', 'hazmat', 'auto', 'broadcast', 'power', 'tourist', 'undermall') or mil) and A >= 1000: AF('제2호 다목 4)')
    if (c == 'education' or (c == 'training' and not tl) or (c == 'animal' and s == 'etcAn') or c == 'waste' or (c == 'correctional' and not mil) or c == 'cemetery') and A >= 2000: AF('제2호 다목 5)')
    if wl: AF('제2호 다목 6)')
    if (c == 'welfare' and not wl and A >= 400) or (tl and Oc >= 100): AF('제2호 다목 7)')
    if (c, s) == ('medical', 'nursing'): AF('제2호 다목 8)가)')
    if psy and useA >= 300: AF('제2호 다목 8)나)')
    if psy and useA < 300 and b('bars'): AF('제2호 다목 8)다)')
    if mkt: AF('제2호 다목 9)')
    if tun and g('tunL') >= 1000: AF('제2호 다목 10)')
    if ugd: AF('제2호 다목 11)')
    if mid and A < 600: AF('제2호 다목 12)')
    if fw and g('sc') >= 500 and A < 1000: AF('제2호 다목 13)')
    if ess and A < 1000: AF('제2호 다목 14)')
    if g('pkUnder') >= 200: AF('제2호 다목 15)')
    if af and (c in ('neighborhood', 'culture', 'religion', 'retail', 'transport', 'medical', 'welfare', 'sports', 'office', 'hotel', 'leisure', 'power', 'funeral', 'undermall') or logi or (c, s) in (('education', 'library'), ('broadcast', 'station'), ('factory', 'lithium'))):
        add('시각경보기', '제2호 라목')
    if mkt: add('화재알림설비', '제2호 마목')
    if not (gas or barn or tun or ugd):
        if A >= 3500: add('비상방송설비', '제2호 바목 1)')
        if Fa >= 11: add('비상방송설비', '제2호 바목 2)')
        if Fb >= 3: add('비상방송설비', '제2호 바목 3)')
    t24 = 'chk' if b('monitor24') else 'req'
    sk = [('제2호 사목 1)', wl), ('제2호 사목 2)', c == 'welfare' and not wl and maxF >= 500), ('제2호 사목 3)', tl and maxF >= 500), ('제2호 사목 4)', wood),
          ('제2호 사목 5)가)', (c, s) == ('neighborhood', 'clinicIn')), ('제2호 사목 5)나)', mid), ('제2호 사목 6)가)', hosp), ('제2호 사목 6)나)', psy and maxF >= 500), ('제2호 사목 7)', mkt)]
    for cl, ok in sk:
        if ok: add('자동화재속보설비', cl, t24)
    if ugd: add('통합감시시설', '제2호 아목')
    if g('amp') > 100 and b('wireLath') and not (gas or tun or ugd): add('누전경보기', '제2호 자목')
    if b('gasFac'):
        if c in ('culture', 'religion', 'retail', 'transport', 'medical', 'welfare'): add('가스누설경보기', '제2호 차목 1)')
        elif c in ('training', 'sports', 'hotel', 'factory', 'funeral') or logi: add('가스누설경보기', '제2호 차목 2)')
    # 3
    if not (gas or tun or ugd) and (Fb >= 1 or Fa >= 3 or (c == 'welfare' and Fa >= 2)): add('피난기구', '제3호 가목')
    if (c, s) == ('hotel', 'tourist') and Fa + Fb >= 7: add('인명구조기구', '제3호 나목 1)')
    if c == 'medical' and s in ('hosp', 'nursing', 'psych') and Fa + Fb >= 5: add('인명구조기구', '제3호 나목 2)')
    if cin and Oc >= 100: add('인명구조기구', '제3호 나목 3)가)')
    if mall: add('인명구조기구', '제3호 나목 3)나)')
    if sub_way: add('인명구조기구', '제3호 나목 3)다)')
    if um: add('인명구조기구', '제3호 나목 3)라)')
    if b('co2'): add('인명구조기구', '제3호 나목 3)마)')
    if not (tun or barn): add('유도등 · 유도표지', '제3호 다목 1)')
    if (c, s) == ('leisure', 'club') or c in ('culture', 'religion', 'sports'): add('객석유도등', '제3호 다목 2)')
    if not (tun or ugd or gas): add('피난유도선', '제3호 다목 3)', 'chk')
    if not ((c == 'warehouse' and s in ('store', 'dock')) or gas or barn):
        e1 = Fa + Fb >= 5 and A >= 3000
        if e1: add('비상조명등', '제3호 라목 1)')
        elif bm >= 450: add('비상조명등', '제3호 라목 2)')
        if tun and g('tunL') >= 500: add('비상조명등', '제3호 라목 3)')
    if hotel: add('휴대용비상조명등', '제3호 마목 1)')
    if (cin and Oc >= 100) or mall or sub_way or um: add('휴대용비상조명등', '제3호 마목 2)')
    # 4
    W = '소화수조 또는 저수조' if b('noMain') else '상수도소화용수설비'
    if A >= 5000 and not (gas or tun or ugd): add(W, '제4호 가목')
    if gas and g('gasT') >= 100: add(W, '제4호 나목')
    if (c, s) == ('waste', 'wasteRec'): add(W, '제4호 다목')
    # 5가
    if c in ('culture', 'religion', 'sports') and g('stage') >= 200: add('제연설비', '제5호 가목 1)')
    if cin and Oc >= 100: add('제연설비', '제5호 가목 2)')
    if (c in ('neighborhood', 'retail', 'transport', 'hotel', 'leisure', 'medical', 'welfare') or logi) and bUse >= 1000: add('제연설비', '제5호 가목 3)')
    if c == 'transport' and s in ('bus', 'rail', 'subway', 'port') and bm >= 1000: add('제연설비', '제5호 가목 4)')
    if um and A >= 1000: add('제연설비', '제5호 가목 5)')
    if tun: add('제연설비', '제5호 가목 6)', 'chk')
    gap = apt and b('corridorApt')
    if b('specialStair') and not gap: add('제연설비', '제5호 가목 7)')
    elif not b('specialStair') and (Fa >= 11 or Fb >= 3) and not gap: add('제연설비', '제5호 가목 7)', 'chk')
    # 5나
    if not (gas or ugd):
        if Fa >= 5 and A >= 6000: add('연결송수관설비', '제5호 나목 1)')
        elif Fa + Fb >= 7: add('연결송수관설비', '제5호 나목 2)')
        elif Fb >= 3 and bSum >= 1000: add('연결송수관설비', '제5호 나목 3)')
        if tun and g('tunL') >= 500: add('연결송수관설비', '제5호 나목 4)')
    # 5다
    if not ugd:
        if (c in ('retail', 'transport') or logi) and useA >= 1000: add('연결살수설비', '제5호 다목 1)')
        lim = 700 if ((b('nhApt') and c == 'apartment') or (c, s) == ('education', 'school')) else 150
        if bSum >= lim and not b('bEvac'): add('연결살수설비', '제5호 다목 2)')
        if gas and g('gasT') >= 30: add('연결살수설비', '제5호 다목 3)')
        if 0 < g('pkUnder') < 200: add('연결살수설비', '제5호 다목 5)')
        if 0 < g('mech') < 20 and b('mechCovered'): add('연결살수설비', '제5호 다목 6)')
    # 5라 · 마 · 바
    if not (gas or ugd):
        if Fa >= 11: add('비상콘센트설비', '제5호 라목 1)')
        if Fb >= 3 and bSum >= 1000: add('비상콘센트설비', '제5호 라목 2)')
        if tun and g('tunL') >= 500: add('비상콘센트설비', '제5호 라목 3)')
    if not gas:
        if um and A >= 1000: add('무선통신보조설비', '제5호 마목 1)')
        if bSum >= 3000 or (Fb >= 3 and bSum >= 1000): add('무선통신보조설비', '제5호 마목 2)')
        if tun and g('tunL') >= 500: add('무선통신보조설비', '제5호 마목 3)')
        if (c, s) == ('underground', 'common'): add('무선통신보조설비', '제5호 마목 4)')
        if Fa >= 30: add('무선통신보조설비', '제5호 마목 5)')
    if c == 'underground' and s in ('common', 'utility'): add('연소방지설비', '제5호 바목')
    return T

def gen(rng):
    c = rng.choice(list(SUBS)); d = {'cat': c, 'sub': rng.choice(SUBS[c])}
    for k, v in EDGE.items():
        d[k] = rng.choice(v) if rng.random() < .85 else 0
    for k in BOOL: d[k] = rng.random() < .3
    return d

def run_js(eng, cases):
    js = eng + '\nconst C=' + json.dumps(cases, ensure_ascii=False) + ';const E=(typeof FPENG!=="undefined")?FPENG:module.exports;\n' \
         'console.log(JSON.stringify(C.map(d=>E.check(d).map(h=>[h.f,h.c,h.t]))));'
    js = js.replace('})(this);', '})(globalThis);')
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(js); p = f.name
    try: return json.loads(subprocess.check_output(['node', '--max-old-space-size=4096', p]))
    finally: os.unlink(p)

def compare(eng, cases):
    out = run_js(eng, cases); bad = 0; ex = []
    for d, o in zip(cases, out):
        a = set(map(tuple, o)); e = rules(d)
        if a != e:
            bad += 1
            if len(ex) < 5: ex.append({'in': {k: v for k, v in d.items() if v}, 'app_only': sorted(a - e), 'py_only': sorted(e - a)})
    return bad, ex

rng = random.Random(20261017); cases = [gen(rng) for _ in range(N)]
for c in SUBS:  # 대분류 · 세부 용도 전 조합 × 큰 규모 / 작은 규모
    for s in SUBS[c]:
        for big in (0, 1):
            d = {'cat': c, 'sub': s}; d.update({k: (v[-1] if big else v[1]) for k, v in EDGE.items()}); d.update({k: bool(big) for k in BOOL}); cases.append(d)
bad, ex = compare(ENG, cases)
hits = sum(len(rules(d)) for d in cases)
res = {'cases': len(cases), 'clause_hits': hits, 'mismatch': bad, 'examples': ex}
if '--inject' in sys.argv:
    inj = {'층수에 지하층 합산(라목 1))': ("if (Fa >= 6) add('스프링클러설비'", "if (Fa + Fb >= 6) add('스프링클러설비'"),
           '피난기구 2층 포함': ("if (Fa >= 3) fl.push(", "if (Fa >= 2) fl.push("),
           '비상방송 3,500 → 3,000': ("if (A >= 3500) add('비상방송설비'", "if (A >= 3000) add('비상방송설비'"),
           '노유자 자탐 전부 모든 층': ("if (welfareLiving) A_('제2호 다목 6)'", "if (cat === 'welfare') A_('제2호 다목 6)'")}
    res['inject'] = {}
    for k, (a, b2) in inj.items():
        assert a in ENG, k
        nb, _ = compare(ENG.replace(a, b2, 1), cases); res['inject'][k] = {'mismatch': nb, 'caught': nb > 0}
print(json.dumps(res, ensure_ascii=False, indent=1))
sys.exit(0 if bad == 0 and all(v['caught'] for v in res.get('inject', {}).values()) else 1)
