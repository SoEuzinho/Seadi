<div align="center">

<img src="frontend/img/seadi_1.png" alt="Logo do SEADI" width="180">

# SEADI

### Sistema de Educação para Aprendizagem Digital Inclusiva

**Uma plataforma gratuita que ensina informática do zero — de ligar o computador até segurança digital — para jovens e adultos que estão dando os primeiros passos no mundo digital.**

[![Projeto Integrador SENAC](https://img.shields.io/badge/Projeto%20Integrador-SENAC%202026-004A8D?style=for-the-badge)](#-sobre-o-projeto)
[![Turma](https://img.shields.io/badge/Turma-2025.2.62-F7941D?style=for-the-badge)](#-equipe)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=flat-square&logo=bootstrap&logoColor=white)

[✨ Funcionalidades](#-funcionalidades) · [🚀 Como rodar](#-como-rodar-o-projeto) · [👥 Equipe](#-equipe)

</div>

---

## 📖 Sobre o projeto

Muitas pessoas ainda ficam de fora do mundo digital por não saberem usar um computador: mandar um e-mail, pesquisar no Google, salvar um arquivo ou se proteger de golpes na internet.

O **SEADI** nasceu no **Projeto Integrador do SENAC** para enfrentar esse problema. É uma plataforma de ensino com linguagem simples, vídeos curtos, simuladores interativos e gamificação, pensada para quem nunca teve contato com tecnologia.

- 🎓 **29 aulas** em **3 módulos progressivos** (Iniciante → Básico → Avançado)
- 🖱️ **Simuladores interativos** para praticar sem medo de errar
- 🏆 **Quiz multiplayer em tempo real**, ranking e conquistas para manter a motivação
- ♿ Pensado para **acessibilidade** e para quem tem pouca familiaridade com tecnologia

> 💡 Este foi o **primeiro projeto full stack** da equipe, desenvolvido do zero durante o curso.

<!--
📸 DICA: adicione prints da plataforma aqui! Salve as imagens em uma pasta "docs/" e use:
<p align="center">
  <img src="docs/login.png" width="45%">
  <img src="docs/dashboard.png" width="45%">
</p>
-->

---

## ✨ Funcionalidades

### 📚 Aprendizado
- 3 módulos com desbloqueio sequencial: **Iniciante** (9 aulas), **Básico** (11 aulas) e **Avançado** (9 aulas)
- Vídeos do YouTube com rastreamento de progresso (YouTube IFrame API)
- Aula marcada como concluída automaticamente ao assistir 90% do vídeo
- **Simuladores interativos**: ligar/desligar o computador, mouse, teclado, janelas do Windows, internet e redes, pen drive e navegação

### 🎮 Gamificação
- **Quiz multiplayer em tempo real** com salas, partidas e placar (WebSockets / Socket.io)
- **Ranking** dos alunos e ranking do quiz
- **Conquistas** desbloqueadas conforme o aluno avança
- Streak de dias seguidos de estudo

### 📊 Progresso
- Dashboard com porcentagem concluída por módulo
- Estatísticas: aulas concluídas, tempo assistido e módulos iniciados
- Histórico de atividades recentes
- Opção de reiniciar o progresso

### 👤 Conta do usuário
- Cadastro, login com JWT e recuperação de senha por código enviado por e-mail
- Indicador visual de força da senha
- Edição de perfil e upload de foto
- Termos de uso e política de privacidade (LGPD)

---

## 🛠️ Tecnologias

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript (vanilla), Bootstrap 4, layout responsivo |
| **Backend** | Node.js, NestJS 10, TypeScript, Passport + JWT, Bcrypt, Class Validator, Multer, Nodemailer |
| **Tempo real** | Socket.io (`@nestjs/websockets`) |
| **Banco de dados** | MariaDB 11.4 + Prisma ORM 5 |
| **Infraestrutura** | Docker, Docker Compose, phpMyAdmin, Vercel |

---

## 🏗️ Arquitetura

```text
 Navegador (HTML/CSS/JS)
        │  REST (fetch + JWT em cookie)      WebSocket (quiz ao vivo)
        ▼                                     ▼
 ┌──────────────────────── API NestJS ────────────────────────┐
 │ Auth · User · Module · Progress · Quiz · Ranking ·         │
 │ Achievement · Upload · Mail                                │
 └──────────────────────────┬─────────────────────────────────┘
                            │ Prisma ORM
                            ▼
                      MariaDB 11.4
```

---

## 📂 Estrutura do projeto

```text
Seadi/
├── backend/                 # API em NestJS
│   ├── prisma/              # schema.prisma, migrations e seed (3 módulos, 29 aulas)
│   └── src/
│       ├── auth/            # cadastro, login, recuperação de senha (JWT)
│       ├── user/            # perfil e troca de senha
│       ├── module/          # módulos e aulas
│       ├── progress/        # progresso, estatísticas e atividades
│       ├── quiz/            # quiz multiplayer (gateway WebSocket, salas, placar)
│       ├── ranking/         # ranking dos alunos
│       ├── achievement/     # conquistas
│       ├── upload/          # foto de perfil
│       └── mail/            # envio de e-mails
├── frontend/
│   ├── index.html           # dashboard
│   ├── login.html · criarconta.html · esqueci-senha.html
│   ├── modulos/             # páginas de cada módulo
│   ├── pasta-modulos/       # conteúdo das 29 aulas
│   ├── minha-conta/         # perfil, progresso, quiz, ranking, conquistas, simuladores, criadores
│   ├── JS/ · css/ · img/
├── api/                     # função serverless (proxy na Vercel)
├── docker-compose.yml
├── Dockerfile
└── vercel.json
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/SoEuzinho/Seadi.git
cd Seadi

# 2. Crie o arquivo de configuração a partir do exemplo
cp .env.example .env
# edite o .env com suas senhas, JWT_SECRET e dados do Gmail

# 3. Suba os containers
docker compose up -d --build
```

| Serviço | Endereço |
|---------|----------|
| Plataforma + API | http://localhost:5000 |
| phpMyAdmin | http://localhost:8080 |

> Para o envio de e-mails, use uma [Senha de App do Gmail](https://myaccount.google.com/apppasswords), nunca a senha principal da conta.

<details>
<summary><b>Rodar o backend sem Docker</b></summary>

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```
</details>

---

## 🌐 API REST

<details>
<summary><b>Ver principais rotas</b></summary>

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/api/auth/register` | — | Cadastrar usuário |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/forgot-password` | — | Pedir código de recuperação |
| POST | `/api/auth/reset-password` | — | Redefinir senha |
| GET / PUT | `/api/auth/profile` | JWT | Ver / editar perfil |
| PUT | `/api/auth/password` | JWT | Alterar senha |
| POST | `/api/auth/upload-photo` | JWT | Enviar foto de perfil |
| GET | `/api/modules` | — | Listar módulos |
| GET | `/api/modules/available` | JWT | Módulos com status de desbloqueio |
| GET | `/api/lessons/:id` | — | Detalhes da aula |
| GET | `/api/progress` | JWT | Progresso geral |
| GET | `/api/progress/statistics` | JWT | Estatísticas e streak |
| POST | `/api/lessons/:id/video-progress` | JWT | Salvar progresso do vídeo |
| POST | `/api/lessons/:id/complete` | JWT | Concluir aula |
| POST | `/api/progress/reset` | JWT | Reiniciar progresso |
| GET | `/api/quiz/categories` | JWT | Categorias do quiz |
| GET | `/api/quiz/history` | JWT | Histórico de partidas |
| GET | `/api/ranking/students` | JWT | Ranking dos alunos |
| GET | `/api/ranking/quiz` | JWT | Ranking do quiz |
| GET | `/api/achievements` | JWT | Conquistas do usuário |
| GET | `/api/health` | — | Health check |

</details>

---

## 🔒 Segurança

- Senhas criptografadas com **Bcrypt**
- Autenticação **JWT** com Guards do NestJS
- **Limite de tentativas de login** (5 a cada 15 minutos)
- Intervalo mínimo entre pedidos de recuperação de senha
- Mensagens genéricas de erro para evitar enumeração de contas
- Validação de dados de entrada com Class Validator
- Proteção contra SQL Injection via Prisma ORM
- Dados sensíveis apenas em variáveis de ambiente

---

## 👥 Equipe

Projeto desenvolvido pela turma **2025.2.62** do **SENAC** como Projeto Integrador.

| Integrante | Função |
|------------|--------|
| tony mark | Líder de Projeto / Arquiteto de Sistemas |
| Jorge | Líder de Front-end |
| Eduardo | Líder de Back-end |
| Divaldo F. | Desenvolvedor Back-end |
| Leonardo Santos | Desenvolvedor Back-end |
| Nathan | Desenvolvedor Back-end |
| RG | Desenvolvedor Front-end |
| Roberto | Desenvolvedor Front-end |
| Pedro H. | Administrador de Banco de Dados (DBA) |
| Tauany | Administradora de Banco de Dados (DBA) |
| Geovania | Especialista em Usabilidade |
| Clara | Especialista em Usabilidade |
| _pedro_, Caio Ribeiro, Caio W., Cauã Santos, R Max | Participantes do projeto |

---

## 📌 Próximos passos

- [ ] Certificado automático ao concluir os módulos
- [ ] Área do professor para gerenciar conteúdo
- [ ] Painel administrativo
- [ ] Fórum de dúvidas entre alunos
- [ ] Notificações por e-mail
- [ ] Aplicativo mobile

---

<div align="center">

Feito com 💙 para tornar a tecnologia acessível a todos.

⭐ Se este projeto te ajudou ou te inspirou, deixe uma estrela!

</div>
