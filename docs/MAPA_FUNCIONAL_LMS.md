# Mapa Funcional do LMS

Este documento mapeia as telas, funções, botões e relações do LMS. Deve ser usado como referência por humanos e por IA/Codex antes de qualquer alteração no sistema.

## 1. Visão geral

O sistema é um LMS local para professor/instrutor administrar cursos, turmas, alunos, conteúdos e avaliações em tempo real.

Áreas principais:

- Portal do Aluno
- Painel Admin/Instrutor
- Servidor/API local
- Banco de dados local
- Sistema de liberação em tempo real
- Sistema de provas e correção automática

## 2. Portal do Aluno

Arquivo de referência antigo: `index.html`.

### 2.1 Tela inicial do aluno

Objetivo:

- Receber o aluno após login.
- Mostrar progresso.
- Mostrar módulos/unidades disponíveis.
- Mostrar histórico de avaliações quando existir.

Elementos:

- Saudação do aluno.
- Card de perfil do aluno.
- Sidebar com módulos e unidades.
- Campo de busca.
- Painel de progresso.
- Indicadores de unidades concluídas.
- Gráfico de evolução de notas.
- Histórico de provas concluídas.

Botões:

- Sair da conta.
- Caderno.
- Foco.
- PDF.
- Abrir unidade.
- Abrir avaliação.
- Marcar unidade como concluída.

Relações:

- Aluno pertence a uma Turma.
- Turma define conteúdos liberados.
- Aluno possui progresso individual.
- Aluno possui submissões de provas.

### 2.2 Tela de cadastro do aluno

Objetivo:

- Permitir que o aluno crie uma conta em uma turma liberada pelo admin.

Campos:

- Nome.
- E-mail.
- Senha.
- Turma.

Botões:

- Cadastrar.
- Voltar para login.

Regras:

- A turma precisa existir.
- A turma precisa estar com cadastro liberado.
- O e-mail não pode estar duplicado.
- Todos os campos são obrigatórios.

### 2.3 Tela de login do aluno

Objetivo:

- Permitir autenticação do aluno.

Campos:

- E-mail.
- Senha.

Botões:

- Entrar.
- Criar conta.
- Esqueci minha senha.

Regras:

- Login válido retorna dados do aluno sem senha.
- O sistema registra horário de login.
- O aluno passa a enviar ping para presença online.

### 2.4 Tela de recuperação de senha

Objetivo:

- Permitir que o aluno solicite redefinição de senha ao instrutor.

Campos:

- E-mail.

Botões:

- Solicitar recuperação.
- Voltar.

Regras:

- O sistema marca `recoveryRequested = true` para o aluno.
- O admin redefine a senha no painel administrativo.

### 2.5 Tela de conteúdo/aula/apostila

Objetivo:

- Exibir conteúdo didático ao aluno.

Elementos:

- Título da unidade.
- Conteúdo em Markdown/HTML.
- Material PDF, quando existir.
- Vídeo/link externo, quando existir.
- Botão de progresso.
- Botão de exportar PDF quando aplicável.
- Modo foco.
- Caderno de anotações.

Botões:

- Marcar como concluído.
- Abrir PDF.
- Exportar PDF.
- Ativar/desativar modo foco.
- Abrir caderno.

Relações:

- Unidade pertence a um Módulo.
- Módulo pertence a um Curso.
- Turma controla se a unidade/apostila está liberada.
- Aluno controla se concluiu a unidade.

### 2.6 Tela de prova do aluno

Objetivo:

- Permitir responder uma avaliação liberada.

Elementos:

- Título da avaliação.
- Tema.
- Questões.
- Alternativas.
- Indicador de progresso da prova.
- Resultado após envio.

Botões:

- Selecionar alternativa.
- Enviar prova.
- Confirmar envio.
- Voltar ao conteúdo.

Regras:

- Prova só aparece se estiver liberada para a turma.
- O envio deve ser validado no servidor.
- O servidor corrige a prova.
- O aluno recebe pontuação, acertos e total de questões.

## 3. Painel Admin/Instrutor

Arquivo de referência antigo: `admin.html`.

### 3.1 Tela de login administrativo

Objetivo:

- Proteger o painel do instrutor.

Campos:

- E-mail.
- Senha.

Botões:

- Entrar.

Regras:

- Validar credenciais contra administradores cadastrados.
- Não permitir acesso sem autenticação.

### 3.2 Dashboard admin

Objetivo:

- Mostrar visão geral do ambiente local.

Elementos sugeridos:

- Total de alunos.
- Alunos online.
- Total de turmas.
- Provas liberadas.
- Submissões recebidas.
- Link do servidor local.
- IPs disponíveis.

Botões:

- Copiar link para alunos.
- Atualizar status.
- Reiniciar servidor.

### 3.3 Tela de cursos

Objetivo:

- Criar e administrar cursos.

Campos:

- Nome do curso.
- Descrição.
- Carga horária.
- Capa/imagem.
- Status.

Botões:

- Novo curso.
- Editar.
- Excluir.
- Duplicar.
- Abrir módulos.
- Salvar.
- Cancelar.

Relações:

- Curso possui muitos módulos.
- Curso pode estar associado a muitas turmas.

### 3.4 Tela de módulos

Objetivo:

- Criar e organizar módulos dentro de um curso.

