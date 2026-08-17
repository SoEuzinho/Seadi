/* ──────────────────────────────────────────────
   interativo.js — Simuladores interativos (Diversões)
   Requer: api.js (apiFetch), shared.js
   Simuladores: ligar, mouse, teclado, janelas
   ────────────────────────────────────────────── */

var SIM_SLUGS = ['ligar', 'mouse', 'teclado', 'janelas', 'redes', 'pendrive', 'navegador'];
var SIM_TITULOS = {
  ligar: 'Ligar e desligar o computador',
  mouse: 'Usando o mouse',
  teclado: 'Usando o teclado',
  janelas: 'Janelas do Windows',
  redes: 'Internet e redes',
  pendrive: 'Usando pen drive',
  navegador: 'Navegando na internet'
};

function simStorageKey(slug) {
  var userId = getCurrentUserId();
  return 'simSteps_' + (userId || 'anon') + '_' + slug;
}

/* ── Utilitários ── */
function escSim(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function loadSteps(slug) {
  try {
    var v = JSON.parse(localStorage.getItem(simStorageKey(slug)) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (_) { return []; }
}

function saveSteps(slug, steps) {
  localStorage.setItem(simStorageKey(slug), JSON.stringify(steps));
}

function stepNodes(slug) {
  var section = document.getElementById('sim-' + slug);
  return section ? section.querySelectorAll('.sim-step') : [];
}

function renderSteps(slug, steps) {
  var nodes = stepNodes(slug);
  for (var i = 0; i < nodes.length; i++) {
    if (steps.indexOf(nodes[i].getAttribute('data-step')) !== -1) {
      nodes[i].classList.add('done');
    }
  }
}

function badgeEl(slug) {
  return document.getElementById('badge-' + slug);
}

function completeBadge(slug) {
  var b = badgeEl(slug);
  if (b) b.classList.add('show');
  var section = document.getElementById('sim-' + slug);
  if (section) section.classList.add('complete');
}

/* ── Confete + toast ── */
function confettiSim() {
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

function toastSim(msg) {
  var toast = document.getElementById('sim-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { toast.classList.remove('show'); }, 4200);
}

/* ── Overview (X de 7) ── */
function updateOverview() {
  var slugMap = window.__simCompleted || {};
  var count = SIM_SLUGS.filter(function (s) { return slugMap[s]; }).length;
  var el = document.getElementById('sim-overview-text');
  var fill = document.getElementById('sim-overview-fill');
  if (el) el.textContent = count + ' de ' + SIM_SLUGS.length + ' simuladores concluídos';
  if (fill) fill.style.width = (count / SIM_SLUGS.length) * 100 + '%';
  if (count === SIM_SLUGS.length) {
    var so = document.querySelector('.sim-overview');
    if (so) so.classList.add('all-done');
  }
}

function setCompleted(slug) {
  window.__simCompleted = window.__simCompleted || {};
  if (window.__simCompleted[slug]) return;
  window.__simCompleted[slug] = true;
  completeBadge(slug);
  updateOverview();
}

/* ── Conclusão de um simulador ── */
function markStep(slug, step) {
  var steps = loadSteps(slug);
  if (steps.indexOf(step) === -1) steps.push(step);
  saveSteps(slug, steps);
  renderSteps(slug, steps);

  var section = document.getElementById('sim-' + slug);
  var total = section ? section.querySelectorAll('.sim-step').length : 0;
  if (steps.length >= total && !(window.__simCompleted && window.__simCompleted[slug])) {
    setCompleted(slug);
    toastSim('Simulador concluído: ' + SIM_TITULOS[slug] + '!');
    confettiSim();
    try {
      apiFetch('/achievements/simulator', {
        method: 'POST',
        body: JSON.stringify({ slug: slug })
      }).catch(function () {});
    } catch (_) {}
  }
}

/* ── Estado inicial (servidor) ── */
async function initServerState() {
  try {
    var data = await apiFetch('/achievements');
    var slugs = data.conquistas
      .filter(function (a) { return a.conquistada && a.slug.indexOf('simulador-') === 0; })
      .map(function (a) { return a.slug.replace('simulador-', ''); });

    SIM_SLUGS.forEach(function (s) {
      var steps = loadSteps(s);
      if (slugs.indexOf(s) !== -1) {
        var all = [];
        stepNodes(s).forEach(function (n) { all.push(n.getAttribute('data-step')); });
        saveSteps(s, all);
        steps = all;
        setCompleted(s);
      }
      renderSteps(s, steps);
    });
    updateOverview();
    if (window.__rerenderRedes) window.__rerenderRedes();
  } catch (_) {
    SIM_SLUGS.forEach(function (s) {
      var steps = loadSteps(s);
      renderSteps(s, steps);
      var section = document.getElementById('sim-' + s);
      var total = section ? section.querySelectorAll('.sim-step').length : 0;
      if (steps.length > 0 && total > 0 && steps.length >= total) setCompleted(s);
    });
    updateOverview();
  }
}

/* ═══════════ SIMULADOR 1: LIGAR/DESLIGAR ═══════════ */
function initLigar() {
  var screen = document.getElementById('screen');
  var screenOff = document.getElementById('screen-off');
  var screenBoot = document.getElementById('screen-boot');
  var screenDesktop = document.getElementById('screen-desktop');
  var powerBtn = document.getElementById('power-btn');
  if (!screen || !powerBtn) return;

  var estado = 'off'; // off | boot | on | shutting
  var marcouLigar = loadSteps('ligar').indexOf('ligar') !== -1;
  var marcouDesligar = loadSteps('ligar').indexOf('desligar') !== -1;

  function showOff(txt) {
    screenOff.textContent = txt || 'Aperte o botão de energia para ligar';
    screen.classList.remove('boot', 'on', 'shutting');
    screen.classList.add('off');
  }

  function showBoot() {
    screen.classList.remove('off', 'on', 'shutting');
    screen.classList.add('boot');
  }

  function showDesktop() {
    screen.classList.remove('off', 'boot', 'shutting');
    screen.classList.add('on');
  }

  showOff();

  powerBtn.addEventListener('click', function () {
    if (estado === 'boot' || estado === 'shutting') return;

    if (estado === 'off') {
      estado = 'boot';
      showBoot();
      setTimeout(function () {
        if (estado !== 'boot') return;
        estado = 'on';
        showDesktop();
        if (!marcouLigar) { marcouLigar = true; markStep('ligar', 'ligar'); }
      }, 1700);
    } else if (estado === 'on') {
      estado = 'shutting';
      screen.classList.add('shutting');
      screenDesktop.style.opacity = '0.2';
      setTimeout(function () {
        if (estado !== 'shutting') return;
        estado = 'off';
        screenDesktop.style.opacity = '';
        showOff('Desligando... desligamento completo');
        setTimeout(function () {
          showOff();
        }, 900);
        if (!marcouDesligar) { marcouDesligar = true; markStep('ligar', 'desligar'); }
      }, 600);
    }
  });
}

/* ═══════════ SIMULADOR 2: MOUSE ═══════════ */
function initMouse() {
  var left = document.getElementById('mouse-left');
  var right = document.getElementById('mouse-right');
  var scroll = document.getElementById('mouse-scroll');
  var content = document.getElementById('pw-content');
  var menu = document.getElementById('context-menu');
  var openFile = document.getElementById('open-file');
  var cursor = document.getElementById('mouse-cursor');
  if (!left || !content) return;

  var items = Array.prototype.slice.call(content.querySelectorAll('.pw-item'));
  var hovered = null;

  // Qual arquivo está sob a ponta do cursor?
  function updateHover() {
    var over = null;
    var cr = content.getBoundingClientRect();
    var cur = cursor.getBoundingClientRect();
    var cx = cur.left + cur.width / 2;
    var cy = cur.top + cur.height / 2;
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        over = items[i];
        break;
      }
    }
    if (hovered) hovered.classList.remove('hover');
    hovered = over;
    if (hovered) hovered.classList.add('hover');
    return hovered;
  }

  // Mover o cursor: clique em qualquer lugar da janela "mira" nele
  function moveCursor(clientX, clientY) {
    var rect = content.getBoundingClientRect();
    var x = clientX - rect.left + content.scrollLeft;
    var y = clientY - rect.top + content.scrollTop;
    cursor.style.left = (x - 2) + 'px';
    cursor.style.top = (y - 5) + 'px';
    updateHover();
  }

  content.addEventListener('click', function (e) {
    e.stopPropagation();
    moveCursor(e.clientX, e.clientY);
  });

  function deselectAll() {
    for (var i = 0; i < items.length; i++) items[i].classList.remove('selected');
  }

  function semAlvo() {
    toastSim('Primeiro clique na janela para mover o cursor sobre um arquivo');
  }

  left.addEventListener('click', function () {
    left.classList.add('pressed');
    setTimeout(function () { left.classList.remove('pressed'); }, 160);
    menu.classList.remove('show');
    if (!hovered) { semAlvo(); return; }
    deselectAll();
    hovered.classList.add('selected');
    markStep('mouse', 'esquerdo');
    toastSim('Selecionado: ' + hovered.getAttribute('data-file'));
  });

  left.addEventListener('dblclick', function () {
    if (!hovered) { semAlvo(); return; }
    openFile.classList.add('show');
    document.getElementById('open-file-name').textContent = hovered.getAttribute('data-file');
    setTimeout(function () { openFile.classList.remove('show'); }, 1600);
    markStep('mouse', 'duplo');
    toastSim('Abrindo ' + hovered.getAttribute('data-file') + '...');
  });

  right.addEventListener('click', function () {
    right.classList.add('pressed');
    setTimeout(function () { right.classList.remove('pressed'); }, 160);
    menu.classList.remove('show');
    if (!hovered) { semAlvo(); return; }
    menu.classList.add('show');
    markStep('mouse', 'direito');
    toastSim('Menu com opções do arquivo');
  });

  scroll.addEventListener('click', function () {
    scroll.classList.add('pressed');
    setTimeout(function () { scroll.classList.remove('pressed'); }, 160);
    content.scrollTop += 36;
    if (content.scrollTop > 0) markStep('mouse', 'scroll');
  });

  content.addEventListener('wheel', function (e) {
    e.preventDefault();
    content.scrollTop += e.deltaY;
    if (content.scrollTop > 0) markStep('mouse', 'scroll');
  }, { passive: false });

  document.addEventListener('click', function (e) {
    if (menu && !menu.contains(e.target) && e.target !== right) {
      menu.classList.remove('show');
    }
  });

  menu.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.remove('show');
  });

  // O cursor começa sobre o primeiro arquivo para facilitar
  cursor.style.left = (items[0].offsetLeft + items[0].offsetWidth / 2 - 2) + 'px';
  cursor.style.top = (items[0].offsetTop + items[0].offsetHeight / 2 - 5) + 'px';
  updateHover();
}

/* ═══════════ SIMULADOR 3: TECLADO ═══════════ */
var SYMBOLS = { '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '¨', '7': '&', '8': '*', '9': '(', '0': ')' };

function initTeclado() {
  var kb = document.getElementById('keyboard');
  var screen = document.getElementById('kb-screen');
  var status = document.getElementById('kb-status');
  if (!kb || !screen) return;

  var capsOn = false;
  var shiftOn = false;

  var letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  function build() {
    kb.innerHTML = '';
    var row1 = document.createElement('div');
    row1.className = 'kb-row';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].forEach(function (k) {
      row1.appendChild(keyEl('num', k));
    });
    kb.appendChild(row1);

    letterRows.forEach(function (row) {
      var r = document.createElement('div');
      r.className = 'kb-row';
      row.forEach(function (k) { r.appendChild(keyEl('letter', k)); });
      kb.appendChild(r);
    });

    var r5 = document.createElement('div');
    r5.className = 'kb-row';
    r5.appendChild(keyEl('shift', 'Shift', 'wide half'));
    r5.appendChild(keyEl('espaco', 'Espaço', 'wide space'));
    r5.appendChild(keyEl('enter', 'Enter', 'wide half'));
    r5.appendChild(keyEl('backspace', 'Backspace', 'wide half'));
    r5.appendChild(keyEl('caps', 'Caps', 'wide half'));
    kb.appendChild(r5);
  }

  function keyEl(id, label, cls) {
    var k = document.createElement('button');
    k.type = 'button';
    k.className = 'kb-key' + (cls ? ' ' + cls : '');
    k.setAttribute('data-id', id);
    k.textContent = label;
    k.addEventListener('click', function () { pressKey(id, label); });
    return k;
  }

  function refreshKeys() {
    var keys = kb.querySelectorAll('.kb-key');
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i].getAttribute('data-id');
      keys[i].classList.toggle('active', (id === 'caps' && capsOn) || (id === 'shift' && shiftOn));
    }
    status.textContent =
      'Caps Lock: ' + (capsOn ? 'ligado' : 'desligado') +
      (shiftOn ? ' · Shift: ativado' : '');
  }

  function type(ch) {
    screen.value += ch;
    screen.scrollTop = screen.scrollHeight;
  }

  function pressKey(id, label) {
    if (id === 'caps') {
      capsOn = !capsOn;
      markStep('teclado', 'caps');
      refreshKeys();
      return;
    }
    if (id === 'shift') {
      shiftOn = !shiftOn;
      markStep('teclado', 'shift');
      refreshKeys();
      return;
    }
    if (id === 'espaco') { type(' '); markStep('teclado', 'espaco'); refreshKeys(); return; }
    if (id === 'enter') { type('\n'); markStep('teclado', 'enter'); refreshKeys(); return; }
    if (id === 'backspace') {
      screen.value = screen.value.slice(0, -1);
      markStep('teclado', 'backspace');
      refreshKeys();
      return;
    }
    if (id === 'num') {
      var ch = shiftOn ? (SYMBOLS[label] || label) : label;
      type(ch);
      if (shiftOn) { shiftOn = false; markStep('teclado', 'shift'); }
      refreshKeys();
      return;
    }
    if (id === 'letter') {
      var l = (capsOn || shiftOn) ? label.toUpperCase() : label;
      type(l);
      markStep('teclado', 'letra');
      if (shiftOn) { shiftOn = false; markStep('teclado', 'shift'); }
      refreshKeys();
    }
  }

  build();
  refreshKeys();
}

