# 📊 FECOP 3: O Cérebro Fabril: Planilhas Avançadas, Dashboards e Macros

> **Carga Horária Estimada:** 24 Horas
> **Foco:** Planilhas Eletrônicas Avançadas, Modelagem de Tabelas Dinâmicas, Dashboards (B.I) e Automação Computacional por Macros (VBA).
> **Baseado nos Tópicos Oficiais do SENAI (FECOP):** Tópico 3.

Nós vimos as condicionais básicas do Excel `=SE()` na Missão 3 de Fundamentos. O que veremos agora não tem nenhuma relação com "tabelas para imprimir". 
Nesta Missão de Módulo Avançado, nós não "digitamos" dados; nós ingerimos bases de dados gigantescas de 50.000 linhas da usina e operamos o milagre da Transmutação Analítica. 

Você aprenderá as práticas do **B.I (Business Intelligence - Inteligência de Negócios)**: A capacidade monstruosa de transformar letras frias e mortas armazenadas no SharePoint em painéis gráficos interativos (Dashboards) que dizem ao Diretor Executivo onde o navio de carga está afundando, usando apenas 3 cliques de mouse e a automação "fantasma" das Macros.

---

## 🎲 CAPÍTULO 1: O Cubo de Dados e as Tabelas Dinâmicas (Pivot Tables)

Imagine que o sistema SAP da usina cuspiu um relatório bruto de 40.000 linhas detalhando cada peça vendida nos últimos 10 anos, cruzando com data, Estado (SP/MG/RJ), nome do mecânico e preço. 
O Presidente liga no seu ramal e ordena: *"Quero saber, em 5 minutos, qual dos 18 mecânicos deu mais prejuízo quebrando peças em Minas Gerais durante o inverno de 2022"*. 

O analista amador entra em pânico, usa a calculadora e passa 15 horas tentando somar na mão. Ele é demitido na sexta-feira. 
O Analista Avançado utiliza a arma suprema de esmagamento de matrizes: A **Tabela Dinâmica (Pivot Table)**.

### 1.1 A Aglutinação (Sumarização) Instantânea
Uma Tabela Dinâmica não escreve nada de novo. Ela é uma "Lente de Aumento Matemática". Ela lê as 40.000 linhas brutas e permite que você arraste a palavra `ESTADO` para a caixa de *Linhas*, e a palavra `CUSTO` para a caixa de *Valores*. Em 0,3 segundos, o mecanismo esmaga as 40.000 linhas num resumo de 3 linhas dizendo exatamente o custo aglutinado de SP, MG e RJ.

### 1.1.1 Campos de Tabela Dinâmica
| Campo | Função | Exemplo |
|---|---|---|
| Linhas | Quebrada por categoria | Estado, Produto |
| Colunas | Colunas adicionais | Mês, Região |
| Valores | Cálculo agregado | Soma, Média, Contagem |
| Filtros | Filtrar Geral | Ano, Departamento |

### 1.1.2 Funções de Agregação
*   **SOMA:** Total de valores
*   **CONTAR:** Número de registros
*   **MÉDIA:** Valor médio
*   **MÁXIMO/MÍNIMO:** Extremos
*   **DESVPAD:** Desvio padrão
*   **CONT.VALORES:** Contagem não vazia

### 1.1.3 Agrupamento de Dados
*   **Agrupar por data:** Dia, mês, trimestre, ano
*   **Agrupar por número:** Faixas (0-10, 11-20)
*   **Agrupar por texto:** Categorias personalizadas

### 1.1.4 Tabelas Dinâmicas Recomendadas
Excel pode sugerir automaticamente análises úteis:
*   Analisar dados → Tabelas dinâmicas recomendadas
*   Múltiplas opções de resumo
*   Rápido para iniciantes

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 1: Modelando o Caos (Tabela Dinâmica)
**Objetivo Tático:** Eliminar fórmulas complexas e o medo de relatórios infinitos. Os alunos aprenderão o motor de "Drag and Drop" (Arrastar e Soltar) que resume cenários industriais colossais na velocidade da cognição visual.

