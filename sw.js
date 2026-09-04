/* ════════════════════════════════════════════════════════════════
   S6 회차 2026-09-05 — R24①② 표 선 separate·mono 한글 폴백 소급 동반 캐시명 v6.5
   S3-0 회차 2026-09-04 — R27 html2canvas 클론 정화 동반 캐시명 v6.4
   S2 회차 2026-09-04 — index 소급(R1·R21·R26 등) 동반 캐시명 v6.3
   R25 회차 2026-09-04 — 자기 접두어 캐시 조회 · cors 프리캐시 · opaque 가드 · 캐시명 v6.2 (S10)
   Service Worker — 소방시설 설치기준 검토 MANMIN Ver-5.0
   ㈜대성건축사사무소 · 건축사 김만민

   v5.2 (2026-09-01)
   ─────────────────────────────────────────────────────────────
   [변경 사유] 이전 sw.js 는 953바이트 최소구현으로, 문서(HTML)까지
   순수 Cache-First 로 처리했다. 백그라운드 갱신조차 없었기 때문에
   index.html 을 아무리 수정·배포해도 캐시명을 올리기 전에는
   사용자 화면에 영구히 반영되지 않았다.
   39종 중 유일하게 갱신 경로가 막혀 있던 구조다.

   [처방] 문서 요청만 Network-first 로 분리한다.
          정적 자산은 오프라인 지원을 위해 Cache-First 를 유지한다.
   ⛔ 이 navigate 분기를 제거하지 말 것. 제거하면 배포가 화면에 반영되지 않는다.
════════════════════════════════════════════════════════════════ */

/* §17-1 (2026-09-02) — 도구 고유 접두어. 종전 `k !== CACHE_NAME` 필터는 같은 origin 의 39종 캐시를 전부 지웠다 */
const PREFIX = 'sobangsiseorak-';
/* ═ R25 (2026-09-04) — SW 캐시 origin 오염 차단 (S10 · 지시서 §21-1 R25)
   전역 caches 의 match 는 origin 전체를 검색한다. manminkim-eng.github.io 는 34종이 한 origin 이라
   다른 도구 캐시의 opaque 응답이 <script crossorigin>(cors) 요청에 돌아가 스크립트가 폐기됐다
   (30 #root 빈 화면 · 40 html2canvas undefined). 자기 접두어 캐시만 조회하고, cross-origin
   프리캐시는 cors 로 받으며, opaque↔cors 불일치 시 캐시를 쓰지 않는다. */
const MM_EXCLUDE = [];   /* 내 접두어로 시작하지만 남의 캐시인 이름 (§17-1 충돌) */
const mmOwn   = (k) => k.indexOf(PREFIX) === 0 && !MM_EXCLUDE.some((x) => k.indexOf(x) === 0);
const mmReq   = (u) => (typeof u === 'string' && u.indexOf('http') === 0) ? new Request(u, { mode: 'cors' }) : u;
const mmMatch = (req, opt) => caches.keys()
  .then((ks) => ks.filter(mmOwn))
  .then((ks) => ks.reduce((p, k) => p.then((r) => r || caches.open(k).then((c) => c.match(req, opt))), Promise.resolve(undefined)))
  .then((r) => (r && r.type === 'opaque' && req && req.mode === 'cors') ? undefined : r);

const CACHE_NAME = 'sobangsiseorak-v6.5';   /* v5.0.1 : A4 폰트 정정 · JPG 저장 시트 · PDF 인쇄 전환 · 바닥글 수정 */

/* 사전 캐시 — 존재가 확실한 것만. 개별 실패는 건너뛴다. */
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

/* ── Install ── */
self.addEventListener('install', (e) => {
  console.log('[SW] Install:', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        ASSETS.map(u => cache.add(mmReq(u)).catch(err => {
          console.warn('[SW] precache skip:', u, err);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: 구버전 캐시 삭제 ── */
self.addEventListener('activate', (e) => {
  console.log('[SW] Activate:', CACHE_NAME);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && mmOwn(k))
            .map(k => { console.log('[SW] 구버전 캐시 삭제:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  /* ══ ⛔ v5.2 핵심 ══
     HTML 문서는 Network-first.
     네트워크가 되면 항상 최신을 보여주고, 끊겼을 때만 캐시로 떨어진다. */
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => mmMatch(e.request).then(c => c || mmMatch('./index.html')))
    );
    return;
  }

  /* ══ 정적 자산: Cache-First + 백그라운드 갱신 ══ */
  e.respondWith(
    mmMatch(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => Response.error());   /* R19 (2026-09-04): 정적 자산 실패 시 index.html 을 돌려주면 SyntaxError 빈 화면 (§20-10) */
    })
  );
});

/* ── Message ── */
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'GET_VERSION' && e.ports[0]) {
    e.ports[0].postMessage({ version: CACHE_NAME });
  }
  if (e.data && e.data.type === 'CLEAR_CACHE') {
    caches.keys()
      .then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => { if (e.ports[0]) e.ports[0].postMessage({ ok: true }); });
  }
});

console.log('[SW] loaded:', CACHE_NAME);
