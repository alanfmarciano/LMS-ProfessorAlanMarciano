# 📖 MANUAL DE PRODUÇÃO DE CONTEÚDO — LMS SENAI 4.0

> **Versão:** 2.0  
> **Objetivo:** Guia completo para criar, editar e publicar apostilas e avaliações no sistema LMS do SENAI.

---

## 1. Visão Geral do Sistema

O LMS SENAI 4.0 é um sistema de ensino local (offline) que serve conteúdo pedagógico para alunos de cursos técnicos. O conteúdo é organizado em **módulos**, e cada módulo possui **unidades** com apostilas e avaliações.

### Como o conteúdo é servido

```
Arquivos .md no disco → Servidor Node.js lê automaticamente → Gera /data.js → Portal do Aluno exibe
```

O servidor lê **todos os arquivos `.md`** da pasta raiz do projeto ao vivo (não precisa reiniciar). O nome do arquivo (sem `.md`) vira a chave de acesso no sistema. Por isso, **a nomenclatura dos arquivos é crítica**.

---

## 2. Estrutura de Módulos e Referências

Cada módulo do curso é baseado em um **arquivo de referência curricular** oficial do SENAI. Esse arquivo contém os tópicos obrigatórios que devem ser cobertos nas apostilas e avaliações.

### Módulos Atuais

| Módulo | Sigla | Arquivo de Referência | Carga Horária | Tipo |
|--------|-------|-----------------------|---------------|------|
| Fundamentos de TI | **FUTEC** | `FUTEC.pdf.txt` | 80h | Módulo Básico |
| Colaboração e Produtividade | **FECOP** | `FECOP.pdf.txt` | 120h | Módulo Específico |
| Instalação de Recursos Computacionais | **IRCOM** | `IRCOM.txt` | 120h | Módulo Específico |

### Regra Fundamental

> **O arquivo de referência é a "bíblia" do módulo.** Todo conteúdo produzido (apostilas e avaliações) deve ser derivado dos tópicos listados nesse arquivo. Nenhum tópico pode ser inventado — todos devem ter correspondência na referência oficial.

---

## 3. Nomenclatura de Arquivos

O sistema usa um padrão rígido de nomes. O servidor identifica o tipo de conteúdo e o módulo pelo nome do arquivo.

### Padrão

```
Apostila_[SIGLA]_[N].md       →  Apostila da Unidade N do módulo SIGLA
Avaliacao_[SIGLA]_[N].md      →  Avaliação da Unidade N do módulo SIGLA
```

### Onde:
- `[SIGLA]` = A sigla do módulo em MAIÚSCULAS (ex: `FUTEC`, `FECOP`, `IRCOM`)
- `[N]` = O número da unidade (1, 2, 3...)

### Exemplos Concretos

| Arquivo | O que é |
|---------|---------|
| `Apostila_FUTEC_1.md` | Apostila da Unidade 1 de Fundamentos de TI |
| `Apostila_FECOP_3.md` | Apostila da Unidade 3 de Colaboração |
| `Apostila_IRCOM_2.md` | Apostila da Unidade 2 de Instalação de Recursos |
| `Avaliacao_FUTEC_1.md` | Avaliação da Unidade 1 de Fundamentos de TI |
| `Avaliacao_IRCOM_5.md` | Avaliação da Unidade 5 de Instalação de Recursos |

### Como Adicionar um Novo Módulo

Se futuramente o SENAI adicionar um novo módulo (ex: "Redes de Computadores" com sigla `RECOM`):

1. Criar o arquivo de referência: `RECOM.pdf.txt`
2. Criar os arquivos de conteúdo seguindo o padrão: `Apostila_RECOM_1.md`, `Avaliacao_RECOM_1.md`, etc.
3. Registrar o módulo na estrutura do curso pelo painel Admin (Editor de Conteúdo → Estrutura do Curso)
4. O servidor já reconhecerá os novos arquivos automaticamente

---

## 4. Público-Alvo e Linguagem

### Perfil do Aluno
- **Idade:** 16 a 22 anos
- **Formação:** Alunos de cursos técnicos do SENAI
- **Contexto:** Formação para o mercado de trabalho brasileiro (indústria 4.0, escritórios, datacenters)