**Passo a Passo em Sala de Aula:**
1.  **Geração do Dado Sujo:** O professor deve exigir a criação de um bloco de dados cru com 15 linhas (Data, Nome_Operador, Maquina, Valor_Manutencao) preenchido de forma totalmente desordenada.
2.  **O Portal da Transformação:** A turma selecionará a tabela inteira com o mouse, clicará na aba suprema do Excel: **Inserir**, seguida pela sagrada opção **Tabela Dinâmica**.
3.  O Excel criará uma aba celestial totalmente vazia à esquerda, e um painel lateral de comando à direita dividido em 4 quadrantes críticos (Filtros, Colunas, Linhas e Valores).
4.  **O Dedo do Arquiteto:** Peça aos alunos que cliquem na palavra `Nome_Operador` e a mantenham segurada pelo mouse, arrastando-a para soltar no pequeno quadrante **"Linhas"**. Instantaneamente, o Excel removerá as dezenas de nomes repetidos e projetará na tela uma lista filtrada e única dos operadores.
5.  **A Matemática Inconsciente:** Em seguida, arrastem `Valor_Manutencao` para o quadrante **"Valores"**. Como a coluna possui números, o sistema imediatamente intui a Somatória. O relatório que o presidente pediu surgiu na tela na fração exata de dois movimentos de pulso do estudante. O poder de fogo corporativo da Tabela Dinâmica foi compreendido visceralmente.

---

## 📈 CAPÍTULO 2: A Sala de Guerra Visual (O Dashboard Interativo)

Diretores de Indústria não olham para tabelas de números; eles não têm tempo. A Tabela Dinâmica gerada no capítulo anterior deve ser transmutada para "A Camada de Apresentação Final". Essa técnica de construção civil cibernética é chamada de **Dashboard (Painel de Bordo)**.

Um Dashboard de Inteligência não é um "gráfico parado". Ele é uma "Mesa de DJ". Ele contém botões pulsantes chamados de **Segmentadores de Dados (Slicers)**. Quando o Diretor em Nova Iorque clica no botão grande e azul que diz "SÃO PAULO", dez gráficos coloridos diferentes na tela inteira giram os ponteiros fisicamente ao mesmo tempo, filtrando toda a matemática exclusivamente para a filial paulista. 

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 2: Construindo O Cockpit Fabril
**Objetivo Tático:** Entender a essência do "Business Intelligence" e do UI/UX. Os alunos pegarão o esqueleto sem graça da Tabela Dinâmica e erguerão os botões interativos conectando as veias do gráfico.

**Passo a Passo em Sala de Aula:**
1.  **O Gráfico Responsivo:** Clicando em cima da Tabela Dinâmica (do exercício anterior), o aluno vai ao menu superior e aciona **Gráfico Dinâmico (Pivot Chart)**. Escolhe um gráfico de Colunas arrojado. O gráfico reflete perfeitamente o número na tela.
2.  **A Injeção do Controle Remoto (Slicers):** A verdadeira mágica industrial: Com o gráfico selecionado, o aluno entra na aba de Análise do Gráfico e atira no botão **Inserir Segmentação de Dados**.
3.  **Modelagem das Chaves Múltiplas:** Uma caixa aparecerá listando os cabeçalhos. O professor manda que escolham `Maquina`.
4.  Surge na tela um sofisticado controle remoto azul contendo botões físicos com o nome das máquinas (Ex: Torno A, Esteira B).
5.  *A Dança Sincronizada:* Ao pressionarem no botão "Esteira B", a turma assistirá admirada o grande gráfico pular as barras e se remodelar vivo, e a Tabela Dinâmica encolher os números simultaneamente em segundo plano. Eles acabam de construir uma *Inteligência Gráfica de Liderança Parametrizada*, algo que empresas de TI cobram fortunas para criar do zero.

### 2.4 Tipos de Gráficos para Dashboard
| Tipo | Uso | Exemplo |
|---|---|---|
| Colunas | Comparação entre categorias | Vendas por região |
| Barras | Ranking horizontal | Top 10 produtos |
| Linha | Evolução temporal | Receita mensal |
| Pizza | Participação | Market share |
| Área | Tendência acumulada | Crescimento |
| Combinação | Múltiplas métricas | Meta + Real |

### 2.5 KPIs Industriais Fundamentais
*   **OEE (Overall Equipment Effectiveness):** Eficiência global de equipamentos
*   **MTBF:** Tempo médio entre falhas
*   **MTTR:** Tempo médio de reparo
*   **Downtime:** Tempo de parada
*   **Cycle time:** Tempo de ciclo

