# 🚀 FECOP 5: O Estado da Arte: Automação, Metodologias Ágeis e Coleta Estruturada

> **Carga Horária Estimada:** 28 Horas
> **Foco:** Metodologia Kanban para Indústrias (Planner), Higienização Lógica de Dados (Forms) e Automação Robótica de Processos Sistêmicos (RPA / Power Automate).
> **Baseado nos Tópicos Oficiais do SENAI (FECOP):** Tópico 4.4, Tópico 4.5, Tópico 4.6 e Tópico 4.1.

Você chegou ao cume da pirâmide tecnológica. Tudo o que você estudou desde a primeira apostila (Gargalos de hardware, Linux, Redes, Bancos de Dados e Sincronização) será amarrado nesta missão colossal.

Na base da Indústria, as peças brutas movem as máquinas. No topo da Indústria Corporativa, **Os Projetos Múltiplos** e a **Automação de Tarefas** movem as mentes. 
Um gerente de engenharia 4.0 não opera 1 projeto; ele gerencia 45 sub-projetos encadeados simultaneamente. Sem uma Matriz de Gestão e sem Automação Robótica, o cérebro dele frita e os prazos caem, gerando falência institucional.

A Missão 5 vai transmutar a teoria crua numa engrenagem que respira, avalia e trabalha sozinha 24h por dia pela corporação.

---

## 🗂️ CAPÍTULO 1: Projetos Ágeis e a Filosofia Kanban (Tópicos 4.4 e 4.5)

Antigamente, usava-se a técnica "Cachoeira" (Waterfall). A diretoria perdia 6 meses escrevendo um PDF de 500 páginas sobre "Como faremos a nova Colheitadeira". Quando o trator ficava pronto no ano seguinte, a peça já era obsoleta frente ao mercado. Isso gerava hemorragia de caixa (prejuízo).
O Vale do Silício roubou a técnica "Lean" dos japoneses da Toyota e formou as **Metodologias Ágeis**.
Nos projetos Ágeis (Como Scrum ou Kanban), os escopos longos são rasgados. Você entrega pequenos pedaços utilizáveis da máquina a cada 15 dias ("Sprints"). Se errar, o erro custou apenas 15 dias de salário, e a rota é corrigida instantaneamente.

### 1.1 O Quadro Kanban Digital (O Cérebro Visual da Equipe)
A principal arquitetura visual ágil corporativa é o **Kanban**. Ele varre o fluxo da desorganização usando colunas processuais claras num software chamado *Microsoft Planner* (ou Trello / Jira).
Você divide o projeto do mês em centenas de pequenos post-its coloridos virtuais chamados "Cartões" (Tasks), que fluem da esquerda para a direita de forma inexorável na lousa.
1.  **Backlog / Para Fazer (A Fila):** Todas as ideias e ordens pendentes. Ficam represadas.
2.  **Em Andamento (O Gargalo Físico - WIP):** A coluna letal. Onde a equipe gasta energia (HH - *Human Hours*). O líder implanta um "WIP Limit" (Work in Progress Limit): Os 5 funcionários não podem colocar mais do que 5 cartões nesta coluna. Isso força o término letal da tarefa antes de abraçar a próxima, impedindo o estresse e a meia-produção.
3.  **Revisão (Qualidade / QA):** A auditoria do SENAI. O chefe de campo analisa.
4.  **Concluído (O Cemitério de Vitórias):** Entregue. O faturamento ocorre.

Ao olhar o Planner na tela do projetor da sala fabril, o gerente de Sertãozinho não precisa ligar para ninguém. Em meio segundo ele olha as cores dos cartões. Se houver 1 cartão verde em "Fazer", e 40 cartões vermelhos empilhados atrasados na coluna de "Revisão", ele entende a arquitetura do problema: os auditores de Qualidade da Usina são o "bottleneck" do fluxo. O sistema grita os defeitos visualmente.

### 1.1.1 Métricas Kanban
| Métrica | Descrição | Ação |
|---|---|---|
| Lead Time | Tempo total (criação → conclusão) | Identificar gargalos |
| Cycle Time | Tempo em execução | Otimizar processo |
| Throughput | Taxa de conclusão | Medir produtividade |
| WIP | Itens em andamento | Controlar fluxo |

