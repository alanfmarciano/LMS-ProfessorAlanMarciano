# Arquitetura do LMS

## Visão geral

O LMS é uma aplicação local-first composta por:

- Frontend do aluno
- Frontend do admin
- Backend Node.js/Express
- Banco local em memória/arquivos
- APIs para aluno/admin
- Sistema de presença online
- Sistema de liberação em tempo real
- Sistema de provas e correção

## Estrutura atual de referência

Arquivos principais antigos:

- `server.js`: servidor Express e APIs.
- `index.html`: portal do aluno.
- `admin.html`: painel do instrutor/admin.
- `database.js`: camada de persistência/memória.
- `data.js`: dados dinâmicos do curso.
- Arquivos `.md`: conteúdos e avaliações antigas.
- `db_students.json`: alunos.
- `db_classes.json`: turmas.
- `db_submissions.json`: submissões.
- `db_admins.json`: admins.
- `config.json`: configurações gerais.

## Backend

Responsabilidades:

- Servir arquivos estáticos.
- Servir uploads.
- Gerar dados dinâmicos.
- Autenticar alunos.
- Autenticar admins.
- Gerenciar alunos.
- Gerenciar turmas.
- Gerenciar liberações.
- Gerenciar avaliações.
- Corrigir provas.
- Registrar submissões.
- Registrar progresso.
- Controlar presença online.

## Frontend do aluno

Responsabilidades:

- Login/cadastro.
- Exibir conteúdos liberados.
- Exibir estrutura do curso.
- Exibir progresso.
- Permitir respostas de provas.
- Enviar submissões.
- Consultar status da turma.
- Exibir histórico pessoal.

## Frontend admin

Responsabilidades:

- Login administrativo.
- Gerenciar cursos.
- Gerenciar módulos.
- Gerenciar unidades.
- Gerenciar turmas.
- Gerenciar alunos.
- Gerenciar avaliações.
- Liberar conteúdos.
- Aplicar provas.
- Ver submissões.
- Ver alunos online.
- Configurar servidor.

## Entidades

### Admin

- id
- name
- email
- password

### Aluno

- id
- name
- email
- password
- studentClass
- period
- loginTime
- recoveryRequested

### Curso

- id
- title
- description
- workload
- status
- modules

### Módulo

- id
- courseId
- title
- code
- description
- order
- units

### Unidade

- id
- moduleId
- title
- description
- contentKey
- apostilaKey
- avaliacaoKey
- videoUrl
- pdfPath
- order
- status

### Turma

- id
- name
- period
- courseId
- registrationEnabled
- releasedItems
- examConfigs
- examHistory

### Avaliação

- key
- title
- theme
- rubric
- questions

### Questão

- originalNumber
- text
- weight
- alternatives
- correctAnswer

### Alternativa

- letter
- text
- isCorrect

### Submissão

- id
- student
- examKey
- score
- correctCount
- totalCount
- gradedAnswers
- timestamp

### Progresso

- studentEmail
- completedUnits

## APIs esperadas

### Aluno

- `GET /api/classes`
- `POST /api/student/register`
- `POST /api/student/login`
- `POST /api/student/recover`
- `GET /api/status`
- `POST /api/student/submit`
- `POST /api/student/my-submissions`
- `GET /api/student/progress`
- `POST /api/student/progress`
- `GET /api/ping`
- `POST /api/student/leave`

### Admin

- `POST /api/admin/config`
- `GET /api/admin/network-info`
- `GET /api/admin/accounts`
- `POST /api/admin/accounts/create`
- `POST /api/admin/accounts/delete`
- `GET /api/admin/students`
- `POST /api/admin/student/create`
- `POST /api/admin/reset-password`
- `GET /api/admin/submissions`
- `POST /api/admin/submissions/delete`
- `POST /api/admin/release-item`
- `POST /api/admin/exam-config`
- `GET /api/admin/exam-history`
- `POST /api/admin/exam-history/add`
- `POST /api/admin/exam-history/delete`
- `POST /api/admin/server/restart`

## Convenções para evolução

- Rotas críticas devem validar admin ou aluno no backend.
- Novas entidades devem ter documentação.
- Novos botões devem ter comportamento descrito.
- Alterações de regras devem atualizar `REGRAS_DE_NEGOCIO.md`.
- Alterações de fluxo devem atualizar `FLUXOS.md`.
- Alterações de tela devem atualizar `MAPA_FUNCIONAL_LMS.md`.

## Direção futura recomendada

- Separar JavaScript do HTML.
- Criar camada de serviços para APIs.
- Criar camada de repositório para persistência.
- Migrar dados gradualmente para SQLite.
- Criar autenticação mais segura.
- Evitar expor gabarito no frontend.
- Criar testes para correção de provas e liberação de conteúdo.
