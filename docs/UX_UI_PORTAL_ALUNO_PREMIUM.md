# UX/UI Portal do Aluno Premium — LMS 4.0

## Objetivo deste documento

Este documento define a nova experiência visual e funcional do **Portal do Aluno** do LMS 4.0.

Ele deve ser usado pelo Antigravity junto com os arquivos de contexto do projeto, especialmente:

- `AI_CONTEXT.md`
- `ARQUITETURA.md`
- `REGRAS_DE_NEGOCIO.md`
- `FLUXOS.md`
- `MAPA_FUNCIONAL_LMS.md`

A função deste arquivo é orientar a criação de uma experiência de aluno mais profissional, moderna, clara e completa, sem quebrar as regras atuais do LMS.

O objetivo é transformar o Portal do Aluno em uma interface de alto nível, com aparência de produto SaaS educacional premium, mantendo a identidade do LMS 4.0 e respeitando a arquitetura local-first do sistema.

---

## Princípio principal

O Portal do Aluno não deve parecer apenas uma página simples com conteúdos liberados.

Ele deve parecer um **ambiente acadêmico completo**, onde o aluno consegue entender rapidamente:

- quais cursos possui;
- em qual turma está;
- qual aula deve continuar;
- qual é seu progresso;
- sua frequência;
- suas faltas;
- suas avaliações;
- suas próximas aulas;
- suas atividades recentes;
- quais conteúdos estão liberados;
- quais conteúdos ainda estão bloqueados;
- onde acessar caderno, foco, PDF, materiais e suporte.

A interface deve ser bonita, mas acima de tudo **funcional, clara e útil**.

---

## Escopo da implementação

Criar ou reformular duas telas principais do aluno:

1. **Página Meus Cursos**
   - Dashboard de cursos do aluno.
   - Tela exibida após login ou ao trocar de curso.

2. **Página Painel do Curso**
   - Dashboard interno do curso selecionado.
   - Tela exibida depois que o aluno entra em um curso.

Essas telas devem substituir a experiência simples atual por uma experiência mais profissional e completa.

---

# 1. Página Meus Cursos

## Objetivo da tela

A tela **Meus Cursos** deve funcionar como a central inicial do aluno.

Ela não deve ser apenas uma seleção de curso. Deve ser um painel com visão geral da vida acadêmica do aluno, exibindo cursos, progresso, próximas atividades e atalhos úteis.

---

## Layout esperado

A tela deve conter:

- Sidebar principal do aluno.
- Topbar com busca, notificações e perfil.
- Cabeçalho de boas-vindas.
- Cards de resumo acadêmico.
- Busca e filtros de cursos.
- Grid de cards de cursos.
- Ações rápidas.
- Atividade recente.
- Bloco de engajamento/consistência.

---

## Sidebar principal do aluno

A sidebar deve ser profissional, clara e consistente.

### Itens sugeridos

- Início
- Meus Cursos
- Calendário
- Atividades
- Mensagens
- Notas
- Certificados
- Biblioteca
- Suporte

A opção **Meus Cursos** deve aparecer como ativa.

### Requisitos visuais

- Logo `LMS4.0` no topo.
- Ícones consistentes para cada item.
- Item ativo com destaque visual.
- Boa separação entre grupos de navegação.
- Opção de recolher menu, se fizer sentido no projeto.
- Não deixar a sidebar visualmente vazia.

### Observação

Se o projeto atual ainda não possuir todas essas páginas, os itens podem ser criados como navegação visual ou placeholders funcionais, sem quebrar o sistema existente.

---

## Topbar

A topbar deve trazer contexto e ações globais.

### Elementos esperados

- Breadcrumb ou indicação da página atual.
- Campo ou ícone de busca.
- Ícone de notificações.
- Avatar do aluno.
- Nome do aluno.
- Perfil do usuário: `Estudante`.
- Dropdown ou indicador visual de conta.

### Exemplo

```txt
Meus Cursos                      🔍   🔔   AL Alan — Estudante
```

---

## Cabeçalho da página

Adicionar uma área de destaque com:

```txt
Seus Cursos
Acompanhe seu progresso e continue aprendendo.
```

Também pode conter uma ilustração acadêmica discreta ou ícone premium, desde que não polua a interface.

---

## Cards de resumo acadêmico

Adicionar cards com métricas úteis para o aluno.

### Cards sugeridos

1. **Cursos ativos**
   - Exemplo: `3`
   - Texto auxiliar: `Em andamento`

