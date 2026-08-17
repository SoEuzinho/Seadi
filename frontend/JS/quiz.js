(function () {
  'use strict';

  /**
   * Quiz Multiplayer — Fluxo de Salas Públicas
   *
   * O usuário escolhe uma categoria e acessa a LISTA DE SALAS públicas
   * daquele nível (atualizada em tempo real via Socket.IO). Ele pode
   * entrar em uma sala existente ou criar a própria sala, tornando-se
   * o HOST. Somente o Host inicia a partida; os demais aguardam.
   *
   * Views:
   * - home   → seleção de categoria + histórico
   * - rooms  → lista de salas abertas da categoria (tempo real)
   * - room   → dentro de uma sala (aguardando o Host iniciar)
   * - game   → partida (cronômetro, perguntas, ranking)
   * - final  → resultado final (pódio + estatísticas)
   */

  var state = {
    categories: [],
    selected: null,
    me: null,
    socket: null,
    connected: false,
    pendingCategory: null, // categoria a assinar quando conectar
    roomCategory: null,    // categoria da lista que está sendo exibida
    currentRoom: null,     // último quiz:room_update recebido
    view: 'home',
    answered: false,
    currentQuestion: -1,   // índice (0-based) da pergunta em exibição
    timer: null,
  };

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function cache() {
    // home
    els.catsLoading = $('quiz-categories-loading');
    els.catsBox = $('quiz-categories');
    els.btnEnter = $('btn-entrar');
    els.history = $('quiz-history');
    els.historyList = $('quiz-history-list');
    els.btnRanking = $('btn-ranking');

    // ranking
    els.rankingLoading = $('ranking-loading');
    els.quizRanking = $('quiz-ranking');

    // lista de salas
    els.roomsCategoryLabel = $('rooms-category-label');
    els.roomsLoading = $('rooms-loading');
    els.roomsList = $('rooms-list');
    els.roomsEmpty = $('rooms-empty');
    els.btnCriarSala = $('btn-criar-sala');

    // sala (lobby)
    els.roomName = $('room-name');
    els.roomCategory = $('room-category');
    els.roomStatusBadge = $('room-status-badge');
    els.roomCountNow = $('room-count-now');
    els.roomCountMax = $('room-count-max');
    els.roomPlayers = $('room-players');
    els.roomHostControls = $('room-host-controls');
    els.roomWaiting = $('room-waiting');
    els.btnIniciar = $('btn-iniciar');
    els.btnCancelar = $('btn-cancelar');
    els.btnSairSala = $('btn-sair-sala');

    // jogo
    els.qIndex = $('game-qindex');
    els.qTotal = $('game-qtotal');
    els.timer = $('game-timer');
    els.timerValue = $('game-timer-value');
    els.enunciado = $('game-enunciado');
    els.alternativas = $('game-alternativas');
    els.feedback = $('game-feedback');
    els.summary = $('game-summary');
    els.pause = $('game-pause');
    els.rankingList = $('game-ranking-list');
    els.btnSairJogo = $('btn-sair-jogo');

    // final
    els.finalSubtitle = $('final-subtitle');
    els.finalPodium = $('final-podium');
    els.finalStatsGrid = $('final-stats-grid');
    els.finalClassList = $('final-class-list');
  }

  function esc(text) {
    var d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function letterOf(i) {
    return String.fromCharCode(65 + i);
  }

  // Avatar do jogador: usa a foto de perfil cadastrada no sistema
  // (fotoUrl), com fallback para a inicial do nome.
  function avatarFor(p, small) {
    var cls = 'lp-avatar' + (small ? ' lp-avatar-sm' : '');
    var nome = p && p.nome ? p.nome : '';
    var fotoUrl = p && p.fotoUrl ? p.fotoUrl : null;
    return '<span class="' + cls + '">' + avatarImg(nome, fotoUrl, 'lp-avatar-img') + '</span>';
  }

  function showView(name) {
    state.view = name;
    ['home', 'rooms', 'room', 'game', 'final', 'ranking'].forEach(function (v) {
      var el = $('view-' + v);
      if (el) el.classList.add('d-none');
    });
    var target = $('view-' + name);
    if (target) target.classList.remove('d-none');
    window.scrollTo(0, 0);
  }

  function categoryName(id) {
    for (var i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === id) return state.categories[i].nome;
    }
    return id;
  }

  function roomStatusLabel(status) {
    if (status === 'playing') return 'Em andamento';
    if (status === 'finished') return 'Encerrada';
    return 'Aguardando jogadores';
  }

  /* ───────────── CATEGORIAS ───────────── */

  function catCount(cat) {
    if (cat.id === 'misto') {
      // A API já retorna a categoria "misto" com o total somado. Somar todos
      // os counts de novo incluiria a própria entrada "misto", duplicando o
      // número exibido. Por isso contamos apenas as categorias reais.
      return state.categories.reduce(function (s, c) {
        return s + (c.id === 'misto' ? 0 : (c.count || 0));
      }, 0);
    }
    return cat.count || 0;
  }

  function renderCategories() {
    var n = catCount({ id: 'misto' });
    var list = state.categories.map(function (c) { return c; });

    // A API já retorna a categoria "misto"; só adiciona se estiver ausente
    var hasMisto = list.some(function (c) { return c.id === 'misto'; });
    if (!hasMisto) {
      list.push({ id: 'misto', nome: 'Misto', icone: '🎲', descricao: 'Perguntas sorteadas de todos os módulos', count: n });
    }

    els.catsLoading.classList.add('d-none');
    els.catsBox.innerHTML = '';

    var hasAvailable = false;
    list.forEach(function (cat) {
      var available = cat.id === 'misto' ? n > 0 : cat.count > 0;
      if (available && !state.selected) state.selected = cat.id;
      if (available) hasAvailable = true;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-cat' + (state.selected === cat.id ? ' selected' : '') + (available ? '' : ' disabled');
      btn.style.opacity = available ? '' : '0.45';
      btn.innerHTML =
        '<span class="cat-icone">' + cat.icone + '</span>' +
        '<span class="cat-nome">' + esc(cat.nome) + '</span>' +
        '<span class="cat-desc">' + esc(cat.descricao || '') + '</span>' +
        '<span class="cat-count">' + catCount(cat) + ' perguntas</span>';
      btn.addEventListener('click', function () {
        if (!available) return;
        state.selected = cat.id;
        renderCategories();
      });
      els.catsBox.appendChild(btn);
    });

    els.btnEnter.disabled = !hasAvailable || !state.selected;
  }

  async function loadCategories() {
    try {
      var data = await apiFetch('/quiz/categories');
      state.categories = data || [];
      renderCategories();
    } catch (err) {
      els.catsLoading.classList.add('d-none');
      els.catsBox.innerHTML =
        '<p style="grid-column:1/-1;color:var(--text-muted);font-size:0.85rem;">' +
        esc('Não foi possível carregar as categorias. ' + err.message) + '</p>';
    }
  }

  /* ───────────── HISTÓRICO ───────────── */

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  async function loadHistory() {
    try {
      var data = await apiFetch('/quiz/history');
      if (!data || !data.length) {
        els.history.classList.add('d-none');
        return;
      }
      els.history.classList.remove('d-none');
      els.historyList.innerHTML = data.map(function (m) {
        var sub = m.posicao === 1 ? 'Vencedor 🏆' : 'Acertos: ' + m.acertos + '/' + m.totalPerguntas;
        return '<div class="history-item">' +
          '<div class="h-left"><span class="h-pos">' + m.posicao + 'º</span>' +
          '<span class="h-cat">' + esc(m.categoria) + '</span>' +
          '<span class="h-sub">' + esc(sub) + '</span></div>' +
          '<div class="h-right"><span class="h-pts">' + m.pontos + ' pts</span>' +
          '<span class="h-date">' + fmtDate(m.concluidaEm) + '</span></div>' +
          '</div>';
      }).join('');
    } catch (err) {
      els.history.classList.add('d-none');
    }
  }

  /* ───────────── RANKING ───────────── */

  function showRanking() {
    showView('ranking');
    loadRanking();
  }

  async function loadRanking() {
    els.rankingLoading.classList.remove('d-none');
    els.quizRanking.classList.add('d-none');
    try {
      var data = await apiFetch('/quiz/ranking');
      renderRankingTable(data || []);
    } catch (err) {
      els.rankingLoading.classList.add('d-none');
      els.quizRanking.classList.remove('d-none');
      els.quizRanking.innerHTML =
        '<div class="qr-empty">Não foi possível carregar o ranking. ' +
        esc(err.message) + '</div>';
    }
  }

  function renderRankingTable(list) {
    els.rankingLoading.classList.add('d-none');
    els.quizRanking.classList.remove('d-none');

    if (!list.length) {
      els.quizRanking.innerHTML = '<div class="qr-empty">Ninguém jogou ainda. Crie uma sala e dispute a primeira partida!</div>';
      return;
    }

    // Pódio com os 3 primeiros (posições visuais: 2º | 1º | 3º)
    var top = list.slice(0, 3);
    var podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
    var podium = '<div class="qr-podium">' +
      podiumOrder.map(function (r, k) {
        var isFirst = r === top[0];
        var medalChar = r === top[0] ? '🥇' : r === top[1] ? '🥈' : '🥉';
        return '<div class="qr-podium-item' + (isFirst ? ' qr-first' : '') + '">' +
          avatarFor({ nome: r.nome, fotoUrl: r.fotoUrl }) +
          '<div class="qr-p-name">' + esc(r.nome) + '</div>' +
          '<div class="qr-p-meta">' + r.vitorias + ' vitória' + (r.vitorias === 1 ? '' : 's') +
            ' · ' + r.pontos.toLocaleString('pt-BR') + ' pts</div>' +
          '<div class="qr-p-pos">' + medalChar + '</div>' +
          '</div>';
      }).join('') + '</div>';

    var rows = list.map(function (r, i) {
      var pos = i + 1;
      var medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
      var isMe = state.me && r.id === state.me;
      return '<tr' + (isMe ? ' class="me-row"' : '') + '>' +
        '<td class="qr-pos">' + medal + '</td>' +
        '<td class="qr-name">' +
          avatarFor({ nome: r.nome, fotoUrl: r.fotoUrl }, true) +
          '<span>' + esc(r.nome) + (isMe ? ' <em>(você)</em>' : '') + '</span>' +
        '</td>' +
        '<td class="qr-win">' + r.vitorias + '</td>' +
        '<td>' + r.partidas + '</td>' +
        '<td class="qr-pts">' + r.pontos.toLocaleString('pt-BR') + '</td>' +
        '<td>' + r.melhorPercentual + '%</td>' +
        '</tr>';
    }).join('');

    els.quizRanking.innerHTML = podium +
      '<div class="qr-table-wrap"><table class="qr-table">' +
      '<thead><tr>' +
      '<th>Pos</th><th>Jogador</th><th>Vitórias</th><th>Partidas</th><th>Pontos</th><th>Aproveitamento</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ───────────── LISTA DE SALAS ───────────── */

  function renderRoomsList(data) {
    var rooms = data.rooms || [];
    var hasRooms = rooms.length > 0;

    els.roomsLoading.classList.add('d-none');
    els.roomsList.classList.toggle('d-none', !hasRooms);
    els.roomsEmpty.classList.toggle('d-none', hasRooms);

    if (!hasRooms) {
      els.roomsList.innerHTML = '';
      return;
    }

    els.roomsList.innerHTML = rooms.map(function (room) {
      return '<article class="room-card">' +
        '<div class="rc-top">' +
          '<h3 class="rc-name">' + esc(room.nome) + '</h3>' +
          '<span class="rc-host">👑 ' + esc(room.hostName) + '</span>' +
        '</div>' +
        '<div class="rc-meta">' +
          '<span class="rc-item">👥 ' + room.playersCount + ' / ' + room.maxPlayers + ' jogadores</span>' +
          '<span class="rc-item">🟢 ' + esc(roomStatusLabel(room.status)) + '</span>' +
        '</div>' +
        '<button type="button" class="btn btn-primary rc-enter" data-room="' + esc(room.roomId) + '">Entrar</button>' +
      '</article>';
    }).join('');

    els.roomsList.querySelectorAll('[data-room]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        joinRoom(btn.getAttribute('data-room'));
      });
    });
  }

  /* ───────────── SALA (LOBBY) ───────────── */

  function renderRoom(data) {
    state.currentRoom = data;
    var me = state.me;
    var isHost = data.hostId === me;

    els.roomName.textContent = data.nome || 'Sala';
    els.roomCategory.textContent = 'Categoria: ' + categoryName(data.categoria);
    els.roomCountNow.textContent = data.playersCount;
    els.roomCountMax.textContent = data.maxPlayers;

    els.roomStatusBadge.textContent = roomStatusLabel(data.status);
    els.roomStatusBadge.className = 'room-status-badge st-' + data.status;

    // Somente o Host vê os controles de iniciar/cancelar
    els.roomHostControls.classList.toggle('d-none', !isHost);
    els.roomWaiting.classList.toggle('d-none', isHost);

    els.roomPlayers.innerHTML = data.players.map(function (p) {
      var you = p.userId === me ? '<span class="rp-you">você</span>' : '';
      var host = p.isHost ? '<span class="rp-host">HOST</span>' : '';
      return '<div class="room-player' + (p.isHost ? ' is-host' : '') + '">' +
        avatarFor(p) +
        '<span class="rp-nome">' + esc(p.nome) + '</span>' +
        you + host +
      '</div>';
    }).join('');
  }

  /* ───────────── JOGO ───────────── */

  function stopTimer() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function renderTimer(sec) {
    els.timerValue.textContent = Math.max(sec, 0);
    els.timer.classList.toggle('low', sec <= 5);
    els.timer.classList.toggle('urgent', sec <= 3);
  }

  /**
   * Cronômetro de exibição sincronizado pelo servidor.
   * Quando `deadline` é informado (timestamp absoluto) e `offset` é o desvio
   * de relógio (serverTime - Date.now()) calculado na chegada do evento,
   * TODOS os clientes mostram o MESMO tempo restante no mesmo instante,
   * mesmo com relógios diferentes em cada dispositivo.
   */
  function startTimer(seconds, deadline, offset) {
    stopTimer();
    offset = offset || 0;
    var clock = function () { return Date.now() + offset; };
    var remaining;
    if (deadline) {
      remaining = Math.min(seconds, Math.max(0, Math.ceil((deadline - clock()) / 1000)));
    } else {
      remaining = seconds;
    }
    renderTimer(remaining);

    state.timer = setInterval(function () {
      if (deadline) {
        remaining = Math.min(seconds, Math.max(0, Math.ceil((deadline - clock()) / 1000)));
      } else {
        remaining--;
      }
      renderTimer(remaining);
      if (remaining <= 0) stopTimer();
    }, 1000);
  }

  // Desvio de relógio do servidor no momento em que o evento chegou:
  // anula a diferença entre o relógio do dispositivo e o relógio do servidor.
  function clockOffset(data) {
    return typeof data.serverTime === 'number' ? data.serverTime - Date.now() : 0;
  }

  // Contagem regressiva entre perguntas, sincronizada para todos os jogadores
  function startPauseCountdown(seconds, resumeAt, offset) {
    stopTimer();
    offset = offset || 0;
    var el = els.pause;
    if (!el) return;
    var clock = function () { return Date.now() + offset; };
    var num = el.querySelector('.pause-value');
    var remaining = resumeAt
      ? Math.min(seconds, Math.max(0, Math.ceil((resumeAt - clock()) / 1000)))
      : seconds;
    if (num) num.textContent = remaining;
    el.classList.add('show');

    // 250ms de intervalo: contagem suave e precisa até o próximo número
    state.timer = setInterval(function () {
      if (resumeAt) {
        remaining = Math.min(seconds, Math.max(0, Math.ceil((resumeAt - clock()) / 1000)));
      } else {
        remaining = Math.max(0, remaining - 0.25);
      }
      if (num) num.textContent = Math.ceil(remaining);
      if (remaining <= 0) stopTimer();
    }, 250);
  }

  function hidePause() {
    stopTimer();
    if (els.pause) els.pause.classList.remove('show');
  }

  function renderAlternativas(alts, canAnswer) {
    els.alternativas.innerHTML = '';
    alts.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-alt';
      btn.innerHTML =
        '<span class="alt-letter">' + letterOf(i) + '</span>' +
        '<span>' + esc(text) + '</span>';
      btn.addEventListener('click', function () {
        if (!canAnswer || state.answered || state.view !== 'game') return;
        state.answered = true;
        btn.classList.add('selected');
        var all = els.alternativas.querySelectorAll('.quiz-alt');
        all.forEach(function (b) { b.disabled = true; });
        // Envia a alternativa e a pergunta atual: o servidor confere se o
        // índice da pergunta é mesmo o da rodada vigente (anti-trapaça).
        state.socket.emit('quiz:answer', {
          index: i,
          questionIndex: state.currentQuestion,
        });
      });
      btn.style.animationDelay = (i * 60) + 'ms';
      if (!canAnswer) btn.disabled = true;
      els.alternativas.appendChild(btn);
    });
  }

  function renderRanking(list) {
    els.rankingList.innerHTML = list.map(function (p, i) {
      var cls = 'ranking-item';
      if (i === 0) cls += ' top1';
      if (i === 1) cls += ' top2';
      if (i === 2) cls += ' top3';
      if (p.userId === state.me) cls += ' me';
      return '<div class="' + cls + '">' +
        '<span class="r-pos">' + (i + 1) + 'º</span>' +
        avatarFor(p) +
        '<span class="r-nome">' + esc(p.nome) + '</span>' +
        '<span class="r-pts">' + (p.pontos || 0) + '</span></div>';
    }).join('');
  }

  /* ───────────── FINAL ───────────── */

  function renderFinal(data) {
    stopTimer();

    var results = data.results || [];
    var meResult = null;
    results.forEach(function (r) {
      if (r.userId === state.me) meResult = r;
    });

    var posText = meResult ? meResult.posicao + 'º lugar' : 'partida concluída';
    els.finalSubtitle.textContent = 'Você terminou em ' + posText + ' na categoria ' + data.categoria + '.';

    var medals = ['🥇', '🥈', '🥉'];
    var podium = results.slice(0, 3);
    els.finalPodium.innerHTML = podium.map(function (r, i) {
      return '<div class="podium-col p' + (i + 1) + '">' +
        '<div class="podium-medal">' + medals[i] + '</div>' +
        avatarFor(r) +
        '<div class="podium-name">' + esc(r.nome) + '</div>' +
        '<div class="podium-pts">' + r.pontos + ' pts</div>' +
        '<div class="podium-bar">' + (i + 1) + 'º</div>' +
        '</div>';
    }).join('');

    if (meResult) {
      var stats = [
        { cls: 'stat-cell pontos', v: meResult.pontos, l: 'pontos' },
        { cls: 'stat-cell acertos', v: meResult.acertos, l: 'acertos' },
        { cls: 'stat-cell erros', v: meResult.erros, l: 'erros' },
        { cls: 'stat-cell', v: (meResult.percentualAcertos || 0) + '%', l: 'precisão' },
        { cls: 'stat-cell', v: (meResult.tempoMedioResposta || 0) + 's', l: 'tempo médio' },
      ];
      els.finalStatsGrid.innerHTML = stats.map(function (s, i) {
        return '<div class="' + s.cls + '" style="animation-delay:' + (i * 80) + 'ms;">' +
          '<div class="sc-value">' + s.v + '</div><div class="sc-label">' + s.l + '</div></div>';
      }).join('');
    } else {
      els.finalStatsGrid.innerHTML = '<div class="stat-cell" style="grid-column:1/-1;"><div class="sc-value">—</div><div class="sc-label">Você não participou desta partida</div></div>';
    }

    // Classificação completa: TODOS os jogadores, com medalha para os 3 primeiros
    els.finalClassList.innerHTML = results.map(function (r, i) {
      var cls = 'ranking-item';
      if (i === 0) cls += ' top1';
      if (i === 1) cls += ' top2';
      if (i === 2) cls += ' top3';
      if (r.userId === state.me) cls += ' me';
      var pos = i < 3 ? medals[i] : (i + 1) + 'º';
      return '<div class="' + cls + '" style="animation-delay:' + (i * 45) + 'ms;">' +
        '<span class="r-pos">' + pos + '</span>' +
        avatarFor(r) +
        '<span class="r-nome">' + esc(r.nome) + '</span>' +
        '<span class="r-pts">' + r.pontos + '</span></div>';
    }).join('');

    showView('final');
    loadHistory();
  }

  /* ───────────── SOCKET ───────────── */

  function connectSocket() {
    state.socket = io('/quiz', {
      transports: ['websocket', 'polling'],
    });

    state.socket.on('connect', function () {
      state.connected = true;

      // Reconexão (Socket.IO reconecta automaticamente): retoma a sala
      // ou partida em que o jogador estava antes da queda.
      if (state.currentRoom && state.currentRoom.roomId) {
        state.socket.emit('quiz:room:join', { roomId: state.currentRoom.roomId });
        return;
      }

      if (state.pendingCategory) {
        var cat = state.pendingCategory;
        state.pendingCategory = null;
        subscribeRooms(cat);
      } else if (state.view === 'rooms') {
        var cat2 = state.roomCategory || state.selected;
        if (cat2) subscribeRooms(cat2);
      }
    });

    state.socket.on('connect_error', function () {
      if (state.view === 'rooms' || state.view === 'room' || state.view === 'game') {
        showToast('Falha na conexão em tempo real. Tentando reconectar...');
      }
    });

    state.socket.on('disconnect', function () {
      state.connected = false;
      stopTimer();
      // Em sala/partida mantemos a tela: o Socket.IO reconecta sozinho e o
      // evento 'connect' retoma a sala automaticamente.
      if (state.view === 'rooms' || state.view === 'room' || state.view === 'game') {
        showToast('Conexão perdida. Reconectando...');
      } else if (state.view !== 'home') {
        showToast('Conexão perdida. Você saiu da sala.');
        showView('home');
      }
    });

    state.socket.on('reconnect_failed', function () {
      if (state.view === 'room' || state.view === 'game') {
        showToast('Não foi possível reconectar. Você saiu da sala.');
        state.currentRoom = null;
        showView('home');
      }
    });

    // Lista pública de salas (atualizada em tempo real)
    state.socket.on('quiz:rooms:list', function (data) {
      if (state.view === 'rooms') renderRoomsList(data);
    });

    // Estado da sala (jogadores, Host, status)
    state.socket.on('quiz:room_update', function (data) {
      state.currentRoom = data;
      if (data.status === 'waiting') {
        showView('room');
        renderRoom(data);
      } else if (data.status === 'playing') {
        // Entrou em uma partida em andamento: vai para a tela de jogo e
        // aguarda a sincronização (quiz:start/quiz:question) enviada pelo
        // servidor, ou a próxima pergunta se entrar durante a pausa.
        showView('game');
      }
    });

    // O Host saiu e o Host foi transferido
    state.socket.on('quiz:host_changed', function (data) {
      if (data && data.message) showToast(data.message);
    });

    // Sala cancelada pelo Host
    state.socket.on('quiz:room_cancelled', function (data) {
      showToast((data && data.message) || 'A sala foi encerrada.');
      goToRoomsList();
    });

    // Jogador expulso pelo Host
    state.socket.on('quiz:room_kicked', function (data) {
      showToast((data && data.message) || 'Você foi removido da sala.');
      goToRoomsList();
    });

    state.socket.on('quiz:start', function (data) {
      renderRanking(data.players.map(function (p) {
        return { userId: p.userId, nome: p.nome, fotoUrl: p.fotoUrl, pontos: 0 };
      }));
    });

    state.socket.on('quiz:question', function (data) {
      state.answered = false;
      state.currentQuestion = (data.index || 1) - 1;
      hidePause();
      els.qIndex.textContent = data.index;
      els.qTotal.textContent = data.total;
      els.enunciado.textContent = data.enunciado;
      els.feedback.className = 'quiz-feedback';
      els.feedback.textContent = '';
      els.summary.className = 'quiz-summary';
      els.summary.innerHTML = '';

      // canAnswer=false: entrou em uma partida em andamento durante a
      // pergunta atual (ou reconectou depois de já ter respondido). O
      // jogador vê a pergunta, mas só pode responder a partir da próxima.
      var canAnswer = data.canAnswer !== false;
      renderAlternativas(data.alternativas, canAnswer);
      if (!canAnswer) {
        state.answered = true;
        els.feedback.className = 'quiz-feedback show neutral';
        els.feedback.textContent =
          'Esta pergunta já foi encerrada para você. A próxima já conta na sua pontuação!';
      }

      // Re-triggers a animação suave da pergunta quando uma nova chega
      var card = $('game-question-card');
      if (card) {
        card.classList.remove('question-switch');
        void card.offsetWidth;
        card.classList.add('question-switch');
      }

      startTimer(data.tempo, data.deadline, clockOffset(data));
      showView('game');
    });

    // Intervalo entre perguntas: contagem regressiva sincronizada para todos
    state.socket.on('quiz:pause', function (data) {
      if (state.view !== 'game') return;
      // Bloqueia respostas durante o intervalo (o servidor também as ignora)
      var all = els.alternativas.querySelectorAll('.quiz-alt');
      all.forEach(function (b) { b.disabled = true; });
      startPauseCountdown(data.seconds, data.resumeAt, clockOffset(data));
    });

    state.socket.on('quiz:answer_ack', function () {
      if (state.view !== 'game') return;
      // Se o gabarito já chegou (todos responderam → quiz:results), não
      // sobrescreve o feedback de acerto/erro do próprio jogador.
      if (els.summary && els.summary.classList.contains('show')) return;
      // A resposta NÃO é revelada aqui: todos só veem o gabarito depois que
      // todos responderem (ou o tempo acabar), quando chega o quiz:results.
      els.feedback.className = 'quiz-feedback show neutral';
      els.feedback.textContent = 'Resposta enviada! Aguardando os outros jogadores...';
    });

    state.socket.on('quiz:results', function (data) {
      var all = els.alternativas.querySelectorAll('.quiz-alt');
      if (all[data.correctIndex]) all[data.correctIndex].classList.add('correct');

      // Só agora revela o resultado do próprio jogador
      var mine = null;
      (data.players || []).forEach(function (p) {
        if (p.userId === state.me) mine = p;
      });
      if (mine) {
        if (mine.acertou) {
          els.feedback.className = 'quiz-feedback show ok';
          els.feedback.textContent = 'Correto! +' + (mine.pontosGanhos || 0) + ' pontos';
        } else if (!mine.respondeu) {
          // Entrou durante esta pergunta ou o tempo acabou antes de responder
          els.feedback.className = 'quiz-feedback show neutral';
          els.feedback.textContent = 'Sem resposta nesta pergunta.';
        } else {
          var wrongIdx = typeof mine.resposta === 'number' ? mine.resposta : -1;
          if (wrongIdx >= 0 && all[wrongIdx]) all[wrongIdx].classList.add('wrong');
          els.feedback.className = 'quiz-feedback show erro';
          els.feedback.textContent = 'Errado! A resposta era ' + letterOf(data.correctIndex) + '.';
        }
      }

      var rows = data.players.map(function (p, i) {
        var ico = !p.respondeu ? '⏱️' : (p.acertou ? '✅' : '❌');
        var cls = 'sm-row' + (p.userId === state.me ? ' me' : '');
        return '<div class="' + cls + '" style="animation-delay:' + (i * 50) + 'ms;">' +
          '<span class="sm-ico">' + ico + '</span>' +
          avatarFor(p, true) +
          '<span class="sm-nome">' + esc(p.nome) + '</span>' +
          '<span class="sm-pts">+' + (p.pontosGanhos || 0) + '</span></div>';
      }).join('');
      els.summary.innerHTML =
        '<div class="sm-title">Respostas desta pergunta</div>' + rows;
      els.summary.classList.add('show');
    });

    state.socket.on('quiz:rank', renderRanking);

    state.socket.on('quiz:end', renderFinal);

    state.socket.on('quiz:error', function (data) {
      showToast((data && data.message) || 'Ocorreu um erro.');
      if (state.view === 'room' || state.view === 'game') goToRoomsList();
    });
  }

  /* ───────────── AÇÕES ───────────── */

  function subscribeRooms(category) {
    if (state.connected) {
      state.roomCategory = category;
      state.socket.emit('quiz:rooms:subscribe', { category: category });
    }
  }

  function unsubscribeRooms() {
    if (state.socket && state.connected) state.socket.emit('quiz:rooms:unsubscribe');
    state.roomCategory = null;
  }

  // Home → lista de salas da categoria escolhida
  function enterRoomList() {
    if (!state.selected) {
      showToast('Escolha uma categoria para começar.');
      return;
    }

    state.roomCategory = state.selected;
    els.roomsCategoryLabel.textContent = categoryName(state.selected);

    showView('rooms');
    els.roomsLoading.classList.remove('d-none');
    els.roomsList.classList.add('d-none');
    els.roomsEmpty.classList.add('d-none');

    if (state.connected) {
      state.socket.emit('quiz:rooms:subscribe', { category: state.selected });
    } else {
      state.pendingCategory = state.selected;
      showToast('Conectando...');
    }
  }

  function backToCategories() {
    unsubscribeRooms();
    showView('home');
  }

  // Cria uma nova sala (o usuário vira Host)
  function createRoom() {
    if (!state.connected) {
      showToast('Conectando...');
      return;
    }
    var category = state.roomCategory || state.selected;
    if (!category) return;
    unsubscribeRooms();
    state.socket.emit('quiz:room:create', { category: category });
  }

  // Entra em uma sala existente
  function joinRoom(roomId) {
    if (!state.connected) {
      showToast('Conectando...');
      return;
    }
    unsubscribeRooms();
    state.socket.emit('quiz:room:join', { roomId: roomId });
  }

  // Host inicia a partida
  function startMatch() {
    if (!state.connected) return;
    if (state.socket) state.socket.emit('quiz:room:start');
  }

  // Host cancela (fecha) a sala
  function cancelRoom() {
    if (!state.connected) return;
    if (state.socket) state.socket.emit('quiz:room:cancel');
  }

  // Sair da sala atual e voltar para a lista
  function leaveRoom() {
    if (state.socket && state.connected) state.socket.emit('quiz:room:leave');
    stopTimer();
    enterRoomList();
  }

  // Sair da partida em andamento (abandona o acompanhamento da partida)
  function leaveGame() {
    if (!window.confirm('Sair da partida? Sua pontuação não será salva.')) return;
    stopTimer();
    // Limpa a sala para a reconexão automática não tentar voltar para ela.
    state.currentRoom = null;
    if (state.socket && state.connected) state.socket.emit('quiz:room:leave');
    goToRoomsList();
  }

  // Final da partida → volta para a lista de salas
  function goToRoomsList() {
    stopTimer();
    if (state.socket && state.connected) state.socket.emit('quiz:room:leave');
    var category = state.roomCategory || state.selected;
    showView('rooms');
    els.roomsLoading.classList.remove('d-none');
    els.roomsList.classList.add('d-none');
    els.roomsEmpty.classList.add('d-none');
    if (category) subscribeRooms(category);
  }

  // Final da partida → cria uma nova sala
  function createNewRoom() {
    stopTimer();
    if (state.socket && state.connected) state.socket.emit('quiz:room:leave');
    createRoom();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!isAuthenticated()) {
      window.location.href = '/login.html';
      return;
    }

    cache();
    // Identidade do usuário já a partir do cache local: evita que o Host
    // fique sem o botão "Iniciar Partida" enquanto /auth/profile não responde.
    state.me = Number(getCurrentUserId() || 0) || null;
    loadCategories();
    loadHistory();

    apiFetch('/auth/profile').then(function (user) {
      state.me = user.id;
      // Perfil carregado depois de entrar na sala: re-renderiza para mostrar
      // os controles de Host e o destaque "você".
      if (state.view === 'room' && state.currentRoom) renderRoom(state.currentRoom);
    }).catch(function () {
      // Mantém o valor do cache local (fallback).
    });

    els.btnEnter.addEventListener('click', enterRoomList);
    els.btnCriarSala.addEventListener('click', createRoom);
    els.btnIniciar.addEventListener('click', startMatch);
    els.btnCancelar.addEventListener('click', cancelRoom);
    els.btnSairSala.addEventListener('click', leaveRoom);
    els.btnSairJogo.addEventListener('click', leaveGame);
    els.btnRanking.addEventListener('click', showRanking);

    connectSocket();
  });

  window.Quiz = {
    enterRoomList: enterRoomList,
    backToCategories: backToCategories,
    createRoom: createRoom,
    startMatch: startMatch,
    cancelRoom: cancelRoom,
    leaveRoom: leaveRoom,
    leaveGame: leaveGame,
    goToRoomsList: goToRoomsList,
    createNewRoom: createNewRoom,
    backToMenu: backToCategories,
    goHome: backToCategories,
  };
})();