### 1.1.2 Diferenças entre Metodologias
| Metodologia | Foco | Uso |
|---|---|---|
| Kanban | Fluxo contínuo | Melhoria gradual |
| Scrum | Sprints fixos | Projetos complexos |
| Scrumban | Híbrido | Flexibilidade |

### 1.1.3 Ferramentas de Gestão de Projetos
*   **Microsoft Planner:** Integração M365
*   **Trello:** Kanban simples
*   **Jira:** Enterprise, ágil
*   **Asana:** Colaboração

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 1: A Arquitetura do Quadro de Fluxo (Kanban)
**Objetivo Tático:** Eliminar o uso do caótico bloco de notas diário do trabalhador. A classe implantará, sob forte rigor de prazo e metadados, a gestão visual ágil de uma equipe de 4 pessoas de forma corporativa utilizando as estruturas em nuvem (Microsoft Planner).

**Passo a Passo em Sala de Aula:**
1.  **O Pátio Vazio:** Todos os alunos abrem o Microsoft Planner (office.com/planner) e erguem uma fundação central chamada `Reestruturação da Termoelétrica 2024`.
2.  **As Paredes do Flow:** O aluno (papel de Gestor Scrum Master) nomeia as colunas brutas como: `1. Espera Técnica`, `2. Usinagem em Andamento`, `3. Bloqueio Logístico`, `4. Montagem Finalizada`.
3.  **O Cartão Hiper-Denso (Task):** Ele clica no sinal de Mais (+) embaixo de "Espera Técnica". Se ele digitar "Comprar Peça", o professor zera a nota dele. Tarefas em metodologias ágeis exigem metadados (Inteligência Lógica). 
4.  O aluno abre o miolo do cartão recém nascido e preenche a arquitetura real:
    *   *Nome:* Aquisição Turbina 5A-WEG.
    *   *Data de Vencimento:* Hoje + 4 dias (Impõe uma espada temporal vermelha).
    *   *Atribuir A:* O Gestor escolhe o e-mail exato do parceiro de dupla no sistema, atrelando o CPF e a responsabilidade civil da peça.
    *   *Checklist:* O aluno cria sub-etapas internas menores (1. Cotar, 2. Assinar, 3. Pagar).
5.  *A Dança da Agilidade:* O parceiro de laboratório, na outra máquina, visualizará em tempo real o Cartão aparecer na sua nuvem. O aluno parceiro usa o mouse e "Arrasta" fisicamente a Turbina 5A da coluna de `Espera` e solta-a brutalmente na coluna de `Usinagem`. O chefe verá ao vivo as tarefas migrarem em fluxo constante na matriz de tempo, a lousa de equipe ganha vida.

---

## 📝 CAPÍTULO 2: Higienização de Dados (Formulários Digitais - Tópico 4.6)

Se a matriz de T.I criar um sistema de RH que aceita reclamações operárias via E-mail comum e pedir "Mande as falhas do seu turno", o operário 1 mandará uma linha curta: "A chapa molhou". O operário 2 fará um PDF de 14 páginas sobre goteiras.
Isso destrói o banco de dados. Um robô de SQL (estudado na Missão 4) não consegue ler PDFs misturados com linhas de e-mails para criar o gráfico da usina. Ele requer colunas padronizadas perfeitas.

Para consertar isso na raiz de contato humano (antes de encostar no DataCenter), a engenharia aplica a **Sanitização via Formulários Inteligentes (Microsoft Forms)**. 
O formulário tranca os graus de liberdade do usuário final. Ele não manda PDF; ele é forçado a clicar num campo "Qual Máquina?" (Restrito a escolha suspensa A, B ou C). "Grau de Severidade?" (Estrelas de 1 a 5). Quando os 10.000 operários clicarem 'Enviar', a nuvem já mastigou as vontades confusas humanas em uma Tabela Dinâmica do Excel perfeita, simétrica e blindada, instantaneamente, a zero custo humano de processamento de texto.

