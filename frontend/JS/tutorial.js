/* ──────────────────────────────────────────────
   tutorial.js — Guia interativo para novos usuários
   Requer: api.js (isAuthenticated)
   Detecta a página atual e mostra passos guiados.
   ────────────────────────────────────────────── */

(function () {
  'use strict';

  var KEY = 'seadi_tutorial';

  function getState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  function saveState(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function isDone(section) {
    return !!getState()[section];
  }

  function setDone(section) {
    var s = getState();
    s[section] = true;
    saveState(s);
  }

  function resetTutorial() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    var path = window.location.pathname || '';
    if (/\/index\.html$/.test(path)) {
      window.location.reload();
    } else {
      window.location.href = '/index.html';
    }
  }

  /* ── Detecta o tipo de página ── */
  function detectSection() {
    if (document.body.getAttribute('data-lesson-id')) return 'aula';
    if (document.body.getAttribute('data-module-order')) return 'modulos';
    if (document.getElementById('mod-card-1')) return 'dashboard';
    return null;
  }

  /* ── Passos de cada página ── */
  // Resolvido no momento do clique para garantir que as aulas já tenham carregado
  function firstLessonHref() {
    var unlocked = document.querySelector('#lessons-grid a.card-elite:not(.locked)');
    if (unlocked && unlocked.getAttribute('href')) return unlocked.getAttribute('href');
    var any = document.querySelector('#lessons-grid a.card-elite');
    if (any && any.getAttribute('href')) return any.getAttribute('href');
    var mod = (typeof getModuloPorOrdem === 'function') ? getModuloPorOrdem(1) : null;
    if (mod && mod.aulas.length) return '../' + mod.prefixo + mod.aulas[0].arquivo;
    return '/modulos/modulosinici.html';
  }

  function buildSteps(section) {
    if (section === 'dashboard') {
      return [
        {
          target: '.hero-title',
          title: 'Bem-vindo(a) ao SEADI!',
          desc: 'Esta é a sua página inicial. Por aqui você acompanha todo o seu curso de informática básica.',
        },
        {
          target: '#mod-card-1',
          title: 'Seus módulos',
          desc: 'O curso é dividido em 3 módulos: Iniciante, Básico e Avançado. O próximo módulo é liberado quando você conclui o anterior.',
        },
        {
          target: '#mod-card-1 .mod-progress-text',
          title: 'Seu progresso',
          desc: 'Cada cartão mostra a porcentagem concluída do módulo. Vamos ver como abrir uma aula?',
          fallback: '#mod-card-1',
        },
        {
          target: '.profile-trigger',
          title: 'Seu perfil',
          desc: 'No menu do seu perfil você altera seus dados, troca a senha e sai da plataforma.',
          offset: 36,
        },
        {
          title: 'Hora de estudar!',
          desc: 'Vamos conhecer a tela de aulas do módulo Iniciante.',
          next: '/modulos/modulosinici.html',
        },
      ];
    }

    if (section === 'modulos') {
      return [
        {
          target: '#module-title',
          title: 'Módulo de aulas',
          desc: 'Todas as aulas deste módulo aparecem aqui, uma por uma, na ordem do curso.',
        },
        {
          target: '#lessons-grid',
          title: 'Lista de aulas',
          desc: 'Clique no cartão de uma aula para abrir o vídeo e começar a estudar.',
        },
        {
          target: '#lessons-grid a.card-elite',
          title: 'Abra sua primeira aula',
          desc: 'Aulas concluídas ganham destaque. As bloqueadas mostram um cadeado e vão liberando uma a uma.',
          fallback: '#lessons-grid',
        },
        {
          title: 'Vamos assistir!',
          desc: 'Clique em Continuar para abrir a primeira aula.',
          next: firstLessonHref,
        },
      ];
    }

    if (section === 'aula') {
      return [
        {
          target: '.video-wrapper',
          title: 'Aula em vídeo',
          desc: 'Assista ao vídeo da aula. Você pode pausar e voltar quando quiser.',
        },
        {
          target: '#video-status',
          title: 'Progresso do vídeo',
          desc: 'Esta barra mostra o quanto você já assistiu. Ao atingir 90%, a aula é concluída automaticamente.',
          fallback: '.video-wrapper',
        },
        {
          target: '.btn-next-lesson',
          title: 'Próxima aula',
          desc: 'Quando o vídeo terminar, o botão "Próxima Página" é liberado para você continuar o curso.',
          fallback: '.video-wrapper',
        },
        {
          title: 'Agora você já sabe usar o SEADI!',
          desc: 'Bons estudos! Você pode rever este tutorial a qualquer momento no menu do seu perfil.',
          done: true,
        },
      ];
    }

    return [];
  }

  /* ── Renderização do guia ── */
  function start(steps, section) {
    var box = document.createElement('div');
    box.className = 'tut-box';
    var tip = document.createElement('div');
    tip.className = 'tut-tip';
    document.body.appendChild(box);
    document.body.appendChild(tip);

    var index = 0;
    var raf = null;

    function resolveTarget(step) {
      if (!step.target) return null;
      var el = document.querySelector(step.target);
      if (el) return el;
      if (step.fallback) return document.querySelector(step.fallback) || null;
      return null;
    }

    function clearTipInline() {
      tip.style.left = '';
      tip.style.top = '';
      tip.style.bottom = '';
      tip.style.transform = 'none';
    }

    function positionTarget(target, offset) {
      var isMobile = window.matchMedia('(max-width: 768px)').matches;
      offset = offset || 0;

      if (!target) {
        box.style.display = 'none';
        clearTipInline();
        if (!isMobile) {
          tip.style.left = '50%';
          tip.style.top = '40%';
          tip.style.transform = 'translateX(-50%)';
        }
        return;
      }

      var rect = target.getBoundingClientRect();
      var pad = 6;
      box.style.display = 'block';
      box.style.left = Math.max(0, rect.left - pad) + 'px';
      box.style.top = Math.max(0, rect.top - pad) + 'px';
      box.style.width = Math.min(rect.width + pad * 2, window.innerWidth) + 'px';
      box.style.height = Math.min(rect.height + pad * 2, window.innerHeight) + 'px';

      // No mobile a media query do CSS fixa o balão embaixo (bottom: 16px).
      // Limpa os estilos inline para não sobrescrever o bottom:16px do CSS.
      if (isMobile) {
        clearTipInline();
        return;
      }

      var vpW = window.innerWidth;
      var vpH = window.innerHeight;
      var margin = 12;
      var tipW = tip.offsetWidth || 340;
      var tipH = tip.offsetHeight || 240;
      var gap = 14;

      var maxLeft = Math.max(margin, vpW - tipW - margin);
      var left = Math.max(margin, Math.min(rect.left, maxLeft));

      var belowTop = rect.bottom + gap + offset;
      var aboveTop = rect.top - gap - tipH + offset;

      // Limpa estilos que podem ter sobrado de estados anteriores
      // (bottom:16px anexado ou translateX do modo centralizado)
      tip.style.transform = 'none';
      tip.style.bottom = '';
      tip.style.left = left + 'px';

      if (belowTop + tipH <= vpH - margin && belowTop >= margin) {
        tip.style.top = belowTop + 'px';
      } else if (aboveTop >= margin) {
        tip.style.top = aboveTop + 'px';
      } else {
        tip.style.left = Math.max(margin, Math.floor((vpW - tipW) / 2)) + 'px';
        tip.style.top = 'auto';
        tip.style.bottom = '16px';
      }
    }

    function render() {
      var step = steps[index];
      var target = resolveTarget(step);

      if (target) {
        try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* ignore */ }
        setTimeout(function () { positionTarget(target, step.offset); }, 380);
      } else {
        positionTarget(null, step.offset);
      }

      var dots = '';
      for (var i = 0; i < steps.length; i++) {
        dots += '<div class="tut-dot' + (i === index ? ' active' : '') + '"></div>';
      }

      var canGoBack = index > 0;
      var isLast = index === steps.length - 1;
      var label;
      if (step.done) label = 'Finalizar';
      else if (step.next) label = 'Continuar';
      else if (isLast) label = 'Finalizar';
      else label = 'Próximo';

      tip.setAttribute('role', 'dialog');
      tip.setAttribute('aria-label', 'Tutorial SEADI, passo ' + (index + 1) + ' de ' + steps.length);

      tip.innerHTML =
        '<div class="tut-kicker">Tutorial SEADI</div>' +
        '<div class="tut-progress">Passo ' + (index + 1) + ' de ' + steps.length + '</div>' +
        '<h3>' + step.title + '</h3>' +
        '<p>' + step.desc + '</p>' +
        '<div class="tut-dots">' + dots + '</div>' +
        '<div class="tut-actions">' +
        (canGoBack ? '<button type="button" class="tut-btn tut-btn-ghost" data-act="prev">Voltar</button>' : '') +
        '<button type="button" class="tut-btn tut-btn-primary" data-act="next">' + label + '</button>' +
        '<button type="button" class="tut-skip" data-act="skip">Pular tutorial</button>' +
        '</div>';

      tip.classList.remove('tut-anim');
      void tip.offsetWidth;
      tip.classList.add('tut-anim');

      tip.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.getAttribute('data-act');
          if (act === 'prev') { index--; render(); }
          else if (act === 'next') { onNext(); }
          else if (act === 'skip') { onSkip(); }
        });
      });

      var primary = tip.querySelector('[data-act="next"]');
      if (primary) {
        try { primary.focus({ preventScroll: true }); } catch (e) { primary.focus(); }
      }
    }

    function onNext() {
      var step = steps[index];

      // Passo final ("Finalizar") → conclui e permanece na página atual
      if (step.done) {
        setDone(section);
        setDone('dashboard');
        setDone('modulos');
        setDone('aula');
        teardown();
        return;
      }

      // Passo de navegação ("Continuar") → conclui e muda de página
      var url = typeof step.next === 'function' ? step.next() : step.next;
      if (step.next) {
        setDone(section);
        teardown();
        window.location.href = url;
        return;
      }

      // Passo intermediário → avança para o próximo passo NA MESMA PÁGINA
      if (index + 1 < steps.length) {
        index++;
        render();
        return;
      }

      // Último passo sem navegação → apenas finaliza
      setDone(section);
      teardown();
    }

    function onSkip() {
      setDone(section);
      teardown();
    }

    function teardown() {
      window.removeEventListener('scroll', onScrollResize);
      window.removeEventListener('resize', onScrollResize);
      if (box.parentNode) box.parentNode.removeChild(box);
      if (tip.parentNode) tip.parentNode.removeChild(tip);
    }

    function onScrollResize() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        positionTarget(resolveTarget(steps[index]), steps[index].offset);
      });
    }

    window.addEventListener('scroll', onScrollResize, { passive: true });
    window.addEventListener('resize', onScrollResize);

    render();
  }

  /* ── "Ver tutorial novamente" no menu ── */
  function injectReplay() {
    var svg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7"/><path d="M12 17h.01"/></svg>';

    var menus = document.querySelectorAll('.menu-premium');
    menus.forEach(function (menu) {
      if (menu.querySelector('.tut-replay')) return;
      var a = document.createElement('a');
      a.className = 'tut-replay';
      a.href = '#';
      a.innerHTML = svg + ' Ver tutorial novamente';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        resetTutorial();
      });
      menu.appendChild(a);
    });

    var nav = document.querySelector('.sidebar-nav');
    if (nav && !nav.querySelector('.tut-replay')) {
      var a2 = document.createElement('a');
      a2.className = 'nav-link tut-replay';
      a2.href = '#';
      a2.innerHTML = svg.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" class="nav-icon"') + ' Ver tutorial novamente';
      a2.addEventListener('click', function (e) {
        e.preventDefault();
        resetTutorial();
      });
      nav.appendChild(a2);
    }
  }

  /* ── Inicialização ── */
  function init() {
    injectReplay();

    if (typeof window.isAuthenticated !== 'function' || !window.isAuthenticated()) return;
    var section = detectSection();
    if (!section || isDone(section)) return;

    var steps = buildSteps(section);
    if (!steps.length) return;

    setTimeout(function () { start(steps, section); }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