### Diretrizes de Linguagem
- Usar linguagem **natural e acessível** — nunca acadêmica ou rebuscada
- Sempre **explicar termos técnicos** antes de usá-los
- Usar **analogias do dia a dia** (ex: "A CPU é como o cérebro do computador")
- Dar **exemplos próximos da realidade** dos alunos (empresas brasileiras, produtos encontrados no Brasil)
- Usar **perguntas, desafios e provocações** para engajar ("Você sabia que...")
- Contextualizar para a **indústria brasileira** (usinas, escritórios, manutenção de PCs, datacenters)

---

## 5. Template de Apostila

Cada módulo é dividido em **exatamente 5 unidades**. Cada apostila deve seguir esta estrutura:

### ⚠️ Rastreabilidade de Tópicos (CRÍTICO)

Cada apostila deve deixar **explícito e rastreável** quais tópicos e subtópicos do arquivo de referência (PDF) estão sendo ensinados:

1. **No cabeçalho da apostila:** Listar todos os tópicos principais cobertos naquela unidade
2. **No título de cada capítulo:** Indicar o tópico principal entre parênteses
3. **Nas subseções:** Indicar os subtópicos específicos entre parênteses

Isso permite que qualquer pessoa (ou IA) verifique se todos os tópicos do PDF foram cobertos.

### Template Completo

```markdown
# 📁 [SIGLA] [N]: [Título Descritivo da Unidade]

> **Carga Horária Estimada:** XX Horas
> **Foco:** [Descrição breve dos assuntos abordados]
> **Baseado nos Tópicos Oficiais do SENAI:** Tópico X (todos os subtópicos X.1 a X.10), Tópico Y (subtópicos Y.1 a Y.8).

[Parágrafo introdutório contextualizando a unidade — por que isso importa no mercado de trabalho?]

---

## 📝 CAPÍTULO 1: [Título do Capítulo] (Tópico X)

[Introdução teórica do tópico]

### 1.1. [Subtópico] (Tópicos X.1 e X.2)
[Conteúdo cobrindo os subtópicos X.1 e X.2 do PDF]

### 1.2. [Subtópico] (Tópicos X.3 a X.5)
[Conteúdo cobrindo os subtópicos X.3, X.4 e X.5 do PDF]

---

## 📝 CAPÍTULO 2: [Título do Capítulo] (Tópico Y)

[Conteúdo...]

### 2.1. [Subtópico] (Tópicos Y.1 a Y.3)
[Conteúdo...]

---

## 📝 CAPÍTULO 3: [Título do Capítulo] (Tópicos X e Y — Integração Prática)

[Conteúdo que integra os tópicos ensinados nos capítulos anteriores]
```

### Exemplo Real (Apostila_FUTEC_1.md)

```markdown
# 📁 FUTEC 1: Fundamentos de Hardware e Sistemas Operacionais

> **Carga Horária Estimada:** 16 Horas
> **Foco:** Arquitetura de Hardware, Virtualização de Servidores, Ambientes Windows e Linux
> **Baseado nos Tópicos Oficiais do SENAI:** Tópico 6 (6.1 a 6.5), Tópico 1 (1.1 a 1.10) e Tópico 2 (2.1 a 2.8).

---

## 📝 CAPÍTULO 1: Arquitetura de Hardware e Bottlenecks (Tópico 6)

### 1.1. Classificação Industrial de Dispositivos (Tópicos 6.2.2 a 6.2.5)

## 📝 CAPÍTULO 2: Governança do Windows e Licenciamentos (Tópico 1)

### 2.1. A Hierarquia das Licenças de Software (Tópicos 1.2.1 a 1.2.5)

## 📝 CAPÍTULO 3: O Pinguim e a Linha de Comando (Tópico 2)
```

### Requisitos Obrigatórios da Apostila

| Requisito | Mínimo |
|-----------|--------|
| Linhas totais | **400 linhas** (sem limite máximo) |
| Capítulos | **3 capítulos** |
| Tabelas explicativas | **1 por capítulo** (recomendado) |
| Indicação de tópico | **Obrigatório** no título do capítulo |

### Cada Capítulo Deve Conter