/* ═══════════ SIMULADOR 4: JANELAS ═══════════ */
function initJanelas() {
  var win = document.getElementById('win');
  var min = document.getElementById('win-min');
  var max = document.getElementById('win-max');
  var close = document.getElementById('win-close');
  var taskItem = document.getElementById('task-item');
  var reopen = document.getElementById('reopen-btn');
  if (!win) return;

  var maximizado = false;

  function visibilidade(visivel) {
    win.classList.toggle('closed', !visivel);
    if (taskItem) taskItem.classList.toggle('hidden', !visivel);
    if (reopen) reopen.classList.toggle('show', !visivel);
  }

  min.addEventListener('click', function () {
    win.classList.add('minimized');
    markStep('janelas', 'minimizar');
  });

  taskItem.addEventListener('click', function () {
    win.classList.remove('minimized');
  });

  max.addEventListener('click', function () {
    maximizado = !maximizado;
    win.classList.toggle('maximized', maximizado);
    markStep('janelas', 'maximizar');
  });

  close.addEventListener('click', function () {
    win.classList.remove('minimized');
    visibilidade(false);
    markStep('janelas', 'fechar');
  });

  reopen.addEventListener('click', function () {
    visibilidade(true);
    markStep('janelas', 'reabrir');
  });

  visibilidade(true);
}

