# SEADI - Sistema de Educação para Aprendizagem Digital Inclusiva

> **Projeto Integrador - Inclusão Digital SENAC 2026**
> **Turma:** 2025.2.62

---

## 📖 Sobre o Projeto

O **SEADI (Sistema de Educação para Aprendizagem Digital Inclusiva)** foi desenvolvido com o objetivo de promover a inclusão digital para jovens e adultos, auxiliando pessoas que possuem dificuldades com informática básica.

A plataforma oferece um ambiente intuitivo para aprendizado, permitindo que usuários desenvolvam conhecimentos sobre computadores, internet e ferramentas digitais de forma simples, acessível e prática. O curso é dividido em **3 módulos progressivos** com um total de **29 aulas**, cobrindo desde o básico (ligar um computador) até tópicos avançados (segurança digital e solução de problemas).

O sistema foi desenvolvido pensando em acessibilidade, facilidade de uso e futura expansão da plataforma.

---

## 🚀 Tecnologias Utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript (vanilla)
- Bootstrap 4
- Responsividade

### Backend

- Node.js
- NestJS 10
- TypeScript
- Prisma ORM 5
- JWT Authentication (Passport)
- Bcrypt (criptografia de senhas)
- Nodemailer (envio de e-mails)
- Multer (upload de arquivos)
- Class Validator (validação de dados)

### Banco de Dados

- MariaDB 11.4
- Prisma ORM

### Infraestrutura

- Docker
- Docker Compose
- PhpMyAdmin

---

## ✅ Funcionalidades

### Autenticação e Acesso
- Cadastro de usuários com validação de dados
- Login com autenticação JWT
- Recuperação de senha via e-mail (código de 6 dígitos)
- Barra visual de força de senha (4 níveis)
- Termos de uso e política de privacidade (LGPD)

### Aprendizado
- 3 módulos progressivos: Iniciante (9 aulas), Básico (11 aulas), Avançado (9 aulas)
- Vídeos do YouTube incorporados com rastreamento de progresso (YouTube IFrame API)
- Desbloqueio sequencial de módulos e aulas
- Marcação automática de aula concluída ao atingir 90% do vídeo

### Progresso e Gamificação
- Dashboard com porcentagem de progresso por módulo
- Streak de dias consecutivos de estudo
- Estatísticas: aulas concluídas, tempo assistido, módulos iniciados
- Log de atividades recentes (auditoria)
- Botão de reset de progresso

### Perfil do Usuário
- Edição de dados cadastrais (nome, e-mail, telefone, data de nascimento)
- Upload de foto de perfil com validação de tipo e tamanho
- Alteração de senha com verificação da senha atual
- Sidebar responsiva na área do usuário

### Páginas Institucionais
- Termos de uso
- Política de privacidade (LGPD)

---

## 📂 Estrutura do Projeto

```text
SENACPI/
├── backend/
│   ├── src/
│   │   ├── auth/              # Autenticação (login, registro, recuperação)
│   │   │   ├── dto/           # register, login, forgot-password, reset-password
│   │   │   ├── guards/        # jwt-auth.guard.ts
│   │   │   └── strategies/    # jwt.strategy.ts
│   │   ├── user/              # Perfil do usuário
│   │   │   └── dto/           # update-profile, change-password
│   │   ├── module/            # Módulos e aulas do curso
│   │   ├── progress/          # Progresso, estatísticas, atividades
│   │   ├── upload/            # Upload de foto de perfil
│   │   ├── mail/              # Serviço de e-mail (Nodemailer)
│   │   └── prisma/            # Conexão com o banco (PrismaService)
│   ├── prisma/
│   │   ├── schema.prisma      # Modelos do banco de dados
│   │   ├── seed.ts            # Seed com 3 módulos e 29 aulas
│   │   └── migrations/
│   ├── uploads/               # Diretório de upload (avatares)
│   ├── package.json
│   ├── entrypoint.sh
│   └── wait-for-db.js
│
├── frontend/
│   ├── index.html             # Dashboard principal
│   ├── login.html             # Tela de login
│   ├── criarconta.html        # Tela de cadastro
│   ├── esqueci-senha.html     # Recuperação de senha
│   ├── termos.html            # Termos de uso
│   ├── privacidade.html       # Política de privacidade
│   ├── modulos/               # Páginas de módulo
│   │   ├── modulosinici.html
│   │   ├── modulosbasic.html
│   │   └── modulosavanç.html
│   ├── minha-conta/           # Área do usuário
│   │   ├── cadastro.html      # Dados cadastrais + foto
│   │   ├── senha.html         # Alterar senha
│   │   └── progresson1.html   # Progresso e estatísticas
│   ├── pasta-modulos/         # Conteúdo das 29 aulas
│   │   ├── 1-modulo_iniciante/
│   │   ├── 2-modulo_basico/
│   │   └── 3-modulo_avançado/
│   ├── JS/                    # Scripts JavaScript
│   │   ├── api.js             # Cliente HTTP (authFetch, apiFetch)
│   │   ├── shared.js          # Funções utilitárias (toast, sidebar)
│   │   ├── script.js          # Auth guard, menu perfil
│   │   ├── aulas.js           # Dados dos módulos/aulas
│   │   ├── modulos.js         # Carrega aulas com progresso
│   │   ├── video-tracker.js   # Rastreamento YouTube
│   │   ├── login.js           # Lógica de login
│   │   ├── criarconta.js      # Cadastro de usuário
│   │   ├── cadastro.js        # Edição de perfil + upload
│   │   ├── esquecisenha.js    # Recuperação de senha
│   │   ├── scriptminhaconta.js # Alteração de senha
│   │   └── progresso.js       # Sidebar
│   ├── css/                   # Estilos
│   │   ├── auth.css
│   │   ├── styleIndex.css
│   │   ├── estilominhaconta.css
│   │   ├── criarconta.css
│   │   ├── esqueci.css
│   │   ├── docs.css
│   │   └── fonts.css
│   ├── img/                   # Imagens (logos, ícones)
│   └── ico/                   # Favicons
│
├── docker-compose.yml
├── Dockerfile
├── .env
└── README.md
```

