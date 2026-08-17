/* ──────────────────────────────────────────────
   shared.js — Funções utilitárias compartilhadas
   ────────────────────────────────────────────── */

// ── Sidebar mobile ──
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

// ── Máscara de telefone ──
function mascaraTel(input) {
  var v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/, '($1) $2');
  v = v.replace(/(\d{5})(\d)/, '$1-$2');
  input.value = v;
}

// ── Máscara de data DD/MM/AAAA ──
function mascaraData(input) {
  var v = input.value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  var out = v.slice(0, 2);
  if (v.length > 2) out += '/' + v.slice(2, 4);
  if (v.length > 4) out += '/' + v.slice(4, 8);
  input.value = out;
}

// Valida uma data no formato DD/MM/AAAA (calendário real)
function validaData(ddmmAaaa) {
  var m = (ddmmAaaa || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  var d = parseInt(m[1], 10);
  var mes = parseInt(m[2], 10);
  var ano = parseInt(m[3], 10);
  if (mes < 1 || mes > 12) return false;
  if (ano < 1900 || ano > new Date().getFullYear()) return false;
  var date = new Date(ano, mes - 1, d);
  return date.getFullYear() === ano && date.getMonth() === mes - 1 && date.getDate() === d;
}

// Converte DD/MM/AAAA para o formato ISO YYYY-MM-DD (enviado ao backend)
function dataParaISO(ddmmAaaa) {
  if (!ddmmAaaa) return null;
  var m = String(ddmmAaaa).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return m[3] + '-' + m[2] + '-' + m[1];
}

// Converte ISO YYYY-MM-DD... para o formato brasileiro DD/MM/AAAA (exibição)
function dataParaBR(iso) {
  if (!iso) return '';
  var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return m[3] + '/' + m[2] + '/' + m[1];
}

// ── Toast ──
var _toastTimeout;
function showToast(msg) {
  var t = document.getElementById('toast');
  var m = document.getElementById('toast-msg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(function () { t.classList.remove('show'); }, 3000);
}

// ── Password strength checker ──
function checkPw() {
  var el = document.getElementById('pw-nova');
  if (!el) return;
  var val = el.value;
  var ok = val.length >= 4;

  var rule = document.getElementById('rule-len');
  if (rule) rule.classList.toggle('ok', ok);

  var bar = document.getElementById('pw-strength');
  if (bar) bar.style.display = val.length > 0 ? 'block' : 'none';

  ['seg1', 'seg2', 'seg3', 'seg4'].forEach(function (id) {
    var seg = document.getElementById(id);
    if (seg) seg.style.background = ok ? '#10B981' : 'var(--border)';
  });

  var lbl = document.getElementById('pw-strength-label');
  if (lbl) lbl.textContent = val.length > 0 ? 'Força: ' + (ok ? 'Adequada' : 'Curta') : 'Força: —';

  checkConfirm();
}

// ── Confirm password match ──
function checkConfirm() {
  var nova = document.getElementById('pw-nova');
  var conf = document.getElementById('pw-confirm');
  var hint = document.getElementById('confirm-hint');
  if (!nova || !conf || !hint) return;

  if (!conf.value) { hint.textContent = ''; return; }

  if (nova.value === conf.value) {
    hint.textContent = '✓ As senhas coincidem';
    hint.style.color = '#10B981';
  } else {
    hint.textContent = '✗ As senhas não coincidem';
    hint.style.color = '#EF4444';
  }
}

// ── Ícones de senha ──
// Ícones SVG INLINE com stroke="currentColor": a cor acompanha o tema e o
// hover/foco do botão (antes eram <img> fixos e o hover não mudava a cor).
var ICONS = {
  eye: {
    label: 'Mostrar senha',
    paths:
      '<path d="M2 12S7 4 12 4s10 8 10 8-5 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/>',
  },
  eyeOff: {
    label: 'Ocultar senha',
    paths:
      '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>' +
      '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>' +
      '<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>' +
      '<line x1="2" x2="22" y1="2" y2="22"/>',
  },
};

// Gera o <svg> inline do ícone (sem alt/title para não duplicar anúncio no
// leitor de tela — o rótulo já está no aria-label do botão).
function iconImg(name, cls) {
  var icon = ICONS[name];
  if (!icon) return '';
  return (
    '<svg class="pw-icon' + (cls ? ' ' + cls : '') + '" fill="none" stroke="currentColor"' +
    ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"' +
    ' aria-hidden="true">' + icon.paths + '</svg>'
  );
}

// Aplica o estado visual do botão (ícone + rótulos + aria-pressed).
// Ícone indica o ESTADO atual do campo:
//   - senha oculta (visible=false) -> olho com traço (eyeOff)
//   - senha visível (visible=true)  -> olho aberto (eye)
function applyPwState(input, visible) {
  var parent = input.parentElement;
  var btn = parent ? parent.querySelector('.pw-toggle') : null;
  if (!btn) return;
  var icon = visible ? 'eye' : 'eyeOff';
  var label = visible ? 'Ocultar senha' : 'Mostrar senha';
  btn.innerHTML = iconImg(icon);
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
  btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
}

// Esconde a senha automaticamente após alguns segundos visível (segurança).
// O cronômetro é por campo e reinicia a cada novo toque no olho.
function scheduleAutoHide(input) {
  clearTimeout(input._pwHideTimer);
  input._pwHideTimer = setTimeout(function () {
    if (input.type === 'text') {
      input.type = 'password';
      applyPwState(input, false);
    }
  }, 8000);
}

// ── Show / hide password toggle ──
function togglePw(inputId) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var wasHidden = input.type === 'password';
  input.type = wasHidden ? 'text' : 'password';
  applyPwState(input, input.type === 'text');
  if (wasHidden) scheduleAutoHide(input);
  else clearTimeout(input._pwHideTimer);
  input.focus();
}

// ── Inline error display ──
function showFieldError(fieldId, msg) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  var existing = el.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
  if (!msg) return;
  var span = document.createElement('span');
  span.className = 'field-error';
  span.style.cssText = 'color:#EF4444;font-size:0.8rem;margin-top:4px;display:block;';
  span.textContent = msg;
  el.parentElement.appendChild(span);
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(function (e) { e.remove(); });
}