/* ═══════════ SIMULADOR 5: INTERNET E REDES ═══════════ */
var NET_PASSOS = {
  cabo: {
    titulo: 'Rede Local (LAN)',
    texto: 'O cabo de rede (ou o Wi-Fi) conecta o computador aos outros aparelhos da sua casa, formando a rede local. É dentro dela que a sua internet começa.',
    dica: 'Rede local = LAN. É a rede de DENTRO da sua casa.'
  },
  modem: {
    titulo: 'Modem e Roteador',
    texto: 'O modem recebe a internet do provedor e o roteador distribui esse sinal para todos os aparelhos da casa — com ou sem fio.',
    dica: 'O modem/roteador "empresta" internet para computador, celular, TV...'
  },
  provedor: {
    titulo: 'Provedor de Internet (ISP)',
    texto: 'O provedor é a empresa que vende o acesso à internet — a sua operadora. É ele que leva a conexão até o modem da sua casa, normalmente por cabo ou fibra óptica.',
    dica: 'ISP = Internet Service Provider. É a sua operadora.'
  },
  global: {
    titulo: 'Rede Global (Internet)',
    texto: 'Depois do provedor, a sua conexão entra na rede global: milhões de computadores e redes interligados no mundo inteiro. Por isso o nome "rede mundial de computadores".',
    dica: 'A internet é formada por milhões de computadores conectados entre si.'
  },
  site: {
    titulo: 'Servidor de Site',
    texto: 'As páginas que você acessa ficam guardadas em computadores poderosos chamados servidores, ligados 24 horas por dia. Ao abrir um site, o seu computador pede os dados para o servidor dele.',
    dica: 'Servidor = computador especial que guarda sites e fica sempre ligado.'
  },
  jogos: {
    titulo: 'Servidor de Jogos',
    texto: 'Em jogos online, o servidor de jogos é o "árbitro" da partida: recebe o que cada jogador faz e envia para todos, mantendo a partida igual para todo mundo.',
    dica: 'Ping baixo = resposta rápida entre o seu computador e o servidor.'
  }
};

