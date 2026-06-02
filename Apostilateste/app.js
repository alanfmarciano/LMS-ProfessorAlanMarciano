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

// Tenta extrair o título real da apostila
            let missionTitle = `Unidade ${i + 1}`;
            if (typeof courseData !== 'undefined' && courseData[apostilas[i]]) {
                missionTitle = extractTitle(courseData[apostilas[i]], missionTitle);
            }

            // Verifica se a Apostila existe no courseData
            if (typeof courseData !== 'undefined' && courseData[apostilas[i]]) {
                const li = document.createElement("li");
                li.className = "nav-item";
                li.innerHTML = `<strong>${missionTitle}</strong> <span class="nav-sub">📘 Apostila Guia</span>`;
                li.onclick = () => loadContent(apostilas[i], li, `${moduleName} > Unidade ${i + 1} > Apostila`);
                parentElement.appendChild(li);
            }

            // Verifica se a Avaliação existe no courseData
            if (typeof courseData !== 'undefined' && courseData[avaliacoes[i]]) {
                const li = document.createElement("li");
                li.className = "nav-item";
                li.innerHTML = `<strong>${missionTitle}</strong> <span class="nav-sub" style="color: #60a5fa">🎯 Avaliação</span>`;
                li.onclick = () => loadContent(avaliacoes[i], li, `${moduleName} > Unidade ${i + 1} > Avaliação`);
                parentElement.appendChild(li);
            }
        }
    }

    // Inicializa o Menu Lateral
    renderNavItems(m1_apostilas, m1_avaliacoes, navFundamentos, "FUTEC — Fund. de TI (80h)");
    renderNavItems(m2_apostilas, m2_avaliacoes, navColaboracao, "FECOP — Colab. e Prod. (120h)");
    renderNavItems(m3_apostilas, m3_avaliacoes, navIRCOM, "IRCOM — Inst. Rec. Comp. (120h)");

    function loadContent(key, element, breadcrumbText) {
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
        if (rawMarkdown && typeof marked !== 'undefined') {
            // Renderiza o HTML usando marked.js
            contentViewer.innerHTML = marked.parse(rawMarkdown);
            // Retorna a rolagem para o topo
            contentViewer.scrollTo(0, 0);
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
    });
    // --- EXPORTAR PDF ---
    exportPdfBtn.addEventListener("click", () => {
        if (!currentKey || !courseData[currentKey]) return;

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

});
