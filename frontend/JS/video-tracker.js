/* ──────────────────────────────────────────────
   video-tracker.js — Rastreamento de video YouTube
   Usa a YouTube IFrame API para rastrear progresso.
   Requer: api.js (authFetch, isAuthenticated)
   ────────────────────────────────────────────── */

var VideoTracker = (function () {
  var player = null;
  var lessonId = null;
  var duration = 0;
  var progress = 0;
  var sentComplete = false;
  var saveInterval = null;
  var statusEl = null;

  function init() {
    var body = document.body;
    lessonId = body.getAttribute('data-lesson-id');
    if (!lessonId || !isAuthenticated()) return;

    loadYouTubeAPI();
    createStatusUI();
  }

  function loadYouTubeAPI() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = function () {
      showPlayerError();
    };
    document.head.appendChild(tag);

    // Se a API não carregar em 8s, mostra a mensagem de fallback
    setTimeout(function () {
      if (!window.YT || !window.YT.Player) showPlayerError();
    }, 8000);
  }

  function createStatusUI() {
    var container = document.querySelector('.video-wrapper');
    if (!container) return;

    statusEl = document.createElement('div');
    statusEl.id = 'video-status';
    statusEl.className = 'video-status';
    statusEl.innerHTML =
      '<span class="vs-icon" id="vs-icon" style="display:none;"></span>' +
      '<span id="vs-text" class="vs-text"></span>' +
      '<div class="vs-track"><div id="vs-bar" class="vs-bar"></div></div>' +
      '<span id="vs-pct" class="vs-pct">0%</span>';

    container.parentElement.insertBefore(statusEl, container.nextSibling);
  }

  function iconSVG(kind) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  }

  function updateStatus(pct, text) {
    var bar = document.getElementById('vs-bar');
    var pctEl = document.getElementById('vs-pct');
    var textEl = document.getElementById('vs-text');
    var iconEl = document.getElementById('vs-icon');
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (textEl) textEl.textContent = text || '';
    if (statusEl) {
      if (pct >= 100) {
        statusEl.classList.add('done');
        if (iconEl) {
          iconEl.style.display = 'flex';
          iconEl.innerHTML = iconSVG('done');
        }
      } else {
        statusEl.classList.remove('done');
        if (iconEl) {
          iconEl.style.display = 'none';
          iconEl.innerHTML = '';
        }
      }
    }
  }

  function onYouTubeReady(event) {
    player = event.target;
    duration = player.getDuration();
    updateStatus(0, '');

    setInterval(tick, 2000);
  }

  function tick() {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    var state = player.getPlayerState();
    if (state !== 1 && state !== 0) return; // playing ou ended

    var time = player.getCurrentTime();
    var dur = player.getDuration();
    if (dur <= 0) return;

    progress = Math.min(100, Math.round((time / dur) * 100));
    updateStatus(progress, state === 0 ? 'Video finalizado' : 'Assistindo...');

    if (progress >= 90 && !sentComplete) {
      sentComplete = true;
      markComplete();
    }
  }

  function saveProgress() {
    if (!player || !lessonId || !isAuthenticated()) return;

    var time = player.getCurrentTime();
    var dur = player.getDuration();
    if (dur <= 0) return;

    var pct = Math.min(100, Math.round((time / dur) * 100));

    apiFetch('/lessons/' + lessonId + '/video-progress', {
      method: 'POST',
      body: JSON.stringify({ progress: pct, currentTime: Math.round(time) }),
    }).catch(function (err) { console.error('Erro ao salvar progresso:', err); });
  }

  function markComplete() {
    if (!lessonId || !isAuthenticated()) return;

    updateStatus(100, 'Aula concluida!');

    apiFetch('/lessons/' + lessonId + '/complete', {
      method: 'POST',
    }).then(function () {
      showCompletionBadge(true);
      checkModuleCompletion();
    }).catch(function (err) { console.error('Erro ao marcar conclusao:', err); });
  }

  // Ao concluir a última aula de um módulo, mostra o "Parabéns" na hora
  function checkModuleCompletion() {
    if (typeof getAulaPorId !== 'function' || !lessonId) return;
    var info = getAulaPorId(parseInt(lessonId, 10));
    if (!info) return;

    apiFetch('/progress/status').then(function (status) {
      var concluidas = {};
      var i;
      for (i = 0; i < status.concluidas.length; i++) concluidas[status.concluidas[i]] = true;

      var total = info.modulo.aulas.length;
      var done = 0;
      for (i = 0; i < info.modulo.aulas.length; i++) {
        if (concluidas[info.modulo.aulas[i].id]) done++;
      }
      if (done < total) return;

      showModuleCompleteBanner(info.modulo);
    }).catch(function (err) { console.error('Erro ao verificar modulo:', err); });
  }

  function showModuleCompleteBanner(mod) {
    if (document.querySelector('.module-complete-banner')) return;

    // Insere depois do texto da aula, logo antes da fileira de botões
    var buttons = document.querySelector('.glass-shell > div[style*="display: flex"]');
    var anchor = buttons || statusEl;
    if (!anchor) return;

    var icon =
      '<span class="mcb-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>' +
      '<path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>' +
      '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>' +
      '<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>';

    var actions =
      '<a href="' + getModuloPagina(mod.ordem, true) + '" class="btn-account mcb-primary" style="padding:12px 24px;color:white;text-decoration:none;">Ver Módulo</a>' +
      '<a href="../../index.html" class="btn-account" style="padding:12px 24px;color:white;text-decoration:none;">Voltar ao Menu</a>';

    var banner = document.createElement('div');
    banner.className = 'module-complete-banner glow';
    banner.innerHTML =
      icon +
      '<div class="mcb-body">' +
      '<h3>Parabéns! Módulo concluído!</h3>' +
      '<p>Você concluiu todas as aulas do Módulo <strong>' + mod.titulo + '</strong>!</p>' +
      '</div>' +
      '<div class="mcb-actions">' + actions + '</div>';

    anchor.parentNode.insertBefore(banner, anchor);
  }

  function showCompletionBadge(celebrate) {
    if (statusEl) statusEl.classList.add('done');
    var wrapper = document.querySelector('.video-wrapper');
    if (wrapper) {
      wrapper.classList.add('concluido');
      addCheckBadge(wrapper);
      if (celebrate) celebrateGreen();
    }
    updateStatus(100, 'Vídeo finalizado · Aula concluída!');

    var nextBtn = document.querySelector('.btn-next-lesson');
    if (nextBtn) nextBtn.classList.add('enabled');
  }

  // Selo de check verde no canto do vídeo concluído
  function addCheckBadge(wrapper) {
    if (wrapper.querySelector('.video-check-badge')) return;
    var badge = document.createElement('span');
    badge.className = 'video-check-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 6 9 17l-5-5"/></svg>';
    wrapper.appendChild(badge);
  }

  // Flash verde + confetes ao concluir aula/vídeo
  function celebrateGreen() {
    var flash = document.createElement('div');
    flash.className = 'success-flash';
    document.body.appendChild(flash);
    setTimeout(function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 1300);

    var burst = document.createElement('div');
    burst.className = 'confetti-burst';
    var colors = ['#10B981', '#34D399', '#6EE7B7', '#0EA5E9', '#A7F3D0'];
    var html = '';
    for (var i = 0; i < 26; i++) {
      var size = 6 + Math.random() * 6;
      var round = i % 3 === 0 ? 'border-radius:50%;' : '';
      html += '<i style="left:' + (Math.random() * 100) + '%;width:' + size + 'px;height:' +
        Math.round(size * 0.6) + 'px;background:' + colors[i % colors.length] +
        ';animation-duration:' + (1.6 + Math.random() * 1.3) + 's;animation-delay:' +
        (Math.random() * 0.5) + 's;' + round + '"></i>';
    }
    burst.innerHTML = html;
    document.body.appendChild(burst);
    setTimeout(function () {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 5000);
  }

  function loadProgress() {
    if (!lessonId || !isAuthenticated()) return;

    apiFetch('/progress/status').then(function (status) {
      var id = parseInt(lessonId, 10);
      var concluido = status.concluidas.indexOf(id) !== -1;
      var progressoVideo = status.emAndamento[id] || 0;

      if (concluido) {
        sentComplete = true;
        showCompletionBadge(false);
      } else if (progressoVideo > 0) {
        updateStatus(progressoVideo, 'Progresso salvo: ' + progressoVideo + '%');
      }
    }).catch(function (err) { console.error('Erro ao carregar progresso:', err); });
  }

  // Called by YouTube IFrame API
  window.onYouTubeIframeAPIReady = function () {
    var frame = document.getElementById('youtube-player');
    if (!frame) return;

    // O parâmetro `origin` é exigido pela IFrame API (enablejsapi=1) e evita
    // falhas de comunicação com o player. Garante que esteja sempre presente.
    var src = frame.src || '';
    if (src.indexOf('origin=') === -1) {
      frame.src = src + (src.indexOf('?') === -1 ? '?' : '&') +
        'origin=' + encodeURIComponent(window.location.origin);
    }

    try {
      player = new YT.Player('youtube-player', {
        videoId: getYouTubeId(src),
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: onYouTubeReady,
          onError: showPlayerError,
        },
      });
    } catch (e) {
      showPlayerError();
      return;
    }

    loadProgress();

    saveInterval = setInterval(function () {
      var st = player && player.getPlayerState && player.getPlayerState();
      if (st === 1 || st === 0) {
        saveProgress();
      }
    }, 10000);
  };

  function getYouTubeId(url) {
    var m = /(?:youtube\.com\/(?:embed|watch)\?v=|youtu\.be\/|embed\/)([\w-]{6,})/.exec(url || '');
    return m ? m[1] : null;
  }

  // YouTube não conseguiu carregar o player (ex.: bloqueio de incorporação ou
  // ausência de referer). Mostra um aviso e um link para assistir no YouTube.
  function showPlayerError() {
    if (!statusEl) return;
    if (statusEl.classList.contains('error')) return;

    statusEl.classList.remove('done');
    statusEl.classList.add('error');
    statusEl.innerHTML =
      '<span class="vs-icon" style="display:flex;color:#F87171;">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
      '<circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></span>' +
      '<span id="vs-text" class="vs-text">Não foi possível carregar o player. ' +
      '<a href="https://www.youtube.com/watch?v=' + encodeURIComponent(getLessonVideoId()) +
      '" target="_blank" rel="noopener" style="color:#93C5FD;">Assistir no YouTube</a></span>';

    addManualComplete();
  }

  function getLessonVideoId() {
    var frame = document.getElementById('youtube-player');
    return frame ? getYouTubeId(frame.src) : '';
  }

  // Permite concluir a aula manualmente mesmo se o player não carregar
  function addManualComplete() {
    var existing = document.querySelector('.btn-manual-complete');
    if (existing) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-account btn-manual-complete';
    btn.style.cssText = 'padding:12px 24px;margin-top:16px;cursor:pointer;';
    btn.textContent = 'Concluir aula manualmente';
    btn.addEventListener('click', function () {
      markComplete();
      btn.disabled = true;
      btn.textContent = 'Aula concluída!';
    });

    var wrapper = document.querySelector('.video-wrapper');
    var anchor = wrapper ? wrapper.parentElement : document.body;
    anchor.appendChild(btn);
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function () {
  VideoTracker.init();
});
