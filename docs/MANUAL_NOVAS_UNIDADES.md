# 📖 MANUAL: Como Adicionar Novas Unidades e Referências ao SENAI 4.0

Este documento explica passo a passo como adicionar novas unidades e referências curriculares ao sistema.

---

## 📚 Referências Curriculares (FUTEC e FECOP)

O sistema usa arquivos de referência curricular para definir os tópicos de cada módulo.

### Arquivos Atuais
- **FUTEC.pdf.txt** → Referência do módulo Fundamentos de TI (80h) - Módulo Básico
- **FECOP.pdf.txt** → Referência do módulo Colaboração e Produtividade (120h) - Módulo Específico
- **IRCOM.pdf.txt** → Referência do módulo Instalação de Recursos Computacionais (120h)

---

## 🔄 Como Adicionar Nova Referência Curricular

### Passo 1: Criar o Arquivo de Referência
Criar um arquivo `.txt` com a estrutura:
```txt
UNIDADE CURRICULAR: [Nome da Unidade Curricular] - XX horas
MÓDULO [Nome do Módulo]

Objetivo Geral: [Descrição do objetivo]

1. Tópico Principal
1.1. Subtópico
1.2. Subtópico

2. Tópico Principal
2.1. Subtópico
```

### Passo 2: Mapear Tópicos para Unidades
Associar cada tópico da referência a uma unidade:
```
Unidade 1: Tópicos 1, 2
Unidade 2: Tópicos 3, 4
```

---

## 📏 Padrões de Tamanho e Linguagem (IMPORTANTE)

### Público-Alvo
- **Idade:** 16 a 22 anos
- **Perfil:** Alunos de cursos técnicos do SENAI
- **Contexto:** Formação para o mercado de trabalho brasileiro (indústria 4.0, escritórios, datacenters)

### Linguagem
- Usar linguagem **natural e acessível**
- Evitar termos técnicos sem explicação prévia
- Adicionar **analogias do dia a dia** para facilitar o entendimento
- Exemplos devem ser **próximos da realidade** dos alunos
- Contextos industriais brasileiros (usinas, escritórios, manutenção de PCs)

### Apostilas
- **Tamanho mínimo:** 400 linhas (NÃO é limite máximo!)
- **Estrutura:** Mínimo 3 capítulos
- **Cada capítulo deve conter:**
  - Introdução teórica (explicar o "porque" - não só o "quê")
  - Exemplos práticos/industriais (onde vou usar isso no trabalho?)
  - Tabelas explicativas
  - Seções opcionais (1.1, 1.2, etc.) para aprofundamento
- **Linguagem engaging:** Usar perguntas, desafios, provocações
- **OBRIGATÓRIO:** Indicar o tópico do arquivo de referência no título do capítulo!
  - Exemplo: `## 📜 CAPÍTULO 1: História da Computação (Tópico 1)`

### 📚 Padrão de Enriquecimento (Para o Brasil)

Ao criar ou enriquecer uma apostila, incluir:

- [ ] Exemplos de marcas/modelos disponíveis no Brasil
- [ ] Onde comprar (magazines, lojas online brasileiras)
- [ ] Preços aproximados em reais (R$)
- [ ] Contextos de trabalho brasileiros (empresas, indústrias)
- [ ] Erros comuns e como evitá-los
- [ ] Passo a passo detalhado para atividades
- [ ] Atualizações para o ano corrente (2025-2026)
- [ ] Leituras complementares recomendadas (livros, canais, sites)
- [ ] Glossário de termos técnicos
- [ ] Resumo do capítulo ao final

### Avaliações
- **Número de perguntas:** EXATAMENTE 20 perguntas por avaliação
- **Estrutura:** 20 questões de múltipla escolha (a, b, c, d)
- **Gabarito:** 20 respostas no final (usar formato details)
- **Boss Fight:** Rubrica de avaliação com critérios objetivos

### Índice na Página Inicial
O índice deve mostrar:
- Nome do módulo (FUTEC/FECOP/IRCOM)
- Carga horária
- Lista de unidades com os tópicos abordados

**Modelo do índice no HTML:**
```html
<div class="module-index">
    <h4><span class="module-tag basics">FUTEC</span> Fundamentos de TI (80h)</h4>
    <table class="index-table">
        <tr><td><strong>Unidade 1</strong></td><td>📝 Tópicos...</td></tr>
    </table>
</div>
```

---

## 📂 Estrutura de Arquivos (Unidades)

O sistema usa a seguinte nomenclatura: 

```
Apostila_Missao_X.md        → Apostila da Unidade X (Fundamentos)
Apostila_Colaboracao_Missao_X.md  → Apostila da Unidade X (Colaboração)
Avaliacao_Fundamentos_Missao_X.md → Avaliação da Unidade X (Fundamentos)
Avaliacao_Colaboracao_Missao_X.md  → Avaliação da Unidade X (Colaboração)
```

---

## Passo 1: Criar os Arquivos