2. **Progresso médio**
   - Exemplo: `62%`
   - Texto auxiliar: `+12% este mês`

3. **Próxima atividade**
   - Exemplo: `Aula 4 • Fundamentos de Redes`
   - Texto auxiliar: `Hoje, 19:30`

4. **Horas de estudo**
   - Exemplo: `24h 30m`
   - Texto auxiliar: `+4h esta semana`

### Requisitos

- Cada card deve ter ícone.
- Número ou informação principal deve ter destaque.
- Texto secundário deve ser legível.
- Visual deve ser consistente com o dark theme.

---

## Busca e filtros de cursos

Criar área com:

- Campo `Buscar cursos`.
- Filtro por status.
- Filtro por turno.
- Ordenação, por exemplo `Mais recentes`.
- Alternância grid/lista, se fizer sentido.

Exemplo:

```txt
[Buscar cursos...] [Status: Todos] [Turno: Todos] [Mais recentes] [Grid/List]
```

---

## Grid de cursos

A página deve mostrar os cursos como cards premium.

### Cada card deve conter

- Badge ou ícone do curso.
- Nome do curso.
- Turma.
- Turno.
- Status.
- Barra de progresso.
- Percentual de progresso.
- Próxima atividade.
- Data/horário da próxima atividade.
- Botão principal `Continuar curso`.

### Card principal obrigatório

Usar este curso como exemplo principal:

```txt
Curso Técnico em TI (Legado)
Turma 1DES
Turno Tarde
Status: Em andamento
Progresso: 75%
Próxima atividade: Aula 4 • Fundamentos de Redes
Horário: Hoje, 19:30
Botão: Continuar curso
```

### Outros cards simulados

Criar cards adicionais para a tela não parecer vazia:

```txt
Desenvolvimento Web com JavaScript
Turma 1MDS
Turno Manhã
Status: Em andamento
Progresso: 45%
Próxima atividade: Projeto 2 • Interatividade
Horário: Amanhã, 10:00
```

```txt
Banco de Dados e SQL
Turma 1NDB
Turno Noite
Status: Em dia
Progresso: 28%
Próxima atividade: Aula 3 • Consultas Avançadas
Horário: Sex, 20:00
```

---

## Ações rápidas

Criar uma seção de ações rápidas para facilitar o acesso às funções importantes.

### Ações sugeridas

- Ver calendário
- Minhas atividades
- Notas e desempenho
- Biblioteca

Cada ação deve conter:

- ícone;
- título;
- pequena descrição;
- seta ou indicador de clique.

Exemplo:

```txt
Ver calendário
Confira suas aulas e prazos
```

---

## Atividade recente

Criar feed com ações recentes do aluno.

### Exemplos

```txt
Você concluiu a Aula 3 — Fundamentos de Hardware
Hoje, 14:32
```

```txt
Nova atividade disponível — Checklist - Projeto 2
Hoje, 09:15
```

```txt
Material baixado — Resumo da aula
Ontem, 21:10
```

---

## Bloco de engajamento

Adicionar bloco de incentivo para reforçar continuidade.

Exemplo:

```txt
Mantenha a consistência!
Você estudou 4 dias nesta semana. Continue assim para alcançar seus objetivos.
```

Botão:

```txt
Ver meu desempenho
```

---

# 2. Página Painel do Curso

## Objetivo da tela

A tela **Painel do Curso** deve ser o centro de acompanhamento de um curso específico.

Ela deve mostrar o progresso do aluno, aula atual, unidades, frequência, faltas, avaliações, avisos, próximas aulas e atividades recentes.

A página não deve iniciar com uma mensagem genérica do tipo “selecione uma unidade”. Ela deve apresentar uma visão útil do curso imediatamente.

---

## Layout esperado

A tela deve conter:

- Sidebar específica do curso.
- Topbar com atalhos do curso.
- Cabeçalho do curso.
- Card `Continue de onde parou`.
- Indicadores principais.
- Caminho de aprendizagem.
- Próximas aulas.
- Frequência.
- Avisos do professor.
- Avaliações.
- Atividade recente.

---

## Sidebar específica do curso

No topo da sidebar, exibir o curso atual:

```txt
Curso Técnico em TI (Legado)
```

### Navegação do curso

- Painel do Curso
- Unidades e Conteúdos
- Aulas
- Avaliações
- Tarefas
- Notas e Desempenho
- Fóruns e Discussões
- Recursos e Materiais
- Certificados

