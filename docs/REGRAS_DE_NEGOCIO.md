# Regras de Negócio do LMS

Este documento define as regras centrais do LMS. Qualquer alteração no sistema deve respeitar estas regras ou atualizar este documento com justificativa.

## 1. Regras gerais

- O LMS é local-first: deve funcionar no computador do professor/admin e na rede local.
- O sistema pode usar internet para bibliotecas ou recursos auxiliares, mas o funcionamento principal não deve depender obrigatoriamente dela.
- O admin/instrutor é a autoridade principal do sistema.
- O aluno só acessa conteúdos e avaliações permitidos para sua turma.
- Toda validação crítica deve acontecer no servidor.
- O frontend pode esconder botões e telas, mas nunca deve ser a única camada de segurança.

## 2. Regras de autenticação

### 2.1 Admin

- O admin precisa fazer login para acessar o painel administrativo.
- Credenciais administrativas devem ser validadas no backend.
- A listagem de administradores nunca deve retornar senhas.
- Um admin não deve conseguir excluir a própria conta conectada.
- O sistema não deve permitir excluir o último administrador.

### 2.2 Aluno

- O aluno precisa de e-mail e senha para acessar o portal.
- O e-mail do aluno deve ser único.
- O aluno pertence a uma turma.
- O login do aluno deve retornar dados seguros, sem senha.
- O aluno pode solicitar recuperação de senha.
- A recuperação de senha deve gerar solicitação para o admin/instrutor resolver.

## 3. Regras de curso

- Um curso representa uma trilha de aprendizagem.
- Um curso pode conter vários módulos.
- Um curso pode estar vinculado a uma ou mais turmas.
- Um curso pode ter status ativo, inativo ou arquivado.
- Um curso não deve ser removido se houver turmas ativas dependentes, salvo se houver confirmação explícita e migração/arquivamento.

## 4. Regras de módulo

- Um módulo pertence a um curso.
- Um módulo possui uma ordem dentro do curso.
- Um módulo pode possuir várias unidades/aulas.
- Reordenar módulos não deve apagar progresso dos alunos.
- Excluir módulo deve exigir cuidado se houver unidades, avaliações ou progresso vinculado.

## 5. Regras de unidade/aula

- Uma unidade pertence a um módulo.
- Uma unidade pode possuir conteúdo Markdown/HTML.
- Uma unidade pode possuir apostila, PDF, vídeo ou links complementares.
- Uma unidade pode estar vinculada a uma avaliação.
- Progresso do aluno é registrado por unidade.
- Bloquear uma unidade deve impedir acesso pelo aluno, mesmo que ele conheça a URL ou chave interna.

## 6. Regras de turma

- Uma turma possui alunos.
- Uma turma pode estar vinculada a um curso.
- Uma turma possui período, nome e status.
- Uma turma pode liberar ou bloquear cadastro de novos alunos.
- Apenas turmas com `registrationEnabled = true` aparecem para cadastro público do aluno.
- Cada turma possui seu próprio mapa de conteúdos liberados (`releasedItems`).
- Cada turma possui suas próprias configurações de prova (`examConfigs`).
- Cada turma pode possuir histórico de provas geradas/aplicadas (`examHistory`).

## 7. Regras de aluno

- O aluno pertence obrigatoriamente a uma turma.
- O aluno possui progresso individual.
- O aluno pode ter submissões de avaliações.
- O aluno pode aparecer como online quando envia ping recente ao servidor.
- O status online é temporário e deve expirar quando o aluno para de enviar ping.
- O aluno não pode alterar sua própria turma sem ação do admin.

## 8. Regras de liberação de conteúdo em tempo real

- A liberação é feita por turma.
- O admin pode liberar ou bloquear apostilas, unidades e avaliações.
- O portal do aluno deve consultar o status da turma periodicamente ou sob demanda.
- Conteúdo bloqueado não deve ser acessível pelo aluno.
- Avaliações devem começar bloqueadas por padrão.
- Apostilas podem começar liberadas por padrão, se essa for a configuração pedagógica desejada.
- Alterações em `releasedItems` devem surtir efeito rapidamente no portal do aluno.

## 9. Regras de avaliação/prova

- Uma avaliação possui título, tema, questões e alternativas.
- Cada questão deve possuir número original, texto, alternativas e resposta correta.
- A resposta correta não deve ser exposta ao aluno antes ou durante a prova.
- O frontend não deve conter gabarito acessível ao aluno.
- O servidor deve ser a fonte de verdade para correção.
- Uma prova só pode ser enviada se estiver liberada para a turma do aluno.
- O servidor deve recusar submissão de prova bloqueada.
- A configuração de prova pode variar por turma.
- A configuração pode incluir quantidade de questões e questões excluídas.

## 10. Regras de aplicação de prova em tempo real

- O admin seleciona turma e avaliação.
- O admin define configurações da prova quando necessário.
- O admin libera a prova para a turma.
- Alunos da turma passam a visualizar a prova.
- Alunos de outras turmas não devem visualizar a prova.
- O admin pode bloquear ou encerrar a prova.
- O sistema deve registrar submissões recebidas.
- O sistema deve permitir acompanhar resultados por aluno, turma e avaliação.

## 11. Regras de submissão

- Uma submissão pertence a um aluno e a uma avaliação.
- Uma submissão registra data/hora.
- Uma submissão registra pontuação, acertos e total de questões.
- Uma submissão registra respostas corrigidas.
- Se o sistema permitir apenas uma tentativa, uma nova submissão do mesmo aluno para a mesma avaliação deve substituir a anterior ou ser bloqueada, conforme configuração.
- No projeto antigo, submissões anteriores do mesmo aluno para a mesma prova são substituídas.

## 12. Regras de progresso

- O progresso pertence ao aluno.
- O progresso deve ser salvo por e-mail ou identificador estável do aluno.
- O progresso deve indicar unidades concluídas.
- O progresso não deve ser apagado ao reordenar módulos ou unidades.
- Alterações estruturais no curso devem tentar preservar progresso existente.

## 13. Regras de relatórios

- O admin deve conseguir ver submissões por turma, aluno e avaliação.
- O admin deve conseguir exportar ou imprimir relatórios futuramente.
- O aluno deve ver apenas seu próprio histórico.
- O aluno não deve ver notas de outros alunos.

## 14. Regras de segurança

- Não confiar em dados enviados pelo frontend para autorizar prova ou conteúdo.
- Validar turma do aluno no servidor.
- Validar liberação da avaliação no servidor.
- Não enviar gabarito para o frontend durante a prova.
- Não retornar senhas em APIs.
- Evitar armazenar senhas em texto puro em versões futuras.
- Registrar erros sem expor detalhes sensíveis ao usuário.

## 15. Regras para evolução do sistema

- Ao criar nova entidade, documentar em `docs/ARQUITETURA.md`.
- Ao criar novo fluxo, documentar em `docs/FLUXOS.md`.
- Ao criar nova tela ou botão, documentar em `docs/MAPA_FUNCIONAL_LMS.md`.
- Ao alterar regra pedagógica, atualizar este arquivo.
- O Codex deve explicar alterações feitas e como testá-las.