/* ──────────────────────────────────────────────
   ranking.js — Página de Ranking (Diversões)
   Requer: api.js (apiFetch), shared.js
   Seções: online, alunos, curso mais rápido, dias
   ────────────────────────────────────────────── */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstNome(nome) {
  if (!nome) return 'Aluno';
  var parts = String(nome).trim().split(/\s+/);
  return parts[0] + (parts[1] ? ' ' + parts[1] : '');
}

function fmtTempo(seg) {
  seg = seg || 0;
  var d = Math.floor(seg / 86400);
  var h = Math.floor((seg % 86400) / 3600);
  var m = Math.floor((seg % 3600) / 60);
  if (d > 0) return d + 'd ' + h + 'h ' + m + 'min';
  if (h > 0) return h + 'h ' + m + 'min';
  if (m > 0) return m + 'min';
  return '<1min';
}

function fmtData(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var hh = String(d.getHours()).padStart(2, '0');
  var mi = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + ' ' + hh + ':' + mi;
}

function fmtDia(iso) {
  var d = new Date(iso + 'T00:00:00');
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm;
}

/* Data local no formato YYYY-MM-DD (mesma chave usada pelo backend). */
function localDateKey(d) {
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

function medal(pos) {
  if (pos === 1) return '<span class="medal medal-gold">1</span>';
  if (pos === 2) return '<span class="medal medal-silver">2</span>';
  if (pos === 3) return '<span class="medal medal-bronze">3</span>';
  return '<span class="rank-pos">' + pos + '</span>';
}

/* Título de honra para o top 3 do Quiz/curso. */
function titulo(pos) {
  if (pos === 1) return '<span class="titulo titulo-campeao">🏆 Campeão</span>';
  if (pos === 2) return '<span class="titulo titulo-vice">🥈 Vice-campeão</span>';
  if (pos === 3) return '<span class="titulo titulo-terceiro">🥉 3º lugar</span>';
  return '';
}

/* Marca a linha do usuário logado na tabela de ranking. */
function linhaEu(id, extra) {
  return String(getCurrentUserId()) === String(id) ? ' class="row-eu' + (extra || '') + '"' : '';
}

function chipEu() {
  return '<span class="chip-eu">você</span>';
}

/* ────────────────────────── ONLINE ────────────────────────── */
function renderOnline(list) {
  var el = document.getElementById('online-list');
  if (!el) return;

  if (!list || !list.length) {
    el.innerHTML = '<p class="rank-empty">Nenhum aluno online agora.</p>';
    return;
  }

  el.innerHTML = list
    .map(function (u) {
      return (
        '<span class="online-chip">' +
        '<span class="online-dot"></span>' +
        avatarImg(u.nome, u.fotoUrl, 'chip-avatar') +
        esc(firstNome(u.nome)) +
        '</span>'
      );
    })
    .join('');
}

/* ────────────────────────── ALUNOS ────────────────────────── */
function renderStudents(students) {
  var body = document.getElementById('students-body');
  if (!body) return;

  if (!students || !students.length) {
    body.innerHTML = '<tr><td colspan="6" class="rank-empty">Nenhum aluno cadastrado ainda.</td></tr>';
    return;
  }

  body.innerHTML = students
    .map(function (s, i) {
      var pos = i + 1;
      var bar = Math.min(100, s.progressoGeral || 0);
      var med = pos <= 3 ? medal(pos) : '<span class="rank-pos">' + pos + '</span>';
      var classes = (s.concluiuTudo ? ' done-row' : '') + (linhaEu(s.id) ? ' row-eu' : '');
      var tempoQ = s.tempoMedioQuiz > 0 ? '<div class="sub-line">⚡ ' + s.tempoMedioQuiz + 's/resp no Quiz</div>' : '';
      return (
        '<tr' + (classes ? ' class="' + classes.trim() + '"' : '') + '>' +
        '<td>' + med + '</td>' +
        '<td class="st-name">' +
          avatarImg(s.nome, s.fotoUrl, 'st-avatar') +
          esc(firstNome(s.nome)) +
          (linhaEu(s.id) ? chipEu() : '') +
          (s.concluiuTudo ? ' <span class="badge-tudo" title="Concluiu todos os módulos">✔</span>' : '') +
        '</td>' +
        '<td>' +
          '<div class="pbar"><div class="pbar-fill" style="width:' + bar + '%"></div></div>' +
          '<span class="pbar-pct">' + s.progressoGeral + '%</span>' +
          tempoQ +
        '</td>' +
        '<td>' + s.modulosConcluidos + '/' + s.totalModulos +
          '<div class="sub-line">' + s.aulasConcluidas + '/' + s.totalAulas + ' aulas</div></td>' +
        '<td>' + s.diasAtivos +
          (s.streak > 1 ? '<div class="sub-line streak-line">🔥 ' + s.streak + ' dias seguidos</div>' : '') +
          '</td>' +
        '<td class="st-last">' + fmtData(s.ultimoAcesso) + '</td>' +
        '</tr>'
      );
    })
    .join('');
}

/* ─────────────────────── CURSO MAIS RÁPIDO ─────────────────────── */
function renderFastest(list) {
  var el = document.getElementById('fastest-list');
  if (!el) return;

  if (!list || !list.length) {
    el.innerHTML = '<p class="rank-empty">Ainda ninguém concluiu o curso completo.</p>';
    return;
  }

  el.innerHTML = list
    .slice(0, 5)
    .map(function (u, i) {
      var pos = i + 1;
      return (
        '<div class="podium-item">' +
        '<span class="podium-medal">' + medal(pos) + '</span>' +
        avatarImg(u.nome, u.fotoUrl, 'podium-avatar') +
        '<div class="podium-info">' +
          '<strong>' + esc(firstNome(u.nome)) + '</strong>' +
          '<span class="podium-sub">Concluiu em ' + fmtData(u.concluidoEm) + '</span>' +
        '</div>' +
        '<span class="podium-time">' + fmtTempo(u.tempoSegundos) + '</span>' +
        '</div>'
      );
    })
    .join('');
}

/* ─────────────────────── MELHORES DIAS ─────────────────────── */
function renderDays(days) {
  var el = document.getElementById('days-chart');
  if (!el) return;

  if (!days || !days.length) {
    el.innerHTML = '<p class="rank-empty">Sem dados de acesso ainda.</p>';
    return;
  }

  var max = 1;
  days.forEach(function (d) {
    if (d.jogadores > max) max = d.jogadores;
  });

  // O backend agrupa por data LOCAL (YYYY-MM-DD); usa o mesmo formato aqui.
  // `toISOString()` retornaria a data em UTC e marcaria o dia errado.
  var todayKey = localDateKey(new Date());

  el.innerHTML = '<div class="chart-bars">' +
    days
      .map(function (d) {
        var h = Math.max(6, Math.round((d.jogadores / max) * 100));
        var isToday = d.dia === todayKey;
        return (
          '<div class="chart-col">' +
          '<div class="chart-val">' + d.jogadores + '</div>' +
          '<div class="chart-bar' + (isToday ? ' is-today' : '') + '" style="height:' + h + '%">' +
            '<div class="chart-tip"><b>' + d.jogadores + '</b> aluno' + (d.jogadores !== 1 ? 's' : '') +
              (d.acessos > 0 ? ' · ' + d.acessos + ' acessos' : '') +
            '</div>' +
          '</div>' +
          '<div class="chart-label">' + fmtDia(d.dia) + '</div>' +
          '</div>'
        );
      })
      .join('') +
    '</div>';
}

function fmtDataCurta(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear();
}

/* ─────────────────────── ESTATÍSTICAS DA TURMA ─────────────────────── */
function renderStats(s) {
  var el = document.getElementById('stats-strip');
  if (!el) return;

  if (!s) {
    el.innerHTML = '<p class="rank-empty">Sem dados ainda.</p>';
    return;
  }

  var itens = [
    { icone: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
      valor: s.totalAlunos, label: 'alunos cadastrados' },
    { icone: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
      valor: s.aulasConcluidas, label: 'aulas concluídas pela turma' },
    { icone: '<path d="M2 18h20"/><path d="M4 7l4 5 4-9 4 9 4-5 1 10H3l1-10z"/>',
      valor: s.concluintes, label: 'alunos que concluíram o curso' },
    { icone: '<path d="M10 20l4-16M4 8l6 2M20 8l-6 2"/><path d="M3 16h18"/><path d="M12 16v4"/>',
      valor: s.partidasQuiz, label: 'partidas de Quiz' },
    { icone: '<path d="M2 18h20"/><path d="M4 7l4 5 4-9 4 9 4-5 1 10H3l1-10z"/>',
      valor: s.vitoriasQuiz, label: 'vitórias no Quiz' },
    { icone: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2L12 3z"/>',
      valor: s.perfeitasQuiz, label: 'partidas perfeitas' },
    { icone: '<path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0012 0z"/>',
      valor: s.conquistasObtidas, label: 'conquistas obtidas' },
    { icone: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>',
      valor: s.melhorStreak, label: 'recordes de sequência' },
    { icone: '<path d="M4 14a8 8 0 0116 0"/><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1"/>',
      valor: s.melhorNota + '%', label: 'melhor nota do Quiz',
      sub: s.melhorNotaJogador ? esc(firstNome(s.melhorNotaJogador)) : '' },
  ];

  el.innerHTML = itens
    .map(function (it) {
      return (
        '<div class="stat-card">' +
        '<span class="stat-icone"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' + it.icone + '</svg></span>' +
        '<span class="stat-valor">' + esc(it.valor) + '</span>' +
        '<span class="stat-label">' + esc(it.label) + '</span>' +
        (it.sub ? '<span class="stat-sub">' + it.sub + '</span>' : '') +
        '</div>'
      );
    })
    .join('');
}

/* ─────────────────────── MELHORES NO QUIZ ─────────────────────── */
function renderQuiz(list) {
  var body = document.getElementById('quiz-body');
  if (!body) return;

  if (!list || !list.length) {
    body.innerHTML = '<tr><td colspan="7" class="rank-empty">Ninguém jogou o Quiz ainda.</td></tr>';
    return;
  }

  body.innerHTML = list
    .slice(0, 10)
    .map(function (q, i) {
      var pos = i + 1;
      var med = pos <= 3 ? medal(pos) : '<span class="rank-pos">' + pos + '</span>';
      var eu = linhaEu(q.id);
      return (
        '<tr' + eu + '>' +
        '<td>' + med + '</td>' +
        '<td class="st-name">' + avatarImg(q.nome, q.fotoUrl, 'st-avatar') + esc(firstNome(q.nome)) +
          (eu ? chipEu() : '') + titulo(pos) + '</td>' +
        '<td><strong class="quiz-stat">' + q.vitorias + '</strong>' +
          (q.perfeitas > 0 ? '<div class="sub-line">' + q.perfeitas + ' perfeitas</div>' : '') +
          (q.winStreak > 1 ? '<div class="sub-line streak-line">🔥 ' + q.winStreak + ' vitórias seguidas</div>' : '') + '</td>' +
        '<td>' + q.podios + '</td>' +
        '<td>' + q.partidas + '</td>' +
        '<td><strong class="quiz-stat">' + q.taxaVitoria + '%</strong>' +
          (q.tempoMedioResposta > 0 ? '<div class="sub-line">~' + q.tempoMedioResposta + 's/resp</div>' : '') + '</td>' +
        '<td class="quiz-nota">' + q.melhorNota + '%</td>' +
        '</tr>'
      );
    })
    .join('');
}

/* ─────────────────────── CAMPEÕES POR CATEGORIA ─────────────────────── */
function renderQuizCategorias(data) {
  var grid = document.getElementById('cat-grid');
  if (!grid) return;

  if (!data || !data.length) {
    grid.innerHTML = '<p class="rank-empty">Sem dados de categorias ainda.</p>';
    return;
  }

  grid.innerHTML = data
    .map(function (cat) {
      var items = '';
      if (!cat.top || !cat.top.length) {
        items = '<p class="rank-empty cat-empty">Ninguém jogou essa categoria ainda.</p>';
      } else {
        items = cat.top
          .map(function (q, i) {
            var pos = i + 1;
            var eu = linhaEu(q.id);
            var med = pos <= 3 ? medal(pos) : '<span class="rank-pos">' + pos + '</span>';
            return (
              '<div class="cat-item' + (eu ? ' row-eu' : '') + '">' +
              '<span class="cat-medal">' + med + '</span>' +
              avatarImg(q.nome, q.fotoUrl, 'cat-avatar') +
              '<div class="cat-info">' +
                '<strong>' + esc(firstNome(q.nome)) + (eu ? chipEu() : '') + '</strong>' +
                '<span class="cat-sub">' + q.vitorias + ' vitórias · ' + q.partidas + ' jogos · ' + q.melhorNota + '%</span>' +
              '</div>' +
              '<span class="cat-vit">' + q.taxaVitoria + '%</span>' +
              '</div>'
            );
          })
          .join('');
      }
      return (
        '<div class="cat-card">' +
        '<div class="cat-head"><span class="cat-icone">' + (cat.icone || '🎯') + '</span>' +
          '<h3>' + esc(cat.nome) + '</h3></div>' +
        '<div class="cat-body">' + items + '</div>' +
        '</div>'
      );
    })
    .join('');
}

/* ─────────────────────── PIONEIROS ─────────────────────── */
function renderPioneiros(list) {
  var el = document.getElementById('pioneer-grid');
  if (!el) return;

  if (!list || !list.length) {
    el.innerHTML = '<p class="rank-empty">Nenhum aluno cadastrado ainda.</p>';
    return;
  }

  el.innerHTML = list
    .map(function (u, i) {
      return (
        '<div class="pioneer-card">' +
        '<span class="pioneer-numero">' + (i + 1) + 'º</span>' +
        avatarImg(u.nome, u.fotoUrl, 'pioneer-avatar') +
        '<strong>' + esc(firstNome(u.nome)) + '</strong>' +
        '<span class="pioneer-desde">Desde ' + fmtDataCurta(u.criadoEm) + '</span>' +
        '</div>'
      );
    })
    .join('');
}

/* ─────────────────────── MAIORES SEQUÊNCIAS ─────────────────────── */
function renderStreak(list) {
  var el = document.getElementById('streak-list');
  if (!el) return;

  if (!list || !list.length) {
    el.innerHTML = '<p class="rank-empty">Nenhuma sequência de acesso ainda.</p>';
    return;
  }

  el.innerHTML = list
    .map(function (u, i) {
      var pos = i + 1;
      return (
        '<div class="podium-item">' +
        '<span class="podium-medal">' + medal(pos) + '</span>' +
        avatarImg(u.nome, u.fotoUrl, 'podium-avatar') +
        '<div class="podium-info">' +
          '<strong>' + esc(firstNome(u.nome)) + '</strong>' +
          '<span class="podium-sub">Recorde de sequência · ' + u.diasAtivos + ' dias ativos no total</span>' +
        '</div>' +
        '<span class="podium-time streak-time">' + u.streak + ' dias</span>' +
        '</div>'
      );
    })
    .join('');
}

/* ─────────────────────── CONQUISTAS POR ALUNO ─────────────────────── */
function renderConquistas(list) {
  var el = document.getElementById('conquistas-list');
  if (!el) return;

  if (!list || !list.length) {
    el.innerHTML = '<p class="rank-empty">Ninguém conquistou nada ainda.</p>';
    return;
  }

  var max = list[0].total || 1;
  el.innerHTML = list
    .map(function (u, i) {
      var pos = i + 1;
      var w = Math.max(8, Math.round((u.total / max) * 100));
      return (
        '<div class="podium-item">' +
        '<span class="podium-medal">' + medal(pos) + '</span>' +
        avatarImg(u.nome, u.fotoUrl, 'podium-avatar') +
        '<div class="podium-info">' +
          '<strong>' + esc(firstNome(u.nome)) + '</strong>' +
          '<div class="ach-rank-bar"><div class="ach-rank-fill" style="width:' + w + '%"></div></div>' +
        '</div>' +
        '<span class="podium-time">' + u.total + '</span>' +
        '</div>'
      );
    })
    .join('');
}

/* ────────────────────────── LOAD ────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  if (!isAuthenticated()) return;

  var promises = [
    apiFetch('/ranking/stats').then(renderStats).catch(function () {}),
    apiFetch('/ranking/online').then(renderOnline).catch(function () {}),
    apiFetch('/ranking/students').then(renderStudents).catch(function () {}),
    apiFetch('/ranking/fastest').then(renderFastest).catch(function () {}),
    apiFetch('/ranking/quiz').then(renderQuiz).catch(function () {}),
    apiFetch('/ranking/quiz/categorias').then(renderQuizCategorias).catch(function () {}),
    apiFetch('/ranking/pioneiros').then(renderPioneiros).catch(function () {}),
    apiFetch('/ranking/streak').then(renderStreak).catch(function () {}),
    apiFetch('/ranking/conquistas').then(renderConquistas).catch(function () {}),
    apiFetch('/ranking/days').then(renderDays).catch(function () {}),
  ];

  Promise.all(promises).catch(function (err) {
    console.error('Erro ao carregar ranking:', err);
  });

  setInterval(function () {
    apiFetch('/ranking/online').then(renderOnline).catch(function () {});
  }, 30000);
});