1. **Introdução teórica** — Explicar o "porquê", não só o "quê"
2. **Exemplos práticos/industriais** — "Onde vou usar isso no trabalho?"
3. **Atividade prática no laboratório** — Exercício hands-on logo após a teoria (ver seção abaixo)
4. **Tabelas explicativas** — Comparações, resumos visuais
5. **Subseções de aprofundamento** (1.1, 1.2, etc.)

### 🖥️ Atividades Práticas no Laboratório (OBRIGATÓRIO)

O aluno está sentado em frente a um computador no laboratório de informática do SENAI. Cada bloco teórico ensinado **deve ser seguido imediatamente de uma atividade prática** que o aluno possa executar ali mesmo, na máquina, em poucos minutos.

**Princípio:** _"Aprendeu na teoria → Faz na prática."_

#### Regras para as Atividades Práticas

1. **Devem ser rápidas** — O aluno deve conseguir completar em 5 a 15 minutos
2. **Devem ser executáveis no PC do laboratório** — Nada que exija software especial ou acesso externo
3. **Devem ser diretamente ligadas ao que acabou de ser ensinado** — Não pule para outro assunto
4. **Devem ser do dia a dia profissional** — Simular tarefas reais de trabalho

#### Exemplos por Assunto

| Assunto Ensinado | Atividade Prática |
|------------------|-------------------|
| E-mail profissional | Abrir o cliente de e-mail, compor um e-mail formal para um "cliente fictício" com assunto, saudação e assinatura |
| Fórmulas do Excel | Abrir uma planilha, digitar uma tabela de vendas e aplicar `=SOMA()`, `=MÉDIA()` e `=SE()` |
| Programação básica | Abrir o terminal/editor, digitar um script simples (ex: "Hello World" em Python) e executar |
| Linha de comando (CLI) | Abrir o terminal, criar uma pasta, navegar entre diretórios, listar arquivos com `dir` / `ls` |
| Formatação de texto | Abrir o Word/Writer, formatar um documento com título, subtítulo, lista e negrito |
| Navegador e pesquisa | Pesquisar um termo técnico no Google e identificar a fonte mais confiável |
| Armazenamento em nuvem | Fazer upload de um arquivo para o Google Drive e compartilhar com um colega |
| Redes / IP | Abrir o terminal e executar `ipconfig` / `ifconfig` para descobrir o IP da máquina |
| Segurança digital | Verificar se uma senha é forte usando um site de teste de senhas |
| Banco de dados | Abrir um formulário e inserir dados estruturados em uma planilha simulando um BD |

#### Formato na Apostila

Após cada bloco teórico, incluir uma caixa de atividade prática usando este formato:

```markdown
---

> ### 🖥️ Atividade Prática: [Título da Atividade]
>
> **Tempo estimado:** X minutos
>
> **O que fazer:**
> 1. Abra [programa/ferramenta]
> 2. [Passo a passo claro e direto]
> 3. [Próximo passo]
> 4. [Resultado esperado]
>
> **Resultado esperado:** [O que o aluno deve ver/produzir ao final]
>
> 💡 **Dica:** [Dica útil para quem travar]

---
```

#### Exemplo Completo

```markdown
---

> ### 🖥️ Atividade Prática: Seu Primeiro Comando no Terminal
>
> **Tempo estimado:** 5 minutos
>
> **O que fazer:**
> 1. Pressione `Win + R`, digite `cmd` e pressione Enter
> 2. No terminal, digite: `ipconfig` e pressione Enter
> 3. Localize o campo **"Endereço IPv4"** — esse é o IP da sua máquina
> 4. Anote o IP no caderno
> 5. Agora digite: `ping 8.8.8.8` e observe a resposta
>
> **Resultado esperado:** Você verá o endereço IP local da sua máquina e confirmará que há conexão com a internet.
>
> 💡 **Dica:** Se o ping retornar "Esgotado o tempo limite", pode ser que o firewall esteja bloqueando. Peça ajuda ao instrutor.

---
```

### Checklist de Enriquecimento (Brasil)

Ao criar ou revisar uma apostila, incluir:

- [ ] Exemplos de marcas/modelos disponíveis no Brasil
- [ ] Onde comprar (Magazine Luiza, Kabum, Pichau, Amazon BR)
- [ ] Preços aproximados em reais (R$)
- [ ] Contextos de trabalho brasileiros
- [ ] Erros comuns e como evitá-los
- [ ] Passo a passo detalhado para atividades práticas
- [ ] Informações atualizadas (2025–2026)
- [ ] Leituras complementares (livros, canais do YouTube, sites)
- [ ] Glossário de termos técnicos ao final
- [ ] Resumo do capítulo ao final

