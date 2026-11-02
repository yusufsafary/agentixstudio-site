// Agentix Studio payroll section: ledger, status, masterwork tracker,
// check a work.
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => n.toLocaleString('en');
  const fmtTok = (wei) => fmt(Number(BigInt(wei) / 1000000000000000000n));
  if (!$('#claim')) return;
  const AGENTS = window.AgentixArt ? window.AgentixArt.AGENTS : [];
  const CLS = ['Draft', 'Finished', 'Masterwork'];

  function paint(c) {
    const cc = $('#cClaimed'); if (cc) cc.textContent = fmt(c.claimed);
    const cf = $('#cFill'); if (cf) cf.style.width = (c.claimed / c.max * 100).toFixed(2) + '%';
    const st = $('#cStatus');
    if (st) st.textContent = c.open ? 'Claims open' : 'Payroll opens later';
  }
  function poll() {
    if (!window.AgentixChain) return;
    window.AgentixChain.claimInfo().then(paint).catch(function () {});
  }
  poll();
  setInterval(poll, 30000);

  // ---------- masterwork tracker: twelve slots, one per agent ----------
  (function tracker() {
    const box = $('#slots');
    if (!box) return;
    box.innerHTML = AGENTS.map(function (a, i) {
      return '<div class="slot" data-slot="' + i + '"><div class="no">AGENT ' + a.name.toUpperCase() + ' · ' + a.role.toUpperCase() + '</div><div class="w">No masterwork yet</div></div>';
    }).join('');
    if (!window.AgentixChain) return;
    window.AgentixChain.tracker().then(function (t) {
      (t.found || []).forEach(function (idx) {
        const el = box.querySelector('[data-slot="' + idx + '"]');
        if (el) {
          el.classList.add('found');
          el.querySelector('.w').textContent = 'Masterwork found';
        }
      });
    }).catch(function () {});
  })();

  const btn = $('#workBtn'), out = $('#workOut'), inp = $('#work');
  if (btn) btn.addEventListener('click', function () {
    const id = parseInt((inp.value || '').replace(/[^0-9]/g, ''), 10);
    if (!id || id < 1 || id > 12000) { out.textContent = 'Enter a work number from 1 to 12,000.'; return; }
    out.textContent = 'Reading contracts…';
    window.AgentixChain.stats().then(function (s) {
      if (id > s.minted) { out.textContent = 'Work #' + id + ' has not been clocked in yet.'; return null; }
      return window.AgentixChain.claimInfo(id).then(function (c) {
        if (c.claimedForId) { out.textContent = 'Work #' + id + ': $AGXS already claimed.'; return; }
        const agent = AGENTS[c.agentIndex] ? AGENTS[c.agentIndex].name : 'Unknown';
        out.textContent = 'Work #' + id + ': unclaimed. Finish ' + CLS[c.shiftClass] + ' by ' + agent + ', worth ' + fmtTok(c.amountWei) + ' $AGXS. Owner ' + (c.owner ? c.owner.slice(0, 6) + '…' + c.owner.slice(-4) : 'unknown') + ' can claim it.';
      });
    }).catch(function () { out.textContent = 'Could not reach BNB Chain. Try again.'; });
  });
})();
