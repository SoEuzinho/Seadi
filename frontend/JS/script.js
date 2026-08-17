document.addEventListener('DOMContentLoaded', function () {
    // Auth Guard
    var publicPages = ['login.html', 'criarconta.html', 'esqueci-senha.html'];
    var currentPath = window.location.pathname;
    var isPublic = publicPages.some(function (p) { return currentPath.endsWith(p) || currentPath.endsWith(p + '/'); });
    if (!isPublic) {
        if (!isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }
    }

    var elementos = {
        menu: document.getElementById("idMenuPerfil"),
        btnTrigger: document.getElementById("btn-menu-perfil"),
        nomeCurto: document.getElementById('display-nome-curto'),
        nomeCompleto: document.getElementById('user-full-name'),
        email: document.getElementById('user-email-address'),
        avatarPequeno: document.getElementById('avatar-pequeno'),
        avatarGrande: document.getElementById('avatar-grande'),
        inputFoto: document.getElementById('input-file')
    };

    // Menu toggle
    if (elementos.btnTrigger && elementos.menu) {
        elementos.btnTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            elementos.menu.classList.toggle('open');
        });
    }

    window.addEventListener('click', function (e) {
        if (elementos.menu && !e.target.closest('.perfil-wrapper')) {
            elementos.menu.classList.remove('open');
        }
    });

    // Photo change - preview only, actual upload handled in cadastro.js
    if (elementos.inputFoto) {
        elementos.inputFoto.addEventListener('change', function (e) {
            var arquivo = e.target.files[0];
            if (!arquivo) return;
            var reader = new FileReader();
            reader.onload = function (event) {
                if (elementos.avatarPequeno) elementos.avatarPequeno.src = event.target.result;
                if (elementos.avatarGrande) elementos.avatarGrande.src = event.target.result;
            };
            reader.readAsDataURL(arquivo);
        });
    }

    // Avatar instantâneo antes da API responder (mantém tudo sincronizado)
    var nomeCache = localStorage.getItem('nomeUsuario');
    if (nomeCache && elementos.nomeCurto) elementos.nomeCurto.textContent = nomeCache.split(' ')[0];
    var perfilCache = null;
    try { perfilCache = JSON.parse(localStorage.getItem('perfil_cache') || 'null'); } catch (_) {}
    if (perfilCache) {
        aplicarAvatar('avatar-pequeno', perfilCache.nome || nomeCache || 'Usuário', perfilCache.fotoUrl || null);
        aplicarAvatar('avatar-grande', perfilCache.nome || nomeCache || 'Usuário', perfilCache.fotoUrl || null);
    } else {
        aplicarAvatar('avatar-pequeno', nomeCache || 'Usuário', null);
        aplicarAvatar('avatar-grande', nomeCache || 'Usuário', null);
    }

    // Load user profile from API
    if (isAuthenticated()) {
        apiFetch('/auth/profile').then(function (user) {
            var firstName = user.nome ? user.nome.split(' ')[0] : 'Usuário';
            if (elementos.nomeCurto) elementos.nomeCurto.textContent = firstName;
            if (elementos.nomeCompleto) elementos.nomeCompleto.textContent = user.nome || '';
            if (elementos.email) elementos.email.textContent = user.email || '';
            // Avatar unificado: foto do perfil ou a inicial do nome
            saveCurrentUser(user);
            aplicarAvatar('avatar-pequeno', user.nome, user.fotoUrl);
            aplicarAvatar('avatar-grande', user.nome, user.fotoUrl);
            cachePerfil({ nome: user.nome || '', fotoUrl: user.fotoUrl || null });
        }).catch(function () {
            if (elementos.nomeCurto) elementos.nomeCurto.textContent = 'Usuário';
            aplicarAvatar('avatar-pequeno', 'Usuário', null);
        });
    }
});
