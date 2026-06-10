# Mapa Funcional do LMS

Este documento mapeia as telas, funções, botões e relações do LMS.

## Portal do Aluno

### Tela inicial
Objetivo: mostrar conteúdos liberados, progresso, histórico e navegação.

Elementos:
- Sidebar de módulos/unidades
- Campo de busca
- Card do aluno
- Botão de sair
- Botão Caderno
- Botão Foco
- Botão PDF
- Painel de progresso
- Gráfico de evolução
- Histórico de provas

### Cadastro do aluno
Campos:
- Nome
- E-mail
- Senha
- Turma

Regras:
- Turma deve existir
- Turma deve estar liberada para cadastro
- E-mail deve ser único

### Login do aluno
Campos:
- E-mail
- Senha

Ações:
- Entrar
- Criar conta
- Recuperar senha

### Conteúdo/Aula
Elementos:
- Título
- Conteúdo Markdown/HTML
- PDF
- Vídeo/link
- Marcar como concluído
- Caderno
- Modo foco

### Prova
Elementos:
- Título
- Tema
- Questões
- Alternativas
- Enviar prova
- Resultado

Regras:
- Só aparece se liberada para a turma
- Servidor valida envio
- Servidor corrige

## Painel Admin

### Login Admin
Campos:
- E-mail
- Senha

### Central Administrativa
Objetivo: preparar o ambiente antes de abrir um workspace de curso.

Elementos:
- Card de Configurações Gerais
- Lista de workspaces de curso
- Botão de sair

### Configurações Gerais
Objetivo: administrar itens globais do LMS fora do workspace de um curso.

Abas:
- Turmas
- Contas de Alunos
- Administradores
- Cursos

### Workspace do Curso
Objetivo: gerenciar conteúdo, avaliações, dúvidas, monitoramento e liberações de um curso específico.

Abas:
- Monitor Geral
- Controle de Liberação
- Dúvidas / Fórum
- Editor de Conteúdo

### Dashboard
Elementos:
- Total de alunos
- Alunos online
- Turmas
- Provas liberadas
- Submissões
- Link/IP do servidor

### Cursos
Botões:
- Novo curso
- Editar
- Excluir
- Duplicar
- Abrir módulos
- Salvar
- Cancelar

### Módulos
Botões:
- Novo módulo
- Editar
- Excluir
- Reordenar
- Abrir unidades

### Unidades/Aulas
Botões:
- Nova unidade
- Editar
- Excluir
- Salvar
- Visualizar como aluno
- Vincular avaliação
- Reordenar

### Turmas
Botões:
- Nova turma
- Editar
- Excluir
- Liberar cadastro
- Bloquear cadastro
- Abrir alunos
- Abrir liberação de conteúdo
- Abrir aplicação de prova

### Alunos
Botões:
- Novo aluno
- Editar
- Excluir
- Resetar senha
- Mover de turma
- Ver progresso
- Ver submissões

### Avaliações
Botões:
- Nova avaliação
- Importar Markdown
- Salvar
- Editar questão
- Excluir questão
- Duplicar avaliação
- Gerar prova online
- Gerar prova impressa
- Visualizar gabarito

### Aplicação de prova em tempo real
Botões:
- Configurar prova
- Liberar prova
- Bloquear prova
- Encerrar prova
- Atualizar submissões
- Ver resultado

### Liberação de conteúdo
Botões:
- Liberar item
- Bloquear item
- Configurar prova da unidade
- Liberar módulo inteiro
- Bloquear módulo inteiro
- Liberar todas as apostilas
- Bloquear todas as avaliações

### Submissões
Botões:
- Ver detalhes
- Excluir submissão
- Exportar relatório
- Imprimir

### Contas administrativas
Botões:
- Novo admin
- Excluir admin
- Alterar senha