### Apoio ao aluno

- Mensagens
- Avisos
- Suporte
- Biblioteca

O item **Painel do Curso** deve aparecer como ativo.

---

## Topbar do curso

A topbar deve manter os atalhos existentes, mas de forma visualmente profissional.

### Atalhos esperados

- Meu Painel
- Trocar Curso
- Caderno
- Foco
- PDF
- Busca
- Notificações
- Avatar do aluno

Os botões não devem parecer soltos. Devem estar alinhados e integrados ao design.

---

## Cabeçalho do curso

Criar cabeçalho com:

```txt
Painel do Curso
Acompanhe seu progresso, atividades e próximas aulas.
```

Também pode conter breadcrumb:

```txt
Meus Cursos > Curso Técnico em TI (Legado)
```

---

## Card “Continue de onde parou”

Criar um card principal para o aluno retomar a aula atual.

### Conteúdo obrigatório

```txt
Continue de onde parou
Aula 4 • Fundamentos de Redes
FUTEC — Fundamentos de TI
Hoje, 19:30 • 2h de duração
Progresso: 75%
```

### Botão

```txt
Continuar aula
```

### Requisitos

- Deve ter destaque visual.
- Deve conter thumbnail, ícone ou badge do curso.
- Deve mostrar progresso da aula ou unidade.
- Deve ter CTA forte.

---

## Indicadores principais

Criar cards ou faixa de indicadores com:

- Progresso geral
- Presença
- Faltas
- Média geral
- Tarefas pendentes
- Carga horária concluída

### Dados simulados sugeridos

```txt
Progresso geral: 62%
Presença: 92%
Faltas: 2 de 25 aulas
Média geral: 8,6
Tarefas pendentes: 2 entregas
Carga horária: 48h de 80h concluídas
```

### Requisitos

- Cada indicador deve ter ícone.
- Número deve estar em destaque.
- Texto auxiliar deve explicar o dado.
- Usar cores de status quando fizer sentido.

---

## Caminho de aprendizagem

Criar bloco:

```txt
Seu caminho de aprendizagem
```

Mostrar unidades/módulos com progresso.

### Unidades sugeridas

```txt
FUTEC — Fundamentos de TI
Aula 4 de 6 • Fundamentos de Redes
Progresso: 75%
```

```txt
FECOP — Colaboração e Produtividade
Aula 3 de 5 • Ferramentas Colaborativas
Progresso: 45%
```

```txt
IRCOM — Instalação de Recursos
Aula 1 de 4 • Instalação de Software
Progresso: 28%
```

### Cada item deve conter

- número ou ícone da unidade;
- nome da unidade;
- aula atual;
- barra de progresso;
- percentual;
- seta de navegação;
- estado visual, como ativo, em andamento ou bloqueado.

---

## Próximas aulas

Criar card:

```txt
Próximas aulas
```

### Exemplos

```txt
Hoje 19:30
Aula 4 • Fundamentos de Redes
FUTEC — Fundamentos de TI
Duração: 2h
```

```txt
Ter 25/06
Aula 5 • Topologias de Rede
FUTEC — Fundamentos de TI
Duração: 2h
```

```txt
Qui 27/06
Aula 1 • Ferramentas Colaborativas
FECOP — Colaboração e Produtividade
Duração: 2h
```

Adicionar link:

```txt
Ver calendário
```

---

## Frequência

Criar widget de frequência acadêmica.

Este item é obrigatório para o padrão profissional do LMS.

### Conteúdo sugerido

```txt
Frequência
92% Presença
Presente: 23 aulas
Faltas: 2 aulas
Justificadas: 0 aulas
```

### Requisitos

- Mostrar percentual de presença.
- Mostrar faltas.
- Mostrar faltas justificadas, se houver.
- Usar gráfico circular, barra ou card visual.
- Não confundir frequência acadêmica com presença online.

### Observação importante

O sistema atual pode possuir presença online via ping. Isso não substitui a frequência acadêmica.

Presença online indica se o aluno está conectado.

Frequência acadêmica indica se o aluno compareceu oficialmente a uma aula, em uma data específica, validada pelo professor/admin.

Se o backend ainda não tiver essa entidade, usar dados mockados na interface e preparar a estrutura visual para futura integração.

---

## Avisos do professor

Criar bloco:

```txt
Avisos do professor
```

### Exemplos

```txt
Novo material disponível
Material de apoio da Aula 3 já está disponível na biblioteca.
20/06/2025 • Professor Carlos
```

