/*
 * ZTG Putrajaya Ride Hub — Safety Briefing add-on v1.0
 * Ride: Cameron Highlands, 31 Oct–1 Nov 2026
 * Safe to include on the existing Github Pages index.html.
 * Adds content only inside the active Route view; does not change
 * the original app's nav, chat, service worker, manifest or data.
 */
(() => {
  'use strict';

  const SECTION_ID = 'ztg-safety-briefing';
  const STYLE_ID = 'ztg-safety-briefing-styles';
  const ACK_KEY = 'ztg:safety-briefing:ack:2026-10-31:v1';
  const NAV_NAMES = ['home', 'riders', 'route', 'chat', 'photos'];
  let lastClickedTab = null;
  let manualRouteAnchor = null;
  let syncing = false;

  const styles = `
    #${SECTION_ID} { --zb-lime:#bfdd55; --zb-muted:#a3afa3; --zb-line:#385849;
      color:#e9f1e8; font-family:inherit; max-width:1100px; margin:0 auto 24px; }
    #${SECTION_ID} * {box-sizing:border-box}
    #${SECTION_ID} .zb-shell {background:linear-gradient(145deg,#11291f,#0d1e18 75%);
      border:1px solid #315441;border-radius:22px; overflow:hidden;
      box-shadow:0 10px 35px #0003;margin:12px 0 20px;}
    #${SECTION_ID} .zb-head {padding:22px 22px 18px;
      background:radial-gradient(circle at 88% 10%,#42652b80,transparent 42%);}
    #${SECTION_ID} .zb-kicker {font-size:11px;font-weight:800;letter-spacing:1.7px;
      text-transform:uppercase;color:var(--zb-lime);display:flex;align-items:center;gap:8px}
    #${SECTION_ID} .zb-title {font-size:clamp(23px,5vw,33px);font-weight:850;line-height:1.16;
      letter-spacing:-.6px;margin:10px 0 9px;color:#f4f8ee}
    #${SECTION_ID} .zb-sub {color:#b4c4b9;line-height:1.5;margin:0;font-size:14px}
    #${SECTION_ID} .zb-meta {display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
    #${SECTION_ID} .zb-pill {border:1px solid #466b47;background:#223d2b;color:#e5f4d1;
      padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}
    #${SECTION_ID} .zb-command {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;
      margin-top:17px}
    #${SECTION_ID} .zb-role {background:#192f24;border:1px solid #335442;border-radius:12px;
      padding:12px 13px;min-width:0}
    #${SECTION_ID} .zb-role small {display:block;color:#b1c3af;font-size:11px;letter-spacing:.7px;
      text-transform:uppercase;font-weight:800;margin-bottom:3px}
    #${SECTION_ID} .zb-role strong {display:block;color:#f2f7e5;font-size:15px}
    #${SECTION_ID} details.zb-details {border-top:1px solid #335240;background:#14271e}
    #${SECTION_ID} details.zb-details>summary {cursor:pointer;list-style:none;padding:17px 22px;
      display:flex;align-items:center;gap:10px;font-weight:850;color:#f3f8ed;font-size:15px}
    #${SECTION_ID} details.zb-details>summary::-webkit-details-marker {display:none}
    #${SECTION_ID} details.zb-details>summary::after {content:'+';margin-left:auto;
      color:var(--zb-lime);font-size:24px;font-weight:400}
    #${SECTION_ID} details.zb-details[open]>summary::after {content:'−'}
    #${SECTION_ID} .zb-count {color:#102116;background:var(--zb-lime);
      font-size:11px;padding:3px 8px;border-radius:99px;font-weight:900}
    #${SECTION_ID} .zb-rules {display:grid;gap:9px;padding:0 16px 17px;list-style:none;margin:0}
    #${SECTION_ID} .zb-rule {display:flex;gap:11px;padding:13px;
      background:#1b3428;border:1px solid #31513e;border-radius:12px}
    #${SECTION_ID} .zb-num {width:27px;height:27px;flex:none;background:#304c2b;color:#d7f397;
      border:1px solid #53733c;display:grid;place-items:center;border-radius:9px;
      font-size:12px;font-weight:900}
    #${SECTION_ID} .zb-rule strong {font-size:14px;display:block;color:#f5f8ec;margin-bottom:3px}
    #${SECTION_ID} .zb-rule p {font-size:13px;line-height:1.5;color:#bfcfc3;margin:0}
    #${SECTION_ID} .zb-formation {border:1px dashed #557344;border-radius:12px;
      background:#203729;padding:13px;margin:0 16px 17px}
    #${SECTION_ID} .zb-formation-title {font-weight:800;font-size:13px;color:#e3f5bf;margin-bottom:9px}
    #${SECTION_ID} .zb-lane {position:relative;max-width:240px;margin:0 auto;
      border-left:2px solid #77927d;border-right:2px solid #77927d;
      padding:9px 15px;background:#26392d;display:grid;gap:7px}
    #${SECTION_ID} .zb-lane::before {content:'';position:absolute;top:5px;bottom:5px;
      left:50%;border-left:2px dashed #65786b}
    #${SECTION_ID} .zb-bike {position:relative;z-index:1;display:flex;font-size:12px}
    #${SECTION_ID} .zb-bike.left {justify-content:flex-start}
    #${SECTION_ID} .zb-bike.right {justify-content:flex-end}
    #${SECTION_ID} .zb-bike span {min-width:78px;text-align:center;padding:5px 8px;
      background:#b8d95a;color:#10221a;border-radius:8px;font-weight:850}
    #${SECTION_ID} .zb-form-note {text-align:center;color:#bdcdbb;
      font-size:12px;margin:10px 0 0;line-height:1.45}
    #${SECTION_ID} .zb-emergency {margin:0 16px 17px;padding:13px 14px;
      border:1px solid #7e6743;border-radius:11px;background:#3a3223;
      line-height:1.5;font-size:13px;color:#f1e4c8}
    #${SECTION_ID} .zb-emergency strong {color:#fff0c5}
    #${SECTION_ID} .zb-bottom {border-top:1px solid #335240;padding:15px 20px 20px}
    #${SECTION_ID} .zb-ack {display:flex;align-items:flex-start;gap:12px;cursor:pointer;
      padding:13px;border-radius:12px;border:1px solid #537145;background:#263b29}
    #${SECTION_ID} .zb-ack input {margin-top:3px;width:19px;height:19px;flex:none;accent-color:#b8dc51}
    #${SECTION_ID} .zb-ack strong {display:block;color:#f5f9e9;font-size:14px}
    #${SECTION_ID} .zb-ack small {color:#c0cdbc;display:block;line-height:1.45;margin-top:3px;font-size:12px}
    #${SECTION_ID} .zb-status {font-size:12px;color:#c1d5b6;margin:8px 0 0 4px;min-height:18px}
    #${SECTION_ID} .zb-foot {text-align:center;margin:15px 0 0;font-size:11px;
      letter-spacing:1.2px;font-weight:850;color:#b7d75a;text-transform:uppercase}
    @media(min-width:700px) {#${SECTION_ID} .zb-command {grid-template-columns:repeat(4,minmax(0,1fr))}
      #${SECTION_ID} .zb-rules {grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media(max-width:380px){#${SECTION_ID} .zb-head{padding:19px 15px}
      #${SECTION_ID} .zb-role{padding:10px}#${SECTION_ID} .zb-role strong{font-size:13px}}
  `;

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  const rules = [
    ['Safety First', 'Utamakan keselamatan rider, pillion dan semua pengguna jalan raya. Jangan paksa diri jika letih, sakit atau tidak yakin.'],
    ['Staggered Formation', 'Konvoi bergerak selang-seli dalam SATU lorong; kekalkan jarak selamat sekitar 2–3 saat. Tambah jarak semasa hujan, berkabus atau trafik sesak.'],
    ['Cruising Speed', 'RC menentukan rentak konvoi mengikut keadaan jalan dan trafik. Semua rider wajib mematuhi had laju yang ditetapkan pada jalan berkenaan.'],
    ['Highway & Jalan Kampung', 'Lebuh raya: staggered (selang-seli, bukan menunggang sejajar). Jalan kampung, selekoh, laluan sempit dan keadaan licin: single file dengan jarak lebih besar.'],
    ['Marshal Hand Signals', 'Peka terhadap arahan RC/Marshal dan isyarat tangan yang telah dipersetujui. Jangan ikut sebarang arahan jika keadaan tidak selamat.'],
    ['No Overtaking / Weaving', 'Dilarang memotong atau mencilok sesama konvoi. Pergerakan petugas media hanya dengan kebenaran RC, apabila dibenarkan undang-undang dan benar-benar selamat.'],
    ['Intercom Etiquette', 'Intercom diwajibkan untuk semua rider. Komunikasi penting diberi keutamaan kepada RC, Marshal, Media dan Sweeper. Sembang ringkas sahaja, elakkan gangguan; mute mikrofon jika tidak bercakap.']
  ];

  function makeSection() {
    const section = document.createElement('section');
    section.id = SECTION_ID;
    section.setAttribute('aria-labelledby','zb-title');
    const list = rules.map(([heading, body], i) =>
      `<li class="zb-rule"><span class="zb-num">${i+1}</span><div><strong>${escapeHTML(heading)}</strong><p>${escapeHTML(body)}</p></div></li>`
    ).join('');
    section.innerHTML = `
      <div class="zb-shell">
        <div class="zb-head">
          <div class="zb-kicker">🛡️ PRE-RIDE • OFFICIAL CREW BRIEF</div>
          <h2 class="zb-title" id="zb-title">Ride Safety Briefing</h2>
          <p class="zb-sub">Baca dan fahami arahan konvoi sebelum berlepas. Hari kejadian: briefing ringkas, semakan peralatan dan pengesahan formasi.</p>
          <div class="zb-meta"><span class="zb-pill">31 OKT – 1 NOV 2026</span><span class="zb-pill">CAMERON HIGHLANDS</span></div>
          <div class="zb-command" aria-label="Convoy command team">
            <div class="zb-role"><small>🏁 Ride Captain</small><strong>Pseudo</strong></div>
            <div class="zb-role"><small>🦺 Marshal</small><strong>Bobby</strong></div>
            <div class="zb-role"><small>📸 Media</small><strong>Nazri</strong></div>
            <div class="zb-role"><small>🏍️ Sweeper</small><strong>Wan Jepun / Panjang</strong></div>
          </div>
        </div>
        <details class="zb-details" open>
          <summary>Peraturan Konvoi <span class="zb-count">7 POINTS</span></summary>
          <ol class="zb-rules">${list}</ol>
          <div class="zb-formation">
            <div class="zb-formation-title">Staggered = Selang-seli dalam satu lorong</div>
            <div class="zb-lane" role="img" aria-label="Contoh susunan motor: RC di kiri, rider kedua di kanan, rider ketiga di kiri dan rider keempat di kanan, semua dalam satu lorong.">
              <div class="zb-bike left"><span>RC</span></div>
              <div class="zb-bike right"><span>RIDER 2</span></div>
              <div class="zb-bike left"><span>RIDER 3</span></div>
              <div class="zb-bike right"><span>RIDER 4</span></div>
            </div>
            <p class="zb-form-note">Ilustrasi susunan sahaja, bukan skala jarak. Kekalkan sela masa selamat dan jangan bergerak sebelah-menyebelah.</p>
          </div>
          <div class="zb-emergency"><strong>⚠️ Jika terpisah / kecemasan</strong><div>Jangan mengejar secara berbahaya. Berhenti di lokasi selamat dan maklumkan kepada RC/Marshal/Sweeper melalui intercom. Jika berlaku kemalangan atau kecemasan, hubungi 999 jika perlu.</div></div>
        </details>
        <div class="zb-bottom">
          <label class="zb-ack" for="zb-acknowledge">
            <input id="zb-acknowledge" type="checkbox">
            <span><strong>✓ Saya telah baca & faham briefing ini</strong><small>Pengesahan ini disimpan pada telefon ini sahaja. Bukan rekod kehadiran rasmi atau pengesahan yang boleh dilihat oleh RC.</small></span>
          </label>
          <p class="zb-status" id="zb-ack-status" role="status" aria-live="polite"></p>
          <p class="zb-foot">One Ride · One Crew · Safe Journey</p>
        </div>
      </div>`;
    const input = section.querySelector('#zb-acknowledge');
    const status = section.querySelector('#zb-ack-status');
    let saved = false;
    try { saved = localStorage.getItem(ACK_KEY) === 'yes'; } catch (_) {}
    input.checked = saved;
    status.textContent = saved ? '✓ Bacaan telah ditandakan pada peranti ini.' : 'Tandakan selepas selesai membaca semua peraturan.';
    input.addEventListener('change', () => {
      try { if (input.checked) localStorage.setItem(ACK_KEY, 'yes'); else localStorage.removeItem(ACK_KEY); }
      catch (_) { status.textContent = 'Tetapan pelayar tidak membenarkan simpanan tempatan.'; return; }
      status.textContent = input.checked ? '✓ Bacaan telah ditandakan pada peranti ini.' : 'Tandakan selepas selesai membaca semua peraturan.';
    });
    return section;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = styles;
    document.head.append(style);
  }

  function extractTab(el) {
    if (!el) return null;
    const str = [el.getAttribute('aria-label'), el.getAttribute('title'),
      el.getAttribute('data-tab'), el.getAttribute('data-view'),
      el.getAttribute('data-page'), el.textContent].filter(Boolean).join(' ').toLowerCase();
    const matches = NAV_NAMES.filter(name => new RegExp('\\b' + name + '\\b', 'i').test(str));
    return matches.length === 1 ? matches[0] : null;
  }

  function activeTab() {
    const nodes = document.querySelectorAll('nav button,nav a,nav [role="tab"],nav [data-tab],nav [data-view],.bottom-nav button,.bottom-nav a,.bottomNav button,.bottomNav a,.tabbar button,.tabbar a,#bottomNav button,#bottomNav a,[role="navigation"] button,[role="navigation"] a');
    for (const el of nodes) {
      const cls = (el.className && typeof el.className === 'string' ? el.className : '');
      const parent = el.parentElement;
      const pcls = (parent?.className && typeof parent.className === 'string' ? parent.className : '');
      const active = el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-selected') === 'true' ||
        /(?:^|\s)(?:active|selected|current|is-active)(?:\s|$)/i.test(cls) ||
        /(?:^|\s)(?:active|selected|current|is-active)(?:\s|$)/i.test(pcls);
      if (active) { const tab = extractTab(el); if(tab) return tab; }
    }
    return null;
  }

  function isRouteUrl() {
    const hash = decodeURIComponent(location.hash || '').toLowerCase();
    const queryTab = new URLSearchParams(location.search).get('tab')?.toLowerCase();
    return /^#\/?(?:route|itinerary)(?:\b|\/|$)/.test(hash) || queryTab === 'route';
  }

  function isRouteView() {
    const tab = activeTab();
    if (tab) return tab === 'route';
    if (location.hash || new URLSearchParams(location.search).has('tab')) {
      if(isRouteUrl()) return true;
      if(/#\/?(?:home|riders|chat|photos)(?:\b|\/|$)/i.test(location.hash || '')) return false;
    }
    return lastClickedTab === 'route';
  }

  function sync() {
    const view = document.getElementById('view');
    if (!view) return;
    const existing = document.getElementById(SECTION_ID);
    if (manualRouteAnchor && !view.contains(manualRouteAnchor)) manualRouteAnchor = null;
    if (isRouteView() || manualRouteAnchor) {
      if (!existing) { injectStyles(); view.prepend(makeSection()); }
    } else if (existing) {
      existing.remove();
    }
  }

  function scheduleSync() {
    if (syncing) return;
    syncing = true;
    Promise.resolve().then(() => { syncing = false; sync(); });
  }

  // Optional fallback for unusual navigation implementations: call after Route renders.
  window.ZTGSafetyBriefing = Object.freeze({
    showInRoute() {
      const view = document.getElementById('view');
      if (!view || document.getElementById(SECTION_ID)) return;
      manualRouteAnchor = view.firstChild;
      injectStyles(); view.prepend(makeSection());
    }
  });

  function setup() {
    if (!document.getElementById('view')) return;
    // Record nav clicks without hijacking the original app's handlers.
    document.addEventListener('click', event => {
      const control = event.target?.closest?.('button,a,[role="tab"],[onclick],[data-tab],[data-view],[data-page],[data-route],.nav-item');
      if (!control || document.getElementById('view')?.contains(control)) return;
      const tab = extractTab(control);
      if (tab) { lastClickedTab = tab; setTimeout(scheduleSync, 0); }
    }, true);
    window.addEventListener('hashchange', scheduleSync);
    document.addEventListener('visibilitychange', scheduleSync);
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current','aria-selected']});
    scheduleSync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once:true});
  else setup();
})();
