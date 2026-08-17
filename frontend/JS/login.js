document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearFieldErrors();

    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var btn = form.querySelector('button[type="submit"]');

    if (!email.value.trim()) { showFieldError('email', 'Digite seu email'); return; }
    if (!password.value) { showFieldError('password', 'Digite sua senha'); return; }

    btnCarregando(btn, 'Entrando...');

    try {
      var data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.value.trim(), password: password.value }),
      });
      saveCurrentUser(data.user);
      window.location.href = '/index.html';
    } catch (err) {
      showFieldError('password', mensagemAmigavel(err.message) || 'Confira seu email e sua senha.');
    } finally {
      btnPronto(btn, 'Entrar');
    }
  });
});
