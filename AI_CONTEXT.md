# AI_CONTEXT — LMS Professor Alan Marciano

Este projeto é um LMS local para uso em sala de aula.

O sistema deve rodar no computador do professor/admin e permitir que alunos acessem o conteúdo pela rede local.

## Objetivo principal

Criar um app LMS com:

- Painel Admin/Instrutor
- Portal do Aluno
- Cadastro de cursos
- Cadastro de módulos
- Cadastro de unidades/aulas
- Cadastro de alunos
- Cadastro de turmas
- Banco de avaliações
- Liberação de conteúdos em tempo real
- Aplicação de provas em tempo real
- Correção automática no servidor
- Histórico de submissões
- Progresso do aluno

## Regra principal para qualquer IA/Codex

Antes de alterar qualquer tela, rota, banco de dados, estrutura de arquivos ou regra de negócio, consulte este arquivo e os documentos da pasta `/docs`.

A IA deve preservar a lógica central:

- O admin controla cursos, turmas, alunos, conteúdos, avaliações e liberações.
- O aluno só vê conteúdos liberados para sua turma.
- Provas só podem ser feitas se estiverem liberadas para a turma do aluno.
- A correção da prova deve acontecer no servidor.
- O frontend nunca deve ser a única fonte de validação.
- O sistema deve funcionar localmente, em rede local, sem depender obrigatoriamente da internet.
- Alterações devem ser pequenas, explicáveis e compatíveis com a base antiga sempre que possível.

## Áreas do sistema

### Portal do Aluno

Arquivo base antigo: `index.html`.

Funções esperadas:

- Login do aluno
- Cadastro do aluno
- Recuperação de senha
- Visualização de aulas, apostilas e conteúdos liberados
- Realização de provas liberadas
- Histórico de notas
- Progresso do aluno
- Caderno de anotações
- Modo foco
- Busca de aulas ou missões

### Painel Admin/Instrutor

Arquivo base antigo: `admin.html`.

Funções esperadas:

- Login administrativo
- Gerenciar cursos
- Gerenciar módulos
- Gerenciar unidades/aulas
- Gerenciar alunos
- Gerenciar turmas
- Gerenciar avaliações
- Liberar conteúdos em tempo real
- Liberar provas em tempo real
- Ver alunos online
- Ver submissões e resultados
- Resetar senha de aluno
- Gerenciar contas administrativas
- Ver link/IP do servidor local
- Reiniciar servidor local quando necessário

## Entidades principais

- Admin
- Aluno
- Curso
- Módulo
- Unidade/Aula
- Turma
- Avaliação
- Questão
- Alternativa
- Submissão
- Progresso
- Liberação de conteúdo
- Configuração de prova

## Fluxo principal do Admin

1. Admin faz login.
2. Cria ou seleciona um curso.
3. Cria módulos do curso.
4. Cria unidades/aulas dentro dos módulos.
5. Cria ou importa avaliações.
6. Cria turmas.
7. Cadastra alunos ou libera cadastro de alunos.
8. Libera conteúdos conforme a aula avança.
9. Libera provas em tempo real.
10. Acompanha alunos online, submissões e resultados.

## Fluxo principal do Aluno

1. Aluno acessa o portal.
2. Faz cadastro ou login.
3. Visualiza apenas conteúdos liberados para sua turma.
4. Estuda a unidade/aula.
5. Marca progresso.
6. Realiza prova liberada.
7. Envia respostas.
8. Recebe resultado.
9. Consulta histórico e evolução.

## Regras críticas

- Uma Turma possui Alunos.
- Uma Turma pode estar vinculada a um Curso.
- Um Curso possui Módulos.
- Um Módulo possui Unidades/Aulas.
- Uma Unidade pode possuir apostila, conteúdo, PDF, vídeo e avaliação.
- Uma Turma controla `releasedItems`.
- Uma Turma controla `examConfigs`.
- Uma Turma pode possuir `examHistory`.
- Uma Avaliação possui Questões.
- Uma Questão possui Alternativas.
- Uma Alternativa pode ser correta.
- Uma Submissão pertence a um Aluno e a uma Avaliação.
- O servidor deve validar se a prova está liberada antes de aceitar envio.
- O servidor deve corrigir a prova.
- O admin pode liberar ou bloquear conteúdo em tempo real.

## Instruções de implementação para Codex

Ao trabalhar neste projeto:

1. Leia este arquivo primeiro.
2. Leia os arquivos em `/docs`.
3. Analise a estrutura existente antes de alterar.
4. Preserve funcionalidades já existentes.
5. Não remova rotas antigas sem justificar.
6. Não mude regras de negócio sem atualizar a documentação.
7. Prefira commits pequenos e lógicos.
8. Depois de alterar, explique o que mudou e como testar.

## Prioridades da nova evolução

1. Formalizar cadastro de cursos.
2. Formalizar cadastro de módulos.
3. Formalizar cadastro de unidades/aulas.
4. Manter liberação de conteúdo por turma.
5. Melhorar aplicação de provas em tempo real.
6. Melhorar painel de resultados.
7. Melhorar progresso do aluno.
8. Manter funcionamento local em rede.