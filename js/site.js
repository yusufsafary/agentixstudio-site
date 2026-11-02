// Agentix Studio homepage: studio clock, flickering floor windows,
// sample works, the roster stage, clock-in ledger, wallet check,
// gallery of recent works, copy buttons.
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => n.toLocaleString('en');
  const hex = (n) => '0x' + BigInt(n).toString(16).padStart(64, '0');
  const AGENTS = window.AgentixArt ? window.AgentixArt.AGENTS : [];
  const STYLE_LINES = [
    'Lays out bold blocks before anyone else wakes.',
    'Draws moons from memory, never from reference.',
    'Lights every scene twice, once for the dark.',
    'Keeps motion studies running until dawn.',
    'Scores silence, then draws what it looks like.',
    'Writes the lines no client brief survives.',
    'Grades the night into twelve columns of color.',
    'Cuts one letter per night, perfectly.',
    'Carves arches out of raw dark.',
    'Shoots halftone portraits of empty rooms.',
    'Routes circuits through the whole building.',
    'Closes every shift with a horizon and a signature.'
  ];
  // One deterministic sample seed per agent: agent i works seed i*1000+710
  // (a Finished piece), except Noctis, whose sample is the 1976 Masterwork.
  const sampleSeed = (i) => (i === 1 ? 1976 : i * 1000 + 710);

  // ---------- studio clock (WIB) ----------
  (function clock() {
    const el = $('#studioClock');
    if (!el) return;
    function tick() {
      const now = new Date(Date.now() + 7 * 3600 * 1000);
      const p = (n) => String(n).padStart(2, '0');
      el.textContent = p(now.getUTCHours()) + ':' + p(now.getUTCMinutes()) + ':' + p(now.getUTCSeconds());
    }
    tick();
    setInterval(tick, 1000);
  })();

  // ---------- the floor: twelve windows, flickering as agents work ----------
  (function floor() {
    const box = $('#floor');
    if (!box) return;
    box.innerHTML = AGENTS.map(function (a, i) {
      return '<span class="win" data-win="' + i + '" title="' + a.name + ' · ' + a.role + '"></span>';
    }).join('');
    const wins = Array.prototype.slice.call(box.querySelectorAll('.win'));
    function relight() {
      const litCount = 3 + Math.floor(Math.random() * 4); // 3..6 windows lit
      const order = wins.slice().sort(function () { return Math.random() - 0.5; });
      wins.forEach(function (w) { w.classList.remove('lit'); });
      order.slice(0, litCount).forEach(function (w) { w.classList.add('lit'); });
    }
    relight();
    setInterval(relight, 1400);
  })();

  // ---------- sample works (Shift 01) ----------
  (function samples() {
    const grid = $('#formGrid');
    if (!grid || !window.AgentixArt) return;
    const SAMPLES = [3, 4710, 1976, 10003];
    grid.innerHTML = '';
    SAMPLES.forEach(function (d) {
      const r = window.AgentixArt.render(hex(d), 0);
      const fig = document.createElement('figure');
      fig.className = 'form';
      fig.innerHTML = r.svg + '<figcaption><b>' + r.stats.clsName + ' · ' + r.stats.agent + '</b><span>' + r.stats.palette + ' · Shift ' + r.stats.shift + '</span></figcaption>';
      grid.appendChild(fig);
    });
    const pals = $('#pals');
    if (pals) {
      pals.innerHTML = window.AgentixArt.PALETTES.map(function (p) {
        return '<span class="pal">' + p.name + '</span>';
      }).join('');
    }
  })();

  // ---------- roster stage (Shift 02) ----------
  (function roster() {
    const box = $('#roster'), stage = $('#stageArt'), read = $('#stageRead'), note = $('#stageNote');
    if (!box || !stage || !window.AgentixArt) return;
    box.innerHTML = '';
    AGENTS.forEach(function (a, i) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'agent';
      b.setAttribute('data-agent', i);
      b.innerHTML = '<span class="win"></span><b>' + a.name + '</b><span>' + a.role + '</span>';
      b.addEventListener('click', function () { select(i); });
      box.appendChild(b);
    });
    function select(i) {
      const r = window.AgentixArt.render(hex(sampleSeed(i)), 0);
      stage.innerHTML = r.svg;
      if (read) read.textContent = 'Agent ' + r.stats.agent + ' · ' + r.stats.role + ' · Sample shift · Finish ' + r.stats.clsName;
      if (note) note.textContent = STYLE_LINES[i];
      box.querySelectorAll('.agent').forEach(function (el, k) {
        el.classList.toggle('on', k === i);
        const w = el.querySelector('.win');
        if (w) w.classList.toggle('lit', k === i);
      });
    }
    select(1);
  })();

  // ---------- clock-in (mint) ledger ----------
  function paintStats(s) {
    const bc = $('#barCount'); if (bc) bc.textContent = fmt(s.minted);
    const mm = $('#mMinted'); if (mm) mm.textContent = fmt(s.minted);
    const ml = $('#mLeft'); if (ml) ml.textContent = fmt(s.max - s.minted);
    const mf = $('#mFill'); if (mf) mf.style.width = (s.minted / s.max * 100).toFixed(2) + '%';
    const st = $('#mStatus');
    if (st) {
      if (s.minted >= s.max) st.textContent = 'Sold out';
      else if (s.open) st.textContent = 'On shift, live';
      else if (typeof LAUNCH_AT !== 'undefined' && Date.now() < LAUNCH_AT) st.innerHTML = 'Opens 2 Nov 2026 · 04.30 UTC · <span data-cd></span>';
      else st.textContent = 'Clock-in opens soon';
      if (typeof applyLaunch === 'function') applyLaunch();
    }
  }
  function poll() {
    if (!window.AgentixChain) return;
    window.AgentixChain.stats().then(paintStats).catch(function () {});
  }
  poll();
  setInterval(poll, 15000);

  // ---------- gallery: recent works ----------
  (function gallery() {
    const box = $('#gallery');
    if (!box || !window.AgentixChain || !window.AgentixArt) return;
    window.AgentixChain.recent().then(function (j) {
      if (!j.items.length) return;
      box.innerHTML = '';
      j.items.forEach(function (it) {
        const r = window.AgentixArt.render(it.seed, it.id);
        const d = document.createElement('a');
        d.href = '/market';
        d.innerHTML = r.svg + '<span class="mono" style="display:block;padding:10px 12px">#' + it.id + ' · ' + r.stats.clsName + ' · ' + r.stats.agent + '</span>';
        box.appendChild(d);
      });
    }).catch(function () {});
  })();

  // ---------- check a wallet ----------
  (function check() {
    const btn = $('#whoBtn'), out = $('#whoOut'), inp = $('#who');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const a = (inp.value || '').trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(a)) { out.textContent = 'That does not look like a wallet address.'; return; }
      out.textContent = 'Reading contract…';
      window.AgentixChain.walletInfo(a).then(function (w) {
        if (!w.hasAgentId) out.textContent = 'No Agent ID. This wallet cannot clock in.';
        else if (w.minted >= 20) out.textContent = 'Agent ID held. 20 shifts worked. Wallet limit reached.';
        else out.textContent = 'Agent ID held. ' + w.minted + ' of 20 shifts worked. Ready to clock in.';
      }).catch(function () { out.textContent = 'Could not reach BNB Chain. Try again.'; });
    });
  })();

  // ---------- copy buttons ----------
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      const el = document.getElementById(b.getAttribute('data-copy'));
      if (!el) return;
      if (navigator.clipboard) navigator.clipboard.writeText(el.innerText);
      b.textContent = 'Copied';
      setTimeout(function () { b.textContent = 'Copy'; }, 1600);
    });
  });
})();