### 🖼️ Imagens e Ilustrações (OBRIGATÓRIO)

As apostilas devem conter **imagens e ilustrações** para facilitar o aprendizado visual. Diagramas, screenshots e infográficos são especialmente eficazes para conteúdo técnico.

#### Estrutura de Pastas

As imagens ficam na pasta `imagens/` organizada por módulo e capítulo:

```
imagens/
├── futec/
│   ├── cap1/       ← Imagens da Apostila_FUTEC_1.md
│   ├── cap2/       ← Imagens da Apostila_FUTEC_2.md
│   ├── cap3/
│   ├── cap4/
│   └── cap5/
├── fecop/
│   ├── cap1/       ← Imagens da Apostila_FECOP_1.md
│   └── ...
└── ircom/
    ├── cap1/       ← Imagens da Apostila_IRCOM_1.md
    └── ...
```

#### Formatos Aceitos

| Formato | Quando Usar | Exemplo |
|---------|-------------|---------|
| **SVG** | Diagramas, fluxogramas, esquemas técnicos (vetorial, leve) | `von-neumann.svg` |
| **JPG** | Fotos reais de hardware, datacenters, equipamentos | `cpu-hardware.jpg` |
| **PNG** | Screenshots de software, interfaces, com transparência | `terminal-linux.png` |

> **Preferência:** Use **SVG** sempre que possível para diagramas (leve, escalável, nítido em qualquer tela). Reserve JPG/PNG para fotos reais e screenshots.

#### Como Inserir no Markdown

Use a sintaxe padrão de imagem do Markdown com **caminho relativo**:

```markdown
![Descrição da Imagem](imagens/[sigla]/cap[N]/nome-do-arquivo.svg)
```

**Exemplos reais do projeto:**

```markdown
![Arquitetura de von Neumann](imagens/futec/cap1/von-neumann.svg)
![CPU e Hardware](imagens/futec/cap1/cpu-hardware.jpg)
![Modelo OSI - 7 Camadas](imagens/futec/cap2/modelo-osi.svg)
![Dashboard de Dados](imagens/futec/cap3/excel-dashboard.jpg)
```

#### Regras de Nomenclatura das Imagens

1. **Tudo em minúsculas:** `hierarquia-memoria.svg` ✅ (não `Hierarquia_Memoria.SVG` ❌)
2. **Separar palavras com hífen:** `ssd-vs-hd.svg` ✅ (não `ssd_vs_hd.svg` ❌)
3. **Nome descritivo:** `modelo-osi.svg` ✅ (não `img001.svg` ❌)
4. **Sem acentos ou espaços:** `industria-40.svg` ✅ (não `indústria 4.0.svg` ❌)

#### Quando Usar Imagens

| Situação | Tipo de Imagem |
|----------|----------------|
| Explicar arquitetura (CPU, redes, BD) | Diagrama SVG |
| Mostrar passo a passo de software | Screenshot PNG |
| Apresentar equipamento real | Foto JPG |
| Comparar conceitos (antes/depois) | Infográfico SVG |
| Fluxo de processo ou algoritmo | Fluxograma SVG |

#### Checklist de Imagens por Apostila

- [ ] Pelo menos **1 imagem por capítulo** (diagrama ou screenshot)
- [ ] Cada imagem tem **descrição** no alt-text (`![descrição aqui](...)`)
- [ ] Imagens salvas na pasta correta (`imagens/[sigla]/cap[N]/`)
- [ ] Nomes de arquivo seguem a convenção (minúsculas, sem acentos, hífens)
- [ ] Formatos adequados (SVG para diagramas, JPG para fotos, PNG para screenshots)

---

## 6. Template de Avaliação

Cada avaliação deve seguir esta estrutura:

```markdown
# 📝 Avaliação: Unidade [N] - [Nome do Módulo]
---

**Tema:** [Tema da unidade]

---

## Parte 1: Quiz Teórico (60 perguntas)

*Instrução: Assinale a alternativa correta.*

---

**1. [Pergunta completa e contextualizada]**
a) [Alternativa]
b) [Alternativa]
c) [Alternativa]
d) [Alternativa]

---

**2. [Pergunta]**
a) [Alternativa]
b) [Alternativa]
c) [Alternativa]
d) [Alternativa]

[... até a pergunta 60 ...]

---

## Parte 2: Boss Fight — Rubrica de Avaliação

| Critério | Excelente (10) | Bom (7) | Regular (4) | Insuficiente (1) |
|----------|----------------|---------|-------------|-------------------|
| [Critério 1] | [Descrição] | [Descrição] | [Descrição] | [Descrição] |
| [Critério 2] | [Descrição] | [Descrição] | [Descrição] | [Descrição] |

---

<details>
<summary><b>GABARITO</b></summary>

1. **A**
2. **C**
3. **B**
[... até 60 ...]

</details>
```

### Requisitos Obrigatórios da Avaliação

| Requisito | Valor |
|-----------|-------|
| Número de perguntas | **Exatamente 60** |
| Tipo | Múltipla escolha (a, b, c, d) |
| Gabarito | Em tag `<details>` (oculto) |
| Rubrica "Boss Fight" | Obrigatória na Parte 2 |

### Regras das Perguntas

- Cada tópico ensinado na apostila deve aparecer em **pelo menos 1 pergunta**
- As perguntas devem ser **contextualizadas** (cenários reais, não decoreba)
- As alternativas erradas devem ser **plausíveis** (não absurdas)
- O gabarito deve seguir o formato `N. **X**` (ex: `1. **A**`)

### ⚠️ VERIFICAÇÃO OBRIGATÓRIA PARA A IA

Antes de finalizar uma avaliação, a IA **DEVE**:

1. **Contar as perguntas** e garantir que são **exatamente 60**
2. **Contar os itens do gabarito** e garantir que são **exatamente 60**
3. **Verificar** que cada resposta do gabarito (A, B, C ou D) corresponde a uma alternativa existente
4. **Verificar** que a tag `<details>` está corretamente fechada com `</details>`
5. **Verificar** que a Parte 2 (Rubrica) está presente

Se qualquer item falhar, **corrija antes de salvar**.

---

## 7. Fluxo de Trabalho

### Fluxo A: Adicionar uma Unidade a um Módulo Existente

Este é o fluxo mais comum — adicionar a Unidade 6 ao FUTEC, por exemplo.

```
1. Ler o arquivo de referência (FUTEC.pdf.txt)
         ↓
2. Identificar quais tópicos a nova unidade vai cobrir
         ↓
3. Criar Apostila_FUTEC_6.md (seguindo o template)
         ↓
4. Criar Avaliacao_FUTEC_6.md (baseada na apostila)
         ↓
5. Registrar a unidade no painel Admin → Estrutura do Curso
         ↓
6. O servidor detecta os novos .md automaticamente ✅
```

**Checklist:**
- [ ] Criar `Apostila_[SIGLA]_[N].md`
- [ ] Criar `Avaliacao_[SIGLA]_[N].md`
- [ ] Registrar na Estrutura do Curso (Admin)
- [ ] Liberar conteúdo no Controle de Liberação (Admin)

### Fluxo B: Adicionar um Módulo Novo ao Sistema

Este fluxo é raro — só quando o SENAI adiciona uma nova unidade curricular.

```
1. Obter o documento de referência oficial do SENAI
         ↓
2. Criar o arquivo de referência: [SIGLA].pdf.txt
         ↓
3. Mapear quais tópicos cada unidade vai cobrir
         ↓
4. Criar apostilas e avaliações para cada unidade (Fluxo A)
         ↓
5. Registrar o módulo e unidades no painel Admin → Estrutura do Curso
         ↓
6. Configurar liberação no Controle de Liberação ✅
```

---

## 8. Formato do Arquivo de Referência

O arquivo de referência curricular deve seguir esta estrutura:

```txt
UNIDADE CURRICULAR: [Nome Completo] - XX horas
MÓDULO [TIPO DO MÓDULO]

Objetivo Geral: [Descrição do objetivo da unidade curricular]

1. Tópico Principal
1.1. Subtópico
1.2. Subtópico
1.2.1. Sub-subtópico

2. Tópico Principal
2.1. Subtópico
2.2. Subtópico
```

