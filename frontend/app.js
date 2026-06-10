document.addEventListener("DOMContentLoaded", () => {
    const sidebarContainer = document.getElementById("sidebar-navigation-modules");
    const contentViewer = document.getElementById("content-viewer");
    const breadcrumb = document.getElementById("breadcrumb");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.getElementById("sidebar");
    const exportPdfBtn = document.getElementById("export-pdf-btn");

    // Estado atual carregado
    let currentKey = null;
    let currentBreadcrumb = "Portal LMS";
    let breadcrumbHistory = []; // Histórico de navegação
    
    // Polyfill to prevent crashes from missing function
    window.stopExamConfigPoll = function() {
        if (window.examConfigPollInterval) {
            clearInterval(window.examConfigPollInterval);
            window.examConfigPollInterval = null;
        }
    };
    
    // Alterna para o Painel Global (Meus Cursos)
    window.showMyCoursesView = function() {
        stopExamConfigPoll();
        if (examLockPoll) { clearInterval(examLockPoll); examLockPoll = null; }
        
        const sidebarGlobal = document.getElementById('sidebar-global-view');
        const sidebarCourse = document.getElementById('sidebar-course-view');
        if(sidebarGlobal) sidebarGlobal.style.display = 'flex';
        if(sidebarCourse) sidebarCourse.style.display = 'none';
        
        const viewMyCourses = document.getElementById('view-my-courses');
        const viewCoursePanel = document.getElementById('view-course-panel');
        const viewMarkdown = document.getElementById('view-markdown');
        if(viewMyCourses) viewMyCourses.style.display = 'block';
        if(viewCoursePanel) viewCoursePanel.style.display = 'none';
        if(viewMarkdown) viewMarkdown.style.display = 'none';

        currentBreadcrumb = "Portal LMS > Meus Cursos";
        if(breadcrumb) breadcrumb.innerHTML = '<span>🏠</span><strong>LMS4.0</strong><span>/</span><span>Meus Cursos</span>';

        // Load Global Dashboard Data
        loadGlobalDashboard();
        
        if(contentViewer) contentViewer.scrollTo(0, 0);
    };

    // Alterna para o Painel EspecÃ­fico do Curso
    window.showCoursePanelView = function() {
        if (!currentStudentCourseId) {
            if(typeof showToast === 'function') showToast('Selecione um curso primeiro.');
            return;
        }

        stopExamConfigPoll();
        if (examLockPoll) { clearInterval(examLockPoll); examLockPoll = null; }
        
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        if(document.getElementById('nav-course-panel')) {
            document.getElementById('nav-course-panel').classList.add("active");
        }
        currentKey = null;

        const sidebarGlobal = document.getElementById('sidebar-global-view');
        const sidebarCourse = document.getElementById('sidebar-course-view');
        if(sidebarGlobal) sidebarGlobal.style.display = 'none';
        if(sidebarCourse) sidebarCourse.style.display = 'flex';
        
        const viewMyCourses = document.getElementById('view-my-courses');
        const viewCoursePanel = document.getElementById('view-course-panel');
        const viewMarkdown = document.getElementById('view-markdown');
        if(viewMyCourses) viewMyCourses.style.display = 'none';
        if(viewCoursePanel) viewCoursePanel.style.display = 'block';
        if(viewMarkdown) viewMarkdown.style.display = 'none';

        currentBreadcrumb = `Portal LMS > ${currentStudentCourseId} > Painel`;
        if(breadcrumb) breadcrumb.innerHTML = `<span>🏠</span><strong>LMS4.0</strong><span>/</span><span>${currentStudentCourseId}</span><span>/</span><span>Painel</span>`;

        // Update Course sidebar name
        const sidebarName = document.getElementById('sidebar-active-course-name');
        if (sidebarName) sidebarName.textContent = currentStudentCourseId;

        // Load Course Dashboard Data
        loadCourseDashboard();
        updateProgressBadges();

        if(contentViewer) contentViewer.scrollTo(0, 0);
    };

    // Mantendo a compatibilidade do nome renderStudentDashboard
    window.renderStudentDashboard = showMyCoursesView;

    const btnStudentDashboard = document.getElementById('btn-student-dashboard');
    if (btnStudentDashboard) {
        btnStudentDashboard.addEventListener('click', showMyCoursesView);
    }
    
    // Estado do sistema de avaliaÃ§Ãµes
    let currentExamState = null;
    let currentStudentCourseId = null;
    let currentStudentClassName = null; // { questions, rubric, title, theme, shuffledQuestions, questionCount }

    // Estado de Progresso e Simulador
    let completedUnits = JSON.parse(localStorage.getItem("completed_units") || "{}");
    
    window.renderMarkdownContent = function(html) {
        if(document.getElementById('view-my-courses')) document.getElementById('view-my-courses').style.display = 'none';
        if(document.getElementById('view-course-panel')) document.getElementById('view-course-panel').style.display = 'none';
        
        const mdView = document.getElementById('view-markdown');
        if (mdView) {
            mdView.style.display = 'block';
            mdView.innerHTML = html;
        }
    };

    let isSimulatorMode = false;
    let userAnswers = {};
    let isSimulatorSubmitted = false;
    let examLockPoll = null;
    let lastReleasedItemsKeys = null; 

    // Function to dynamically load data.js for the selected course and render the sidebar
    window.fetchDataAndRender = function() {
        if (!currentStudentCourseId) return;

        const scriptUrl = `/api/data.js?courseId=${currentStudentCourseId}`;
        const existingScript = document.getElementById('dynamic-data-script');
        if (existingScript) existingScript.remove();

        const script = document.createElement('script');
        script.id = 'dynamic-data-script';
        script.src = scriptUrl;
        script.onload = () => {
            // Recalcula chaves se necessÃ¡rio
            if (typeof courseData !== 'undefined') {
                allEvaluationKeys.length = 0;
                const structure = getActiveStructure();
                structure.forEach(mod => {
                    mod.units.forEach(u => {
                        allEvaluationKeys.push(u.avaliacaoKey);
                    });
                });
                
                // Aplicar branding
                if (courseData.branding) {
                    if (courseData.branding.primaryColor) {
                        document.documentElement.style.setProperty('--primary-color', courseData.branding.primaryColor);
                    }
                    if (courseData.branding.institutionName) {
                        document.title = courseData.branding.institutionName + ' - Portal do Aluno';
                        const bc = document.getElementById('breadcrumb');
                        if(bc) bc.textContent = courseData.branding.institutionName;
                    }
                }
            }
            renderDynamicSidebar();
            syncSidebarLocks();
            
            // Auto-selecionar o primeiro item disponÃ­vel
            const firstItem = document.querySelector(".nav-item");
            if (firstItem && !currentKey) {
                firstItem.click();
            }
        };
        document.body.appendChild(script);
    };

    // Configurar Modo Foco
    const focusModeBtn = document.getElementById("focus-mode-btn");
    const appContainer = document.getElementById("app-container");
    if (focusModeBtn && appContainer) {
        focusModeBtn.addEventListener("click", () => {
            appContainer.classList.toggle("focus-active");
            const isActive = appContainer.classList.contains("focus-active");
            focusModeBtn.classList.toggle("active", isActive);
            if (isActive) {
                focusModeBtn.innerHTML = `<span class="btn-icon">ðŸ‘ï¸</span> Sair do Foco`;
            } else {
                focusModeBtn.innerHTML = `<span class="btn-icon">ðŸ‘ï¸</span> Modo Foco`;
            }
        });
    }

    // Configurar DiagnÃ³stico
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
        console.error("Marked.js nÃ£o carregou.");
    }

    function getActiveStructure() {
        let structure = [];
        const studentInfoStr = sessionStorage.getItem("student_info");
        let courseId = null;
        if (studentInfoStr) {
            try {
                const info = JSON.parse(studentInfoStr);
                courseId = info.courseId;
            } catch (e) {}
        }

        if (courseId && typeof courseData !== 'undefined' && courseData.courses) {
            const course = courseData.courses.find(c => c.id === courseId);
            if (course && course.structure) {
                structure = course.structure;
            }
        }
        if (structure.length === 0 && typeof courseData !== 'undefined' && courseData.courseStructure) {
            structure = courseData.courseStructure;
        }
        return structure;
    }

    // Estrutura das Nomenclaturas dos Arquivos
    const allEvaluationKeys = [];
    if (typeof courseData !== 'undefined') {
        const structure = getActiveStructure();
        structure.forEach(mod => {
            mod.units.forEach(u => {
                allEvaluationKeys.push(u.avaliacaoKey);
            });
        });
    }

    function extractTitle(markdownText, defaultTitle) {
        if (!markdownText) return defaultTitle;
        const match = markdownText.match(/^#\s+(.+)$/m);
        if (match && match[1]) {
            // Remove emojis e substitui MissÃ£o por Unidade
            let title = match[1].replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim();
            title = title.replace(/MissÃ£o/g, 'Unidade');
            return title;
        }
        return defaultTitle;
    }

    function renderDynamicSidebar() {
        const sidebarContainer = document.getElementById("sidebar-navigation-modules");
        if (!sidebarContainer) return;
        sidebarContainer.innerHTML = "";

        const structure = getActiveStructure();
        structure.forEach(mod => {
            const section = document.createElement("div");
            section.className = "py-4 border-b border-slate-700/50 group collapsed";

            const h3 = document.createElement("h3");
            h3.className = "cursor-pointer flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-widest px-6 mb-2 hover:text-white transition-colors select-none";
            h3.innerHTML = `
                <span>${mod.name}</span>
                <span class="text-primary font-bold ml-auto mr-3" id="progress-m-${mod.id}">0%</span>
                <span class="transform transition-transform duration-300 group-[.collapsed]:-rotate-90">â–¾</span>
            `;
            h3.addEventListener("click", () => {
                section.classList.toggle("collapsed");
                if (ul.classList.contains("max-h-0")) {
                    ul.classList.remove("max-h-0", "opacity-0");
                    ul.classList.add("max-h-[2000px]", "opacity-100");
                } else {
                    ul.classList.remove("max-h-[2000px]", "opacity-100");
                    ul.classList.add("max-h-0", "opacity-0");
                }
            });

            const ul = document.createElement("ul");
            ul.id = `nav-${mod.id}`;
            ul.className = "list-none transition-all duration-300 overflow-hidden max-h-0 opacity-0";

            mod.units.forEach(u => {
                // Render Apostila Item
                let missionTitle = u.name;
                
                if (courseData[u.apostilaKey]) {
                    const li = document.createElement("li");
                    li.className = "nav-item cursor-pointer px-6 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent hover:border-slate-500 transition-all";
                    li.setAttribute("data-key", u.apostilaKey);
                    if (completedUnits[u.apostilaKey]) {
                        li.classList.add("completed", "bg-green-500/10", "border-green-500", "text-green-300");
                        li.classList.remove("border-transparent", "hover:border-slate-500", "text-slate-300");
                    }
                    li.innerHTML = `<strong>Unidade ${u.id}: ${missionTitle}</strong> <span class="block text-[11px] text-slate-500 uppercase font-bold mt-1">ðŸ“˜ Apostila Guia</span>`;
                    li.onclick = () => {
                        document.querySelectorAll('#sidebar-navigation-modules li').forEach(el => el.classList.remove('bg-primary/20', 'border-primary', 'text-white'));
                        li.classList.add('bg-primary/20', 'border-primary', 'text-white');
                        loadContent(u.apostilaKey, li, `${mod.id} > Unidade ${u.id} > Apostila`);
                    };
                    ul.appendChild(li);
                }

                // Render AvaliaÃ§Ã£o Item
                if (courseData[u.avaliacaoKey]) {
                    const li = document.createElement("li");
                    li.className = "nav-item cursor-pointer px-6 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent hover:border-blue-400 transition-all";
                    li.setAttribute("data-key", u.avaliacaoKey);
                    li.innerHTML = `<strong>Unidade ${u.id}: ${missionTitle}</strong> <span class="block text-[11px] text-blue-400 uppercase font-bold mt-1">ðŸŽ¯ AvaliaÃ§Ã£o</span>`;
                    li.onclick = () => {
                        document.querySelectorAll('#sidebar-navigation-modules li').forEach(el => el.classList.remove('bg-primary/20', 'border-primary', 'text-white'));
                        li.classList.add('bg-blue-500/20', 'border-blue-500', 'text-white');
                        loadContent(u.avaliacaoKey, li, `${mod.id} > Unidade ${u.id} > AvaliaÃ§Ã£o`);
                    };
                    ul.appendChild(li);
                }
            });

            section.appendChild(h3);
            section.appendChild(ul);
            sidebarContainer.appendChild(section);
        });
    }

    // Toast Notification helper for new content releases
    function showStudentToastNotification(title, message) {
        let container = document.getElementById('student-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'student-toast-container';
            container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 11000; pointer-events: none;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = 'background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.3); color: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 4px; pointer-events: auto; min-width: 300px; max-width: 400px; transform: translateY(50px); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); animation: toastFadeIn 0.4s forwards;';
        
        toast.innerHTML = `
            <div style="font-weight: 800; color: #ef4444; font-size: 0.95rem; display: flex; align-items: center; justify-content: space-between;">
                <span>${title}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 0 5px;">âœ•</button>
            </div>
            <div style="font-size: 0.85rem; color: #cbd5e1; font-weight: 500; line-height: 1.4;">${message}</div>
        `;

        if (!document.getElementById('toast-styles-el')) {
            const style = document.createElement('style');
            style.id = 'toast-styles-el';
            style.textContent = `
                @keyframes toastFadeIn {
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateY(20px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 6000);
    }

    // ==========================================
    // SEÃ‡ÃƒO DE PROGRESSO, GLOSSÃRIO E BUSCA HIGHLIGHT
    // ==========================================

    function updateProgressBadges() {
        completedUnits = JSON.parse(localStorage.getItem("completed_units") || "{}");
        
        const structure = (typeof courseData !== 'undefined' && courseData.courseStructure) ? courseData.courseStructure : [];
        const progressBarsContainer = document.querySelector(".module-progress-bars");
        
        let totalDone = 0, totalAvail = 0;
        let totalUnitsCount = 0;
        let completedUnitsCount = 0;

        if (progressBarsContainer) {
            progressBarsContainer.innerHTML = "";
        }

        structure.forEach(mod => {
            let done = 0, total = 0;
            mod.units.forEach(u => {
                totalUnitsCount++;
                if (completedUnits[u.apostilaKey]) {
                    completedUnitsCount++;
                }

                const k = u.apostilaKey;
                if (courseData && courseData[k]) {
                    let numTopics = (courseData[k].match(/^## /gm) || []).length;
                    if (numTopics === 0) numTopics = 1;
                    total += numTopics;

                    const status = completedUnits[k];
                    if (status === true) done += numTopics;
                    else if (Array.isArray(status)) done += Math.min(status.length, numTopics);
                }
            });

            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            totalDone += done;
            totalAvail += total;

            // Atualiza percentual no sidebar
            const badge = document.getElementById(`progress-m-${mod.id}`);
            if (badge) {
                badge.textContent = `${pct}%`;
            }

            // Renderiza barra no dashboard
            if (progressBarsContainer) {
                const barItem = document.createElement("div");
                barItem.innerHTML = `
                    <div class="flex justify-between text-sm font-bold text-slate-300 mb-2">
                        <span>${mod.name}</span>
                        <span class="text-white">${pct}%</span>
                    </div>
                    <div class="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                        <div class="h-full bg-gradient-to-r from-primary to-red-500 rounded-full transition-all duration-1000" style="width: ${pct}%;"></div>
                    </div>
                `;
                progressBarsContainer.appendChild(barItem);
            }
        });

        const statCompleted = document.getElementById('stat-completed');
        if (statCompleted) statCompleted.textContent = completedUnitsCount;

        let attendanceCount = 0;
        let attendanceListHtml = '';
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (studentInfoStr) {
            try {
                const info = JSON.parse(studentInfoStr);
                if (info.attendanceDays && Array.isArray(info.attendanceDays)) {
                    attendanceCount = info.attendanceDays.length;
                    
                    const sortedDays = [...info.attendanceDays].sort((a, b) => new Date(b) - new Date(a));
                    attendanceListHtml = sortedDays.map(d => {
                        const [y, m, day] = d.split('-');
                        return `<li class="bg-black/20 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                            <span class="flex items-center gap-2"><span class="text-green-400">â—</span> Login registrado</span>
                            <strong class="text-primary">${day}/${m}/${y}</strong>
                        </li>`;
                    }).join('');
                }
            } catch (e) {}
        }
        
        const statAttendance = document.getElementById('stat-attendance');
        if (statAttendance) statAttendance.textContent = attendanceCount;

        const attendanceContainer = document.getElementById('student-attendance-container');
        const attendanceUl = document.getElementById('attendance-list');
        if (attendanceContainer && attendanceUl) {
            if (attendanceCount > 0) {
                attendanceContainer.style.display = 'flex';
                attendanceUl.innerHTML = attendanceListHtml;
            } else {
                attendanceContainer.style.display = 'none';
            }
        }

        const radBar = document.getElementById('radial-progress-bar-el');
        const radText = document.getElementById('radial-progress-percentage-text');
        const totalStatusText = document.getElementById('progress-total-status');

        const totalPct = totalAvail > 0 ? Math.round((totalDone / totalAvail) * 100) : 0;

        if (totalStatusText) totalStatusText.textContent = `${completedUnitsCount} de ${totalUnitsCount} Unidades ConcluÃ­das`;
        if (radText) radText.textContent = `${totalPct}%`;
        if (radBar) {
            const offset = 251.2 - (251.2 * totalPct / 100);
            radBar.style.strokeDashoffset = offset;
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

    let studentChartInstance = null;
    
    function renderStudentEvolutionChart(submissions) {
        const canvas = document.getElementById('student-evolution-chart');
        const container = document.getElementById('student-chart-container');
        if (!canvas || !container) return;

        if (submissions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        // Ordenar cronologicamente ascendente
        const sortedSubs = [...submissions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const labels = sortedSubs.map(s => {
            const label = s.examKey.replace('Avaliacao_', '').replace('_', ' U');
            return label;
        });
        const scores = sortedSubs.map(s => s.score);

        if (studentChartInstance) {
            studentChartInstance.destroy();
        }

        studentChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'PontuaÃ§Ã£o (%)',
                    data: scores,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#ffffff',
                        bodyColor: '#f8fafc',
                        borderColor: '#334155',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Nota: ${context.raw}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                family: 'Inter', size: 10
                            }
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                family: 'Inter', size: 10
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    function loadStudentSubmissionsDashboard() {
        const container = document.getElementById("student-completed-exams-container");
        const listEl = document.getElementById("completed-exams-list");
        if (!container || !listEl) return;

        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) {
            container.style.display = "none";
            return;
        }

        const info = JSON.parse(studentInfoStr);
        fetch('/api/student/my-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: info.email })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.submissions && data.submissions.length > 0) {
                container.style.display = "block";
                listEl.innerHTML = "";
                
                // Renderizar grÃ¡fico de evoluÃ§Ã£o
                renderStudentEvolutionChart(data.submissions);
                
                // Ordenar do mais recente para o mais antigo
                data.submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                data.submissions.forEach(sub => {
                    const card = document.createElement("div");
                    card.className = "bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col gap-3 text-left relative shadow-lg hover:bg-slate-800/50 transition-colors group";
                    
                    const date = new Date(sub.timestamp).toLocaleDateString('pt-BR') + ' Ã s ' + new Date(sub.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                    const moduleName = sub.examKey.replace('Avaliacao_', '').replace('_', ' Unidade ');
                    
                    const isApproved = sub.score >= 60;
                    const badgeClass = isApproved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30';
                    const badgeText = isApproved ? 'Aprovado' : 'RecuperaÃ§Ã£o';
                    const scoreColor = isApproved ? 'text-white' : 'text-primary';
                    
                    card.innerHTML = `
                        <div class="flex justify-between items-start">
                            <span class="text-xs font-bold text-primary uppercase tracking-wider">${moduleName}</span>
                            <span class="${badgeClass} text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">${badgeText}</span>
                        </div>
                        <h4 class="text-3xl font-black ${scoreColor} mt-1">${sub.score}%</h4>
                        <div class="text-sm text-slate-400 font-semibold mt-1">
                            ðŸŽ¯ ${sub.correctCount} de ${sub.totalCount} acertos
                        </div>
                        <div class="text-xs text-slate-500 mt-2">
                            ðŸ“… ${date}
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-1 mb-1">
                            #ï¸âƒ£ Protocolo: <span class="text-primary font-bold">${sub.protocolCode || 'NÃ£o registrado'}</span>
                        </div>
                        <button class="btn-view-exam-history w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-1 focus:ring-slate-500">ðŸ” Ver Gabarito Detalhado</button>
                    `;
                    
                    card.querySelector(".btn-view-exam-history").addEventListener("click", () => {
                        const rawMarkdown = courseData[sub.examKey];
                        if (rawMarkdown) {
                            const moduleNavName = sub.examKey.includes('FUTEC') ? 'FUTEC' : (sub.examKey.includes('FECOP') ? 'FECOP' : 'IRCOM');
                            const unitNum = sub.examKey.charAt(sub.examKey.length - 1);
                            const breadcrumbText = `${moduleNavName} > Unidade ${unitNum} > AvaliaÃ§Ã£o`;
                            
                            breadcrumb.innerHTML = formatBreadcrumb(breadcrumbText);
                            currentBreadcrumb = breadcrumbText;
                            currentKey = sub.examKey;
                            
                            document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
                            const matchedNavItem = document.querySelector(`.nav-item[data-key="${sub.examKey}"]`);
                            if (matchedNavItem) matchedNavItem.classList.add("active");
                            
                            renderExamHistoryView(sub, rawMarkdown);
                        } else {
                            alert("NÃ£o foi possÃ­vel carregar o conteÃºdo original desta prova.");
                        }
                    });
                    
                    listEl.appendChild(card);
                });
            } else {
                if (studentInfoStr) {
                    container.style.display = "block";
                    listEl.innerHTML = `
                        <div style="grid-column: 1 / -1; background: var(--bg-card); border: 1px dashed var(--border); padding: 30px; border-radius: 16px; text-align: center; color: var(--text-muted);">
                            <span style="font-size: 2rem; display: block; margin-bottom: 10px;">ðŸŽ¯</span>
                            Nenhuma avaliaÃ§Ã£o realizada ainda. Suas provas e notas aparecerÃ£o aqui quando vocÃª responder as avaliaÃ§Ãµes liberadas.
                        </div>
                    `;
                    const chartContainer = document.getElementById('student-chart-container');
                    if (chartContainer) chartContainer.style.display = 'none';
                } else {
                    container.style.display = "none";
                }
            }
        })
        .catch(err => {
            console.error("Erro ao carregar histÃ³rico de provas:", err);
        });
    }


    // Realce de Busca
    function highlightText(container, term) {
        removeHighlights(container);
        if (!term || term.trim() === "") return;
        
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        
        function walk(node) {
            if (node.nodeType === 3) { // NÃ³ de texto
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

    // GlossÃ¡rio Hover
    function applyGlossary(container) {
        const glossary = {
            "Active Directory": "ServiÃ§o de diretÃ³rio centralizado da Microsoft usado para gerenciar computadores e usuÃ¡rios em uma rede corporativa.",
            "LDAP": "Lightweight Directory Access Protocol â€” Protocolo padrÃ£o para consulta de credenciais de usuÃ¡rios e computadores em serviÃ§os de diretÃ³rio como Active Directory.",
            "UEFI": "Unified Extensible Firmware Interface â€” Interface de firmware moderna que substituiu o antigo BIOS, fornecendo carregamento mais rÃ¡pido e recursos de seguranÃ§a avanÃ§ados.",
            "BIOS": "Basic Input/Output System â€” Firmware tradicional gravado na placa-mÃ£e que inicializa o hardware e inicia o sistema operacional durante o boot.",
            "TDP": "Thermal Design Power â€” PotÃªncia de Design TÃ©rmico. A quantidade mÃ¡xima de calor em Watts gerada pela CPU que o cooler precisa dissipar de forma segura.",
            "KMS": "Key Management Service â€” ServiÃ§o de Gerenciamento de Chaves para ativaÃ§Ã£o automatizada de licenÃ§as Microsoft em ambiente corporativo local.",
            "FHS": "Filesystem Hierarchy Standard â€” Diretriz padrÃ£o que define a finalidade de cada diretÃ³rio e pasta do sistema em distribuiÃ§Ãµes Linux.",
            "PLC": "Programmable Logic Controller (CLP) â€” Controlador LÃ³gico ProgramÃ¡vel. Computador industrial robusto projetado para automatizar processos produtivos e mÃ¡quinas.",
            "CLP": "Controlador LÃ³gico ProgramÃ¡vel â€” Computador industrial robusto projetado para automatizar processos de manufatura e maquinÃ¡rios na indÃºstria.",
            "GPO": "Group Policy Object â€” Diretiva de Grupo do Active Directory que aplica configuraÃ§Ãµes automÃ¡ticas de seguranÃ§a e restriÃ§Ãµes nos computadores do domÃ­nio.",
            "OU": "Organizational Unit â€” Unidade Organizacional. Pasta lÃ³gica no Active Directory usada para organizar usuÃ¡rios e computadores por setores ou departamentos.",
            "RAM": "Random Access Memory â€” MemÃ³ria volÃ¡til ultrarrÃ¡pida que armazena os dados dos programas que a CPU estÃ¡ processando ativamente no momento.",
            "CPU": "Central Processing Unit â€” Unidade Central de Processamento. O processador principal que calcula dados e executa instruÃ§Ãµes de software.",
            "SSD": "Solid State Drive â€” Disco eletrÃ´nico sem partes mÃ³veis, muito mais rÃ¡pido, durÃ¡vel e eficiente que os discos rÃ­gidos (HDs) tradicionais.",
            "NVMe": "Non-Volatile Memory Express â€” Protocolo de alto desempenho projetado especificamente para acessar armazenamento de estado sÃ³lido rÃ¡pido via slots PCIe.",
            "HD": "Hard Disk â€” Disco RÃ­gido tradicional. Dispositivo de armazenamento mecÃ¢nico e magnÃ©tico de alta capacidade mas velocidades lentas devido Ã s agulhas de leitura.",
            "FUTEC": "MÃ³dulo de Fundamentos de TI do Portal Portal LMS (80h de carga horÃ¡ria).",
            "FECOP": "MÃ³dulo de ColaboraÃ§Ã£o e Produtividade do Portal Portal LMS (120h de carga horÃ¡ria).",
            "IRCOM": "MÃ³dulo de InstalaÃ§Ã£o de Recursos Computacionais do Portal Portal LMS (120h de carga horÃ¡ria)."
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
                tooltip.innerHTML = `<div class="tooltip-title">ðŸ’¡ ${word} <span>GlossÃ¡rio</span></div><div>${def}</div>`;
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

    // Painel de DiagnÃ³stico do Professor
    function loadDiagnostico() {
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        breadcrumb.innerHTML = formatBreadcrumb("DiagnÃ³stico");
        currentBreadcrumb = "DiagnÃ³stico";
        currentKey = null;
        exportPdfBtn.disabled = true;
        currentExamState = null;
        
        let reportHTML = `
            <div class="diagnostico-panel">
                <h2>ðŸ©º Validador e SaÃºde de ConteÃºdo (Portal LMS)</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">
                    Esta ferramenta analisa automaticamente o tamanho das apostilas, a presenÃ§a de imagens e a integridade de todas as avaliaÃ§Ãµes no sistema.
                </p>
                <table class="diagnostico-table">
                    <thead>
                        <tr>
                            <th>Recurso</th>
                            <th>Tipo</th>
                            <th>MÃ©trica / DiagnÃ³stico</th>
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
            let type = k.includes('Apostila') ? 'ðŸ“˜ Apostila' : 'ðŸŽ¯ AvaliaÃ§Ã£o';
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
                        statusHTML = '<span class="diagnostico-status warning">AceitÃ¡vel</span>';
                    } else {
                        statusHTML = '<span class="diagnostico-status error">Muito Curta</span>';
                    }
                    metric = `${lineCount} linhas, ${wordCount} palavras (${charCount} ch)`;
                    
                    const imgMatches = content.match(/!\[.*?\]\((.*?)\)/g);
                    if (imgMatches) {
                        metric += `<br><span style="font-size:0.8rem;color:var(--text-muted)">ðŸ–¼ï¸ ContÃ©m ${imgMatches.length} imagens mapeadas</span>`;
                    }
                } else {
                    const parsed = parseEvaluation(content);
                    if (!parsed) {
                        metric = 'Erro de parsing. Estrutura invÃ¡lida ou Markdown fora dos padrÃµes.';
                        statusHTML = '<span class="diagnostico-status error">Erro</span>';
                    } else {
                        const qCount = parsed.questions.length;
                        const hasRubric = parsed.rubricMarkdown ? 'Sim' : 'NÃ£o';
                        
                        if (qCount === 20) {
                            statusHTML = '<span class="diagnostico-status ok">OK</span>';
                        } else if (qCount >= 15) {
                            statusHTML = '<span class="diagnostico-status warning">Incompleta</span>';
                        } else {
                            statusHTML = '<span class="diagnostico-status error">CrÃ­tico</span>';
                        }
                        metric = `${qCount} questÃµes encontradas. RÃºbrica: ${hasRubric}.`;
                        
                        const totalCorrect = parsed.questions.filter(q => q.alternatives.some(a => a.isCorrect)).length;
                        if (totalCorrect !== qCount) {
                            statusHTML = '<span class="diagnostico-status error">Erro Gabarito</span>';
                            metric += ` <span style="color:#f87171">(${qCount - totalCorrect} questÃµes sem resposta no gabarito!)</span>`;
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
        
        renderMarkdownContent(reportHTML);
        contentViewer.scrollTo(0, 0);
    }

    // Inicializa o Menu Lateral DinÃ¢mico
    renderDynamicSidebar();
    updateProgressBadges();

    // ==========================================
    // SEÃ‡ÃƒO 1: PARSER DE AVALIAÃ‡Ã•ES
    // ==========================================

    /**
     * Parseia o Markdown de uma avaliaÃ§Ã£o extraindo questÃµes, alternativas e gabarito.
     * Suporta os formatos:
     * - FUTEC/FECOP com separadores --- e gabarito formatado (1. **B** (explicaÃ§Ã£o))
     * - IRCOM/FECOP compacto sem separadores e gabarito em linha (1. B 2. A ...)
     */
    function parseEvaluation(markdownText) {
        if (!markdownText) return null;
        if (typeof markdownText === 'object') {
            return markdownText;
        }

        // Extrair tÃ­tulo e tema
        const titleMatch = markdownText.match(/^#\s+(.+)$/m);
        const themeMatch = markdownText.match(/\*\*Tema:\*\*\s*(.+)/);
        const title = titleMatch ? titleMatch[1].replace(/ðŸ“\s*/, '') : 'AvaliaÃ§Ã£o';
        const theme = themeMatch ? themeMatch[1] : '';

        // Extrair a Parte 2 (RÃºbrica) - tudo entre "## Parte 2" e "<details>"
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

            // Formato 1: "1. **B** (explicaÃ§Ã£o)" (FUTEC/FECOP detalhado)
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

        // Extrair questÃµes
        const questions = [];
        // Regex para encontrar cada bloco de questÃ£o
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
    // SEÃ‡ÃƒO 2: MOTOR DE EMBARALHAMENTO
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

    /** Embaralha alternativas de uma questÃ£o, mantendo rastreio da correta */
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
     * - Seleciona `count` questÃµes aleatÃ³rias
     * - Embaralha a ordem das questÃµes
     * - Embaralha as alternativas de cada questÃ£o
     * Retorna { questions: [...], answerKey: { 1: 'C', 2: 'A', ... } }
     */
    function generateExam(allQuestions, count) {
        // Seleciona questÃµes: se count < total, pega aleatÃ³rias; senÃ£o usa todas
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
    // SEÃ‡ÃƒO 3: UI DE CONFIGURAÃ‡ÃƒO DA PROVA
    // ==========================================

    /** Verifica se uma chave Ã© de avaliaÃ§Ã£o */
    function isEvaluation(key) {
        return allEvaluationKeys.includes(key);
    }

    /** Renderiza a interface de configuraÃ§Ã£o da prova */
    function renderEvaluationUI(parsedEval, questionCount, excludedQuestions = new Set()) {
        const availableQuestions = parsedEval.questions.filter(q => !excludedQuestions.has(q.originalNumber));
        const qCount = Math.max(1, Math.min(questionCount || availableQuestions.length, availableQuestions.length));
        const exam = generateExam(availableQuestions, qCount);
        
        currentExamState = {
            ...parsedEval,
            shuffledQuestions: exam.questions,
            answerKey: exam.answerKey,
            questionCount: qCount,
            excludedQuestions: excludedQuestions,
            availableQuestions: availableQuestions
        };

        const html = buildEvaluationHTML(currentExamState);
        renderMarkdownContent(html);
        contentViewer.scrollTo(0, 0);

        // Attach event listeners
        attachEvaluationListeners();
        
        // Renderiza a lista de questÃµes inicial
        updatePreview(false);
    }

    function buildEvaluationHTML(state) {
        return `
            <div class="exam-config-panel">
                <!-- CabeÃ§alho -->
                <div class="exam-header">
                    <div class="exam-header-icon">ðŸŽ¯</div>
                    <div class="exam-header-info">
                        <h1>${state.title}</h1>
                        <p class="exam-theme">${state.theme}</p>
                    </div>
                </div>

                <!-- Painel de Controles Simplificado para Aluno -->
                <div class="exam-controls" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="controls-icon">âš™ï¸</span>
                        <h3>Simulado Online</h3>
                    </div>
                    
                    <!-- BotÃµes de AÃ§Ã£o do Aluno -->
                    <div class="exam-actions" id="student-actions" style="display: flex;">
                        ${isSimulatorSubmitted ? `
                            <button id="btn-simulator-reset" class="btn-simulator-reset">
                                ðŸ”„ Reiniciar Simulado
                            </button>
                        ` : `
                            <button id="btn-simulator-submit" class="btn-simulator-submit">
                                âœ… Finalizar e Corrigir Simulado
                            </button>
                        `}
                    </div>
                </div>

                <!-- Preview das QuestÃµes -->
                <div class="exam-preview">
                    <div class="exam-preview-header">
                        <h3>ðŸ“ Simulador de AvaliaÃ§Ã£o</h3>
                        <span class="exam-preview-badge" id="preview-badge-count">${state.questionCount} questÃµes</span>
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
                        const confirmSubmit = confirm(`VocÃª respondeu apenas ${answeredCount} de ${count} questÃµes. Tem certeza que deseja finalizar?`);
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

                    const studentInfo = JSON.parse(sessionStorage.getItem("student_info") || "{}");

                    // Tentar submissÃ£o online ao servidor local
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
                        if (!res.ok) {
                            return res.json().then(errData => {
                                throw new Error(errData.error || "Erro na submissÃ£o ao servidor.");
                            }).catch(() => {
                                throw new Error("Erro de comunicaÃ§Ã£o com o servidor.");
                            });
                        }
                        return res.json();
                    })
                    .then(data => {
                        isSimulatorSubmitted = true;
                        studentActions.innerHTML = `
                            <button id="btn-simulator-reset" class="btn-simulator-reset">
                                ðŸ”„ Reiniciar Simulado
                            </button>
                        `;
                        currentExamState.serverGrading = {
                            score: data.score,
                            correctCount: data.correctCount,
                            totalCount: data.totalCount,
                            online: true
                        };
                        updatePreview(false);
                        loadStudentSubmissionsDashboard();
                    })
                    .catch(err => {
                        const errMsg = err.message || "";
                        if (errMsg.includes("nÃ£o estÃ¡ ativa")) {
                            alert("âš ï¸ " + errMsg);
                            return; // Cancela a submissÃ£o, nÃ£o faz correÃ§Ã£o offline
                        }
                        
                        console.warn("Sem conexÃ£o com o servidor local. Corrigindo prova localmente offline.", err);
                        isSimulatorSubmitted = true;
                        studentActions.innerHTML = `
                            <button id="btn-simulator-reset" class="btn-simulator-reset">
                                ðŸ”„ Reiniciar Simulado
                            </button>
                        `;
                        // Calcular correÃ§Ã£o offline
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
                            âœ… Finalizar e Corrigir Simulado
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
                <h3>${approved ? 'ðŸŽ‰ ParabÃ©ns! VocÃª foi Aprovado!' : 'âš ï¸ Precisa Estudar Mais!'}</h3>
                <p class="simulator-score-meta">
                    VocÃª acertou <strong>${grading.correctCount}</strong> de <strong>${grading.totalCount}</strong> questÃµes (${grading.score}% de aproveitamento).
                </p>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                    ${grading.online 
                        ? 'ðŸ’š Nota registrada com sucesso no servidor do professor!' 
                        : 'âš ï¸ Servidor offline. Nota calculada localmente (nÃ£o registrada no painel do professor).'}
                </div>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">
                    * A nota mÃ­nima para aprovaÃ§Ã£o Ã© 60%. Veja o gabarito detalhado abaixo para aprender com os erros.
                </div>
            </div>
        `;
    }

    function updatePreview(regenerate = true) {
        if (regenerate) {
            const exam = generateExam(currentExamState.availableQuestions, currentExamState.questionCount);
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
            badgeEl.textContent = `${count} questÃµes`;
        }
    }

    // ==========================================
    // SEÃ‡ÃƒO 4: GERAÃ‡ÃƒO DE PDF
    // ==========================================

    function generateExamPDF(isAnswerKey) {
        if (!currentExamState) return;

        const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        const versionsInput = document.getElementById('exam-versions-count');
        const versionsCount = versionsInput ? Math.max(1, Math.min(5, parseInt(versionsInput.value))) : 1;
        const titleText = isAnswerKey 
            ? `GABARITO â€” ${currentExamState.title}` 
            : currentExamState.title;

        let documentsHTML = '';
        const versionLabels = ['A', 'B', 'C', 'D', 'E'];

        for (let v = 0; v < versionsCount; v++) {
            let examData;
            // Se for apenas uma versÃ£o, usamos a ordem atual visualizada na tela. 
            // Caso contrÃ¡rio, geramos novas versÃµes embaralhadas de forma transparente.
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
            const versionTitleText = versionsCount > 1 ? ` (VERSÃƒO ${versionLabel})` : '';

            // CabeÃ§alho de identificaÃ§Ã£o (apenas para prova de aluno)
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
                            <label>PerÃ­odo:</label>
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

            // CartÃ£o Resposta / Gabarito RÃ¡pido
            let bubbleSheetHTML = '';
            if (isAnswerKey) {
                bubbleSheetHTML = `
                <div class="print-bubble-sheet">
                    <div class="print-bubble-sheet-title">ðŸ”‘ GABARITO DE RESPOSTAS RÃPIDAS - VERSÃƒO ${versionLabel}</div>
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
                    <div class="print-bubble-sheet-title">âœï¸ CARTÃƒO RESPOSTA (VERSÃƒO ${versionLabel}) - PREENCHA COM CANETA AZUL OU PRETA</div>
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

            // Corpo de questÃµes
            let questionsHTML = '';
            if (isAnswerKey) {
                questionsHTML = `
                    <div class="answer-key-detail">
                        <h3>Detalhamento das Respostas</h3>
                        ${examData.questions.slice(0, count).map((q, idx) => `
                            <p><strong>${idx + 1}. ${examData.answerKey[idx + 1]}</strong> â€” ${q.text}</p>
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
                        <div class="logo">LMS<span>4.0</span></div>
                        <div class="meta">
                            <span style="font-size:11pt;font-weight:800;color:#e9c46a;display:block;margin-bottom:2px">
                                ${isAnswerKey ? 'ðŸ”‘ GABARITO DO PROFESSOR' : 'ðŸ“ AVALIAÃ‡ÃƒO'}${versionTitleText}
                            </span>
                            <span style="color:#a8d8ff;font-size:9pt">Instrutor Alan Marciano â€” Gestor em T.I.</span><br>
                            ${dateStr}<br>
                            <strong style="color:#e9c46a">USO RESTRITO â€” MATERIAL DIDÃTICO</strong>
                        </div>
                    </div>
                    
                    ${headerHTML}
                    
                    <div class="pdf-breadcrumb">${currentExamState.title}${currentExamState.theme ? ' â€” ' + currentExamState.theme : ''}</div>
                    
                    ${!isAnswerKey ? `
                    <div class="exam-instructions">
                        <strong>InstruÃ§Ãµes:</strong> Responda Ã s questÃµes e preencha as bolhas correspondentes no CartÃ£o Resposta. Prova com <strong>${count} questÃµes</strong>. Boa prova!
                    </div>
                    ` : ''}
                    
                    <div class="pdf-body" style="padding: 25px 40px 10px;">
                        ${bubbleSheetHTML}
                        ${isAnswerKey ? `<h1>ðŸ”‘ Gabarito Detalhado â€” VersÃ£o ${versionLabel}</h1>` : ''}
                        ${questionsHTML}
                    </div>
                </div>
                
                <div class="pdf-footer" style="padding: 10px 40px 30px; margin-top: auto;">
                    <hr style="border: none; border-top: 2px solid #e0e6f0; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 8.5pt; color: #888;">
                        <span>Escola Modelo â€” Portal Portal LMS Â· ${dateStr}</span>
                        <span style="color:#0f3460;font-weight:700">âœï¸ Instrutor Alan Marciano â€” Gestor em T.I.</span>
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

        /* CartÃ£o Resposta de ImpressÃ£o */
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
    // SEÃ‡ÃƒO 5: CARREGAMENTO DE CONTEÃšDO (ORIGINAL + AVALIAÃ‡Ã•ES)
    // ==========================================

    function renderLockedScreen(title, key, rawMarkdown) {
        renderMarkdownContent(`
            <div class="exam-locked-panel" style="text-align: center; padding: 80px 20px; animation: fadeIn 0.5s ease;">
                <div class="exam-locked-icon" style="font-size: 5rem; margin-bottom: 20px; animation: pulse 2s infinite;">ðŸ”’</div>
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 10px; color: var(--text-main); font-family: 'Inter', sans-serif;">AvaliaÃ§Ã£o Bloqueada</h2>
                <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                    Aguardando o instrutor liberar a prova <strong style="color: var(--primary);">${title}</strong> na rede...
                </p>
                <div class="exam-locked-loader" style="display: inline-block; width: 45px; height: 45px; border: 4px solid rgba(239, 68, 68, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear;"></div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 25px;">
                    Esta tela se atualizarÃ¡ automaticamente assim que o acesso for liberado.
                </p>
            </div>
        `);
        contentViewer.scrollTo(0, 0);
    }

    function getStudentClass() {
        if (currentStudentClassName) {
            return currentStudentClassName;
        }
        try {
            const info = JSON.parse(sessionStorage.getItem("student_info") || "{}");
            if (info.studentClass) {
                if (typeof info.studentClass === 'object' && info.studentClass.name) {
                    return info.studentClass.name;
                }
                return info.studentClass;
            }
            if (info.classes && info.classes.length > 0) {
                const first = info.classes[0];
                return typeof first === 'object' ? first.name : first;
            }
            return "";
        } catch (e) {
            return "";
        }
    }

    function checkExamAccess(key, rawMarkdown) {
        // Desabilita o botÃ£o PDF padrÃ£o
        exportPdfBtn.disabled = true;

        // Limpar polling existente, se houver
        if (examLockPoll) {
            clearInterval(examLockPoll);
            examLockPoll = null;
        }

        let studentInfo = {};
        try {
            studentInfo = JSON.parse(sessionStorage.getItem("student_info") || "{}");
        } catch(e) {}
        
        const studentClass = studentInfo.studentClass || "";
        const email = studentInfo.email || "";

        // Tenta buscar o status da prova ativada no servidor
        fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}&t=${Date.now()}`)
        .then(res => {
            if (!res.ok) throw new Error("Erro de resposta do servidor");
            return res.json();
        })
        .then(data => {
            const releasedItems = data.releasedItems || {};
            const examConfigs = data.examConfigs || {};
            
            const configForThisExam = examConfigs[key] || { questionCount: 20, excludedQuestions: [] };
            const activeCount = configForThisExam.questionCount;
            const excludedQuestions = new Set(configForThisExam.excludedQuestions);

            if (releasedItems[key] === true) {
                // Liberada! Antes de renderizar, checa se o aluno jÃ¡ fez.
                fetch('/api/student/my-submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                })
                .then(r => r.json())
                .then(subData => {
                    if (subData.success && subData.submissions) {
                        const mySub = subData.submissions.find(s => s.examKey === key);
                        if (mySub) {
                            renderExamAlreadyTakenView(mySub);
                            return;
                        }
                    }
                    
                    const parsed = parseEvaluation(rawMarkdown);
                    if (parsed && parsed.questions.length > 0) {
                        renderEvaluationUI(parsed, activeCount, excludedQuestions);
                    } else {
                        fallbackToMarkdown(rawMarkdown);
                    }
                })
                .catch(err => {
                    console.log("Erro ao verificar histÃ³rico:", err);
                    // Falha no histÃ³rico, tenta renderizar normal (pode ser offline local sem notas)
                    const parsed = parseEvaluation(rawMarkdown);
                    if (parsed && parsed.questions.length > 0) {
                        renderEvaluationUI(parsed, activeCount, excludedQuestions);
                    } else {
                        fallbackToMarkdown(rawMarkdown);
                    }
                });
            } else {
                // Trancada! Renderiza tela de bloqueio e inicia o polling
                const parsed = parseEvaluation(rawMarkdown);
                const title = parsed ? parsed.title : "AvaliaÃ§Ã£o";
                renderLockedScreen(title, key, rawMarkdown);

                examLockPoll = setInterval(() => {
                    fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}&t=${Date.now()}`)
                    .then(res => {
                        if (!res.ok) throw new Error("Offline");
                        return res.json();
                    })
                    .then(newData => {
                        const newReleasedItems = newData.releasedItems || {};
                        if (newReleasedItems[key] === true) {
                            clearInterval(examLockPoll);
                            examLockPoll = null;
                            checkExamAccess(key, rawMarkdown); // Recarrega verificando tudo novamente
                        }
                    })
                    .catch(err => console.log("Erro no polling de status:", err));
                }, 5000);
            }
        })
        .catch(err => {
            // Em caso de erro (ex: offline total), libera a prova localmente
            console.warn("Sem conexÃ£o com o servidor local. Liberando prova local offline.", err);
            const parsed = parseEvaluation(rawMarkdown);
            if (parsed && parsed.questions.length > 0) {
                renderEvaluationUI(parsed, 20);
            } else {
                fallbackToMarkdown(rawMarkdown);
            }
        });
    }

    function renderExamHistoryView(submission, rawMarkdown) {
        const parsed = parseEvaluation(rawMarkdown);
        const title = parsed ? parsed.title : "AvaliaÃ§Ã£o";
        const date = new Date(submission.timestamp).toLocaleTimeString('pt-BR') + ' ' + new Date(submission.timestamp).toLocaleDateString('pt-BR');
        
        let html = `
            <div class="exam-header" style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">${title}</h1>
                <p style="font-size: 1.1rem; color: var(--text-muted);">VocÃª jÃ¡ realizou esta avaliaÃ§Ã£o.</p>
            </div>
            
            <div class="score-card" style="margin-bottom: 40px;">
                <div class="score-card-title">Resultado da Prova</div>
                <div class="score-value" style="color: ${submission.score >= 60 ? 'var(--success)' : 'var(--danger)'}">
                    ${submission.score}%
                </div>
                <div style="font-size: 1.2rem; color: var(--text-main); margin-top: 10px; font-weight: 600;">
                    ${submission.correctCount} acertos de ${submission.totalCount} questÃµes
                </div>
                <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 5px;">
                    Prova enviada em: ${date}
                </div>
            </div>
            <hr style="border-top: 1px solid var(--border-color); margin: 30px 0;">
            <h2 style="font-size: 1.8rem; text-align: center; margin-bottom: 30px; font-weight: 700;">Gabarito Detalhado</h2>
            <div id="history-questions-list" style="display: flex; flex-direction: column; gap: 20px;">
        `;

        if (submission.gradedAnswers && parsed) {
            submission.gradedAnswers.forEach((ans, idx) => {
                const originalQ = parsed.questions.find(q => q.originalNumber === ans.questionNumber);
                if (!originalQ) return;
                
                html += `
                    <div class="simulator-question-card" style="opacity: 0.9;">
                        <div class="exam-question-number">${idx + 1}</div>
                        <div class="exam-question-body">
                            <p class="exam-question-text">${originalQ.text}</p>
                            <div class="exam-alternatives">
                `;

                originalQ.alternatives.forEach(alt => {
                    let altClass = 'simulator-alt submitted';
                    const isStudentChoice = ans.studentChoice === alt.letter;
                    const isCorrectChoice = ans.correctAnswer === alt.letter;

                    if (isCorrectChoice) {
                        altClass += ' show-correct';
                    } else if (isStudentChoice) {
                        altClass += ' show-wrong';
                    }

                    html += `
                        <div class="${altClass}">
                            <span class="simulator-alt-letter">${alt.letter}</span>
                            <span class="simulator-alt-text">${alt.text}</span>
                        </div>
                    `;
                });

                html += `
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += '</div>';
        
        renderMarkdownContent(html);
        contentViewer.scrollTo(0, 0);
    }

    function renderExamAlreadyTakenView(submission) {
        stopExamConfigPoll();
        const date = new Date(submission.timestamp).toLocaleTimeString('pt-BR') + ' ' + new Date(submission.timestamp).toLocaleDateString('pt-BR');
        
        let html = `
            <div class="exam-header" style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">âœ… Prova Realizada</h1>
                <p style="font-size: 1.1rem; color: var(--text-muted);">VocÃª jÃ¡ realizou esta avaliaÃ§Ã£o e sua nota foi enviada ao instrutor.</p>
            </div>
            
            <div class="score-card" style="margin-bottom: 40px; text-align: center;">
                <div class="score-card-title">Seu Resultado</div>
                <div class="score-value" style="color: ${submission.score >= 60 ? 'var(--success)' : 'var(--danger)'}">
                    ${submission.score}%
                </div>
                <div style="font-size: 1.2rem; color: var(--text-main); margin-top: 10px; font-weight: 600;">
                    ${submission.correctCount} acertos de ${submission.totalCount} questÃµes
                </div>
                <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 5px;">
                    Prova enviada em: ${date}
                </div>
                <div style="margin-top: 15px; font-family: monospace; color: var(--primary); font-size: 1.1rem;">
                    CÃ³digo de Registro: <strong>${submission.protocolCode || 'NÃ£o registrado'}</strong>
                </div>
                
                <div style="margin-top: 30px;">
                    <button onclick="renderStudentDashboard()" style="background: var(--primary); color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); transition: transform 0.2s;">
                        ðŸ“Š Acessar Meu Painel para ver Gabarito
                    </button>
                </div>
            </div>
        `;
        
        renderMarkdownContent(html);
        contentViewer.scrollTo(0, 0);
    }

    function checkMaterialAccess(key, rawMarkdown, onSuccess) {
        // Limpar polling se houver
        if (examLockPoll) {
            clearInterval(examLockPoll);
            examLockPoll = null;
        }

        const studentClass = getStudentClass();

        fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}&t=${Date.now()}`)
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
                    fetch(`/api/status?studentClass=${encodeURIComponent(studentClass)}&t=${Date.now()}`)
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
            // Fallback offline: libera por padrÃ£o
            console.warn("Sem conexÃ£o com o servidor local. Acessando apostila local offline.", err);
            onSuccess();
        });
    }

    function renderLockedMaterialScreen(key) {
        const titleLabel = key.replace(/_/g, ' ');
        renderMarkdownContent(`
            <div class="exam-locked-panel" style="text-align: center; padding: 80px 20px; animation: fadeIn 0.5s ease;">
                <div class="exam-locked-icon" style="font-size: 5rem; margin-bottom: 20px; animation: pulse 2s infinite;">ðŸ”’</div>
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 10px; color: var(--text-main);">Material Bloqueado</h2>
                <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                    O instrutor ainda nÃ£o liberou o acesso ao material <strong style="color: var(--primary);">${titleLabel}</strong> na rede local.
                </p>
                <div class="exam-locked-loader" style="display: inline-block; width: 45px; height: 45px; border: 4px solid rgba(239, 68, 68, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear;"></div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 25px;">
                    Esta pÃ¡gina abrirÃ¡ automaticamente assim que o instrutor liberar o material.
                </p>
            </div>
        `);
        contentViewer.scrollTo(0, 0);
    }

    function fallbackToMarkdown(rawMarkdown) {
        if (rawMarkdown && typeof marked !== 'undefined') {
            renderMarkdownContent(marked.parse(rawMarkdown));
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
        isSimulatorMode = true; // ForÃ§ar modo simulador para alunos!
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
        
        // Salva no histÃ³rico
        if (currentKey !== null) {
            breadcrumbHistory.push({ key: currentKey, breadcrumb: currentBreadcrumb });
        }
        
        currentKey = key;
        
        const np = document.getElementById('notebook-panel');
        if (np && np.style.right === '0px') {
            if (typeof loadCurrentNote === 'function') loadCurrentNote();
        }
        currentKey = key;
        exportPdfBtn.disabled = false;

        const rawMarkdown = courseData[key];
        
        // Verificar se Ã© avaliaÃ§Ã£o
        if (isEvaluation(key) && rawMarkdown) {
            checkExamAccess(key, rawMarkdown);
        } else if (rawMarkdown && typeof marked !== 'undefined') {
            currentExamState = null;

            const renderApostila = () => {
                renderMarkdownContent(marked.parse(rawMarkdown));
                contentViewer.scrollTo(0, 0);

                // Injetar Caixa de ConfirmaÃ§Ã£o de Leitura se for apostila
                if (key.startsWith("Apostila_")) {
                    // Atribuir IDs de parÃ¡grafo sequenciais para marcaÃ§Ãµes
                    const blocks = contentViewer.querySelectorAll("p, li, blockquote, pre, h2, h3, h4");
                    blocks.forEach((block, index) => {
                        block.setAttribute("data-para-id", `para-${index}`);
                        block.classList.add("annotatable-block");
                    });

                    // Carregar anotaÃ§Ãµes
                    loadParagraphAnnotations(key);

                    // MigraÃ§Ã£o de estado legado para array
                    if (completedUnits[key] === true) {
                        const numTopics = Math.max(1, (rawMarkdown.match(/^## /gm) || []).length);
                        completedUnits[key] = Array.from({length: numTopics}, (_, i) => i + 1);
                        localStorage.setItem("completed_units", JSON.stringify(completedUnits));
                    }
                    if (!completedUnits[key]) {
                        completedUnits[key] = [];
                    }

                    const completedTopics = completedUnits[key];
                    const h2Tags = Array.from(contentViewer.querySelectorAll("h2"));

                    function createTopicBox(topicId, targetEl, position) {
                        const isCompleted = completedTopics.includes(topicId);
                        const confirmationBox = document.createElement("div");
                        confirmationBox.className = `topic-confirmation-box ${isCompleted ? 'completed' : ''}`;
                        confirmationBox.innerHTML = `
                            <button class="btn-toggle-topic" data-topic="${topicId}">
                                <span class="read-icon">${isCompleted ? 'âœ…' : 'â¬œ'}</span>
                                ${isCompleted ? 'TÃ³pico ConcluÃ­do! Desmarcar' : 'Marcar TÃ³pico como Lido'}
                            </button>
                        `;
                        
                        if (position === 'beforeend') {
                            targetEl.appendChild(confirmationBox);
                        } else if (position === 'beforebegin') {
                            targetEl.parentNode.insertBefore(confirmationBox, targetEl);
                        }
                        
                        const btnToggleTopic = confirmationBox.querySelector(".btn-toggle-topic");
                        if (btnToggleTopic) {
                            btnToggleTopic.addEventListener("click", () => {
                                const tId = parseInt(btnToggleTopic.getAttribute('data-topic'));
                                const index = completedUnits[key].indexOf(tId);
                                
                                if (index > -1) {
                                    completedUnits[key].splice(index, 1);
                                    confirmationBox.classList.remove('completed');
                                    btnToggleTopic.innerHTML = `<span class="read-icon">â¬œ</span> Marcar TÃ³pico como Lido`;
                                } else {
                                    completedUnits[key].push(tId);
                                    confirmationBox.classList.add('completed');
                                    btnToggleTopic.innerHTML = `<span class="read-icon">âœ…</span> TÃ³pico ConcluÃ­do! Desmarcar`;
                                }
                                
                                localStorage.setItem("completed_units", JSON.stringify(completedUnits));
                                updateProgressBadges();

                                // Sincronizar com o servidor
                                const studentInfoStr = sessionStorage.getItem("student_info");
                                if (studentInfoStr) {
                                    try {
                                        const info = JSON.parse(studentInfoStr);
                                        fetch('/api/student/progress', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: info.email, completedUnits })
                                        }).catch(()=>{});
                                    } catch(e){}
                                }
                            });
                        }
                    }

                    if (h2Tags.length > 0) {
                        // Se houver h2, insere antes de cada h2 (a partir do segundo)
                        // O primeiro h2 geralmente Ã© o primeiro subtÃ­tulo, entÃ£o o box 1 vai antes do segundo h2.
                        for (let i = 1; i < h2Tags.length; i++) {
                            createTopicBox(i, h2Tags[i], 'beforebegin');
                        }
                        // O Ãºltimo box vai no final do documento
                        createTopicBox(h2Tags.length, contentViewer, 'beforeend');
                    } else {
                        // Se nÃ£o houver h2, apenas um box no final
                        createTopicBox(1, contentViewer, 'beforeend');
                    }

                    // Renderizar anexos/materiais complementares
                    let unitFiles = [];
                    if (courseData && courseData.courseStructure) {
                        courseData.courseStructure.forEach(mod => {
                            mod.units.forEach(u => {
                                if (u.apostilaKey === key) {
                                    unitFiles = u.files || [];
                                }
                            });
                        });
                    }

                    if (unitFiles.length > 0) {
                        const filesHtml = unitFiles.map(f => {
                            const isLink = f.type === 'link';
                            const icon = f.type === 'pdf' ? 'ðŸ“„' : (f.type === 'image' ? 'ðŸ–¼ï¸' : 'ðŸ”—');
                            return `
                                <a href="${f.path}" target="_blank" class="attachment-item-link" style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 12px 16px; border-radius: 10px; text-decoration: none; color: white; transition: all 0.2s;" onmouseenter="this.style.transform='translateY(-2px)'; this.style.borderColor='var(--primary)'" onmouseleave="this.style.transform='none'; this.style.borderColor='var(--border)'">
                                    <span style="font-size: 1.4rem;">${icon}</span>
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-weight: bold; font-size: 0.9rem; text-wrap: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${f.name}</span>
                                        <span style="font-size: 0.7rem; color: var(--text-muted);">${f.type.toUpperCase()}</span>
                                    </div>
                                </a>
                            `;
                        }).join('');

                        const attachmentsContainer = document.createElement("div");
                        attachmentsContainer.className = "attachments-section-container";
                        attachmentsContainer.style.cssText = "margin-top: 40px; padding-top: 25px; border-top: 1px dashed var(--border); text-align: left;";
                        attachmentsContainer.innerHTML = `
                            <h3 style="color: white; font-weight: 800; font-size: 1.25rem; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">ðŸ“Ž Materiais Complementares</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">
                                ${filesHtml}
                            </div>
                        `;
                        contentViewer.appendChild(attachmentsContainer);
                    }

                    // FÃ³rum integrado no fim
                    renderForumSection(key);

                    // Aplicar GlossÃ¡rio Hover e Highlight de busca se houver termo
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
            renderMarkdownContent(`
                <div style="text-align:center; margin-top: 20%;">
                    <h2>Erro: ConteÃºdo nÃ£o encontrado.</h2>
                    <p>O arquivo <strong>${key}</strong> nÃ£o estÃ¡ no banco de dados.</p>
                </div>`);
        }

        // Esconde o menu no celular ao clicar
        if (window.innerWidth <= 900) {
            sidebar.classList.remove("open");
        }
    }
    
    // Formata o breadcrumb com links clicÃ¡veis
    function formatBreadcrumb(text) {
        if (!text || text === "Portal LMS") {
            return `<span class="breadcrumb-home" onclick="window.location.href='index.html'">Portal LMS</span>`;
        }
        
        const parts = text.split(" > ");
        let html = `<span class="breadcrumb-home" onclick="window.location.href='index.html'">Portal LMS</span>`;
        
        parts.forEach((part, index) => {
            if (index > 0) {
                html += ` > <span class="breadcrumb-item">${part}</span>`;
            }
        });
        
        return html;
    }
    
    // FunÃ§Ã£o para voltar ao inÃ­cio
    window.goHome = function() {
        window.location.href = 'index.html';
    };
    
    // Estilo para o breadcrumb clicÃ¡vel
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

        // RealÃ§ar texto na apostila ativa
        if (currentKey && currentKey.startsWith("Apostila_")) {
            highlightText(contentViewer, e.target.value);
        }
    });

    // --- EXPORTAR PDF (para apostilas - funcionalidade original preservada) ---
    exportPdfBtn.addEventListener("click", () => {
        if (!currentKey || !courseData[currentKey]) return;
        
        // Se estiver em avaliaÃ§Ã£o com estado, nÃ£o usar o export padrÃ£o
        if (currentExamState) return;

        const rawMarkdown = courseData[currentKey];
        const htmlContent = marked.parse(rawMarkdown);
        const title = currentBreadcrumb || "Portal LMS - Apostila";
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
        <div class="logo">LMS<span>4.0</span></div>
        <div class="meta">
            <span style="font-size:11pt;font-weight:800;color:#e9c46a;display:block;margin-bottom:3px">Instrutor Alan Marciano</span>
            <span style="color:#a8d8ff;font-size:9pt">Gestor em T.I. â€” Escola Modelo</span><br>
            Documento gerado em ${dateStr}<br>
            <strong style="color:#e9c46a">USO RESTRITO â€” MATERIAL DIDÃTICO</strong>
        </div>
    </div>
    <div class="pdf-breadcrumb">${title}</div>
    <div class="pdf-body">
        ${htmlContent}
        <div class="pdf-footer" style="display:flex;justify-content:space-between;align-items:center">
            <span>Escola Modelo â€” Portal Portal LMS Â· ${dateStr}</span>
            <span style="color:#0f3460;font-weight:700">âœï¸ Instrutor Alan Marciano â€” Gestor em T.I.</span>
        </div>
    </div>
</body>
</html>`);
        printWindow.document.close();
        printWindow.onload = () => {
            // Abre o diÃ¡logo de impressÃ£o/salvar como PDF
            setTimeout(() => printWindow.print(), 400);
        };
    });

    // ==========================================
    // SEÃ‡ÃƒO 6: GESTÃƒO DE SESSÃƒO DO ALUNO & CADÃŠADOS REATIVOS
    // ==========================================

    const studentOverlay = document.getElementById('student-login-overlay');
    const studentProfileCard = document.getElementById('student-profile-card');
    const studentProfileName = document.getElementById('student-profile-name');
    const studentProfileClass = document.getElementById('student-profile-class');
    const studentAvatar = document.getElementById('student-avatar');
    
    // ContÃªineres de abas do modal
    const loginContainer = document.getElementById('student-login-container');
    const registerContainer = document.getElementById('student-register-container');
    const recoveryContainer = document.getElementById('student-recovery-container');

    // BotÃµes
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
                    opt.value = c.courseId + '|' + c.name;
                    opt.textContent = `${c.name} - ${c.courseName}`;
                    // Opcionalmente podemos salvar o courseId num dataset caso necessÃ¡rio depois
                    opt.dataset.courseId = c.courseId;
                    selectEl.appendChild(opt);
                });
            }
        })
        .catch(err => {
            console.warn('Erro ao carregar lista de turmas:', err);
        });
    }

    // TransiÃ§Ãµes de tela do modal
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

    
    
    function showStudentHub(info) {
        // Bypass the old Hub and go straight to LMS 4.0 'Meus Cursos'
        const hubEl = document.getElementById('student-hub');
        if (hubEl) hubEl.style.display = 'none';
        
        document.getElementById('app-container').style.display = 'flex';
        
        // This will render the global dashboard (Meus Cursos)
        if (typeof showMyCoursesView === 'function') {
            showMyCoursesView();
        }
    }

    function checkStudentSession() {
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) {
            if (studentOverlay) studentOverlay.style.display = 'flex';
            if (studentProfileCard) studentProfileCard.style.display = 'none';
            document.getElementById('student-hub').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            
            // Para as atualizaÃ§Ãµes do sidebar se nÃ£o estiver logado
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
                
                if (!currentStudentCourseId) {
                    showStudentHub(info);
                    return; // Retorna e nÃ£o sincroniza os dados do app ainda
                }
                
                if (studentProfileClass && currentStudentClassName) {
                    const activeClassObj = info.classes ? info.classes.find(c => c.name === currentStudentClassName) : null;
                    if (activeClassObj) {
                        studentProfileClass.textContent = `${activeClassObj.name} â€¢ ${activeClassObj.period}`;
                    }
                }
                
                if (studentAvatar && info.name) {
                    const names = info.name.trim().split(" ");
                    const initials = names.length > 1 
                        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
                        : names[0].substring(0, 2).toUpperCase();
                    studentAvatar.textContent = initials;
                    
                    const welcomeGreeting = document.getElementById('welcome-greeting');
                    if (welcomeGreeting) {
                        welcomeGreeting.innerHTML = `OlÃ¡, ${names[0]}! ðŸ‘‹`;
                    }
                }

                // Inicia sincronizaÃ§Ã£o de cadeados da barra lateral
                syncSidebarLocks();
                if (!sidebarLocksPoll) {
                    sidebarLocksPoll = setInterval(syncSidebarLocks, 5000);
                }
                // Sincronizar progresso com o servidor
                fetch(`/api/student/progress?email=${encodeURIComponent(info.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.completedUnits) {
                        completedUnits = data.completedUnits;
                        localStorage.setItem("completed_units", JSON.stringify(completedUnits));
                    }
                    updateProgressBadges();
                })
                .catch(err => {
                    console.error("Erro ao sincronizar progresso:", err);
                    updateProgressBadges();
                });
                
                loadStudentSubmissionsDashboard();
            } catch (e) {
                console.error("Erro ao verificar sessÃ£o do aluno:", e);
                sessionStorage.removeItem("student_info");
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
                sessionStorage.setItem("student_info", JSON.stringify({
                    name: data.student.name,
                    email: data.student.email,
                    classes: data.student.classes,
                    courses: data.student.courses
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
            const classValue = document.getElementById('register-class').value.trim();
            const [courseId, studentClass] = classValue.includes('|') ? classValue.split('|') : [null, classValue];

            if (!name || !email || !password || !studentClass || !courseId) {
                showRegisterError('Por favor, preencha todos os campos do cadastro.');
                return;
            }

            fetch('/api/student/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, studentClass, courseId })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || "Erro ao cadastrar.") });
                }
                return res.json();
            })
            .then(() => {
                // Efetua login automÃ¡tico apÃ³s o cadastro
                fetch('/api/student/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                .then(res => res.json())
                .then(data => {
                    sessionStorage.setItem("student_info", JSON.stringify({
                        name: data.student.name,
                        email: data.student.email,
                        classes: data.student.classes,
                        courses: data.student.courses
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
                    return res.json().then(data => { throw new Error(data.error || "E-mail invÃ¡lido.") });
                }
                return res.json();
            })
            .then(data => {
                showRecoveryMessage('SolicitaÃ§Ã£o enviada com sucesso! PeÃ§a ao instrutor para visualizar ou redefinir sua senha no painel.', false);
            })
            .catch(err => {
                showRecoveryMessage(err.message || 'Erro ao enviar solicitaÃ§Ã£o.', true);
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
    const handleStudentLogout = () => {
        const confirmLogout = confirm("Deseja realmente sair da sua conta de estudante?");
        if (!confirmLogout) return;
        
        const infoStr = sessionStorage.getItem("student_info");
        if (infoStr) {
            try {
                const info = JSON.parse(infoStr);
                fetch('/api/student/leave', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email: info.email })
                }).catch(()=>{});
            } catch(e){}
        }
        
        sessionStorage.removeItem("student_info");
        currentStudentCourseId = null;
        currentStudentClassName = null;
        checkStudentSession();
    };

    if (btnStudentLogout) {
        btnStudentLogout.addEventListener('click', handleStudentLogout);
    }
    
    const btnStudentHubLogout = document.getElementById('btn-student-hub-logout');
    if (btnStudentHubLogout) {
        btnStudentHubLogout.addEventListener('click', handleStudentLogout);
    }
    
    const btnChangeCourse = document.getElementById('btn-change-course');
    if (btnChangeCourse) {
        btnChangeCourse.addEventListener('click', () => {
            currentStudentCourseId = null;
            currentStudentClassName = null;
            checkStudentSession();
        });
    }

    // Beacon na saÃ­da da aba
    window.addEventListener('beforeunload', () => {
        const infoStr = sessionStorage.getItem("student_info");
        if (infoStr) {
            try {
                const info = JSON.parse(infoStr);
                const blob = new Blob([JSON.stringify({ email: info.email })], {type: 'application/json'});
                navigator.sendBeacon('/api/student/leave', blob);
            } catch(e){}
        }
    });

    // Sincronizar Cadeados da Barra Lateral
    function syncSidebarLocks() {
        const studentClass = getStudentClass();
        const studentInfoStr = sessionStorage.getItem("student_info");
        let pingUrl = `/api/status?studentClass=${encodeURIComponent(studentClass)}`;
        if (studentInfoStr) {
            try {
                const info = JSON.parse(studentInfoStr);
                if (info.email) {
                    fetch(`/api/ping?email=${encodeURIComponent(info.email)}`).catch(()=>{});
                }
            } catch(e){}
        }

        fetch(pingUrl)
        .then(res => {
            if (!res.ok) throw new Error("Offline");
            return res.json();
        })
        .then(data => {
            const releasedItems = data.releasedItems || {};
            
            // Check for new releases to notify the student
            if (lastReleasedItemsKeys !== null) {
                const newReleases = [];
                for (const key in releasedItems) {
                    if (releasedItems[key] === true && !lastReleasedItemsKeys.includes(key)) {
                        let friendlyName = key;
                        if (courseData && courseData.courseStructure) {
                            courseData.courseStructure.forEach(mod => {
                                mod.units.forEach(u => {
                                    if (u.apostilaKey === key || u.avaliacaoKey === key) {
                                        friendlyName = `${mod.id} > Unidade ${u.id}: ${u.name}`;
                                    }
                                });
                            });
                        }
                        const typeLabel = key.startsWith("Apostila_") ? "ðŸ“˜ Apostila" : "ðŸŽ¯ AvaliaÃ§Ã£o";
                        newReleases.push(`${typeLabel} â€” ${friendlyName}`);
                    }
                }

                if (newReleases.length > 0) {
                    newReleases.forEach(msg => {
                        showStudentToastNotification("ðŸš€ Novo ConteÃºdo Liberado!", msg);
                    });
                }
            }

            // Update keys tracker
            lastReleasedItemsKeys = Object.keys(releasedItems).filter(k => releasedItems[k] === true);
            
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
                            lockSpan.textContent = "ðŸ”’";
                            item.appendChild(lockSpan);
                        }
                        
                        // KICK OUT IMMEDIATELY IF VIEWING LOCKED ITEM
                        if (typeof currentKey !== 'undefined' && currentKey === key) {
                            if (typeof renderLockedMaterialScreen === 'function') {
                                renderLockedMaterialScreen(key);
                            } else {
                                window.goHome();
                            }
                            // Reset so we don't trigger repeatedly
                            currentKey = null; 
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

    // Inicializa a sessÃ£o ao carregar a pÃ¡gina
    checkStudentSession();
    loadAvailableClasses();

    // === Student Notebook Logic ===
    const btnNotebookToggle = document.getElementById('btn-notebook-toggle');
    const notebookPanel = document.getElementById('notebook-panel');
    const btnCloseNotebook = document.getElementById('btn-close-notebook');
    const notebookTextarea = document.getElementById('notebook-textarea');
    const btnSaveNotebook = document.getElementById('btn-save-notebook');
    const notebookSaveStatus = document.getElementById('notebook-save-status');
    const notebookModuleBadge = document.getElementById('notebook-module-badge');
    
    let noteSaveTimeout = null;

    if (btnNotebookToggle && notebookPanel) {
        btnNotebookToggle.addEventListener('click', () => {
            notebookPanel.style.display = 'flex';
            setTimeout(() => {
                notebookPanel.style.right = '0px';
            }, 10);
            loadCurrentNote();
        });

        btnCloseNotebook.addEventListener('click', () => {
            notebookPanel.style.right = '-400px';
            setTimeout(() => {
                notebookPanel.style.display = 'none';
            }, 300);
        });

        // Auto-save typing
        if (notebookTextarea) {
            notebookTextarea.addEventListener('input', () => {
                clearTimeout(noteSaveTimeout);
                if (notebookSaveStatus) notebookSaveStatus.style.opacity = '0';
                noteSaveTimeout = setTimeout(() => saveCurrentNote(), 1500);
            });
        }

        if (btnSaveNotebook) {
            btnSaveNotebook.addEventListener('click', () => {
                clearTimeout(noteSaveTimeout);
                saveCurrentNote();
            });
        }
    }

    window.loadCurrentNote = function() {
        if (!currentKey) return;
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        
        const info = JSON.parse(studentInfoStr);
        if (notebookModuleBadge) notebookModuleBadge.textContent = currentBreadcrumb.split('â€º').pop().trim();
        if (notebookTextarea) notebookTextarea.value = 'Carregando...';

        fetch(`/api/student/notes/get?email=${encodeURIComponent(info.email)}&moduleKey=${encodeURIComponent(currentKey)}`)
        .then(res => res.json())
        .then(data => {
            if (notebookTextarea) notebookTextarea.value = data.content || '';
        })
        .catch(err => {
            if (notebookTextarea) notebookTextarea.value = '';
            console.error('Erro ao carregar anotaÃ§Ã£o:', err);
        });
    }

    window.saveCurrentNote = function() {
        if (!currentKey) return;
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        
        const info = JSON.parse(studentInfoStr);
        const content = notebookTextarea ? notebookTextarea.value : '';
        
        fetch('/api/student/notes/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: info.email,
                moduleKey: currentKey,
                content: content
            })
        })
        .then(res => {
            if (res.ok) {
                if (notebookSaveStatus) {
                    notebookSaveStatus.textContent = 'Salvo âœ“';
                    notebookSaveStatus.style.opacity = '1';
                    setTimeout(() => {
                        notebookSaveStatus.style.opacity = '0';
                    }, 2000);
                }
            }
        })
        .catch(err => console.error('Erro ao salvar anotaÃ§Ã£o:', err));
    }

    // ==========================================================
    // LMS PREMIUM: ANOTAÃ‡Ã•ES E DESTAQUES POR PARÃGRAFO
    // ==========================================================
    function loadParagraphAnnotations(key) {
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        const info = JSON.parse(studentInfoStr);
        const email = info.email;

        fetch(`/api/student/annotations?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.annotations) {
                    const annotations = data.annotations;
                    for (const paraId in annotations) {
                        const block = contentViewer.querySelector(`[data-para-id="${paraId}"]`);
                        if (block) {
                            applyParagraphAnnotationStyle(block, paraId, annotations[paraId]);
                        }
                    }
                }
            })
            .catch(err => console.error("Erro ao carregar anotaÃ§Ãµes:", err));
    }

    function applyParagraphAnnotationStyle(block, paraId, annotationData) {
        block.classList.add("annotated-paragraph");
        
        const existingInd = block.querySelector(".para-note-indicator");
        if (existingInd) existingInd.remove();

        const indicator = document.createElement("div");
        indicator.className = "para-note-indicator";
        indicator.innerHTML = "ðŸ“";
        indicator.title = "Ver / Editar AnotaÃ§Ã£o";
        indicator.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleParagraphNoteEditor(block, paraId, annotationData.highlightedText, annotationData.note);
        });
        
        block.appendChild(indicator);
    }

    let selectedBlock = null;
    let selectedText = "";

    contentViewer.addEventListener("mouseup", (e) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            hideHighlightPopup();
            return;
        }

        const text = selection.toString().trim();
        if (text.length === 0) {
            hideHighlightPopup();
            return;
        }

        let anchor = selection.anchorNode;
        selectedBlock = null;
        while (anchor && anchor !== contentViewer) {
            if (anchor.nodeType === Node.ELEMENT_NODE && anchor.classList.contains("annotatable-block")) {
                selectedBlock = anchor;
                break;
            }
            anchor = anchor.parentNode;
        }

        if (!selectedBlock) {
            hideHighlightPopup();
            return;
        }

        selectedText = text;
        showHighlightPopup(e.clientX, e.clientY);
    });

    document.addEventListener("mousedown", (e) => {
        const popup = document.getElementById("text-highlight-popup");
        if (popup && !popup.contains(e.target) && e.target.id !== "btn-highlight-action") {
            hideHighlightPopup();
        }
    });

    function showHighlightPopup(x, y) {
        let popup = document.getElementById("text-highlight-popup");
        if (!popup) {
            popup = document.createElement("div");
            popup.id = "text-highlight-popup";
            popup.innerHTML = `<button id="btn-highlight-action">ðŸ’¡ Destacar e Anotar</button>`;
            document.body.appendChild(popup);

            popup.querySelector("button").addEventListener("click", () => {
                if (selectedBlock) {
                    const paraId = selectedBlock.getAttribute("data-para-id");
                    toggleParagraphNoteEditor(selectedBlock, paraId, selectedText, "");
                }
                hideHighlightPopup();
            });
        }

        popup.style.left = `${x}px`;
        popup.style.top = `${y - 45}px`;
        popup.style.display = "flex";
    }

    function hideHighlightPopup() {
        const popup = document.getElementById("text-highlight-popup");
        if (popup) popup.style.display = "none";
    }

    function toggleParagraphNoteEditor(block, paraId, highlightedText, existingNote) {
        const existingEditor = block.querySelector(".paragraph-note-editor");
        if (existingEditor) {
            existingEditor.remove();
            return;
        }

        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        const info = JSON.parse(studentInfoStr);
        const email = info.email;

        const renderEditor = (noteText) => {
            const editor = document.createElement("div");
            editor.className = "paragraph-note-editor";
            editor.innerHTML = `
                <div style="font-size: 0.8rem; color: #fef08a; font-weight: 700; margin-bottom: 2px; text-align: left;">
                    Destaque: <span style="font-style: italic; color: white;">"${highlightedText || 'Todo o parÃ¡grafo'}"</span>
                </div>
                <textarea placeholder="Digite sua anotaÃ§Ã£o ou dÃºvida...">${noteText || ""}</textarea>
                <div class="editor-buttons">
                    <button class="btn-cancel">Cancelar</button>
                    ${noteText ? '<button class="btn-delete">Remover Destaque</button>' : ''}
                    <button class="btn-save">Salvar AnotaÃ§Ã£o</button>
                </div>
            `;

            editor.addEventListener("mousedown", (e) => e.stopPropagation());

            editor.querySelector(".btn-cancel").addEventListener("click", () => editor.remove());
            
            if (noteText) {
                editor.querySelector(".btn-delete").addEventListener("click", () => {
                    saveParagraphAnnotation(currentKey, paraId, null, null, () => {
                        block.classList.remove("annotated-paragraph");
                        const ind = block.querySelector(".para-note-indicator");
                        if (ind) ind.remove();
                        editor.remove();
                    });
                });
            }

            editor.querySelector(".btn-save").addEventListener("click", () => {
                const note = editor.querySelector("textarea").value.trim();
                if (note === "") {
                    alert("A anotaÃ§Ã£o nÃ£o pode estar vazia! Para remover o destaque, clique em Remover Destaque.");
                    return;
                }
                saveParagraphAnnotation(currentKey, paraId, highlightedText || block.innerText, note, () => {
                    applyParagraphAnnotationStyle(block, paraId, { highlightedText: highlightedText || block.innerText, note });
                    editor.remove();
                });
            });

            block.appendChild(editor);
            editor.querySelector("textarea").focus();
        };

        if (existingNote === "Carregando...") {
            fetch(`/api/student/annotations?email=${encodeURIComponent(email)}&key=${encodeURIComponent(currentKey)}`)
                .then(res => res.json())
                .then(data => {
                    const ann = (data.success && data.annotations && data.annotations[paraId]) || {};
                    renderEditor(ann.note || "");
                })
                .catch(() => renderEditor(""));
        } else {
            renderEditor(existingNote || "");
        }
    }

    function saveParagraphAnnotation(key, paragraphId, highlightedText, note, callback) {
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        const info = JSON.parse(studentInfoStr);
        const email = info.email;

        fetch("/api/student/annotation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, key, paragraphId, highlightedText, note })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && callback) callback();
        })
        .catch(err => alert("Erro ao salvar anotaÃ§Ã£o: " + err));
    }

    // ==========================================================
    // LMS PREMIUM: FÃ“RUM / DÃšVIDAS INTEGRADO
    // ==========================================================
    function renderForumSection(key) {
        const existingForum = contentViewer.querySelector(".forum-section");
        if (existingForum) existingForum.remove();

        const forumDiv = document.createElement("div");
        forumDiv.className = "forum-section";
        forumDiv.innerHTML = `
            <div class="forum-header">
                <h3 class="forum-title">ðŸ’¬ FÃ³rum e DÃºvidas da Unidade</h3>
            </div>
            <div class="forum-comments-list" id="forum-comments-container">
                <div style="text-align: center; color: var(--text-muted); padding: 20px;">Carregando dÃºvidas...</div>
            </div>
            <div class="new-comment-form">
                <h4 style="color: white; font-weight: 700; font-size: 0.95rem;">ðŸ’¡ Deixe sua dÃºvida ou comentÃ¡rio sobre este conteÃºdo:</h4>
                <textarea class="new-comment-textarea" id="forum-comment-text" placeholder="Escreva aqui sua pergunta ou comentÃ¡rio..."></textarea>
                <button class="btn-forum-submit" id="btn-forum-submit-comment">Postar DÃºvida</button>
            </div>
        `;

        contentViewer.appendChild(forumDiv);

        const commentsContainer = forumDiv.querySelector("#forum-comments-container");
        const btnSubmit = forumDiv.querySelector("#btn-forum-submit-comment");
        const commentTextarea = forumDiv.querySelector("#forum-comment-text");

        const loadComments = () => {
            fetch(`/api/forum?key=${encodeURIComponent(key)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        renderCommentsList(commentsContainer, data.comments, key);
                    } else {
                        commentsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Erro ao carregar dÃºvidas.</div>`;
                    }
                })
                .catch(() => {
                    commentsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Erro ao carregar dÃºvidas.</div>`;
                });
        };

        loadComments();

        btnSubmit.addEventListener("click", () => {
            const text = commentTextarea.value.trim();
            if (text === "") {
                alert("Por favor, digite o seu comentÃ¡rio.");
                return;
            }

            const studentInfoStr = sessionStorage.getItem("student_info");
            if (!studentInfoStr) return;
            const info = JSON.parse(studentInfoStr);

            fetch("/api/forum/comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key,
                    studentName: info.name,
                    studentEmail: info.email,
                    text
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    commentTextarea.value = "";
                    loadComments();
                } else {
                    alert("Erro ao postar comentÃ¡rio: " + data.error);
                }
            })
            .catch(err => alert("Erro ao conectar: " + err));
        });
    }

    function renderCommentsList(container, comments, key) {
        if (comments.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma dÃºvida postada sobre esta unidade. Seja o primeiro!</div>`;
            return;
        }

        const studentInfoStr = sessionStorage.getItem("student_info");
        const info = studentInfoStr ? JSON.parse(studentInfoStr) : null;
        const currentStudentEmail = info ? info.email.toLowerCase() : "";

        container.innerHTML = "";
        comments.forEach(comment => {
            const card = document.createElement("div");
            card.className = "comment-card";
            card.id = `comment-card-${comment.id}`;

            const initials = comment.studentName.trim().split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
            const dateStr = new Date(comment.timestamp).toLocaleDateString('pt-BR') + ' ' + new Date(comment.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

            const isOwnComment = comment.studentEmail && comment.studentEmail.toLowerCase() === currentStudentEmail;
            let commentActionsHTML = "";
            if (isOwnComment) {
                commentActionsHTML = `
                    <div class="comment-actions" style="margin-left: auto; display: flex; gap: 8px;">
                        <button class="btn-comment-action edit" onclick="editComment('${comment.id}', '${key}')" style="background: none; border: none; color: #a7f3d0; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 3px; font-weight: bold; padding: 2px 6px; border-radius: 4px; transition: background-color 0.2s;">âœï¸ Editar</button>
                        <button class="btn-comment-action delete" onclick="deleteComment('${comment.id}', '${key}')" style="background: none; border: none; color: #fecaca; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 3px; font-weight: bold; padding: 2px 6px; border-radius: 4px; transition: background-color 0.2s;">ðŸ—‘ï¸ Excluir</button>
                    </div>
                `;
            }

            let repliesHTML = "";
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    const isInstructor = reply.authorRole === "Instrutor";
                    const replyInitials = reply.authorName.trim().split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
                    const replyDateStr = new Date(reply.timestamp).toLocaleDateString('pt-BR') + ' ' + new Date(reply.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

                    const isOwnReply = reply.authorEmail && reply.authorEmail.toLowerCase() === currentStudentEmail;
                    let replyActionsHTML = "";
                    if (isOwnReply) {
                        replyActionsHTML = `
                            <div class="reply-actions" style="margin-left: auto; display: flex; gap: 8px;">
                                <button class="btn-reply-action edit" onclick="editReply('${comment.id}', '${reply.id}', '${key}')" style="background: none; border: none; color: #a7f3d0; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; gap: 2px; font-weight: bold; padding: 2px 4px; border-radius: 4px; transition: background-color 0.2s;">âœï¸</button>
                                <button class="btn-reply-action delete" onclick="deleteReply('${comment.id}', '${reply.id}', '${key}')" style="background: none; border: none; color: #fecaca; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; gap: 2px; font-weight: bold; padding: 2px 4px; border-radius: 4px; transition: background-color 0.2s;">ðŸ—‘ï¸</button>
                            </div>
                        `;
                    }

                    repliesHTML += `
                        <div class="reply-card ${isInstructor ? 'instructor-reply' : ''}" id="reply-card-${reply.id}">
                            <div class="reply-card-header" style="text-align: left; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="reply-avatar ${isInstructor ? 'instructor' : ''}">${replyInitials}</div>
                                    <span class="reply-author-name">
                                        ${reply.authorName}
                                        ${isInstructor ? '<span class="reply-badge">Instrutor</span>' : ''}
                                        <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal; margin-left: 5px;">${replyDateStr}</span>
                                    </span>
                                </div>
                                ${replyActionsHTML}
                            </div>
                            <div class="reply-text" style="text-align: left;" data-original-text="${reply.text.replace(/"/g, '&quot;')}">${reply.text}</div>
                        </div>
                    `;
                });
            }

            card.innerHTML = `
                <div class="comment-card-header" style="text-align: left; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="comment-avatar">${initials}</div>
                        <div class="comment-author-info">
                            <span class="comment-author-name">${comment.studentName}</span>
                            <span class="comment-date">${dateStr}</span>
                        </div>
                    </div>
                    ${commentActionsHTML}
                </div>
                <div class="comment-text" style="text-align: left;" data-original-text="${comment.text.replace(/"/g, '&quot;')}">${comment.text}</div>
                <div class="replies-container" id="replies-${comment.id}">
                    ${repliesHTML}
                </div>
                <div class="reply-form">
                    <input type="text" class="reply-input" placeholder="Responder a esta dÃºvida..." id="reply-input-${comment.id}">
                    <button class="btn-reply-send" onclick="sendCommentReply('${comment.id}', '${key}')">Responder</button>
                </div>
            `;

            container.appendChild(card);
        });
    }

    window.sendCommentReply = function(commentId, key) {
        const input = document.getElementById(`reply-input-${commentId}`);
        const text = input.value.trim();
        if (text === "") {
            alert("Digite sua resposta.");
            return;
        }

        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        const info = JSON.parse(studentInfoStr);

        fetch("/api/forum/reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                commentId,
                authorName: info.name,
                authorRole: "Aluno",
                authorEmail: info.email,
                text
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                input.value = "";
                renderForumSection(key);
            } else {
                alert("Erro ao responder: " + data.error);
            }
        })
        .catch(err => alert("Erro ao conectar: " + err));
    };

    window.editComment = function(commentId, key) {
        const card = document.getElementById(`comment-card-${commentId}`);
        if (!card) return;
        const textEl = card.querySelector(".comment-text");
        if (!textEl) return;
        const originalText = textEl.getAttribute("data-original-text") || textEl.innerText;
        
        textEl.style.display = "none";
        
        let editor = card.querySelector(".inline-editor");
        if (editor) editor.remove();
        
        editor = document.createElement("div");
        editor.className = "inline-editor";
        editor.innerHTML = `
            <textarea class="inline-editor-textarea" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: white; padding: 10px; border-radius: 8px; font-family: inherit; margin-top: 5px; resize: none; outline: none; height: 80px;">${originalText}</textarea>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px;">
                <button class="btn-inline-cancel" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Cancelar</button>
                <button class="btn-inline-save" style="background: var(--primary); color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">Salvar</button>
            </div>
        `;
        
        textEl.parentNode.insertBefore(editor, textEl.nextSibling);
        
        editor.querySelector(".btn-inline-cancel").addEventListener("click", () => {
            editor.remove();
            textEl.style.display = "block";
        });
        
        editor.querySelector(".btn-inline-save").addEventListener("click", () => {
            const newText = editor.querySelector(".inline-editor-textarea").value.trim();
            if (newText === "") {
                alert("O comentÃ¡rio nÃ£o pode ser vazio.");
                return;
            }
            
            const studentInfoStr = sessionStorage.getItem("student_info");
            const info = studentInfoStr ? JSON.parse(studentInfoStr) : null;
            if (!info) return;

            fetch("/api/forum/comment/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    commentId,
                    email: info.email,
                    text: newText
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    renderForumSection(key);
                } else {
                    alert("Erro ao editar: " + data.error);
                }
            })
            .catch(err => alert("Erro de conexÃ£o: " + err));
        });
    };

    window.deleteComment = function(commentId, key) {
        if (!confirm("Deseja realmente excluir esta dÃºvida? Todas as respostas a ela tambÃ©m serÃ£o removidas.")) {
            return;
        }
        
        const studentInfoStr = sessionStorage.getItem("student_info");
        const info = studentInfoStr ? JSON.parse(studentInfoStr) : null;
        if (!info) return;

        fetch("/api/forum/comment/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                commentId,
                email: info.email
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderForumSection(key);
            } else {
                alert("Erro ao excluir: " + data.error);
            }
        })
        .catch(err => alert("Erro de conexÃ£o: " + err));
    };

    window.editReply = function(commentId, replyId, key) {
        const replyEl = document.getElementById(`reply-card-${replyId}`);
        if (!replyEl) return;
        const textEl = replyEl.querySelector(".reply-text");
        if (!textEl) return;
        const originalText = textEl.getAttribute("data-original-text") || textEl.innerText;
        
        textEl.style.display = "none";
        
        let editor = replyEl.querySelector(".inline-editor");
        if (editor) editor.remove();
        
        editor = document.createElement("div");
        editor.className = "inline-editor";
        editor.innerHTML = `
            <textarea class="inline-editor-textarea" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: white; padding: 10px; border-radius: 8px; font-family: inherit; margin-top: 5px; resize: none; outline: none; height: 80px;">${originalText}</textarea>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px;">
                <button class="btn-inline-cancel" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Cancelar</button>
                <button class="btn-inline-save" style="background: var(--primary); color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">Salvar</button>
            </div>
        `;
        
        textEl.parentNode.insertBefore(editor, textEl.nextSibling);
        
        editor.querySelector(".btn-inline-cancel").addEventListener("click", () => {
            editor.remove();
            textEl.style.display = "block";
        });
        
        editor.querySelector(".btn-inline-save").addEventListener("click", () => {
            const newText = editor.querySelector(".inline-editor-textarea").value.trim();
            if (newText === "") {
                alert("A resposta nÃ£o pode ser vazia.");
                return;
            }
            
            const studentInfoStr = sessionStorage.getItem("student_info");
            const info = studentInfoStr ? JSON.parse(studentInfoStr) : null;
            if (!info) return;

            fetch("/api/forum/reply/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    commentId,
                    replyId,
                    email: info.email,
                    text: newText
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    renderForumSection(key);
                } else {
                    alert("Erro ao editar: " + data.error);
                }
            })
            .catch(err => alert("Erro de conexÃ£o: " + err));
        });
    };

    window.deleteReply = function(commentId, replyId, key) {
        if (!confirm("Deseja realmente excluir esta resposta?")) {
            return;
        }
        
        const studentInfoStr = sessionStorage.getItem("student_info");
        const info = studentInfoStr ? JSON.parse(studentInfoStr) : null;
        if (!info) return;

        fetch("/api/forum/reply/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                commentId,
                replyId,
                email: info.email
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderForumSection(key);
            } else {
                alert("Erro ao excluir: " + data.error);
            }
        })
        .catch(err => alert("Erro de conexÃ£o: " + err));
    };

});


    // LMS 4.0 - Global Dashboard (Meus Cursos)
    window.loadGlobalDashboard = function() {
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        const student = JSON.parse(studentInfoStr);
        
        // Populate Grid
        const grid = document.getElementById('student-courses-grid');
        if (grid) {
            grid.innerHTML = '';
            
            let rawCourses = student.courses || [];
            let normalizedCourses = [];
            
            rawCourses.forEach(c => {
                normalizedCourses.push({
                    id: typeof c === 'string' ? c : (c.id || c.name),
                    name: typeof c === 'string' ? c : (c.name || c.id)
                });
            });

            if (normalizedCourses.length === 0 && student.classes && student.classes.length > 0) {
                student.classes.forEach(cls => {
                    let className = typeof cls === 'string' ? cls : (cls.name || '');
                    let courseId = typeof cls === 'string' ? null : (cls.courseId || null);
                    
                    if (courseId) {
                        normalizedCourses.push({id: courseId, name: courseId});
                    } else if (className.includes('|')) {
                        const extracted = className.split('|')[0];
                        normalizedCourses.push({id: extracted, name: extracted});
                    } else if (currentStudentCourseId) {
                        normalizedCourses.push({id: currentStudentCourseId, name: currentStudentCourseId});
                    }
                });
            }
            
            let coursesMap = new Map();
            normalizedCourses.forEach(c => {
                if (c.id) coursesMap.set(c.id, c);
            });
            let courses = Array.from(coursesMap.values());
            
            // Get filter values
            const searchInput = document.getElementById('course-search-input');
            const searchVal = searchInput ? searchInput.value.toLowerCase() : '';
            
            // Filter by search
            if (searchVal) {
                courses = courses.filter(c => c.name.toLowerCase().includes(searchVal));
            }
            
            if (courses.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:48px 16px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:22px;">
                        <span style="font-size:60px; display:block; margin-bottom:16px; opacity:0.5;">🎓</span>
                        <h3 style="font-size:20px; font-weight:800; color:var(--text-main); margin-bottom:8px;">Nenhum curso disponível no momento.</h3>
                        <p style="color:var(--text-muted); font-size:14px; max-width:400px; margin:0 auto;">${searchVal ? 'Nenhum curso corresponde aos filtros.' : 'Você ainda não está matriculado em nenhum curso ou sua matrícula está em processamento.'}</p>
                    </div>
                `;
            } else {
                const statCourses = document.getElementById('global-stat-active-courses');
                if(statCourses) statCourses.textContent = courses.length;
                
                const switcherLabel = document.getElementById('course-switcher-label');
                if(switcherLabel) switcherLabel.textContent = courses.length === 1 ? courses[0].name : courses.length + ' cursos ativos';

                courses.forEach(course => {
                    let coverLetter = course.name ? course.name.substring(0,2).toUpperCase() : 'CU';
                    grid.innerHTML += `
                    <div class="course-card" onclick="selectCourseAndEnter('${course.id}')">
                        <div class="course-tag">Em andamento</div>
                        <div class="course-icon">${coverLetter}</div>
                        <h3 class="course-title">${course.name}</h3>
                        <p class="course-next">Clique para acessar o painel do curso.</p>
                        <div class="progress-info">
                            <span>Progresso Geral</span>
                            <span>0%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%;"></div>
                        </div>
                        <button class="primary-btn">Continuar curso →</button>
                    </div>
                `;
                });
            }
        }
        
        // Ensure event listeners for search are attached once
        const searchInputEl = document.getElementById('course-search-input');
        if (searchInputEl && !searchInputEl.dataset.listenerAttached) {
            searchInputEl.addEventListener('input', () => {
                window.loadGlobalDashboard();
            });
            searchInputEl.dataset.listenerAttached = 'true';
        }
        const filterStatusEl = document.getElementById('filter-status');
        if (filterStatusEl && !filterStatusEl.dataset.listenerAttached) {
            filterStatusEl.addEventListener('change', () => {
                window.loadGlobalDashboard();
            });
            filterStatusEl.dataset.listenerAttached = 'true';
        }
        const filterTurnoEl = document.getElementById('filter-turno');
        if (filterTurnoEl && !filterTurnoEl.dataset.listenerAttached) {
            filterTurnoEl.addEventListener('change', () => {
                window.loadGlobalDashboard();
            });
            filterTurnoEl.dataset.listenerAttached = 'true';
        }
        const filterOrderEl = document.getElementById('filter-order');
        if (filterOrderEl && !filterOrderEl.dataset.listenerAttached) {
            filterOrderEl.addEventListener('change', () => {
                window.loadGlobalDashboard();
            });
            filterOrderEl.dataset.listenerAttached = 'true';
        }

        // Fetch Real Dashboard Stats
        fetch(`/api/student/dashboard?email=${encodeURIComponent(student.email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Mocks updated visually
                }
            })
            .catch(err => console.error(err));
    };

    window.selectCourseAndEnter = function(courseId) {
        currentStudentCourseId = courseId;
        fetchDataAndRender(); // Loads data.js and updates modules
        showCoursePanelView();
    };

    // LMS 4.0 - Course Dashboard (Painel do Curso)
    window.loadCourseDashboard = function() {
        const studentInfoStr = sessionStorage.getItem("student_info");
        if (!studentInfoStr) return;
        const student = JSON.parse(studentInfoStr);

        // Update title
        const titleEl = document.getElementById('course-panel-title');
        if(titleEl) titleEl.textContent = currentStudentCourseId || 'Painel do Curso';

        // Update course-switcher
        const switcherLabel = document.getElementById('course-switcher-label');
        if(switcherLabel && currentStudentCourseId) switcherLabel.textContent = currentStudentCourseId;

        // Update sidebar course name
        const sidebarName = document.getElementById('sidebar-active-course-name');
        if(sidebarName && currentStudentCourseId) sidebarName.textContent = currentStudentCourseId;

        fetch(`/api/student/dashboard?email=${encodeURIComponent(student.email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Update Exams List
                    const examsList = document.getElementById('course-exams-list');
                    if (examsList) {
                        examsList.innerHTML = '';
                        let courseExams = data.exams || [];
                        
                        // Sort by date desc
                        courseExams.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                        
                        if (courseExams.length === 0) {
                            examsList.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:14px; font-style:italic; padding:16px;">Nenhuma avaliação encontrada.</div>';
                        } else {
                            courseExams.forEach(exam => {
                                const dateStr = new Date(exam.timestamp).toLocaleString();
                                examsList.innerHTML += `
                                    <div class="assessment-item">
                                        <div>
                                            <strong>${exam.examKey}</strong>
                                            <span style="color:var(--text-muted); font-size:12px;">${dateStr}</span>
                                        </div>
                                        <div class="status">${exam.score}</div>
                                    </div>
                                `;
                            });
                        }
                    }

                    // Update Attendance
                    const att = data.attendance || [];
                    let presentCount = 0;
                    let absentCount = 0;
                    let totalCount = att.length;
                    
                    att.forEach(a => {
                        if (a.status === 'presente' || a.status === 'atraso' || a.status === 'justificado') {
                            presentCount++;
                        } else if (a.status === 'falta') {
                            absentCount++;
                        }
                    });

                    let attPerc = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;
                    
                    const elAbsences = document.getElementById('course-stat-absences');
                    const elPresent = document.getElementById('stat-att-present');
                    const elAbsent = document.getElementById('stat-att-absent');
                    const elTotal = document.getElementById('stat-att-total');
                    const elDonutText = document.getElementById('attendance-donut-text');
                    const elDonutCircle = document.getElementById('attendance-donut-circle');

                    if(elAbsences) elAbsences.textContent = absentCount;
                    if(elPresent) elPresent.textContent = presentCount;
                    if(elAbsent) elAbsent.textContent = absentCount;
                    if(elTotal) elTotal.textContent = totalCount;
                    if(elDonutText) elDonutText.textContent = attPerc + '%';
                    
                    if(elDonutCircle) {
                        // Update CSS conic-gradient for donut
                        let colorVar = 'var(--green)';
                        if(attPerc < 50) colorVar = 'var(--red)';
                        else if(attPerc < 75) colorVar = '#f59e0b';
                        
                        elDonutCircle.style.background = `conic-gradient(${colorVar} ${attPerc}%, rgba(148, 163, 184, 0.15) ${attPerc}% 100%)`;
                    }

                    // Update KPI values
                    const kpiProgress = document.getElementById('kpi-progress');
                    const kpiAttendance = document.getElementById('kpi-attendance');
                    if(kpiAttendance) kpiAttendance.textContent = attPerc + '%';
                    
                    // Update Path (MÃ³dulos reais do Data.js atual)
                    const pathList = document.getElementById('course-modules-path');
                    if(pathList && typeof getActiveStructure !== 'undefined') {
                        pathList.innerHTML = '';
                        const struct = getActiveStructure();
                        let totalUnits = 0;
                        let completedUnitsCount = 0;
                        
                        struct.forEach((mod, idx) => {
                            let modTotal = mod.units.length;
                            let modCompleted = 0;
                            
                            mod.units.forEach(u => {
                                totalUnits++;
                                if(completedUnits[u.file]) {
                                    completedUnitsCount++;
                                    modCompleted++;
                                }
                            });
                            
                            let modPerc = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;
                            
                            pathList.innerHTML += `
                                <div class="module-item">
                                    <div class="module-number">${idx + 1}</div>
                                    <div>
                                        <div class="module-title">${mod.module}</div>
                                        <div class="module-desc">${mod.units.length} aulas • ${modPerc}% concluído</div>
                                    </div>
                                    <div class="mini-progress">
                                        <div class="progress-fill" style="width: ${modPerc}%;"></div>
                                    </div>
                                    <span style="color:var(--text-muted); font-size:18px;">➔</span>
                                </div>
                            `;
                        });
                        
                        // Progresso Geral
                        let globPerc = totalUnits > 0 ? Math.round((completedUnitsCount / totalUnits) * 100) : 0;
                        const progText = document.getElementById('course-panel-progress-text');
                        const progBar = document.getElementById('course-panel-progress-bar');
                        if(progText) progText.textContent = globPerc + '%';
                        if(progBar) progBar.style.width = globPerc + '%';
                        
                        // Update KPI progress
                        if(kpiProgress) kpiProgress.textContent = globPerc + '%';
                        
                        // Populate Continue de onde parou
                        const continueModuleEl = document.getElementById('continue-lesson-module');
                        const continueTitleEl = document.getElementById('continue-lesson-title');
                        const continueBtn = document.querySelector('.continue-card .primary-btn');
                        
                        if (totalUnits > 0 && globPerc < 100) {
                            // Encontrar primeira aula não concluída
                            let nextUnit = null;
                            let nextModName = '';
                            struct.forEach(mod => {
                                if(nextUnit) return;
                                mod.units.forEach(u => {
                                    if(!nextUnit && !completedUnits[u.file]) {
                                        nextUnit = u;
                                        nextModName = mod.module;
                                    }
                                });
                            });
                            if (nextUnit) {
                                if(continueModuleEl) continueModuleEl.textContent = 'Próxima Aula • ' + nextModName;
                                if(continueTitleEl) continueTitleEl.textContent = nextUnit.name || 'Aula ' + nextUnit.file;
                                if(continueBtn) {
                                    continueBtn.textContent = 'Continuar aula →';
                                    continueBtn.onclick = () => { loadContent(nextUnit.file); };
                                }
                            }
                        } else if (globPerc === 100) {
                            if(continueModuleEl) continueModuleEl.textContent = 'Curso Concluído';
                            if(continueTitleEl) continueTitleEl.textContent = 'Você finalizou todas as aulas deste curso!';
                            if(continueBtn) {
                                continueBtn.textContent = 'Ver Certificado';
                                continueBtn.onclick = () => { showToast('Gerando certificado...'); };
                            }
                        }

                        // Populate Próximas Aulas (Mock)
                        const scheduleList = document.getElementById('course-schedule-list');
                        if (scheduleList) {
                            scheduleList.innerHTML = `
                                <div class="schedule-item">
                                    <div class="schedule-date"><strong>Hoje</strong><span>19:00</span></div>
                                    <div class="schedule-info">
                                        <h4>Mentoria ao Vivo</h4>
                                        <p>Plantão de dúvidas com o professor</p>
                                    </div>
                                    <button class="icon-btn" title="Acessar sala">🎥</button>
                                </div>
                                <div class="schedule-item">
                                    <div class="schedule-date" style="background:var(--bg-main); color:var(--text-soft);"><strong>Amanhã</strong><span>20:00</span></div>
                                    <div class="schedule-info">
                                        <h4 style="color:var(--text-soft);">Liberação de Módulo</h4>
                                        <p>O próximo módulo será disponibilizado</p>
                                    </div>
                                    <button class="icon-btn" title="Ver detalhes">ℹ️</button>
                                </div>
                            `;
                        }

                        // Populate Avisos do professor (Mock)
                        const noticesList = document.getElementById('course-notices-list');
                        if (noticesList) {
                            noticesList.innerHTML = `
                                <div class="notice-item" style="padding:16px; background:rgba(239,68,68,0.1); border-left:3px solid var(--primary); border-radius:12px; margin-bottom:12px;">
                                    <h4 style="font-size:14px; color:var(--text-main); margin-bottom:4px;">Aviso sobre a Prova Final</h4>
                                    <p style="font-size:13px; color:var(--text-soft); line-height:1.4;">A prova final do módulo 1 foi reagendada para a próxima sexta-feira. Não esqueçam de revisar o material!</p>
                                    <span style="display:block; font-size:11px; color:var(--text-muted); margin-top:8px;">Prof. Marcos • Há 2 horas</span>
                                </div>
                            `;
                        }

                        // Populate Atividade Recente (Mock)
                        const activityList = document.getElementById('course-activity-list');
                        if (activityList) {
                            activityList.innerHTML = `
                                <div class="activity-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
                                    <div style="display:flex; flex-direction:column; gap:4px;">
                                        <strong style="font-size:13px; color:var(--text-main);">Você assistiu uma aula</strong>
                                        <span style="font-size:12px; color:var(--text-muted);">Módulo 1 • Ontem</span>
                                    </div>
                                </div>
                                <div class="activity-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
                                    <div style="display:flex; flex-direction:column; gap:4px;">
                                        <strong style="font-size:13px; color:var(--text-main);">Material complementar baixado</strong>
                                        <span style="font-size:12px; color:var(--text-muted);">PDF de introdução • Há 2 dias</span>
                                    </div>
                                </div>
                            `;
                        }
                    }
                }
            })
            .catch(err => console.error(err));
    };

    // ================================================
    // UTILITY: Toast Notification
    // ================================================
    window.showToast = function(message) {
        const existing = document.querySelector('.lms-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'lms-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    };