```txt
Avaliação agendada
Prova da Unidade 1 agendada para 28/06 às 19:30.
19/06/2025 • Professor Carlos
```

---

## Avaliações

Criar bloco:

```txt
Avaliações
```

### Exemplos

```txt
Prova Unidade 1
Data: 28/06/2025 • 19:30
Status: Agendada
Ponderação: 40%
```

```txt
Trabalho em Grupo
Entrega: 30/06/2025 • 23:59
Status: Em andamento
Ponderação: 30%
```

```txt
Quiz 1
Nota: 8,5
Status: Concluída
Ponderação: 10%
```

---

## Atividade recente

Criar feed:

```txt
Atividade recente
```

### Exemplos

```txt
Assistiu à Aula 3 — Fundamentos de Redes
Hoje, 17:42
```

```txt
Material baixado — Resumo - Topologias de Rede.pdf
Hoje, 16:15
```

```txt
Tarefa enviada — Atividade 2 - Topologias
Ontem, 22:31
```

```txt
Quiz 1 concluído — Nota obtida: 8,5
19/06/2025, 21:10
```

---

# Estados de interface obrigatórios

A implementação deve considerar estados comuns de produto real.

## Estado carregando

Exibir skeletons, spinner ou placeholders elegantes enquanto dados são carregados.

## Estado vazio

Se o aluno não tiver cursos, exibir mensagem amigável:

```txt
Nenhum curso disponível no momento.
Entre em contato com o professor ou administrador.
```

## Estado sem atividade recente

```txt
Nenhuma atividade recente ainda.
Comece uma aula para ver seu histórico aqui.
```

## Estado sem avaliações

```txt
Nenhuma avaliação disponível para este curso no momento.
```

## Estado de conteúdo bloqueado

Se uma unidade ou avaliação não estiver liberada para a turma, indicar visualmente:

```txt
Bloqueado
Disponível quando o professor liberar.
```

Nunca permitir acesso real a conteúdo bloqueado apenas por esconder ou mostrar no frontend. A validação crítica deve permanecer no servidor.

---

# Direção visual

## Estilo geral

A interface deve ter:

- Dark theme refinado.
- Aparência premium.
- Visual de produto SaaS moderno.
- Contraste confortável para leitura.
- Cards bem organizados.
- Bordas arredondadas.
- Sombras sutis.
- Separações claras entre seções.
- Ícones consistentes.
- Tipografia forte e limpa.
- Hierarquia visual excelente.
- Espaçamento generoso, mas sem áreas vazias inúteis.

---

## Paleta sugerida

Manter a identidade atual com base em:

- Azul-marinho escuro para fundos.
- Cinza-azulado para cards.
- Branco para títulos.
- Cinza claro para textos secundários.
- Vermelho/rosa como cor de destaque do LMS4.0.
- Azul, verde, roxo e ciano como cores auxiliares de status.

Evitar excesso de cores. Usar as cores com função clara.

---

## Componentes visuais esperados

Criar ou reaproveitar componentes como:

- `StudentSidebar`
- `CourseSidebar`
- `StudentTopbar`
- `CourseTopbar`
- `MetricCard`
- `CourseCard`
- `ProgressBar`
- `CircularProgress`
- `QuickActionCard`
- `RecentActivityList`
- `LearningPathCard`
- `UpcomingClassesCard`
- `AttendanceWidget`
- `TeacherAnnouncements`
- `EvaluationsCard`
- `EmptyState`
- `LoadingState`

Os nomes podem ser adaptados ao padrão do projeto.

---

# Regras funcionais importantes

## Preservar regras existentes

A implementação deve respeitar:

- O LMS é local-first.
- O admin controla cursos, turmas, alunos, conteúdos e avaliações.
- O aluno só acessa conteúdos liberados para sua turma.
- Provas só podem ser feitas se estiverem liberadas.
- Correção de provas deve acontecer no servidor.
- Validações críticas devem permanecer no backend.
- O frontend não deve ser a única camada de segurança.

---

## Dados reais e dados mockados

Se já existirem APIs ou dados reais para alguma informação, usar a estrutura existente.

Se ainda não existirem dados reais, usar dados mockados realistas, mas organizar o código para futura integração.

Exemplo:

```js
const dashboardMetrics = {
  activeCourses: 3,
  averageProgress: 62,
  attendancePercent: 92,
  absences: 2,
  pendingTasks: 2,
  completedHours: 48,
  totalHours: 80
};
```

