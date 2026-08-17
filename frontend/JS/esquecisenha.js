var abaAtual = 'email';

function trocarAba(aba) {
  abaAtual = aba;
  document.querySelectorAll('.tab').forEach(function (t, i) {
    t.classList.toggle('active', (i === 0 && aba === 'email') || (i === 1 && aba === 'telefone'));
  });
  document.getElementById('panel-email').classList.toggle('active', aba === 'email');
  document.getElementById('panel-telefone').classList.toggle('active', aba === 'telefone');
  document.getElementById('success-box').classList.remove('show');
  clearFieldErrors();
}

async function enviar(tipo) {
  clearFieldErrors();
  var box = document.getElementById('success-box');

  if (tipo === 'email') {
    var emailEl = document.getElementById('email');
    if (!emailEl.value.trim() || !emailEl.value.includes('@')) {
      showFieldError('email', 'Digite um e-mail válido');
      return;
    }

    var btn = document.querySelector('#panel-email .btn-login');
    btnCarregando(btn, 'Enviando...');

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: emailEl.value.trim() }),
      });
      box.textContent = 'Email enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.';
      box.classList.add('show');
      btnPronto(btn, 'Enviar link por email');
    } catch (err) {
      showFieldError('email', mensagemAmigavel(err.message) || 'Não foi possível enviar. Tente novamente.');
      btnPronto(btn, 'Enviar link por email');
    }
  } else {
    showFieldError('telefone', 'Recuperação por SMS ainda não disponível');
  }
}