Campos:

- Nome do módulo.
- Código.
- Descrição.
- Ordem.
- Ícone/cor.

Botões:

- Novo módulo.
- Editar módulo.
- Excluir módulo.
- Reordenar.
- Abrir unidades.

Relações:

- Módulo pertence a um curso.
- Módulo possui várias unidades.

### 3.5 Tela de unidades/aulas

Objetivo:

- Criar aulas, conteúdos, apostilas e vínculos com avaliações.

Campos:

- Título.
- Descrição.
- Conteúdo Markdown.
- Link de vídeo.
- Upload de PDF.
- Chave da apostila.
- Chave da avaliação.
- Ordem.
- Status.

Botões:

- Nova unidade.
- Editar.
- Excluir.
- Salvar.
- Visualizar como aluno.
- Vincular avaliação.
- Reordenar.

Relações:

- Unidade pertence a um módulo.
- Unidade pode ter apostila.
- Unidade pode ter avaliação.
- Turma controla liberação da unidade/apostila/avaliação.

### 3.6 Tela de turmas

Objetivo:

- Administrar turmas de alunos.

Campos:

- Nome da turma.
- Período.
- Curso vinculado.
- Cadastro liberado.
- Status.

Botões:

- Nova turma.
- Editar.
- Excluir.
- Liberar cadastro.
- Bloquear cadastro.
- Abrir alunos.
- Abrir liberação de conteúdo.
- Abrir aplicação de prova.

Relações:

- Turma possui alunos.
- Turma pode estar vinculada a curso.
- Turma possui `releasedItems`.
- Turma possui `examConfigs`.
- Turma possui `examHistory`.

### 3.7 Tela de alunos

Objetivo:

- Gerenciar alunos cadastrados.

Campos:

- Nome.
- E-mail.
- Senha.
- Turma.
- Período.
- Status online.
- Recuperação solicitada.
- Último login.

Botões:

- Novo aluno.
- Editar.
- Excluir.
- Resetar senha.
- Mover de turma.
- Ver progresso.
- Ver submissões.

Relações:

- Aluno pertence a uma turma.
- Aluno possui progresso.
- Aluno possui submissões.

### 3.8 Tela de avaliações/banco de questões

Objetivo:

- Criar, importar, editar e gerenciar avaliações.

Campos:

- Título.
- Tema.
- Rubrica.
- Questões.
- Alternativas.
- Resposta correta.
- Peso.
- Chave da avaliação.

Botões:

- Nova avaliação.
- Importar Markdown.
- Salvar.
- Editar questão.
- Excluir questão.
- Duplicar avaliação.
- Gerar prova online.
- Gerar prova impressa.
- Visualizar gabarito.

Relações:

- Avaliação pode estar ligada a uma unidade.
- Avaliação possui questões.
- Questão possui alternativas.
- Avaliação gera submissões.

### 3.9 Tela de aplicação de prova em tempo real

Objetivo:

- Permitir que o professor libere e acompanhe provas durante a aula.

Elementos:

- Seleção de turma.
- Seleção de avaliação.
- Quantidade de questões.
- Questões excluídas.
- Alunos online.
- Submissões recebidas.
- Status da prova.

Botões:

- Configurar prova.
- Liberar prova.
- Bloquear prova.
- Encerrar prova.
- Atualizar submissões.
- Ver resultado.

Regras:

- Liberação é por turma.
- Configuração é por turma e avaliação.
- O aluno só responde se estiver liberado.
- O servidor corrige e registra submissão.

### 3.10 Tela de liberação de conteúdo

Objetivo:

- Controlar em tempo real o que cada turma pode acessar.

Elementos:

- Seleção de turma.
- Lista de cursos/módulos/unidades.
- Indicador liberado/bloqueado por item.

Botões:

- Liberar item.
- Bloquear item.
- Liberar módulo inteiro.
- Bloquear módulo inteiro.
- Liberar todas as apostilas.
- Bloquear todas as avaliações.

Regras:

- Cada turma possui seu próprio mapa `releasedItems`.
- Apostilas podem ser liberadas por padrão.
- Avaliações devem começar bloqueadas por segurança.

### 3.11 Tela de submissões/resultados

Objetivo:

- Exibir provas entregues e resultados.

Elementos:

- Lista de submissões.
- Filtro por turma.
- Filtro por avaliação.
- Filtro por aluno.
- Nota.
- Acertos.
- Total de questões.
- Data/hora.
- Detalhamento por questão.

Botões:

- Ver detalhes.
- Excluir submissão.
- Exportar relatório.
- Imprimir.

### 3.12 Tela de contas administrativas

Objetivo:

- Gerenciar contas de administradores/instrutores.

Campos:

- Nome.
- E-mail.
- Senha.

Botões:

- Novo admin.
- Excluir admin.
- Alterar senha.

Regras:

- Não exibir senhas ao listar admins.
- Não permitir excluir a própria conta logada.
- Não permitir excluir o último admin.

## 4. Observações para o Codex

- Não tratar este documento como opcional.
- Ao criar nova tela, atualizar este mapa.
- Ao criar novo botão, documentar ação, regra e relação.
- Ao alterar uma entidade, atualizar documentação de regras e arquitetura.
- Ao alterar fluxo de prova ou liberação, garantir validação no servidor.