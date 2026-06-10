# Regras de Negócio do LMS

## Regras gerais

- O LMS é local-first.
- O admin é a autoridade principal.
- O aluno só acessa conteúdos e avaliações permitidos para sua turma.
- Toda validação crítica deve acontecer no servidor.
- O frontend não deve ser a única camada de segurança.

## Admin

- Precisa fazer login.
- Credenciais são validadas no backend.
- A listagem de admins nunca retorna senhas.
- Um admin não pode excluir a própria conta.
- O sistema não pode excluir o último admin.

## Aluno

- Precisa de e-mail e senha.
- E-mail deve ser único.
- Pertence a uma turma.
- Pode solicitar recuperação de senha.
- Não pode alterar a própria turma sem admin.

## Curso

- Curso representa uma trilha de aprendizagem.
- Curso possui módulos.
- Curso pode estar vinculado a turmas.

## Módulo

- Módulo pertence a um curso.
- Módulo possui unidades.
- Reordenar módulo não apaga progresso.

## Unidade/Aula

- Unidade pertence a módulo.
- Pode ter conteúdo, PDF, vídeo e avaliação.
- Progresso é registrado por unidade.

## Turma

- Turma possui alunos.
- Turma pode estar vinculada a curso.
- Turma controla `releasedItems`.
- Turma controla `examConfigs`.
- Turma pode possuir `examHistory`.
- Apenas turmas com `registrationEnabled = true` aparecem para cadastro.

## Liberação em tempo real

- Liberação é por turma.
- Conteúdo bloqueado não deve ser acessível.
- Avaliações começam bloqueadas por segurança.
- Alterações devem refletir rapidamente no portal do aluno.

## Avaliação/Prova

- Avaliação possui título, tema, questões e alternativas.
- Gabarito não deve ser exposto ao aluno.
- Servidor é a fonte de verdade da correção.
- Prova só pode ser enviada se estiver liberada.

## Submissão

- Pertence a aluno e avaliação.
- Registra pontuação, acertos, total, respostas corrigidas e data.
- No sistema antigo, nova submissão do mesmo aluno/prova substitui anterior.

## Segurança

- Não confiar no frontend para autorização.
- Validar turma e liberação no servidor.
- Não retornar senhas em APIs.
- Evitar senhas em texto puro em versões futuras.
