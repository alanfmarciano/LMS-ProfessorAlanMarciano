# ☁️ FECOP 2: Repositórios em Nuvem e a Governança de Arquivos

> **Carga Horária Estimada:** 24 Horas
> **Foco:** Armazenamento em Nuvem (OneDrive), Intranets Militares (SharePoint) e Governança de Links/Versionamento.
> **Baseado nos Tópicos Oficiais do SENAI (FECOP):** Tópico 5 e Tópico 4.7.

Na Missão 1 deste módulo, nós consertamos a Comunicação da empresa (Agenda e E-mail). Mas de nada adianta as pessoas conversarem perfeitamente se, na hora de enviar o projeto da nova peça, elas usarem pen-drives infectados ou anexarem versões erradas chamadas `projeto_final_agora_vai_3.docx`.

Nesta Missão, estudaremos o coração da Propriedade Intelectual da usina: Os Arquivos.
Descobriremos por que a indústria aboliu o salvamento físico no "Disco Local C:" dos funcionários e migrou inteiramente para as Nuvens Corporativas de sincronização híbrida.

---

## 🌩️ CAPÍTULO 1: O Paradigma da Nuvem Pessoal (OneDrive / Tópico 5)

A "Nuvem" não é um lugar etéreo no céu. A nuvem é, literalmente, o computador de outra pessoa (geralmente bilionários como Jeff Bezos ou Bill Gates), localizado em um galpão gigantesco no fundo do mar ou no deserto, fortemente refrigerado, para onde você terceiriza a guarda do seu conhecimento.

### 1.1 A Sincronização em Nível de Bloco
Antigamente, se você alterasse uma única vírgula em um vídeo de 1 Gigabyte (GB) e apertasse "Salvar", o sistema inteiro parava por 20 minutos para reenviar o vídeo colossal de 1 GB pela internet.
Sistemas de nuvem industrial modernos (OneDrive/Google Drive) utilizam "Sincronização em Nível de Bloco". Eles quebram seu arquivo invisivelmente em milhares de cubos matemáticos. Se você muda uma vírgula, o algoritmo de *Hash* identifica qual minúsculo cubo de 2 Kilobytes mudou e transmite **apenas ele** pela rede, sincronizando 1 GB de dados em milissegundos sem congelar a banda de rede da fábrica.

### 1.1.1 Tipos de Sincronização
| Tipo | Descrição | Uso Industrial |
|---|---|---|
| Sincronização total | Todo arquivo local espelhado na nuvem | Equipes pequenas |
| Sincronização em nível de bloco | Apenas partes modificadas | Arquivos grandes |
| Arquivos sob demanda | Ponteiro virtual, download sob demanda | Dispositivos limitados |
| Sincronização seletiva | Apenas pastas escolhidas | Economia de banda |

### 1.1.2 Resolução de Conflitos
Quando dois usuários editam o mesmo arquivo offline:
*   **Detecção automática:** Sistema identifica conflito
*   **Cópias de conflito:** Cria versões "Copia de [nome] - conflito"
*   **Merge manual:** Usuário escolhe qual manter
*   **Prevenção:** Coautoria em tempo real (SharePoint)

### 1.2 O Fim do "Espaço Insuficiente" (Arquivos Fantasmas)
Como um executivo viaja com um notebook ultra-leve que possui apenas 256GB de SSD, se o arquivo da diretoria da usina pesa 5 Terabytes?
Ele utiliza os **Arquivos Sob Demanda (Fantasmas)**. O OneDrive mapeia as pastas no computador, mostrando todos os ícones. Mas os arquivos não estão fisicamente no SSD; eles são "Links Holográficos" com o peso de zero bytes.
*   **Ícone de Nuvem Azul:** O arquivo está visível, mas reside apenas no servidor nos EUA. Se clicar, ele baixa instantaneamente.
*   **Ícone de Círculo Verde:** O arquivo foi baixado para o SSD e pode ser lido mesmo se a internet da fábrica cair.
A nuvem permite burlar as leis da física dos discos rígidos mecânicos estudados na Missão 1.

### 1.2.1 Configurações de Arquivos Sob Demanda
*   **Sempre manter neste dispositivo:** Baixa e mantém local (acesso offline)
*   **Liberação de espaço:** Remove cópia local, mantém apenas na nuvem
*   **Sincronização seletiva:** Escolher quais pastas baixar

