// Agentix Studio art engine: one night-shift work per piece.
// Deterministic from (seed, id). Runs in the browser (window.AgentixArt)
// and in Node (module.exports) with identical output.
//
// Finish class, agent, shift and palette are NOT artistic choices: they
// repeat the exact rule stored by the NFT contract at mint (BigInt
// arithmetic on the seed), so the artwork always agrees with
// shiftClassOf / agentIndexOf on-chain:
//   r = seed % 1000 -> class 0 "Draft" (<700), 1 "Finished" (<970), 2 "Masterwork"
//   agentIndex  = (seed / 1000) % 12
//   shiftIndex  = (seed / 12000) % 6
//   paletteIndex = (seed / 72000) % 4
(function () {
  'use strict';

  var AGENTS = [
    { name: 'Vesper', role: 'Art Director' },
    { name: 'Noctis', role: 'Illustrator' },
    { name: 'Lumen', role: 'Lighting Artist' },
    { name: 'Somnia', role: 'Motion Designer' },
    { name: 'Orbit', role: 'Sound Designer' },
    { name: 'Echo', role: 'Copywriter' },
    { name: 'Prism', role: 'Colorist' },
    { name: 'Quartz', role: 'Type Designer' },
    { name: 'Marble', role: 'Sculptor' },
    { name: 'Velvet', role: 'Photographer' },
    { name: 'Cipher', role: 'Creative Coder' },
    { name: 'Dusk', role: 'Producer' }
  ];
  var CLASS_NAMES = ['Draft', 'Finished', 'Masterwork'];
  var ACCENT = '#7C6CFF';
  var GLOW = '#8F86FF';
  var PALETTES = [
    { name: 'Ultraviolet', bg: '#14102B', paper: '#1E1842', ink: '#CFC8FF', dim: '#6E639E' },
    { name: 'Moonlight', bg: '#0D1220', paper: '#16203A', ink: '#D7E3F4', dim: '#5E708C' },
    { name: 'Neon Rain', bg: '#081A1C', paper: '#0E2C2E', ink: '#C4F0E8', dim: '#4E7A76' },
    { name: 'Lamplight', bg: '#1C1108', paper: '#2C1D0E', ink: '#F2DFC2', dim: '#8A6E4E' }
  ];

  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFrom(seedStr) { return mulberry32(xmur3(seedStr)()); }

  function shiftClass(seedBig) {
    var r = seedBig % 1000n;
    return r < 700n ? 0 : (r < 970n ? 1 : 2);
  }
  function agentIndex(seedBig) { return Number((seedBig / 1000n) % 12n); }
  function shiftIndex(seedBig) { return Number((seedBig / 12000n) % 6n); }
  function paletteIndex(seedBig) { return Number((seedBig / 72000n) % 4n); }
  function shiftLabel(h) {
    function p(n) { return String(n).padStart(2, '0'); }
    return p(h) + '.00-' + p(h + 1) + '.00';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function f(n) { return Math.round(n * 10) / 10; }

  // Canvas geometry
  var CX = 140, CY = 150, CW = 520, CH = 440;

  // ---------- the twelve hands: one drawing style per agent ----------
  // Each style returns an ARRAY of svg element strings so a Draft can
  // stop early (first ~55 percent) like a shift abandoned at 3 a.m.
  var STYLES = [
    // 0 Vesper, Art Director: bold block grid
    function (c) {
      var els = [], cols = 4, rows = 3, gx = CX + 44, gy = CY + 44, gw = CW - 88, gh = CH - 88;
      var fills = [c.ink, c.dim, c.accent, c.paper, c.ink, c.glow, c.dim, c.ink, c.accent, c.dim, c.ink, c.paper];
      for (var i = 0; i < cols * rows; i++) {
        var x = gx + (i % cols) * (gw / cols), y = gy + Math.floor(i / cols) * (gh / rows);
        var w = gw / cols - 10, h = gh / rows - 10;
        if (fills[i] === c.paper) els.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="none" stroke="' + c.dim + '" stroke-width="3"/>');
        else els.push('<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + fills[i] + '" fill-opacity="' + (fills[i] === c.dim ? '0.75' : '0.92') + '"/>');
      }
      return els;
    },
    // 1 Noctis, Illustrator: moon and stars
    function (c) {
      var els = [], stars = '';
      for (var i = 0; i < 46; i++) {
        var sx = CX + 30 + c.rnd() * (CW - 60), sy = CY + 26 + c.rnd() * (CH - 120);
        stars += '<circle cx="' + f(sx) + '" cy="' + f(sy) + '" r="' + (0.9 + c.rnd() * 1.9).toFixed(1) + '" fill="' + c.ink + '" fill-opacity="' + (0.3 + c.rnd() * 0.6).toFixed(2) + '"/>';
      }
      els.push(stars);
      var mx = CX + CW * (0.36 + c.rnd() * 0.24), my = CY + CH * 0.4, mr = 92 + c.rnd() * 22;
      els.push('<circle cx="' + f(mx) + '" cy="' + f(my) + '" r="' + f(mr) + '" fill="' + c.ink + '"/><circle cx="' + f(mx + mr * 0.42) + '" cy="' + f(my - mr * 0.3) + '" r="' + f(mr * 0.82) + '" fill="' + c.paper + '"/>');
      var hy = CY + CH - 74;
      els.push('<line x1="' + (CX + 34) + '" y1="' + hy + '" x2="' + (CX + CW - 34) + '" y2="' + hy + '" stroke="' + c.dim + '" stroke-width="3"/>');
      var dash = '';
      for (var d = 0; d < 7; d++) {
        var dx = CX + 60 + c.rnd() * (CW - 120);
        dash += '<line x1="' + f(dx) + '" y1="' + (hy + 16 + d * 6) + '" x2="' + f(dx + 22 + c.rnd() * 40) + '" y2="' + (hy + 16 + d * 6) + '" stroke="' + c.dim + '" stroke-width="2.5" stroke-opacity="0.6"/>';
      }
      els.push(dash);
      return els;
    },
    // 2 Lumen, Lighting Artist: beams from one bright point
    function (c) {
      var els = [], ax = CX + CW / 2, ay = CY + 40;
      var feet = [0.08, 0.3, 0.5, 0.7, 0.92];
      feet.forEach(function (t, i) {
        els.push('<polygon points="' + ax + ',' + ay + ' ' + f(CX + CW * t - 26) + ',' + (CY + CH - 30) + ' ' + f(CX + CW * t + 26) + ',' + (CY + CH - 30) + '" fill="' + (i === 2 ? c.glow : c.ink) + '" fill-opacity="' + (i === 2 ? '0.34' : '0.15') + '"/>');
      });
      els.push('<circle cx="' + ax + '" cy="' + ay + '" r="13" fill="' + c.ink + '"/><circle cx="' + ax + '" cy="' + ay + '" r="26" fill="none" stroke="' + c.glow + '" stroke-width="2" stroke-opacity="0.7"/>');
      els.push('<line x1="' + (CX + 30) + '" y1="' + (CY + CH - 30) + '" x2="' + (CX + CW - 30) + '" y2="' + (CY + CH - 30) + '" stroke="' + c.dim + '" stroke-width="3"/>');
      return els;
    },
    // 3 Somnia, Motion Designer: flowing ribbons
    function (c) {
      var els = [], cols = [c.ink, c.glow, c.dim, c.accent];
      for (var k = 0; k < 4; k++) {
        var baseY = CY + 92 + k * 82, amp = 22 + c.rnd() * 20, ph = c.rnd() * 6.28, pts = '';
        for (var x = 0; x <= CW - 72; x += 16) {
          pts += (x === 0 ? 'M' : 'L') + f(CX + 36 + x) + ' ' + f(baseY + Math.sin(x / 74 + ph) * amp) + ' ';
        }
        els.push('<path d="' + pts + '" fill="none" stroke="' + cols[k] + '" stroke-width="' + (k === 1 ? 7 : 4.5) + '" stroke-opacity="' + (k === 2 ? '0.65' : '0.95') + '" stroke-linecap="round"/>');
      }
      return els;
    },
    // 4 Orbit, Sound Designer: rings and a pulse line
    function (c) {
      var els = [], cx = CX + CW / 2, cy = CY + CH / 2 - 28;
      for (var i = 4; i >= 0; i--) {
        els.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (34 + i * 30) + '" fill="none" stroke="' + (i === 1 ? c.accent : c.ink) + '" stroke-width="' + (i === 0 ? 5 : 3) + '" stroke-opacity="' + (0.35 + (4 - i) * 0.16).toFixed(2) + '"/>');
      }
      els.push('<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="' + c.accent + '"/>');
      var bars = '', n = 21, bw = (CW - 96) / n;
      for (var b = 0; b < n; b++) {
        var bh = 8 + Math.abs(Math.sin(b * 0.85)) * 30 * (0.5 + c.rnd() * 0.6);
        bars += '<rect x="' + f(CX + 48 + b * bw) + '" y="' + f(CY + CH - 44 - bh) + '" width="' + f(bw - 3) + '" height="' + f(bh) + '" fill="' + c.dim + '"/>';
      }
      els.push(bars);
      return els;
    },
    // 5 Echo, Copywriter: rows of almost-text
    function (c) {
      var els = [];
      for (var rI = 0; rI < 6; rI++) {
        var y = CY + 62 + rI * 58, x = CX + 48, row = '';
        var segs = 2 + Math.floor(c.rnd() * 2);
        for (var sIdx = 0; sIdx < segs; sIdx++) {
          var w = 56 + c.rnd() * 130;
          if (x + w > CX + CW - 48) w = CX + CW - 48 - x;
          if (w < 18) break;
          row += '<rect x="' + f(x) + '" y="' + y + '" width="' + f(w) + '" height="15" rx="7" fill="' + (rI === 2 ? c.accent : c.ink) + '" fill-opacity="' + (rI === 2 ? '0.95' : (0.45 + c.rnd() * 0.4).toFixed(2)) + '"/>';
          x += w + 18;
        }
        els.push(row);
      }
      return els;
    },
    // 6 Prism, Colorist: spectrum bars
    function (c) {
      var els = [], n = 12, bw = (CW - 96) / n;
      for (var i = 0; i < n; i++) {
        var bh = 60 + (i / (n - 1)) * (CH - 170) * (0.85 + c.rnd() * 0.25);
        var col = i >= n - 3 ? c.accent : (i >= n - 6 ? c.glow : c.ink);
        els.push('<rect x="' + f(CX + 48 + i * bw) + '" y="' + f(CY + CH - 52 - bh) + '" width="' + f(bw - 6) + '" height="' + f(bh) + '" fill="' + col + '" fill-opacity="' + (0.4 + (i / (n - 1)) * 0.58).toFixed(2) + '"/>');
      }
      els.push('<line x1="' + (CX + 40) + '" y1="' + (CY + CH - 52) + '" x2="' + (CX + CW - 40) + '" y2="' + (CY + CH - 52) + '" stroke="' + c.dim + '" stroke-width="3"/>');
      return els;
    },
    // 7 Quartz, Type Designer: one huge letter
    function (c) {
      var letter = 'AGXS'[Math.floor(c.rnd() * 4)];
      var els = [];
      els.push('<text x="' + (CX + CW / 2) + '" y="' + (CY + CH / 2 + 118) + '" font-family="monospace" font-weight="bold" font-size="330" text-anchor="middle" fill="' + c.ink + '" fill-opacity="0.94">' + letter + '</text>');
      var ticks = '';
      for (var i = 0; i <= 10; i++) {
        var tx = CX + 56 + i * ((CW - 112) / 10);
        ticks += '<line x1="' + f(tx) + '" y1="' + (CY + CH - 58) + '" x2="' + f(tx) + '" y2="' + (CY + CH - 58 - (i % 5 === 0 ? 22 : 12)) + '" stroke="' + c.dim + '" stroke-width="3"/>';
      }
      els.push(ticks + '<line x1="' + (CX + 48) + '" y1="' + (CY + CH - 58) + '" x2="' + (CX + CW - 48) + '" y2="' + (CY + CH - 58) + '" stroke="' + c.dim + '" stroke-width="3"/>');
      els.push('<text x="' + (CX + 48) + '" y="' + (CY + 66) + '" font-family="monospace" font-size="24" letter-spacing="6" fill="' + c.dim + '">SPECIMEN ' + letter + ' / NIGHT CUT</text>');
      return els;
    },
    // 8 Marble, Sculptor: nested arches
    function (c) {
      var els = [], cx = CX + CW / 2, base = CY + CH - 56;
      for (var i = 0; i < 5; i++) {
        var r = 62 + i * 40, top = base - 300 + i * 12;
        var col = i === 2 ? c.accent : c.ink;
        els.push('<path d="M' + (cx - r) + ' ' + base + ' V' + (top + r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + (top + r) + ' V' + base + '" fill="none" stroke="' + col + '" stroke-width="' + (i === 0 ? 6 : 4) + '" stroke-opacity="' + (0.4 + i * 0.15).toFixed(2) + '"/>');
      }
      els.push('<line x1="' + (CX + 40) + '" y1="' + base + '" x2="' + (CX + CW - 40) + '" y2="' + base + '" stroke="' + c.dim + '" stroke-width="3"/>');
      return els;
    },
    // 9 Velvet, Photographer: halftone field in four quadrants
    function (c) {
      var els = [], ccx = CX + CW * (0.34 + c.rnd() * 0.3), ccy = CY + CH * (0.34 + c.rnd() * 0.26);
      var quads = [[CX + 28, CY + 28], [CX + CW / 2, CY + 28], [CX + 28, CY + CH / 2], [CX + CW / 2, CY + CH / 2]];
      quads.forEach(function (q) {
        var g = '';
        for (var gx = 0; gx < 9; gx++) for (var gy = 0; gy < 7; gy++) {
          var px = q[0] + 14 + gx * 27, py = q[1] + 14 + gy * 27;
          var dist = Math.sqrt((px - ccx) * (px - ccx) + (py - ccy) * (py - ccy));
          var r = Math.max(0.8, 8.6 - dist / 34);
          g += '<circle cx="' + px + '" cy="' + py + '" r="' + r.toFixed(1) + '" fill="' + c.ink + '" fill-opacity="0.88"/>';
        }
        els.push(g);
      });
      return els;
    },
    // 10 Cipher, Creative Coder: circuit traces
    function (c) {
      var els = [];
      for (var i = 0; i < 5; i++) {
        var y0 = CY + 66 + i * 72, x = CX + 44, pts = 'M' + x + ' ' + y0, nodes = '';
        var segs = 2 + Math.floor(c.rnd() * 2);
        for (var sIdx = 0; sIdx < segs; sIdx++) {
          x += 90 + c.rnd() * 130;
          if (x > CX + CW - 70) x = CX + CW - 70;
          pts += ' H' + f(x);
          var dy = (c.rnd() < 0.5 ? -1 : 1) * (26 + c.rnd() * 30);
          var ny = Math.max(CY + 40, Math.min(CY + CH - 40, y0 + dy));
          pts += ' V' + f(ny); y0 = ny;
          nodes += '<circle cx="' + f(x) + '" cy="' + f(y0) + '" r="6" fill="' + c.paper + '" stroke="' + (i === 2 ? c.accent : c.ink) + '" stroke-width="3"/>';
        }
        els.push('<path d="' + pts + '" fill="none" stroke="' + (i === 2 ? c.accent : c.ink) + '" stroke-width="3.5" stroke-opacity="0.9"/>' + nodes);
      }
      return els;
    },
    // 11 Dusk, Producer: dusk bands and a low moon
    function (c) {
      var els = [], n = 6;
      for (var i = 0; i < n; i++) {
        var bh = (CH - 120) / n;
        els.push('<rect x="' + (CX + 36) + '" y="' + f(CY + 36 + i * bh) + '" width="' + (CW - 72) + '" height="' + f(bh - 5) + '" fill="' + (i === n - 2 ? c.accent : c.ink) + '" fill-opacity="' + (0.14 + i * 0.13).toFixed(2) + '"/>');
      }
      var sx = CX + CW * (0.3 + c.rnd() * 0.4), sy = CY + CH - 120;
      els.push('<path d="M' + (sx - 64) + ' ' + sy + ' A64 64 0 0 1 ' + (sx + 64) + ' ' + sy + ' Z" fill="' + c.glow + '" fill-opacity="0.9"/>');
      els.push('<line x1="' + (CX + 36) + '" y1="' + sy + '" x2="' + (CX + CW - 36) + '" y2="' + sy + '" stroke="' + c.dim + '" stroke-width="3"/>');
      return els;
    }
  ];

  function signature(rnd, pal) {
    var x = CX + CW - 118, y = CY + CH - 24, pts = 'M' + x + ' ' + y;
    for (var i = 1; i <= 5; i++) pts += ' L' + (x + i * 15) + ' ' + (y + (rnd() - 0.5) * 17);
    return '<path d="' + pts + '" fill="none" stroke="' + pal.ink + '" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.85"/>';
  }

  function render(seedInput, id) {
    var seedStr = String(seedInput);
    var seedBig;
    try { seedBig = BigInt(seedStr); } catch (e) { seedBig = 0n; }
    var cls = shiftClass(seedBig);
    var clsName = CLASS_NAMES[cls];
    var agIdx = agentIndex(seedBig);
    var agent = AGENTS[agIdx];
    var shIdx = shiftIndex(seedBig);
    var shift = shiftLabel(shIdx);
    var pal = PALETTES[paletteIndex(seedBig)];
    var rnd = rngFrom('agentix:' + seedStr + ':' + id);
    var ctx = { rnd: rnd, pal: pal, ink: pal.ink, dim: pal.dim, accent: ACCENT, glow: GLOW, paper: pal.paper };

    var W = 800, M = 40;
    var parts = [];
    parts.push('<rect width="800" height="800" fill="' + pal.bg + '"/>');
    // quiet window-grid dots in the room behind the canvas
    var dots = '';
    for (var dx = 52; dx < 800; dx += 56) for (var dy = 40; dy < 800; dy += 56) {
      if (dx > CX - 24 && dx < CX + CW + 24 && dy > CY - 24 && dy < CY + CH + 24) continue;
      dots += '<circle cx="' + dx + '" cy="' + dy + '" r="1.7" fill="' + pal.ink + '" fill-opacity="0.07"/>';
    }
    parts.push(dots);
    // lamp glow in one top corner
    var gx = rnd() < 0.5 ? 120 : 680, gy = 108;
    parts.push('<defs><radialGradient id="lamp" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="' + GLOW + '" stop-opacity="0.34"/><stop offset="100%" stop-color="' + GLOW + '" stop-opacity="0"/></radialGradient></defs>');
    parts.push('<circle cx="' + gx + '" cy="' + gy + '" r="190" fill="url(#lamp)"/>');
    parts.push('<circle cx="' + gx + '" cy="' + gy + '" r="7" fill="' + pal.ink + '" fill-opacity="0.9"/>');
    parts.push('<rect x="24" y="24" width="752" height="752" fill="none" stroke="' + pal.dim + '" stroke-opacity="0.4" stroke-width="1.5"/>');

    // ---- header ----
    parts.push('<text x="' + (M + 16) + '" y="72" font-family="monospace" font-size="21" letter-spacing="4" fill="' + pal.ink + '">AGENTIX STUDIO</text>');
    parts.push('<text x="' + (W - M - 16) + '" y="72" font-family="monospace" font-size="21" letter-spacing="4" text-anchor="end" fill="' + pal.dim + '">NIGHT SHIFT LOG</text>');
    parts.push('<line x1="' + (M + 16) + '" y1="94" x2="' + (W - M - 16) + '" y2="94" stroke="' + pal.dim + '" stroke-opacity="0.5" stroke-width="1.5"/>');
    parts.push('<text x="' + (M + 16) + '" y="126" font-family="monospace" font-size="16" letter-spacing="3" fill="' + pal.dim + '">ONE SHIFT · ONE AGENT · ONE WORK</text>');
    parts.push('<text x="' + (W - M - 16) + '" y="126" font-family="monospace" font-size="16" letter-spacing="3" text-anchor="end" fill="' + pal.dim + '">PALETTE ' + pal.name.toUpperCase() + '</text>');

    // ---- the canvas on the desk ----
    if (cls === 2) parts.push('<rect x="' + (CX - 11) + '" y="' + (CY - 11) + '" width="' + (CW + 22) + '" height="' + (CH + 22) + '" fill="none" stroke="' + ACCENT + '" stroke-width="3"/>');
    parts.push('<rect x="' + CX + '" y="' + CY + '" width="' + CW + '" height="' + CH + '" fill="' + pal.paper + '" stroke="' + pal.ink + '" stroke-opacity="0.55" stroke-width="2"/>');

    var els = STYLES[agIdx](ctx);
    var draw = els;
    if (cls === 0) draw = els.slice(0, Math.max(1, Math.floor(els.length * 0.55)));
    parts.push('<g>' + draw.join('') + '</g>');
    if (cls === 0) {
      // an untouched corner panel and the guide lines of an abandoned draft
      parts.push('<rect x="' + (CX + CW * 0.64) + '" y="' + (CY + CH * 0.62) + '" width="' + (CW * 0.36 - 14) + '" height="' + (CH * 0.38 - 14) + '" fill="' + pal.bg + '" fill-opacity="0.9" stroke="' + pal.dim + '" stroke-dasharray="7 7" stroke-width="2"/>');
      parts.push('<line x1="' + CX + '" y1="' + CY + '" x2="' + (CX + CW) + '" y2="' + (CY + CH) + '" stroke="' + pal.dim + '" stroke-width="1.6" stroke-dasharray="10 9" stroke-opacity="0.65"/>');
      parts.push('<line x1="' + (CX + 20) + '" y1="' + (CY + CH / 2) + '" x2="' + (CX + CW - 20) + '" y2="' + (CY + CH / 2) + '" stroke="' + pal.dim + '" stroke-width="1.6" stroke-dasharray="10 9" stroke-opacity="0.65"/>');
    }
    if (cls === 2) {
      parts.push('<text x="' + (CX + 20) + '" y="' + (CY + CH - 18) + '" font-family="monospace" font-size="17" letter-spacing="4" fill="' + ACCENT + '">MASTERWORK</text>');
    }
    if (cls >= 1) parts.push(signature(rnd, pal));

    // ---- below the canvas: the shift log lines ----
    var ly = 648;
    parts.push('<text x="' + (M + 16) + '" y="' + ly + '" font-family="monospace" font-size="19" letter-spacing="3" fill="' + pal.ink + '">AGENT ' + agent.name.toUpperCase() + ' · ' + agent.role.toUpperCase() + '</text>');
    parts.push('<text x="' + (M + 16) + '" y="' + (ly + 40) + '" font-family="monospace" font-size="19" letter-spacing="3" fill="' + pal.ink + '">SHIFT ' + shift + ' · FINISH <tspan fill="' + (cls === 2 ? ACCENT : pal.dim) + '">' + clsName.toUpperCase() + '</tspan></text>');
    parts.push('<text x="' + (M + 16) + '" y="' + (ly + 80) + '" font-family="monospace" font-size="19" letter-spacing="3" fill="' + pal.dim + '">SEED ' + esc(seedStr.slice(0, 10)).toUpperCase() + '</text>');
    parts.push('<text x="' + (W - M - 16) + '" y="' + (ly + 80) + '" font-family="monospace" font-size="19" letter-spacing="3" text-anchor="end" fill="' + pal.dim + '">' + (id > 0 ? 'NO. ' + id + ' / 12000' : 'ON THE DESK · DEMO') + '</text>');

    var traits = [
      { trait_type: 'Finish', value: clsName },
      { trait_type: 'Agent', value: agent.name },
      { trait_type: 'Role', value: agent.role },
      { trait_type: 'Shift', value: shift },
      { trait_type: 'Palette', value: pal.name },
      { trait_type: 'Seed', value: seedStr.slice(0, 10) }
    ];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">' + parts.join('') + '</svg>';
    return {
      id: id, seed: seedStr, traits: traits, svg: svg,
      stats: { cls: cls, clsName: clsName, agentIndex: agIdx, agent: agent.name, role: agent.role, shiftIndex: shIdx, shift: shift, palette: pal.name }
    };
  }

  var api = {
    render: render, AGENTS: AGENTS, PALETTES: PALETTES, CLASS_NAMES: CLASS_NAMES,
    shiftClass: shiftClass, agentIndex: agentIndex, shiftIndex: shiftIndex, paletteIndex: paletteIndex, shiftLabel: shiftLabel
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.AgentixArt = api;
})();
