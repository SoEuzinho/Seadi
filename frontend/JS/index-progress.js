if (isAuthenticated()) {
    apiFetch('/progress/status').then(function (status) {
        var concluidas = {};
        var i;
        for (i = 0; i < status.concluidas.length; i++) concluidas[status.concluidas[i]] = true;

        for (var m = 0; m < MODULOS.length; m++) {
            var mod = MODULOS[m];
            var card = document.getElementById('mod-card-' + mod.ordem);
            if (!card) continue;

            var textEl = card.querySelector('.mod-progress-text');
            var desbloqueado = isModuloDesbloqueado(mod.ordem, concluidas);

            if (!desbloqueado) {
                card.classList.add('locked');
                card.removeAttribute('href');
                if (textEl) textEl.textContent = 'Complete o modulo anterior';
            } else {
                var concluidasMod = 0;
                for (i = 0; i < mod.aulas.length; i++) {
                    if (concluidas[mod.aulas[i].id]) concluidasMod++;
                }
                var pct = mod.aulas.length > 0 ? Math.round((concluidasMod / mod.aulas.length) * 100) : 0;
                if (textEl) textEl.textContent = pct + '% concluido';
                if (pct >= 100) card.classList.add('done');
            }
        }
    }).catch(function () {});
}