### 1.2.2 Permissões de Arquivos em Nuvem
| Nível | Permissão | Uso |
|---|---|---|
| Leitor | Apenas visualização | Distribuição ampla |
| Colaborador | Ler e editar | Equipes de trabalho |
| Administrador | Controle total | Gestores de projeto |

### 1.2.3 Uploads e Downloads Corporativos
*   **Upload via navegador:** Limite de 15GB por arquivo
*   **OneDrive Sync:** Sem limite (sincroniza tudo)
*   **Drive File Stream (Google):** Similar ao OneDrive
*   **Transferências grandes:** Usar AzCopy ou gsutil

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 1: A Máquina do Tempo (Versionamento Forense)
**Objetivo Tático:** Eliminar o pânico da "perda de dados". Os alunos testarão o sistema de Versionamento de Histórico, uma tecnologia que grava infinitas realidades paralelas do mesmo arquivo silenciosamente, protegendo a empresa contra estagiários desavisados e ataques de Ransomware.

**Passo a Passo em Sala de Aula:**
1.  **A Criação da Matriz:** Os alunos acessam a interface Web do OneDrive ou SharePoint do laboratório e criam um novo arquivo limpo do Microsoft Word online nomeado `Contrato_De_Milhoes.docx`.
2.  **O Preenchimento:** Eles digitam o texto: *"A usina declara o lucro real de R$ 50 Milhões neste trimestre."* e aguardam o sistema salvar automaticamente na nuvem.
3.  **A Injeção do Desastre (Simulação de Erro):** O professor manda que eles fechem o arquivo, peçam para o colega do lado abrir o MESMO arquivo, apagar todo o texto de lucro e escrever: *"A usina faliu e não possui caixa."*, simulando uma sobreposição desastrosa ou vírus de arquivo. O colega salva e fecha. O desespero da perda de dados é simulado.
4.  **A Engenharia Reversa (Máquina do Tempo):** O aluno dono da conta clica no arquivo infectado/errado com o botão direito e seleciona **Histórico de Versão (Version History)**. 
5.  A barra lateral direita se abrirá exibindo minutos e segundos de cada batida no teclado. O aluno selecionará a versão de "5 minutos atrás", clicará em **Restaurar**, e a nuvem reescreverá fisicamente o arquivo morto devolvendo os 50 Milhões à tela. O "Ctrl+Z" acaba de quebrar a barreira do tempo.

---

## 🏰 CAPÍTULO 2: SharePoint e a Intranet Blindada (Tópico 4.7)

O OneDrive é seu "Armário Pessoal" na empresa (Se você for demitido, a T.I deleta o OneDrive inteiro). Mas onde fica a biblioteca central que pertence à Instituição? A tecnologia imortal do ecossistema Microsoft chama-se **SharePoint**.

### 2.1 A Extinção do Servidor de Arquivos Físico (A Letra Z:\)
No passado, a caldeiraria tinha um servidor gigantesco superaquecendo no porão chamado "Servidor Arquivo Morto (Z:\)". Quando a luz caía, ninguém trabalhava.
O SharePoint transporta a letra "Z:\" inteira para a nuvem da Microsoft. Ele é uma **Intranet Corporativa**: Uma página web blindada (como um Wikipédia privado) onde o setor de RH publica políticas, a Engenharia estoca plantas de tratores de 1990 e os gestores constroem Listas Lógicas. 
Se você for demitido, o projeto continua lá, imaculado, intocável, sob a posse abstrata da corporação.

### 2.1.1 Componentes do SharePoint
| Componente | Função | Exemplo |
|---|---|---|
| Site | Coleção de páginas | Portal de RH |
| Biblioteca | Armazenamento de arquivos | Documentos projeto |
| Lista | Dados tabulares | Base de equipamentos |
| Página | Interface personalizada | Dashboard |
| WebPart | Componente reutilizável | Feed de notícias |

### 2.1.2 Estrutura de Sites SharePoint
*   **Site de equipe:** Colaboração de projeto
*   **Site de comunicação:** Informações corporativas
*   **Hub de sites:** Agregação de portais
*   **Centro de arquivos:** Gestão documental

