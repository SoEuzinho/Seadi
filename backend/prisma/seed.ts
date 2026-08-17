import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modules = [
  {
    order: 1,
    title: 'Iniciante',
    description: 'Primeiros passos no computador',
    icon: 'inici.png',
    lessons: [
      { order: 1, title: 'Como Ligar e Desligar', videoUrl: 'https://www.youtube.com/embed/-m7jRtUrh4U', duracao: 120 },
      { order: 2, title: 'Como usar um Mouse', duracao: 180 },
      { order: 3, title: 'Como usar o Teclado', duracao: 240 },
      { order: 4, title: 'Conhecendo o Windows', duracao: 300 },
      { order: 5, title: 'Área de trabalho', duracao: 200 },
      { order: 6, title: 'Abrindo programas', duracao: 150 },
      { order: 7, title: 'Internet básica', duracao: 250 },
      { order: 8, title: 'Wi-Fi e conexão', duracao: 180 },
      { order: 9, title: 'Usando Janelas', duracao: 220 },
    ],
  },
  {
    order: 2,
    title: 'Básico',
    description: 'Fundamentos para o dia a dia',
    icon: 'avanç.png',
    lessons: [
      { order: 1, title: 'Google e Navegação', duracao: 180 },
      { order: 2, title: 'Como Pesquisar', duracao: 240 },
      { order: 3, title: 'Digitando Texto', duracao: 300 },
      { order: 4, title: 'Usando Pontos e Acentuações', duracao: 200 },
      { order: 5, title: 'Criando e Organizando Arquivos', duracao: 250 },
      { order: 6, title: 'Noções Básicas de Arquivos', duracao: 150 },
      { order: 7, title: 'Baixando Arquivos', duracao: 180 },
      { order: 8, title: 'Criando e-mail', duracao: 300 },
      { order: 9, title: 'Comunicação online', duracao: 200 },
      { order: 10, title: 'Aplicativos Úteis', duracao: 200 },
      { order: 11, title: 'Acessibilidade rápida', duracao: 120 },
    ],
  },
  {
    order: 3,
    title: 'Avançado',
    description: 'Conceitos avançados e produtividade',
    icon: 'intermed.png',
    lessons: [
      { order: 1, title: 'Organização digital', duracao: 240 },
      { order: 2, title: 'Atualizações e cuidados', duracao: 180 },
      { order: 3, title: 'Segurança básica', duracao: 300 },
      { order: 4, title: 'Teclas de atalho (Parte 1)', duracao: 200 },
      { order: 5, title: 'Teclas de atalho (Parte 2)', duracao: 220 },
      { order: 6, title: 'Teclas de atalho (Parte 3)', duracao: 180 },
      { order: 7, title: 'Teclas de atalho (Parte 4)', duracao: 250 },
      { order: 8, title: 'Usando pen drive', duracao: 200 },
      { order: 9, title: 'Problemas simples e soluções rápidas', duracao: 300 },
    ],
  },
];