---

## 🔐 Fluxo da Aplicação

```text
Login ──────────────────────→ Dashboard (index)
  │                               │
  │ (primeiro acesso)             │
  ↓                               ├── Módulos → Aulas (vídeo + progresso)
Cadastro                          │
  │                               └── Minha Conta
  ↓                                   ├── Perfil (editar dados + foto)
Recuperação de Senha                 ├── Alterar Senha
  │ (código via e-mail)              └── Progresso (estatísticas + streak)
  ↓
Redefinir Senha
```

- A primeira tela exibida ao usuário é a **Tela de Login**.
- Caso seja o primeiro acesso, o usuário poderá criar sua conta através da tela de cadastro.
- Todas as páginas internas são protegidas por autenticação JWT.
- Os módulos são desbloqueados sequencialmente ao completar o anterior.

---

## 🗄 Banco de Dados

O projeto utiliza **MariaDB** com **Prisma ORM**.

### Modelos

| Modelo | Descrição |
|--------|-----------|
| **Usuario** | Dados do usuário (nome, e-mail, senha, telefone, data de nascimento, foto) |
| **Modulo** | Módulos do curso (ordem, título, descrição, ícone) |
| **Aula** | Aulas de cada módulo (título, descrição, vídeo, conteúdo, duração) |
| **ProgressoModulo** | Progresso do usuário por módulo (% concluído, data início/fim) |
| **ProgressoAula** | Progresso do usuário por aula (vídeo assistido, tempo, % conclusão) |
| **TentativaLogin** | Log de tentativas de login (sucesso/falha) |
| **RedefinicaoSenha** | Códigos de recuperação de senha (código, expiração, uso) |
| **Atividade** | Log de atividades recentes do usuário (tipo, descrição, data) |

### Conteúdo do Curso (Seed)

| Módulo | Aulas |
|--------|-------|
| **1 - Iniciante** | Ligar/desligar, Mouse, Teclado, Windows, Área de trabalho, Programas, Internet, Wi-Fi, Janelas |
| **2 - Básico** | Google, Pesquisar, Digitar texto, Acentuação, Arquivos, Downloads, E-mail, Comunicação online, Apps úteis, Acessibilidade |
| **3 - Avançado** | Organização digital, Atualizações, Segurança, Teclas de atalho (4 partes), Pen drive, Solução de problemas |

---

## 🌐 API REST

### Autenticação

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/api/auth/register` | Não | Registrar novo usuário |
| POST | `/api/auth/login` | Não | Login (retorna JWT) |
| POST | `/api/auth/forgot-password` | Não | Solicitar código de recuperação |
| POST | `/api/auth/reset-password` | Não | Redefinir senha com código |

### Perfil do Usuário

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/api/auth/profile` | JWT | Visualizar perfil |
| PUT | `/api/auth/profile` | JWT | Atualizar dados cadastrais |
| PUT | `/api/auth/password` | JWT | Alterar senha |
| POST | `/api/auth/upload-photo` | JWT | Upload de foto de perfil |