### 2.6 Dashboards em Power BI
*   **Conexão com múltiplas fontes:** Excel, SQL, API
*   **DAX:** Linguagem de fórmulas avançadas
*   **Publicação:** Compartilhar online
*   **Atualização automática:** Scheduled refresh

---

## 👻 CAPÍTULO 3: O Fantasma da Automação (Gravação de Macros e VBA)

O ápice da preguiça genial da tecnologia. Todo dia de manhã, o funcionário da usina recebe o arquivo CSV do banco do Brasil. O arquivo vem feio. Ele gasta 20 minutos formatando, colocando borda preta, negrito, filtrando os devedores e pintando a linha do total de vermelho sangue. Todos os dias da sua vida durante dez anos. 

O engenheiro odeia repetir tarefas humanas robóticas. Ele usa a programação **VBA (Visual Basic for Applications) e a Macro**.

### 3.1 A Escravização do Código
A Macro é um gravador de fantasmas. Quando você aperta o botão `Gravar`, o Excel liga um radar no seu mouse. Você arruma a planilha feia (põe bordas, pinta de vermelho). Quando termina, você aperta o botão `Parar Gravação`.
Por baixo da interface oculta (No ambiente pesado de código de Desenvolvedor), o Excel assistiu seus movimentos e transcreveu suas dezenas de cliques em linhas arcanas de programação `VBA` de altíssimo nível.
No dia seguinte, quando o novo arquivo sujo do banco chegar, você não move o mouse. Você apenas clica em um grande botão verde na tela chamado `Auto-Formatar`. A "alma invisível da Macro" entra no teclado e refaz as 20 formatações frenéticas e cliques de mouse nos bastidores de forma invisível em impressionantes 1,5 segundo. O seu trabalho de meia hora diária acaba de ser substituído por um clique de botão robótico eterno. Você venceu a corrida dos ratos.

### 3.1.1 Estrutura de Uma Macro VBA
```vba
Sub NomeDaMacro()
    ' Comentário explicativo
    Range("A1").Select
    Selection.Font.Bold = True
    ' Mais ações...
End Sub
```

### 3.1.2 Eventos e Gatilhos
*   **Atalho de teclado:** Ctrl+Shift+Letra
*   **Botão de formulário:** Clique visual
*   **Evento de planilha:** Change, Open
*   **Tempo (Timer):** Execução automática

### 3.1.3 Melhores Práticas em Macros
*   Sempre habilitar erros com `On Error Resume Next`
*   Desligar ScreenUpdating durante execução
*   Usar variáveis para referências
*   Documentar o código

### 3.1.4 Proteções e Segurança
*   **Nível de macro:** Habilitar/desabilitar
*   **Assinatura digital:** Validar origem
*   **Senha no VBA:** Proteger código

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 3: A Evocação do Fantasma (Automação Visual)
**Objetivo Tático:** Remover a redoma mística da programação de código e provar ao aluno que ele é capaz de escravizar robôs sistêmicos nas planilhas gravando comportamentos de máquina sem saber digitar linguagem C++.

**Passo a Passo em Sala de Aula:**
1.  **A Abertura do Laboratório Secreto:** Por segurança, a Microsoft esconde a área letal do código. Os alunos devem clicar na faixa superior preta (Ribbon) com o botão direito e escolher "Personalizar Faixa de Opções". Ali, ativarão o quadrante secreto e restrito chamado **Desenvolvedor**.
2.  **O Palco da Simulação:** Eles digitarão na célula A1 o texto cru e sem graça: `Relatório Bruto Diário`.
3.  **A Câmera, Luz, Ação:** Na nova e temida aba Desenvolvedor superior, os alunos pressionam o botão vermelho da coragem: **Gravar Macro**. O sistema pergunta um nome: `Automacao_Absoluta`. E eles dão o OK (Luz verde piscando. O radar de ações está gravando).
4.  **A Dança Perfeita (Não devem errar cliques aqui):**
    * Eles clicam na célula A1.
    * Vão à aba Página Inicial e aumentam a letra para tamanho 24.
    * Pintam de Vermelho-Fogo com Borda Grossa externa preta.
    * Injetam o fundo amarelo de marcação.
