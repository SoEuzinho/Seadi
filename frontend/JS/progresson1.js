function resetProgress() {
    if (!confirm('Tem certeza que deseja resetar todo o seu progresso?')) return;
    apiFetch('/progress/reset', { method: 'POST' }).then(function () {
        showToast('Progresso resetado!');
        setTimeout(function () { location.reload(); }, 1000);
    }).catch(function (err) {
        showToast('Erro: ' + err.message);
    });
}

function setActive(el) {
    document.querySelectorAll(".nav-link").forEach(function (l) { l.classList.remove("active"); });
    el.classList.add("active");
    document.querySelector(".header-title").textContent = el.textContent.trim();
}

document.addEventListener('DOMContentLoaded', async function () {
    if (!isAuthenticated()) { window.location.href = '../login.html'; return; }

    try {
        var profile = await apiFetch('/auth/profile');
        var nome = profile.nome || 'Usuario';
        var primeiroNome = nome.split(' ')[0];
        document.querySelector('.page-header h1').textContent = 'Ola, ' + primeiroNome + ' 👋';
    } catch (e) {
        document.querySelector('.page-header h1').textContent = 'Ola, Usuario 👋';
    }

    try {
        var stats = await apiFetch('/progress/statistics');
        document.getElementById('stat-progresso').textContent = (stats.progressoGeral || 0) + '%';
        document.getElementById('stat-dias').textContent = stats.diasSeguidos || 0;
        var aulasSub = document.getElementById('stat-aulas-sub');
        if (aulasSub) aulasSub.innerHTML = '<span>' + (stats.aulasConcluidas || 0) + '</span> de <span>' + (stats.totalAulas || 0) + '</span> aulas';
        var diasSub = document.getElementById('stat-dias-sub');
        if (diasSub) diasSub.innerHTML = 'Melhor: <span>' + (stats.melhorSequencia || 0) + ' dias</span>';
    } catch (e) {
        console.error('Failed to load statistics:', e);
    }

    try {
        var status = await apiFetch('/progress/status');
        var concluidas = {};
        var emAndamento = {};
        var i;
        for (i = 0; i < status.concluidas.length; i++) concluidas[status.concluidas[i]] = true;
        for (var k in status.emAndamento) emAndamento[k] = status.emAndamento[k];

        var container = document.getElementById('modules-container');
        if (!container) return;
        container.innerHTML = '';

        for (var m = 0; m < MODULOS.length; m++) {
            var mod = MODULOS[m];
            var concluidasMod = 0;
            for (i = 0; i < mod.aulas.length; i++) {
                if (concluidas[mod.aulas[i].id]) concluidasMod++;
            }
            var pct = mod.aulas.length > 0 ? Math.round((concluidasMod / mod.aulas.length) * 100) : 0;
            var barColor = pct >= 100 ? '#10B981' : pct > 0 ? '#6366F1' : 'rgba(255,255,255,0.1)';

            var lessonsHtml = '';
            for (i = 0; i < mod.aulas.length; i++) {
                var aula = mod.aulas[i];
                var bloqueada = !isAulaDesbloqueada(aula.id, concluidas);
                var link = bloqueada ? '#' : '../' + mod.prefixo + aula.arquivo;
                var concluida = !!concluidas[aula.id];
                var pctText = concluida ? 'Concluido' : (emAndamento[aula.id] ? emAndamento[aula.id] + '%' : '');
                var statusClass = concluida ? ' concluido' : ' em-andamento';
                lessonsHtml += '<div class="lesson-item' + (bloqueada ? ' bloqueada' : '') + '">' +
                    '<a href="' + link + '" class="lesson-link">' + aula.titulo + '</a>' +
                    (pctText ? '<span class="lesson-status' + (concluida ? ' concluido' : '') + '">' + pctText + '</span>' : '') +
                    '</div>';
            }

            var moduleHtml = '<div class="card">' +
                '<div class="module-header">' +
                '<div class="module-title">' + mod.titulo + '</div>' +
                '<div class="module-count">' + concluidasMod + '/' + mod.aulas.length + ' aulas</div>' +
                '</div>' +
                '<div class="progress-bar" style="margin-bottom:16px;"><div class="progress-fill" style="width:' + pct + '%;background:' + barColor + ';"></div></div>' +
                '<div class="lessons-list">' + lessonsHtml + '</div>' +
                '</div>';

            container.innerHTML += moduleHtml;
        }
    } catch (err) {
        console.error('Failed to load modules:', err);
        container.innerHTML = '<p class="lesson-status" style="color:#EF4444;text-align:center;">Erro ao carregar modulos. Verifique sua conexao e tente novamente.</p>';
    }
});
