/* ── Termos de uso ── */

// Abre o link numa aba nova SEM marcar/desmarcar o checkbox
function abrirLink(link, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  window.open(link.href, '_blank', 'noopener');
}

document.addEventListener('DOMContentLoaded', function () {
  var termos = document.getElementById('termos');
  if (!termos) return;
  termos.addEventListener('change', function () {
    var group = termos.closest('.checkbox-group');
    if (termos.checked) {
      if (group) group.classList.add('accepted');
      var err = termos.parentElement.querySelector('.field-error');
      if (err) err.remove();
    } else if (group) {
      group.classList.remove('accepted');
    }
  });
});

async function cadastrar() {
  clearFieldErrors();

  var nome = document.getElementById('nome');
  var email = document.getElementById('email');
  var nova = document.getElementById('pw-nova');
  var confirm = document.getElementById('pw-confirm');
  var termos = document.getElementById('termos');
  var telefone = document.getElementById('telefone');
  var btn = document.querySelector('.btn-login');
  var box = document.getElementById('success-box');

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var hasError = false;
  if (!nome.value.trim()) { showFieldError('nome', 'Digite seu nome'); hasError = true; }
  else if (nome.value.trim().length < 2) { showFieldError('nome', 'Digite seu nome completo'); hasError = true; }
  if (!email.value.trim() || !emailRegex.test(email.value.trim())) { showFieldError('email', 'Digite um email válido'); hasError = true; }
  if (nova.value.length < 4) { showFieldError('pw-nova', 'A senha deve ter pelo menos 4 caracteres'); hasError = true; }
  if (nova.value !== confirm.value) { showFieldError('pw-confirm', 'As senhas não coincidem'); hasError = true; }
  if (!termos.checked) { showFieldError('termos', 'Você precisa aceitar os termos'); hasError = true; }
  if (hasError) return;

  var body = {
    name: nome.value.trim(),
    email: email.value.trim(),
    password: nova.value,
  };
  if (telefone.value.trim()) body.phone = telefone.value.trim();

  btnCarregando(btn, 'Criando sua conta...');

  try {
    var data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    saveCurrentUser(data.user);
    if (box) {
      box.textContent = 'Conta criada com sucesso!';
      box.classList.add('show');
    }
    setTimeout(function () {
      window.location.href = '/index.html';
    }, 1200);
  } catch (err) {
    showFieldError('email', mensagemAmigavel(err.message) || 'Não foi possível criar sua conta. Tente novamente.');
    btnPronto(btn, 'Criar minha conta');
  }
}