### 1.1 Apostila de Fundamentos
Criar arquivo: `Apostila_Missao_6.md`
```markdown
# 📁 Unidade 6: [Título da Unidade]

> **Carga Horária Estimada:** XX Horas
> **Foco:** [Descrição breve]
> **Baseado nos Tópicos Oficiais do SENAI:** Tópico X

---

## 📝 CAPÍTULO 1: [Título] (Tópico X)
[Conteúdo do capítulo]
```

### 1.2 Apostila de Colaboração
Criar arquivo: `Apostila_Colaboracao_Missao_6.md`
```markdown
# 📁 Unidade 6: [Título da Unidade]

> **Carga Horária Estimada:** XX Horas
> **Foco:** [Descrição breve]
> **Baseado nos Tópicos Oficiais do SENAI (FECOP):** Tópico X

---

## 📝 CAPÍTULO 1: [Título] (Tópico X)
[Conteúdo do capítulo]
```

### 1.3 Avaliação de Fundamentos
Criar arquivo: `Avaliacao_Fundamentos_Missao_6.md`
```markdown
# 📝 Avaliação: Unidade 6 - Fundamentos de TI
---

**Tema:** [Tema da unidade]

---

## Parte 1: Quiz Teórico (20 perguntas)

**1. [Pergunta]**
a) [Alternativa]
b) [Alternativa]
c) [Alternativa]
d) [Alternativa]

[...mais perguntas...]

---

<details>
<summary><b>GABARITO</b></summary>
1. X 2. X 3. X ...
</details>
```

### 1.4 Avaliação de Colaboração
Criar arquivo: `Avaliacao_Colaboracao_Missao_6.md`
(seguir mesmo modelo acima)

---

## Passo 2: Gerar o data.js

Executar no terminal:
```bash
node generate_data.js
```

Este comando lê todos os arquivos `.md` e gera o `data.js` automaticamente.

---

## Passo 3: Adicionar ao Índice (index.html)

No arquivo `index.html`, localize a seção do índice e adicione:

```html
<tr>
    <td><strong>Unidade 6</strong></td>
    <td>📝 [Tópicos abordados]</td>
</tr>
```

---

## Resumo: Checklist para Adicionar 1 Nova Unidade

- [ ] Criar `Apostila_Missao_X.md`
- [ ] Criar `Apostila_Colaboracao_Missao_X.md`
- [ ] Criar `Avaliacao_Fundamentos_Missao_X.md`
- [ ] Criar `Avaliacao_Colaboracao_Missao_X.md`
- [ ] Executar `node generate_data.js`
- [ ] Atualizar o índice no `index.html`

---

## Observações Importantes

1. **Nomenclatura:** Sempre usar "Unidade X" (não "Missão")
2. **Títulos nos arquivos:** O sistema extrai o título automaticamente do arquivo markdown
3. **Gabarito:** Usar formato `<details>` para ocultar respostas
4. **Emojis:** Usar emojis nos títulos para identificação visual

---

## Exemplos de Tópicos (para referência FUTEC)

| Unidade | Tópicos |
|---------|----------|
| 1 | Sistemas Operacionais, Hardware |
| 2 | Indústria 4.0, Internet |
| 3 | Planilhas, E-mail, Apresentações |
| 4 | Banco de Dados, Programação |
| 5 | Web Apps, Mídias Sociais |

---

## Exemplos de Tópicos (para referência FECOP)

| Unidade | Tópicos |
|---------|----------|
| 1 | Agenda Eletrônica, Grupos |
| 2 | Armazenamento em Nuvem |
| 3 | Planilhas Avançadas |
| 4 | Reuniões Online |
| 5 | Projetos, Formulários |

---

## ✅ Checklist de Cobertura por Unidade (OBRIGATÓRIO)

Antes de finalizar qualquer apostila ou avaliação, você DEVE verificar:

### 1. Cobertura de Tópicos
- [ ] Todos os tópicos do arquivo de referência (.txt) estão cobertos na apostila?
- [ ] Cada tópico do IRCOM/FUTEC/FECOP aparece em alguma apostila?

### 2. Cobertura de Avaliação
- [ ] Todas as perguntas da avaliação correspondem a conteúdo ensinado na apostila?
- [ ] Cada tópico ensinado aparece em pelo menos 1 pergunta?
- [ ] As respostas estão corretas? (verificar gabarito)

### 3. Qualidade de Linguagem
- [ ] Linguagem é acessível para alunos de 16-22 anos?
- [ ] Existem exemplos práticos/industriais?
- [ ] Termos técnicos têm explicações?

### 4. Tamanho
- [ ] Apostila tem no mínimo 400 linhas?
- [ ] Tem no mínimo 3 capítulos?
- [ ] Tem tabelas explicativas?

### Fluxo de Verificação:
```
Arquivo de Referência (.txt) → Apostila (.md) → Avaliação (.md)
         ✅                      ✅                ✅
```

> **REGRA DE OURO:** "Se está na avaliação, deve ter sido ensinado na apostila. Se está no arquivo de referência, deve estar na apostila!"
