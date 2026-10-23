/* ──────────────────────────────────────────────
   modulos.js — Carrega aulas de um modulo dinamicamente
   Usa dados hardcoded de aulas.js + progresso do backend
   Requer: api.js, shared.js, script.js, aulas.js
   Uso: <body data-module-order="1">
   ────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var moduleOrder = parseInt(body.getAttribute('data-module-order'), 10);
  if (!moduleOrder) return;

  var mod = getModuloPorOrdem(moduleOrder);
  if (!mod) return;

  var grid = document.getElementById('lessons-grid');
  if (!grid) return;

  apiFetch('/progress/status').then(function (status) {
    var concluidas = {};
    var emAndamento = {};
    var i;
    for (i = 0; i < status.concluidas.length; i++) concluidas[status.concluidas[i]] = true;
    for (var k in status.emAndamento) emAndamento[k] = status.emAndamento[k];

    grid.innerHTML = '';

    for (i = 0; i < mod.aulas.length; i++) {
      var aula = mod.aulas[i];
      var href = '../' + mod.prefixo + aula.arquivo;
      var concluido = !!concluidas[aula.id];
      var progressoVideo = emAndamento[aula.id] || 0;
      var bloqueada = !isAulaDesbloqueada(aula.id, concluidas);

      var cssClass = 'card-elite';
      var extra = '';

      if (bloqueada) {
        cssClass += ' locked';
      } else if (concluido) {
        cssClass += ' done';
      } else if (progressoVideo > 0) {
        cssClass += ' in-progress';
      }

      var tag = bloqueada ? 'div' : 'a';
      var attrs = bloqueada
        ? ' aria-disabled="true" title="Conclua a aula anterior para desbloquear"'
        : ' href="' + href + '"';

      var inner = '<h3>' + aula.titulo + '</h3>';
      if (progressoVideo > 0 && !concluido) {
        inner += '<div style="font-size:0.8rem;color:#6366F1;margin-top:8px;text-align:center;">' + progressoVideo + '% assistido</div>';
      }

      grid.innerHTML += '<' + tag + ' class="' + cssClass + '"' + attrs + '>' + inner + '</' + tag + '>';
    }

    var concluidasMod = 0;
    for (i = 0; i < mod.aulas.length; i++) {
      if (concluidas[mod.aulas[i].id]) concluidasMod++;
    }
    var pct = mod.aulas.length > 0 ? Math.round((concluidasMod / mod.aulas.length) * 100) : 0;

    var titleEl = document.getElementById('module-title');
    if (titleEl) {
      titleEl.textContent = mod.titulo + (pct > 0 ? ' (' + pct + '%)' : '');
    }

    if (pct >= 100 && mod.aulas.length > 0) {
      showModuleCompleteBanner(mod);
    }
  }).catch(function (err) {
    console.error('Failed to load progress:', err);
    grid.innerHTML = '<p style="color:#EF4444;text-align:center;grid-column:1/-1;">Erro ao carregar aulas. Verifique sua conexao e tente novamente.</p>';
  });
});

function showModuleCompleteBanner(mod) {
  var grid = document.getElementById('lessons-grid');
  if (!grid) return;

  var banner = document.createElement('div');
  banner.className = 'module-complete-banner glow';

  var icon =
    '<span class="mcb-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>' +
    '<path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>' +
    '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>' +
    '<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>';

  var next = getProximoModuloPagina(mod.ordem, false);
  var actions = next
    ? '<a href="' + next + '" class="btn-account mcb-primary" style="padding:12px 24px;color:white;text-decoration:none;">Próximo Módulo →</a>' +
      '<a href="../index.html" class="btn-account" style="padding:12px 24px;color:white;text-decoration:none;">Voltar ao Menu</a>'
    : '<a href="../index.html" class="btn-account mcb-primary" style="padding:12px 24px;color:white;text-decoration:none;">Voltar ao Menu</a>';

  banner.innerHTML =
    icon +
    '<div class="mcb-body">' +
    '<h3>Parabéns! Módulo concluído!</h3>' +
    '<p>Você concluiu todas as aulas do Módulo <strong>' + mod.titulo + '</strong>!</p>' +
    '</div>' +
    '<div class="mcb-actions">' + actions + '</div>';

  var titleEl = document.getElementById('module-title');
  if (titleEl) {
    titleEl.parentNode.insertBefore(banner, grid);
  } else {
    grid.parentNode.insertBefore(banner, grid);
  }
}