### 2.2 Coautoria Dinâmica: O Fim da Duplicação
Antes do SharePoint, a Ana criava a planilha de vendas e enviava por e-mail para o Roberto. O Roberto baixava e alterava. Agora existiam dois arquivos no universo (O da Ana e o do Roberto). Eles perdiam horas juntando os pedaços num "Arquivo_Final".
O modelo atual é a **Coautoria**. A Ana salva a planilha no SharePoint. Ela apenas convida o Roberto. Quando ambos abrem a planilha, a Ana vê o cursor verde do mouse do Roberto passeando pela tela dela em tempo real editando a Coluna B, enquanto ela edita a Coluna A. Um único arquivo, múltiplas mentes atuam perfeitamente sincronizadas por soquetes WebSocket invisíveis.

### 2.2.1 Editores que Suportam Coautoria
| Aplicativo | Coautoria em tempo real |
|---|---|
| Microsoft Word | ✅ |
| Microsoft Excel | ✅ |
| Microsoft PowerPoint | ✅ |
| Google Docs | ✅ |
| Google Sheets | ✅ |
| Google Slides | ✅ |

### 2.2.2 Gerenciamento de Rotinas e Workflows
*   **Aprovação de documentos:** Workflow de revisão
*   **Notificações automáticas:** Alertas de modificação
*   **Metadados:** Classificação de documentos
*   **Retenção:** Políticas de archive

### 2.2.3 Biblioteca de Documentos: Estrutura Avançada
*   **Pastas hierárquicas:** Estrutura organizacional
*   **Metadados colunas:** Tags e classificação
*   **Visualizações:** Diferentes perspectivas dos dados
*   **Alertas:** Notificações de mudança

---

### 👨‍🏫 ATIVIDADE DE LABORATÓRIO 2: O Compartilhamento Parametrizado (Governança de Links)
**Objetivo Tático:** Formar "Arquitetos de Propriedade Intelectual". O aluno deixará de enviar arquivos por e-mail pesados e aprenderá a gerar Links Holográficos condicionais. O exercício foca na distribuição de um Manual Secreto da usina protegendo-o contra roubo de concorrentes e cópias de pen-drive (Compliance e LGPD).

**Passo a Passo em Sala de Aula:**
1.  **O Repositório Central:** O aluno no SharePoint localiza um arquivo importante em PDF (ou Word).
2.  **O Escudo Paramétrico:** Em vez de fazer o "Download" (prática proibida em empresas de alto risco), o aluno clica no botão de **Compartilhar (Share)** do portal.
3.  O painel de Governança de Nuvem sobe à tela. A opção ingênua e padrão é *"Qualquer pessoa com este link pode editar"*. O instrutor repreende severamente o uso desta opção na indústria de base.
4.  **A Calibração do Segredo Militar:** O aluno aperta na engrenagem/opções do link e configura a barricada defensiva:
    *   Altera o escopo para: *"Pessoas Específicas"*.
    *   Desmarca a caixa: *"Permitir Edição"* (Forçando Leitura Apenas).
    *   Ativa a chave de bloqueio supremo: **"Bloquear Download"**.
    *   (Em versões Premium) Insere uma Data de Validade para a próxima sexta-feira.
5.  **A Operação "Auto-Destruição":** O aluno envia o Link pelo correio para o colega. Quando o colega clicar, abrirá uma tela de proteção de leitura na nuvem da usina. Ele poderá ler na tela do navegador, mas os botões de "Salvar Como" e "Imprimir" estarão cinzas (Mortos) injetados via script. E na sexta-feira à meia noite, o link se esfarelará no hiperespaço digital, impedindo que ex-funcionários leiam contratos no fim de semana. O dado nunca saiu fisicamente das dependências lógicas da companhia.

### 2.3 Exportação e Importação de Conteúdos
*   **Exportar para PDF:** Preservar formato
*   **Exportar para Excel:** Manter dados editáveis
*   **Importação em massa:** Mover arquivos de sistemas legados
*   **Migração:** Transição entre plataformas

### 2.3.1 Formatos de Arquivo Corporativos
| Formato | Uso | Vantagem |
|---|---|---|
| PDF | Distribuição final | Formato fixo |
| DOCX | Edição colaborativa | Compatibilidade |
| XLSX | Dados editáveis | Funcionalidades |
| PPTX | Apresentações | Multimídia |
| DXF/DWG | Plantas técnicas | CAD |

### 2.3.2 Permissões Avançadas em SharePoint
*   **Herança de permissões:** Estrutura hierárquica
*   **Quebra de herança:** Permissões customizadas
*   **Grupos de segurança:** Gestão por papéis
*   **Acesso granular:** Por item ou biblioteca

