# Implementar index2.html Exatamente no Projeto LMS

Reescrever o portal do aluno para replicar fielmente o layout do `index2.html` (referência de design), conectando todos os botões às funcionalidades existentes e implementando as que faltam.

## Diagnóstico Atual

O projeto atual já possui uma implementação parcial (V2) que tentou seguir o `index2.html`, mas com vários problemas:

1. **Funções duplicadas** em `app.js`: `loadGlobalDashboard`, `selectCourseAndEnter` e `loadCourseDashboard` existem em duas versões (linhas ~3690-3903 e ~3909-4131). Isso causa conflitos silenciosos.
2. **CSS V2 já existe** no final de `style.css` (linhas 2465-2572), mas está incompleto vs. o design real do `index2.html`.
3. **HTML atual** usa mix de Tailwind e CSS custom, enquanto `index2.html` usa CSS puro com classes semânticas.
4. **KPI strip** no painel do curso atual tem apenas 3 KPIs (Média, Faltas, Carga Horária), mas o `index2.html` exige 6 (Progresso, Presença, Faltas, Média, Tarefas Pendentes, Carga Horária).
5. **Sidebar do index2.html** tem course-switcher e navegação diferente do que está implementado.
6. **Topbar** do `index2.html` tem botões "Meu Painel", "Trocar Curso", "Caderno", "Foco", "PDF" sempre visíveis.

## Proposed Changes

### 1. HTML — `index.html` (reescrita completa do corpo)

#### [MODIFY] [index.html](file:///g:/Meu%20Drive/Antigravity/IClass/frontend/index.html)

Reescrever as seguintes seções para replicar o `index2.html`:

**Sidebar Global (`sidebar-global-view`):**
- Adicionar course-switcher (🎓 dropdown do curso atual)
- Nav-list: Meus Cursos (ativo), Calendário, Atividades, Mensagens (badge 2), Notas, Certificados, Biblioteca, Suporte
- Premium card no rodapé

**Sidebar do Curso (`sidebar-course-view`):**
- Course-switcher com nome do curso
- Nav-list: Painel do Curso (ativo), Unidades e Conteúdos, Aulas, Avaliações, Tarefas, Notas e Desempenho, Fóruns, Recursos, Certificados
- Apoio ao aluno: Mensagens, Avisos, Suporte, Biblioteca

**Topbar:**
- Breadcrumb: 🏠 LMS4.0 / Portal do Aluno
- Botões: Meu Painel (verde), Trocar Curso (azul), Caderno (amarelo), Foco, PDF
- User profile com avatar, nome e "Estudante"

**View Meus Cursos (`view-my-courses`):**
- Page header com ícone e hero illustration
- Stats grid (4 cards: Cursos ativos, Progresso médio, Próxima atividade, Horas de estudo)
- Toolbar (busca + 3 filtros)
- Grid two: courses grid + sidebar (Ações rápidas + Atividade recente)
- Bottom banner de engajamento

**View Painel do Curso (`view-course-panel`):**
- Page header com ícone e hero illustration
- Dashboard grid: Continue card + KPI strip (6 KPIs)
- Course dashboard layout (3 colunas): Caminho de aprendizagem + Avisos | Próximas aulas + Avaliações | Frequência (donut) + Atividade recente

---

### 2. CSS — `style.css` (reescrever seção V2)

#### [MODIFY] [style.css](file:///g:/Meu%20Drive/Antigravity/IClass/frontend/style.css)

Reescrever a seção V2 (linhas 2465-2572) para ser uma réplica fiel do CSS do `index2.html`, incluindo:
- Variáveis CSS completas do `index2.html`
- Todos os seletores que existem no `index2.html` mas faltam no projeto
- Classes `.course-switcher`, `.premium-card`, `.btn-premium`
- KPI strip com 6 colunas
- Próximas aulas (`.schedule-item`, `.date-box`, `.pill`)
- Avaliações (`.assessment-item`, `.status`)
- Bottom banner, page tabs
- Responsividade completa

---

### 3. JavaScript — `app.js` (limpar duplicatas e conectar botões)

#### [MODIFY] [app.js](file:///g:/Meu%20Drive/Antigravity/IClass/frontend/app.js)

**Limpar duplicatas:**
- Remover a primeira versão de `loadGlobalDashboard` (linhas ~3690-3773)
- Remover a primeira versão de `selectCourseAndEnter` (linhas ~3775-3779)
- Remover a primeira versão de `loadCourseDashboard` (linhas ~3782-3904)
- Manter apenas a segunda versão (linhas ~3909-4131) como fonte de verdade

**Conectar funcionalidades aos botões da topbar:**
- "Meu Painel" → `showCoursePanelView()` (já existe)
- "Trocar Curso" → `showMyCoursesView()` (já existe)
- "Caderno" → toggle notebook panel (já existe como `btn-notebook-toggle`)
- "Foco" → toggle focus mode (já existe como `focus-mode-btn`)
- "PDF" → export PDF (já existe como `export-pdf-btn`)

**Conectar ações rápidas:**
- "Ver calendário" → placeholder (alerta ou scroll)
- "Minhas atividades" → navegar para avaliações
- "Notas e desempenho" → `showCoursePanelView()`
- "Biblioteca" → placeholder

**Conectar sidebar do curso:**
- "Painel do Curso" → `showCoursePanelView()`
- Módulos → já injetados dinamicamente
- "Unidades e Conteúdos" → mostrar sidebar de módulos
- "Avaliações" → scroll para seção de avaliações
- Links de apoio → placeholders

**Dados reais do KPI Strip (6 KPIs):**
- Progresso geral → calculado dos `completedUnits` (já existe)
- Presença → da API `/api/student/dashboard` (já existe)
- Faltas → da API `/api/student/dashboard` (já existe)
- Média geral → calculada das submissions (já existe parcialmente)
- Tarefas pendentes → mock (backend não suporta ainda)
- Carga horária → do curso structure ou mock

**Atualizar `loadGlobalDashboard`:**
- Processar `student.courses` como objetos (fix já aplicado)
- Atualizar stats grid com dados reais da API
- Preencher atividade recente dinamicamente

**Atualizar `loadCourseDashboard`:**
- Preencher "Continue de onde parou" com última aula acessada
- Preencher KPI strip com 6 KPIs
- Preencher módulos com dados reais
- Preencher próximas aulas (mock se necessário)
- Preencher avaliações com submissões reais
- Preencher frequência com dados reais
- Preencher atividade recente
- Preencher avisos do professor

---

## Verificação

### Testes manuais
1. Login do aluno → deve mostrar "Meus Cursos" com layout idêntico ao `index2.html`
2. Clicar em "Continuar curso" → deve abrir "Painel do Curso" com layout idêntico
3. Todos os botões da topbar devem funcionar
4. Todos os KPIs devem ser preenchidos com dados reais
5. Sidebar deve alternar entre global e curso
6. Responsividade em telas menores

### Verificação de código
- `node -c app.js` para validar sintaxe
- Sem funções duplicadas
- Sem IDs referenciados no JS mas ausentes no HTML