### 2.1.1 Tipos de Perguntas em Forms
| Tipo | Uso | Exemplo |
|---|---|---|
| Texto | Resposta aberta | Descrição do problema |
| Opção | Escolha única | Tipo de falha |
| Opções múltiplas | Múltipla escolha | Componentes afetados |
| Classificação | Escala 1-5 ou 1-10 | Nível de severidade |
| Data | Calendário | Data do evento |
| Upload | Arquivos | Foto da falha |

### 2.1.2 Fluxo de Trabalho com Forms
*   **Resposta → Excel:** Dados vão para planilha
*   **Resposta → Power BI:** Análise visual
*   **Resposta → Power Automate:** Automação

### 2.1.3 Compartilhamento Online
*   Link direto
*   Inserir no Teams/SharePoint
*   QR Code para acesso mobile

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 2: Coleta Blindada de Dados em Campo (Ramificação Lógica)
**Objetivo Tático:** Provar que a inteligência artificial da empresa começa na base da coleta. O analista construirá um Formulário de Vistoria Industrial imbuído de "Ramificações Booleanas", onde a I.A esconde ou puxa novas perguntas se adaptando à resposta técnica anterior do operário no chão de fábrica em tempo real.

**Passo a Passo em Sala de Aula:**
1.  **Fundação e Base Lógica:** Os alunos abrem o **Microsoft Forms**. E criam o "Sistema de Parada de Máquinas".
2.  **O Controle Paramétrico Fechado:** Eles criam a Pergunta Num 1 de [Opção]. Título: *Houve Desastre Operacional no seu Turno Hoje?* As únicas respostas blindadas criadas: `SIM` e `NÃO`.
3.  **A Coleta Diferida (Prova de Crime):** Criam uma Pergunta Num 2 do tipo [Upload de Arquivo]. Título: *Anexe o laudo em PDF ou a Foto da Caldeira em Chamas.* (Bloqueiam apenas para tamanho Mínimo OBRIGATÓRIO de 10 MB).
4.  **A Injeção do Cérebro Físico (A Ramificação):** É aqui que a classe sai do superficialismo. Se a resposta da Pergunta 1 for "NÃO", a T.I da empresa não tem tempo para deixar o operador rolar e ver as perguntas sobre fotos de acidentes. Eles vão aplicar a Inteligência Matemática Seletiva (O "IF/ELSE" visto na Missão 4).
5.  O aluno vai nos "três pontinhos (...)" da Pergunta 1 e aciona a engenharia pesada: **Adicionar Ramificação**.
6.  *O algoritmo é cravado na matriz:* Ao lado da resposta `NÃO`, eles alteram a regra *Avançar para o Próximo* e mudam drasticamente para **Fim do Formulário**. 
7.  *O Teste Final:* O Aluno testa o App e clica em NÃO. Todas as questões somem do celular da usina com a precisão de um cirurgião de dados, e a tela de envio pisca limpa. O Sistema não desperdiçou 5 minutos de processamento de tela com o operário cansado do turno de 12 horas lendo perguntas que não fazem sentido. Isso é governança total de banco de dados e UX.

---

## 🤖 CAPÍTULO 3: RPA (A Evocação do Robô Invisível via Power Automate - Tópico 4.1)

O apogeu da tecnologia empresarial chama-se **Robotic Process Automation (RPA)**. Se existisse um Deus Ex Machina no escritório, ele seria a Automação e Fluxo de Trabalho (Microsoft Power Automate).

Todo diretor repete ações burras sistemicamente: "Toda vez que a secretária mandar um anexo com a palavra Nota Fiscal (Gatilho), ele gasta 10 cliques baixando e salva na pasta C:\Finanças (Ação)". O Cérebro humano não foi desenvolvido, biologicamente, para copiar pedaços físicos da tela cem vezes. Ele erra.
O Arquiteto de Sistemas 4.0 ensina o Robô em Nuvem a copiar. 