### 2.3.3 Conformidade e LGPD
*   **Classification labels:** Rótulos de sensibilidade
*   **Data loss prevention:** Prevenir vazamentos
*   **Audit logging:** Rastrear acessos
*   **Legal hold:** Preservar para litígio

---

## ⚔️ PROVA FINAL: O Guardião da Propriedade Intelectual

Prove que você domina repositórios em nuvem e a governança de arquivos:

---

**Questão 1:**
O OneDrive exibe um ícone de "nuvem azul" ao lado de um arquivo de projeto de 50GB. O notebook do engenheiro possui apenas 10GB livres de SSD. Como ele consegue ver e abrir o arquivo normalmente sem ocorrer erro de espaço insuficiente (Tópico 5)?

1.  A) O OneDrive comprime automaticamente o arquivo para caber no SSD.
2.  B) O arquivo reside apenas na nuvem (Arquivo Sob Demanda / Fantasy File). O ícone é um ponteiro virtual — ao clicar, ele baixa apenas o conteúdo necessário para a visualização.
3.  C) O Windows move automaticamente outros arquivos para a lixeira para abrir espaço.
4.  D) O OneDrive fragmenta o arquivo em 10 partes de 5GB e sincroniza uma por vez.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Arquivo Sob Demanda (ponteiro virtual na nuvem).
**Por que?** Os ícones de nuvem azul indicam "Arquivos Sob Demanda" — eles existem no servidor da Microsoft mas não ocupam espaço físico no SSD local. O sistema operacional cria um ponteiro holográfico; ao abrir o arquivo, ele baixa apenas os dados necessários para leitura, sem preencher o disco permanentemente.
</details>

---

**Questão 2:**
Um estagiário abriu o contrato milionário armazenado no SharePoint, deletou acidentalmente toda a cláusula financeira e salvou. Como o responsável pelo arquivo pode recuperar o texto original sem perda de dados (Tópico 4.7)?

1.  A) Ligar para o suporte da Microsoft e solicitar recuperação de emergência em até 72h.
2.  B) Usar o recurso de Histórico de Versão (Version History) do SharePoint, que permite visualizar e restaurar qualquer versão anterior do documento com um clique.
3.  C) Verificar se o arquivo foi enviado por e-mail antes da edição e usar a versão do anexo.
4.  D) Não é possível recuperar; o SharePoint não mantém histórico de versões para contratos.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** B) Histórico de Versão (Version History) do SharePoint.
**Por que?** O SharePoint e o OneDrive gravam automaticamente cada versão salva de um documento. O painel de "Histórico de Versão" lista todos os salvamentos com data, hora e autor. Basta selecionar a versão anterior à edição do estagiário e clicar em "Restaurar" — a nuvem sobrescreve a versão atual com a original em segundos.
</details>

---

**Questão 3:**
A diretoria precisa compartilhar um manual técnico confidencial com auditores externos temporários. O requisito é: os auditores podem ler online, mas não podem baixar, imprimir ou reeditar o documento, e o acesso deve expirar automaticamente em 7 dias. Qual recurso de governança (Tópico 4.7) atende todos esses requisitos?

1.  A) Enviar o PDF por e-mail com senha de abertura para os auditores.
2.  B) Dar permissão de "Edição" no SharePoint e confiar que os auditores não modificarão nada.
3.  C) Gerar um Link Parametrizado com: escopo "Pessoas Específicas", "Bloquear Download", permissão "Somente Leitura" e data de expiração de 7 dias.
4.  D) Criar uma cópia do arquivo num pen-drive e entregar pessoalmente aos auditores.

<details>
<summary>👀 Ver Resposta e Explicação</summary>

**Resposta:** C) Link Parametrizado com escopo restrito, bloqueio de download e data de expiração.
**Por que?** Os Links Parametrizados do SharePoint permitem combinar múltiplas restrições em um único link: escopo de acesso (apenas pessoas específicas), nível de permissão (somente leitura), bloqueio de download/impressão via script e data de auto-expiração. Após o prazo, o link se torna inválido automaticamente sem ação manual — máxima segurança e compliance LGPD.
</details>

---

*Parabéns. Os cofres digitais estão blindados. Avance para a Missão 3: O Cérebro Fabril — Planilhas Avançadas, Dashboards e Macros.*

