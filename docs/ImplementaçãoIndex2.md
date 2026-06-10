````md
# Implementar telas profissionais do LMS com todos os botões e funcionalidades

Você deve implementar no projeto real as duas telas do LMS com base no HTML de referência enviado:

1. Página **Meus Cursos**
2. Página interna **Painel do Curso**

O HTML enviado não deve ser tratado apenas como mockup visual. Ele representa a estrutura, hierarquia, componentes, botões e funcionalidades esperadas. Quero que todos os botões, menus, cards, filtros e seções sejam funcionais dentro do sistema, mesmo que inicialmente usem dados mockados quando ainda não houver backend disponível.

---

## Objetivo geral

Transformar as telas atuais simples do portal do aluno em uma experiência profissional de LMS, com dashboard, navegação real, ações rápidas, progresso, frequência, avaliações, aulas, atividades e histórico.

Antes de codar, analise a estrutura atual do projeto, identifique rotas, componentes, estado global, padrões de estilo, autenticação e dados disponíveis.

Depois implemente de forma integrada ao padrão existente do projeto.

---

# Tela 1 — Meus Cursos

## Deve conter

A página “Meus Cursos” deve exibir:

- Sidebar com navegação principal
- Topbar com usuário, notificações e ações globais
- Cabeçalho “Seus Cursos”
- Métricas rápidas:
  - Cursos ativos
  - Progresso médio
  - Próxima atividade
  - Horas de estudo
- Busca de cursos
- Filtros:
  - Status
  - Turno
  - Ordenação
- Cards de cursos
- Ações rápidas
- Atividade recente
- Banner de consistência/desempenho
- Botão de upgrade/premium
- Botão para recolher menu
- Notificações
- Perfil do aluno

---

## Funcionalidades obrigatórias da Tela Meus Cursos

### 1. Cards de curso

Cada card de curso deve ter:

- Nome do curso
- Turma
- Turno
- Status
- Progresso
- Próxima atividade
- Botão “Continuar curso”

Ao clicar em **Continuar curso** ou **Acessar portal**, o aluno deve ser levado para a página interna daquele curso.

Exemplo de rota esperada:

```txt
/cursos/:courseId
````

ou seguir o padrão de rotas já existente no projeto.

---

### 2. Busca de cursos

O campo “Buscar cursos” deve filtrar os cursos em tempo real por:

* Nome do curso
* Turma
* Turno
* Status

Se nenhum curso for encontrado, exibir estado vazio:

```txt
Nenhum curso encontrado com os filtros selecionados.
```

---

### 3. Filtro por status

O filtro de status deve permitir:

* Todos
* Em andamento
* Em dia
* Concluído
* Pendente
* Bloqueado

Ao alterar o filtro, atualizar a listagem de cards.

---

### 4. Filtro por turno

O filtro de turno deve permitir:

* Todos
* Manhã
* Tarde
* Noite
* Integral

Ao alterar o filtro, atualizar a listagem de cards.

---

### 5. Ordenação

A ordenação deve permitir:

* Mais recentes
* Maior progresso
* Menor progresso
* Nome A-Z
* Próxima atividade

---

### 6. Ações rápidas

Implementar os cards de ações rápidas com navegação real:

* **Ver calendário**
  Deve abrir a página/área de calendário do aluno.

* **Minhas atividades**
  Deve abrir a página/área de tarefas e atividades.

* **Notas e desempenho**
  Deve abrir a página/área de notas e desempenho.

* **Biblioteca**
  Deve abrir a biblioteca ou materiais de apoio.

Se alguma rota ainda não existir, criar a rota ou preparar o botão com navegação estruturada e tela temporária adequada.

Não deixar botão morto.

---

### 7. Atividade recente

A seção de atividade recente deve listar ações do aluno, como:

* Aula concluída
* Material baixado
* Tarefa enviada
* Quiz concluído
* Novo aviso
* Nova avaliação

Cada item deve ter:

* Ícone
* Título
* Descrição
* Data/hora
* Status visual

Se ainda não houver backend, usar mock data bem estruturado.

---

### 8. Banner de desempenho

O botão “Ver meu desempenho” deve levar para a tela de desempenho/notas do aluno.

---

### 9. Upgrade / Premium

O botão “Upgrade” deve abrir uma ação real:

* modal explicando recurso premium
* ou rota de planos
* ou estado temporário informando “recurso em breve”

Não deixar sem ação.

---

### 10. Recolher menu

O botão “Recolher menu” deve colapsar a sidebar.

Quando recolhida:

* Mostrar apenas ícones
* Ajustar largura do conteúdo
* Permitir expandir novamente

---

# Tela 2 — Painel do Curso

## Deve conter

A página interna do curso deve exibir:

* Sidebar de navegação do curso
* Topbar com ações:

  * Meu Painel
  * Trocar Curso
  * Caderno
  * Foco
  * PDF
* Título do curso
* Card “Continue de onde parou”
* KPIs do curso:

  * Progresso geral
  * Presença
  * Faltas
  * Média geral
  * Tarefas pendentes
  * Carga horária
* Caminho de aprendizagem por unidades
* Próximas aulas
* Frequência
* Avaliações
* Avisos do professor
* Atividade recente

---

## Funcionalidades obrigatórias da Tela Painel do Curso

### 1. Botão “Continuar aula”

Ao clicar em **Continuar aula**, o aluno deve ser levado para a próxima aula pendente ou última aula em andamento.

Exemplo de rota:

```txt
/cursos/:courseId/aulas/:lessonId
```

A lógica deve ser:

* Se existe aula em andamento, abrir essa aula
* Se não existe aula em andamento, abrir a próxima aula disponível
* Se todas foram concluídas, mostrar estado de curso concluído

---

### 2. Caminho de aprendizagem

Cada unidade deve ser clicável.

Ao clicar em uma unidade:

* Abrir detalhes da unidade
* Listar aulas da unidade
* Mostrar progresso
* Indicar aulas concluídas, pendentes e bloqueadas

Se o projeto já tiver tela de aulas/unidades, conectar com ela.

---

### 3. Próximas aulas

A seção “Próximas aulas” deve listar aulas futuras.

Cada aula deve ter:

* Data
* Hora
* Nome da aula
* Unidade
* Duração
* Status

Ao clicar em uma aula, abrir detalhes da aula.

O botão **Ver calendário** deve levar para o calendário filtrado pelo curso atual.

---

### 4. Frequência / presença

A seção de frequência deve funcionar de verdade.

Deve exibir:

* Percentual de presença
* Quantidade de presenças
* Quantidade de faltas
* Quantidade de faltas justificadas
* Total de aulas
* Status visual

Regra sugerida:

```txt
presencaPercentual = (aulasPresentes / totalAulasRealizadas) * 100
```

Também deve tratar:

* nenhuma aula realizada
* aluno sem registros de presença
* faltas justificadas
* dados inconsistentes

---

### 5. Avaliações

A seção “Avaliações” deve listar:

* Provas
* Trabalhos
* Quizzes
* Atividades avaliativas

Cada item deve ter:

* Nome
* Data
* Horário
* Status
* Peso/ponderação
* Nota, quando existir

Ao clicar em uma avaliação:

* Se estiver agendada, abrir detalhes
* Se estiver em andamento, abrir entrega/resolução
* Se estiver concluída, abrir resultado

O botão **Ver todas** deve abrir a página de avaliações do curso.

---

### 6. Avisos do professor

A seção deve listar avisos do professor relacionados ao curso.

Cada aviso deve ter:

* Título
* Mensagem curta
* Data
* Professor responsável

Ao clicar em um aviso:

* Abrir modal ou página de detalhe do aviso

O botão **Ver todos** deve abrir a listagem completa de avisos.

---

### 7. Atividade recente

A atividade recente deve exibir eventos do aluno dentro do curso:

* Aula assistida
* Material baixado
* Tarefa enviada
* Quiz concluído
* Avaliação realizada
* Presença registrada
* Certificado emitido

O botão **Ver tudo** deve abrir uma tela completa de histórico do curso.

---

### 8. Botão “Meu Painel”

Deve levar para o dashboard geral do aluno ou para a tela principal do portal.

---

### 9. Botão “Trocar Curso”

Deve levar para a tela “Meus Cursos”.

---

### 10. Botão “Caderno”

Deve abrir o caderno/anotações do aluno para o curso atual.

Funcionalidade esperada:

* Criar anotação
* Editar anotação
* Excluir anotação
* Salvar anotação por aula ou por curso
* Listar anotações existentes

Se backend ainda não existir, implementar com estado local ou mock estruturado, mas deixar a arquitetura pronta para persistência.

---

### 11. Botão “Foco”

Deve ativar modo foco.

Ao ativar:

* Esconder sidebar
* Reduzir distrações
* Expandir área principal
* Alterar o botão para “Sair do Foco”
* Manter o estado enquanto o usuário navega dentro do curso

---

### 12. Botão “PDF”

Deve gerar ou abrir um PDF relacionado ao curso/aula.

Opções aceitáveis:

* Abrir material PDF da aula atual
* Gerar resumo em PDF
* Abrir lista de PDFs disponíveis
* Exibir modal caso nenhum PDF esteja disponível

Não deixar botão morto.

---

### 13. Notificações

O sino de notificações deve abrir dropdown/modal com notificações reais ou mockadas.

Cada notificação deve ter:

* Título
* Descrição
* Data
* Status lida/não lida

Permitir marcar como lida.

---

### 14. Perfil do usuário

Ao clicar no perfil do aluno, abrir menu com:

* Meu perfil
* Configurações
* Sair da conta

O botão sair deve executar o fluxo real de logout já existente.

---

# Estados obrigatórios

Implementar estados de interface para:

* Loading
* Erro
* Sem dados
* Curso sem aulas
* Curso concluído
* Nenhuma avaliação
* Nenhuma atividade recente
* Nenhum aviso
* Nenhuma presença registrada
* Sidebar recolhida
* Modo foco ativado

---

# Dados e arquitetura

Se já existir backend/API, usar os dados reais.

Se ainda não existir backend, criar uma camada de dados mockados organizada, por exemplo:

```txt
coursesMock
lessonsMock
attendanceMock
assessmentsMock
announcementsMock
activitiesMock
notesMock
```

Os mocks devem ser fáceis de substituir por chamadas reais futuramente.

Criar tipos/interfaces para:

```txt
Course
Lesson
Module
AttendanceRecord
Assessment
Announcement
RecentActivity
StudentNote
Notification
```

---

# Regras de navegação

Todas as ações visíveis na interface devem fazer algo.

Não deixar:

* botão sem onClick
* link com href="#"
* componente visual sem comportamento
* menu que não abre
* filtro que não filtra
* card clicável sem navegação
* dropdown sem opções

Quando uma funcionalidade ainda não existir completamente, criar modal/tela temporária informando o estado, mas mantendo a experiência profissional.

---

# Qualidade esperada

Implementar como uma feature de produção:

* Componentes reutilizáveis
* Código organizado
* Responsivo
* Sem duplicação desnecessária
* Seguindo o padrão do projeto
* Sem quebrar funcionalidades existentes
* Visual fiel ao HTML de referência
* Interações suaves
* Estados visuais claros
* Acessibilidade básica
* Feedback para ações do usuário

---

# Entrega esperada

Ao final, me informe:

1. Quais arquivos foram criados
2. Quais arquivos foram alterados
3. Quais rotas foram criadas
4. Quais funcionalidades foram implementadas
5. Quais dados ainda estão mockados
6. Quais próximos passos são necessários para ligar ao backend real

Não faça apenas o layout estático. Quero a implementação funcional completa das telas e dos botões.

```
```


Você implementou apenas a camada visual. Refaça considerando que cada botão, filtro, card, menu e ação do HTML precisa ter comportamento real ou, no mínimo, um modal/rota/estado temporário profissional. Não deixe nenhum elemento clicável morto.