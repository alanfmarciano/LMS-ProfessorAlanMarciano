# Fluxos do LMS

## 1. Fluxo de cadastro do aluno

1. Aluno abre o portal.
2. Clica em criar conta.
3. Sistema busca turmas com cadastro liberado.
4. Aluno informa nome, e-mail, senha e turma.
5. Backend valida campos.
6. Backend valida se turma existe e está liberada.
7. Backend valida se e-mail não existe.
8. Backend salva aluno.
9. Aluno pode fazer login.

## 2. Fluxo de login do aluno

1. Aluno informa e-mail e senha.
2. Backend valida credenciais.
3. Backend registra loginTime.
4. Backend retorna dados seguros do aluno.
5. Frontend salva sessão local.
6. Portal carrega conteúdos permitidos.
7. Aluno começa a enviar ping de presença.

## 3. Fluxo de recuperação de senha

1. Aluno informa e-mail.
2. Backend verifica se e-mail existe.
3. Backend marca `recoveryRequested = true`.
4. Admin vê solicitação no painel.
5. Admin define nova senha.
6. Backend atualiza senha e limpa solicitação.

## 4. Fluxo de criação de curso

1. Admin entra no painel.
2. Abre Cursos.
3. Clica em Novo Curso.
4. Preenche nome, descrição, carga horária e status.
5. Clica em Salvar.
6. Backend salva curso.
7. Curso fica disponível para receber módulos.

## 5. Fluxo de criação de módulo

1. Admin abre um curso.
2. Clica em Novo Módulo.
3. Preenche nome, código, descrição e ordem.
4. Clica em Salvar.
5. Backend vincula módulo ao curso.
6. Módulo fica disponível para receber unidades.

## 6. Fluxo de criação de unidade/aula

1. Admin abre um módulo.
2. Clica em Nova Unidade.
3. Preenche título, descrição e conteúdo.
4. Opcionalmente adiciona PDF, vídeo e avaliação.
5. Clica em Salvar.
6. Backend vincula unidade ao módulo.
7. Unidade aparece na estrutura do curso.
8. Visibilidade para aluno depende da liberação por turma.

## 7. Fluxo de criação de turma

1. Admin abre Turmas.
2. Clica em Nova Turma.
3. Preenche nome, período e curso vinculado.
4. Define cadastro liberado ou bloqueado.
5. Clica em Salvar.
6. Backend cria turma.
7. Turma passa a controlar alunos, liberações e provas.

## 8. Fluxo de cadastro manual de aluno pelo admin

1. Admin abre Alunos.
2. Clica em Novo Aluno.
3. Informa nome, e-mail, senha e turma.
4. Backend valida turma.
5. Backend valida e-mail único.
6. Backend salva aluno.

## 9. Fluxo de liberação de conteúdo em tempo real

1. Admin abre Liberação de Conteúdo.
2. Seleciona turma.
3. Sistema carrega módulos, unidades, apostilas e avaliações.
4. Admin escolhe item.
5. Admin clica em Liberar ou Bloquear.
6. Backend atualiza `releasedItems` da turma.
7. Portal do aluno consulta `/api/status`.
8. Conteúdo aparece ou desaparece para alunos da turma.

## 10. Fluxo de criação/importação de avaliação

1. Admin abre Avaliações.
2. Clica em Nova Avaliação ou Importar Markdown.
3. Sistema lê título, tema, questões, alternativas e gabarito.
4. Admin revisa questões.
5. Admin salva.
6. Avaliação fica disponível para vínculo com unidade e aplicação.

## 11. Fluxo de configuração de prova

1. Admin abre Aplicação de Prova.
2. Seleciona turma.
3. Seleciona avaliação.
4. Define quantidade de questões.
5. Define questões excluídas, se necessário.
6. Salva configuração.
7. Backend atualiza `examConfigs` da turma.

## 12. Fluxo de aplicação de prova em tempo real

1. Admin seleciona turma e avaliação.
2. Admin confirma configurações.
3. Admin clica em Liberar Prova.
4. Backend marca avaliação como liberada em `releasedItems`.
5. Alunos da turma consultam status.
6. Prova aparece no portal.
7. Alunos respondem.
8. Alunos enviam prova.
9. Backend valida liberação.
10. Backend corrige.
11. Backend salva submissão.
12. Admin acompanha resultados.

## 13. Fluxo de correção automática

1. Backend recebe student, examKey e answers.
2. Backend verifica se aluno possui turma.
3. Backend busca turma.
4. Backend verifica se avaliação está liberada.
5. Backend busca questões estruturadas ou prova Markdown.
6. Backend compara respostas com gabarito.
7. Backend calcula acertos e nota.
8. Backend monta gradedAnswers.
9. Backend salva submissão.
10. Backend retorna resultado.

## 14. Fluxo de progresso do aluno

1. Aluno conclui unidade.
2. Frontend atualiza completedUnits.
3. Frontend envia progresso ao backend.
4. Backend salva progresso por e-mail.
5. Portal atualiza barras e percentual.
6. Admin pode futuramente consultar progresso.

## 15. Fluxo de submissões/resultados

1. Admin abre Submissões.
2. Backend retorna lista de submissões.
3. Admin filtra por turma, aluno ou avaliação.
4. Admin abre detalhes.
5. Sistema mostra respostas, acertos, erros e nota.
6. Admin pode excluir registro se necessário.

## 16. Fluxo de presença online

1. Aluno logado envia ping periodicamente.
2. Backend registra timestamp da sessão.
3. Admin abre lista de alunos.
4. Backend compara timestamp atual com último ping.
5. Aluno aparece online se ping for recente.
6. Ao sair, aluno envia beacon de saída.
