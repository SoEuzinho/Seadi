/* ──────────────────────────────────────────────
   criadores.js — Área de créditos do SEADI
   Nomes sem "~", sem numeração e sem "Senac".
   Ao clicar/tocar em um nome, um modal animado
   mostra o cargo e a função da pessoa no projeto.
   Cada nome tem uma animação temática por cargo
   (leve, uma vez, com prefers-reduced-motion).
   ────────────────────────────────────────────── */
(function () {
  'use strict';

  // fx = animação do nome baseada no cargo:
  //   shimmer  -> Líder de Front-end (varredura de cor)
  //   type     -> Especialista em Usabilidade (escrita rápida na tela)
  //   caret    -> Back-end (cursor de terminal pisca e some)
  //   letters  -> Líder de Projeto (nome "montado" letra por letra)
  //   drop     -> DBA (letras caem, como linhas de banco)
  //   none     -> sem animação especial no nome
  var PARTICIPANTES = [
    { nome: 'Jorge',             fx: 'shimmer', cargo: 'Líder de Front-end',                       desc: 'Definição dos padrões visuais, cores, tipografia e componentes de interface; testes de navegação.' },
    { nome: 'Geovania',          fx: 'type',    cargo: 'Especialista em Usabilidade',              desc: 'Garantia de que o site seja acessível e simples para todos os públicos, com foco em comunicação clara (UX Writing).' },
    { nome: 'Leonardo Santos',   fx: 'caret',   cargo: 'Desenvolvedor Back-end',                   desc: 'Desenvolvimento da lógica de progresso das aulas.' },
    { nome: 'Pedro H.',          fx: 'drop',    cargo: 'Administrador de Banco de Dados (DBA)',    desc: 'Garantia de integridade e backup das informações.' },
    { nome: 'Tauany',            fx: 'drop',    cargo: 'Administrador de Banco de Dados (DBA)',    desc: 'Modelagem e estruturação do banco de dados.' },
    { nome: '_pedro_',           fx: 'none',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Caio Ribeiro',      fx: 'none',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Caio W.',           fx: 'none',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Cauã Santos',       fx: 'none',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Clara',             fx: 'type',    cargo: 'Especialista em Usabilidade',              desc: 'Garantia de que o site seja acessível e simples para todos os públicos, com foco em comunicação clara (UX Writing).' },
    { nome: 'Eduardo',           fx: 'caret',   cargo: 'Líder de Back-end',                        desc: 'Estruturação da lógica do servidor e gestão de APIs.' },
    { nome: 'Nathan',            fx: 'caret',   cargo: 'Desenvolvedor Back-end',                   desc: 'Autenticação e segurança dos usuários.' },
    { nome: 'R Max',             fx: 'none',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'RG',                fx: 'none',    cargo: 'Desenvolvedor Front-end',                  desc: 'Implementação de interfaces com HTML e CSS.' },
    { nome: 'Roberto',           fx: 'none',    cargo: 'Desenvolvedor Front-end',                  desc: 'Desenvolvimento do front-end, com foco na estilização em CSS.' },
    { nome: 'tony mark',         fx: 'letters', cargo: 'Líder de Projeto / Arquiteto de Sistemas', desc: 'Planejamento da arquitetura técnica, definição de tecnologias e diretrizes de segurança.' },
    { nome: 'Divaldo F.',        fx: 'caret',   cargo: 'Desenvolvedor Back-end',                   desc: 'Criação da infraestrutura do Back-End, desenvolvimento das APIs e configuração do servidor que mantém o site funcionando na rede.' }
  ];

  var lastItem = null;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Divide em "grafemas" (lida com emojis corretamente)
  function graphemes(str) {
    try {
      if (Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return Array.from(seg.segment(str), function (s) { return s.segment; });
      }
    } catch (_) {}
    return Array.from(str);
  }

  // Renderiza os nomes (via textContent preserva emojis e _)
  function renderList() {
    var list = document.getElementById('credits-list');
    var count = document.getElementById('credits-count');
    if (!list) return;

    PARTICIPANTES.forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'credits-item fx-' + p.fx;
      li.dataset.idx = i;
      li.dataset.fx = p.fx;
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      li.setAttribute('aria-haspopup', 'dialog');
      li.setAttribute('aria-label', p.nome + (p.cargo ? ', ' + p.cargo : ''));

      var name = document.createElement('span');
      name.className = 'ci-name';

      // 'letters'/'drop' montam o nome letra por letra (só com animação)
      if ((p.fx === 'letters' || p.fx === 'drop') && !reducedMotion()) {
        var parts = graphemes(p.nome);
        parts.forEach(function (ch, k) {
          var sp = document.createElement('span');
          sp.textContent = ch;
          sp.style.transitionDelay = (k * 60) + 'ms';
          name.appendChild(sp);
        });
      } else {
        name.textContent = p.nome;
      }

      li.appendChild(name);
      li.addEventListener('click', function () {
        runFx(li, true);
        openCredits(i, li);
      });
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          runFx(li, true);
          openCredits(i, li);
        }
      });
      list.appendChild(li);
    });

    if (count) count.textContent = PARTICIPANTES.length + ' participantes';
  }

  // Dispara a animação temática do cargo (na entrada e ao clicar)
  function runFx(li, replay) {
    if (reducedMotion()) return;
    var fx = li.dataset.fx;
    if (!fx || fx === 'none') return;

    if (fx === 'type') { playType(li); return; }

    if (fx === 'letters' || fx === 'drop') {
      if (replay) replayLetters(li, fx);
      return;
    }

    // shimmer / caret / code: re-dispara a animação CSS
    li.classList.remove('fx-run');
    void li.offsetWidth;
    li.classList.add('fx-run');
  }

  // Escrita rápida na tela (usabilidade/UX Writing)
  function playType(li) {
    var idx = parseInt(li.dataset.idx, 10);
    var p = PARTICIPANTES[idx];
    if (!p) return;
    var nameEl = li.querySelector('.ci-name');
    if (!nameEl) return;

    var parts = graphemes(p.nome);
    nameEl.textContent = '';

    var caret = document.createElement('span');
    caret.className = 'typing-caret';
    caret.textContent = '▍';
    nameEl.appendChild(caret);

    var typed = [];
    var k = 0;
    var timer = setInterval(function () {
      typed.push(parts[k]);
      k++;
      nameEl.textContent = typed.join('');
      nameEl.appendChild(caret);
      if (k >= parts.length) {
        clearInterval(timer);
        setTimeout(function () {
          if (caret.parentNode) caret.parentNode.removeChild(caret);
        }, 1100);
      }
    }, 38);
  }

  // Repete a montagem letra por letra (letters/drop)
  function replayLetters(li, fx) {
    var spans = li.querySelectorAll('.ci-name span');
    var fromY = fx === 'drop' ? '-18px' : '14px';
    var fromScale = fx === 'drop' ? '1' : '0.5';
    [].forEach.call(spans, function (s) {
      s.style.transition = 'none';
      s.style.opacity = '0';
      s.style.transform = 'translateY(' + fromY + ') scale(' + fromScale + ')';
    });
    void li.offsetWidth;
    [].forEach.call(spans, function (s) {
      s.style.transition = '';
      s.style.opacity = '';
      s.style.transform = '';
    });
  }

  function openCredits(idx, item) {
    var p = PARTICIPANTES[idx];
    if (!p) return;
    lastItem = item;

    var overlay = document.getElementById('credits-modal');
    if (!overlay) return;

    var nome = overlay.querySelector('.cm-nome');
    var cargo = overlay.querySelector('.cm-cargo');
    var desc = overlay.querySelector('.cm-desc');
    if (nome) nome.textContent = p.nome;
    if (cargo) cargo.textContent = p.cargo;
    if (desc) desc.textContent = p.desc || '';

    overlay.hidden = false;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    var closeBtn = overlay.querySelector('.cm-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeCredits() {
    var overlay = document.getElementById('credits-modal');
    if (!overlay) return;

    overlay.classList.remove('open');
    setTimeout(function () {
      if (!overlay.classList.contains('open')) overlay.hidden = true;
    }, 320);

    document.body.style.overflow = '';
    if (lastItem) lastItem.focus();
  }

  function addIn(el) {
    if (el) el.classList.add('in');
  }

  // Sequência cinematográfica de entrada
  function runIntro() {
    var credits = document.getElementById('credits');
    if (!credits) return;

    var items = credits.querySelectorAll('.credits-item');
    var title = document.getElementById('credits-title');
    var subtitle = document.querySelector('.credits-subtitle');
    var rule = document.querySelector('.credits-rule');
    var count = document.getElementById('credits-count');

    var start = 520;          // momento em que os nomes começam
    var step = 150;           // intervalo entre cada nome
    var last = start + (items.length - 1) * step;

    credits.classList.add('intro');

    addIn(title);
    setTimeout(function () { addIn(subtitle); }, 260);
    setTimeout(function () { addIn(rule); }, 420);

    items.forEach(function (item, i) {
      setTimeout(function () {
        addIn(item);
        runFx(item, false);
      }, start + i * step);
    });

    setTimeout(function () { addIn(count); }, last + 260);

    // Fim: finaliza animações e esconde as partículas (sem loop contínuo)
    setTimeout(function () {
      credits.classList.add('settled');
      credits.classList.remove('intro');
    }, last + 700);
  }

  // Partículas leves — animam UMA vez durante a introdução
  function spawnParticles() {
    var bg = document.querySelector('.credits-bg');
    if (!bg || reducedMotion()) return;

    for (var i = 0; i < 10; i++) {
      var dot = document.createElement('i');
      var size = 3 + Math.random() * 5;
      dot.style.left = Math.floor(Math.random() * 100) + '%';
      dot.style.width = size.toFixed(1) + 'px';
      dot.style.height = size.toFixed(1) + 'px';
      dot.style.setProperty('--d', (2.6 + Math.random() * 2).toFixed(2) + 's');
      dot.style.setProperty('--dx', (Math.random() - 0.5) * 120 + 'px');
      dot.style.animationDelay = (Math.random() * 1.6).toFixed(2) + 's';
      bg.appendChild(dot);
    }
  }

  function init() {
    renderList();
    spawnParticles();
    if (reducedMotion()) return;
    runIntro();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Fecha o modal (botão, clique fora ou tecla Esc)
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-close]')) closeCredits();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCredits();
  });
})();