### Como Mapear Tópicos para as 5 Unidades

Cada módulo é dividido em **exatamente 5 unidades**. Todos os tópicos do arquivo de referência devem ser distribuídos entre essas 5 unidades. Nenhum tópico pode ser deixado de fora.

**Critérios de agrupamento:**

1. **Afinidade temática:** Agrupar tópicos relacionados (ex: "Hardware" e "Periféricos" juntos)
2. **Progressão de dificuldade:** Começar pelos fundamentos e avançar para temas complexos
3. **Equilíbrio de carga:** Cada unidade deve ter quantidade similar de conteúdo
4. **Pré-requisitos:** Se o Tópico 5 depende do Tópico 3, o Tópico 3 deve vir antes

**Formato genérico:**

```
Unidade 1: Tópicos X, Y     (fundamentos básicos — o aluno começa do zero)
Unidade 2: Tópicos Z, W     (conceitos intermediários — constrói sobre a Unidade 1)
Unidade 3: Tópicos A, B     (aplicações práticas — o aluno já tem base)
Unidade 4: Tópicos C, D     (temas avançados — aprofundamento)
Unidade 5: Tópicos E, F     (integração e revisão — conecta tudo)
```

### Exemplo Real: Distribuição do FUTEC (13 tópicos → 5 unidades)

O arquivo `FUTEC.pdf.txt` possui 13 tópicos. Eles foram distribuídos assim:

| Unidade | Tópicos do PDF | Assunto | Subtópicos cobertos |
|---------|---------------|---------|---------------------|
| **1** | Tópico 6, 1, 2 | Hardware, Windows, Linux | 6.1–6.5, 1.1–1.10, 2.1–2.8 |
| **2** | Tópico 7, 8 | Indústria 4.0, Internet | 7.1–7.2, 8.1–8.7 |
| **3** | Tópico 4, 5, 11 | Planilhas, E-mail, Apresentações | 4.1–4.5, 5.1–5.5, 11.1–11.4 |
| **4** | Tópico 3, 13 | Banco de Dados, Programação | 3.1–3.4, 13.1–13.3 |
| **5** | Tópico 9, 10, 12 | Web Apps, Mídias Sociais, Aplicativos | 9.1–9.5, 10.1–10.4, 12.1–12.6 |

> **⚠️ REGRA:** Ao mapear, a IA deve listar TODOS os subtópicos de cada tópico. Se o Tópico 1 tem subtópicos 1.1 a 1.10, todos devem aparecer em alguma seção da apostila correspondente. Ao final das 5 unidades, 100% dos tópicos e subtópicos do PDF devem estar cobertos.

---

## 9. Verificação de Qualidade

Antes de publicar qualquer conteúdo, verifique:

### Cobertura de Tópicos
- [ ] Todos os tópicos do arquivo de referência estão cobertos em alguma apostila?
- [ ] Cada capítulo indica qual tópico oficial está cobrindo?
- [ ] Nenhum tópico da referência foi esquecido?

### Cobertura da Avaliação
- [ ] Todas as 60 perguntas correspondem a conteúdo ensinado na apostila?
- [ ] Cada tópico ensinado aparece em pelo menos 1 pergunta?
- [ ] As respostas do gabarito estão corretas?
- [ ] O formato do gabarito está em `<details>` com `N. **X**`?

### Qualidade de Linguagem
- [ ] Linguagem acessível para jovens de 16–22 anos?
- [ ] Termos técnicos têm explicação?
- [ ] Existem exemplos práticos e industriais?
- [ ] Contexto brasileiro (marcas, preços em R$, empresas)?

### Requisitos de Tamanho
- [ ] Apostila com no mínimo 400 linhas?
- [ ] No mínimo 3 capítulos?
- [ ] Tabelas explicativas presentes?
- [ ] Avaliação com exatamente 60 perguntas?

---

## 10. Regra de Ouro

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   Se está na AVALIAÇÃO, deve ter sido ensinado na APOSTILA.          ║
║   Se está no ARQUIVO DE REFERÊNCIA, deve estar na APOSTILA.          ║
║                                                                       ║
║   Referência (.txt) → Apostila (.md) → Avaliação (.md)              ║
║        ✅                  ✅                ✅                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```