// ── Banco de perguntas do Quiz Multiplayer ──
// Cada pergunta possui enunciado, três alternativas e o índice correto (0, 1 ou 2).
// As categorias espelham os módulos do curso (iniciante, basico, avancado),
// além da categoria extra "programador" (HTML, CSS, JavaScript, etc.).
const questions = [
  // ── MÓDULO INICIANTE ──
  { categoria: 'iniciante', enunciado: 'Como você deve desligar o computador corretamente?', alternativaA: 'Pelo menu Iniciar, escolhendo Desligar', alternativaB: 'Puxando o fio da tomada', alternativaC: 'Segurando o botão de energia por 10 segundos', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Qual é o primeiro passo para usar o computador?', alternativaA: 'Ligar na tomada e apertar o botão de energia', alternativaB: 'Desconectar o mouse', alternativaC: 'Apagar os arquivos antigos', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Qual botão do mouse é usado para selecionar (clicar) um item?', alternativaA: 'Botão esquerdo', alternativaB: 'Botão direito', alternativaC: 'Botão do meio', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que normalmente acontece ao dar um clique duplo em um ícone?', alternativaA: 'Abre um arquivo ou programa', alternativaB: 'Apaga o arquivo', alternativaC: 'Desliga o computador', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Para que serve a tecla Enter no teclado?', alternativaA: 'Confirmar ou enviar uma ação', alternativaB: 'Apagar o que foi digitado', alternativaC: 'Mudar o idioma do teclado', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que é a Área de Trabalho (Desktop) do Windows?', alternativaA: 'A primeira tela que aparece após ligar o computador', alternativaB: 'Um programa de desenho', alternativaC: 'Uma mesa de escritório conectada ao computador', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que a barra de tarefas do Windows mostra?', alternativaA: 'Os programas abertos e o botão Iniciar', alternativaB: 'A senha do usuário', alternativaC: 'A data de fabricação do computador', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Qual é a maneira mais comum de abrir um programa?', alternativaA: 'Clicar duas vezes no ícone do programa', alternativaB: 'Desligar e religar o computador', alternativaC: 'Puxar o cabo de rede', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Para que serve o botão "minimizar" de uma janela?', alternativaA: 'Esconder a janela sem fechar o programa', alternativaB: 'Fechar o programa de vez', alternativaC: 'Apagar o arquivo aberto', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que é a internet?', alternativaA: 'Uma rede mundial que conecta computadores', alternativaB: 'Um programa instalado no computador', alternativaC: 'Um tipo de monitor', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que é Wi-Fi?', alternativaA: 'Um tipo de cabo de rede', alternativaB: 'Uma rede sem fio', alternativaC: 'Um programa de navegação', correta: 1 },
  { categoria: 'iniciante', enunciado: 'Qual dispositivo conecta sua casa à internet?', alternativaA: 'Monitor', alternativaB: 'Roteador', alternativaC: 'Teclado', correta: 1 },
  { categoria: 'iniciante', enunciado: 'O que é um navegador (browser)?', alternativaA: 'Um programa para acessar páginas da internet', alternativaB: 'Um antivírus', alternativaC: 'Um servidor de e-mail', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Qual aparelho permite que vários dispositivos usem a internet ao mesmo tempo?', alternativaA: 'Impressora', alternativaB: 'Roteador', alternativaC: 'Caixa de som', correta: 1 },
  { categoria: 'iniciante', enunciado: 'O que significa a sigla IP?', alternativaA: 'Internet Protocol', alternativaB: 'Internal Program', alternativaC: 'Internet Password', correta: 0 },

  // ── MÓDULO BÁSICO ──
  { categoria: 'basico', enunciado: 'Qual é um exemplo de navegador de internet?', alternativaA: 'Google Chrome', alternativaB: 'Explorador de Arquivos do Windows', alternativaC: 'Calculadora', correta: 0 },
  { categoria: 'basico', enunciado: 'Para pesquisar na internet, o que você digita no Google?', alternativaA: 'Palavras-chave sobre o assunto', alternativaB: 'A senha do Wi-Fi', alternativaC: 'O número do computador', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual tecla você usa para digitar uma letra maiúscula?', alternativaA: 'Shift', alternativaB: 'Esc', alternativaC: 'Backspace', correta: 0 },
  { categoria: 'basico', enunciado: 'Como se chama o arquivo que você baixa (transfere) da internet para o computador?', alternativaA: 'Download', alternativaB: 'Upload', alternativaC: 'Login', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual programa serve para escrever e editar textos?', alternativaA: 'Bloco de Notas ou WordPad', alternativaB: 'Calculadora', alternativaC: 'Jogo de Paciência', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual símbolo é obrigatório em um endereço de e-mail?', alternativaA: '@', alternativaB: '#', alternativaC: '&', correta: 0 },
  { categoria: 'basico', enunciado: 'Para criar um e-mail, normalmente você precisa de um endereço e...', alternativaA: 'Uma senha', alternativaB: 'Uma impressora', alternativaC: 'Um pen drive', correta: 0 },
  { categoria: 'basico', enunciado: 'O que significa "responder" a um e-mail?', alternativaA: 'Escrever uma mensagem de volta para quem enviou', alternativaB: 'Apagar o e-mail', alternativaC: 'Desligar o computador', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual aplicativo permite conversar por mensagens pela internet?', alternativaA: 'WhatsApp Web', alternativaB: 'Bloco de Notas', alternativaC: 'Gerenciador de Arquivos', correta: 0 },
  { categoria: 'basico', enunciado: 'Para que serve a Lixeira do Windows?', alternativaA: 'Guardar arquivos apagados temporariamente', alternativaB: 'Acelerar a internet', alternativaC: 'Instalar programas', correta: 0 },
  { categoria: 'basico', enunciado: 'O que é um endereço de e-mail?', alternativaA: 'Uma identificação para enviar e receber mensagens', alternativaB: 'O endereço físico da casa', alternativaC: 'Um número de telefone', correta: 0 },
  { categoria: 'basico', enunciado: 'O que significa a sigla URL?', alternativaA: 'Uniform Resource Locator', alternativaB: 'Universal Remote Link', alternativaC: 'User Response Label', correta: 0 },
  { categoria: 'basico', enunciado: 'O que significa "encaminhar" um e-mail?', alternativaA: 'Enviar o e-mail para outra pessoa', alternativaB: 'Deletar o e-mail', alternativaC: 'Imprimir o e-mail', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual tecla é usada para apagar o que está atrás do cursor?', alternativaA: 'Backspace', alternativaB: 'Enter', alternativaC: 'Caps Lock', correta: 0 },

  // ── MÓDULO AVANÇADO ──
  { categoria: 'avancado', enunciado: 'Para que servem as atualizações do sistema?', alternativaA: 'Corrigir erros e melhorar a segurança', alternativaB: 'Apagar arquivos do usuário', alternativaC: 'Trocar a cor do monitor', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que é uma senha forte?', alternativaA: 'Uma senha longa com letras, números e símbolos', alternativaB: 'Sua data de nascimento', alternativaC: 'A mesma senha usada em todos os sites', correta: 0 },
  { categoria: 'avancado', enunciado: 'Qual tecla de atalho copia um item no Windows?', alternativaA: 'Ctrl + C', alternativaB: 'Ctrl + V', alternativaC: 'Ctrl + Z', correta: 0 },
  { categoria: 'avancado', enunciado: 'Qual tecla de atalho cola um item no Windows?', alternativaA: 'Ctrl + V', alternativaB: 'Ctrl + C', alternativaC: 'Alt + F4', correta: 0 },
  { categoria: 'avancado', enunciado: 'Qual tecla de atalho desfaz a última ação?', alternativaA: 'Ctrl + Z', alternativaB: 'Ctrl + P', alternativaC: 'Ctrl + S', correta: 0 },
  { categoria: 'avancado', enunciado: 'Qual tecla de atalho salva um arquivo?', alternativaA: 'Ctrl + S', alternativaB: 'Ctrl + D', alternativaC: 'Ctrl + L', correta: 0 },
  { categoria: 'avancado', enunciado: 'Para que serve um pen drive?', alternativaA: 'Armazenar e transportar arquivos', alternativaB: 'Aumentar o volume do computador', alternativaC: 'Melhorar o sinal do Wi-Fi', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que você deve fazer antes de retirar um pen drive do computador?', alternativaA: 'Ejetá-lo com segurança', alternativaB: 'Desligar a luz da sala', alternativaC: 'Apagar todos os arquivos dele', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que é fazer backup dos arquivos?', alternativaA: 'Guardar uma cópia em outro lugar', alternativaB: 'Apagar os arquivos antigos', alternativaC: 'Enviar os arquivos por carta', correta: 0 },
  { categoria: 'avancado', enunciado: 'Se o computador estiver lento, uma boa primeira atitude é...', alternativaA: 'Fechar os programas que não estão em uso', alternativaB: 'Puxar o cabo de energia', alternativaC: 'Comprar um monitor novo', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que é um vírus de computador?', alternativaA: 'Um programa malicioso que pode danificar o sistema', alternativaB: 'Uma falha de hardware', alternativaC: 'Um tipo de rede', correta: 0 },
  { categoria: 'avancado', enunciado: 'Qual é o protocolo seguro para navegar na internet?', alternativaA: 'HTTP', alternativaB: 'HTTPS', alternativaC: 'FTP', correta: 1 },
  { categoria: 'avancado', enunciado: 'Para que serve uma senha forte na internet?', alternativaA: 'Decorar o acesso', alternativaB: 'Proteger suas contas de invasores', alternativaC: 'Acelerar a conexão', correta: 1 },
  { categoria: 'avancado', enunciado: 'Qual atitude ajuda a manter o computador organizado?', alternativaA: 'Criar pastas com nomes claros e guardar arquivos nelas', alternativaB: 'Salvar tudo na Área de Trabalho', alternativaC: 'Nunca apagar arquivos', correta: 0 },

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPANSÃO POR AULA — perguntas baseadas exclusivamente no conteúdo das 29 aulas
  // (fonte: arquivos em frontend/pasta-modulos/). Cada bloco cita a aula de origem.
  // ─────────────────────────────────────────────────────────────────────────────

  // ── MÓDULO INICIANTE · Aula: Como Ligar e Desligar ──
  { categoria: 'iniciante', enunciado: 'Onde fica, geralmente, o botão de ligar de um computador de mesa?', alternativaA: 'Na frente do gabinete', alternativaB: 'Atrás do monitor', alternativaC: 'Embaixo do teclado', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Por que você NUNCA deve puxar o fio da tomada para desligar o computador?', alternativaA: 'Pode danificar o sistema e causar perda de dados', alternativaB: 'Aumenta o consumo de energia', alternativaC: 'Deixa o computador mais lento', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Qual é a forma correta de desligar o Windows?', alternativaA: 'Puxar o fio da tomada', alternativaB: 'Clicar no menu Iniciar, no botão de energia e escolher Desligar', alternativaC: 'Segurar o botão de ligar por 10 segundos', correta: 1 },
  { categoria: 'iniciante', enunciado: 'Depois de clicar em "Desligar", o que você deve fazer?', alternativaA: 'Desligar imediatamente na tomada', alternativaB: 'Fechar o gabinete', alternativaC: 'Aguardar a tela apagar por completo', correta: 2 },

  // ── MÓDULO INICIANTE · Aula: Como usar o Mouse ──
  { categoria: 'iniciante', enunciado: 'Para que serve o botão direito do mouse?', alternativaA: 'Seleciona itens', alternativaB: 'Abre um menu com opções adicionais, como Copiar e Colar', alternativaC: 'Rola a página', correta: 1 },
  { categoria: 'iniciante', enunciado: 'Para que serve a rodinha (scroll) do mouse?', alternativaA: 'Rolar a página para cima e para baixo', alternativaB: 'Abrir programas', alternativaC: 'Fechar janelas', correta: 0 },
  { categoria: 'iniciante', enunciado: 'No celular, como são chamados os programas?', alternativaA: 'Aplicativos (apps)', alternativaB: 'Sistemas', alternativaC: 'Gadgets', correta: 0 },

  // ── MÓDULO INICIANTE · Aula: Como usar o Teclado ──
  { categoria: 'iniciante', enunciado: 'Qual é a tecla mais longa do teclado?', alternativaA: 'Barra de espaço', alternativaB: 'Enter', alternativaC: 'Shift', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que a tecla Backspace apaga?', alternativaA: 'O que foi escrito, da direita para a esquerda', alternativaB: 'A linha inteira de uma vez', alternativaC: 'Somente letras maiúsculas', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que faz a tecla Caps Lock?', alternativaA: 'Confirma uma ação', alternativaB: 'Apaga a palavra inteira', alternativaC: 'Deixa todas as letras maiúsculas', correta: 2 },
  { categoria: 'iniciante', enunciado: 'Como você digita uma letra maiúscula com a tecla Shift?', alternativaA: 'Segurando Shift e pressionando a letra desejada', alternativaB: 'Pressionando Shift duas vezes', alternativaC: 'Pressionando Shift e Enter juntos', correta: 0 },
  { categoria: 'iniciante', enunciado: 'Em uma tecla com dois caracteres (como o 8 e o asterisco), o que acontece se você segurar Shift?', alternativaA: 'O número é digitado', alternativaB: 'O símbolo de cima é digitado', alternativaC: 'Nada acontece', correta: 1 },

  // ── MÓDULO INICIANTE · Aula: Conhecendo o Windows ──
  { categoria: 'iniciante', enunciado: 'O que é o Windows?', alternativaA: 'Um programa de desenho', alternativaB: 'O sistema operacional do computador, o "cérebro" que faz tudo funcionar', alternativaC: 'Um navegador de internet', correta: 1 },
  { categoria: 'iniciante', enunciado: 'O que aparece na tela quando você liga o computador?', alternativaA: 'Uma tela de bloqueio', alternativaB: 'A Lixeira', alternativaC: 'O menu Iniciar aberto', correta: 0 },
  { categoria: 'iniciante', enunciado: 'O que você precisa fazer na tela de bloqueio para entrar no sistema?', alternativaA: 'Pressionar Enter', alternativaB: 'Digitar a senha', alternativaC: 'Clicar em Desligar', correta: 1 },

  // ── MÓDULO INICIANTE · Aula: Área de Trabalho ──
  { categoria: 'iniciante', enunciado: 'O que são os desenhos pequenos (ícones) na Área de Trabalho?', alternativaA: 'Apenas enfeites da tela', alternativaB: 'Atalhos para abrir programas e arquivos', alternativaC: 'Imagens baixadas da internet', correta: 1 },
  { categoria: 'iniciante', enunciado: 'Onde fica a barra de tarefas do Windows?', alternativaA: 'No topo da tela', alternativaB: 'No canto superior direito', alternativaC: 'Na parte de baixo da tela', correta: 2 },
  { categoria: 'iniciante', enunciado: 'Onde fica o botão Iniciar?', alternativaA: 'No canto esquerdo da barra de tarefas', alternativaB: 'No canto direito da tela', alternativaC: 'No centro da Área de Trabalho', correta: 0 },

  // ── MÓDULO INICIANTE · Aula: Abrindo Programas ──
  { categoria: 'iniciante', enunciado: 'Qual programa do Windows serve para desenhar?', alternativaA: 'Calculadora', alternativaB: 'Paint', alternativaC: 'Bloco de Notas', correta: 1 },

  // ── MÓDULO INICIANTE · Aula: Internet Básica ──
  { categoria: 'iniciante', enunciado: 'Como você acessa um site específico diretamente?', alternativaA: 'Digitando o endereço completo na barra superior do navegador', alternativaB: 'Clicando no botão Iniciar', alternativaC: 'Procurando na Lixeira', correta: 0 },

  // ── MÓDULO INICIANTE · Aula: Wi-Fi e Conexão ──
  { categoria: 'iniciante', enunciado: 'Onde fica o ícone de rede (antena/globo) no Windows?', alternativaA: 'No menu Iniciar', alternativaB: 'No canto inferior direito da tela', alternativaC: 'No meio da Área de Trabalho', correta: 1 },
  { categoria: 'iniciante', enunciado: 'Para conectar o computador à sua rede Wi-Fi, você precisa...', alternativaA: 'Escolher a rede, digitar a senha e confirmar', alternativaB: 'Apenas clicar no ícone de rede', alternativaC: 'Digitar o nome no Word', correta: 0 },

  // ── MÓDULO INICIANTE · Aula: Usando Janelas ──
  { categoria: 'iniciante', enunciado: 'O que é uma janela no computador?', alternativaA: 'Um local para ver fotos', alternativaB: 'A moldura em que cada programa aberto funciona', alternativaC: 'A tela de bloqueio', correta: 1 },
  { categoria: 'iniciante', enunciado: 'O que faz o botão Maximizar de uma janela?', alternativaA: 'Esconde a janela na barra de tarefas', alternativaB: 'Fecha o programa', alternativaC: 'Expande a janela para ocupar a tela inteira', correta: 2 },
  { categoria: 'iniciante', enunciado: 'O que faz o botão "X" no canto de uma janela?', alternativaA: 'Fecha o programa por completo', alternativaB: 'Minimiza a janela', alternativaC: 'Atualiza a página', correta: 0 },

  // ── MÓDULO BÁSICO · Aula: Google e Navegação ──
  { categoria: 'basico', enunciado: 'Como você abre uma nova aba no navegador?', alternativaA: 'Clicando no sinal de + no topo da janela', alternativaB: 'Clicando no botão Iniciar', alternativaC: 'Pressionando Delete', correta: 0 },
  { categoria: 'basico', enunciado: 'Como alternar entre as abas abertas do navegador?', alternativaA: 'Fechando o navegador', alternativaB: 'Clicando com o botão esquerdo sobre a aba desejada', alternativaC: 'Pressionando o botão direito do mouse', correta: 1 },
  { categoria: 'basico', enunciado: 'Para atualizar (recarregar) uma página que travou, você deve...', alternativaA: 'Fechar o navegador', alternativaB: 'Desligar o computador', alternativaC: 'Clicar no símbolo de seta arredondada', correta: 2 },

  // ── MÓDULO BÁSICO · Aula: Como Pesquisar ──
  { categoria: 'basico', enunciado: 'Qual é a melhor forma de pesquisar algo no Google?', alternativaA: 'Usar frases longas e completas', alternativaB: 'Usar palavras-chave diretas', alternativaC: 'Escrever tudo em maiúsculas', correta: 1 },
  { categoria: 'basico', enunciado: 'Quais abas de filtro o Google costuma mostrar nos resultados?', alternativaA: 'Tudo, Vídeos, Imagens, Notícias e Shopping', alternativaB: 'Tudo, Músicas, Jogos e Filmes', alternativaC: 'Apenas a aba Imagens', correta: 0 },

  // ── MÓDULO BÁSICO · Aula: Digitando Texto ──
  { categoria: 'basico', enunciado: 'Como você seleciona uma palavra inteira de uma só vez?', alternativaA: 'Clicando uma vez sobre ela', alternativaB: 'Pressionando Caps Lock', alternativaC: 'Dando dois cliques rápidos sobre a palavra', correta: 2 },
  { categoria: 'basico', enunciado: 'Qual é o primeiro passo para copiar um texto?', alternativaA: 'Selecionar o texto arrastando o mouse sobre as palavras', alternativaB: 'Apagar o texto', alternativaC: 'Fechar o documento', correta: 0 },
  { categoria: 'basico', enunciado: 'Depois de copiar um texto, como você cola no local desejado?', alternativaA: 'Clicando com o botão direito no local e escolhendo Colar', alternativaB: 'Pressionando Delete', alternativaC: 'Clicando duas vezes', correta: 0 },

  // ── MÓDULO BÁSICO · Aula: Usando Pontos e Acentuações ──
  { categoria: 'basico', enunciado: 'Qual é o segredo da acentuação no teclado?', alternativaA: 'Pressionar a tecla do acento antes da letra', alternativaB: 'Pressionar a letra antes do acento', alternativaC: 'Usar apenas letras maiúsculas', correta: 0 },
  { categoria: 'basico', enunciado: 'Para digitar a letra "á", você deve...', alternativaA: 'Pressionar a tecla do acento agudo (´) e depois a letra A', alternativaB: 'Pressionar a letra A duas vezes', alternativaC: 'Segurar Shift e pressionar A', correta: 0 },
  { categoria: 'basico', enunciado: 'Como você digita o símbolo que fica na parte de cima de uma tecla?', alternativaA: 'Pressionando a tecla duas vezes', alternativaB: 'Segurando a tecla Shift e pressionando a tecla do símbolo', alternativaC: 'Pressionando Enter', correta: 1 },

  // ── MÓDULO BÁSICO · Aula: Criando e Organizando Arquivos ──
  { categoria: 'basico', enunciado: 'O que é uma pasta no computador?', alternativaA: 'Um arquivo de texto', alternativaB: 'Uma imagem', alternativaC: 'Uma "gaveta" para guardar seus arquivos', correta: 2 },
  { categoria: 'basico', enunciado: 'Como você cria uma pasta nova no Explorador de Arquivos?', alternativaA: 'Clicando com o botão direito em um espaço vazio, indo em Novo e clicando em Pasta', alternativaB: 'Pressionando Enter', alternativaC: 'Arrastando um arquivo para a Lixeira', correta: 0 },
  { categoria: 'basico', enunciado: 'Como você renomeia um arquivo?', alternativaA: 'Clicando duas vezes nele', alternativaB: 'Clicando com o botão direito sobre ele e escolhendo Renomear', alternativaC: 'Arrastando-o para a barra de tarefas', correta: 1 },
  { categoria: 'basico', enunciado: 'Como você exclui um arquivo selecionado?', alternativaA: 'Pressionando a tecla Delete', alternativaB: 'Pressionando Caps Lock', alternativaC: 'Clicando com o botão direito e escolhendo Copiar', correta: 0 },
  { categoria: 'basico', enunciado: 'Para mover um arquivo para outra pasta, você deve...', alternativaA: 'Apagar e recriar o arquivo', alternativaB: 'Arrastá-lo segurando o botão esquerdo até a pasta de destino e soltar', alternativaC: 'Clicar nele com o botão direito', correta: 1 },
  { categoria: 'basico', enunciado: 'Onde fica a opção "Salvar como" na maioria dos programas?', alternativaA: 'No menu Arquivo, no canto superior esquerdo', alternativaB: 'Na barra de tarefas', alternativaC: 'No botão Iniciar', correta: 0 },

  // ── MÓDULO BÁSICO · Aula: Noções Básicas de Arquivos ──
  { categoria: 'basico', enunciado: 'Qual extensão indica um arquivo de vídeo?', alternativaA: '.pdf', alternativaB: '.mp4', alternativaC: '.docx', correta: 1 },
  { categoria: 'basico', enunciado: 'Qual extensão indica um arquivo de imagem ou foto?', alternativaA: '.jpg ou .png', alternativaB: '.zip', alternativaC: '.mp4', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual extensão indica um arquivo de texto do Word?', alternativaA: '.rar', alternativaB: '.png', alternativaC: '.docx', correta: 2 },
  { categoria: 'basico', enunciado: 'Para que servem os arquivos .zip ou .rar?', alternativaA: 'Para compactar vários arquivos ocupando menos espaço', alternativaB: 'Para tocar músicas', alternativaC: 'Para editar fotos', correta: 0 },
  { categoria: 'basico', enunciado: 'O que é um arquivo .pdf?', alternativaA: 'Um arquivo de vídeo', alternativaB: 'Um formato de leitura fechado, como um livro digital, boleto ou contrato', alternativaC: 'Uma pasta compactada', correta: 1 },

  // ── MÓDULO BÁSICO · Aula: Baixando Arquivos ──
  { categoria: 'basico', enunciado: 'O que significa "baixar" (fazer Download) um arquivo?', alternativaA: 'Enviar um arquivo para a internet', alternativaB: 'Trazer um arquivo ou foto da internet para dentro do computador', alternativaC: 'Apagar um arquivo do computador', correta: 1 },
  { categoria: 'basico', enunciado: 'Onde os arquivos baixados da internet são salvos por padrão?', alternativaA: 'Na pasta Downloads', alternativaB: 'Na Lixeira', alternativaC: 'No Paint', correta: 0 },
  { categoria: 'basico', enunciado: 'De onde você deve baixar arquivos com segurança?', alternativaA: 'De qualquer site', alternativaB: 'De sites conhecidos e confiáveis', alternativaC: 'De e-mails de desconhecidos', correta: 1 },

  // ── MÓDULO BÁSICO · Aula: Criando e-mail ──
  { categoria: 'basico', enunciado: 'O que é um e-mail?', alternativaA: 'Um jogo online', alternativaB: 'Uma rede social', alternativaC: 'Seu endereço de correspondência na internet', correta: 2 },
  { categoria: 'basico', enunciado: 'Para enviar uma mensagem de e-mail, o primeiro passo é...', alternativaA: 'Clicar no botão Escrever (ou Novo E-mail)', alternativaB: 'Apagar a caixa de entrada', alternativaC: 'Fechar o navegador', correta: 0 },
  { categoria: 'basico', enunciado: 'O que você digita no campo "Para" de um e-mail?', alternativaA: 'O assunto da mensagem', alternativaB: 'O endereço de e-mail do destinatário', alternativaC: 'A sua senha', correta: 1 },

  // ── MÓDULO BÁSICO · Aula: Comunicação Online ──
  { categoria: 'basico', enunciado: 'Quais programas permitem fazer chamadas de vídeo pelo computador?', alternativaA: 'Google Meet, Microsoft Teams e Zoom', alternativaB: 'Paint e Calculadora', alternativaC: 'Word e Excel', correta: 0 },
  { categoria: 'basico', enunciado: 'Quando o navegador pedir para usar o microfone e a câmera em uma reunião, você deve...', alternativaA: 'Fechar a página', alternativaB: 'Permitir (confirmar) o uso', alternativaC: 'Desligar o computador', correta: 1 },

  // ── MÓDULO BÁSICO · Aula: Aplicativos Úteis ──
  { categoria: 'basico', enunciado: 'O que é o WhatsApp Web?', alternativaA: 'Um aplicativo de fotos', alternativaB: 'Uma versão do WhatsApp para usar no computador', alternativaC: 'Um navegador de internet', correta: 1 },
  { categoria: 'basico', enunciado: 'Como você conecta o WhatsApp do celular ao WhatsApp Web?', alternativaA: 'Escaneando o código QR exibido na tela do computador', alternativaB: 'Digitando um código de 6 dígitos', alternativaC: 'Enviando um e-mail', correta: 0 },
  { categoria: 'basico', enunciado: 'O que é o Google Drive?', alternativaA: 'Uma "nuvem" (pen drive virtual) que guarda seus arquivos na internet', alternativaB: 'Um programa de desenho', alternativaC: 'Um jogo de corrida', correta: 0 },
  { categoria: 'basico', enunciado: 'Para que serve o Canva?', alternativaA: 'Criar cartões, banners e apresentações', alternativaB: 'Escutar músicas', alternativaC: 'Traduzir textos', correta: 0 },
  { categoria: 'basico', enunciado: 'O que é o Google Tradutor?', alternativaA: 'Um aplicativo que traduz palavras e textos para o português', alternativaB: 'Um navegador', alternativaC: 'Um antivírus', correta: 0 },

  // ── MÓDULO BÁSICO · Aula: Acessibilidade Rápida ──
  { categoria: 'basico', enunciado: 'Como você aumenta o tamanho das letras em um site?', alternativaA: 'Segurando Ctrl e pressionando o sinal de +', alternativaB: 'Pressionando Caps Lock', alternativaC: 'Segurando Alt e pressionando F4', correta: 0 },
  { categoria: 'basico', enunciado: 'Qual atalho diminui as letras de um site?', alternativaA: 'Ctrl + -', alternativaB: 'Ctrl + =', alternativaC: 'Shift + +', correta: 0 },
  { categoria: 'basico', enunciado: 'Onde fica a opção "Luz noturna" no Windows?', alternativaA: 'Configurações → Sistema → Tela', alternativaB: 'Menu Iniciar → Desligar', alternativaC: 'Painel do navegador', correta: 0 },
  { categoria: 'basico', enunciado: 'Para que serve o modo "Luz noturna" do Windows?', alternativaA: 'Aumentar o brilho da tela', alternativaB: 'Reduzir o cansaço visual e ajudar na qualidade do sono', alternativaC: 'Acelerar a internet', correta: 1 },

  // ── MÓDULO AVANÇADO · Aula: Organização Digital ──
  { categoria: 'avancado', enunciado: 'Qual é um bom nome para um arquivo?', alternativaA: 'Documento1', alternativaB: 'Novo arquivo', alternativaC: 'Trabalho de Informática 2026', correta: 2 },
  { categoria: 'avancado', enunciado: 'Onde você deve guardar seus arquivos?', alternativaA: 'Nas pastas padrão do sistema: Documentos, Vídeos, Imagens e Downloads', alternativaB: 'Espalhados pela Área de Trabalho', alternativaC: 'Na Lixeira', correta: 0 },

  // ── MÓDULO AVANÇADO · Aula: Atualizações e Cuidados ──
  { categoria: 'avancado', enunciado: 'Quando o Windows exibe o aviso "Atualizar e reiniciar", você deve...', alternativaA: 'Ignorar o aviso', alternativaB: 'Salvar seus trabalhos e fazer o procedimento', alternativaC: 'Desligar o computador na tomada', correta: 1 },

  // ── MÓDULO AVANÇADO · Aula: Segurança Básica ──
  { categoria: 'avancado', enunciado: 'De que você deve desconfiar nos e-mails que recebe?', alternativaA: 'De links e anexos de desconhecidos ou mensagens com prêmios fáceis', alternativaB: 'De mensagens da sua família', alternativaC: 'De boletos do seu banco', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que golpistas costumam imitar para roubar dados?', alternativaA: 'A barra de tarefas', alternativaB: 'As configurações do Windows', alternativaC: 'Páginas de bancos e lojas', correta: 2 },
  { categoria: 'avancado', enunciado: 'De onde você deve baixar programas?', alternativaA: 'De páginas oficiais e confiáveis', alternativaB: 'De qualquer link recebido por e-mail', alternativaC: 'De anúncios de prêmios', correta: 0 },

  // ── MÓDULO AVANÇADO · Aula: Teclas de Atalho (Partes 1 a 4) ──
  { categoria: 'avancado', enunciado: 'O que faz o atalho Ctrl + X?', alternativaA: 'Copia o item selecionado', alternativaB: 'Recorta o item, removendo-o do lugar original para mover', alternativaC: 'Desfaz a última ação', correta: 1 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Ctrl + A?', alternativaA: 'Seleciona todo o texto ou todos os arquivos visíveis', alternativaB: 'Abre uma nova janela', alternativaC: 'Salva o arquivo', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Ctrl + F?', alternativaA: 'Fecha a janela', alternativaB: 'Abre uma barra de busca rápida para localizar uma palavra', alternativaC: 'Copia o texto', correta: 1 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Ctrl + T no navegador?', alternativaA: 'Fecha a aba ativa', alternativaB: 'Abre uma nova aba (guia)', alternativaC: 'Atualiza a página', correta: 1 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Ctrl + W?', alternativaA: 'Fecha a aba ativa', alternativaB: 'Abre uma nova aba', alternativaC: 'Salva o arquivo', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Ctrl + Shift + T?', alternativaA: 'Reabre a última aba fechada', alternativaB: 'Abre o Gerenciador de Tarefas', alternativaC: 'Desfaz a última ação', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Alt + Tab?', alternativaA: 'Alterna entre as janelas e os programas abertos', alternativaB: 'Fecha todos os programas', alternativaC: 'Mostra a Área de Trabalho', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que faz o atalho Windows + D?', alternativaA: 'Abre o menu Iniciar', alternativaB: 'Minimiza todas as janelas e mostra a Área de Trabalho', alternativaC: 'Desliga o computador', correta: 1 },

  // ── MÓDULO AVANÇADO · Aula: Usando Pen Drive ──
  { categoria: 'avancado', enunciado: 'Onde você encaixa um pen drive no computador?', alternativaA: 'Em uma entrada USB', alternativaB: 'Na entrada de fone de ouvido', alternativaC: 'No leitor de cartões', correta: 0 },
  { categoria: 'avancado', enunciado: 'Qual é a forma segura de retirar o pen drive?', alternativaA: 'Puxando-o imediatamente após usar', alternativaB: 'Clicando no ícone de USB perto do relógio e escolhendo "Remover Hardware com Segurança"', alternativaC: 'Desligando o computador antes', correta: 1 },
  { categoria: 'avancado', enunciado: 'Por que esperar o aviso para retirar o pen drive?', alternativaA: 'Para não danificar o computador', alternativaB: 'Para evitar que os arquivos sejam corrompidos', alternativaC: 'Para carregar o pen drive', correta: 1 },

  // ── MÓDULO AVANÇADO · Aula: Problemas Simples e Soluções Rápidas ──
  { categoria: 'avancado', enunciado: 'Como você fecha um programa travado?', alternativaA: 'Pressionando Ctrl + Shift + Esc, selecionando o programa no Gerenciador de Tarefas e clicando em "Finalizar tarefa"', alternativaB: 'Desligando o computador na tomada', alternativaC: 'Pressionando Caps Lock', correta: 0 },
  { categoria: 'avancado', enunciado: 'O que fazer se o computador congelar completamente?', alternativaA: 'Esperar alguns minutos', alternativaB: 'Segurar o botão de ligar por 10 segundos para forçar o desligamento', alternativaC: 'Puxar o cabo do monitor', correta: 1 },
  { categoria: 'avancado', enunciado: 'Se a internet cair em toda a casa, o que você deve fazer?', alternativaA: 'Retirar o modem da tomada, esperar 30 segundos e ligá-lo novamente', alternativaB: 'Comprar um computador novo', alternativaC: 'Apagar os arquivos da internet', correta: 0 },
  { categoria: 'avancado', enunciado: 'Se o som não está funcionando, o que você deve verificar primeiro?', alternativaA: 'Se o volume está no mudo no ícone de alto-falante', alternativaB: 'Se a internet está conectada', alternativaC: 'Se o pen drive está encaixado', correta: 0 },
  { categoria: 'avancado', enunciado: 'Como você faz os ícones que sumiram voltar à Área de Trabalho?', alternativaA: 'Desligando e ligando o computador', alternativaB: 'Instalando um programa novo', alternativaC: 'Clicando com o botão direito em um espaço vazio, indo em Exibir e marcando "Mostrar ícones da área de trabalho"', correta: 2 },

  // ── MÓDULO PROGRAMADOR (conteúdo extra: HTML, CSS, JavaScript, banco e programação) ──
  { categoria: 'programador', enunciado: 'Qual tag HTML é usada para criar um título de nível 1?', alternativaA: '<h1>', alternativaB: '<p>', alternativaC: '<title>', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual atributo define o endereço de uma imagem na tag <img>?', alternativaA: 'href', alternativaB: 'src', alternativaC: 'link', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual tag cria um link em HTML?', alternativaA: '<link>', alternativaB: '<url>', alternativaC: '<a>', correta: 2 },
  { categoria: 'programador', enunciado: 'Qual tag é usada para criar uma lista com marcadores (pontos)?', alternativaA: '<ol>', alternativaB: '<ul>', alternativaC: '<list>', correta: 1 },
  { categoria: 'programador', enunciado: 'Onde o conteúdo visível da página deve ficar?', alternativaA: 'Dentro de <head>', alternativaB: 'Dentro de <body>', alternativaC: 'Dentro de <html> apenas', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual tag insere uma quebra de linha?', alternativaA: '<br>', alternativaB: '<lb>', alternativaC: '<nl>', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual tag representa um parágrafo de texto?', alternativaA: '<text>', alternativaB: '<p>', alternativaC: '<par>', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual atributo abre o link em uma nova aba?', alternativaA: 'target="_blank"', alternativaB: 'new="true"', alternativaC: 'open="new"', correta: 0 },
  { categoria: 'programador', enunciado: 'O que significa a sigla HTML?', alternativaA: 'HyperText Markup Language', alternativaB: 'HighText Machine Language', alternativaC: 'Hyperlink and Text Markup Language', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual tag é usada para incorporar uma imagem?', alternativaA: '<picture>', alternativaB: '<image>', alternativaC: '<img>', correta: 2 },
  { categoria: 'programador', enunciado: 'Qual propriedade CSS define a cor do texto?', alternativaA: 'color', alternativaB: 'text-color', alternativaC: 'font-color', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual propriedade altera o tamanho da fonte?', alternativaA: 'text-size', alternativaB: 'font-size', alternativaC: 'size', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual seleciona elementos pelo atributo id no CSS?', alternativaA: '.nome', alternativaB: '#nome', alternativaC: '*nome', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual propriedade cria uma margem interna?', alternativaA: 'margin', alternativaB: 'border', alternativaC: 'padding', correta: 2 },
  { categoria: 'programador', enunciado: 'Qual propriedade define o espaçamento externo?', alternativaA: 'margin', alternativaB: 'padding', alternativaC: 'gap', correta: 0 },
  { categoria: 'programador', enunciado: 'O que significa a sigla CSS?', alternativaA: 'Cascading Style Sheets', alternativaB: 'Computer Style System', alternativaC: 'Creative Style Source', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual propriedade arredonda os cantos de um elemento?', alternativaA: 'radius', alternativaB: 'border-radius', alternativaC: 'corner-radius', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual propriedade esconde um elemento da página?', alternativaA: 'display: none', alternativaB: 'visibility: false', alternativaC: 'hidden: true', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual valor de position fixa o elemento em relação à tela?', alternativaA: 'relative', alternativaB: 'absolute', alternativaC: 'fixed', correta: 2 },
  { categoria: 'programador', enunciado: 'Qual propriedade deixa o texto em negrito?', alternativaA: 'font-weight', alternativaB: 'text-bold', alternativaC: 'font-bold', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual palavra-chave declara uma variável com escopo de bloco?', alternativaA: 'var', alternativaB: 'let', alternativaC: 'dim', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual função exibe uma mensagem no console?', alternativaA: 'console.log()', alternativaB: 'print()', alternativaC: 'debug.log()', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual operador verifica igualdade de valor E tipo?', alternativaA: '==', alternativaB: '=', alternativaC: '===', correta: 2 },
  { categoria: 'programador', enunciado: 'Qual estrutura repete um bloco enquanto a condição for verdadeira?', alternativaA: 'if', alternativaB: 'while', alternativaC: 'switch', correta: 1 },
  { categoria: 'programador', enunciado: 'O que a função prompt() faz?', alternativaA: 'Exibe uma caixa de entrada de texto', alternativaB: 'Fecha a aba do navegador', alternativaC: 'Envia dados para o servidor', correta: 0 },
  { categoria: 'programador', enunciado: 'Como se chama uma função sem nome?', alternativaA: 'Função anônima', alternativaB: 'Função vazia', alternativaC: 'Função invisível', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual método adiciona um item ao final de um array?', alternativaA: 'push()', alternativaB: 'add()', alternativaC: 'append()', correta: 0 },
  { categoria: 'programador', enunciado: 'O que é DOM?', alternativaA: 'Um banco de dados', alternativaB: 'A estrutura de objetos que representa a página', alternativaC: 'Uma linguagem de estilo', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual palavra-chave declara uma constante?', alternativaA: 'const', alternativaB: 'fix', alternativaC: 'static', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual método converte um texto em número inteiro?', alternativaA: 'parseInt()', alternativaB: 'toNumber()', alternativaC: 'NumberString()', correta: 0 },
  { categoria: 'programador', enunciado: 'O que é um banco de dados relacional?', alternativaA: 'Dados organizados em tabelas relacionadas', alternativaB: 'Uma pasta de arquivos soltos', alternativaC: 'Uma planilha única e simples', correta: 0 },
  { categoria: 'programador', enunciado: 'O que significa a sigla SQL?', alternativaA: 'Structured Query Language', alternativaB: 'Simple Question Language', alternativaC: 'System Quick Lookup', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual comando SQL busca dados de uma tabela?', alternativaA: 'INSERT', alternativaB: 'SELECT', alternativaC: 'UPDATE', correta: 1 },
  { categoria: 'programador', enunciado: 'Qual comando SQL insere dados em uma tabela?', alternativaA: 'INSERT INTO', alternativaB: 'ADD ROW', alternativaC: 'CREATE VALUE', correta: 0 },
  { categoria: 'programador', enunciado: 'O que é uma chave primária (primary key)?', alternativaA: 'Um identificador único de cada registro', alternativaB: 'Uma senha de acesso', alternativaC: 'O primeiro campo da tabela', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual comando remove um registro de uma tabela?', alternativaA: 'DROP ROW', alternativaB: 'DELETE FROM', alternativaC: 'REMOVE', correta: 1 },
  { categoria: 'programador', enunciado: 'O que é uma Foreign Key (chave estrangeira)?', alternativaA: 'Uma referência a uma chave de outra tabela', alternativaB: 'Uma coluna de texto estrangeiro', alternativaC: 'Um índice de busca externa', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual cláusula SQL filtra os resultados?', alternativaA: 'SORT', alternativaB: 'FILTER', alternativaC: 'WHERE', correta: 2 },
  { categoria: 'programador', enunciado: 'Qual comando cria uma nova tabela?', alternativaA: 'CREATE TABLE', alternativaB: 'NEW TABLE', alternativaC: 'MAKE TABLE', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual ORM é utilizado no backend do SEADI?', alternativaA: 'Sequelize', alternativaB: 'Prisma', alternativaC: 'Mongoose', correta: 1 },
  { categoria: 'programador', enunciado: 'O que é um algoritmo?', alternativaA: 'Uma sequência de passos para resolver um problema', alternativaB: 'Um tipo de memória', alternativaC: 'Um modelo de computador', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual é a função de um compilador?', alternativaA: 'Traduzir o código-fonte para linguagem de máquina', alternativaB: 'Armazenar dados do usuário', alternativaC: 'Conectar-se à internet', correta: 0 },
  { categoria: 'programador', enunciado: 'O que é uma variável na programação?', alternativaA: 'Um espaço para armazenar um valor', alternativaB: 'Um tipo de tela', alternativaC: 'Um comando de repetição', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual estrutura decide entre dois caminhos no código?', alternativaA: 'for', alternativaB: 'if/else', alternativaC: 'while', correta: 1 },
  { categoria: 'programador', enunciado: 'O que é um loop?', alternativaA: 'Uma estrutura que repete um trecho de código', alternativaB: 'Uma variável global', alternativaC: 'Um erro de sintaxe', correta: 0 },
  { categoria: 'programador', enunciado: 'O que é uma função?', alternativaA: 'Um bloco de código reutilizável', alternativaB: 'Uma tecla do teclado', alternativaC: 'Um tipo de dado', correta: 0 },
  { categoria: 'programador', enunciado: 'O que significa "bug" na programação?', alternativaA: 'Um erro no código', alternativaB: 'Um computador rápido', alternativaC: 'Uma função especial', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual linguagem é usada para programar o backend do SEADI?', alternativaA: 'Python', alternativaB: 'TypeScript', alternativaC: 'Java', correta: 1 },
  { categoria: 'programador', enunciado: 'O que é um array?', alternativaA: 'Uma lista de valores', alternativaB: 'Um tipo de monitor', alternativaC: 'Um comando de impressão', correta: 0 },
  { categoria: 'programador', enunciado: 'Qual operador aritmético calcula o resto de uma divisão?', alternativaA: '/', alternativaB: '%', alternativaC: '**', correta: 1 },
];

async function seedQuestions() {
  // Idempotente por enunciado: só cria as perguntas que ainda não existem.
  // Assim o seed pode rodar de novo para inserir novas perguntas (expansão
  // por aula) sem duplicar as já cadastradas.
  const existing = await prisma.questao.findMany({ select: { enunciado: true } });
  const existingSet = new Set(existing.map((q) => q.enunciado));
  const missing = questions.filter((q) => !existingSet.has(q.enunciado));

  if (missing.length === 0) {
    console.log('  Todas as perguntas ja existem. Nada a inserir.');
    return;
  }

  console.log(`Populando banco de perguntas do Quiz Multiplayer (${missing.length} novas)...`);
  await prisma.questao.createMany({ data: missing });
  const total = await prisma.questao.count();
  console.log(`  ${missing.length} novas perguntas criadas. Total no banco: ${total}.`);
}

async function main() {
  const existing = await prisma.modulo.count();
  if (existing > 0) {
    console.log('Banco ja populado, ignorando seed de modulos.');
  } else {
    console.log('Populando banco de dados...');

    for (const mod of modules) {
      const created = await prisma.modulo.create({
        data: {
          ordem: mod.order,
          titulo: mod.title,
          descricao: mod.description,
          icone: mod.icon,
          aulas: {
            create: mod.lessons.map((l) => ({
              ordem: l.order,
              titulo: l.title,
              videoUrl: l.videoUrl || null,
              duracao: l.duracao || null,
            })),
          },
        },
      });
      console.log(`  Modulo "${created.titulo}" criado com ${mod.lessons.length} aulas`);
    }
  }

  await seedQuestions();

  console.log('Banco populado com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
