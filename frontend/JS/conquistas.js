/* ──────────────────────────────────────────────
   conquistas.js — Página de Conquistas (Diversões)
   Requer: api.js (apiFetch), shared.js
   ────────────────────────────────────────────── */

var ACH_ICONS = {
  play: '<path d="M8 5v14l11-7z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  stairs: '<path d="M3 21h18"/><path d="M3 21V3"/><path d="M3 21h6v-6h6v-6h6"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0z"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  crown: '<path d="M2 18h20"/><path d="M4 7l4 5 4-9 4 9 4-5 1 10H3l1-10z"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  power: '<path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
  mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M6 11h12"/><path d="M12 3v4"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6.01" y2="10"/><line x1="10" y1="10" x2="10.01" y2="10"/><line x1="14" y1="10" x2="14.01" y2="10"/><line x1="18" y1="10" x2="18.01" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/>',
  window: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>',
  gamepad: '<path d="M6 12h4M8 10v4"/><path d="M15 11h.01M18 13h.01"/><path d="M17.32 5H6.68a4 4 0 00-3.98 3.58L2.16 20a1.92 1.92 0 003.36 1.24l2.12-2.53a4 4 0 012.64-1.31h3.44a4 4 0 012.64 1.31l2.12 2.53a1.92 1.92 0 003.36-1.24l-.54-11.42A4 4 0 0017.32 5z"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>',
  gauge: '<path d="M4 14a8 8 0 0116 0"/><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>'
};

function achIcon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    (ACH_ICONS[name] || ACH_ICONS.lock) + '</svg>';
}

function fmtDataAch(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  return 'Obtida em ' + dd + '/' + mm + '/' + d.getFullYear();
}

function escAch(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderConquistas(data) {
  var grid = document.getElementById('ach-grid');
  if (!grid) return;

  document.getElementById('ach-count').textContent = data.conquistadas + ' de ' + data.total + ' conquistas';
  var pctEl = document.getElementById('ach-percent');
  var pct = data.total ? Math.round((data.conquistadas / data.total) * 100) : 0;
  pctEl.textContent = pct + '%';
  var fill = document.getElementById('ach-fill');
  if (fill) fill.style.width = pct + '%';

  grid.innerHTML = '';
  data.conquistas.forEach(function (a) {
    var card = document.createElement('div');
    card.className = 'ach-card' + (a.conquistada ? ' unlocked' : ' locked');
    if (data.novas.indexOf(a.slug) !== -1) card.classList.add('just-new');

    var progress = '';
    if (a.progresso.meta > 1) {
      var p = Math.round((a.progresso.atual / a.progresso.meta) * 100);
      progress =
        '<div class="ach-progress">' +
        '<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:' + p + '%"></div></div>' +
        '<span class="ach-progress-num">' + a.progresso.atual + '/' + a.progresso.meta + '</span>' +
        '</div>';
    }

    card.innerHTML =
      '<div class="ach-medal">' + achIcon(a.icone) +
      (a.conquistada ? '' : '<span class="ach-lock">' + achIcon('lock') + '</span>') +
      '</div>' +
      '<div class="ach-info">' +
      '<h3>' + escAch(a.titulo) + '</h3>' +
      '<p>' + escAch(a.descricao) + '</p>' +
      progress +
      '<span class="ach-date">' + (a.conquistada ? fmtDataAch(a.obtidaEm) : 'Ainda bloqueada') + '</span>' +
      '</div>';
    grid.appendChild(card);
  });
}

function confettiAch() {
  var burst = document.getElementById('confetti-burst');
  if (!burst) return;
  burst.innerHTML = '';
  var cores = ['#10B981', '#0ea5e9', '#6366f1', '#fbbf24', '#f43f5e'];
  for (var i = 0; i < 40; i++) {
    var s = document.createElement('i');
    s.style.left = (Math.random() * 100) + '%';
    s.style.background = cores[i % cores.length];
    s.style.animationDelay = (Math.random() * 0.4) + 's';
    s.style.animationDuration = (0.9 + Math.random() * 0.8) + 's';
    burst.appendChild(s);
  }
  burst.classList.add('show');
  setTimeout(function () { burst.classList.remove('show'); burst.innerHTML = ''; }, 2200);
}

function toastNovaConquista(titulo) {
  var toast = document.getElementById('ach-toast');
  if (!toast) return;
  toast.innerHTML = 'Nova conquista desbloqueada: ' + titulo;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { toast.classList.remove('show'); }, 4200);
}

function marcaVistas(novas) {
  var chave = 'ach_vistas';
  var vistas = {};
  try { vistas = JSON.parse(localStorage.getItem(chave) || '{}'); } catch (_) {}
  var mudou = false;
  (novas || []).forEach(function (slug) {
    if (!vistas[slug]) { vistas[slug] = true; mudou = true; }
  });
  if (mudou) localStorage.setItem(chave, JSON.stringify(vistas));
}

async function carregarConquistas() {
  try {
    var data = await apiFetch('/achievements');
    renderConquistas(data);

    var novas = (data.novas || []).slice();
    if (novas.length) {
      var jaVistas = {};
      try { jaVistas = JSON.parse(localStorage.getItem('ach_vistas') || '{}'); } catch (_) {}
      var paraAnimar = novas.filter(function (slug) { return !jaVistas[slug]; });
      marcaVistas(novas);
      if (paraAnimar.length) {
        confettiAch();
        var primeira = data.conquistas.find(function (a) { return a.slug === paraAnimar[0]; });
        toastNovaConquista(primeira ? primeira.titulo : '');
      }
    }
  } catch (err) {
    var grid = document.getElementById('ach-grid');
    if (grid) grid.innerHTML = '<p class="ach-loading">Não foi possível carregar suas conquistas.</p>';
  }
}

document.addEventListener('DOMContentLoaded', carregarConquistas);