### 3.1 Anatomia da Máquina de Deus (Gatilhos e Ações Algorítmicas)
Uma automação do Automate é dividida inteiramente nestes dois neurônios, operando na velocidade de um clique quântico na nuvem matriz 24 horas por dia:
1.  **O Gatilho (Quando algo desperta):** Um sensor IoT da Usina marcou 100° Graus; Alguém curtiu o post da empresa no Twitter; ou O Formulário que criamos antes recebeu a resposta `SIM (Desastre Operacional)`. O Robô acorda na nuvem americana.
2.  **As Ações Encadeadas (A Fúria Cega da Lógica):** Sem pedir a aprovação de ninguém, ele segue o algoritmo: 
    1. Ele extrai o E-mail da pessoa que respondeu;
    2. Salva a foto do fogo no SharePoint da pasta Secreta do CEO;
    3. Exige que o "Teams" envie uma mensagem urgente num balão Vermelho pro celular do Supervisor logado.
    Tudo em exatos `2 milissegundos`. 

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 3: A Invocação e O Nascimento do Robô
**Objetivo Tático:** A graduação máxima da turma da Escola de TI. O encerramento monumental da teoria. Os alunos farão os "3 softwares corporativos do gigante Microsoft (Forms, Outlook e Teams)" conversarem sozinhos e tomarem ação proativa automatizada usando a cola da linguagem RPA do Automate sem digitar "nenhuma linha C++ de programação bruta".

**Passo a Passo em Sala de Aula:**
1.  **A Construção do Cérebro Neural:** O Aluno abre a interface do **Power Automate** da escola. Inicia o pilar maestro apertando vigorosamente: **"Criar Novo Fluxo de Nuvem Automatizado"**.
2.  **A Implantação do Gatilho Mestre:** Ele busca entre os mil sistemas do banco mundial. O Aluno dita para a máquina: *"Quando uma Nova Resposta for Enviada pelo Microsoft FORMS"*. O Automate vai cruzar sua senha com os formulários dele, e ele deve selecionar a Matriz Mestra que ele criou no laboratório anterior: `Sistema de Parada de Máquinas`. A cabeça do Robô nasceu.
3.  **A Injeção do Braço de Reação:** O Aluno pressiona o grandioso sinal matemático de **Novo Passo (+)**.
    A I.A agora aguarda a ordem de retaliação do analista. O Aluno procura "Outlook (Office 365)" e a Ação fatal: **"Enviar um e-mail"**.
4.  **A Costura dos Dados Transdutores:** O painel pedirá "Para Quem?". O Aluno vai digitar o e-mail real do parceiro do laboratório ("O CEO"). 
    Mas no corpo do e-mail? Aqui nasce a magia. O Aluno vai clicar no botão azul de **"Conteúdo Dinâmico (Tokens)"**. A caixa de código expõe magicamente as "variáveis mortas" puxadas do celular do chão de fábrica: `[Nome de quem Preencheu]` e `[A Foto do Erro]`. Ele constrói a frase misturando robótica com o dado vivo puxado pela memória RAM do servidor Forms anterior: *"Atenção Chefe, a pessoa `[Token Nome]` enviou a foto `[Token Arquivo]` do acidente AGORA"*.
5.  *O Despertar da Máquina (Execução de Sala):* O aluno Salva o Fluxo. O parceiro abre o Forms pelo celular ou Aba Oculta, finge um acidente na caldeira, e dá Enviar. Em segundos, um alerta colossal piscará no e-mail vazio do Chefe da dupla recebendo um telegrama montado, processado e enviado 100% pelo construto cibernético da nuvem enquanto o aluno ficava de braços cruzados rindo. O esforço braçal do homem moderno foi finalmente substituído pelo Cripto-Silo do Automate. A classe inteira aplaude, o projeto da T.I está concluído.

---

## ⚔️ PROVA FINAL: O Arquiteto de Processos Automatizados

A batalha final. Prove que você domina Kanban, Forms e Automação Robótica:

---

**Questão 1:**
No quadro Kanban da usina, a coluna "Em Andamento" possui um WIP Limit (Limite de Trabalho em Progresso) de 5 cartões. Existem 5 cartões lá, e um novo problema urgente surge. O que um especialista em Metodologias Ágeis (Tópico 4.4) faz?