// ──────────────────────────────────────────────
// Avatar unificado: foto do perfil ou inicial do nome.
// Usado em todo o sistema (header, ranking, quiz, conquistas).
// Se o usuário não tiver foto, exibe apenas a inicial do nome.
// ──────────────────────────────────────────────

var AVATAR_COLOR_A = '#0ea5e9';
var AVATAR_COLOR_B = '#8b5cf6';

// Primeira letra do nome (ou "U" genérico)
function inicialDe(nome) {
  var s = String(nome == null ? '' : nome).trim();
  if (!s) return 'U';
  return s.charAt(0).toUpperCase();
}

// Data-URI SVG do avatar padrão: inicial sobre o fundo temático do site
// (degradê da marca, grade de pontos, brilho e traços de circuito).
function avatarPlaceholder(letra) {
  var l = encodeURIComponent((letra || 'U').charAt(0).toUpperCase());
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
    '<defs>' +
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + AVATAR_COLOR_A + '"/>' +
    '<stop offset="0.55" stop-color="#6366F1"/>' +
    '<stop offset="1" stop-color="' + AVATAR_COLOR_B + '"/>' +
    '</linearGradient>' +
    '<radialGradient id="r" cx="0.5" cy="0.35" r="0.9">' +
    '<stop offset="0" stop-color="#ffffff" stop-opacity="0.4"/>' +
    '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<pattern id="d" width="10" height="10" patternUnits="userSpaceOnUse">' +
    '<circle cx="1.6" cy="1.6" r="1" fill="#ffffff" opacity="0.13"/>' +
    '</pattern>' +
    '</defs>' +
    '<rect width="120" height="120" fill="#0B1220"/>' +
    '<rect width="120" height="120" fill="url(#g)" opacity="0.92"/>' +
    '<rect width="120" height="120" fill="url(#d)"/>' +
    '<path d="M-14 116 L118 4" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.4"/>' +
    '<path d="M-14 106 L118 -6" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1.4"/>' +
    '<circle cx="60" cy="60" r="38" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5"/>' +
    '<rect width="120" height="120" fill="url(#r)"/>' +
    '<text x="60" y="62" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="700" ' +
    'fill="#ffffff" text-anchor="middle" dominant-baseline="central">' + l + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

// Retorna o src do avatar: a foto do usuário ou o placeholder com a inicial
function avatarSrc(nome, fotoUrl) {
  if (fotoUrl) return fotoUrl;
  return avatarPlaceholder(inicialDe(nome));
}

// Gera o <img> de um avatar (usado em listas renderizadas por JS)
function avatarImg(nome, fotoUrl, cls) {
  var letra = inicialDe(nome);
  var src = avatarSrc(nome, fotoUrl);
  var placeholder = avatarPlaceholder(letra);
  return '<img class="av' + (cls ? ' ' + cls : '') + '" src="' + src + '" alt="' + letra + '"' +
    ' title="' + escHtml(nome || '') + '" loading="lazy"' +
    ' onerror="this.onerror=null;this.src=\'' + placeholder + '\';">';
}

// Aplica o avatar a um <img> existente pelo id (header, foto grande do perfil)
function aplicarAvatar(id, nome, fotoUrl) {
  var el = document.getElementById(id);
  if (!el) return;
  var placeholder = avatarPlaceholder(inicialDe(nome));
  el.alt = inicialDe(nome);
  el.onerror = function () { el.onerror = null; el.src = placeholder; };
  el.src = avatarSrc(nome, fotoUrl);
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mantém o perfil do usuário em cache (nome + foto) para o avatar ficar
// igual e sincronizado em todas as páginas do site, mesmo antes da API
// responder. Aceita atualizações parciais: cachePerfil({ fotoUrl }) etc.
function cachePerfil(patch) {
  try {
    var atual = {};
    var salvo = localStorage.getItem('perfil_cache');
    if (salvo) atual = JSON.parse(salvo);
    if (patch && patch.nome !== undefined) atual.nome = patch.nome;
    if (patch && patch.fotoUrl !== undefined) atual.fotoUrl = patch.fotoUrl;
    localStorage.setItem('perfil_cache', JSON.stringify(atual));
  } catch (_) {}
}

// ──────────────────────────────────────────────
// Mensagens de erro amigáveis (público leigo)
// ──────────────────────────────────────────────

// Converte mensagens técnicas do backend em frases simples em português.
// Devolve null quando a mensagem não é reconhecida (aí quem chama usa um
// texto genérico amigável). Só afeta a EXIBIÇÃO — nada de lógica é alterado.
function mensagemAmigavel(msg) {
  var m = String(msg == null ? '' : msg).toLowerCase();

  if (m.indexOf('invalid credentials') !== -1 ||
      m.indexOf('email or password') !== -1 ||
      m.indexOf('wrong password') !== -1) {
    return 'Confira seu email e sua senha.';
  }
  if (m.indexOf('already registered') !== -1 ||
      m.indexOf('email already') !== -1) {
    return 'Esse email já está cadastrado.';
  }
  if (m.indexOf('user not found') !== -1 ||
      m.indexOf('email not') !== -1) {
    return 'Esse email ainda não está cadastrado.';
  }
  if (m.indexOf('too many attempts') !== -1) {
    return 'Você tentou entrar muitas vezes. Espere um pouco e tente novamente.';
  }
  if (m.indexOf('recovery code') !== -1) {
    return 'Esse código não é válido ou expirou.';
  }
  if (m.indexOf('please wait') !== -1) {
    return 'Aguarde um momento antes de pedir um novo código.';
  }
  if (m.indexOf('network') !== -1 || m.indexOf('failed to fetch') !== -1) {
    return 'Sem conexão com a internet. Tente novamente.';
  }
  return null;
}

// ──────────────────────────────────────────────
// Estado de "carregando" nos botões (spinner + texto)
// ──────────────────────────────────────────────

// Muda o botão para o estado de processamento. Só altera a APARÊNCIA:
// desabilita o clique (evita envio duplo) e mostra o spinner + o texto.
function btnCarregando(btn, texto) {
  if (!btn) return;
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>' + texto + '</span>';
}

// Restaura o botão para o estado normal.
function btnPronto(btn, texto) {
  if (!btn) return;
  btn.disabled = false;
  btn.removeAttribute('aria-busy');
  btn.innerHTML = '<span>' + texto + '</span>';
}
