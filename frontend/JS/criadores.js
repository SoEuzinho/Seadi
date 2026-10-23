/* ──────────────────────────────────────────────
   criadores.js — Equipe do SEADI
   Monta os cards da equipe agrupados por área,
   com o cargo visível. Ao clicar/tocar em um card,
   um modal mostra o que a pessoa fez no projeto.
   ────────────────────────────────────────────── */
(function () {
  'use strict';

  // Ordem em que as áreas aparecem na página
  var AREAS = [
    { id: 'lideranca', titulo: 'Liderança' },
    { id: 'front',     titulo: 'Front-end' },
    { id: 'back',      titulo: 'Back-end' },
    { id: 'dados',     titulo: 'Banco de Dados' },
    { id: 'ux',        titulo: 'Usabilidade' },
    { id: 'equipe',    titulo: 'Equipe de desenvolvimento' }
  ];

  var PARTICIPANTES = [
    { nome: 'tony mark',       area: 'lideranca', cargo: 'Líder de Projeto / Arquiteto de Sistemas', desc: 'Planejamento da arquitetura técnica, definição de tecnologias e diretrizes de segurança.' },
    { nome: 'Jorge',           area: 'lideranca', cargo: 'Líder de Front-end',                       desc: 'Definição dos padrões visuais, cores, tipografia e componentes de interface; testes de navegação.' },
    { nome: 'Eduardo',         area: 'lideranca', cargo: 'Líder de Back-end',                        desc: 'Estruturação da lógica do servidor e gestão de APIs.' },
    { nome: 'RG',              area: 'front',     cargo: 'Desenvolvedor Front-end',                  desc: 'Implementação de interfaces com HTML e CSS.' },
    { nome: 'Roberto',         area: 'front',     cargo: 'Desenvolvedor Front-end',                  desc: 'Desenvolvimento do front-end, com foco na estilização em CSS.' },
    { nome: 'Divaldo F.',      area: 'back',      cargo: 'Desenvolvedor Back-end',                   desc: 'Criação da infraestrutura do Back-End, desenvolvimento das APIs e configuração do servidor que mantém o site funcionando na rede.' },
    { nome: 'Leonardo Santos', area: 'back',      cargo: 'Desenvolvedor Back-end',                   desc: 'Desenvolvimento da lógica de progresso das aulas.' },
    { nome: 'Nathan',          area: 'back',      cargo: 'Desenvolvedor Back-end',                   desc: 'Autenticação e segurança dos usuários.' },
    { nome: 'Pedro H.',        area: 'dados',     cargo: 'Administrador de Banco de Dados (DBA)',    desc: 'Garantia de integridade e backup das informações.' },
    { nome: 'Tauany',          area: 'dados',     cargo: 'Administradora de Banco de Dados (DBA)',   desc: 'Modelagem e estruturação do banco de dados.' },
    { nome: 'Geovania',        area: 'ux',        cargo: 'Especialista em Usabilidade',              desc: 'Garantia de que o site seja acessível e simples para todos os públicos, com foco em comunicação clara (UX Writing).' },
    { nome: 'Clara',           area: 'ux',        cargo: 'Especialista em Usabilidade',              desc: 'Garantia de que o site seja acessível e simples para todos os públicos, com foco em comunicação clara (UX Writing).' },
    { nome: '_pedro_',         area: 'equipe',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Caio Ribeiro',    area: 'equipe',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Caio W.',         area: 'equipe',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'Cauã Santos',     area: 'equipe',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' },
    { nome: 'R Max',           area: 'equipe',    cargo: 'Participante do projeto',                  desc: 'Integrante da equipe de desenvolvimento do SEADI.' }
  ];

  var lastItem = null;

  // Iniciais para o avatar: "Leonardo Santos" -> "LS", "_pedro_" -> "P"
  function iniciais(nome) {
    var partes = nome.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/);
    var txt = (partes[0] || '?').charAt(0);
    if (partes.length > 1) txt += partes[partes.length - 1].charAt(0);
    return txt.toUpperCase();
  }

  function criarAvatar(p, extraClass) {
    var av = document.createElement('span');
    av.className = 'member-avatar' + (extraClass ? ' ' + extraClass : '');
    av.setAttribute('aria-hidden', 'true');
    av.textContent = iniciais(p.nome);
    return av;
  }

  // Monta os grupos e os cards (textContent evita injeção de HTML)
  function renderList() {
    var root = document.getElementById('credits-list');
    var count = document.getElementById('credits-count');
    if (!root) return;

    var ordem = 0;
    AREAS.forEach(function (area) {
      var membros = PARTICIPANTES.filter(function (p) { return p.area === area.id; });
      if (!membros.length) return;

      var section = document.createElement('section');
      section.className = 'team-group area-' + area.id;

      var h2 = document.createElement('h2');
      h2.className = 'team-group-title';
      h2.textContent = area.titulo + ' ';
      var small = document.createElement('small');
      small.textContent = '(' + membros.length + ')';
      h2.appendChild(small);
      section.appendChild(h2);

      var ul = document.createElement('ul');
      ul.className = 'team-grid';

      membros.forEach(function (p) {
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'member-card';
        btn.style.setProperty('--i', ordem++);
        btn.setAttribute('aria-haspopup', 'dialog');

        var info = document.createElement('span');
        info.className = 'member-info';
        var nome = document.createElement('span');
        nome.className = 'member-nome';
        nome.textContent = p.nome;
        var cargo = document.createElement('span');
        cargo.className = 'member-cargo';
        cargo.textContent = p.cargo;
        info.appendChild(nome);
        info.appendChild(cargo);

        btn.appendChild(criarAvatar(p));
        btn.appendChild(info);
        btn.addEventListener('click', function () { openCredits(p, btn); });

        li.appendChild(btn);
        ul.appendChild(li);
      });

      section.appendChild(ul);
      root.appendChild(section);
    });

    if (count) count.textContent = PARTICIPANTES.length + ' pessoas fizeram o SEADI acontecer 💙';
  }

  function openCredits(p, item) {
    lastItem = item;

    var overlay = document.getElementById('credits-modal');
    if (!overlay) return;

    var card = overlay.querySelector('.cm-card');
    if (card) card.className = 'cm-card area-' + p.area;

    var antigo = overlay.querySelector('.cm-avatar');
    if (antigo) antigo.remove();
    var kicker = overlay.querySelector('.cm-kicker');
    if (kicker) kicker.parentNode.insertBefore(criarAvatar(p, 'cm-avatar'), kicker);

    var nome = overlay.querySelector('.cm-nome');
    var cargo = overlay.querySelector('.cm-cargo');
    var desc = overlay.querySelector('.cm-desc');
    if (nome) nome.textContent = p.nome;
    if (cargo) cargo.textContent = p.cargo;
    if (desc) desc.textContent = p.desc || '';

    overlay.hidden = false;
    void overlay.offsetWidth; // garante a transição de entrada
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    var closeBtn = overlay.querySelector('.cm-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeCredits() {
    var overlay = document.getElementById('credits-modal');
    if (!overlay || overlay.hidden) return;

    overlay.classList.remove('open');
    setTimeout(function () {
      if (!overlay.classList.contains('open')) overlay.hidden = true;
    }, 260);

    document.body.style.overflow = '';
    if (lastItem) lastItem.focus();
  }

  document.addEventListener('DOMContentLoaded', renderList);

  // Fecha o modal (botão, clique fora ou tecla Esc)
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-close]')) closeCredits();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCredits();
  });
})();