1.  A) Adiciona o 6º cartão à coluna "Em Andamento" porque a urgência justifica quebrar a regra.
2.  B) Prioriza terminar um dos 5 cartões existentes antes de mover o novo para "Em Andamento" — o WIP Limit existe para forçar a conclusão antes de iniciar novos itens.
3.  C) Move todos os 5 cartões de volta ao Backlog para dar espaço ao urgente.
4.  D) Cria uma nova coluna chamada "Urgente" para não violar o limite.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Concluir um cartão existente antes de iniciar o novo.
**Por que?** O WIP Limit é o coração do Kanban. Ele não é uma sugestão — é uma restrição sistêmica que força o foco e a conclusão. Violar o limite gera o "efeito multitarefa": todas as tarefas avançam lentamente e nada é concluído. O fluxo ágil exige que tarefas sejam finalizadas antes de novas serem iniciadas — disciplina que reduz drasticamente o tempo médio de entrega.
</details>

---

**Questão 2:**
Um formulário de vistoria industrial deve mostrar a pergunta "Tire uma foto da falha" somente se o operário responder "SIM" na pergunta "Houve falha hoje?". Se responder "NÃO", a pergunta da foto deve ser ocultada e o formulário encerrado. Qual recurso do Microsoft Forms (Tópico 4.6) implementa essa inteligência?

1.  A) Criar dois formulários separados — um para "SIM" e outro para "NÃO".
2.  B) Configurar a Lógica de Ramificação (Branching) — a resposta "SIM" redireciona para a próxima pergunta, enquanto "NÃO" redireciona diretamente para o "Fim do Formulário".
3.  C) Usar a validação de resposta obrigatória em todas as perguntas.
4.  D) Adicionar uma instrução de texto pedindo para o operário pular as perguntas que não se aplicam.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Lógica de Ramificação (Branching).
**Por que?** A Ramificação transforma o formulário linear em um fluxo condicional inteligente — equivalente ao `IF/ELSE` da programação. Cada resposta pode redirecionar o preenchedor para perguntas específicas ou encerrar o formulário. Isso garante dados limpos, experiência fluida para o usuário e elimina perguntas irrelevantes que degradam a qualidade do banco de dados coletado.
</details>

---

**Questão 3:**
A usina quer que, toda vez que alguém preencher o formulário de vistoria com resposta "SIM (Houve Falha)", um e-mail de alerta seja automaticamente enviado ao supervisor sem nenhuma ação humana. Qual tecnologia (Tópico 4.1) implementa esse fluxo autônomo?

1.  A) Criar uma Macro VBA no Excel que verifica o Forms manualmente toda hora.
2.  B) Configurar um Fluxo no Microsoft Power Automate com o Gatilho "Nova Resposta no Forms" e a Ação "Enviar E-mail" — o robô monitora 24h e age em milissegundos.
3.  C) Contratar um estagiário para monitorar o Forms e encaminhar os alertas por e-mail.
4.  D) Usar uma Tabela Dinâmica do Excel atualizada manualmente toda manhã.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Microsoft Power Automate — Gatilho + Ação.
**Por que?** O Power Automate é a plataforma de RPA (Robotic Process Automation) da Microsoft. O Gatilho "Nova Resposta no Forms" acorda o fluxo assim que alguém envia o formulário. A Ação "Enviar E-mail" executa imediatamente, em milissegundos, com os dados dinâmicos da resposta (nome do operário, foto da falha, horário). O robô nunca descansa, nunca erra, nunca esquece — é a automação corporativa na sua forma mais pura.
</details>

---

### 🎓 CONCLUSÃO OFICIAL E ÉPICA DO CURRÍCULO SENAI 4.0

O operário virou Analista. O digitador virou Arquiteto e Maestro do Software.

Você dominou cabos gigantes, processadores e linhas de comando frias no Modo Texto. Compreendeu os abismos temporais das agendas executivas. Transformou tabelas brutas de 50.000 linhas em painéis interativos do Dashboard. Manipulou a atenção de diretores com Pitch vetoriais perfeitos. Implantou quadros Kanban ágeis de missão crítica, formulários inteligentes com ramificações lógicas e, no ato final épico, invocou os robôs invisíveis do Power Automate para que as máquinas trabalhassem sozinhas enquanto você dormia.

**O diploma que você segura não é papel — é a armadura cibernética de um dos poucos sobreviventes treinados da verdadeira Quarta Revolução Industrial.**

*Boa sorte. Controle as máquinas da usina com honra e inteligência. Fim de jogo.* 🏆