function initRedes() {
  var nodes = {
    pc: document.getElementById('net-pc'),
    modem: document.getElementById('net-modem'),
    isp: document.getElementById('net-isp'),
    global: document.getElementById('net-global'),
    site: document.getElementById('net-site'),
    game: document.getElementById('net-game')
  };
  var links = {
    pc: document.getElementById('link-pc'),
    isp: document.getElementById('link-isp'),
    global: document.getElementById('link-global'),
    site: document.getElementById('link-site'),
    game: document.getElementById('link-game')
  };
  var status = document.getElementById('net-status');
  if (!nodes.pc || !status) return;

  // Ordem correta da conexão (de ensinar)
  var ordem = ['cabo', 'modem', 'provedor', 'global', 'site', 'jogos'];
  var feitos = loadSteps('redes');

  function estado(el, txt, on) {
    if (on) {
      el.setAttribute('data-state', 'on');
      el.classList.add('on');
    } else {
      el.setAttribute('data-state', 'off');
      el.classList.remove('on');
    }
    var st = el.querySelector('.net-state');
    if (st) st.textContent = txt;
  }

  function ligaLinha(id) {
    var l = links[id];
    if (l) l.classList.add('on');
  }

  function atualizarVisual() {
    if (feitos.indexOf('cabo') !== -1) {
      estado(nodes.pc, 'conectado', true);
      ligaLinha('pc');
    }
    if (feitos.indexOf('modem') !== -1) estado(nodes.modem, 'ligado', true);
    if (feitos.indexOf('provedor') !== -1) {
      estado(nodes.isp, 'conectado', true);
      ligaLinha('isp');
    }
    if (feitos.indexOf('global') !== -1) {
      estado(nodes.global, 'conectado', true);
      ligaLinha('global');
    }
    if (feitos.indexOf('site') !== -1) {
      estado(nodes.site, 'site aberto', true);
      ligaLinha('site');
    }
    if (feitos.indexOf('jogos') !== -1) {
      estado(nodes.game, 'na partida', true);
      ligaLinha('game');
    }
  }

  function narrativa(passo) {
    if (!passo) return;
    var titulo = document.getElementById('net-status-titulo');
    var texto = document.getElementById('net-status-texto');
    var dica = document.getElementById('net-status-dica');
    if (passo.titulo) {
      if (titulo) titulo.textContent = passo.titulo;
      if (texto) texto.textContent = passo.texto;
      if (dica) dica.textContent = 'Dica: ' + passo.dica;
    } else {
      if (titulo) titulo.textContent = 'Atenção';
      if (texto) texto.textContent = passo;
      if (dica) dica.textContent = '';
    }
  }

  function tentarPasso(nome) {
    var idx = ordem.indexOf(nome);
    var anterior = idx > 0 ? ordem[idx - 1] : null;
    if (anterior && feitos.indexOf(anterior) === -1) {
      var labels = {
        cabo: 'conectar o cabo de rede',
        modem: 'ligar o modem',
        provedor: 'conectar ao provedor',
        global: 'entrar na rede global',
        site: 'abrir um site',
        jogos: 'entrar no servidor de jogos'
      };
      narrativa('Ainda não dá. Primeiro você precisa ' + labels[anterior] + '.');
      toastSim('Primeiro: ' + labels[anterior]);
      return;
    }
    feitos = loadSteps('redes');
    if (feitos.indexOf(nome) === -1) markStep('redes', nome);
    feitos = loadSteps('redes');
    atualizarVisual();
    narrativa(NET_PASSOS[nome]);
  }

  nodes.pc.addEventListener('click', function () { tentarPasso('cabo'); });
  nodes.modem.addEventListener('click', function () { tentarPasso('modem'); });
  nodes.isp.addEventListener('click', function () { tentarPasso('provedor'); });
  nodes.global.addEventListener('click', function () { tentarPasso('global'); });
  nodes.site.addEventListener('click', function () { tentarPasso('site'); });
  nodes.game.addEventListener('click', function () { tentarPasso('jogos'); });

  window.__rerenderRedes = atualizarVisual;
  atualizarVisual();
}