5.  **Corte, Corta!** Retornam à aba Desenvolvedor correndo e apertam no botão vital e irreversível de **Parar Gravação**. O Fantasma do script foi fechado no vidro em código VBA.
6.  *O Ápice de Reengenharia:* O professor manda os alunos irem numa Célula Nova, limpa. Criarem um Quadrado bonitinho qualquer. Botão direito em cima da Forma > **Atribuir Macro...** e linkam com o "Automacao_Absoluta".
7.  Eles escrevem um texto normal numa célula aleatória. E agora apertam o misterioso Quadrado-Botão recém criado. O aluno sentirá o poder esmagador de Arquitetura quando o texto pular magicamente e for envelopado em vermelho, tamanho 24 com borda preta em milissegundos sem ele mover o pulso em 10% de esforço físico!

---

## ⚔️ PROVA FINAL: O Analista de Business Intelligence

Prove que você domina planilhas avançadas, dashboards e automação:

---

**Questão 1:**
O diretor exige um relatório que resuma, em segundos, o custo total de manutenção por máquina, a partir de uma tabela bruta de 80.000 linhas exportada do SAP. Qual recurso do Excel (Tópico 3) realiza essa sumarização instantânea sem fórmulas manuais?

1.  A) Função `=SOMASE()` aplicada manualmente em cada máquina.
2.  B) Tabela Dinâmica (Pivot Table) — arrasta os campos desejados e o motor matemático resume os 80.000 registros instantaneamente.
3.  C) Formatação Condicional para colorir as células de custo alto em vermelho.
4.  D) Macro VBA que percorre cada linha e soma os valores um a um.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Tabela Dinâmica (Pivot Table).
**Por que?** A Tabela Dinâmica é um motor de sumarização que processa volumes massivos de dados em frações de segundo — sem fórmulas manuais. Com simples drag & drop (arrastar e soltar) dos campos para as áreas de Linhas/Valores, ela agrega e resume automaticamente qualquer dimensão do dado bruto, transformando 80.000 linhas em um relatório de 5 linhas.
</details>

---

**Questão 2:**
O Dashboard do diretor possui um gráfico de barras mostrando custos de todas as filiais. O diretor quer, com um único clique, filtrar o gráfico para mostrar apenas os dados da filial de Sertãozinho sem alterar os dados originais. Qual elemento interativo (Tópico 3) é inserido no Dashboard para essa função?

1.  A) Uma fórmula `=SE()` condicional vinculada ao gráfico.
2.  B) Um Segmentador de Dados (Slicer) — botões visuais que filtram simultaneamente todos os gráficos e tabelas conectados ao mesmo clique.
3.  C) Uma macro VBA que apaga as linhas das outras filiais ao ser executada.
4.  D) Uma Validação de Dados com lista suspensa na célula A1.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Segmentador de Dados (Slicer).
**Por que?** Os Slicers são controles visuais conectados às Tabelas Dinâmicas e Gráficos Dinâmicos. Ao clicar no botão "Sertãozinho", todos os elementos conectados filtram simultaneamente — sem alterar os dados originais e sem fórmulas. São os "controles remotos" do Dashboard interativo corporativo.
</details>

---

**Questão 3:**
Um analista grava uma Macro no Excel que formata automaticamente um relatório sujo (aplica bordas, cores e ordenações). No dia seguinte, um novo arquivo sujo chega. Qual é a forma mais eficiente de reaplicar toda a formatação sem regravar a Macro (Tópico 3)?

1.  A) Regravar a Macro do zero para o novo arquivo.
2.  B) Copiar e colar o relatório sujo sobre o arquivo original que já foi formatado.
3.  C) Atribuir a Macro gravada a um botão ou atalho de teclado — ao pressionar, o robô executa automaticamente todas as etapas de formatação no novo arquivo em segundos.
4.  D) Abrir o Editor VBA e editar o código linha a linha para adaptar ao novo arquivo.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** C) Atribuir a Macro a um botão ou atalho de teclado.
**Por que?** A Macro grava as ações como código VBA reutilizável. Ao atribuí-la a um botão visual ou atalho (ex: Ctrl+Shift+F), qualquer novo arquivo pode ser formatado com um único clique — o robô executa todas as dezenas de ações gravadas em 1-2 segundos, independente do conteúdo. Esse é o conceito de automação de processos repetitivos.
</details>

---

*Parabéns. Os dados brutos foram transmutados em inteligência executiva. Avance para a Missão 4: Reuniões Híbridas e Apresentações de Alto Impacto.*

