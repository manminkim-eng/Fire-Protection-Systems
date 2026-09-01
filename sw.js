/* ════════════════════════════════════════════════════════════════
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

const CACHE_NAME = 'sobangsiseorak-v6.0';   /* v5.0.1 : A4 폰트 정정 · JPG 저장 시트 · PDF 인쇄 전환 · 바닥글 수정 */

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
        ASSETS.map(u => cache.add(u).catch(err => {
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
        keys.filter(k => k !== CACHE_NAME)
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
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  /* ══ 정적 자산: Cache-First + 백그라운드 갱신 ══ */
  e.respondWith(
    caches.match(e.request).then(cached => {
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
      }).catch(() => caches.match('./index.html'));
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