### Módulos e Aulas

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/api/modules` | Não | Listar todos os módulos |
| GET | `/api/modules/:id` | Não | Detalhes do módulo com aulas |
| GET | `/api/modules/available` | JWT | Módulos com status de desbloqueio |
| GET | `/api/lessons/:id` | Não | Detalhes da aula |

### Progresso

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/api/progress` | JWT | Progresso geral do usuário |
| GET | `/api/progress/statistics` | JWT | Estatísticas (streak, tempo, etc.) |
| GET | `/api/progress/status` | JWT | Status das aulas (concluídas/em andamento) |
| GET | `/api/progress/activities` | JWT | Atividades recentes |
| POST | `/api/lessons/:id/video-progress` | JWT | Atualizar progresso do vídeo |
| POST | `/api/lessons/:id/complete` | JWT | Marcar aula como concluída |
| POST | `/api/progress/reset` | JWT | Resetar progresso do usuário |

### Health Check

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/api/health` | Não | Verificação de saúde da API |

---

## 🐳 Docker

O projeto está preparado para execução através do Docker Compose.

### Serviços

| Serviço | Descrição | Porta |
|---------|-----------|-------|
| `db` | MariaDB 11.4 | 3306 |
| `phpmyadmin` | Interface web para o banco | 8080 |
| `backend` | API NestJS | 5000 |

### Comandos

Subir containers:

```bash
docker compose up -d --build
```

Parar containers:

```bash
docker compose down
```

Ver logs do backend:

```bash
docker compose logs -f backend
```

---

## 🌐 Acesso

| Serviço | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5000` |
| PhpMyAdmin | `http://localhost:8080` |

---

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto (será utilizado pelo Docker Compose):

```env
# Banco de Dados
DATABASE_URL="mysql://root:sua_senha@db:3306/inclusao_digital"
MYSQL_ROOT_PASSWORD=sua_senha

# JWT
JWT_SECRET=SuaChaveSuperSecretaAquiMinimo32Caracteres
JWT_EXPIRES=1d

# Backend
PORT=5000

# E-mail (Nodemailer + Gmail)
GMAIL_USER=seu_e-mail@gmail.com
GMAIL_PASS=sua_senha_de_app
```

> **Nota:** Para o Gmail, utilize uma [Senha de App](https://myaccount.google.com/apppasswords) e não a senha principal da conta.

---

## 📚 Organização do Backend

O backend foi desenvolvido seguindo a arquitetura do **NestJS**, separando responsabilidades em módulos independentes.

| Módulo | Responsabilidade |
|--------|------------------|
| **AuthModule** | Registro, login, recuperação de senha |
| **UserModule** | Perfil do usuário, alteração de senha |
| **ModuleModule** | Listagem de módulos e aulas |
| **ProgressModule** | Estatísticas, progresso de vídeo, completar aula, reset |
| **UploadModule** | Upload de foto de perfil (Multer) |
| **MailModule** | Envio de e-mails (Nodemailer + Gmail) |
| **PrismaModule** | Conexão com o banco de dados (global) |

Cada módulo possui:

- **Controller** — Recebe e responde às requisições HTTP
- **Service** — Contém a regra de negócio
- **DTO** — Validação e tipagem dos dados de entrada
- **Module** — Definição de dependências e imports

---

## 🔒 Segurança

- **JWT Authentication** com Passport para rotas protegidas
- **Bcrypt** (10 rounds) para criptografia de senhas
- **Rate limiting** — Máximo de 5 tentativas de login a cada 15 minutos
- **Cooldown de recuperação** — Intervalo de 5 minutos entre solicitações
- **Proteção contra enumeração** — Mensagens genéricas de erro no login
- **Validação de dados** com Class Validator
- **Proteção contra SQL Injection** através do Prisma ORM
- **Variáveis de ambiente** para dados sensíveis
- **Rotas protegidas** por Guards JWT

---

## 📖 Documentação

O código foi documentado em Português (Brasil), facilitando a manutenção e compreensão por novos desenvolvedores.

---

## 👨‍💻 Equipe

Projeto desenvolvido como parte do **Projeto Integrador do SENAC**, com foco na inclusão digital e no desenvolvimento de soluções tecnológicas voltadas para educação e acessibilidade.

---

## 📌 Futuras Melhorias

- Certificados automáticos ao concluir módulos
- Área do professor para gerenciar conteúdo
- Fórum de dúvidas entre alunos
- Chat em tempo real
- Painel administrativo completo
- Dashboard com métricas avançadas
- Notificações por e-mail
- Aplicativo Mobile
