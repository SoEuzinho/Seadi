var API_BASE = '/api';

// ── Sessão ──
// O token JWT agora vive em um cookie httpOnly (seadi_session), gerenciado
// pelo servidor. O JS guarda apenas dados de exibição (nome/email/id) no
// localStorage para montar a interface; a autenticação em si é o cookie.

function saveCurrentUser(user) {
  if (!user) return;
  if (user.id !== undefined && user.id !== null) {
    localStorage.setItem('auth_user_id', String(user.id));
  }
  if (user.email !== undefined && user.email !== null) {
    localStorage.setItem('auth_user_email', String(user.email));
  }
  if (user.nome !== undefined && user.nome !== null) {
    localStorage.setItem('nomeUsuario', String(user.nome));
  }
}

function getCurrentUserId() {
  var raw = localStorage.getItem('auth_user_id');
  return raw ? String(raw) : '';
}

// Indica se existe sessão marcada. Como o cookie httpOnly não é legível
// via JS, a verificação usa o marcador local; se o cookie expirar ou for
// revogado, as chamadas de API devolvem 401 e o authFetch redireciona.
function isAuthenticated() {
  return !!localStorage.getItem('auth_user_id');
}

function logout() {
  // Invalida a sessão no servidor (tokenVersion++) e apaga o cookie httpOnly
  // (enviado automaticamente). Fire-and-forget: falhas de rede não devem
  // impedir o logout local.
  fetch(API_BASE + '/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(function () { /* offline: ignora */ });
  localStorage.removeItem('perfil_cache');
  localStorage.removeItem('nomeUsuario');
  localStorage.removeItem('auth_user_id');
  localStorage.removeItem('auth_user_email');
  window.location.href = '/login.html';
}

async function authFetch(endpoint, options) {
  options = options || {};
  var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});

  var response = await fetch(API_BASE + endpoint, Object.assign({}, options, { headers: headers }));

  // 401 em rotas de autenticação (login/cadastro/recuperação) significa
  // "dados errados" — deve mostrar o erro no formulário, NÃO derrubar a
  // sessão nem recarregar a página.
  var isAuthEndpoint = endpoint.indexOf('/auth/') === 0;
  if (response.status === 401 && isAuthenticated() && !isAuthEndpoint) {
    logout();
    throw new Error('Sessão expirada');
  }

  return response;
}

async function apiFetch(endpoint, options) {
  var response = await authFetch(endpoint, options);
  var data;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok) throw new Error((data && data.message) || 'Erro na requisição');
  return data;
}

async function uploadFile(endpoint, file) {
  var formData = new FormData();
  formData.append('photo', file);

  var response = await fetch(API_BASE + endpoint, {
    method: 'POST',
    body: formData,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Sessão expirada');
  }

  var data;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok) throw new Error((data && data.message) || 'Erro no upload');
  return data;
}

// ── Heartbeat: mantém o usuário marcado como "online agora" ──
// Enviado a cada 60s enquanto houver aba/página autenticada aberta.
// Silencioso: falhas (rede/offline) são ignoradas e não derrubam a sessão.
var _heartbeatStarted = false;

async function sendHeartbeat() {
  if (!isAuthenticated()) return;
  try {
    await fetch(API_BASE + '/ranking/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (_) { /* offline: ignora */ }
}

function startHeartbeat(intervalSeconds) {
  if (_heartbeatStarted) return;
  _heartbeatStarted = true;
  var secs = intervalSeconds || 60;
  sendHeartbeat();
  setInterval(sendHeartbeat, secs * 1000);
}

startHeartbeat();

// ── Conquista "Explorador da Conta": registra visita às páginas /minha-conta ──
// Enviado no carregamento das páginas da área Minha Conta, com throttling de
// 10 minutos por página (evita spam de registros).
function trackContaVisit() {
  if (!isAuthenticated()) return;
  if (!/\/minha-conta\//.test(window.location.pathname)) return;

  var path = (window.location.pathname.split('/').pop() || '').replace('.html', '') || 'conta';
  var chave = 'last_visit_' + path;
  var last = parseInt(localStorage.getItem(chave) || '0', 10);
  var agora = Date.now();
  if (agora - last < 10 * 60 * 1000) return;
  localStorage.setItem(chave, String(agora));

  fetch(API_BASE + '/achievements/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ area: path }),
  }).catch(function (_) { /* offline: ignora */ });
}

document.addEventListener('DOMContentLoaded', trackContaVisit);