---

## Navegação esperada

O fluxo principal deve ser:

```txt
Login do aluno
↓
Página Meus Cursos
↓
Aluno escolhe Curso Técnico em TI (Legado)
↓
Página Painel do Curso
↓
Aluno acompanha progresso, aulas, frequência, avaliações e atividades
```

Se o projeto atual ainda carrega direto o portal interno, ajustar com cuidado para não quebrar login, sessão e liberação de conteúdo.

---

# Responsividade

As telas devem funcionar bem em:

- desktop grande;
- notebook;
- tablet;
- celular, se o projeto suportar.

## Desktop

- Sidebar fixa.
- Grid de cursos.
- Cards em colunas.
- Painel lateral quando houver espaço.

## Tablet

- Sidebar pode recolher.
- Cards podem virar duas colunas.
- Seções laterais podem descer para baixo.

## Mobile

- Sidebar deve virar menu.
- Cards devem empilhar.
- Topbar deve simplificar ações.
- CTAs devem continuar acessíveis.

---

# Critérios de qualidade

A entrega será considerada boa se:

- A interface parecer um LMS profissional real.
- A página `Meus Cursos` não for apenas uma seleção simples.
- A página `Painel do Curso` tiver contexto acadêmico completo.
- O aluno entender rapidamente o que precisa fazer.
- Os dados principais estiverem visíveis sem esforço.
- O progresso estiver claro.
- A frequência estiver clara.
- As faltas estiverem claras.
- As avaliações estiverem claras.
- As próximas aulas estiverem claras.
- A navegação estiver organizada.
- O visual estiver consistente com a identidade LMS4.0.
- O código estiver organizado em componentes reutilizáveis.
- O layout estiver responsivo.
- Não houver áreas grandes vazias sem função.
- Nada parecer improvisado ou genérico.

---

# O que evitar

Evitar:

- Tela vazia com apenas uma mensagem central.
- Card único de curso sem contexto.
- Botões soltos sem hierarquia.
- Muitos elementos desalinhados.
- Falta de estados vazios.
- Cores sem função.
- Interface bonita, mas sem dados úteis.
- Dados acadêmicos importantes escondidos.
- Quebrar regras de liberação de conteúdo.
- Expor gabarito ou informações sensíveis no frontend.
- Confundir presença online com frequência acadêmica.

---

# Ordem recomendada de implementação

1. Ler `AI_CONTEXT.md` e documentos da pasta `/docs`.
2. Analisar a estrutura atual do projeto.
3. Identificar onde fica o Portal do Aluno atual.
4. Identificar rotas, sessão do aluno e dados disponíveis.
5. Criar ou separar componentes reutilizáveis.
6. Implementar a página `Meus Cursos`.
7. Implementar a navegação para `Painel do Curso`.
8. Implementar a página `Painel do Curso`.
9. Integrar dados existentes quando possível.
10. Usar mocks realistas quando necessário.
11. Validar responsividade.
12. Revisar estados vazios, carregamento e bloqueio.
13. Testar fluxo principal do aluno.
14. Informar arquivos criados/alterados e como testar.

---

# Prompt curto para execução no Antigravity

Use este trecho se precisar orientar a IA rapidamente:

```txt
Leia primeiro AI_CONTEXT.md, ARQUITETURA.md, REGRAS_DE_NEGOCIO.md, FLUXOS.md e MAPA_FUNCIONAL_LMS.md. Depois siga este documento UX_UI_PORTAL_ALUNO_PREMIUM.md para redesenhar e implementar o Portal do Aluno com duas telas premium: Meus Cursos e Painel do Curso.

Preserve as regras do LMS local-first, liberação por turma, correção no servidor e validações críticas no backend. A nova interface deve ter aparência de produto SaaS educacional profissional, com sidebar, topbar, cards de métricas, grid de cursos, progresso, frequência, faltas, avaliações, próximas aulas, avisos do professor e atividade recente.

Não faça apenas um layout bonito. Entregue telas utilizáveis, responsivas, organizadas em componentes reutilizáveis e com dados realistas. Se algum dado ainda não existir no backend, use mock temporário bem estruturado para futura integração.
```

---

# Observação final

Este documento não substitui as regras de negócio nem a arquitetura do projeto.

Ele complementa a documentação existente com a visão de UX/UI esperada para o Portal do Aluno.

Sempre que uma alteração visual exigir nova regra, novo fluxo, nova entidade ou nova API, atualizar também os documentos correspondentes.