/* ═══════════ SIMULADOR 6: PEN DRIVE ═══════════ */
var PD_ARQUIVOS_C = [
  { nome: 'Documento.txt', icone: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>' },
  { nome: 'Fotos', icone: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 15l-5-5-8 8"/>' },
  { nome: 'Planilha', icone: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>' }
];

function initPendrive() {
  var stick = document.getElementById('pd-stick');
  var usbport = document.getElementById('pd-usbport');
  var explorer = document.getElementById('pd-explorer');
  var files = document.getElementById('pd-files');
  var path = document.getElementById('pd-path');
  var driveStick = document.getElementById('pd-drive-stick');
  var status = document.getElementById('pd-status');
  var copiar = document.getElementById('pd-copiar');
  var ejetar = document.getElementById('pd-ejetar');
  if (!stick || !usbport) return;

  var botoes = document.querySelectorAll('.pd-nav .pd-drive');
  var driveC = botoes[0] || null;
  var peguei = false;
  var inserido = loadSteps('pendrive').indexOf('encaixar') !== -1;
  var copiado = null;

  function mostrarC() {
    if (driveC) driveC.classList.add('active');
    if (driveStick) driveStick.classList.remove('active');
    path.textContent = 'Este Computador > Disco Local (C:)';
    files.innerHTML = PD_ARQUIVOS_C.map(function (a) {
      return '<div class="pd-file' + (a.nome === copiado ? ' copied' : '') + '" data-arquivo="' + escSim(a.nome) + '" tabindex="0" role="button">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' + a.icone + '</svg>' +
        '<span>' + escSim(a.nome) + '</span>' +
        (a.nome === copiado ? '<span class="pd-copied-tag">copiado</span>' : '') +
        '</div>';
    }).join('');
  }

  function mostrarE() {
    if (driveStick) driveStick.classList.add('active');
    if (driveC) driveC.classList.remove('active');
    path.textContent = 'Este Computador > Pen Drive (E:)';
    if (copiado) {
      files.innerHTML = '<div class="pd-file copied" tabindex="0" role="button">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>' +
        '<span>' + escSim(copiado) + '</span>' +
        '<span class="pd-copied-tag">no pen drive</span></div>';
    } else {
      files.innerHTML = '<div class="pd-empty">O pen drive está vazio.</div>';
    }
  }

  function feedback(msg) {
    if (status) status.textContent = msg;
  }

  if (inserido) {
    explorer.classList.remove('hidden');
    driveStick.classList.remove('hidden');
    mostrarC();
    feedback('Pen drive conectado. Clique em um arquivo para copiar.');
  }

  stick.addEventListener('click', function () {
    if (inserido) return;
    if (!peguei) {
      peguei = true;
      stick.classList.add('picked');
      markStep('pendrive', 'pegar');
      feedback('Agora clique na porta USB do computador.');
    }
  });

  usbport.addEventListener('click', function () {
    if (inserido) return;
    if (!peguei) { toastSim('Primeiro pegue o pen drive.'); return; }
    inserido = true;
    markStep('pendrive', 'encaixar');
    stick.classList.add('inserted');
    stick.classList.remove('picked');
    explorer.classList.remove('hidden');
    driveStick.classList.remove('hidden');
    mostrarC();
    feedback('Pen drive reconhecido! Escolha um arquivo para copiar.');
    toastSim('Pen drive conectado!');
  });

  files.addEventListener('click', function (e) {
    var item = e.target.closest('.pd-file');
    if (!item || !inserido) return;
    if (path.textContent.indexOf('C:') === -1) return;
    var nome = item.getAttribute('data-arquivo');
    copiado = nome;
    copiar.disabled = false;
    copiar.classList.add('ready');
    mostrarC();
    feedback('Arquivo selecionado: ' + nome + '. Clique em "Copiar arquivo".');
  });

  files.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var item = e.target.closest('.pd-file');
    if (!item) return;
    e.preventDefault();
    item.click();
  });

  copiar.addEventListener('click', function () {
    if (!copiado) return;
    markStep('pendrive', 'copiar');
    copiar.disabled = true;
    copiar.classList.remove('ready');
    toastSim(copiado + ' copiado para a área de transferência!');
    feedback('Arquivo copiado! Agora clique em "Pen Drive (E:)" para colar.');
  });

  driveStick.addEventListener('click', function () {
    if (!copiado) { toastSim('Primeiro copie um arquivo.'); return; }
    markStep('pendrive', 'colar');
    ejetar.disabled = false;
    ejetar.classList.add('ready');
    mostrarE();
    feedback('Arquivo colado no pen drive. Não esqueça de ejetar com segurança!');
  });

  if (driveC) driveC.addEventListener('click', mostrarC);

  ejetar.addEventListener('click', function () {
    markStep('pendrive', 'ejetar');
    ejetar.disabled = true;
    ejetar.classList.remove('ready');
    inserido = false;
    stick.classList.remove('inserted');
    explorer.classList.add('hidden');
    driveStick.classList.add('hidden');
    feedback('Ejetado! Você pode retirar o pen drive com segurança.');
    toastSim('Pen drive ejetado com segurança!');
  });
}

/* ═══════════ SIMULADOR 7: NAVEGAR NA INTERNET ═══════════ */
var NB_PAGINAS = {
  home: {
    titulo: 'SEADI — Portal de Aulas',
    endereco: 'seadi.com.br',
    html:
      '<div class="nb-hero">' +
        '<h3>Bem-vindo ao portal de aulas</h3>' +
        '<p>Clique em um assunto para continuar navegando.</p>' +
      '</div>' +
      '<div class="nb-links">' +
        '<a href="#" data-pagina="pesquisar">Como pesquisar no Google</a>' +
        '<a href="#" data-pagina="pendrive">Usando pen drive</a>' +
        '<a href="#" data-pagina="internet">Internet básica</a>' +
        '<a href="#" data-pagina="email">Criando e-mail</a>' +
      '</div>'
  },
  pesquisar: {
    titulo: 'Como pesquisar no Google',
    endereco: 'seadi.com.br/como-pesquisar',
    html:
      '<article class="nb-artigo">' +
        '<h3>Como pesquisar no Google</h3>' +
        '<p>Digite a sua dúvida na caixa de pesquisa e pressione Enter. Use palavras-chave curtas, como "como criar um e-mail", para encontrar respostas mais rápido.</p>' +
        '<a href="#" data-pagina="home" class="nb-voltar">Voltar ao início</a>' +
      '</article>'
  },
  pendrive: {
    titulo: 'Usando pen drive',
    endereco: 'seadi.com.br/pen-drive',
    html:
      '<article class="nb-artigo">' +
        '<h3>Usando pen drive</h3>' +
        '<p>O pen drive serve para guardar e levar arquivos de um computador para outro. Antes de retirar, sempre clique em "Ejetar com segurança" para não estragar os dados.</p>' +
        '<a href="#" data-pagina="home" class="nb-voltar">Voltar ao início</a>' +
      '</article>'
  },
  internet: {
    titulo: 'Internet básica',
    endereco: 'seadi.com.br/internet-basica',
    html:
      '<article class="nb-artigo">' +
        '<h3>Internet básica</h3>' +
        '<p>O navegador é o programa que você usa para acessar a internet. Na barra de endereço, digite o nome do site (ex.: seadi.com.br) e pressione Enter.</p>' +
        '<a href="#" data-pagina="home" class="nb-voltar">Voltar ao início</a>' +
      '</article>'
  },
  email: {
    titulo: 'Criando e-mail',
    endereco: 'seadi.com.br/criar-email',
    html:
      '<article class="nb-artigo">' +
        '<h3>Criando e-mail</h3>' +
        '<p>Para criar um e-mail você precisa escolher um endereço (ex.: joao@email.com) e uma senha segura. Guarde os dois em um lugar seguro.</p>' +
        '<a href="#" data-pagina="home" class="nb-voltar">Voltar ao início</a>' +
      '</article>'
  }
};

function initNavegador() {
  var janela = document.getElementById('nb-window');
  var start = document.getElementById('nb-start');
  var abrir = document.getElementById('nb-open');
  var page = document.getElementById('nb-page');
  var title = document.getElementById('nb-title');
  var address = document.getElementById('nb-address');
  var back = document.getElementById('nb-back');
  var reload = document.getElementById('nb-reload');
  var addTab = document.getElementById('nb-add');
  var tabs = document.getElementById('nb-tabs');
  if (!janela || !abrir) return;

  var ligado = loadSteps('navegador').indexOf('abrir') !== -1;
  var historico = [];
  var idx = -1;

  var paginasPorEndereco = {};
  Object.keys(NB_PAGINAS).forEach(function (k) {
    paginasPorEndereco[NB_PAGINAS[k].endereco] = k;
  });

  function renderPagina(slug) {
    var p = NB_PAGINAS[slug];
    if (!p) return;
    title.textContent = p.titulo;
    address.value = p.endereco;
    page.innerHTML = p.html;
    page.classList.add('nb-loaded');
  }

  function carregar(slug) {
    historico = historico.slice(0, idx + 1);
    historico.push(slug);
    idx = historico.length - 1;
    renderPagina(slug);
    back.disabled = idx <= 0;
  }

  function ligarNavegador() {
    if (ligado) return;
    ligado = true;
    markStep('navegador', 'abrir');
    start.classList.add('hidden');
    address.disabled = false;
    reload.disabled = false;
    addTab.disabled = false;
    carregar('home');
    toastSim('Navegador aberto!');
  }

  if (ligado) {
    start.classList.add('hidden');
    address.disabled = false;
    reload.disabled = false;
    addTab.disabled = false;
    carregar('home');
  }

  abrir.addEventListener('click', ligarNavegador);

  address.addEventListener('focus', function () {
    if (!ligado) return;
    markStep('navegador', 'endereco');
    address.select();
  });

  address.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (!ligado) return;
    markStep('navegador', 'entrar');
    var valor = address.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    var destino = paginasPorEndereco[valor];
    if (destino) {
      carregar(destino);
    } else {
      toastSim('Endereço não encontrado. Tente "seadi.com.br".');
      address.value = 'seadi.com.br';
      address.select();
    }
  });

  page.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-pagina]');
    if (!link || !ligado) return;
    e.preventDefault();
    markStep('navegador', 'link');
    carregar(link.getAttribute('data-pagina'));
  });

  back.addEventListener('click', function () {
    if (!ligado || idx <= 0) return;
    markStep('navegador', 'voltar');
    idx--;
    renderPagina(historico[idx]);
    back.disabled = idx <= 0;
  });

  reload.addEventListener('click', function () {
    if (!ligado) return;
    markStep('navegador', 'atualizar');
    var atual = historico[idx] || 'home';
    page.classList.remove('nb-loaded');
    page.innerHTML = '<div class="nb-loading"><span></span><span></span><span></span><p>Carregando...</p></div>';
    setTimeout(function () {
      renderPagina(atual);
    }, 650);
  });

  addTab.addEventListener('click', function () {
    if (!ligado) return;
    markStep('navegador', 'aba');
    var tab = document.createElement('span');
    tab.className = 'nb-tab';
    tab.textContent = 'Nova aba';
    tabs.insertBefore(tab, addTab);
    toastSim('Nova aba aberta!');
  });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function () {
  window.__simCompleted = {};
  initLigar();
  initMouse();
  initTeclado();
  initJanelas();
  initRedes();
  initPendrive();
  initNavegador();
  initServerState();
});
