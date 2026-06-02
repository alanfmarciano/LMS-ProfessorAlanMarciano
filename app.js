document.addEventListener("DOMContentLoaded", () => {
    const navFundamentos = document.getElementById("nav-fundamentos");
    const navColaboracao = document.getElementById("nav-colaboracao");
    const navIRCOM = document.getElementById("nav-ircom");
    const contentViewer = document.getElementById("content-viewer");
    const breadcrumb = document.getElementById("breadcrumb");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.getElementById("sidebar");
    const exportPdfBtn = document.getElementById("export-pdf-btn");

    // Estado atual carregado
    let currentKey = null;
    let currentBreadcrumb = "SENAI 4.0";
    let breadcrumbHistory = []; // Histórico de navegação
    
    // Estado do sistema de avaliações
    let currentExamState = null; // { questions, rubric, title, theme, shuffledQuestions, questionCount }

    // Estado de Progresso e Simulador
    let completedUnits = JSON.parse(localStorage.getItem("completed_units") || "{}");
    let isSimulatorMode = false;
    let userAnswers = {};
    let isSimulatorSubmitted = false;
    let examLockPoll = null;

    // Configurar Modo Foco
    const focusModeBtn = document.getElementById("focus-mode-btn");
    const appContainer = document.getElementById("app-container");
    if (focusModeBtn && appContainer) {
        focusModeBtn.addEventListener("click", () => {
            appContainer.classList.toggle("focus-active");
            const isActive = appContainer.classList.contains("focus-active");
            focusModeBtn.classList.toggle("active", isActive);
            if (isActive) {
                focusModeBtn.innerHTML = `<span class="btn-icon">👁️</span> Sair do Foco`;
            } else {
                focusModeBtn.innerHTML = `<span class="btn-icon">👁️</span> Modo Foco`;
            }
        });
    }

    // Configurar Diagnóstico
    const diagnosticoLink = document.getElementById("diagnostico-link");
    if (diagnosticoLink) {
        diagnosticoLink.addEventListener("click", () => {
            loadDiagnostico();
        });
    }

    // Configure Marked.js (Tweak for GitHub Flavored Markdown)
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true,
            breaks: true,
        });
    } else {
        console.error("Marked.js não carregou.");
    }

    // Estrutura das Nomenclaturas dos Arquivos
    const m1_apostilas = [1, 2, 3, 4, 5].map(i => `Apostila_FUTEC_${i}`);
    const m1_avaliacoes = [1, 2, 3, 4, 5].map(i => `Avaliacao_FUTEC_${i}`);

    const m2_apostilas = [1, 2, 3, 4, 5].map(i => `Apostila_FECOP_${i}`);
    const m2_avaliacoes = [1, 2, 3, 4, 5].map(i => `Avaliacao_FECOP_${i}`);

    const m3_apostilas = [1, 2, 3, 4, 5].map(i => `Apostila_IRCOM_${i}`);
    const m3_avaliacoes = [1, 2, 3, 4, 5].map(i => `Avaliacao_IRCOM_${i}`);

    // Lista de todas as chaves de avaliação para detectar se é avaliação
    const allEvaluationKeys = [...m1_avaliacoes, ...m2_avaliacoes, ...m3_avaliacoes];

    function extractTitle(markdownText, defaultTitle) {
        if (!markdownText) return defaultTitle;
        const match = markdownText.match(/^#\s+(.+)$/m);
        if (match && match[1]) {
            // Remove emojis e substitui Missão por Unidade
            let title = match[1].replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim();
            title = title.replace(/Missão/g, 'Unidade');
            return title;
        }
        return defaultTitle;
    }

    function renderNavItems(apostilas, avaliacoes, parentElement, moduleName) {
        for (let i = 0; i < 5; i++) {
            let missionTitle = `Unidade ${i + 1}`;
            if (typeof courseData !== 'undefined' && courseData[apostilas[i]]) {
                missionTitle = extractTitle(courseData[apostilas[i]], missionTitle);
            }

            // Verifica se a Apostila existe no courseData
            if (typeof courseData !== 'undefined' && courseData[apostilas[i]]) {
                const li = document.createElement("li");
                li.className = "nav-item";
                li.setAttribute("data-key", apostilas[i]);
                if (completedUnits[apostilas[i]]) {
                    li.classList.add("completed");
                }
                li.innerHTML = `<strong>${missionTitle}</strong> <span class="nav-sub">📘 Apostila Guia</span>`;
                li.onclick = () => loadContent(apostilas[i], li, `${moduleName} > Unidade ${i + 1} > Apostila`);
                parentElement.appendChild(li);
            }

            // Verifica se a Avaliação existe no courseData
            if (typeof courseData !== 'undefined' && courseData[avaliacoes[i]]) {
                const li = document.createElement("li");
                li.className = "nav-item";
                li.setAttribute("data-key", avaliacoes[i]);
                li.innerHTML = `<strong>${missionTitle}</strong> <span class="nav-sub" style="color: #60a5fa">🎯 Avaliação</span>`;
                li.onclick = () => loadContent(avaliacoes[i], li, `${moduleName} > Unidade ${i + 1} > Avaliação`);
                parentElement.appendChild(li);
            }
        }
    }

    // ==========================================
    // SEÇÃO DE PROGRESSO, GLOSSÁRIO E BUSCA HIGHLIGHT
    // ==========================================

    function updateProgressBadges() {
        completedUnits = JSON.parse(localStorage.getItem("completed_units") || "{}");
        
        const modules = {
            m1: [1, 2, 3, 4, 5].map(i => `Apostila_FUTEC_${i}`),
            m2: [1, 2, 3, 4, 5].map(i => `Apostila_FECOP_${i}`),
            m3: [1, 2, 3, 4, 5].map(i => `Apostila_IRCOM_${i}`)
        };
        
        for (let modKey in modules) {
            const keys = modules[modKey];
            let completedCount = 0;
            let totalAvailable = 0;
            
            keys.forEach(k => {
                if (typeof courseData !== 'undefined' && courseData[k]) {
                    totalAvailable++;
                    if (completedUnits[k]) {
                        completedCount++;
                    }
                }
            });
            
            const badge = document.getElementById(`progress-${modKey}`);
            if (badge) {
                if (totalAvailable > 0) {
                    const percent = Math.round((completedCount / totalAvailable) * 100);
                    badge.textContent = `${percent}%`;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
        
        document.querySelectorAll(".nav-item").forEach(item => {
            const key = item.getAttribute("data-key");
            if (key) {
                if (completedUnits[key]) {
                    item.classList.add("completed");
                } else {
                    item.classList.remove("completed");
                }
            }
        });
    }

    // Realce de Busca
    function highlightText(container, term) {
        removeHighlights(container);
        if (!term || term.trim() === "") return;
        
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        
        function walk(node) {
            if (node.nodeType === 3) { // Nó de texto
                const matches = node.nodeValue.match(regex);
                if (matches) {
                    const span = document.createElement('span');
                    span.innerHTML = node.nodeValue.replace(regex, '<span class="search-highlight">$1</span>');
                    node.parentNode.replaceChild(span, node);
                }
            } else if (node.nodeType === 1 && node.childNodes && 
                       !['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'SPAN'].includes(node.nodeName)) {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    walk(node.childNodes[i]);
                }
            }
        }
        walk(container);
    }

    function removeHighlights(container) {
        const highlights = container.querySelectorAll('.search-highlight');
        highlights.forEach(hl => {
            const parent = hl.parentNode;
            parent.replaceChild(document.createTextNode(hl.textContent), hl);
            parent.normalize();
        });
        
        // Remove spans vazios ou auxiliares criados
        const wrappers = container.querySelectorAll('span');
        wrappers.forEach(w => {
            if (w.childNodes.length === 1 && w.firstChild.nodeType === 3 && w.className === "") {
                const parent = w.parentNode;
                parent.replaceChild(document.createTextNode(w.textContent), w);
                parent.normalize();
            }
        });
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Glossário Hover
    function applyGlossary(container) {
        const glossary = {
            "Active Directory": "Serviço de diretório centralizado da Microsoft usado para gerenciar computadores e usuários em uma rede corporativa.",
            "LDAP": "Lightweight Directory Access Protocol — Protocolo padrão para consulta de credenciais de usuários e computadores em serviços de diretório como Active Directory.",
            "UEFI": "Unified Extensible Firmware Interface — Interface de firmware moderna que substituiu o antigo BIOS, fornecendo carregamento mais rápido e recursos de segurança avançados.",
            "BIOS": "Basic Input/Output System — Firmware tradicional gravado na placa-mãe que inicializa o hardware e inicia o sistema operacional durante o boot.",
            "TDP": "Thermal Design Power — Potência de Design Térmico. A quantidade máxima de calor em Watts gerada pela CPU que o cooler precisa dissipar de forma segura.",
            "KMS": "Key Management Service — Serviço de Gerenciamento de Chaves para ativação automatizada de licenças Microsoft em ambiente corporativo local.",
            "FHS": "Filesystem Hierarchy Standard — Diretriz padrão que define a finalidade de cada diretório e pasta do sistema em distribuições Linux.",
            "PLC": "Programmable Logic Controller (CLP) — Controlador Lógico Programável. Computador industrial robusto projetado para automatizar processos produtivos e máquinas.",
            "CLP": "Controlador Lógico Programável — Computador industrial robusto projetado para automatizar processos de manufatura e maquinários na indústria.",
            "GPO": "Group Policy Object — Diretiva de Grupo do Active Directory que aplica configurações automáticas de segurança e restrições nos computadores do domínio.",
            "OU": "Organizational Unit — Unidade Organizacional. Pasta lógica no Active Directory usada para organizar usuários e computadores por setores ou departamentos.",
            "RAM": "Random Access Memory — Memória volátil ultrarrápida que armazena os dados dos programas que a CPU está processando ativamente no momento.",
            "CPU": "Central Processing Unit — Unidade Central de Processamento. O processador principal que calcula dados e executa instruções de software.",
            "SSD": "Solid State Drive — Disco eletrônico sem partes móveis, muito mais rápido, durável e eficiente que os discos rígidos (HDs) tradicionais.",
            "NVMe": "Non-Volatile Memory Express — Protocolo de alto desempenho projetado especificamente para acessar armazenamento de estado sólido rápido via slots PCIe.",
            "HD": "Hard Disk — Disco Rígido tradicional. Dispositivo de armazenamento mecânico e magnético de alta capacidade mas velocidades lentas devido às agulhas de leitura.",
            "FUTEC": "Módulo de Fundamentos de TI do Portal SENAI 4.0 (80h de carga horária).",
            "FECOP": "Módulo de Colaboração e Produtividade do Portal SENAI 4.0 (120h de carga horária).",
            "IRCOM": "Módulo de Instalação de Recursos Computacionais do Portal SENAI 4.0 (120h de carga horária)."
        };

        const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);
        
        function walk(node) {
            if (node.nodeType === 3) {
                let text = node.nodeValue;
                for (let key of sortedKeys) {
                    const escapedKey = escapeRegExp(key);
                    const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
                    if (regex.test(text)) {
                        const parts = text.split(regex);
                        const fragment = document.createDocumentFragment();
                        for (let i = 0; i < parts.length; i++) {
                            if (parts[i] !== "") {
                                fragment.appendChild(document.createTextNode(parts[i]));
                             }
                             if (i < parts.length - 1) {
                                 const span = document.createElement('span');
                                 span.className = 'glossary-term';
                                 span.textContent = key;
                                 span.setAttribute('data-definition', glossary[key]);
                                 fragment.appendChild(span);
                             }
                        }
                        node.parentNode.replaceChild(fragment, node);
                        break;
                    }
                }
            } else if (node.nodeType === 1 && node.childNodes && 
                       !['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'SPAN', 'A', 'H1', 'H2', 'H3', 'PRE', 'CODE'].includes(node.nodeName)) {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    walk(node.childNodes[i]);
                }
            }
        }
        walk(container);
        attachGlossaryEvents(container);
    }

    function attachGlossaryEvents(container) {
        let tooltip = document.getElementById('glossary-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'glossary-tooltip';
            tooltip.style.display = 'none';
            tooltip.style.opacity = '0';
            document.body.appendChild(tooltip);
        }

        container.querySelectorAll('.glossary-term').forEach(term => {
            term.addEventListener('mouseenter', (e) => {
                const def = term.getAttribute('data-definition');
                const word = term.textContent;
                tooltip.innerHTML = `<div class="tooltip-title">💡 ${word} <span>Glossário</span></div><div>${def}</div>`;
                tooltip.style.display = 'block';
                
                const rect = term.getBoundingClientRect();
                const x = rect.left + window.scrollX;
                const y = rect.top + window.scrollY - tooltip.offsetHeight - 10;
                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y}px`;
                
                setTimeout(() => { tooltip.style.opacity = '1'; }, 10);
            });
            
            term.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.display = 'none';
            });
        });
    }

    // Painel de Diagnóstico do Professor
    function loadDiagnostico() {
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        breadcrumb.innerHTML = formatBreadcrumb("Diagnóstico");
        currentBreadcrumb = "Diagnóstico";
        currentKey = null;
        exportPdfBtn.disabled = true;
        currentExamState = null;
        
        let reportHTML = `
            <div class="diagnostico-panel">
                <h2>🩺 Validador e Saúde de Conteúdo (SENAI 4.0)</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">
                    Esta ferramenta analisa automaticamente o tamanho das apostilas, a presença de imagens e a integridade de todas as avaliações no sistema.
                </p>
                <table class="diagnostico-table">
                    <thead>
                        <tr>
                            <th>Recurso</th>
                            <th>Tipo</th>
                            <th>Métrica / Diagnóstico</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const m1_ap = [1, 2, 3, 4, 5].map(i => `Apostila_FUTEC_${i}`);
        const m1_av = [1, 2, 3, 4, 5].map(i => `Avaliacao_FUTEC_${i}`);
        const m2_ap = [1, 2, 3, 4, 5].map(i => `Apostila_FECOP_${i}`);
        const m2_av = [1, 2, 3, 4, 5].map(i => `Avaliacao_FECOP_${i}`);
        const m3_ap = [1, 2, 3, 4, 5].map(i => `Apostila_IRCOM_${i}`);
        const m3_av = [1, 2, 3, 4, 5].map(i => `Avaliacao_IRCOM_${i}`);
        
        const allKeys = [...m1_ap, ...m1_av, ...m2_ap, ...m2_av, ...m3_ap, ...m3_av];
        
        allKeys.forEach(k => {
            const content = courseData[k];
            let name = k.replace(/_/g, ' ');
            let type = k.includes('Apostila') ? '📘 Apostila' : '🎯 Avaliação';
            let metric = '';
            let statusHTML = '';
            
            if (!content) {
                metric = 'Arquivo ausente no banco de dados.';
                statusHTML = '<span class="diagnostico-status error">Ausente</span>';
            } else {
                if (k.includes('Apostila')) {
                    const lineCount = content.split('\n').length;
                    const charCount = content.length;
                    const wordCount = content.split(/\s+/).filter(Boolean).length;
                    
                    if (lineCount >= 400) {
                        statusHTML = '<span class="diagnostico-status ok">Excelente</span>';
                    } else if (lineCount >= 250) {
                        statusHTML = '<span class="diagnostico-status warning">Aceitável</span>';
                    } else {
                        statusHTML = '<span class="diagnostico-status error">Muito Curta</span>';
                    }
                    metric = `${lineCount} linhas, ${wordCount} palavras (${charCount} ch)`;
                    
                    const imgMatches = content.match(/!\[.*?\]\((.*?)\)/g);
                    if (imgMatches) {
                        metric += `<br><span style="font-size:0.8rem;color:var(--text-muted)">🖼️ Contém ${imgMatches.length} imagens mapeadas</span>`;
                    }
                } else {
                    const parsed = parseEvaluation(content);
                    if (!parsed) {
                        metric = 'Erro de parsing. Estrutura inválida ou Markdown fora dos padrões.';
                        statusHTML = '<span class="diagnostico-status error">Erro</span>';
                    } else {
                        const qCount = parsed.questions.length;
                        const hasRubric = parsed.rubricMarkdown ? 'Sim' : 'Não';
                        
                        if (qCount === 20) {
                            statusHTML = '<span class="diagnostico-status ok">OK</span>';
                        } else if (qCount >= 15) {
                            statusHTML = '<span class="diagnostico-status warning">Incompleta</span>';
                        } else {
                            statusHTML = '<span class="diagnostico-status error">Crítico</span>';
                        }
                        metric = `${qCount} questões encontradas. Rúbrica: ${hasRubric}.`;
                        
                        const totalCorrect = parsed.questions.filter(q => q.alternatives.some(a => a.isCorrect)).length;
                        if (totalCorrect !== qCount) {
                            statusHTML = '<span class="diagnostico-status error">Erro Gabarito</span>';
                            metric += ` <span style="color:#f87171">(${qCount - totalCorrect} questões sem resposta no gabarito!)</span>`;
                        }
                    }
                }
            }
            
            reportHTML += `
                <tr>
                    <td><strong>${name}</strong></td>
                    <td>${type}</td>
                    <td>${metric}</td>
                    <td>${statusHTML}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        contentViewer.innerHTML = reportHTML;
        contentViewer.scrollTo(0, 0);
    }

    // Inicializa o Menu Lateral
    renderNavItems(m1_apostilas, m1_avaliacoes, navFundamentos, "FUTEC — Fund. de TI (80h)");
    renderNavItems(m2_apostilas, m2_avaliacoes, navColaboracao, "FECOP — Colab. e Prod. (120h)");
    renderNavItems(m3_apostilas, m3_avaliacoes, navIRCOM, "IRCOM — Inst. Rec. Comp. (120h)");

    updateProgressBadges();

    // ==========================================
    // SEÇÃO 1: PARSER DE AVALIAÇÕES
    // ==========================================

    /**
     * Parseia o Markdown de uma avaliação extraindo questões, alternativas e gabarito.
     * Suporta os formatos:
     * - FUTEC/FECOP com separadores --- e gabarito formatado (1. **B** (explicação))
     * - IRCOM/FECOP compacto sem separadores e gabarito em linha (1. B 2. A ...)
     */
    function parseEvaluation(markdownText) {
        if (!markdownText) return null;

        // Extrair título e tema
        const titleMatch = markdownText.match(/^#\s+(.+)$/m);
        const themeMatch = markdownText.match(/\*\*Tema:\*\*\s*(.+)/);
        const title = titleMatch ? titleMatch[1].replace(/📝\s*/, '') : 'Avaliação';
        const theme = themeMatch ? themeMatch[1] : '';

        // Extrair a Parte 2 (Rúbrica) - tudo entre "## Parte 2" e "<details>"
        let rubricMarkdown = '';
        const rubricMatch = markdownText.match(/(## Parte 2[\s\S]*?)(?=<details>)/);
        if (rubricMatch) {
            rubricMarkdown = rubricMatch[1].trim();
        }

        // Extrair gabarito do <details>
        const gabarito = {};
        const detailsMatch = markdownText.match(/<details>([\s\S]*?)<\/details>/);
        if (detailsMatch) {
            const detailsContent = detailsMatch[1];

            // Formato 1: "1. **B** (explicação)" (FUTEC/FECOP detalhado)
            const detailedMatches = detailsContent.matchAll(/(\d+)\.\s*\*\*([A-Da-d])\*\*/g);
            for (const m of detailedMatches) {
                gabarito[parseInt(m[1])] = m[2].toUpperCase();
            }

            // Formato 2: "1. B 2. A 3. C ..." (IRCOM/FECOP compacto)
            if (Object.keys(gabarito).length === 0) {
                const compactMatches = detailsContent.matchAll(/(\d+)\.\s*([A-Da-d])\b/g);
                for (const m of compactMatches) {
                    gabarito[parseInt(m[1])] = m[2].toUpperCase();
                }
            }
        }

        // Extrair questões
        const questions = [];
        // Regex para encontrar cada bloco de questão
        // Formato: **N. Texto da pergunta**
        const questionRegex = /\*\*(\d+)\.\s*(.*?)\*\*\s*\n([\s\S]*?)(?=\*\*\d+\.|## Parte 2|<details>|$)/g;
        let qMatch;
        
        while ((qMatch = questionRegex.exec(markdownText)) !== null) {
            const qNumber = parseInt(qMatch[1]);
            const qText = qMatch[2].trim();
            const alternativesBlock = qMatch[3];

            // Extrair alternativas (a), b), c), d))
            const alternatives = [];
            const altRegex = /([a-d])\)\s*(.+?)(?=\n[a-d]\)|\n---|\n\*\*|\n##|\n<|$)/gs;
            let altMatch;
            while ((altMatch = altRegex.exec(alternativesBlock)) !== null) {
                alternatives.push({
                    letter: altMatch[1].toUpperCase(),
                    text: altMatch[2].trim(),
                    isCorrect: gabarito[qNumber] === altMatch[1].toUpperCase()
                });
            }

            if (alternatives.length >= 2) {
                questions.push({
                    originalNumber: qNumber,
                    text: qText,
                    alternatives: alternatives
                });
            }
        }

        if (questions.length === 0) return null;

        return {
            title,
            theme,
            questions,
            rubricMarkdown,
            totalQuestions: questions.length
        };
    }

    // ==========================================
    // SEÇÃO 2: MOTOR DE EMBARALHAMENTO
    // ==========================================

    /** Fisher-Yates shuffle - embaralha array in-place e retorna */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /** Embaralha alternativas de uma questão, mantendo rastreio da correta */
    function shuffleAlternatives(question) {
        const shuffledAlts = shuffleArray(question.alternatives);
        const newLetters = ['A', 'B', 'C', 'D'];
        let correctLetter = '';

        const mappedAlts = shuffledAlts.map((alt, idx) => {
            const newLetter = newLetters[idx];
            if (alt.isCorrect) correctLetter = newLetter;
            return {
                ...alt,
                displayLetter: newLetter
            };
        });

        return {
            ...question,
            alternatives: mappedAlts,
            correctAnswer: correctLetter
        };
    }

    /** 
     * Gera uma prova embaralhada:
     * - Seleciona `count` questões aleatórias
     * - Embaralha a ordem das questões
     * - Embaralha as alternativas de cada questão
     * Retorna { questions: [...], answerKey: { 1: 'C', 2: 'A', ... } }
     */
    function generateExam(allQuestions, count) {
        // Seleciona questões: se count < total, pega aleatórias; senão usa todas
        let selected = [...allQuestions];
        if (count < selected.length) {
            selected = shuffleArray(selected).slice(0, count);
        }
        // Embaralha a ordem
        selected = shuffleArray(selected);
        
        // Embaralha alternativas e gera gabarito
        const answerKey = {};
        const examQuestions = selected.map((q, idx) => {
            const shuffled = shuffleAlternatives(q);
            const newNumber = idx + 1;
            answerKey[newNumber] = shuffled.correctAnswer;
            return {
                ...shuffled,
                examNumber: newNumber
            };
        });

        return { questions: examQuestions, answerKey };
    }

    // ==========================================
    // SEÇÃO 3: UI DE CONFIGURAÇÃO DA PROVA
    // ==========================================

    /** Verifica se uma chave é de avaliação */
    function isEvaluation(key) {
        return allEvaluationKeys.includes(key);
    }

    /** Renderiza a interface de configuração da prova */
    function renderEvaluationUI(parsedEval, questionCount) {
        const qCount = Math.max(5, Math.min(questionCount || parsedEval.totalQuestions, parsedEval.totalQuestions));
        const exam = generateExam(parsedEval.questions, qCount);
        
        currentExamState = {
            ...parsedEval,
            shuffledQuestions: exam.questions,
            answerKey: exam.answerKey,
            questionCount: qCount
        };

        const html = buildEvaluationHTML(currentExamState);
        contentViewer.innerHTML = html;
        contentViewer.scrollTo(0, 0);

        // Attach event listeners
        attachEvaluationListeners();
    }

    function buildEvaluationHTML(state) {
        return `
            <div class="exam-config-panel">
                <!-- Cabeçalho -->
                <div class="exam-header">
                    <div class="exam-header-icon">🎯</div>
                    <div class="exam-header-info">
                        <h1>${state.title}</h1>
                        <p class="exam-theme">${state.theme}</p>
                    </div>
                </div>

                <!-- Painel de Controles Simplificado para Aluno -->
                <div class="exam-controls" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="controls-icon">⚙️</span>
                        <h3>Simulado Online</h3>
                    </div>
                    
                    <!-- Botões de Ação do Aluno -->
                    <div class="exam-actions" id="student-actions" style="display: flex;">
                        ${isSimulatorSubmitted ? `
                            <button id="btn-simulator-reset" class="btn-simulator-reset">
                                🔄 Reiniciar Simulado
                            </button>
                        ` : `
                            <button id="btn-simulator-submit" class="btn-simulator-submit">
                                ✅ Finalizar e Corrigir Simulado
                            </button>
                        `}
                    </div>
                </div>

                <!-- Preview das Questões -->
                <div class="exam-preview">
                    <div class="exam-preview-header">
                        <h3>📝 Simulador de Avaliação</h3>
                        <span class="exam-preview-badge" id="preview-badge-count">${state.questionCount} questões</span>
                    </div>
                    <div class="exam-questions-list" id="exam-questions-list">
                        <!-- Carregado via updatePreview() -->
                    </div>
                </div>
            </div>
        `;
    }

    function attachEvaluationListeners() {
        const studentActions = document.getElementById('student-actions');
        if (studentActions) {
            studentActions.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'btn-simulator-submit') {
                    const count = Math.min(currentExamState.questionCount, currentExamState.shuffledQuestions.length);
                    const answeredCount = Object.keys(userAnswers).length;
                    
                    if (answeredCount < count) {
                        const confirmSubmit = confirm(`Você respondeu apenas ${answeredCount} de ${count} questões. Tem certeza que deseja finalizar?`);
                        if (!confirmSubmit) return;
                    }
                    
                    // Mapeamento das respostas para o formato original esperado pelo servidor
                    const mappedAnswers = {};
                    currentExamState.shuffledQuestions.forEach((q, idx) => {
                        if (idx >= count) return;
                        const displayChoice = userAnswers[q.examNumber];
                        if (displayChoice) {
                            const selectedAlt = q.alternatives.find(alt => alt.displayLetter === displayChoice);
                            if (selectedAlt) {
                                mappedAnswers[q.originalNumber] = selectedAlt.letter;
                            }
                        }
                    });

                    const studentInfo = JSON.parse(localStorage.getItem("student_info") || "{}");

                    // Tentar submissão online ao servidor local
                    fetch('/api/student/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            student: studentInfo,
                            examKey: currentKey,
                            answers: mappedAnswers
                        })
                    })
                    .then(res => {
                        if (!res.ok) throw new Error("Erro na submissão ao servidor.");
                        return res.json();
                    })
                    .then(data => {
                        isSimulatorSubmitted = true;
                        studentActions.innerHTML = `
                            <button id="btn-simulator-reset" class="btn-simulator-reset">
                                🔄 Reiniciar Simulado
                            </button>
                        `;
                        currentExamState.serverGrading = {
                            score: data.score,
                            correctCount: data.correctCount,
                            totalCount: data.totalCount,
                            online: true
                        };
                        updatePreview(false);
                    })
                    .catch(err => {
                        console.warn("Sem conexão com o servidor local. Corrigindo prova localmente offline.", err);
                        isSimulatorSubmitted = true;
                        studentActions.innerHTML = `
                            <button id="btn-simulator-reset" class="btn-simulator-reset">
                                🔄 Reiniciar Simulado
                            </button>
                        `;
                        // Calcular correção offline
                        let correctCount = 0;
                        currentExamState.shuffledQuestions.forEach((q, idx) => {
                            if (idx >= count) return;
                            if (userAnswers[q.examNumber] === q.correctAnswer) {
                                correctCount++;
                            }
                        });
                        const score = Math.round((correctCount / count) * 100);
                        currentExamState.serverGrading = {
                            score: score,
                            correctCount: correctCount,
                            totalCount: count,
                            online: false
                        };
                        updatePreview(false);
                    });

                } else if (e.target && e.target.id === 'btn-simulator-reset') {
                    userAnswers = {};
                    isSimulatorSubmitted = false;
                    currentExamState.serverGrading = null;
                    studentActions.innerHTML = `
                        <button id="btn-simulator-submit" class="btn-simulator-submit">
                            ✅ Finalizar e Corrigir Simulado
                        </button>
                    `;
                    updatePreview(true);
                }
            });
        }
    }

    function getScoreCardHTML() {
        const grading = currentExamState.serverGrading || {
            score: 0,
            correctCount: 0,
            totalCount: 1,
            online: false
        };
        const approved = grading.score >= 60;
        
        return `
            <div class="simulator-score-card">
                <div class="simulator-score-circle ${approved ? 'approved' : ''}">
                    ${grading.score}%
                </div>
                <h3>${approved ? '🎉 Parabéns! Você foi Aprovado!' : '⚠️ Precisa Estudar Mais!'}</h3>
                <p class="simulator-score-meta">
                    Você acertou <strong>${grading.correctCount}</strong> de <strong>${grading.totalCount}</strong> questões (${grading.score}% de aproveitamento).
                </p>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                    ${grading.online 
                        ? '💚 Nota registrada com sucesso no servidor do professor!' 
                        : '⚠️ Servidor offline. Nota calculada localmente (não registrada no painel do professor).'}
                </div>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                    * A nota mínima para aprovação é 60%. Veja o gabarito detalhado abaixo para aprender com os erros.
                </div>
            </div>
        `;
    }

    function updatePreview(regenerate = true) {
        if (regenerate) {
            const exam = generateExam(currentExamState.questions, currentExamState.questionCount);
            currentExamState.shuffledQuestions = exam.questions;
            currentExamState.answerKey = exam.answerKey;
        }

        const listEl = document.getElementById('exam-questions-list');
        const badgeEl = document.getElementById('preview-badge-count');
        const count = Math.min(currentExamState.questionCount, currentExamState.shuffledQuestions.length);
        
        if (listEl) {
            let html = '';
            
            if (isSimulatorMode && isSimulatorSubmitted) {
                html += getScoreCardHTML();
            }
            
            currentExamState.shuffledQuestions.forEach((q, idx) => {
                if (idx >= count) return;
                
                if (isSimulatorMode) {
                    const selectedAlt = userAnswers[q.examNumber];
                    
                    html += `
                        <div class="simulator-question-card">
                            <div class="exam-question-number">${idx + 1}</div>
                            <div class="exam-question-body">
                                <p class="exam-question-text">${q.text}</p>
                                <div class="exam-alternatives">
                                    ${q.alternatives.map(alt => {
                                        let altClass = 'simulator-alt';
                                        if (isSimulatorSubmitted) {
                                            if (alt.isCorrect) {
                                                altClass += ' show-correct';
                                            } else if (selectedAlt === alt.displayLetter) {
                                                altClass += ' show-wrong';
                                            }
                                            altClass += ' submitted';
                                        } else {
                                            if (selectedAlt === alt.displayLetter) {
                                                altClass += ' selected';
                                            }
                                        }
                                        
                                        return `
                                            <div class="${altClass}" data-q="${q.examNumber}" data-alt="${alt.displayLetter}">
                                                <span class="simulator-alt-letter">${alt.displayLetter}</span>
                                                <span class="simulator-alt-text">${alt.text}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="exam-question-card">
                            <div class="exam-question-number">${idx + 1}</div>
                            <div class="exam-question-body">
                                <p class="exam-question-text">${q.text}</p>
                                <div class="exam-alternatives">
                                    ${q.alternatives.map(alt => `
                                        <div class="exam-alt ${alt.isCorrect ? 'exam-alt-correct' : ''}">
                                            <span class="exam-alt-letter">${alt.displayLetter}</span>
                                            <span class="exam-alt-text">${alt.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            listEl.innerHTML = html;
            
            if (isSimulatorMode && !isSimulatorSubmitted) {
                listEl.querySelectorAll('.simulator-alt').forEach(altEl => {
                    altEl.addEventListener('click', () => {
                        const qNum = parseInt(altEl.getAttribute('data-q'));
                        const altLetter = altEl.getAttribute('data-alt');
                        userAnswers[qNum] = altLetter;
                        updatePreview(false);
                    });
                });
            }
        }

        if (badgeEl) {
            badgeEl.textContent = `${count} questões`;
        }
    }

    // ==========================================
    // SEÇÃO 4: GERAÇÃO DE PDF
    // ==========================================

    function generateExamPDF(isAnswerKey) {
        if (!currentExamState) return;

        const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        const versionsInput = document.getElementById('exam-versions-count');
        const versionsCount = versionsInput ? Math.max(1, Math.min(5, parseInt(versionsInput.value))) : 1;
        const titleText = isAnswerKey 
            ? `GABARITO — ${currentExamState.title}` 
            : currentExamState.title;

        let documentsHTML = '';
        const versionLabels = ['A', 'B', 'C', 'D', 'E'];

        for (let v = 0; v < versionsCount; v++) {
            let examData;
            // Se for apenas uma versão, usamos a ordem atual visualizada na tela. 
            // Caso contrário, geramos novas versões embaralhadas de forma transparente.
            if (versionsCount === 1) {
                examData = {
                    questions: currentExamState.shuffledQuestions,
                    answerKey: currentExamState.answerKey
                };
            } else {
                examData = generateExam(currentExamState.questions, currentExamState.questionCount);
            }

            const count = Math.min(currentExamState.questionCount, examData.questions.length);
            const versionLabel = versionLabels[v];
            const versionTitleText = versionsCount > 1 ? ` (VERSÃO ${versionLabel})` : '';

            // Cabeçalho de identificação (apenas para prova de aluno)
            let headerHTML = '';
            if (!isAnswerKey) {
                headerHTML = `
                <div class="student-info">
                    <div class="student-info-grid">
                        <div class="student-field student-field-full">
                            <label>Nome do Aluno(a):</label>
                            <div class="field-line"></div>
                        </div>
                        <div class="student-field">
                            <label>Turma:</label>
                            <div class="field-line"></div>
                        </div>
                        <div class="student-field">
                            <label>Período:</label>
                            <div class="field-line"></div>
                        </div>
                        <div class="student-field">
                            <label>Data:</label>
                            <div class="field-line" style="min-width: 80px;"></div>
                        </div>
                        <div class="student-field">
                            <label>Nota:</label>
                            <div class="field-line" style="min-width: 60px;"></div>
                        </div>
                    </div>
                </div>
                `;
            }

            // Cartão Resposta / Gabarito Rápido
            let bubbleSheetHTML = '';
            if (isAnswerKey) {
                bubbleSheetHTML = `
                <div class="print-bubble-sheet">
                    <div class="print-bubble-sheet-title">🔑 GABARITO DE RESPOSTAS RÁPIDAS - VERSÃO ${versionLabel}</div>
                    <div class="print-bubble-sheet-grid">
                        ${examData.questions.slice(0, count).map((q, idx) => {
                            const correctLetter = examData.answerKey[idx + 1];
                            return `
                                <div class="print-bubble-row">
                                    <span class="q-num">${idx + 1}.</span>
                                    <span class="bubble ${correctLetter === 'A' ? 'filled' : ''}">A</span>
                                    <span class="bubble ${correctLetter === 'B' ? 'filled' : ''}">B</span>
                                    <span class="bubble ${correctLetter === 'C' ? 'filled' : ''}">C</span>
                                    <span class="bubble ${correctLetter === 'D' ? 'filled' : ''}">D</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                `;
            } else {
                bubbleSheetHTML = `
                <div class="print-bubble-sheet">
                    <div class="print-bubble-sheet-title">✏️ CARTÃO RESPOSTA (VERSÃO ${versionLabel}) - PREENCHA COM CANETA AZUL OU PRETA</div>
                    <div class="print-bubble-sheet-grid">
                        ${Array.from({ length: count }).map((_, idx) => `
                            <div class="print-bubble-row">
                                <span class="q-num">${idx + 1}.</span>
                                <span class="bubble">A</span>
                                <span class="bubble">B</span>
                                <span class="bubble">C</span>
                                <span class="bubble">D</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                `;
            }

            // Corpo de questões
            let questionsHTML = '';
            if (isAnswerKey) {
                questionsHTML = `
                    <div class="answer-key-detail">
                        <h3>Detalhamento das Respostas</h3>
                        ${examData.questions.slice(0, count).map((q, idx) => `
                            <p><strong>${idx + 1}. ${examData.answerKey[idx + 1]}</strong> — ${q.text}</p>
                        `).join('')}
                    </div>
                `;
            } else {
                questionsHTML = examData.questions.slice(0, count).map((q, idx) => `
                    <div class="print-question" style="margin-bottom: 22px; page-break-inside: avoid;">
                        <p style="font-weight: 700; color: #1a1a2e; margin-bottom: 8px;">
                            <strong>${idx + 1}.</strong> ${q.text}
                        </p>
                        <div style="padding-left: 20px;">
                            ${q.alternatives.map(alt => `
                                <p style="margin: 4px 0; color: #333;">
                                    ${alt.displayLetter.toLowerCase()}) ${alt.text}
                                </p>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }

            documentsHTML += `
            <div class="pdf-page" style="page-break-after: ${v < versionsCount - 1 ? 'always' : 'auto'}; min-height: 98vh; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="pdf-header">
                        <div class="logo">SENAI<span>4.0</span></div>
                        <div class="meta">
                            <span style="font-size:11pt;font-weight:800;color:#e9c46a;display:block;margin-bottom:2px">
                                ${isAnswerKey ? '🔑 GABARITO DO PROFESSOR' : '📝 AVALIAÇÃO'}${versionTitleText}
                            </span>
                            <span style="color:#a8d8ff;font-size:9pt">Instrutor Alan Marciano — Gestor em T.I.</span><br>
                            ${dateStr}<br>
                            <strong style="color:#e9c46a">USO RESTRITO — MATERIAL DIDÁTICO</strong>
                        </div>
                    </div>
                    
                    ${headerHTML}
                    
                    <div class="pdf-breadcrumb">${currentExamState.title}${currentExamState.theme ? ' — ' + currentExamState.theme : ''}</div>
                    
                    ${!isAnswerKey ? `
                    <div class="exam-instructions">
                        <strong>Instruções:</strong> Responda às questões e preencha as bolhas correspondentes no Cartão Resposta. Prova com <strong>${count} questões</strong>. Boa prova!
                    </div>
                    ` : ''}
                    
                    <div class="pdf-body" style="padding: 25px 40px 10px;">
                        ${bubbleSheetHTML}
                        ${isAnswerKey ? `<h1>🔑 Gabarito Detalhado — Versão ${versionLabel}</h1>` : ''}
                        ${questionsHTML}
                    </div>
                </div>
                
                <div class="pdf-footer" style="padding: 10px 40px 30px; margin-top: auto;">
                    <hr style="border: none; border-top: 2px solid #e0e6f0; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 8.5pt; color: #888;">
                        <span>SENAI Sertãozinho — Portal SENAI 4.0 · ${dateStr}</span>
                        <span style="color:#0f3460;font-weight:700">✍️ Instrutor Alan Marciano — Gestor em T.I.</span>
                    </div>
                </div>
            </div>
            `;
        }

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${titleText}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a2e;
            background: #fff;
        }
        .pdf-header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            padding: 22px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .pdf-header .logo { font-size: 24pt; font-weight: 800; letter-spacing: -1px; }
        .pdf-header .logo span { color: #e94560; }
        .pdf-header .meta { text-align: right; font-size: 8.5pt; opacity: 0.85; line-height: 1.5; }

        .student-info {
            border: 2px solid #1a1a2e;
            margin: 0;
            padding: 16px 40px;
            background: #f8faff;
        }
        .student-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 30px;
        }
        .student-field {
            display: flex;
            align-items: baseline;
            gap: 8px;
            font-size: 11pt;
        }
        .student-field label {
            font-weight: 700;
            color: #1a1a2e;
            white-space: nowrap;
            font-size: 10pt;
        }
        .student-field .field-line {
            flex: 1;
            border-bottom: 1.5px solid #333;
            min-width: 120px;
            height: 20px;
        }
        .student-field-full {
            grid-column: 1 / -1;
        }

        .pdf-breadcrumb {
            background: #f0f4ff;
            border-left: 5px solid #e94560;
            padding: 8px 40px;
            font-size: 9pt;
            color: #555;
            font-weight: 600;
        }
        .exam-instructions {
            padding: 12px 40px;
            background: #fffbf0;
            border-left: 5px solid #f39c12;
            font-size: 9.5pt;
            color: #5a4a00;
        }
        
        h1 { font-size: 16pt; font-weight: 800; color: #0f3460; margin-bottom: 18px; margin-top: 10px; }
        h2 { font-size: 13pt; font-weight: 700; color: #16213e; margin-top: 24px; margin-bottom: 10px; }
        h3 { font-size: 11pt; font-weight: 600; color: #0f3460; margin-top: 16px; margin-bottom: 8px; }
        p { margin-bottom: 6px; }

        .print-question { margin-bottom: 18px; }
        
        .answer-key-detail {
            margin-top: 20px;
            padding-top: 10px;
        }
        .answer-key-detail h3 { margin-bottom: 12px; }
        .answer-key-detail p { font-size: 9.5pt; margin-bottom: 6px; color: #444; }

        /* Cartão Resposta de Impressão */
        .print-bubble-sheet {
            border: 2px solid #1a1a2e;
            background: #f8faff;
            padding: 12px 20px;
            margin-bottom: 22px;
            page-break-inside: avoid;
        }
        .print-bubble-sheet-title {
            font-size: 9.5pt;
            font-weight: 800;
            text-align: center;
            color: #1a1a2e;
            margin-bottom: 10px;
            border-bottom: 1.5px solid #1a1a2e;
            padding-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .print-bubble-sheet-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px 15px;
        }
        .print-bubble-row {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 8.5pt;
            font-family: monospace;
        }
        .print-bubble-row .q-num {
            font-weight: 800;
            width: 20px;
            text-align: right;
        }
        .print-bubble-row .bubble {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1px solid #1a1a2e;
            border-radius: 50%;
            text-align: center;
            line-height: 12px;
            font-size: 6.5pt;
            font-weight: 700;
            color: #1a1a2e;
        }
        .print-bubble-row .bubble.filled {
            background-color: #1a1a2e !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .pdf-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-question { page-break-inside: avoid; }
            .print-bubble-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-bubble-row .bubble.filled { background-color: #1a1a2e !important; color: #fff !important; }
            .pdf-page { page-break-after: always; }
            .pdf-page:last-child { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    ${documentsHTML}
</body>
</html>`);
        printWindow.document.close();
        printWindow.onload = () => {
            setTimeout(() => printWindow.print(), 400);
        };
    }

    // ==========================================
    // SEÇÃO 5: CARREGAMENTO DE CONTEÚDO (ORIGINAL + AVALIAÇÕES)
    // ==========================================

    function renderLockedScreen(title, key, rawMarkdown) {
        contentViewer.innerHTML = `
            <div class="exam-locked-panel" style="text-align: center; padding: 80px 20px; animation: fadeIn 0.5s ease;">
                <div class="exam-locked-icon" style="font-size: 5rem; margin-bottom: 20px; animation: pulse 2s infinite;">🔒</div>
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 10px; color: var(--text-main); font-family: 'Inter', sans-serif;">Avaliação Bloqueada</h2>
                <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                    Aguardando o instrutor liberar a prova <strong style="color: var(--primary);">${title}</strong> na rede...
                </p>
                <div class="exam-locked-loader" style="display: inline-block; width: 45px; height: 45px; border: 4px solid rgba(239, 68, 68, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear;"></div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 25px;">
                    Esta tela se atualizará automaticamente assim que o acesso for liberado.
                </p>
            </div>
        `;
        contentViewer.scrollTo(0, 0);
    }

    function getStudentClass() {
        try {
            const info = JSON.parse(localStorage.getItem("student_info") || "{}");
            return info.studentClass || "";
        } catch (e) {
            return "";
        }
    }

    function checkExamAccess(key, rawMarkdown) {
        // Desabilita o botão PDF padrão
        exportPdfBtn.disabled = true;

        // Limpar polling existente, se houver
        if (examLockPoll) {
            clearInterval(examLockPoll);
            examLockPoll = null;
        }

        const studentClass = getStudentClass();

        // Tenta buscar o status da prova ativada no servidor
        fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}`)
        .then(res => {
            if (!res.ok) throw new Error("Erro de resposta do servidor");
            return res.json();
        })
        .then(data => {
            const parsed = parseEvaluation(rawMarkdown);
            const title = parsed ? parsed.title : "Avaliação";
            const releasedItems = data.releasedItems || {};
            const activeCount = data.activeExamQuestionCount || 20;

            if (releasedItems[key] === true) {
                // Liberada! Renderiza a prova
                if (parsed && parsed.questions.length > 0) {
                    renderEvaluationUI(parsed, activeCount);
                } else {
                    fallbackToMarkdown(rawMarkdown);
                }
            } else {
                // Trancada! Renderiza tela de bloqueio e inicia o polling
                renderLockedScreen(title, key, rawMarkdown);

                examLockPoll = setInterval(() => {
                    fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}`)
                    .then(res => {
                        if (!res.ok) throw new Error("Offline");
                        return res.json();
                    })
                    .then(newData => {
                        const newReleasedItems = newData.releasedItems || {};
                        const newActiveCount = newData.activeExamQuestionCount || 20;
                        if (newReleasedItems[key] === true) {
                            clearInterval(examLockPoll);
                            examLockPoll = null;
                            const newParsed = parseEvaluation(rawMarkdown);
                            if (newParsed && newParsed.questions.length > 0) {
                                renderEvaluationUI(newParsed, newActiveCount);
                            }
                        }
                    })
                    .catch(err => console.log("Erro no polling de status:", err));
                }, 5000);
            }
        })
        .catch(err => {
            // Em caso de erro (ex: offline total), libera a prova localmente
            console.warn("Sem conexão com o servidor local. Liberando prova local offline.", err);
            const parsed = parseEvaluation(rawMarkdown);
            if (parsed && parsed.questions.length > 0) {
                renderEvaluationUI(parsed, 20);
            } else {
                fallbackToMarkdown(rawMarkdown);
            }
        });
    }

    function checkMaterialAccess(key, rawMarkdown, onSuccess) {
        // Limpar polling se houver
        if (examLockPoll) {
            clearInterval(examLockPoll);
            examLockPoll = null;
        }

        const studentClass = getStudentClass();

        fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}`)
        .then(res => {
            if (!res.ok) throw new Error("Offline");
            return res.json();
        })
        .then(data => {
            const releasedItems = data.releasedItems || {};
            if (releasedItems[key] === true) {
                onSuccess();
            } else {
                // Injeta tela de material bloqueado
                renderLockedMaterialScreen(key);
                
                // Inicia polling para liberar automaticamente
                examLockPoll = setInterval(() => {
                    fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}`)
                    .then(res => {
                        if (!res.ok) throw new Error("Offline");
                        return res.json();
                    })
                    .then(newData => {
                        const newReleasedItems = newData.releasedItems || {};
                        if (newReleasedItems[key] === true) {
                            clearInterval(examLockPoll);
                            examLockPoll = null;
                            onSuccess();
                        }
                    })
                    .catch(e => console.log("Erro no polling de material:", e));
                }, 5000);
            }
        })
        .catch(err => {
            // Fallback offline: libera por padrão
            console.warn("Sem conexão com o servidor local. Acessando apostila local offline.", err);
            onSuccess();
        });
    }

    function renderLockedMaterialScreen(key) {
        const titleLabel = key.replace(/_/g, ' ');
        contentViewer.innerHTML = `
            <div class="exam-locked-panel" style="text-align: center; padding: 80px 20px; animation: fadeIn 0.5s ease;">
                <div class="exam-locked-icon" style="font-size: 5rem; margin-bottom: 20px; animation: pulse 2s infinite;">🔒</div>
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 10px; color: var(--text-main);">Material Bloqueado</h2>
                <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                    O instrutor ainda não liberou o acesso ao material <strong style="color: var(--primary);">${titleLabel}</strong> na rede local.
                </p>
                <div class="exam-locked-loader" style="display: inline-block; width: 45px; height: 45px; border: 4px solid rgba(239, 68, 68, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear;"></div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 25px;">
                    Esta página abrirá automaticamente assim que o instrutor liberar o material.
                </p>
            </div>
        `;
        contentViewer.scrollTo(0, 0);
    }

    function fallbackToMarkdown(rawMarkdown) {
        if (rawMarkdown && typeof marked !== 'undefined') {
            contentViewer.innerHTML = marked.parse(rawMarkdown);
            contentViewer.scrollTo(0, 0);
        }
    }

    function loadContent(key, element, breadcrumbText) {
        // Limpar polling de trancamento de prova
        if (examLockPoll) {
            clearInterval(examLockPoll);
            examLockPoll = null;
        }

        // Reset simulator states
        isSimulatorMode = true; // Forçar modo simulador para alunos!
        userAnswers = {};
        isSimulatorSubmitted = false;

        // Clean up glossary tooltip
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.display = 'none';
        }

        // Remove 'active' de todos
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        if (element) element.classList.add("active");

        // Atualiza o breadcrumb
        breadcrumb.innerHTML = formatBreadcrumb(breadcrumbText);
        currentBreadcrumb = breadcrumbText;
        
        // Salva no histórico
        if (currentKey !== null) {
            breadcrumbHistory.push({ key: currentKey, breadcrumb: currentBreadcrumb });
        }
        
        currentKey = key;
        exportPdfBtn.disabled = false;

        const rawMarkdown = courseData[key];
        
        // Verificar se é avaliação
        if (isEvaluation(key) && rawMarkdown) {
            checkExamAccess(key, rawMarkdown);
        } else if (rawMarkdown && typeof marked !== 'undefined') {
            currentExamState = null;

            const renderApostila = () => {
                contentViewer.innerHTML = marked.parse(rawMarkdown);
                contentViewer.scrollTo(0, 0);

                // Injetar Caixa de Confirmação de Leitura se for apostila
                if (key.startsWith("Apostila_")) {
                    const isCompleted = completedUnits[key] || false;
                    const confirmationBox = document.createElement("div");
                    confirmationBox.className = `read-confirmation-box ${isCompleted ? 'completed' : ''}`;
                    confirmationBox.innerHTML = `
                        <button id="btn-toggle-read" class="btn-toggle-read">
                            <span class="read-icon">${isCompleted ? '✅' : '⬜'}</span>
                            ${isCompleted ? 'Concluído! Desmarcar' : 'Marcar como Lido'}
                        </button>
                    `;
                    contentViewer.appendChild(confirmationBox);
                    
                    const btnToggleRead = confirmationBox.querySelector("#btn-toggle-read");
                    if (btnToggleRead) {
                        btnToggleRead.addEventListener("click", () => {
                            const currentStatus = completedUnits[key] || false;
                            const newStatus = !currentStatus;
                            
                            if (newStatus) {
                                completedUnits[key] = true;
                            } else {
                                delete completedUnits[key];
                            }
                            
                            localStorage.setItem("completed_units", JSON.stringify(completedUnits));
                            updateProgressBadges();
                            
                            // Atualizar visual da caixa
                            confirmationBox.className = `read-confirmation-box ${newStatus ? 'completed' : ''}`;
                            btnToggleRead.innerHTML = `
                                <span class="read-icon">${newStatus ? '✅' : '⬜'}</span>
                                ${newStatus ? 'Concluído! Desmarcar' : 'Marcar como Lido'}
                            `;
                        });
                    }

                    // Aplicar Glossário Hover e Highlight de busca se houver termo
                    applyGlossary(contentViewer);
                    const searchEl = document.getElementById("search-input");
                    if (searchEl && searchEl.value) {
                        highlightText(contentViewer, searchEl.value);
                    }
                }
            };

            if (key.startsWith("Apostila_")) {
                checkMaterialAccess(key, rawMarkdown, renderApostila);
            } else {
                renderApostila();
            }
        } else {
            contentViewer.innerHTML = `
                <div style="text-align:center; margin-top: 20%;">
                    <h2>Erro: Conteúdo não encontrado.</h2>
                    <p>O arquivo <strong>${key}</strong> não está no banco de dados.</p>
                </div>`;
        }

        // Esconde o menu no celular ao clicar
        if (window.innerWidth <= 900) {
            sidebar.classList.remove("open");
        }
    }
    
    // Formata o breadcrumb com links clicáveis
    function formatBreadcrumb(text) {
        if (!text || text === "SENAI 4.0") {
            return `<span class="breadcrumb-home" onclick="window.location.href='index.html'">SENAI 4.0</span>`;
        }
        
        const parts = text.split(" > ");
        let html = `<span class="breadcrumb-home" onclick="window.location.href='index.html'">SENAI 4.0</span>`;
        
        parts.forEach((part, index) => {
            if (index > 0) {
                html += ` > <span class="breadcrumb-item">${part}</span>`;
            }
        });
        
        return html;
    }
    
    // Função para voltar ao início
    window.goHome = function() {
        window.location.href = 'index.html';
    };
    
    // Estilo para o breadcrumb clicável
    const style = document.createElement('style');
    style.textContent = `
        .breadcrumb-home {
            color: #e94560 !important;
            font-weight: 700;
            cursor: pointer;
            transition: color 0.2s;
        }
        .breadcrumb-home:hover {
            color: #fff !important;
            text-decoration: underline;
        }
        .breadcrumb-item {
            color: #94a3b8;
            cursor: pointer;
        }
        .breadcrumb-item:hover {
            color: #fff !important;
        }
    `;
    document.head.appendChild(style);

    // Menu Mobile Toggle
    mobileMenuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    // Funcionalidade de Busca
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const items = document.querySelectorAll(".nav-item");
        items.forEach(item => {
            const text = item.innerText.toLowerCase();
            if (text.includes(term)) {
                item.style.display = "block";
            } else {
                item.style.display = "none";
            }
        });

        // Realçar texto na apostila ativa
        if (currentKey && currentKey.startsWith("Apostila_")) {
            highlightText(contentViewer, e.target.value);
        }
    });

    // --- EXPORTAR PDF (para apostilas - funcionalidade original preservada) ---
    exportPdfBtn.addEventListener("click", () => {
        if (!currentKey || !courseData[currentKey]) return;
        
        // Se estiver em avaliação com estado, não usar o export padrão
        if (currentExamState) return;

        const rawMarkdown = courseData[currentKey];
        const htmlContent = marked.parse(rawMarkdown);
        const title = currentBreadcrumb || "SENAI 4.0 - Apostila";
        const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.7;
            color: #1a1a2e;
            background: #fff;
        }
        .pdf-header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            padding: 28px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0;
        }
        .pdf-header .logo { font-size: 26pt; font-weight: 800; letter-spacing: -1px; }
        .pdf-header .logo span { color: #e94560; }
        .pdf-header .meta { text-align: right; font-size: 9pt; opacity: 0.85; line-height: 1.6; }
        .pdf-breadcrumb {
            background: #f0f4ff;
            border-left: 5px solid #e94560;
            padding: 10px 40px;
            font-size: 9pt;
            color: #555;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .pdf-body { padding: 30px 45px 50px; }
        h1 { font-size: 20pt; font-weight: 800; color: #0f3460; border-bottom: 3px solid #e94560; padding-bottom: 10px; margin-bottom: 22px; margin-top: 30px; }
        h2 { font-size: 14pt; font-weight: 700; color: #16213e; margin-top: 30px; margin-bottom: 12px; border-left: 4px solid #e94560; padding-left: 10px; }
        h3 { font-size: 12pt; font-weight: 600; color: #0f3460; margin-top: 20px; margin-bottom: 8px; }
        h4 { font-size: 11pt; font-weight: 600; color: #333; margin-top: 16px; margin-bottom: 6px; }
        p { margin-bottom: 10px; }
        ul, ol { margin: 8px 0 12px 22px; }
        li { margin-bottom: 5px; }
        strong { color: #0f3460; font-weight: 700; }
        em { color: #555; }
        code { background: #f0f4ff; padding: 2px 7px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 9.5pt; color: #c0392b; border: 1px solid #d0d8ff; }
        pre { background: #1a1a2e; color: #a8d8a8; padding: 16px 20px; border-radius: 6px; margin: 14px 0; overflow: auto; font-size: 9pt; }
        pre code { background: none; border: none; color: inherit; padding: 0; }
        blockquote { background: #fffbf0; border-left: 5px solid #f39c12; padding: 12px 18px; margin: 14px 0; border-radius: 0 6px 6px 0; }
        blockquote p { margin: 0; color: #5a4a00; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
        th { background: #0f3460; color: white; padding: 8px 12px; text-align: left; font-weight: 600; }
        td { padding: 7px 12px; border-bottom: 1px solid #e0e6f0; }
        tr:nth-child(even) td { background: #f7f9ff; }
        hr { border: none; border-top: 2px solid #e0e6f0; margin: 24px 0; }
        details { background: #f0f4ff; border: 1px solid #c8d8ff; border-radius: 6px; padding: 12px 16px; margin: 12px 0; }
        summary { font-weight: 600; cursor: pointer; color: #0f3460; font-size: 10pt; }
        details[open] { border-color: #0f3460; }
        .pdf-footer {
            margin-top: 40px;
            border-top: 2px solid #e0e6f0;
            padding-top: 14px;
            font-size: 8.5pt;
            color: #888;
            text-align: center;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .pdf-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h1, h2, h3 { page-break-after: avoid; }
            pre, blockquote, table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="pdf-header">
        <div class="logo">SENAI<span>4.0</span></div>
        <div class="meta">
            <span style="font-size:11pt;font-weight:800;color:#e9c46a;display:block;margin-bottom:3px">Instrutor Alan Marciano</span>
            <span style="color:#a8d8ff;font-size:9pt">Gestor em T.I. — SENAI Sertãozinho</span><br>
            Documento gerado em ${dateStr}<br>
            <strong style="color:#e9c46a">USO RESTRITO — MATERIAL DIDÁTICO</strong>
        </div>
    </div>
    <div class="pdf-breadcrumb">${title}</div>
    <div class="pdf-body">
        ${htmlContent}
        <div class="pdf-footer" style="display:flex;justify-content:space-between;align-items:center">
            <span>SENAI Sertãozinho — Portal SENAI 4.0 · ${dateStr}</span>
            <span style="color:#0f3460;font-weight:700">✍️ Instrutor Alan Marciano — Gestor em T.I.</span>
        </div>
    </div>
</body>
</html>`);
        printWindow.document.close();
        printWindow.onload = () => {
            // Abre o diálogo de impressão/salvar como PDF
            setTimeout(() => printWindow.print(), 400);
        };
    });

    // ==========================================
    // SEÇÃO 6: GESTÃO DE SESSÃO DO ALUNO & CADÊADOS REATIVOS
    // ==========================================

    const studentOverlay = document.getElementById('student-login-overlay');
    const studentProfileCard = document.getElementById('student-profile-card');
    const studentProfileName = document.getElementById('student-profile-name');
    const studentProfileClass = document.getElementById('student-profile-class');
    const studentAvatar = document.getElementById('student-avatar');
    
    // Contêineres de abas do modal
    const loginContainer = document.getElementById('student-login-container');
    const registerContainer = document.getElementById('student-register-container');
    const recoveryContainer = document.getElementById('student-recovery-container');

    // Botões
    const btnStudentLogin = document.getElementById('btn-student-login');
    const btnStudentRegister = document.getElementById('btn-student-register');
    const btnStudentRecover = document.getElementById('btn-student-recover');
    const btnStudentLogout = document.getElementById('btn-student-logout');

    // Links de troca de tela
    const linkGoRegister = document.getElementById('link-go-register');
    const linkGoRecovery = document.getElementById('link-go-recovery');
    const linkGoLogin = document.getElementById('link-go-login');
    const linkGoLoginFromRecovery = document.getElementById('link-go-login-from-recovery');

    // Msg Elements
    const loginErrorMsg = document.getElementById('login-error-msg');
    const registerErrorMsg = document.getElementById('register-error-msg');
    const recoveryStatusMsg = document.getElementById('recovery-status-msg');

    let sidebarLocksPoll = null;

    function loadAvailableClasses() {
        const selectEl = document.getElementById('register-class');
        if (!selectEl) return;
        
        fetch('/api/classes')
        .then(res => res.json())
        .then(classes => {
            selectEl.innerHTML = '';
            if (classes.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Nenhuma turma liberada para cadastro';
                selectEl.appendChild(opt);
            } else {
                classes.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    selectEl.appendChild(opt);
                });
            }
        })
        .catch(err => {
            console.warn('Erro ao carregar lista de turmas:', err);
        });
    }

    // Transições de tela do modal
    if (linkGoRegister) {
        linkGoRegister.addEventListener('click', () => {
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerContainer) registerContainer.style.display = 'block';
            if (recoveryContainer) recoveryContainer.style.display = 'none';
            if (registerErrorMsg) registerErrorMsg.style.display = 'none';
            loadAvailableClasses();
        });
    }

    if (linkGoRecovery) {
        linkGoRecovery.addEventListener('click', () => {
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerContainer) registerContainer.style.display = 'none';
            if (recoveryContainer) recoveryContainer.style.display = 'block';
            if (recoveryStatusMsg) recoveryStatusMsg.style.display = 'none';
        });
    }

    const showLoginPanel = () => {
        if (loginContainer) loginContainer.style.display = 'block';
        if (registerContainer) registerContainer.style.display = 'none';
        if (recoveryContainer) recoveryContainer.style.display = 'none';
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
    };

    if (linkGoLogin) linkGoLogin.addEventListener('click', showLoginPanel);
    if (linkGoLoginFromRecovery) linkGoLoginFromRecovery.addEventListener('click', showLoginPanel);

    function checkStudentSession() {
        const studentInfoStr = localStorage.getItem("student_info");
        if (!studentInfoStr) {
            if (studentOverlay) studentOverlay.style.display = 'flex';
            if (studentProfileCard) studentProfileCard.style.display = 'none';
            
            // Para as atualizações do sidebar se não estiver logado
            if (sidebarLocksPoll) {
                clearInterval(sidebarLocksPoll);
                sidebarLocksPoll = null;
            }
        } else {
            try {
                const info = JSON.parse(studentInfoStr);
                if (studentOverlay) studentOverlay.style.display = 'none';
                if (studentProfileCard) studentProfileCard.style.display = 'flex';
                if (studentProfileName) studentProfileName.textContent = info.name;
                if (studentProfileClass) studentProfileClass.textContent = `${info.studentClass} • ${info.period}`;
                
                if (studentAvatar && info.name) {
                    const names = info.name.trim().split(" ");
                    const initials = names.length > 1 
                        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
                        : names[0].substring(0, 2).toUpperCase();
                    studentAvatar.textContent = initials;
                }

                // Inicia sincronização de cadeados da barra lateral
                syncSidebarLocks();
                if (!sidebarLocksPoll) {
                    sidebarLocksPoll = setInterval(syncSidebarLocks, 5000);
                }
            } catch (e) {
                localStorage.removeItem("student_info");
                if (studentOverlay) studentOverlay.style.display = 'flex';
                if (studentProfileCard) studentProfileCard.style.display = 'none';
            }
        }
    }

    // Login Event Handler
    if (btnStudentLogin) {
        btnStudentLogin.addEventListener('click', () => {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (!email || !password) {
                showLoginError('Por favor, preencha todos os campos.');
                return;
            }

            fetch('/api/student/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || "Erro ao logar.") });
                }
                return res.json();
            })
            .then(data => {
                localStorage.setItem("student_info", JSON.stringify({
                    name: data.student.name,
                    email: data.student.email,
                    studentClass: data.student.studentClass,
                    period: data.student.period
                }));
                checkStudentSession();
            })
            .catch(err => {
                console.warn(err);
                if (err.message.includes("Failed to fetch") || err.message.includes("error")) {
                    showLoginError(err.message || 'Erro ao conectar ao servidor local.');
                } else {
                    showLoginError('E-mail ou senha incorretos.');
                }
            });
        });
    }

    function showLoginError(msg) {
        if (loginErrorMsg) {
            loginErrorMsg.textContent = msg;
            loginErrorMsg.style.display = 'block';
        }
    }

    // Register Event Handler
    if (btnStudentRegister) {
        btnStudentRegister.addEventListener('click', () => {
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value.trim();
            const studentClass = document.getElementById('register-class').value.trim();

            if (!name || !email || !password || !studentClass) {
                showRegisterError('Por favor, preencha todos os campos do cadastro.');
                return;
            }

            fetch('/api/student/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, studentClass })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || "Erro ao cadastrar.") });
                }
                return res.json();
            })
            .then(() => {
                // Efetua login automático após o cadastro
                fetch('/api/student/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                .then(res => res.json())
                .then(data => {
                    localStorage.setItem("student_info", JSON.stringify({
                        name: data.student.name,
                        email: data.student.email,
                        studentClass: data.student.studentClass,
                        period: data.student.period
                    }));
                    checkStudentSession();
                });
            })
            .catch(err => {
                showRegisterError(err.message || 'Erro ao efetuar cadastro no servidor.');
            });
        });
    }

    function showRegisterError(msg) {
        if (registerErrorMsg) {
            registerErrorMsg.textContent = msg;
            registerErrorMsg.style.display = 'block';
        }
    }

    // Password Recovery Handler
    if (btnStudentRecover) {
        btnStudentRecover.addEventListener('click', () => {
            const email = document.getElementById('recovery-email').value.trim();
            if (!email) {
                showRecoveryMessage('Por favor, digite o seu e-mail.', true);
                return;
            }

            fetch('/api/student/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || "E-mail inválido.") });
                }
                return res.json();
            })
            .then(data => {
                showRecoveryMessage('Solicitação enviada com sucesso! Peça ao instrutor para visualizar ou redefinir sua senha no painel.', false);
            })
            .catch(err => {
                showRecoveryMessage(err.message || 'Erro ao enviar solicitação.', true);
            });
        });
    }

    function showRecoveryMessage(msg, isError) {
        if (recoveryStatusMsg) {
            recoveryStatusMsg.textContent = msg;
            recoveryStatusMsg.style.display = 'block';
            recoveryStatusMsg.style.background = isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
            recoveryStatusMsg.style.color = isError ? '#f87171' : '#4ade80';
            recoveryStatusMsg.style.border = isError ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)';
        }
    }

    // Logout Handler
    if (btnStudentLogout) {
        btnStudentLogout.addEventListener('click', () => {
            const confirmLogout = confirm("Deseja realmente sair da sua conta de estudante?");
            if (!confirmLogout) return;
            localStorage.removeItem("student_info");
            checkStudentSession();
        });
    }

    // Sincronizar Cadeados da Barra Lateral
    function syncSidebarLocks() {
        const studentClass = getStudentClass();
        fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}`)
        .then(res => {
            if (!res.ok) throw new Error("Offline");
            return res.json();
        })
        .then(data => {
            const releasedItems = data.releasedItems || {};
            
            document.querySelectorAll(".nav-item").forEach(item => {
                const key = item.getAttribute("data-key");
                if (key) {
                    const isReleased = releasedItems[key] === true;
                    let lockSpan = item.querySelector(".sidebar-lock-indicator");
                    
                    if (!isReleased) {
                        item.classList.add("locked");
                        item.style.opacity = "0.6";
                        if (!lockSpan) {
                            lockSpan = document.createElement("span");
                            lockSpan.className = "sidebar-lock-indicator";
                            lockSpan.style.marginLeft = "8px";
                            lockSpan.textContent = "🔒";
                            item.appendChild(lockSpan);
                        }
                    } else {
                        item.classList.remove("locked");
                        item.style.opacity = "1";
                        if (lockSpan) {
                            lockSpan.remove();
                        }
                    }
                }
            });
        })
        .catch(err => {
            // Em caso de offline, libera o acesso visual na barra lateral
            document.querySelectorAll(".sidebar-lock-indicator").forEach(el => el.remove());
            document.querySelectorAll(".nav-item").forEach(item => {
                item.classList.remove("locked");
                item.style.opacity = "1";
            });
        });
    }

    // Trigger Login on Enter
    const emailLoginInput = document.getElementById('login-email');
    const passLoginInput = document.getElementById('login-password');
    const triggerLoginOnEnter = (e) => {
        if (e.key === 'Enter') {
            if (btnStudentLogin) btnStudentLogin.click();
        }
    };
    if (emailLoginInput) emailLoginInput.addEventListener('keypress', triggerLoginOnEnter);
    if (passLoginInput) passLoginInput.addEventListener('keypress', triggerLoginOnEnter);

    // Inicializa a sessão ao carregar a página
    checkStudentSession();
    loadAvailableClasses();

});
