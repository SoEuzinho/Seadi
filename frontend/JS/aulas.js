var MODULOS = [
  {
    id: 1,
    ordem: 1,
    titulo: 'Iniciante',
    descricao: 'Primeiros passos no computador',
    icone: 'inici.webp',
    prefixo: 'pasta-modulos/1-modulo_iniciante/',
    aulas: [
      { id: 1, ordem: 1, titulo: 'Como Ligar e Desligar', arquivo: '1-como-ligar-e-desligar.html' },
      { id: 2, ordem: 2, titulo: 'Como usar um Mouse', arquivo: '2-como-usar-um-mouse.html' },
      { id: 3, ordem: 3, titulo: 'Como usar o Teclado', arquivo: '3-como-usar-um-teclado.html' },
      { id: 4, ordem: 4, titulo: 'Conhecendo o Windows', arquivo: '4-conhecendo-o-windows.html' },
      { id: 5, ordem: 5, titulo: 'Área de trabalho', arquivo: '5-Área-de-trabalho.html' },
      { id: 6, ordem: 6, titulo: 'Abrindo programas', arquivo: '6-abrindo-programas.html' },
      { id: 7, ordem: 7, titulo: 'Internet básica', arquivo: '7-internet-basica.html' },
      { id: 8, ordem: 8, titulo: 'Wi-Fi e conexão', arquivo: '8-wi-fi-e-conexão.html' },
      { id: 9, ordem: 9, titulo: 'Usando Janelas', arquivo: '9-usando-janelas.html' }
    ]
  },
  {
    id: 2,
    ordem: 2,
    titulo: 'Básico',
    descricao: 'Fundamentos para o dia a dia',
    icone: 'avanç.webp',
    prefixo: 'pasta-modulos/2-modulo_basico/',
    aulas: [
      { id: 10, ordem: 1, titulo: 'Google e Navegação', arquivo: '1-google-e-navegação.html' },
      { id: 11, ordem: 2, titulo: 'Como Pesquisar', arquivo: '2-como-pesquisar.html' },
      { id: 12, ordem: 3, titulo: 'Digitando Texto', arquivo: '3-digitando-texto.html' },
      { id: 13, ordem: 4, titulo: 'Usando Pontos e Acentuações', arquivo: '4-usando-pontos-e-acentuações.html' },
      { id: 14, ordem: 5, titulo: 'Criando e Organizando Arquivos', arquivo: '5-criando-e-organizando-arquivos.html' },
      { id: 15, ordem: 6, titulo: 'Noções Básicas de Arquivos', arquivo: '6-noções-básicas-de-arquivos.html' },
      { id: 16, ordem: 7, titulo: 'Baixando Arquivos', arquivo: '7-baixando-arquivos.html' },
      { id: 17, ordem: 8, titulo: 'Criando e-mail', arquivo: '8-criando-e-mail.html' },
      { id: 18, ordem: 9, titulo: 'Comunicação online', arquivo: '9-comunicação-online.html' },
      { id: 19, ordem: 10, titulo: 'Aplicativos Úteis', arquivo: '10-aplicativos-Úteis.html' },
      { id: 20, ordem: 11, titulo: 'Acessibilidade rápida', arquivo: '11-acessibilidade-rápida.html' }
    ]
  },
  {
    id: 3,
    ordem: 3,
    titulo: 'Avançado',
    descricao: 'Conceitos avançados e produtividade',
    icone: 'intermed.webp',
    prefixo: 'pasta-modulos/3-modulo_avançado/',
    aulas: [
      { id: 21, ordem: 1, titulo: 'Organização digital', arquivo: '1-organização-digital.html' },
      { id: 22, ordem: 2, titulo: 'Atualizações e cuidados', arquivo: '2-atualizações-e-cuidados.html' },
      { id: 23, ordem: 3, titulo: 'Segurança básica', arquivo: '3-segurança-básica.html' },
      { id: 24, ordem: 4, titulo: 'Teclas de atalho (Parte 1)', arquivo: '4-teclas-de-atalho-(parte-1).html' },
      { id: 25, ordem: 5, titulo: 'Teclas de atalho (Parte 2)', arquivo: '5-teclas-de-atalho-(parte-2).html' },
      { id: 26, ordem: 6, titulo: 'Teclas de atalho (Parte 3)', arquivo: '6-teclas-de-atalho-(parte-3).html' },
      { id: 27, ordem: 7, titulo: 'Teclas de atalho (Parte 4)', arquivo: '7-teclas-de-atalho-(parte-4).html' },
      { id: 28, ordem: 8, titulo: 'Usando pen drive', arquivo: '8-usando-pen-drive.html' },
      { id: 29, ordem: 9, titulo: 'Problemas simples e soluções rápidas', arquivo: '9-problemas-simples-e-soluções-rápidas.html' }
    ]
  }
];

function getModuloPorOrdem(ordem) {
  for (var i = 0; i < MODULOS.length; i++) {
    if (MODULOS[i].ordem === ordem) return MODULOS[i];
  }
  return null;
}

function getAulaPorId(id) {
  for (var i = 0; i < MODULOS.length; i++) {
    var mod = MODULOS[i];
    for (var j = 0; j < mod.aulas.length; j++) {
      if (mod.aulas[j].id === id) return { modulo: mod, aula: mod.aulas[j], index: j };
    }
  }
  return null;
}

function getAulaAnterior(aulaId) {
  var info = getAulaPorId(aulaId);
  if (!info || info.index === 0) return null;
  return info.modulo.aulas[info.index - 1];
}

function getModuloPagina(ordem, fromLesson) {
  var page;
  if (ordem === 1) page = 'modulosinici.html';
  else if (ordem === 2) page = 'modulosbasic.html';
  else page = 'modulosavanç.html';
  return (fromLesson ? '../../modulos/' : '') + page;
}

function getProximoModuloPagina(ordem, fromLesson) {
  if (ordem >= 3) return null;
  return getModuloPagina(ordem + 1, fromLesson);
}

function isModuloDesbloqueado(ordem, progresso) {
  if (ordem === 1) return true;
  var anterior = null;
  for (var i = 0; i < MODULOS.length; i++) {
    if (MODULOS[i].ordem === ordem - 1) { anterior = MODULOS[i]; break; }
  }
  if (!anterior) return false;
  var total = anterior.aulas.length;
  var concluidas = 0;
  for (var j = 0; j < anterior.aulas.length; j++) {
    if (progresso[anterior.aulas[j].id]) concluidas++;
  }
  return concluidas >= total;
}

function isAulaDesbloqueada(aulaId, progresso) {
  var info = getAulaPorId(aulaId);
  if (!info) return false;
  if (!isModuloDesbloqueado(info.modulo.ordem, progresso)) return false;
  if (info.index === 0) return true;
  var anterior = info.modulo.aulas[info.index - 1];
  return !!progresso[anterior.id];
}
