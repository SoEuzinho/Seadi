document.addEventListener('DOMContentLoaded', function () {

  function resetSenha() {
    ['pw-atual', 'pw-nova', 'pw-confirm'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.pw-rule').forEach(function (r) { r.classList.remove('ok'); });
    var bar = document.getElementById('pw-strength');
    if (bar) bar.style.display = 'none';
    var hint = document.getElementById('confirm-hint');
    if (hint) hint.textContent = '';
    showToast('Alterações descartadas.');
  }

  window.resetSenha = resetSenha;

  window.salvarSenha = async function () {
    clearFieldErrors();

    var atual = document.getElementById('pw-atual');
    var nova = document.getElementById('pw-nova');
    var confirm = document.getElementById('pw-confirm');
    var btn = document.querySelector('.btn-primary');

    var hasError = false;
    if (!atual || !atual.value) { showFieldError('pw-atual', 'Digite sua senha atual'); hasError = true; }
    if (!nova || !senhaValida(nova.value)) { showFieldError('pw-nova', 'A nova senha deve ter pelo menos 8 caracteres, com letras e números'); hasError = true; }
    if (!confirm || nova.value !== confirm.value) { showFieldError('pw-confirm', 'As senhas não coincidem'); hasError = true; }
    if (hasError) return;

    if (btn) btn.disabled = true;
    if (btn) btn.textContent = 'Salvando...';

    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: atual.value, newPassword: nova.value }),
      });
      showToast('Senha alterada com sucesso!');
      resetSenha();
    } catch (err) {
      showFieldError('pw-atual', err.message);
    } finally {
      if (btn) btn.disabled = false;
      if (btn) btn.textContent = 'Salvar nova senha';
    }
  };
});
