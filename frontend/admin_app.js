
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                        display: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        primary: 'var(--primary-color, #ef4444)',
                        slateDark: '#0b0f19',
                        slatePanel: '#111827',
                    }
                }
            }
        }
    

        // Fetch branding early
        fetch('/api/branding')
            .then(res => res.json())
            .then(branding => {
                if (branding.primaryColor) {
                    document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
                }
                if (branding.institutionName) {
                    document.title = 'Painel do Instrutor — ' + branding.institutionName;
                    // Will update titles in DOM on load later
                }
            }).catch(e => console.warn('Branding fetch failed', e));
    

        if (window.location.protocol === 'file:') {
            document.getElementById('protocol-warning-overlay').style.display = 'block';
            document.body.style.paddingTop = '45px';
        }
    

        // Mapeamento das 15 avaliações
        const allExams = [];
        const modules = {
            'FUTEC': 'Fundamentos de TI',
            'FECOP': 'Colaboração e Produtividade',
            'IRCOM': 'Instalação de Recursos'
        };
        for(let m in modules) {
            for(let i=1; i<=5; i++) {
                allExams.push({
                    key: `Avaliacao_${m}_${i}`,
                    name: `Unidade ${i} - ${m}`,
                    module: modules[m]
                });
            }
        }

        let adminPassword = '';
        let activeExamKey = null;
        let pollInterval = null;
        let allStudentsCache = [];
        let allClassesCache = [];
        let allCoursesCache = [];
        let allAdminsCache = [];
        let selectedFilterClass = '';
        let currentModalExamKey = null;
        let currentModalExamState = null;
        let examHistoryCache = []; // Histórico de provas geradas para a avaliação atual
        let filterUnusedOnly = false; // Toggle para filtrar apenas questões inéditas
        let activeReleaseModule = 'FUTEC';

        // === UI/UX IMPROVEMENT SCRIPTS ===

        // #1 Dropdown toggle for Advanced menu
        const advToggle = document.getElementById('btn-advanced-toggle');
        const advMenu = document.getElementById('advanced-dropdown-menu');
        if (advToggle && advMenu) {
            advToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                advMenu.classList.toggle('show');
            });
            document.addEventListener('click', () => {
                advMenu.classList.remove('show');
            });
            advMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // #5 Confirmation Modal Helper
        function showConfirmModal(title, message, confirmText, confirmColor, onConfirm) {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal-card">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-modal-actions">
                        <button class="btn-cancel" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border);">Cancelar</button>
                        <button class="btn-confirm" style="background: ${confirmColor}; color: white; box-shadow: 0 4px 12px ${confirmColor}33;">${confirmText}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            const btnCancel = overlay.querySelector('.btn-cancel');
            const btnConfirm = overlay.querySelector('.btn-confirm');
            
            btnCancel.addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
            
            // Delay confirm button for safety
            btnConfirm.disabled = true;
            btnConfirm.style.opacity = '0.5';
            btnConfirm.style.cursor = 'not-allowed';
            let countdown = 2;
            btnConfirm.textContent = `${confirmText} (${countdown}s)`;
            const timer = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(timer);
                    btnConfirm.disabled = false;
                    btnConfirm.style.opacity = '1';
                    btnConfirm.style.cursor = 'pointer';
                    btnConfirm.textContent = confirmText;
                } else {
                    btnConfirm.textContent = `${confirmText} (${countdown}s)`;
                }
            }, 1000);
            
            btnConfirm.addEventListener('click', () => {
                if (!btnConfirm.disabled) {
                    onConfirm();
                    overlay.remove();
                }
            });
        }

        // #4 Student Search & Course Filter
        function filterStudents() {
            const searchStudentsInput = document.getElementById('search-students-input');
            const filterStudentsCourse = document.getElementById('filter-students-course');
            const query = searchStudentsInput ? searchStudentsInput.value.toLowerCase().trim() : '';
            const courseFilter = filterStudentsCourse ? filterStudentsCourse.value : '';
            
            const rows = document.querySelectorAll('#students-body tr');
            let visibleCount = 0;
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const studentClass = row.getAttribute('data-student-class');
                const classObj = allClassesCache.find(c => c.name === studentClass);
                const courseId = classObj ? classObj.courseId : '';
                
                const matchesSearch = query === '' || text.includes(query);
                const matchesCourse = courseFilter === '' || courseId === courseFilter;
                
                if (matchesSearch && matchesCourse) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            const counter = document.getElementById('students-counter');
            if (counter) {
                const total = rows.length;
                counter.textContent = (query || courseFilter) ? `${visibleCount} de ${total} alunos` : `${total} alunos`;
            }
        }

        const searchStudentsInput = document.getElementById('search-students-input');
        if (searchStudentsInput) {
            searchStudentsInput.addEventListener('input', filterStudents);
        }
        
        const filterStudentsCourse = document.getElementById('filter-students-course');
        if (filterStudentsCourse) {
            filterStudentsCourse.addEventListener('change', filterStudents);
        }

        // #14 Update Release Progress in Header
        function updateReleaseProgress() {
            const toggles = document.querySelectorAll('.material-toggle');
            if (toggles.length === 0) return;
            const checked = Array.from(toggles).filter(t => t.checked).length;
            const pct = Math.round((checked / toggles.length) * 100);
            const fill = document.getElementById('header-release-progress-fill');
            const text = document.getElementById('header-release-progress-text');
            if (fill) fill.style.width = pct + '%';
            if (text) text.textContent = pct + '%';
        }

        // Login Handler
        document.getElementById('btn-login').addEventListener('click', attemptLogin);
        document.getElementById('admin-pass').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });

        // Configurar seletores de abas do módulo
        document.querySelectorAll('.module-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeReleaseModule = btn.getAttribute('data-module');
                renderMaterialsList();
                refreshDashboard();
            });
        });

        function attemptLogin() {
            const email = document.getElementById('admin-email').value.trim();
            const pass = document.getElementById('admin-pass').value.trim();
            const errorDiv = document.getElementById('login-error');
            errorDiv.style.display = 'none';

            if (!email || !pass) {
                errorDiv.textContent = 'Por favor, preencha todos os campos.';
                errorDiv.style.display = 'block';
                return;
            }

            const token = `${email}:${pass}`;

            fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            })
            .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
            .then(({ status, ok, data }) => {
                if (ok && data.success) {
                    adminPassword = token;
                    window.adminRole = data.role || 'admin';
                    window.adminClasses = data.classes || [];
                    
                    sessionStorage.setItem('admin_pass', token);
                    sessionStorage.setItem('admin_role', window.adminRole);
                    sessionStorage.setItem('admin_classes', JSON.stringify(window.adminClasses));
                    
                    showHub();
                } else {
                    errorDiv.textContent = data.error || 'E-mail ou senha incorretos.';
                    errorDiv.style.display = 'block';
                }
            })
            .catch(err => {
                alert('Erro ao conectar ao servidor local. Verifique se ele está rodando.');
            });
        }

        // Recupera sessão se recarregou
        const savedPass = sessionStorage.getItem('admin_pass');
        const savedRole = sessionStorage.getItem('admin_role');
        const savedClasses = sessionStorage.getItem('admin_classes');

        if (savedPass) {
            adminPassword = savedPass;
            window.adminRole = savedRole || 'admin';
            try {
                window.adminClasses = savedClasses ? JSON.parse(savedClasses) : [];
            } catch(e) { window.adminClasses = []; }

            fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': savedPass
                }
            })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (ok && data.success) {
                    window.adminRole = data.role || 'admin';
                    window.adminClasses = data.classes || [];
                    sessionStorage.setItem('admin_role', window.adminRole);
                    sessionStorage.setItem('admin_classes', JSON.stringify(window.adminClasses));
                    showHub();
                } else {
                    sessionStorage.removeItem('admin_pass');
                    sessionStorage.removeItem('admin_role');
                    sessionStorage.removeItem('admin_classes');
                    adminPassword = '';
                }
            })
            .catch(() => {
                sessionStorage.removeItem('admin_pass');
                adminPassword = '';
            });
        }

        let currentAdminCourseId = null;

        function showHub() {
            document.getElementById('login-overlay').style.display = 'none';
            const courses = (typeof courseData !== 'undefined' && courseData.courses) ? courseData.courses : [];
            const preferredCourseId = currentAdminCourseId || sessionStorage.getItem('admin_course_id') || (courses[0] && courses[0].id);

            if (preferredCourseId) {
                showDashboardForCourse(preferredCourseId);
            } else {
                document.getElementById('admin-app').style.display = 'block';
                activateAdminTab('tab-courses');
                showAdminNotice('Nenhum curso encontrado', 'Crie o primeiro curso em Cursos para iniciar a administracao do LMS.');
            }
        }

        document.getElementById('btn-change-workspace')?.addEventListener('click', () => {
            openCourseSwitcher();
        });

        function showDashboardForCourse(courseId) {
            currentAdminCourseId = courseId;
            sessionStorage.setItem('admin_course_id', courseId);
            document.getElementById('admin-app').style.display = 'block';
            
            // ROLE BASED UI RESTRICTIONS
            const restrictedTabs = ['tab-courses', 'tab-materials', 'tab-classes', 'tab-admins', 'tab-editor'];
            document.querySelectorAll('.tab-btn').forEach(btn => {
                const tabId = btn.getAttribute('data-tab');
                if (window.adminRole === 'professor' && restrictedTabs.includes(tabId)) {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = '';
                }
            });

            if (window.adminRole === 'professor') {
                const activeBtn = document.querySelector('.tab-btn.active');
                if (activeBtn && restrictedTabs.includes(activeBtn.getAttribute('data-tab'))) {
                    const dashboardBtn = document.querySelector('.tab-btn[data-tab="tab-dashboard"]');
                    if (dashboardBtn) dashboardBtn.click();
                }
            }
            
            // Optionally, we could reload data.js with courseId here to restrict what Admin sees,
            // but since it's Admin, having all data is fine.
            
            // Render the release controls specifically for this course
            // We need to initialize activeReleaseModule based on the course structure
            const course = courseData.courses.find(c => c.id === currentAdminCourseId);
            const sectionLabel = document.getElementById('admin-current-section-label');
            if (sectionLabel && course) {
                sectionLabel.textContent = course.name;
            }
            if (course && course.structure && course.structure.length > 0) {
                activeReleaseModule = course.structure[0].id;
                renderModuleTabs(course.structure);
            }
            
            renderMaterialsList();
            refreshDashboard();
            pollInterval = setInterval(refreshDashboard, 3000);

            if (typeof loadBrandingAndCourses === 'function') {
                loadBrandingAndCourses();
            }

            document.getElementById('admin-active-class')?.addEventListener('change', () => {
                refreshDashboard();
            });
        }



        function renderModuleTabs(structure) {
            const container = document.getElementById('module-selector-tabs');
            if (!container) return;
            container.innerHTML = '';
            
            structure.forEach((mod, idx) => {
                const btn = document.createElement('button');
                const isFirst = idx === 0;
                btn.className = `module-tab-btn px-4 py-2 text-xs font-extrabold rounded-lg transition-all focus:outline-none ${isFirst ? 'active-module bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-white'}`;
                btn.setAttribute('data-module', mod.id);
                btn.textContent = mod.id;
                
                btn.addEventListener('click', () => {
                    activeReleaseModule = mod.id;
                    renderMaterialsList();
                    refreshDashboard();
                });
                
                container.appendChild(btn);
            });
        }

        // Renderiza switches de controle de liberação (Aba Controle de Liberação)
        function renderMaterialsList() {
            const m = activeReleaseModule;
            const container = document.getElementById('active-module-materials-list');
            if (!container || !currentAdminCourseId) return;
            
            const course = courseData.courses.find(c => c.id === currentAdminCourseId);
            const modData = course && course.structure ? course.structure.find(mod => mod.id === m) : null;
            if (!modData) return;

            // Atualizar o título e o badge do módulo selecionado no header
            const titleDisplay = document.getElementById('current-module-title-display');
            const badgeDisplay = document.getElementById('current-module-badge-display');
            
            if (titleDisplay) {
                titleDisplay.textContent = `${modData.id} — ${modData.name}`;
            }
            if (badgeDisplay) {
                badgeDisplay.textContent = modData.id;
                badgeDisplay.className = `text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30`;
            }
            
            // #3 Atualizar classes dos botões seletores de abas com cores persistentes
            document.querySelectorAll('.module-tab-btn').forEach(btn => {
                const mod = btn.getAttribute('data-module');
                if (mod === m) {
                    btn.classList.add('active-module');
                    btn.className = 'module-tab-btn active-module px-4 py-2 text-xs font-extrabold rounded-lg transition-all focus:outline-none bg-red-600 text-white shadow-lg shadow-red-500/20';
                } else {
                    btn.classList.remove('active-module');
                    btn.className = 'module-tab-btn px-4 py-2 text-xs font-extrabold rounded-lg transition-all focus:outline-none text-slate-400 hover:text-white';
                }
            });

            container.innerHTML = '';

            modData.units.forEach((unit, idx) => {
                const apKey = unit.apostilaKey;
                const avKey = unit.avaliacaoKey;
                const unitName = unit.name;
                
                const unitCard = document.createElement('div');
                unitCard.className = 'unit-release-card bg-black/20 border border-white/10 p-3.5 rounded-2xl flex flex-col gap-2';
                unitCard.setAttribute('data-module-color', 'red');
                unitCard.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-extrabold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-white/5">Unidade ${unit.id}</span>
                    </div>
                    <div class="text-xs font-bold text-slate-200 truncate pr-1" title="${unitName}">
                        ${unitName}
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-1">
                        <!-- Apostila Capsule -->
                        <div class="bg-slate-900/40 border border-white/5 p-2 rounded-xl flex items-center justify-between gap-1 hover:bg-slate-900/60 transition-colors toggle-tooltip" data-tooltip="Apostila da Unidade ${unit.id} — Clique para liberar/bloquear">
                            <span class="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">📘 Apostila</span>
                            <label class="switch scale-90 origin-right">
                                <input type="checkbox" class="material-toggle" data-key="${apKey}" id="toggle-mat-${apKey}">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <!-- Avaliação Capsule -->
                        <div class="bg-slate-900/40 border border-white/5 p-2 rounded-xl flex items-center justify-between gap-1 hover:bg-slate-900/60 transition-colors toggle-tooltip" data-tooltip="Prova da Unidade ${unit.id} — Clique para liberar/bloquear">
                            <span class="text-[10px] text-primary font-extrabold tracking-wider uppercase">🎯 Prova</span>
                            <div class="flex items-center gap-1.5">
                                <button class="btn-preview-exam bg-white/5 hover:bg-white/15 border border-white/10 text-white p-1 rounded-lg text-[10px] font-bold hover:border-white/20 transition-colors" data-key="${avKey}" title="Configurar / Imprimir Prova">
                                    🖨️
                                </button>
                                <label class="switch scale-90 origin-right">
                                    <input type="checkbox" class="material-toggle" data-key="${avKey}" id="toggle-mat-${avKey}">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(unitCard);
            });
            
            document.querySelectorAll('.material-toggle').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const itemKey = e.target.getAttribute('data-key');
                    const released = e.target.checked;
                    const activeClassSel = document.getElementById('admin-active-class');
                    const currentActiveClass = activeClassSel ? activeClassSel.value : '';
                    if (!currentActiveClass) {
                        alert('Selecione uma turma ativa primeiro!');
                        e.target.checked = !released;
                        return;
                    }
                    
                    fetch('/api/admin/release-item', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': adminPassword
                        },
                        body: JSON.stringify({ studentClass: currentActiveClass, itemKey, released })
                    })
                    .then(res => res.json())
                    .then(data => {
                        console.log(`Status do item ${itemKey} atualizado:`, released);
                        updateReleaseProgress(); // #14
                    })
                    .catch(err => console.error('Erro ao atualizar liberação do item:', err));
                });
            });

            document.querySelectorAll('.btn-preview-exam').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = btn.getAttribute('data-key');
                    openExamPreviewModal(key);
                });
            });
        }

        // #5 Configuar botões de ação em lote com modal de confirmação
        document.getElementById('btn-release-all-module').addEventListener('click', () => {
            showConfirmModal(
                '🔓 Liberar Módulo Completo',
                `Tem certeza que deseja <strong>liberar</strong> todas as Apostilas e Provas do módulo <strong>${activeReleaseModule}</strong> para a turma ativa? Os alunos terão acesso imediato.`,
                'Liberar Tudo',
                '#22c55e',
                () => releaseAllItemsInModule(true)
            );
        });

        document.getElementById('btn-block-all-module').addEventListener('click', () => {
            showConfirmModal(
                '🔒 Bloquear Módulo Completo',
                `Tem certeza que deseja <strong>bloquear</strong> todas as Apostilas e Provas do módulo <strong>${activeReleaseModule}</strong>? Os alunos perderão acesso imediatamente.`,
                'Bloquear Tudo',
                '#ef4444',
                () => releaseAllItemsInModule(false)
            );
        });

        async function releaseAllItemsInModule(released) {
            const activeClassSel = document.getElementById('admin-active-class');
            const currentActiveClass = activeClassSel ? activeClassSel.value : '';
            if (!currentActiveClass) {
                alert('Selecione uma turma ativa primeiro!');
                return;
            }

            const m = activeReleaseModule;
            const keys = [];
            
            if (currentAdminCourseId && courseData.courses) {
                const course = courseData.courses.find(c => c.id === currentAdminCourseId);
                if (course && course.structure) {
                    const modData = course.structure.find(mod => mod.id === m);
                    if (modData && modData.units) {
                        modData.units.forEach(u => {
                            if (u.apostilaKey) keys.push(u.apostilaKey);
                            if (u.avaliacaoKey) keys.push(u.avaliacaoKey);
                        });
                    }
                }
            }

            document.body.style.cursor = 'wait';

            try {
                for (const itemKey of keys) {
                    await fetch('/api/admin/release-item', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': adminPassword
                        },
                        body: JSON.stringify({ studentClass: currentActiveClass, itemKey, released })
                    });
                }
                console.log(`Todos os itens de ${m} foram ${released ? 'liberados' : 'bloqueados'}.`);
            } catch (err) {
                console.error("Erro ao alterar liberações em lote:", err);
                alert("Erro ao aplicar alteração em lote.");
            } finally {
                document.body.style.cursor = 'default';
                refreshDashboard();
            }
        }
        function updateStudentsTable(students) {
            const tbody = document.getElementById('students-body');
            if (!tbody) return;
            
            if (students.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-slate-400 p-8">
                            Nenhum aluno cadastrado no momento.
                        </td>
                    </tr>
                `;
                return;
            }
            
            students.sort((a, b) => a.name.localeCompare(b.name));
            
            let html = '';
            students.forEach(student => {
                const lastAccess = student.loginTime 
                    ? new Date(student.loginTime).toLocaleTimeString('pt-BR') + ' ' + new Date(student.loginTime).toLocaleDateString('pt-BR')
                    : 'Nunca';
                
                let recoveryHTML = '';
                if (student.recoveryRequested) {
                    recoveryHTML = `
                        <div class="flex flex-col gap-1.5 items-start">
                            <span class="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">⚠️ AJUDA SOLICITADA</span>
                            <button onclick="resetStudentPassword('${student.email}')" class="bg-green-600 hover:bg-green-500 text-white border-none rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-green-500/20">Redefinir Senha</button>
                        </div>
                    `;
                } else {
                    recoveryHTML = `
                        <button onclick="resetStudentPassword('${student.email}')" class="bg-white/5 hover:bg-white/10 border border-slate-600 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors">Redefinir</button>
                    `;
                }
                
                html += `
                    <tr data-student-email="${student.email}" data-student-class="${student.studentClass}" class="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td class="p-3 align-middle">
                            <strong class="text-white group-hover:text-primary transition-colors">${student.name}</strong><br>
                            <span class="text-xs text-slate-400">${student.email}</span>
                        </td>
                        <td class="p-3 align-middle">
                            <div class="flex items-center gap-2">
                                <span class="pwd-placeholder font-mono text-sm tracking-widest text-slate-400">••••••••</span>
                                <span class="pwd-real font-mono text-xs hidden text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">${student.password}</span>
                                <button onclick="togglePasswordVisibility(this)" class="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer text-sm outline-none transition-colors" title="Mostrar/Ocultar Senha">👁️</button>
                            </div>
                        </td>
                        <td class="p-3 align-middle text-sm text-slate-300">${student.studentClass} • ${student.period}</td>
                        <td class="p-3 align-middle text-xs text-slate-400">${lastAccess}</td>
                        <td class="p-3 align-middle">${recoveryHTML}</td>
                        <td class="p-3 align-middle whitespace-nowrap">
                            <button onclick="openEditStudentModal('${student.email}')" class="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors mr-1">✏️ Editar</button>
                            <button onclick="deleteStudentAccount('${student.email}')" class="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors">Excluir</button>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        }

        window.togglePasswordVisibility = function(btn) {
            const container = btn.parentElement;
            const placeholder = container.querySelector('.pwd-placeholder');
            const real = container.querySelector('.pwd-real');
            
            if (placeholder.style.display !== 'none') {
                placeholder.style.display = 'none';
                real.style.display = 'inline';
                btn.textContent = '🙈';
            } else {
                placeholder.style.display = 'inline';
                real.style.display = 'none';
                btn.textContent = '👁️';
            }
        };

        window.resetStudentPassword = function(email) {
            const newPassword = prompt(`Digite a nova senha para o aluno ${email}:`);
            if (newPassword === null) return;
            
            const trimmed = newPassword.trim();
            if (trimmed === '') {
                alert('A senha não pode estar vazia!');
                return;
            }
            
            fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ email, newPassword: trimmed })
            })
            .then(res => {
                if (!res.ok) throw new Error("Erro ao redefinir senha.");
                return res.json();
            })
            .then(data => {
                alert('Senha redefinida com sucesso!');
                refreshDashboard();
            })
            .catch(err => alert(err.message));
        };

        window.openEditStudentModal = function(email) {
            console.log('openEditStudentModal called for:', email);
            const student = allStudentsCache.find(s => s.email && s.email.trim().toLowerCase() === email.trim().toLowerCase());
            if (!student) {
                console.error('Student not found for:', email);
                return;
            }
            
            document.getElementById('edit-student-original-email').value = student.email;
            document.getElementById('edit-student-name').value = student.name;
            document.getElementById('edit-student-email').value = student.email;
            document.getElementById('edit-student-password').value = student.password || '';
            document.getElementById('edit-student-period').value = student.period || 'Tarde';
            
            // Marcar checkboxes correspondentes às turmas do aluno
            const container = document.getElementById('edit-student-classes-container');
            if (container) {
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = student.classes && student.classes.includes(cb.value);
                });
            }
            
            document.getElementById('student-edit-error').style.display = 'none';
            document.getElementById('edit-student-modal').style.display = 'flex';
        };

        window.deleteStudentAccount = function(email) {
            const confirmDel = confirm(`Você tem certeza que deseja EXCLUIR a conta do aluno ${email}?`);
            if (!confirmDel) return;
            
            fetch('/api/admin/delete-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ email })
            })
            .then(res => {
                if (!res.ok) throw new Error("Erro ao excluir aluno.");
                return res.json();
            })
            .then(data => {
                alert('Estudante removido com sucesso!');
                refreshDashboard();
            })
            .catch(err => alert(err.message));
        };
        // Listener para Cadastro Manual de Estudantes
        document.getElementById('btn-create-student').addEventListener('click', () => {
            const name = document.getElementById('create-student-name').value.trim();
            const email = document.getElementById('create-student-email').value.trim();
            const studentPassword = document.getElementById('create-student-password').value.trim();
            
            const createContainer = document.getElementById('create-student-classes-container');
            const selectedClasses = [];
            if (createContainer) {
                createContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedClasses.push(cb.value);
                });
            }
            const studentClass = selectedClasses[0] || '';
            
            const errDiv = document.getElementById('student-create-error');
            const succDiv = document.getElementById('student-create-success');
            
            errDiv.style.display = 'none';
            succDiv.style.display = 'none';
            
            if (!name || !email || !studentPassword || selectedClasses.length === 0) {
                errDiv.textContent = 'Por favor, preencha todos os campos do cadastro e selecione ao menos uma turma.';
                errDiv.style.display = 'block';
                return;
            }
            
            fetch('/api/admin/student/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ name, email, studentPassword, studentClass, classes: selectedClasses })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || 'Erro ao criar conta de estudante.') });
                }
                return res.json();
            })
            .then(data => {
                succDiv.textContent = 'Conta de estudante criada com sucesso!';
                succDiv.style.display = 'block';
                
                document.getElementById('create-student-name').value = '';
                document.getElementById('create-student-email').value = '';
                document.getElementById('create-student-password').value = '';
                createContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    cb.checked = false;
                });
                
                refreshDashboard();
                
                setTimeout(() => {
                    succDiv.style.display = 'none';
                }, 3500);
            })
            .catch(err => {
                errDiv.textContent = err.message;
                errDiv.style.display = 'block';
            });
        });

        // Transição e navegação por abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                btn.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(tc => {
                    tc.style.display = 'none';
                });
                
                const activeTabId = btn.getAttribute('data-tab');
                const activeTab = document.getElementById(activeTabId);
                if (activeTabId === 'tab-dashboard') {
                    activeTab.style.display = 'grid';
                } else if (activeTabId === 'tab-students') {
                    activeTab.style.display = 'grid';
                } else if (activeTabId === 'tab-classes') {
                    activeTab.style.display = 'grid';
                } else if (activeTabId === 'tab-admins') {
                    activeTab.style.display = 'grid';
                } else if (activeTabId === 'tab-forum') {
                    activeTab.style.display = 'grid';
                } else {
                    activeTab.style.display = 'flex';
                }
                
                if (activeTabId === 'tab-forum') {
                    loadAdminForum();
                }
                
                refreshDashboard();
            });
        });

        function activateAdminTab(tabId) {
            const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (targetBtn) {
                targetBtn.click();
            }
        }

        function showAdminNotice(title, message) {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal-card">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-modal-actions">
                        <button class="btn-confirm" style="background: var(--primary); color: white;">Entendi</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('button').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        }

        function normalizeImportHeader(value) {
            return String(value || '')
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9-]/g, '');
        }

        function parseImportCsv(text) {
            const rows = [];
            let row = [];
            let field = '';
            let quoted = false;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const next = text[i + 1];

                if (char === '"' && quoted && next === '"') {
                    field += '"';
                    i++;
                } else if (char === '"') {
                    quoted = !quoted;
                } else if (char === ',' && !quoted) {
                    row.push(field.trim());
                    field = '';
                } else if ((char === '\n' || char === '\r') && !quoted) {
                    if (char === '\r' && next === '\n') i++;
                    row.push(field.trim());
                    if (row.some(Boolean)) rows.push(row);
                    row = [];
                    field = '';
                } else {
                    field += char;
                }
            }

            row.push(field.trim());
            if (row.some(Boolean)) rows.push(row);
            if (rows.length < 2) return [];

            const headers = rows.shift().map(normalizeImportHeader);
            return rows.map(cols => {
                const item = {};
                headers.forEach((header, index) => {
                    if (header) item[header] = cols[index] || '';
                });
                return item;
            }).filter(item => Object.values(item).some(Boolean));
        }

        function parseImportRows(text, fileName = '') {
            const trimmed = text.trim();
            if (!trimmed) return [];

            if (fileName.toLowerCase().endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
                if (Array.isArray(parsed.rows)) return parsed.rows;
                if (Array.isArray(parsed.alunos)) return parsed.alunos;
                return [];
            }

            return parseImportCsv(trimmed);
        }

        function openImportModal() {
            const legacyCourses = (typeof courseData !== 'undefined' && courseData.courses) ? courseData.courses : [];
            const courses = allCoursesCache.length ? allCoursesCache : legacyCourses;

            if (!courses.length) {
                activateAdminTab('tab-courses');
                showAdminNotice('Cadastre um curso primeiro', 'A importacao precisa de um curso para vincular turmas e alunos.');
                return;
            }

            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal-card" style="max-width: 820px; text-align: left;">
                    <h3>Importar alunos e turmas</h3>
                    <p>Use CSV ou JSON com colunas: nome, email, senha, turma, curso, periodo. Se a turma nao existir, ela sera criada no curso selecionado.</p>
                    <div class="flex flex-col gap-3 mt-4">
                        <label class="text-xs font-bold uppercase text-slate-400">Curso padrao</label>
                        <select id="import-default-course" class="admin-pro-input">
                            ${courses.map(course => `<option value="${course.id}" ${course.id === currentAdminCourseId ? 'selected' : ''}>${course.name}</option>`).join('')}
                        </select>
                        <label class="text-xs font-bold uppercase text-slate-400">Arquivo CSV/JSON</label>
                        <input id="import-file-input" type="file" accept=".csv,.json,text/csv,application/json" class="admin-pro-input" />
                        <label class="text-xs font-bold uppercase text-slate-400">Ou cole os dados</label>
                        <textarea id="import-textarea" class="admin-pro-input" style="min-height: 180px; resize: vertical;" placeholder="nome,email,senha,turma,curso,periodo&#10;Maria Silva,maria@email.com,123456,TURMA A,${courses[0].id},Tarde"></textarea>
                        <div id="import-feedback" class="text-xs text-slate-400">Nenhum dado carregado ainda.</div>
                    </div>
                    <div class="confirm-modal-actions" style="margin-top: 18px;">
                        <button class="btn-cancel" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border);">Cancelar</button>
                        <button class="btn-confirm" style="background: var(--primary); color: white;">Importar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            const fileInput = overlay.querySelector('#import-file-input');
            const textarea = overlay.querySelector('#import-textarea');
            const feedback = overlay.querySelector('#import-feedback');
            const importBtn = overlay.querySelector('.btn-confirm');

            overlay.querySelector('.btn-cancel').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

            fileInput.addEventListener('change', () => {
                const file = fileInput.files && fileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    textarea.value = reader.result || '';
                    try {
                        const rows = parseImportRows(textarea.value, file.name);
                        feedback.textContent = `${rows.length} linha(s) pronta(s) para importar.`;
                    } catch (error) {
                        feedback.textContent = 'Nao foi possivel ler o arquivo. Verifique o formato.';
                    }
                };
                reader.readAsText(file, 'utf-8');
            });

            textarea.addEventListener('input', () => {
                try {
                    const rows = parseImportRows(textarea.value, fileInput.files?.[0]?.name || '');
                    feedback.textContent = `${rows.length} linha(s) detectada(s).`;
                } catch (error) {
                    feedback.textContent = 'Formato ainda invalido.';
                }
            });

            importBtn.addEventListener('click', () => {
                let rows = [];
                try {
                    rows = parseImportRows(textarea.value, fileInput.files?.[0]?.name || '');
                } catch (error) {
                    feedback.textContent = 'Formato invalido. Use CSV com cabecalho ou JSON em lista.';
                    return;
                }

                if (!rows.length) {
                    feedback.textContent = 'Inclua pelo menos uma linha valida para importar.';
                    return;
                }

                importBtn.disabled = true;
                importBtn.textContent = 'Importando...';

                fetch('/api/admin/import', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': adminPassword
                    },
                    body: JSON.stringify({
                        rows,
                        defaultCourseId: overlay.querySelector('#import-default-course').value
                    })
                })
                .then(res => res.json().then(data => ({ ok: res.ok, data })))
                .then(({ ok, data }) => {
                    if (!ok) throw new Error(data.error || 'Erro ao importar dados.');
                    const summary = data.summary || {};
                    overlay.remove();
                    loadBrandingAndCourses();
                    refreshDashboard();
                    showAdminNotice(
                        'Importacao concluida',
                        `${summary.createdStudents || 0} aluno(s) criado(s), ${summary.updatedStudents || 0} atualizado(s), ${summary.createdClasses || 0} turma(s) criada(s), ${summary.skipped || 0} linha(s) ignorada(s).`
                    );
                })
                .catch(error => {
                    importBtn.disabled = false;
                    importBtn.textContent = 'Importar';
                    feedback.textContent = error.message;
                });
            });
        }

        function openCourseSwitcher() {
            const legacyCourses = (typeof courseData !== 'undefined' && courseData.courses) ? courseData.courses : [];
            const courses = allCoursesCache.length ? allCoursesCache : legacyCourses;
            if (!courses.length) {
                activateAdminTab('tab-courses');
                showAdminNotice('Nenhum curso cadastrado', 'Crie um curso antes de trocar o contexto de administracao.');
                return;
            }

            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal-card" style="max-width: 760px; text-align: left;">
                    <h3>Trocar curso administrado</h3>
                    <p>Escolha qual curso deve alimentar controles de liberacao, turmas e editor de conteudo.</p>
                    <div class="admin-pro-course-switch-list">
                        ${courses.map(course => `
                            <button type="button" data-course-id="${course.id}" class="${course.id === currentAdminCourseId ? 'active' : ''}">
                                <strong>${course.name}</strong>
                                <span>${course.description || 'Sem descricao.'}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="confirm-modal-actions" style="margin-top: 18px;">
                        <button class="btn-cancel" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border);">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('.btn-cancel').addEventListener('click', () => overlay.remove());
            overlay.querySelectorAll('[data-course-id]').forEach(btn => {
                btn.addEventListener('click', () => {
                    clearInterval(pollInterval);
                    showDashboardForCourse(btn.getAttribute('data-course-id'));
                    overlay.remove();
                });
            });
        }

        function runAdminAction(action) {
            const focusLater = (id) => setTimeout(() => document.getElementById(id)?.focus(), 120);
            switch (action) {
                case 'novo-cadastro':
                case 'novo-aluno':
                case 'ver-alunos':
                    activateAdminTab('tab-students');
                    focusLater('create-student-name');
                    break;
                case 'novo-professor':
                case 'professores':
                    activateAdminTab('tab-admins');
                    document.getElementById('create-admin-role').value = 'professor';
                    document.getElementById('create-admin-classes-container').style.display = 'flex';
                    focusLater('create-admin-name');
                    break;
                case 'criar-turma':
                case 'ver-turmas':
                    activateAdminTab('tab-classes');
                    focusLater('create-class-name');
                    break;
                case 'novo-curso':
                    activateAdminTab('tab-courses');
                    document.getElementById('btn-show-create-course')?.click();
                    focusLater('course-id');
                    break;
                case 'presencas':
                    activateAdminTab('tab-attendance');
                    break;
                case 'avaliacoes':
                    activateAdminTab('tab-editor');
                    setTimeout(() => document.querySelector('[data-subtab="subtab-evaluations"]')?.click(), 120);
                    break;
                case 'aulas':
                case 'disciplinas':
                    activateAdminTab('tab-editor');
                    setTimeout(() => document.querySelector('[data-subtab="subtab-course-structure"]')?.click(), 120);
                    break;
                case 'enviar-aviso':
                case 'avisos':
                    activateAdminTab('tab-forum');
                    showAdminNotice('Avisos e duvidas', 'Use esta area para responder alunos. A publicacao ativa de avisos para turmas ainda sera conectada como modulo dedicado.');
                    break;
                case 'relatorios':
                case 'relatorio-geral':
                    document.getElementById('btn-export-csv')?.click();
                    break;
                case 'importar':
                    openImportModal();
                    break;
                case 'calendario':
                    showAdminNotice('Calendario academico', 'O diario de classe ja registra aulas por data. A visao calendario sera a proxima camada sobre esses registros.');
                    activateAdminTab('tab-attendance');
                    break;
                case 'biblioteca':
                    activateAdminTab('tab-editor');
                    setTimeout(() => document.querySelector('[data-subtab="subtab-apostilas"]')?.click(), 120);
                    break;
                default:
                    break;
            }
        }

        document.querySelectorAll('[data-admin-action]').forEach(el => {
            el.addEventListener('click', (event) => {
                const action = el.getAttribute('data-admin-action');
                if (!action) return;
                if (!el.classList.contains('tab-btn')) {
                    event.preventDefault();
                }
                setTimeout(() => runAdminAction(action), 0);
            });
        });

        const adminGlobalSearch = document.getElementById('admin-global-search');
        if (adminGlobalSearch) {
            adminGlobalSearch.addEventListener('input', () => {
                document.getElementById('dashboard-student-search').value = adminGlobalSearch.value;
                updateIndexAdminDashboard();
            });
        }

        ['dashboard-student-search', 'dashboard-class-filter', 'dashboard-status-filter', 'dashboard-student-sort'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', updateIndexAdminDashboard);
            document.getElementById(id)?.addEventListener('change', updateIndexAdminDashboard);
        });

        function getStudentPrimaryClass(student) {
            if (Array.isArray(student.classes) && student.classes.length) {
                const firstClass = student.classes[0];
                return typeof firstClass === 'string' ? firstClass : firstClass.name;
            }
            return student.studentClass || '';
        }

        function getCourseName(courseId) {
            const legacyCourses = (typeof courseData !== 'undefined' && courseData.courses) ? courseData.courses : [];
            const course = allCoursesCache.find(c => c.id === courseId) || legacyCourses.find(c => c.id === courseId);
            return course ? course.name : (courseId || 'Curso nao vinculado');
        }

        function getStudentAverage(email) {
            const submissions = (typeof allSubmissionsCache !== 'undefined' ? allSubmissionsCache : []).filter(sub => {
                return sub.student && sub.student.email && sub.student.email.toLowerCase() === email.toLowerCase();
            });
            if (!submissions.length) return '--';
            const total = submissions.reduce((sum, sub) => sum + (Number(sub.score) || 0), 0);
            return Math.round(total / submissions.length) + '%';
        }

        function updateIndexAdminDashboard() {
            const students = allStudentsCache || [];
            const classes = currentAdminCourseId ? allClassesCache.filter(c => c.courseId === currentAdminCourseId) : allClassesCache;
            const legacyCourses = (typeof courseData !== 'undefined' && courseData.courses) ? courseData.courses : [];
            const courses = allCoursesCache.length ? allCoursesCache : legacyCourses;
            const admins = allAdminsCache || [];
            const submissions = typeof allSubmissionsCache !== 'undefined' ? allSubmissionsCache : [];
            const teachers = admins.filter(a => a.role === 'professor');
            const recoveryRequests = students.filter(s => s.recoveryRequested).length;
            const failedSubmissions = submissions.filter(s => Number(s.score) < 60).length;

            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setText('admin-total-students', students.length);
            setText('admin-total-teachers', teachers.length);
            setText('admin-total-classes', classes.length);
            setText('admin-total-courses', courses.length);
            setText('admin-alerts-count', recoveryRequests + failedSubmissions);
            setText('nav-students-count', students.length);
            setText('nav-teachers-count', teachers.length);
            setText('nav-classes-count', classes.length);
            setText('nav-courses-count', courses.length);
            setText('admin-active-classes-help', `${classes.filter(c => c.registrationEnabled).length} com cadastro liberado`);

            const dashboardClassFilter = document.getElementById('dashboard-class-filter');
            if (dashboardClassFilter) {
                const selected = dashboardClassFilter.value;
                dashboardClassFilter.innerHTML = '<option value="">Turma: Todas</option>' + classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
                dashboardClassFilter.value = selected;
            }

            const query = (document.getElementById('dashboard-student-search')?.value || '').toLowerCase().trim();
            const classFilter = document.getElementById('dashboard-class-filter')?.value || '';
            const statusFilter = document.getElementById('dashboard-status-filter')?.value || '';
            const sortMode = document.getElementById('dashboard-student-sort')?.value || 'name';

            let visibleStudents = [...students];
            if (currentAdminCourseId) {
                const classNames = new Set(classes.map(c => c.name));
                visibleStudents = visibleStudents.filter(s => classNames.has(getStudentPrimaryClass(s)));
            }
            if (query) {
                visibleStudents = visibleStudents.filter(s => `${s.name || ''} ${s.email || ''} ${getStudentPrimaryClass(s)}`.toLowerCase().includes(query));
            }
            if (classFilter) {
                visibleStudents = visibleStudents.filter(s => getStudentPrimaryClass(s) === classFilter);
            }
            if (statusFilter === 'online') {
                visibleStudents = visibleStudents.filter(s => s.isOnline);
            }
            if (statusFilter === 'recovery') {
                visibleStudents = visibleStudents.filter(s => s.recoveryRequested);
            }
            visibleStudents.sort((a, b) => {
                if (sortMode === 'class') return getStudentPrimaryClass(a).localeCompare(getStudentPrimaryClass(b));
                return (a.name || '').localeCompare(b.name || '');
            });

            const studentRows = visibleStudents.slice(0, 8).map(student => {
                const studentClass = getStudentPrimaryClass(student);
                const cls = allClassesCache.find(c => c.name === studentClass);
                const statusClass = student.recoveryRequested ? 'orange' : (student.isOnline ? '' : 'red');
                const statusText = student.recoveryRequested ? 'Recuperacao' : (student.isOnline ? 'Online' : 'Offline');
                return `
                    <tr>
                        <td><strong>${student.name || 'Aluno sem nome'}</strong><br><span>${student.email || ''}</span></td>
                        <td>${studentClass || '--'}${cls && cls.period ? ` - ${cls.period}` : ''}</td>
                        <td>--</td>
                        <td>${student.email ? getStudentAverage(student.email) : '--'}</td>
                        <td><span class="admin-pro-status ${statusClass}">${statusText}</span></td>
                        <td>
                            <div class="admin-pro-row-actions">
                                <button type="button" title="Ver aluno" onclick="openEditStudentModal('${student.email}')">👁</button>
                                <button type="button" title="Editar aluno" onclick="openEditStudentModal('${student.email}')">✏</button>
                                <button type="button" title="Submissoes" data-admin-action="relatorios">📊</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            document.getElementById('dashboard-students-body').innerHTML = studentRows || '<tr><td colspan="6">Nenhum aluno encontrado com os filtros atuais.</td></tr>';

            const classRows = classes.slice(0, 6).map(cls => {
                const count = students.filter(s => getStudentPrimaryClass(s) === cls.name).length;
                return `
                    <tr>
                        <td><strong>${cls.name}</strong></td>
                        <td>${getCourseName(cls.courseId)}</td>
                        <td>${cls.period || '--'}</td>
                        <td>${count}</td>
                        <td>${cls.registrationEnabled ? 'Liberado' : 'Bloqueado'}</td>
                        <td><span class="admin-pro-status ${cls.registrationEnabled ? '' : 'orange'}">${cls.registrationEnabled ? 'Ativa' : 'Restrita'}</span></td>
                    </tr>
                `;
            }).join('');
            document.getElementById('dashboard-classes-body').innerHTML = classRows || '<tr><td colspan="6">Nenhuma turma neste curso.</td></tr>';

            const attendanceList = document.getElementById('dashboard-class-attendance-list');
            if (attendanceList) {
                attendanceList.innerHTML = (classes.length ? classes.slice(0, 5).map(cls => {
                    const count = students.filter(s => getStudentPrimaryClass(s) === cls.name).length;
                    const pct = count > 0 ? 100 : 0;
                    return `
                        <div class="admin-pro-progress-row">
                            <div>
                                <div class="admin-pro-progress-label"><span>${cls.name}</span><strong>${pct ? 'Ativa' : 'Sem alunos'}</strong></div>
                                <div class="admin-pro-progress-track"><div class="admin-pro-progress-fill" style="width:${pct}%"></div></div>
                            </div>
                            <strong>${count}</strong>
                        </div>
                    `;
                }).join('') : '<div class="admin-pro-list-item"><div class="admin-pro-list-icon">🏫</div><div><strong>Nenhuma turma</strong><span>Crie turmas para acompanhar frequencia.</span></div></div>');
            }

            const alerts = [];
            if (recoveryRequests) alerts.push(['🔐', `${recoveryRequests} solicitacao(oes) de senha`, 'Alunos aguardando reset pelo admin.']);
            if (failedSubmissions) alerts.push(['📝', `${failedSubmissions} prova(s) abaixo de 60%`, 'Acompanhe resultados e recuperacao.']);
            if (!classes.length) alerts.push(['🏫', 'Nenhuma turma no curso atual', 'Crie ou vincule uma turma ao curso.']);
            if (!courses.length) alerts.push(['🎓', 'Nenhum curso cadastrado', 'Crie um curso para iniciar o LMS.']);
            if (!alerts.length) alerts.push(['✅', 'Sem alertas criticos', 'Sistema pronto para a aula.']);
            document.getElementById('dashboard-alerts-list').innerHTML = alerts.map(([icon, title, text]) => `
                <div class="admin-pro-list-item"><div class="admin-pro-list-icon">${icon}</div><div><strong>${title}</strong><span>${text}</span></div></div>
            `).join('');

            const activities = [
                ...students.slice(-2).reverse().map(s => ['👨‍🎓', 'Aluno cadastrado', `${s.name} - ${getStudentPrimaryClass(s) || 'Sem turma'}`]),
                ...submissions.slice(0, 2).map(s => ['📝', 'Prova entregue', `${s.student?.name || 'Aluno'} - ${s.examKey}`]),
                ...classes.slice(-1).map(c => ['🏫', 'Turma disponivel', `${c.name} - ${getCourseName(c.courseId)}`])
            ].slice(0, 5);
            document.getElementById('dashboard-activity-list').innerHTML = (activities.length ? activities : [['🕘', 'Nenhuma atividade recente', 'As acoes do LMS aparecerao aqui.']]).map(([icon, title, text]) => `
                <div class="admin-pro-list-item"><div class="admin-pro-list-icon">${icon}</div><div><strong>${title}</strong><span>${text}</span></div></div>
            `).join('');

            document.querySelectorAll('#dashboard-students-body [data-admin-action]').forEach(el => {
                el.addEventListener('click', () => runAdminAction(el.getAttribute('data-admin-action')));
            });
        }

        // Atualiza os dropdowns e painéis de seleção de turma
        function updateClassDropdowns(classes) {
            let workspaceClasses = classes;
            if (currentAdminCourseId) {
                workspaceClasses = classes.filter(c => c.courseId === currentAdminCourseId);
            }
            
            // Dropdown de filtro da tabela (usa workspaceClasses)
            const filterSel = document.getElementById('filter-class');
            if (filterSel) {
                const curFilter = filterSel.value;
                filterSel.innerHTML = '<option value="">Todas as Turmas</option>';
                workspaceClasses.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = c.name;
                    filterSel.appendChild(opt);
                });
                filterSel.value = curFilter;
            }

            // Função helper para renderizar checkboxes baseada em todas as turmas
            const renderCheckboxes = (containerId) => {
                const container = document.getElementById(containerId);
                if (!container) return;
                
                // Salvar estados atuais para não perder seleções ao recarregar
                const currentChecked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                
                const grouped = {};
                classes.forEach(c => {
                    if (!grouped[c.courseId]) grouped[c.courseId] = [];
                    grouped[c.courseId].push(c);
                });
                
                let html = '';
                if (classes.length === 0) {
                    html = '<div class="text-xs text-slate-500 py-2">Nenhuma turma cadastrada no sistema.</div>';
                } else {
                    Object.keys(grouped).forEach(courseId => {
                        const course = (typeof courseData !== 'undefined' && courseData.courses) ? courseData.courses.find(cd => cd.id === courseId) || { name: 'Curso Desconhecido' } : { name: 'Curso Desconhecido' };
                        html += `
                            <div class="mb-2">
                                <div class="text-[10px] font-bold text-slate-400 uppercase mb-1 border-b border-slate-700/50 pb-1">${course.name}</div>
                                <div class="flex flex-col gap-1 pl-1">
                        `;
                        grouped[courseId].forEach(c => {
                            const isChecked = currentChecked.includes(c.name) ? 'checked' : '';
                            html += `
                                <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                                    <input type="checkbox" name="student-class-checkbox" value="${c.name}" ${isChecked} class="rounded bg-slate-800 border-slate-600 text-primary focus:ring-primary focus:ring-offset-slate-900 cursor-pointer w-4 h-4">
                                    ${c.name}
                                </label>
                            `;
                        });
                        html += `</div></div>`;
                    });
                }
                container.innerHTML = html;
            };

            renderCheckboxes('create-student-classes-container');
            renderCheckboxes('edit-student-classes-container');

            // Cabeçalho admin active class select (usa workspaceClasses)
            const activeClassSel = document.getElementById('admin-active-class');
            if (activeClassSel) {
                const curActiveClass = activeClassSel.value;
                activeClassSel.innerHTML = '';
                if (workspaceClasses.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = 'Nenhuma turma cadastrada';
                    activeClassSel.appendChild(opt);
                } else {
                    workspaceClasses.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.name;
                        opt.textContent = c.name;
                        activeClassSel.appendChild(opt);
                    });
                    activeClassSel.value = curActiveClass;
                }
            }
        }

        // Removed duplicate code
        // Renderiza tabela de turmas (Aba Turmas)
        function updateClassesTable(classes, students) {
            const tbody = document.getElementById('classes-body');
            if (!tbody) return;
            
            if (currentAdminCourseId) {
                classes = classes.filter(c => c.courseId === currentAdminCourseId);
            }
            
            if (classes.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-slate-400 p-8">
                            Nenhuma turma cadastrada no momento.
                        </td>
                    </tr>
                `;
                return;
            }
            
            classes.sort((a, b) => a.name.localeCompare(b.name));
            
            let html = '';
            classes.forEach(c => {
                const count = students.filter(s => s.studentClass === c.name).length;
                
                html += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="p-3 align-middle"><strong class="text-blue-400 text-base">${c.name}</strong></td>
                        <td class="p-3 align-middle"><span class="font-semibold text-purple-400 text-xs uppercase tracking-wider">${c.courseId || 'SENAI 4.0'}</span></td>
                        <td class="p-3 align-middle"><span class="font-semibold text-white">${c.period || 'Não definido'}</span></td>
                        <td class="p-3 align-middle">
                            <div class="flex items-center gap-2">
                                <label class="switch">
                                    <input type="checkbox" class="class-toggle" data-name="${c.name}" ${c.registrationEnabled ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                                <span class="text-xs font-bold ${c.registrationEnabled ? 'text-green-400' : 'text-slate-500'}">
                                    ${c.registrationEnabled ? 'Liberado' : 'Bloqueado'}
                                </span>
                             </div>
                        </td>
                        <td class="p-3 align-middle"><strong class="text-lg text-white">${count}</strong> <span class="text-slate-400">alunos</span></td>
                        <td class="p-3 align-middle">
                            <button class="btn-action-delete-class bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors" data-name="${c.name}">🗑️ Excluir</button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
            
            // Ativa/Desativa cadastro da turma
            tbody.querySelectorAll('.class-toggle').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const name = e.target.getAttribute('data-name');
                    const registrationEnabled = e.target.checked;
                    
                    fetch('/api/admin/class/toggle-registration', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': adminPassword
                        },
                        body: JSON.stringify({ name, courseId: currentAdminCourseId, registrationEnabled })
                    })
                    .then(res => res.json())
                    .then(() => {
                        refreshDashboard();
                    })
                    .catch(err => console.error(err));
                });
            });
            
            // Deletar turma
            tbody.querySelectorAll('.btn-action-delete-class').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const name = e.target.getAttribute('data-name');
                    const confirmDel = confirm(`Tem certeza que deseja EXCLUIR a turma ${name}? Alunos cadastrados continuarão no sistema, mas novos cadastros serão bloqueados.`);
                    if (!confirmDel) return;
                    
                    fetch('/api/admin/class/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': adminPassword
                        },
                        body: JSON.stringify({ name, courseId: currentAdminCourseId })
                    })
                    .then(res => {
                        if (!res.ok) throw new Error("Erro ao excluir turma.");
                        return res.json();
                    })
                    .then(() => {
                        alert('Turma excluída com sucesso!');
                        refreshDashboard();
                    })
                    .catch(err => alert(err.message));
                });
            });
        }

        // Cadastro de Turma Manual
        document.getElementById('btn-create-class').addEventListener('click', () => {
            const nameInput = document.getElementById('create-class-name');
            const name = nameInput.value.trim();
            const errDiv = document.getElementById('class-create-error');
            const succDiv = document.getElementById('class-create-success');
            
            errDiv.style.display = 'none';
            succDiv.style.display = 'none';
            
            if (!name) {
                errDiv.textContent = 'Por favor, digite o identificador da turma.';
                errDiv.style.display = 'block';
                return;
            }

            const courseId = currentAdminCourseId;
            if (!courseId) {
                errDiv.textContent = 'Erro interno: Workspace não selecionado.';
                errDiv.style.display = 'block';
                return;
            }
            
            fetch('/api/admin/class/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ name, period: document.getElementById('create-class-period').value, courseId })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || 'Erro ao criar turma.') });
                }
                return res.json();
            })
            .then(() => {
                succDiv.textContent = 'Turma criada com sucesso!';
                succDiv.style.display = 'block';
                nameInput.value = '';
                refreshDashboard();
                setTimeout(() => { succDiv.style.display = 'none'; }, 3000);
            })
            .catch(err => {
                errDiv.textContent = err.message;
                errDiv.style.display = 'block';
            });
        });

        // Busca dados e atualiza o dashboard
        function refreshDashboard() {
            if (!adminPassword) return;

            const activeClassSel = document.getElementById('admin-active-class');
            let currentActiveClass = activeClassSel ? activeClassSel.value : '';

            // 1. Busca turmas cadastradas
            fetch(`/api/admin/classes?password=${adminPassword}`)
            .then(res => res.json())
            .then(classes => {
                allClassesCache = classes;
                updateClassDropdowns(classes);
                currentActiveClass = activeClassSel ? activeClassSel.value : '';
                updateClassesTable(classes, allStudentsCache);
                updateIndexAdminDashboard();

                // 2. Busca configurações isoladas da turma ativa
                return fetch('/api/admin/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': adminPassword
                    },
                    body: JSON.stringify({ studentClass: currentActiveClass })
                });
            })
            .then(res => res.json())
            .then(config => {
                activeExamKey = config.activeExamKey;
                
                // Sincroniza os switches de liberação de apostilas/provas

                

                // Sincroniza os switches de liberação de apostilas/provas
                const releasedItems = config.releasedItems || {};
                document.querySelectorAll('.material-toggle').forEach(chk => {
                    const key = chk.getAttribute('data-key');
                    chk.checked = !!releasedItems[key];
                });
                updateReleaseProgress(); // #14

                // #4 Update student counter
                const rows = document.querySelectorAll('#students-body tr');
                const counter = document.getElementById('students-counter');
                if (counter && rows.length > 0) counter.textContent = `${rows.length} alunos`;
            })
            .catch(e => console.error('Erro ao buscar status do servidor:', e));

            // Busca IPs da rede local
            fetch('/api/admin/network-info')
            .then(res => res.json())
            .then(ips => {
                const container = document.getElementById('network-ips-container');
                if (!container || !ips) return;
                
                if (!ips || ips.length === 0) {
                    container.innerHTML = '<span class="text-sm text-slate-400">Nenhum IP detectado</span>';
                    return;
                }
                
                let html = '';
                ips.forEach(ip => {
                    const isVBox = ip.name.toLowerCase().includes('virtualbox') || ip.address.startsWith('192.168.56.');
                    if (isVBox) {
                        html += `
                        <div class="flex items-center justify-between p-2 rounded bg-black/10 border border-white/5 mb-2">
                            <span class="text-slate-500 text-sm font-mono line-through opacity-70">http://${ip.address}:3000</span>
                            <span class="text-[10px] uppercase font-bold text-slate-500 bg-black/20 px-2 py-0.5 rounded border border-white/10">⚠️ Ignorar (VirtualBox)</span>
                        </div>`;
                    } else {
                        html += `
                        <div class="flex items-center justify-between p-2 rounded bg-black/20 border border-white/10 mb-2">
                            <a href="http://${ip.address}:3000" target="_blank" class="text-blue-400 hover:text-blue-300 transition-colors text-sm font-mono font-bold">http://${ip.address}:3000</a>
                            <span class="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">✨ Recomendado</span>
                        </div>`;
                    }
                });
                
                container.innerHTML = html;
            })
            .catch(e => console.error('Erro ao buscar IPs da rede:', e));

            // Busca alunos online e cadastrados
            fetch(`/api/admin/students?password=${adminPassword}`)
            .then(res => res.json())
            .then(students => {
                allStudentsCache = students;
                const filteredStudents = selectedFilterClass 
                    ? students.filter(s => s.studentClass === selectedFilterClass)
                    : students;
                
                const onlineCount = filteredStudents.filter(s => s.isOnline).length;
                document.getElementById('stat-students').textContent = onlineCount;
                updateStudentsTable(students);
                updateIndexAdminDashboard();
            })
            .catch(e => console.error('Erro ao buscar alunos:', e));

            // Busca submissões de notas
            fetch(`/api/admin/submissions?password=${adminPassword}`)
            .then(res => res.json())
            .then(submissions => {
                updateSubmissionsTable(submissions);
            })
            .catch(e => console.error('Erro ao buscar notas:', e));

            // Busca administradores/professores para alimentar o painel principal.
            fetch(`/api/admin/accounts?password=${adminPassword}`)
            .then(res => res.json())
            .then(admins => {
                updateAdminsTable(admins);
            })
            .catch(e => console.error('Erro ao buscar administradores:', e));
        }

        // #14 Update Release Progress in Header
        function updateReleaseProgress() {
            // ... (rest remains unchanged, this is just to anchor)
        }

        // --- Filtros de Entregas ---
        const filterClassSel = document.getElementById('filter-class');
        if (filterClassSel) {
            filterClassSel.addEventListener('change', (e) => {
                selectedFilterClass = e.target.value;
                if (typeof updateSubmissionsTable === 'function') {
                    updateSubmissionsTable(allSubmissionsCache);
                }
            });
        }
        
        const filterSubmissionCourse = document.getElementById('filter-submission-course');
        if (filterSubmissionCourse) {
            filterSubmissionCourse.addEventListener('change', () => {
                if (typeof updateSubmissionsTable === 'function') {
                    updateSubmissionsTable(allSubmissionsCache);
                }
            });
        }

        let allSubmissionsCache = [];
        // Atualiza a tabela live e as estatísticas
        function updateSubmissionsTable(submissions) {
            allSubmissionsCache = submissions;
            const tbody = document.getElementById('submissions-body');
            const emptyDiv = document.getElementById('empty-submissions');
            
            const filterSubmissionCourse = document.getElementById('filter-submission-course');
            const selectedFilterCourse = filterSubmissionCourse ? filterSubmissionCourse.value : '';

            const filteredSubmissions = submissions.filter(sub => {
                const matchClass = selectedFilterClass ? sub.student.studentClass === selectedFilterClass : true;
                
                const studentClassObj = allClassesCache.find(c => c.name === sub.student.studentClass);
                const courseId = studentClassObj ? studentClassObj.courseId : '';
                const matchCourse = selectedFilterCourse ? courseId === selectedFilterCourse : true;
                
                return matchClass && matchCourse;
            });

            document.getElementById('stat-submissions').textContent = filteredSubmissions.length;

            if (filteredSubmissions.length === 0) {
                tbody.innerHTML = '';
                emptyDiv.style.display = 'block';
                document.getElementById('stat-average').textContent = '0%';
                updateIndexAdminDashboard();
                return;
            }

            emptyDiv.style.display = 'none';
            let totalScore = 0;
            
            filteredSubmissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            let html = '';
            filteredSubmissions.forEach(sub => {
                totalScore += sub.score;
                const isApproved = sub.score >= 60;
                const date = new Date(sub.timestamp).toLocaleTimeString('pt-BR') + ' ' + new Date(sub.timestamp).toLocaleDateString('pt-BR');
                const evalLabel = sub.examKey.replace('Avaliacao_', '').replace(/_/g, ' ');
                let evalColorClass = 'text-blue-400';
                if (sub.examKey.includes('FUTEC')) evalColorClass = 'text-red-400';
                else if (sub.examKey.includes('FECOP')) evalColorClass = 'text-blue-400';
                else if (sub.examKey.includes('IRCOM')) evalColorClass = 'text-purple-400';

                html += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="p-3 align-middle text-white font-bold">${sub.student.name}</td>
                        <td class="p-3 align-middle text-slate-300 text-sm">${sub.student.studentClass} • ${sub.student.period}</td>
                        <td class="p-3 align-middle"><span class="font-semibold ${evalColorClass}">${evalLabel}</span></td>
                        <td class="p-3 align-middle"><strong class="${isApproved ? 'text-green-400' : 'text-red-400'}">${sub.score}%</strong></td>
                        <td class="p-3 align-middle text-slate-300">${sub.correctCount} / ${sub.totalCount}</td>
                        <td class="p-3 align-middle text-xs text-slate-400">${date}</td>
                        <td class="p-3 align-middle">
                            <span class="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${isApproved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                                ${isApproved ? 'Aprovado' : 'Reprovado'}
                            </span>
                        </td>
                        <td class="p-3 align-middle">
                            <div class="flex items-center gap-2">
                                <button onclick="openRaioX('${sub.student.email}', '${sub.examKey}')" class="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap" title="Ver Raio-X Detalhado">🔍 Raio-X</button>
                                <button onclick="deleteSubmission('${sub.student.email}', '${sub.examKey}')" class="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap" title="Permite que o aluno refaça a prova">🗑️ Excluir</button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
            const avg = Math.round(totalScore / filteredSubmissions.length);
            const avgEl = document.getElementById('stat-average');
            avgEl.textContent = `${avg}%`;
            if (avg >= 60) {
                avgEl.className = 'stat-value ok';
            } else {
                avgEl.className = 'stat-value';
            }
            updateIndexAdminDashboard();
        }
        
        window.deleteSubmission = function(studentEmail, examKey) {
            if (!confirm(`Tem certeza que deseja EXCLUIR esta nota? O aluno poderá refazer a prova.`)) return;

            fetch('/api/admin/submissions/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ studentEmail, examKey })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message || 'Submissão excluída.');
                refreshDashboard();
            })
            .catch(err => alert('Erro ao excluir submissão.'));
        };

        window.openRaioX = function(studentEmail, examKey) {
            const sub = allSubmissionsCache.find(s => s.student.email === studentEmail && s.examKey === examKey);
            if (!sub) {
                alert('Submissão não encontrada.');
                return;
            }

            const headerInfo = document.getElementById('raiox-header-info');
            const questionsContainer = document.getElementById('raiox-questions-container');
            
            const isApproved = sub.score >= 60;
            const evalLabel = sub.examKey.replace('Avaliacao_', '').replace(/_/g, ' ');
            const date = new Date(sub.timestamp).toLocaleString('pt-BR');

            headerInfo.innerHTML = `
                <div class="flex flex-col gap-1">
                    <div><span class="text-slate-400">Aluno:</span> <strong class="text-white">${sub.student.name}</strong></div>
                    <div><span class="text-slate-400">Turma:</span> <span class="text-white">${sub.student.studentClass} • ${sub.student.period}</span></div>
                    <div><span class="text-slate-400">Email:</span> <span class="text-white">${sub.student.email}</span></div>
                </div>
                <div class="flex flex-col gap-1 text-right">
                    <div><span class="text-slate-400">Avaliação:</span> <strong class="text-white">${evalLabel}</strong></div>
                    <div><span class="text-slate-400">Data/Hora:</span> <span class="text-white">${date}</span></div>
                    <div><span class="text-slate-400">Nota:</span> <span class="font-black text-lg ${isApproved ? 'text-green-400' : 'text-red-400'}">${sub.score}%</span> <span class="text-xs text-slate-400">(${sub.correctCount}/${sub.totalCount})</span></div>
                </div>
            `;

            let html = '';
            const rawMarkdown = typeof courseData !== 'undefined' ? courseData[examKey] : null;
            const parsed = rawMarkdown ? parseEvaluation(rawMarkdown) : null;

            if (sub.gradedAnswers && parsed && parsed.questions) {
                html += '<div class="flex flex-col gap-5">';
                sub.gradedAnswers.forEach((ans, idx) => {
                    const originalQ = parsed.questions.find(q => q.originalNumber === ans.questionNumber);
                    if (!originalQ) return;
                    
                    html += `
                        <div class="bg-black/10 border border-white/10 p-5 rounded-xl shadow-lg">
                            <div class="font-bold mb-4 text-white flex gap-3">
                                <span class="shrink-0 w-7 h-7 bg-primary text-white rounded-full text-center leading-7 text-sm font-bold shadow-lg shadow-red-500/20">${idx + 1}</span>
                                <div class="mt-0.5">${originalQ.text}</div>
                            </div>
                            <div class="flex flex-col gap-2 ml-[38px]">
                    `;

                    originalQ.alternatives.forEach(alt => {
                        let altClasses = 'p-3 rounded-lg border border-white/10 bg-white/5 flex items-start gap-3 text-slate-400 text-sm';
                        const isStudentChoice = ans.studentChoice === alt.displayLetter || ans.studentChoice === alt.letter;
                        const isCorrectChoice = ans.correctAnswer === alt.displayLetter || ans.correctAnswer === alt.letter;

                        if (isCorrectChoice) {
                            altClasses = 'p-3 rounded-lg border border-green-500/50 bg-green-500/10 flex items-start gap-3 text-green-400 font-bold text-sm shadow-lg shadow-green-500/10';
                        } else if (isStudentChoice) {
                            altClasses = 'p-3 rounded-lg border border-red-500/50 bg-red-500/10 flex items-start gap-3 text-red-400 font-bold text-sm shadow-lg shadow-red-500/10';
                        }

                        html += `
                            <div class="${altClasses}">
                                <span class="font-bold">${alt.displayLetter || alt.letter})</span>
                                <span>${alt.text}</span>
                            </div>
                        `;
                    });

                    html += `
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            } else {
                for (let i = 1; i <= sub.totalCount; i++) {
                    const qNum = String(i);
                    const studAns = sub.answers ? sub.answers[qNum] : '?';
                    const correctAns = sub.answerKey ? sub.answerKey[qNum] : '?';
                    
                    const isCorrect = studAns === correctAns;
                    const cardClasses = isCorrect 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30';

                    html += `
                        <div class="${cardClasses} border p-4 rounded-xl flex justify-between items-center mb-3 shadow-md">
                            <div>
                                <strong class="text-lg text-white">Questão ${qNum}</strong>
                            </div>
                            <div class="text-right flex flex-col gap-1">
                                <div class="text-sm text-slate-300">Resposta do Aluno: <strong class="${isCorrect ? 'text-green-400' : 'text-red-400'}">${studAns || 'Nenhuma'}</strong></div>
                                <div class="text-sm text-slate-300">Gabarito Correto: <strong class="text-green-400">${correctAns || '?'}</strong></div>
                            </div>
                        </div>
                    `;
                }
            }

            questionsContainer.innerHTML = html;
            document.getElementById('raiox-modal').style.display = 'flex';
        };

        document.getElementById('btn-close-raiox').addEventListener('click', () => {
            document.getElementById('raiox-modal').style.display = 'none';
        });

        // Exportador CSV
        document.getElementById('btn-export-csv').addEventListener('click', () => {
            fetch(`/api/admin/submissions?password=${adminPassword}`)
            .then(res => res.json())
            .then(submissions => {
                if (submissions.length === 0) {
                    alert('Nenhuma submissão encontrada para exportar.');
                    return;
                }

                let csvContent = "\ufeff";
                csvContent += "Nome,Turma,Período,Avaliação,Acertos,Total Questões,Nota (%),Data/Hora\n";
                
                submissions.forEach(s => {
                    const dateStr = new Date(s.timestamp).toLocaleString('pt-BR');
                    const evalLabel = s.examKey.replace('Avaliacao_', '').replace(/_/g, ' ');
                    csvContent += `"${s.student.name}","${s.student.studentClass}","${s.student.period}","${evalLabel}",${s.correctCount},${s.totalCount},${s.score},"${dateStr}"\n`;
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `notas_portal_senai_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .catch(e => alert('Erro ao exportar notas.'));
        });

        // Limpeza de Sala (Reset)
        document.getElementById('btn-reset-room').addEventListener('click', () => {
            const confirmReset = confirm('ATENÇÃO: Isso irá apagar TODOS os alunos conectados e as notas desta sessão de aula! Você tem certeza?');
            if (!confirmReset) return;

            fetch('/api/admin/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                }
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                refreshDashboard();
            })
            .catch(err => alert('Erro ao resetar sala.'));
        });

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            sessionStorage.removeItem('admin_pass');
            adminPassword = '';
            clearInterval(pollInterval);
            document.getElementById('admin-app').style.display = 'none';
            document.getElementById('login-overlay').style.display = 'flex';
            document.getElementById('admin-pass').value = '';
        });

        // ==========================================
        // SISTEMA DE PARSE E GERAÇÃO DE EXAMES/PDF (PORTADO)
        // ==========================================
        function parseEvaluation(markdownText) {
            if (!markdownText) return null;

            const titleMatch = markdownText.match(/^#\s+(.+)$/m);
            const themeMatch = markdownText.match(/\*\*Tema:\*\*\s*(.+)/);
            const title = titleMatch ? titleMatch[1].replace(/📝\s*/, '') : 'Avaliação';
            const theme = themeMatch ? themeMatch[1] : '';

            let rubricMarkdown = '';
            const rubricMatch = markdownText.match(/(## Parte 2[\s\S]*?)(?=<details>)/);
            if (rubricMatch) {
                rubricMarkdown = rubricMatch[1].trim();
            }

            const gabarito = {};
            const detailsMatch = markdownText.match(/<details>([\s\S]*?)<\/details>/);
            if (detailsMatch) {
                const detailsContent = detailsMatch[1];
                const detailedMatches = detailsContent.matchAll(/(\d+)\.\s*\*\*([A-Da-d])\*\*/g);
                for (const m of detailedMatches) {
                    gabarito[parseInt(m[1])] = m[2].toUpperCase();
                }
                if (Object.keys(gabarito).length === 0) {
                    const compactMatches = detailsContent.matchAll(/(\d+)\.\s*([A-Da-d])\b/g);
                    for (const m of compactMatches) {
                        gabarito[parseInt(m[1])] = m[2].toUpperCase();
                    }
                }
            }

            const questions = [];
            const questionRegex = /\*\*(\d+)\.\s*(.*?)\*\*\s*\n([\s\S]*?)(?=\*\*\d+\.|## Parte 2|<details>|$)/g;
            let qMatch;
            
            while ((qMatch = questionRegex.exec(markdownText)) !== null) {
                const qNumber = parseInt(qMatch[1]);
                const qText = qMatch[2].trim();
                const alternativesBlock = qMatch[3];

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
                        alternatives: alternatives,
                        correctAnswer: gabarito[qNumber]
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

        function shuffleArray(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        function shuffleAlternatives(question, doShuffle) {
            let mappedAlts;
            const newLetters = ['A', 'B', 'C', 'D'];
            let correctLetter = '';

            if (doShuffle) {
                const shuffledAlts = shuffleArray(question.alternatives);
                mappedAlts = shuffledAlts.map((alt, idx) => {
                    const newLetter = newLetters[idx];
                    if (alt.isCorrect) correctLetter = newLetter;
                    return {
                        ...alt,
                        displayLetter: newLetter
                    };
                });
            } else {
                mappedAlts = question.alternatives.map((alt, idx) => {
                    const newLetter = newLetters[idx];
                    if (alt.isCorrect) correctLetter = newLetter;
                    return {
                        ...alt,
                        displayLetter: newLetter
                    };
                });
            }

            return {
                ...question,
                alternatives: mappedAlts,
                correctAnswer: correctLetter
            };
        }

        function generateExam(allQuestions, count, shuffleQ = true, shuffleA = true) {
            let selected = [...allQuestions];
            if (shuffleQ) {
                if (count < selected.length) {
                    selected = shuffleArray(selected).slice(0, count);
                }
                selected = shuffleArray(selected);
            } else {
                selected = selected.slice(0, count);
            }
            
            const answerKey = {};
            const examQuestions = selected.map((q, idx) => {
                const processed = shuffleAlternatives(q, shuffleA);
                const newNumber = idx + 1;
                answerKey[newNumber] = processed.correctAnswer;
                return {
                    ...processed,
                    examNumber: newNumber
                };
            });

            return { questions: examQuestions, answerKey };
        }

        function openExamPreviewModal(examKey) {
            currentModalExamKey = examKey;
            filterUnusedOnly = false;
            
            const rawMarkdown = courseData[examKey];
            if (!rawMarkdown) {
                alert('Erro: Conteúdo da prova não encontrado em data.js.');
                return;
            }

            const parsed = parseEvaluation(rawMarkdown);
            if (!parsed) {
                alert('Erro ao processar as questões da prova.');
                return;
            }

            const activeClassSel = document.getElementById('admin-active-class');
            const currentActiveClass = activeClassSel ? activeClassSel.value : '';
            
            let initialCount = parsed.totalQuestions;
            
            // Carrega config + histórico de provas em paralelo
            const configPromise = fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ studentClass: currentActiveClass })
            }).then(r => r.json()).catch(() => ({}));

            const historyPromise = currentActiveClass ? fetch(`/api/admin/exam-history?studentClass=${encodeURIComponent(currentActiveClass)}&examKey=${encodeURIComponent(examKey)}&password=${encodeURIComponent(adminPassword)}`, {
                headers: { 'Authorization': adminPassword }
            }).then(r => r.json()).catch(() => ({ history: [] })) : Promise.resolve({ history: [] });

            Promise.all([configPromise, historyPromise]).then(([config, histData]) => {
                examHistoryCache = (histData && histData.history) || [];
                const count = config.activeExamQuestionCount || parsed.totalQuestions;
                setupModal(parsed, count);
            }).catch(() => {
                examHistoryCache = [];
                setupModal(parsed, initialCount);
            });
        }

        function setupModal(parsed, initialCount) {
            const slider = document.getElementById('modal-question-slider');
            slider.max = parsed.totalQuestions;
            slider.value = initialCount;
            document.getElementById('modal-question-count-badge').textContent = initialCount;
            
            const totalBadge = document.getElementById('modal-question-total-badge');
            if (totalBadge) totalBadge.textContent = parsed.totalQuestions;

            const shuffleQEl = document.getElementById('modal-shuffle-questions');
            const shuffleAEl = document.getElementById('modal-shuffle-answers');
            if (shuffleQEl) shuffleQEl.checked = true;
            if (shuffleAEl) shuffleAEl.checked = true;

            // Reset do filtro "Apenas Inéditas"
            const filterUnusedEl = document.getElementById('modal-filter-unused');
            if (filterUnusedEl) filterUnusedEl.checked = false;
            filterUnusedOnly = false;

            currentModalExamState = {
                ...parsed,
                questionCount: initialCount,
                excludedQuestions: new Set()
            };

            document.getElementById('modal-exam-title').textContent = parsed.title;
            document.getElementById('modal-exam-theme').textContent = parsed.theme;

            updateModalPreview(true);

            document.getElementById('exam-preview-modal').style.display = 'flex';
        }
        
        // Calcula um mapa de uso: { questionNumber: [{ label, type, date }] }
        function getQuestionUsageMap() {
            const usageMap = {};
            if (!examHistoryCache || examHistoryCache.length === 0) return usageMap;
            examHistoryCache.forEach((entry, idx) => {
                const label = entry.label || (entry.type === 'impressa' ? `Impressa #${idx + 1}` : `Online #${idx + 1}`);
                (entry.questionNumbers || []).forEach(qn => {
                    if (!usageMap[qn]) usageMap[qn] = [];
                    usageMap[qn].push({ label, type: entry.type, date: entry.createdAt });
                });
            });
            return usageMap;
        }

        function updateModalPreview(regenerate = true) {
            const shuffleQEl = document.getElementById('modal-shuffle-questions');
            const shuffleAEl = document.getElementById('modal-shuffle-answers');
            const doShuffleQ = shuffleQEl ? shuffleQEl.checked : true;
            const doShuffleA = shuffleAEl ? shuffleAEl.checked : true;

            if (!currentModalExamState.excludedQuestions) {
                currentModalExamState.excludedQuestions = new Set();
            }

            // Se o filtro "Apenas Inéditas" está ativo, exclui automaticamente questões já usadas
            const usageMap = getQuestionUsageMap();
            if (filterUnusedOnly) {
                currentModalExamState.questions.forEach(q => {
                    if (usageMap[q.originalNumber]) {
                        currentModalExamState.excludedQuestions.add(q.originalNumber);
                    }
                });
            }

            const availableQuestions = currentModalExamState.questions.filter(q => !currentModalExamState.excludedQuestions.has(q.originalNumber));

            if (regenerate) {
                const exam = generateExam(availableQuestions, currentModalExamState.questionCount, doShuffleQ, doShuffleA);
                currentModalExamState.shuffledQuestions = exam.questions;
                currentModalExamState.answerKey = exam.answerKey;
            }

            const slider = document.getElementById('modal-question-slider');
            if (slider) {
                slider.max = availableQuestions.length;
                if (parseInt(slider.value) > availableQuestions.length) {
                    slider.value = availableQuestions.length;
                    currentModalExamState.questionCount = availableQuestions.length;
                }
            }

            const listEl = document.getElementById('modal-questions-list');
            const badgeEl = document.getElementById('modal-question-count-badge');
            const totalBadgeEl = document.getElementById('modal-question-total-badge');
            
            const count = Math.min(currentModalExamState.questionCount, currentModalExamState.shuffledQuestions.length);
            if (badgeEl) badgeEl.textContent = count;
            if (totalBadgeEl) totalBadgeEl.textContent = currentModalExamState.questions.length;

            // Atualiza o contador de inéditas
            const unusedCount = currentModalExamState.questions.filter(q => !usageMap[q.originalNumber]).length;
            const unusedBadge = document.getElementById('modal-unused-count');
            if (unusedBadge) unusedBadge.textContent = `${unusedCount} inéditas de ${currentModalExamState.questions.length}`;

            // Renderiza o histórico na sidebar
            renderExamHistorySidebar();

            if (listEl) {
                let html = '';
                currentModalExamState.shuffledQuestions.forEach((q, idx) => {
                    if (idx >= count) return;
                    const usages = usageMap[q.originalNumber] || [];
                    const usageBadgeHTML = usages.length > 0 
                        ? `<div class="flex flex-wrap gap-1 mt-1.5">
                            ${usages.map(u => `<span class="text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-1.5 py-px rounded">⚡ ${u.label}</span>`).join('')}
                           </div>`
                        : '';
                    html += `
                        <div class="exam-question-card bg-black/15 border ${usages.length > 0 ? 'border-yellow-500/25' : 'border-white/10'} rounded-xl p-4 relative">
                            <label class="absolute top-3 right-3 flex items-center gap-1.5 cursor-pointer text-xs text-red-400">
                                <input type="checkbox" checked onchange="toggleExamQuestion(${q.originalNumber}, false)" class="accent-red-400 scale-125"> Remover
                            </label>
                            <div class="exam-question-number absolute top-3 left-3 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/20">${idx + 1}</div>
                            <div class="exam-question-body pl-8 mt-1">
                                <p class="exam-question-text font-bold mb-2.5 pr-20 text-white text-sm">${q.text}</p>
                                ${usageBadgeHTML}
                                <div class="exam-alternatives flex flex-col gap-2 mt-${usages.length > 0 ? '2' : '0'}">
                                    ${q.alternatives.map(alt => {
                                        const isCorrect = alt.isCorrect;
                                        return '<div class="exam-alt flex items-center gap-2 px-3 py-2 rounded-lg border ' + (isCorrect ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/10' : 'bg-white/5 border-white/10') + '">'
                                            + '<span class="font-bold text-sm ' + (isCorrect ? 'text-green-500' : 'text-slate-500') + '">' + alt.displayLetter + '</span>'
                                            + '<span class="text-sm ' + (isCorrect ? 'text-green-400' : 'text-slate-300') + '">' + alt.text + '</span>'
                                            + (isCorrect ? '<span class="ml-auto text-green-500 font-bold text-[10px] tracking-wider">CORRETA</span>' : '')
                                            + '</div>';
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                });

                const excludedQuestions = currentModalExamState.questions.filter(q => currentModalExamState.excludedQuestions.has(q.originalNumber));
                if (excludedQuestions.length > 0) {
                    html += `<div class="mt-4 pt-4 border-t border-dashed border-white/10 text-slate-500 text-xs font-bold uppercase tracking-wider">Questões Removidas Manualmente (${excludedQuestions.length})</div>`;
                    excludedQuestions.forEach((q) => {
                        const usages = usageMap[q.originalNumber] || [];
                        const usageBadgeHTML = usages.length > 0 
                            ? `<div class="flex flex-wrap gap-1 mt-1">
                                ${usages.map(u => `<span class="text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-1.5 py-px rounded">⚡ ${u.label}</span>`).join('')}
                               </div>`
                            : '';
                        html += `
                            <div class="exam-question-card bg-black/30 border border-white/10 rounded-xl p-4 relative opacity-60 transition-opacity hover:opacity-100">
                                <label class="absolute top-3 right-3 flex items-center gap-1.5 cursor-pointer text-xs text-green-500">
                                    <input type="checkbox" onchange="toggleExamQuestion(${q.originalNumber}, true)" class="accent-green-500 scale-125"> Adicionar
                                </label>
                                <div class="exam-question-body pl-2 mt-1">
                                    <p class="exam-question-text font-bold mb-2.5 pr-20 text-white text-sm line-through">${q.text}</p>
                                    ${usageBadgeHTML}
                                </div>
                            </div>
                        `;
                    });
                }

                listEl.innerHTML = html;
            }
        }

        window.toggleExamQuestion = function(originalNumber, include) {
            if (include) {
                currentModalExamState.excludedQuestions.delete(originalNumber);
                currentModalExamState.questionCount++;
            } else {
                currentModalExamState.excludedQuestions.add(originalNumber);
                currentModalExamState.questionCount--;
            }
            const slider = document.getElementById('modal-question-slider');
            if (slider) slider.value = currentModalExamState.questionCount;
            updateModalPreview(true);
        };

        // Renderiza a seção de histórico de provas na sidebar do modal
        function renderExamHistorySidebar() {
            const container = document.getElementById('exam-history-sidebar');
            if (!container) return;

            if (!examHistoryCache || examHistoryCache.length === 0) {
                container.innerHTML = '<span class="text-xs text-slate-500 italic">Nenhuma prova registrada para esta avaliação.</span>';
                return;
            }

            let html = '';
            examHistoryCache.forEach((entry, idx) => {
                const label = entry.label || (entry.type === 'impressa' ? `Impressa #${idx + 1}` : `Online #${idx + 1}`);
                const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
                const typeIcon = entry.type === 'impressa' ? '🖨️' : '💻';
                const qCount = (entry.questionNumbers || []).length;
                const qList = (entry.questionNumbers || []).sort((a, b) => a - b).join(', ');

                html += `
                    <div class="bg-black/20 border border-white/10 rounded-lg py-2 px-2.5 flex flex-col gap-0.5 relative group transition-colors hover:bg-black/30">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-bold text-white uppercase tracking-wider">${typeIcon} ${label}</span>
                            <button onclick="deleteExamHistoryEntry('${entry.id}')" class="bg-transparent border-none text-red-500 cursor-pointer text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-opacity outline-none" title="Excluir do histórico">🗑️</button>
                        </div>
                        <span class="text-[10px] text-slate-400">${dateStr} • <strong class="text-white">${qCount} questões</strong></span>
                        <span class="text-[9px] text-slate-500 break-all leading-tight" title="Questões: ${qList}">Q: ${qList}</span>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        // Registra um snapshot de prova gerada (chamado ao salvar online ou gerar PDF)
        function registerExamSnapshot(type, labelOverride) {
            const activeClassSel = document.getElementById('admin-active-class');
            const currentActiveClass = activeClassSel ? activeClassSel.value : '';
            if (!currentActiveClass || !currentModalExamKey || !currentModalExamState) return Promise.resolve();

            // Coleta os números das questões incluídas na prova atual
            const count = Math.min(currentModalExamState.questionCount, currentModalExamState.shuffledQuestions.length);
            const questionNumbers = currentModalExamState.shuffledQuestions
                .slice(0, count)
                .map(q => q.originalNumber);

            if (questionNumbers.length === 0) return Promise.resolve();

            // Gera label automático
            const existingOfType = examHistoryCache.filter(e => e.type === type).length;
            const autoLabel = labelOverride || (type === 'impressa' ? `Impressa #${existingOfType + 1}` : `Online #${existingOfType + 1}`);

            return fetch('/api/admin/exam-history/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({
                    studentClass: currentActiveClass,
                    examKey: currentModalExamKey,
                    type: type,
                    label: autoLabel,
                    questionNumbers: questionNumbers
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.entry) {
                    examHistoryCache.push(data.entry);
                    renderExamHistorySidebar();
                    updateModalPreview(false); // Atualiza badges sem regenerar
                }
            })
            .catch(err => console.error('Erro ao registrar histórico:', err));
        }

        // Exclui uma entrada do histórico
        window.deleteExamHistoryEntry = function(entryId) {
            const activeClassSel = document.getElementById('admin-active-class');
            const currentActiveClass = activeClassSel ? activeClassSel.value : '';
            if (!currentActiveClass || !currentModalExamKey) return;

            if (!confirm('Excluir esta entrada do histórico? As questões voltarão ao status "inédita".')) return;

            fetch('/api/admin/exam-history/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({
                    studentClass: currentActiveClass,
                    examKey: currentModalExamKey,
                    entryId: entryId
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    examHistoryCache = examHistoryCache.filter(e => e.id !== entryId);
                    renderExamHistorySidebar();
                    updateModalPreview(false);
                }
            })
            .catch(err => console.error('Erro ao excluir histórico:', err));
        };

        function generateUniqueExamCode() {
            return Math.random().toString(36).substring(2, 6).toUpperCase();
        }

        function generateModalExamPDF(isAnswerKey) {
            if (!currentModalExamState) return;

            const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
            const versionsInput = document.getElementById('modal-versions-count');
            const versionsCount = versionsInput ? Math.max(1, Math.min(10, parseInt(versionsInput.value))) : 1;
            const titleText = isAnswerKey 
                ? `GABARITO — ${currentModalExamState.title}` 
                : currentModalExamState.title;

            let documentsHTML = '';
            const shuffleQEl = document.getElementById('modal-shuffle-questions');
            const shuffleAEl = document.getElementById('modal-shuffle-answers');
            const doShuffleQ = shuffleQEl ? shuffleQEl.checked : true;
            const doShuffleA = shuffleAEl ? shuffleAEl.checked : true;

            const availableQuestions = currentModalExamState.questions.filter(q => !currentModalExamState.excludedQuestions.has(q.originalNumber));

            for (let v = 0; v < versionsCount; v++) {
                let examData;
                const examCode = generateUniqueExamCode();
                if (versionsCount === 1) {
                    examData = {
                        questions: currentModalExamState.shuffledQuestions,
                        answerKey: currentModalExamState.answerKey
                    };
                } else {
                    examData = generateExam(availableQuestions, currentModalExamState.questionCount, doShuffleQ, doShuffleA);
                }

                const count = Math.min(currentModalExamState.questionCount, examData.questions.length);
                const versionTitleText = ` (CÓDIGO: ${examCode})`;

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

                let bubbleSheetHTML = '';
                if (isAnswerKey) {
                    bubbleSheetHTML = `
                    <div class="print-bubble-sheet">
                        <div class="print-bubble-sheet-title">🔑 GABARITO DE RESPOSTAS RÁPIDAS - CÓDIGO ${examCode}</div>
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
                        <div class="print-bubble-sheet-title">✏️ CARTÃO RESPOSTA - CÓDIGO ${examCode} (PREENCHA COM CANETA AZUL OU PRETA)</div>
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
                        <div class="pdf-header" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 22px 40px; display: flex; align-items: center; justify-content: space-between;">
                            <div class="logo" style="font-size: 24pt; font-weight: 800; letter-spacing: -1px;">LMS<span style="color:#e94560">4.0</span></div>
                            <div class="meta" style="text-align: right; font-size: 8.5pt; opacity: 0.85; line-height: 1.5;">
                                <span style="font-size:11pt;font-weight:800;color:#e9c46a;display:block;margin-bottom:2px">
                                    ${isAnswerKey ? '🔑 GABARITO DO PROFESSOR' : '📝 AVALIAÇÃO'}${versionTitleText}
                                </span>
                                <span style="color:#a8d8ff;font-size:9pt">Instrutor Alan Marciano — Gestor em T.I.</span><br>
                                ${dateStr}<br>
                                <strong style="color:#e9c46a">USO RESTRITO — MATERIAL DIDÁTICO</strong>
                            </div>
                        </div>
                        
                        ${headerHTML}
                        
                        <div class="pdf-breadcrumb" style="background: #f0f4ff; border-left: 5px solid #e94560; padding: 8px 40px; font-size: 9pt; color: #555; font-weight: 600;">${currentModalExamState.title}${currentModalExamState.theme ? ' — ' + currentModalExamState.theme : ''}</div>
                        
                        ${!isAnswerKey ? `
                        <div class="exam-instructions" style="padding: 12px 40px; background: #fffbf0; border-left: 5px solid #f39c12; font-size: 9.5pt; color: #5a4a00;">
                            <strong>Instruções:</strong> Responda às questões e preencha as bolhas correspondentes no Cartão Resposta. Prova com <strong>${count} questões</strong>. Boa prova!
                        </div>
                        ` : ''}
                        
                        <div class="pdf-body" style="padding: 25px 40px 10px;">
                            ${bubbleSheetHTML}
                            ${isAnswerKey ? `<h1>🔑 Gabarito Detalhado — Versão ${examCode}</h1>` : ''}
                            ${questionsHTML}
                        </div>
                    </div>
                    
                    <div class="pdf-footer" style="padding: 10px 40px 30px; margin-top: auto;">
                        <hr style="border: none; border-top: 2px solid #e0e6f0; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 8.5pt; color: #888;">
                            <span>Escola Modelo — Portal Portal LMS · ${dateStr}</span>
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

        // Modal Event Listeners
        document.getElementById('btn-close-modal').addEventListener('click', () => {
            document.getElementById('exam-preview-modal').style.display = 'none';
        });

        document.getElementById('exam-preview-modal').addEventListener('click', (e) => {
            if (e.target.id === 'exam-preview-modal') {
                document.getElementById('exam-preview-modal').style.display = 'none';
            }
        });

        const modalSlider = document.getElementById('modal-question-slider');
        modalSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            currentModalExamState.questionCount = val;
            updateModalPreview(true);
        });

        const shuffleQToggle = document.getElementById('modal-shuffle-questions');
        if (shuffleQToggle) {
            shuffleQToggle.addEventListener('change', () => updateModalPreview(true));
        }

        const shuffleAToggle = document.getElementById('modal-shuffle-answers');
        if (shuffleAToggle) {
            shuffleAToggle.addEventListener('change', () => updateModalPreview(true));
        }

        document.getElementById('modal-btn-shuffle').addEventListener('click', () => {
            updateModalPreview(true);
        });

        document.getElementById('modal-btn-print-exam').addEventListener('click', () => {
            generateModalExamPDF(false);
            // Registra snapshot ao gerar prova impressa
            registerExamSnapshot('impressa');
        });

        document.getElementById('modal-btn-print-answer').addEventListener('click', () => {
            generateModalExamPDF(true);
        });

        // Toggle "Apenas Inéditas"
        document.getElementById('modal-filter-unused').addEventListener('change', (e) => {
            filterUnusedOnly = e.target.checked;
            if (filterUnusedOnly) {
                // Quando ativa, exclui todas as já usadas
                const usageMap = getQuestionUsageMap();
                currentModalExamState.questions.forEach(q => {
                    if (usageMap[q.originalNumber]) {
                        currentModalExamState.excludedQuestions.add(q.originalNumber);
                    }
                });
                // Recalcula questionCount
                const available = currentModalExamState.questions.filter(q => !currentModalExamState.excludedQuestions.has(q.originalNumber));
                currentModalExamState.questionCount = available.length;
            } else {
                // Quando desativa, remove APENAS as exclusões automáticas (questões usadas)
                const usageMap = getQuestionUsageMap();
                currentModalExamState.questions.forEach(q => {
                    if (usageMap[q.originalNumber]) {
                        currentModalExamState.excludedQuestions.delete(q.originalNumber);
                    }
                });
                currentModalExamState.questionCount = currentModalExamState.questions.filter(q => !currentModalExamState.excludedQuestions.has(q.originalNumber)).length;
            }
            const slider = document.getElementById('modal-question-slider');
            if (slider) slider.value = currentModalExamState.questionCount;
            updateModalPreview(true);
        });

        document.getElementById('modal-btn-save-config').addEventListener('click', () => {
            const activeClassSel = document.getElementById('admin-active-class');
            const currentActiveClass = activeClassSel ? activeClassSel.value : '';
            if (!currentActiveClass) {
                alert('Selecione uma turma ativa primeiro!');
                return;
            }

            fetch('/api/admin/exam-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({
                    studentClass: currentActiveClass,
                    examKey: currentModalExamKey,
                    questionCount: currentModalExamState.questionCount,
                    excludedQuestions: Array.from(currentModalExamState.excludedQuestions || [])
                })
            })
            .then(res => res.json())
            .then(data => {
                // Registra snapshot ao salvar prova online
                registerExamSnapshot('online').then(() => {
                    alert(`Configurações da prova ${currentModalExamKey} salvas para a turma ${currentActiveClass} com ${currentModalExamState.questionCount} questões!`);
                    document.getElementById('exam-preview-modal').style.display = 'none';
                    refreshDashboard();
                });
            })
            .catch(err => {
                console.error(err);
                alert('Erro ao salvar as configurações.');
            });
        });

        // Atualiza a tabela de contas de administradores
        function updateAdminsTable(admins) {
            allAdminsCache = Array.isArray(admins) ? admins : [];
            updateIndexAdminDashboard();

            const tbody = document.getElementById('admins-table-body');
            if (!tbody) return;

            if (allAdminsCache.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="2" class="text-center text-slate-400 p-8">
                            Nenhum administrador cadastrado.
                        </td>
                    </tr>
                `;
                return;
            }

            // Pega o e-mail do admin logado atualmente (primeira parte do token email:senha)
            const loggedInEmail = adminPassword.split(':')[0].toLowerCase();

            let html = '';
            allAdminsCache.forEach(a => {
                const isSelf = a.email.toLowerCase() === loggedInEmail;
                html += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="p-3 align-middle text-sm">
                            <strong class="text-white">${a.name}</strong>
                            <span class="ml-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${a.role === 'professor' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}">${a.role === 'professor' ? 'Professor' : 'Admin'}</span>
                            <br>
                            <span class="text-xs text-slate-400">${a.email}</span>
                            ${a.role === 'professor' && a.classes && a.classes.length ? `<br><span class="text-[10px] text-slate-500">Turmas: ${a.classes.join(', ')}</span>` : ''}
                        </td>
                        <td class="p-3 align-middle whitespace-nowrap">
                            ${isSelf 
                                ? `<span class="text-[10px] uppercase font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">VOCÊ (CONECTADO)</span>`
                                : `<button class="btn-action-delete-admin bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors" data-email="${a.email}">Excluir</button>`
                            }
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            tbody.querySelectorAll('.btn-action-delete-admin').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    const confirmDel = confirm(`Tem certeza que deseja EXCLUIR a conta de administrador ${email}?`);
                    if (!confirmDel) return;

                    fetch('/api/admin/accounts/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': adminPassword
                        },
                        body: JSON.stringify({ email })
                    })
                    .then(res => {
                        if (!res.ok) {
                            return res.json().then(data => { throw new Error(data.error || 'Erro ao excluir conta.') });
                        }
                        return res.json();
                    })
                    .then(() => {
                        alert('Administrador removido com sucesso!');
                        refreshDashboard();
                    })
                    .catch(err => alert(err.message));
                });
            });
        }

        // Listener para Cadastro Manual de Administradores
        document.getElementById('btn-create-admin').addEventListener('click', () => {
            const name = document.getElementById('create-admin-name').value.trim();
            const email = document.getElementById('create-admin-email').value.trim();
            const password = document.getElementById('create-admin-password').value.trim();
            const role = document.getElementById('create-admin-role').value;
            const classesStr = document.getElementById('create-admin-classes').value.trim();
            
            const errDiv = document.getElementById('admin-create-error');
            const succDiv = document.getElementById('admin-create-success');
            
            errDiv.style.display = 'none';
            succDiv.style.display = 'none';
            
            if (!name || !email || !password) {
                errDiv.textContent = 'Por favor, preencha todos os campos obrigatórios.';
                errDiv.style.display = 'block';
                return;
            }

            let classes = [];
            if (role === 'professor' && classesStr) {
                classes = classesStr.split(',').map(c => c.trim()).filter(c => c);
            }
            
            fetch('/api/admin/accounts/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ name, email, password, role, classes })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || 'Erro ao criar conta.') });
                }
                return res.json();
            })
            .then(() => {
                succDiv.textContent = 'Conta criada com sucesso!';
                succDiv.style.display = 'block';
                
                document.getElementById('create-admin-name').value = '';
                document.getElementById('create-admin-email').value = '';
                document.getElementById('create-admin-password').value = '';
                document.getElementById('create-admin-classes').value = '';
                document.getElementById('create-admin-role').value = 'admin';
                document.getElementById('create-admin-classes-container').style.display = 'none';
                
                refreshDashboard();
                setTimeout(() => { succDiv.style.display = 'none'; }, 3000);
            })
            .catch(err => {
                errDiv.textContent = err.message;
                errDiv.style.display = 'block';
            });
        });

        // Fechar Modal de Edição de Aluno
        document.getElementById('btn-close-edit-modal').addEventListener('click', () => {
            document.getElementById('edit-student-modal').style.display = 'none';
        });

        // Atualizar período automaticamente quando a turma é selecionada na edição - Removido (lógica múltipla agora)
        // Salvar alterações de cadastro do estudante
        document.getElementById('btn-save-student-edit').addEventListener('click', () => {
            const originalEmail = document.getElementById('edit-student-original-email').value;
            const name = document.getElementById('edit-student-name').value.trim();
            const email = document.getElementById('edit-student-email').value.trim();
            const password = document.getElementById('edit-student-password').value.trim();
            const period = document.getElementById('edit-student-period').value;
            
            const editContainer = document.getElementById('edit-student-classes-container');
            const selectedClasses = [];
            if (editContainer) {
                editContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedClasses.push(cb.value);
                });
            }
            const studentClass = selectedClasses[0] || '';
            
            const errDiv = document.getElementById('student-edit-error');
            errDiv.style.display = 'none';
            
            if (!name || !email || !password || selectedClasses.length === 0 || !period) {
                errDiv.textContent = 'Por favor, preencha todos os campos e selecione ao menos uma turma.';
                errDiv.style.display = 'block';
                return;
            }
            
            fetch('/api/admin/student/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ originalEmail, name, email, password, studentClass, classes: selectedClasses, period })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => { throw new Error(data.error || 'Erro ao atualizar dados do aluno.') });
                }
                return res.json();
            })
            .then(() => {
                document.getElementById('edit-student-modal').style.display = 'none';
                alert('Dados do aluno atualizados com sucesso!');
                refreshDashboard();
            })
            .catch(err => {
                errDiv.textContent = err.message;
                errDiv.style.display = 'block';
            });
        });

        // Listener para o Botão de Reiniciar Servidor
        document.getElementById('btn-restart-server').addEventListener('click', () => {
            const confirmRestart = confirm('Deseja realmente REINICIAR o servidor local? Isso desconectará temporariamente os alunos por alguns segundos.');
            if (!confirmRestart) return;

            const overlay = document.getElementById('restart-overlay');
            const progressBar = document.getElementById('restart-progress-bar');
            overlay.style.display = 'flex';

            let progress = 0;
            progressBar.style.width = '0%';
            const interval = setInterval(() => {
                progress += 2;
                progressBar.style.width = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 100);

            fetch('/api/admin/server/restart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                }
            })
            .then(() => {
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            })
            .catch(() => {
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            });
        });

        // ==========================================
        // LMS PREMIUM: GESTÃO DO FÓRUM / DÚVIDAS
        // ==========================================
        let adminForumComments = [];
        let selectedCommentId = null;

        function loadAdminForum() {
            const listContainer = document.getElementById('forum-admin-list');
            if (!listContainer) return;
            
            listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px;">Carregando dúvidas...</div>';

            fetch(`/api/admin/forum/all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                }
            })
            .then(res => {
                if (!res.ok) throw new Error("Erro ao buscar dúvidas do fórum.");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    adminForumComments = data.comments || [];
                    renderAdminForumList();
                }
            })
            .catch(err => {
                listContainer.innerHTML = `<div style="text-align: center; color: #f87171; padding: 30px;">${err.message}</div>`;
            });
        }

        let currentForumFilter = 'all';

        // Set up forum filter buttons
        document.querySelectorAll('.forum-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.forum-filter-btn').forEach(b => {
                    b.classList.remove('active', 'bg-white/10', 'text-white', 'border-white/10');
                    b.classList.remove('bg-yellow-500/10', 'border-yellow-500/40');
                    b.classList.remove('bg-green-500/10', 'border-green-500/40');
                    if(b.dataset.filter === 'all') b.className = 'forum-filter-btn text-slate-400 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-transparent hover:bg-white/5 transition-colors focus:outline-none';
                    if(b.dataset.filter === 'pending') b.className = 'forum-filter-btn text-yellow-400/70 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-transparent hover:bg-yellow-500/5 transition-colors focus:outline-none';
                    if(b.dataset.filter === 'answered') b.className = 'forum-filter-btn text-green-400/70 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-transparent hover:bg-green-500/5 transition-colors focus:outline-none';
                });
                
                const filter = btn.dataset.filter;
                if(filter === 'all') btn.className = 'forum-filter-btn active bg-white/10 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 transition-colors focus:outline-none';
                if(filter === 'pending') btn.className = 'forum-filter-btn active text-yellow-400 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-yellow-500/40 bg-yellow-500/10 transition-colors focus:outline-none';
                if(filter === 'answered') btn.className = 'forum-filter-btn active text-green-400 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-green-500/40 bg-green-500/10 transition-colors focus:outline-none';
                
                currentForumFilter = filter;
                renderAdminForumList();
            });
        });

        function renderAdminForumList() {
            const listContainer = document.getElementById('forum-admin-list');
            if (!listContainer) return;

            if (adminForumComments.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state-enhanced">
                        <div class="empty-icon text-4xl mb-3">💬</div>
                        <h4 class="text-white font-bold mb-1">Fórum Vazio</h4>
                        <p class="text-slate-400 text-sm max-w-xs mx-auto text-center">Nenhuma dúvida foi enviada pelos alunos até o momento.</p>
                    </div>`;
                return;
            }

            let filteredComments = [...adminForumComments];
            filteredComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            if (currentForumFilter === 'pending') {
                filteredComments = filteredComments.filter(c => !c.replies.some(r => r.authorRole === 'Instrutor'));
            } else if (currentForumFilter === 'answered') {
                filteredComments = filteredComments.filter(c => c.replies.some(r => r.authorRole === 'Instrutor'));
            }

            listContainer.innerHTML = '';
            
            if (filteredComments.length === 0) {
                listContainer.innerHTML = '<div class="text-center text-slate-400 p-8 text-sm">Nenhuma dúvida corresponde ao filtro selecionado.</div>';
                return;
            }

            filteredComments.forEach(comment => {
                const card = document.createElement('div');
                card.className = `bg-white/5 border border-white/10 p-3 rounded-lg cursor-pointer transition-colors text-left flex flex-col gap-1.5 ${comment.id === selectedCommentId ? 'border-primary bg-red-500/5' : 'hover:border-slate-500 hover:bg-white/10'}`;

                const dateStr = new Date(comment.timestamp).toLocaleDateString('pt-BR');
                const moduleName = comment.key.replace('Apostila_', '').replace('_', ' Unidade ');
                const hasInstructorReply = comment.replies.some(r => r.authorRole === 'Instrutor');

                card.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-bold text-blue-400">${moduleName}</span>
                        <span class="text-[11px] text-slate-400">${dateStr}</span>
                    </div>
                    <strong class="text-sm text-white">${comment.studentName}</strong>
                    <div class="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">${comment.text}</div>
                    <div class="flex justify-between items-center mt-1 border-t border-dashed border-white/5 pt-1">
                        <span class="text-[11px] text-slate-400">${comment.replies.length} respostas</span>
                        ${hasInstructorReply 
                            ? '<span class="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-px rounded uppercase tracking-wider">✅ Respondido</span>' 
                            : '<span class="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-px rounded uppercase tracking-wider">⏳ Pendente</span>'}
                    </div>
                `;

                card.addEventListener('click', () => {
                    selectAdminForumComment(comment.id);
                });

                listContainer.appendChild(card);
            });
        }

        function selectAdminForumComment(commentId) {
            selectedCommentId = commentId;
            renderAdminForumList();

            const comment = adminForumComments.find(c => c.id === commentId);
            if (!comment) return;

            document.getElementById('forum-admin-empty-panel').style.display = 'none';
            const detailPanel = document.getElementById('forum-admin-detail-panel');
            detailPanel.style.display = 'flex';

            const moduleName = comment.key.replace('Apostila_', '').replace('_', ' Unidade ');
            document.getElementById('forum-detail-module-badge').textContent = moduleName;
            
            const initials = comment.studentName.trim().split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
            document.getElementById('forum-detail-avatar').textContent = initials;
            document.getElementById('forum-detail-name').textContent = comment.studentName;
            
            const dateStr = new Date(comment.timestamp).toLocaleDateString('pt-BR') + ' ' + new Date(comment.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            document.getElementById('forum-detail-email-date').textContent = `${comment.studentEmail} • ${dateStr}`;
            document.getElementById('forum-detail-text').textContent = comment.text;

            const repliesContainer = document.getElementById('forum-detail-replies');
            repliesContainer.innerHTML = '';
            
            if (comment.replies.length === 0) {
                repliesContainer.innerHTML = '<div class="text-center text-slate-400 text-sm p-2.5">Nenhuma resposta enviada ainda.</div>';
            } else {
                comment.replies.forEach(reply => {
                    const isInstructor = reply.authorRole === "Instrutor";
                    const replyInitials = reply.authorName.trim().split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
                    const replyDateStr = new Date(reply.timestamp).toLocaleDateString('pt-BR') + ' ' + new Date(reply.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

                    const isOwnReply = isInstructor;
                    let replyActionsHTML = `
                        <div class="ml-auto flex gap-2">
                            ${isOwnReply ? `<button class="btn-reply-action edit bg-transparent border-none text-green-200 text-xs cursor-pointer font-bold px-1 hover:text-green-100 transition-colors" onclick="editAdminReply('${comment.id}', '${reply.id}')">✏️</button>` : ''}
                            <button class="btn-reply-action delete bg-transparent border-none text-red-300 text-xs cursor-pointer font-bold px-1 hover:text-red-200 transition-colors" onclick="deleteAdminReply('${comment.id}', '${reply.id}')">🗑️</button>
                        </div>
                    `;

                    const replyCard = document.createElement('div');
                    replyCard.id = `reply-card-${reply.id}`;
                    replyCard.className = `reply-card bg-white/5 border ${isInstructor ? 'border-red-500/20 bg-red-500/5' : 'border-white/5'} rounded-lg p-3 flex flex-col gap-1.5 text-left`;

                    replyCard.innerHTML = `
                        <div class="reply-card-header flex items-center justify-between w-full gap-2">
                            <div class="flex items-center gap-2">
                                <div class="reply-avatar w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] text-white ${isInstructor ? 'bg-gradient-to-br from-primary to-purple-600' : 'bg-slate-600'} shadow-lg">${replyInitials}</div>
                                <span class="reply-author-name text-xs font-bold text-white flex items-center gap-1.5">
                                    ${reply.authorName}
                                    ${isInstructor ? '<span class="reply-badge bg-primary text-white text-[10px] font-black px-1.5 py-px rounded uppercase tracking-wider shadow-lg shadow-red-500/20">Instrutor</span>' : ''}
                                    <span class="text-[11px] text-slate-400 font-normal ml-1">${replyDateStr}</span>
                                </span>
                            </div>
                            ${replyActionsHTML}
                        </div>
                        <div class="reply-text text-sm text-slate-300" data-original-text="${reply.text.replace(/"/g, '&quot;')}">${reply.text}</div>
                    `;
                    repliesContainer.appendChild(replyCard);
                });
            }
        }

        document.getElementById('btn-forum-admin-reply').addEventListener('click', () => {
            if (!selectedCommentId) return;

            const textarea = document.getElementById('forum-reply-admin-text');
            const text = textarea.value.trim();
            if (text === "") {
                alert("Por favor, digite uma resposta para o aluno!");
                return;
            }

            fetch('/api/forum/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({
                    commentId: selectedCommentId,
                    authorName: 'Alan Marciano',
                    authorRole: 'Instrutor',
                    authorEmail: 'admin@lms.local',
                    text
                })
            })
            .then(res => {
                if (!res.ok) throw new Error("Erro ao enviar resposta.");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    textarea.value = '';
                    loadAdminForumDataAfterChange(selectedCommentId);
                }
            })
            .catch(err => alert(err.message));
        });

        document.getElementById('btn-forum-admin-delete-comment').addEventListener('click', () => {
            if (!selectedCommentId) return;
            if (!confirm("Deseja realmente excluir esta dúvida e todas as suas respostas? Esta ação é irreversível.")) return;

            fetch("/api/forum/comment/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": adminPassword
                },
                body: JSON.stringify({
                    commentId: selectedCommentId
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    selectedCommentId = null;
                    document.getElementById('forum-admin-detail-panel').style.display = 'none';
                    document.getElementById('forum-admin-empty-panel').style.display = 'flex';
                    
                    fetch(`/api/admin/forum/all`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': adminPassword
                        }
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            adminForumComments = data.comments || [];
                            renderAdminForumList();
                        }
                    });
                } else {
                    alert("Erro ao excluir: " + data.error);
                }
            })
            .catch(err => alert("Erro de conexão: " + err));
        });

        window.editAdminReply = function(commentId, replyId) {
            const replyCard = document.getElementById(`reply-card-${replyId}`);
            if (!replyCard) return;
            const textEl = replyCard.querySelector(".reply-text");
            if (!textEl) return;
            const originalText = textEl.getAttribute("data-original-text") || textEl.innerText;

            textEl.style.display = "none";

            let editor = replyCard.querySelector(".inline-editor");
            if (editor) editor.remove();

            editor = document.createElement("div");
            editor.className = "inline-editor";
            editor.innerHTML = `
                <textarea class="inline-editor-textarea w-full bg-black/30 border border-white/10 text-white p-2.5 rounded-lg font-inherit mt-1 resize-none outline-none h-[60px] text-sm focus:border-blue-500 transition-colors">${originalText}</textarea>
                <div class="flex gap-2 justify-end mt-1.5">
                    <button class="btn-inline-cancel bg-white/5 text-white border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer text-xs transition-colors hover:bg-white/10">Cancelar</button>
                    <button class="btn-inline-save bg-blue-600 hover:bg-blue-500 text-white border-none px-2.5 py-1 rounded-lg cursor-pointer font-bold text-xs shadow-lg shadow-blue-500/20 transition-colors">Salvar</button>
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
                    alert("A resposta não pode ser vazia.");
                    return;
                }

                fetch("/api/forum/reply/edit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": adminPassword
                    },
                    body: JSON.stringify({
                        commentId,
                        replyId,
                        text: newText
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        loadAdminForumDataAfterChange(commentId);
                    } else {
                        alert("Erro ao editar: " + data.error);
                    }
                })
                .catch(err => alert("Erro de conexão: " + err));
            });
        };

        window.deleteAdminReply = function(commentId, replyId) {
            if (!confirm("Deseja realmente excluir esta resposta?")) {
                return;
            }

            fetch("/api/forum/reply/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": adminPassword
                },
                body: JSON.stringify({
                    commentId,
                    replyId
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    loadAdminForumDataAfterChange(commentId);
                } else {
                    alert("Erro ao excluir: " + data.error);
                }
            })
            .catch(err => alert("Erro de conexão: " + err));
        };

        function loadAdminForumDataAfterChange(commentId) {
            fetch(`/api/admin/forum/all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    adminForumComments = data.comments || [];
                    renderAdminForumList();
                    selectAdminForumComment(commentId);
                }
            });
        }

        window.showOnlineStudentsModal = function() {
            const modal = document.getElementById('online-students-modal');
            const listContainer = document.getElementById('online-students-list');
            if (!modal || !listContainer) return;
            
            const onlineStudents = (typeof allStudentsCache !== 'undefined' && allStudentsCache)
                ? allStudentsCache.filter(s => s.isOnline)
                : [];
            
            if (onlineStudents.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center text-slate-400 py-10 px-5 flex flex-col items-center">
                        <span class="text-5xl block mb-3 opacity-50 grayscale">📭</span>
                        <p class="font-bold text-white text-lg">Nenhum aluno online no momento</p>
                        <p class="text-sm mt-1 text-slate-500">Os alunos aparecem aqui quando fazem login no portal.</p>
                    </div>
                `;
            } else {
                let html = '';
                onlineStudents.forEach(student => {
                    const initials = (student.name || 'Al').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const colors = [
                        ['from-blue-500', 'to-blue-700'],
                        ['from-green-500', 'to-green-700'],
                        ['from-purple-500', 'to-purple-700'],
                        ['from-amber-500', 'to-amber-700'],
                        ['from-pink-500', 'to-pink-700']
                    ];
                    const colorIndex = Math.abs(student.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                    const grad = colors[colorIndex];
                    
                    let lastAccessStr = 'Sem registro';
                    if (student.lastAccess) {
                        try {
                            const date = new Date(student.lastAccess);
                            lastAccessStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('pt-BR');
                        } catch (e) {
                            lastAccessStr = student.lastAccess;
                        }
                    }

                    html += `
                        <div class="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl transition-colors hover:bg-white/10 shadow-lg shadow-black/20">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="relative w-10 h-10 rounded-full bg-gradient-to-br ${grad[0]} ${grad[1]} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg">
                                    ${initials}
                                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                </div>
                                <div class="flex flex-col min-w-0 text-left">
                                    <span class="font-bold text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis">${student.name}</span>
                                    <span class="text-xs text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">${student.email}</span>
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-1 shrink-0">
                                <span class="text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded shadow-sm shadow-green-500/10 uppercase tracking-wider">Turma ${student.studentClass}</span>
                                <span class="text-[10px] text-slate-500">Acesso: ${lastAccessStr}</span>
                            </div>
                        </div>
                    `;
                });
                listContainer.innerHTML = html;
            }
            
            modal.style.display = 'flex';
        };

        // ====================================================
        // CONTROLLER DO EDITOR DE CONTEÚDO (PORTAL ADMIN)
        // ====================================================
        let editorCourseStructure = [];
        let currentEditingEvaluation = null; // Guardará o JSON da prova selecionada
        let tempFileToUpload = null;

        // Ativação das Sub-Abas do Editor
        document.querySelectorAll('.editor-subtab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.editor-subtab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'none';
                    b.style.color = 'var(--text-muted)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';

                document.querySelectorAll('.editor-subtab-content').forEach(c => {
                    c.style.display = 'none';
                    c.classList.add('hidden');
                });
                const targetSubtab = btn.getAttribute('data-subtab');
                const targetEl = document.getElementById(targetSubtab);
                targetEl.style.display = 'flex';
                targetEl.classList.remove('hidden');
                
                if (targetSubtab === 'subtab-apostilas') {
                    loadApostilaEditorData();
                } else if (targetSubtab === 'subtab-evaluations') {
                    loadEvaluationEditorData();
                }
            });
        });

        // Event listener do navbar principal para carregar o editor
        const btnEditorNavbar = document.querySelector('[data-tab="tab-editor"]');
        if (btnEditorNavbar) {
            btnEditorNavbar.addEventListener('click', () => {
                if (currentAdminCourseId) {
                    document.getElementById('editor-workspace').style.display = 'flex';
                    loadEditorCourseStructure(currentAdminCourseId);
                } else {
                    document.getElementById('editor-workspace').style.display = 'none';
                }
            });
        }

        const editorCourseSelect = document.getElementById('editor-course-select');
        if (editorCourseSelect) {
            editorCourseSelect.addEventListener('change', (e) => {
                const courseId = e.target.value;
                if (!courseId) {
                    document.getElementById('editor-workspace').style.display = 'none';
                    return;
                }
                document.getElementById('editor-workspace').style.display = 'flex';
                loadEditorCourseStructure(courseId);
            });
        }

        // 1. CARREGAR ESTRUTURA DO CURSO
        function loadEditorCourseStructure(courseId) {
            if (!courseId) return;
            fetch(`/api/admin/courses/${courseId}/structure`, {
                headers: { 'Authorization': adminPassword }
            })
            .then(res => res.json())
            .then(data => {
                editorCourseStructure = data.structure || [];
                renderEditorCourseTree();
                populateCourseStructureSelectors();
            })
            .catch(err => console.error("Erro ao carregar estrutura do curso:", err));
        }

        // Renderiza a Árvore Drag-and-Drop
        function renderEditorCourseTree() {
            const container = document.getElementById('editor-course-tree');
            if (!container) return;
            container.innerHTML = '';

            if (editorCourseStructure.length === 0) {
                container.innerHTML = '<div class="text-center text-slate-400 p-5">Nenhum módulo cadastrado.</div>';
                return;
            }

            editorCourseStructure.forEach((mod, modIdx) => {
                const modEl = document.createElement('div');
                modEl.className = 'module-tree-node bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 cursor-grab transition-colors hover:bg-white/10 shadow-lg shadow-black/20';
                modEl.setAttribute('draggable', 'true');
                modEl.setAttribute('data-module-idx', modIdx);
                
                modEl.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white text-[15px]">☰ ${mod.id} — ${mod.name}</span>
                        <div class="flex gap-1.5">
                            <button onclick="addUnitToStructure('${mod.id}')" class="bg-transparent border-none text-green-400 cursor-pointer text-sm hover:text-green-300 transition-colors" title="Adicionar Unidade">➕</button>
                            <button onclick="editModuleName('${mod.id}')" class="bg-transparent border-none text-blue-400 cursor-pointer text-sm hover:text-blue-300 transition-colors" title="Editar Nome">✏️</button>
                            <button onclick="deleteModuleFromStructure('${mod.id}')" class="bg-transparent border-none text-red-400 cursor-pointer text-sm hover:text-red-300 transition-colors" title="Excluir Módulo">🗑️</button>
                        </div>
                    </div>
                    <div class="units-tree-list flex flex-col gap-1.5 pl-4 mt-1">
                        <!-- Unidades do módulo -->
                    </div>
                `;

                const unitsContainer = modEl.querySelector('.units-tree-list');
                if (mod.units && mod.units.length > 0) {
                    mod.units.forEach((unit, unitIdx) => {
                        const unitEl = document.createElement('div');
                        unitEl.className = 'unit-tree-node bg-black/20 border border-white/10 rounded-lg py-2 px-3 flex justify-between items-center cursor-grab transition-colors hover:bg-black/30 shadow-md shadow-black/10';
                        unitEl.setAttribute('draggable', 'true');
                        unitEl.setAttribute('data-module-idx', modIdx);
                        unitEl.setAttribute('data-unit-idx', unitIdx);
                        
                        unitEl.innerHTML = `
                            <span class="text-[13px] text-slate-300">⁝⁝ Unidade ${unit.id}: ${unit.name}</span>
                            <div class="flex gap-2">
                                <button onclick="editUnitName('${mod.id}', '${unit.id}')" class="bg-transparent border-none text-blue-400 cursor-pointer text-xs hover:text-blue-300 transition-colors" title="Editar Nome">✏️</button>
                                <button onclick="deleteUnitFromStructure('${mod.id}', '${unit.id}')" class="bg-transparent border-none text-red-400 cursor-pointer text-xs hover:text-red-300 transition-colors" title="Excluir Unidade">🗑️</button>
                            </div>
                        `;

                        // Drag events para Unidades
                        unitEl.addEventListener('dragstart', (e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'unit', modIdx, unitIdx }));
                            unitEl.classList.add('dragging'); // #15
                        });
                        unitEl.addEventListener('dragend', () => { 
                            unitEl.classList.remove('dragging'); 
                        });
                        unitEl.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            unitEl.classList.add('drag-over'); // #15
                        });
                        unitEl.addEventListener('dragleave', () => {
                            unitEl.classList.remove('drag-over');
                        });
                        unitEl.addEventListener('drop', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            unitEl.classList.remove('drag-over');
                            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                            if (dragData.type === 'unit' && dragData.modIdx === modIdx) {
                                // Reordena unidades no mesmo módulo
                                const unitsArray = editorCourseStructure[modIdx].units;
                                const draggedItem = unitsArray.splice(dragData.unitIdx, 1)[0];
                                unitsArray.splice(unitIdx, 0, draggedItem);
                                
                                // Atualiza IDs sequenciais
                                unitsArray.forEach((u, index) => {
                                    u.id = (index + 1).toString();
                                });

                                saveEditorCourseStructureToServer();
                            }
                        });

                        unitsContainer.appendChild(unitEl);
                    });
                } else {
                    unitsContainer.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); padding: 5px;">Nenhuma unidade criada.</div>';
                }

                // Drag events para Módulos
                modEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'module', modIdx }));
                    modEl.classList.add('dragging'); // #15
                });
                modEl.addEventListener('dragend', () => { 
                    modEl.classList.remove('dragging'); 
                });
                modEl.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    modEl.classList.add('drag-over'); // #15
                });
                modEl.addEventListener('dragleave', () => {
                    modEl.classList.remove('drag-over');
                });
                modEl.addEventListener('drop', (e) => {
                    e.preventDefault();
                    modEl.classList.remove('drag-over');
                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (dragData.type === 'module') {
                        const draggedModule = editorCourseStructure.splice(dragData.modIdx, 1)[0];
                        editorCourseStructure.splice(modIdx, 0, draggedModule);
                        saveEditorCourseStructureToServer();
                    }
                });

                container.appendChild(modEl);
            });
        }

        // Salvar a Estrutura Geral no Servidor
        function saveEditorCourseStructureToServer() {
            const courseId = currentAdminCourseId;
            if (!courseId) return;

            fetch(`/api/admin/courses/${courseId}/structure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ structure: editorCourseStructure })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    loadEditorCourseStructure(courseId);
                } else {
                    alert("Erro ao salvar estrutura: " + data.error);
                }
            })
            .catch(err => alert("Erro ao conectar com o servidor: " + err));
        }

        // Popula os seletores das outras sub-abas
        function populateCourseStructureSelectors() {
            const modSelect = document.getElementById('new-unit-module-select');
            const apSelect = document.getElementById('editor-apostila-select');
            const evSelect = document.getElementById('editor-evaluation-select');

            if (modSelect) {
                modSelect.innerHTML = '';
                editorCourseStructure.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = m.name;
                    modSelect.appendChild(opt);
                });
            }

            if (apSelect) {
                const prevVal = apSelect.value;
                apSelect.innerHTML = '';
                editorCourseStructure.forEach(mod => {
                    mod.units.forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = u.apostilaKey;
                        opt.textContent = `${mod.id} > Unidade ${u.id}: ${u.name}`;
                        apSelect.appendChild(opt);
                    });
                });
                if (prevVal && Array.from(apSelect.options).some(o => o.value === prevVal)) {
                    apSelect.value = prevVal;
                }
            }

            if (evSelect) {
                const prevVal = evSelect.value;
                evSelect.innerHTML = '';
                editorCourseStructure.forEach(mod => {
                    mod.units.forEach(u => {
                        const opt = document.createElement('option');
                        opt.value = u.avaliacaoKey;
                        opt.textContent = `${mod.id} > Unidade ${u.id}: ${u.name}`;
                        evSelect.appendChild(opt);
                    });
                });
                if (prevVal && Array.from(evSelect.options).some(o => o.value === prevVal)) {
                    evSelect.value = prevVal;
                }
            }
        }

        // CRUD de Módulos
        document.getElementById('btn-create-module').addEventListener('click', () => {
            const idInput = document.getElementById('new-module-id');
            const nameInput = document.getElementById('new-module-name');
            const id = idInput.value.trim().toUpperCase();
            const name = nameInput.value.trim();

            if (!id || !name) {
                alert("Preencha todos os campos do Módulo!");
                return;
            }

            if (editorCourseStructure.some(m => m.id === id)) {
                alert("Um módulo com este ID já existe!");
                return;
            }

            editorCourseStructure.push({ id, name, units: [] });
            saveEditorCourseStructureToServer();

            idInput.value = '';
            nameInput.value = '';
            alert("Módulo criado com sucesso!");
        });

        window.addModuleToStructure = function() {
            const modId = prompt("Digite a Sigla/ID do novo módulo (ex: PROG):");
            if (!modId) return;
            const modName = prompt("Digite o nome completo do módulo:");
            if (!modName) return;

            // Checa se o ID já existe
            if (editorCourseStructure.some(m => m.id.toUpperCase() === modId.toUpperCase())) {
                alert("Já existe um módulo com esse ID.");
                return;
            }

            editorCourseStructure.push({
                id: modId.toUpperCase(),
                name: modName,
                units: []
            });

            saveEditorCourseStructureToServer();
        };

        window.addUnitToStructure = function(modId) {
            const mod = editorCourseStructure.find(m => m.id === modId);
            if (!mod) return;

            const unitName = prompt(`Digite o nome da nova Unidade para o módulo ${modId}:`);
            if (!unitName) return;

            const nextUnitId = mod.units.length > 0 ? (Math.max(...mod.units.map(u => parseInt(u.id) || 0)) + 1).toString() : "1";

            mod.units.push({
                id: nextUnitId,
                name: unitName,
                apostilaKey: `Apostila_${modId}_${nextUnitId}`,
                avaliacaoKey: `Avaliacao_${modId}_${nextUnitId}`,
                files: []
            });

            saveEditorCourseStructureToServer();
        };

        window.editModuleName = function(modId) {
            const target = editorCourseStructure.find(m => m.id === modId);
            if (!target) return;
            const newName = prompt("Digite o novo nome para o módulo:", target.name);
            if (newName && newName.trim() !== '') {
                target.name = newName.trim();
                saveEditorCourseStructureToServer();
            }
        };

        window.deleteModuleFromStructure = function(modId) {
            if (!confirm(`Deseja realmente EXCLUIR o módulo ${modId}?\n\nTodas as unidades e avaliações dentro deste módulo sumirão da grade.`)) {
                return;
            }
            editorCourseStructure = editorCourseStructure.filter(m => m.id !== modId);
            saveEditorCourseStructureToServer();
        };

        // CRUD de Unidades (Apostila + Avaliação)
        document.getElementById('btn-create-unit').addEventListener('click', () => {
            const courseId = currentAdminCourseId;
            const moduleId = document.getElementById('new-unit-module-select').value;
            const unitName = document.getElementById('new-unit-name').value.trim();

            if (!courseId || !moduleId || !unitName) {
                alert("Selecione o curso, o módulo e digite o nome da unidade!");
                return;
            }

            fetch('/api/admin/material/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ courseId, moduleId, unitName })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('new-unit-name').value = '';
                    alert("Nova unidade e prova criadas com sucesso!");
                    loadEditorCourseStructure(courseId);
                } else {
                    alert("Erro ao criar unidade: " + data.error);
                }
            })
            .catch(err => alert("Erro ao conectar com o servidor: " + err));
        });

        window.editUnitName = function(modId, unitId) {
            const mod = editorCourseStructure.find(m => m.id === modId);
            if (!mod) return;
            const unit = mod.units.find(u => u.id === unitId);
            if (!unit) return;

            const newName = prompt("Digite o novo nome para a unidade:", unit.name);
            if (newName && newName.trim() !== '') {
                unit.name = newName.trim();
                saveEditorCourseStructureToServer();
            }
        };

        window.deleteUnitFromStructure = function(modId, unitId) {
            if (!confirm("Deseja remover esta unidade da grade? O arquivo correspondente continuará no servidor, mas ela não aparecerá mais para os alunos.")) {
                return;
            }
            const mod = editorCourseStructure.find(m => m.id === modId);
            if (!mod) return;
            
            mod.units = mod.units.filter(u => u.id !== unitId);
            
            // Re-indexa IDs sequenciais
            mod.units.forEach((u, idx) => {
                u.id = (idx + 1).toString();
            });

            saveEditorCourseStructureToServer();
        };


        // ====================================================
        // 2. CONTROLLER DA SUB-ABA APOSTILAS
        // ====================================================
        const apSelect = document.getElementById('editor-apostila-select');
        const markdownTextarea = document.getElementById('editor-markdown-text');
        const livePreviewContent = document.getElementById('editor-live-preview-content');
        
        let easyMDE = null;

        if (apSelect) {
            apSelect.addEventListener('change', () => {
                loadApostilaEditorData();
            });
        }

        function initEasyMDE() {
            if (easyMDE) return;
            easyMDE = new EasyMDE({
                element: markdownTextarea,
                spellChecker: false,
                autofocus: true,
                placeholder: "Escreva o conteúdo da sua apostila aqui usando Markdown...",
                toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen", "|", "guide"],
                uploadImage: true,
                imageUploadFunction: function(file, onSuccess, onError) {
                    const formData = new FormData();
                    formData.append('image', file);

                    fetch('/api/admin/upload-image', {
                        method: 'POST',
                        headers: {
                            'Authorization': adminPassword
                        },
                        body: formData
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            onSuccess(data.url);
                        } else {
                            onError(data.error);
                        }
                    })
                    .catch(err => onError(err.toString()));
                }
            });

            easyMDE.codemirror.on("change", () => {
                markdownTextarea.value = easyMDE.value();
                renderApostilaLivePreview();
            });
        }

        // Initialize EasyMDE when subtab-apostilas is clicked
        document.querySelector('[data-subtab="subtab-apostilas"]').addEventListener('click', () => {
            setTimeout(() => {
                initEasyMDE();
            }, 100);
        });

        function loadApostilaEditorData() {
            const key = apSelect.value;
            if (!key) return;

            // Busca o arquivo .md diretamente do servidor para pegar o raw markdown mais atualizado
            fetch(`/${key}.md`)
            .then(res => {
                if (!res.ok) return "# Escreva aqui...\n";
                return res.text();
            })
            .then(text => {
                if(easyMDE) easyMDE.value(text);
                else markdownTextarea.value = text;
                
                renderApostilaLivePreview();
                renderAttachmentsList();
            })
            .catch(() => {
                const defaultText = "# Nova Apostila\n\nComece a digitar...";
                if(easyMDE) easyMDE.value(defaultText);
                else markdownTextarea.value = defaultText;
                
                renderApostilaLivePreview();
                renderAttachmentsList();
            });
        }

        function renderApostilaLivePreview() {
            const textToRender = easyMDE ? easyMDE.value() : markdownTextarea.value;
            if (typeof marked !== 'undefined') {
                livePreviewContent.innerHTML = marked.parse(textToRender);
            } else {
                livePreviewContent.textContent = textToRender;
            }
        }

        // Salvar Apostila
        document.getElementById('btn-save-apostila').addEventListener('click', () => {
            const key = apSelect.value;
            const markdownText = easyMDE ? easyMDE.value() : markdownTextarea.value;

            if (!key) return;

            fetch(`/api/admin/material/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ markdownText })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Apostila salva com sucesso!");
                } else {
                    alert("Erro ao salvar: " + data.error);
                }
            })
            .catch(err => alert("Erro ao salvar apostila no servidor: " + err));
        });

        const fileInput = document.getElementById('editor-file-upload-input');
        const fileNameDiv = document.getElementById('editor-file-upload-name');
        tempFileToUpload = null;

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    tempFileToUpload = e.target.files[0];
                    fileNameDiv.textContent = tempFileToUpload.name;
                } else {
                    tempFileToUpload = null;
                    fileNameDiv.textContent = 'Nenhum arquivo selecionado.';
                }
            });
        }

        // Upload de Arquivo
        document.getElementById('btn-upload-file').addEventListener('click', () => {
            const key = apSelect.value;
            if (!key) return;

            if (!tempFileToUpload) {
                alert("Escolha um arquivo primeiro!");
                return;
            }

            const formData = new FormData();
            formData.append('file', tempFileToUpload);
            formData.append('apostilaKey', key);

            fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': adminPassword
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Upload concluído!");
                    tempFileToUpload = null;
                    fileInput.value = '';
                    fileNameDiv.textContent = 'Nenhum arquivo selecionado.';
                    
                    // Atualiza a estrutura local na memória para manter o sincronismo
                    updateLocalUnitFiles(key, data.files);
                    renderAttachmentsList();
                } else {
                    alert("Erro no upload: " + data.error);
                }
            })
            .catch(err => alert("Erro ao fazer upload do arquivo: " + err));
        });

        // Adicionar Link
        document.getElementById('btn-add-link').addEventListener('click', () => {
            const key = apSelect.value;
            const nameInput = document.getElementById('editor-link-name');
            const urlInput = document.getElementById('editor-link-url');
            
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();

            if (!key) return;
            if (!name || !url) {
                alert("Preencha o título e o endereço do link!");
                return;
            }

            fetch('/api/admin/material/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ apostilaKey: key, name, url })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    nameInput.value = '';
                    urlInput.value = '';
                    alert("Link adicionado!");
                    updateLocalUnitFiles(key, data.files);
                    renderAttachmentsList();
                } else {
                    alert("Erro ao adicionar link: " + data.error);
                }
            })
            .catch(err => alert("Erro ao cadastrar link no servidor: " + err));
        });

        function updateLocalUnitFiles(apostilaKey, files) {
            editorCourseStructure.forEach(mod => {
                mod.units.forEach(u => {
                    if (u.apostilaKey === apostilaKey) {
                        u.files = files;
                    }
                });
            });
        }

        // Renderiza lista de anexos
        function renderAttachmentsList() {
            const key = apSelect.value;
            const container = document.getElementById('editor-attachments-list');
            if (!container || !key) return;
            container.innerHTML = '';

            let filesList = [];
            editorCourseStructure.forEach(mod => {
                mod.units.forEach(u => {
                    if (u.apostilaKey === key) {
                        filesList = u.files || [];
                    }
                });
            });

            if (filesList.length === 0) {
                container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted);">Nenhum arquivo ou link vinculado a esta unidade.</span>';
                return;
            }

            filesList.forEach(f => {
                const item = document.createElement('div');
                item.style.cssText = 'background: rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;';
                
                const typeIcon = f.type === 'pdf' ? '📄' : (f.type === 'image' ? '🖼️' : '🔗');
                item.innerHTML = `
                    <span style="color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;">
                        ${typeIcon} <strong>${f.name}</strong>
                    </span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <a href="${f.path}" target="_blank" style="color: #60a5fa; text-decoration: none;">Visualizar</a>
                        <button onclick="deleteUnitAttachment('${key}', '${f.id}')" style="background: none; border: none; color: #f87171; cursor: pointer;">✕</button>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        window.deleteUnitAttachment = function(apostilaKey, fileId) {
            if (!confirm("Deseja realmente remover este recurso?")) return;

            fetch('/api/admin/material/delete-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ apostilaKey, fileId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Recurso excluído com sucesso!");
                    updateLocalUnitFiles(apostilaKey, data.files);
                    renderAttachmentsList();
                } else {
                    alert("Erro ao excluir recurso: " + data.error);
                }
            })
            .catch(err => alert("Erro de conexão ao remover recurso: " + err));
        };


        // ====================================================
        // 3. CONTROLLER DA SUB-ABA AVALIAÇÕES (QUESTÕES)
        // ====================================================
        const evSelect = document.getElementById('editor-evaluation-select');
        const evalTitleInput = document.getElementById('editor-eval-title-input');
        const evalThemeInput = document.getElementById('editor-eval-theme-input');
        const evalRubricInput = document.getElementById('editor-eval-rubric-input');

        if (evSelect) {
            evSelect.addEventListener('change', () => {
                loadEvaluationEditorData();
            });
        }

        function loadEvaluationEditorData() {
            const key = evSelect.value;
            if (!key) return;

            fetch(`/api/admin/evaluation/${key}`, {
                headers: {
                    'Authorization': adminPassword
                }
            })
            .then(res => res.json())
            .then(evaluation => {
                currentEditingEvaluation = evaluation;
                
                evalTitleInput.value = evaluation.title || '';
                evalThemeInput.value = evaluation.theme || '';
                evalRubricInput.value = evaluation.rubric || '';

                renderEvaluationQuestionsList();
                resetQuestionForm();
            })
            .catch(err => {
                console.error("Erro ao carregar dados da avaliação:", err);
                alert("Falha ao abrir editor de avaliação estruturado.");
            });
        }

        // Renders questions list in the admin evaluation editor
        function renderEvaluationQuestionsList() {
            const container = document.getElementById('editor-questions-list-container');
            const countSpan = document.getElementById('editor-questions-count');
            if (!container || !currentEditingEvaluation) return;

            container.innerHTML = '';
            const questions = currentEditingEvaluation.questions || [];
            countSpan.textContent = questions.length;

            if (questions.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma questão cadastrada para esta prova. Use o formulário à direita para cadastrar.</div>';
                return;
            }

            questions.forEach((q, idx) => {
                const card = document.createElement('div');
                card.className = 'editor-question-card';
                card.setAttribute('draggable', 'true');
                card.setAttribute('data-question-idx', idx);
                card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 15px; display: flex; flex-direction: column; gap: 8px; cursor: grab; transition: background 0.2s; position: relative;';

                let altsHtml = '';
                if (q.alternatives && q.alternatives.length > 0) {
                    altsHtml = q.alternatives.map(alt => {
                        const isCorrect = alt.isCorrect === true || q.correctAnswer === alt.letter;
                        return `<li style="font-size: 0.8rem; color: ${isCorrect ? 'var(--success)' : '#cbd5e1'}; font-weight: ${isCorrect ? 'bold' : 'normal'};"><strong>${alt.letter})</strong> ${alt.text} ${isCorrect ? '✅' : ''}</li>`;
                    }).join('');
                }

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                        <span style="font-weight: bold; font-size: 0.85rem; color: white;">Questão ${idx + 1} (Peso: ${q.weight || 1.0})</span>
                        <div style="display: flex; gap: 8px; cursor: default;">
                            <button onclick="editQuestionInForm(${idx})" style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 0.85rem;" title="Editar Questão">✏️ Editar</button>
                            <button onclick="deleteQuestionFromEvaluation(${idx})" style="background: none; border: none; color: #f87171; cursor: pointer; font-size: 0.85rem;" title="Excluir Questão">🗑️ Excluir</button>
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; color: #cbd5e1; white-space: pre-wrap; word-break: break-all; margin-top: 4px;">${q.text}</div>
                    <ul style="list-style: none; padding-left: 10px; margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                        ${altsHtml}
                    </ul>
                `;

                // Question drag events
                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'question', idx }));
                    card.classList.add('dragging');
                });
                card.addEventListener('dragend', () => { 
                    card.classList.remove('dragging'); 
                });
                card.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    card.classList.add('drag-over'); // #15
                });
                card.addEventListener('dragleave', () => {
                    card.classList.remove('drag-over');
                });
                card.addEventListener('drop', (e) => {
                    e.preventDefault();
                    card.classList.remove('drag-over');
                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (dragData.type === 'question') {
                        const draggedQ = currentEditingEvaluation.questions.splice(dragData.idx, 1)[0];
                        currentEditingEvaluation.questions.splice(idx, 0, draggedQ);
                        
                        // Atualiza os originalNumbers sequencialmente
                        currentEditingEvaluation.questions.forEach((question, index) => {
                            question.originalNumber = index + 1;
                        });

                        renderEvaluationQuestionsList();
                    }
                });

                container.appendChild(card);
            });
        }

        // CRUD de Questões no Formulário
        document.getElementById('btn-save-question-to-list').addEventListener('click', () => {
            if (!currentEditingEvaluation) return;

            const textInput = document.getElementById('question-text-input');
            const weightInput = document.getElementById('question-weight-input');
            const editIndexInput = document.getElementById('edit-question-index');

            const altA = document.getElementById('alt-a-input').value.trim();
            const altB = document.getElementById('alt-b-input').value.trim();
            const altC = document.getElementById('alt-c-input').value.trim();
            const altD = document.getElementById('alt-d-input').value.trim();

            const correctRadio = document.querySelector('input[name="correct-alt-radio"]:checked');
            const correctLetter = correctRadio ? correctRadio.value : 'A';

            const text = textInput.value.trim();
            const weight = parseFloat(weightInput.value) || 1.0;
            const editIdx = parseInt(editIndexInput.value);

            if (!text || !altA || !altB || !altC || !altD) {
                alert("Preencha o enunciado e todas as 4 alternativas!");
                return;
            }

            const alternatives = [
                { letter: 'A', text: altA, isCorrect: correctLetter === 'A' },
                { letter: 'B', text: altB, isCorrect: correctLetter === 'B' },
                { letter: 'C', text: altC, isCorrect: correctLetter === 'C' },
                { letter: 'D', text: altD, isCorrect: correctLetter === 'D' }
            ];

            const questionData = {
                text,
                weight,
                alternatives,
                correctAnswer: correctLetter
            };

            if (editIdx === -1) {
                // Adiciona nova
                questionData.originalNumber = (currentEditingEvaluation.questions.length + 1);
                currentEditingEvaluation.questions.push(questionData);
            } else {
                // Atualiza existente
                questionData.originalNumber = editIdx + 1;
                currentEditingEvaluation.questions[editIdx] = questionData;
            }

            renderEvaluationQuestionsList();
            resetQuestionForm();
        });

        window.editQuestionInForm = function(idx) {
            if (!currentEditingEvaluation || !currentEditingEvaluation.questions[idx]) return;
            const q = currentEditingEvaluation.questions[idx];

            document.getElementById('question-text-input').value = q.text;
            document.getElementById('question-weight-input').value = q.weight || 1.0;
            document.getElementById('edit-question-index').value = idx;

            document.getElementById('alt-a-input').value = q.alternatives[0] ? q.alternatives[0].text : '';
            document.getElementById('alt-b-input').value = q.alternatives[1] ? q.alternatives[1].text : '';
            document.getElementById('alt-c-input').value = q.alternatives[2] ? q.alternatives[2].text : '';
            document.getElementById('alt-d-input').value = q.alternatives[3] ? q.alternatives[3].text : '';

            // Seleciona o radio da alternativa correta
            let correctLetter = q.correctAnswer || 'A';
            const foundCorrect = q.alternatives.find(alt => alt.isCorrect === true);
            if (foundCorrect) correctLetter = foundCorrect.letter;

            const radio = document.querySelector(`input[name="correct-alt-radio"][value="${correctLetter}"]`);
            if (radio) radio.checked = true;

            document.getElementById('form-question-title').textContent = `✏️ Editar Questão ${idx + 1}`;
            document.getElementById('btn-cancel-question-edit').style.display = 'block';
            document.getElementById('btn-save-question-to-list').textContent = 'Salvar Alterações';
        };

        window.deleteQuestionFromEvaluation = function(idx) {
            if (!confirm(`Deseja realmente excluir a questão ${idx + 1}?`)) return;
            currentEditingEvaluation.questions.splice(idx, 1);
            
            // Re-ordena originalNumbers
            currentEditingEvaluation.questions.forEach((q, index) => {
                q.originalNumber = index + 1;
            });

            renderEvaluationQuestionsList();
        };

        document.getElementById('btn-cancel-question-edit').addEventListener('click', resetQuestionForm);

        function resetQuestionForm() {
            document.getElementById('question-text-input').value = '';
            document.getElementById('question-weight-input').value = '1.0';
            document.getElementById('edit-question-index').value = '-1';
            
            document.getElementById('alt-a-input').value = '';
            document.getElementById('alt-b-input').value = '';
            document.getElementById('alt-c-input').value = '';
            document.getElementById('alt-d-input').value = '';

            const radioA = document.querySelector('input[name="correct-alt-radio"][value="A"]');
            if (radioA) radioA.checked = true;

            document.getElementById('form-question-title').textContent = '➕ Adicionar Nova Questão';
            document.getElementById('btn-cancel-question-edit').style.display = 'none';
            document.getElementById('btn-save-question-to-list').textContent = 'Adicionar à Lista';
        }

        // Salvar Avaliação Completa
        document.getElementById('btn-save-evaluation').addEventListener('click', () => {
            const key = evSelect.value;
            if (!key || !currentEditingEvaluation) return;

            currentEditingEvaluation.title = evalTitleInput.value.trim();
            currentEditingEvaluation.theme = evalThemeInput.value.trim();
            currentEditingEvaluation.rubric = evalRubricInput.value.trim();

            if (!currentEditingEvaluation.title) {
                alert("O título da avaliação é obrigatório!");
                return;
            }

            fetch(`/api/admin/evaluation/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify(currentEditingEvaluation)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Avaliação salva com sucesso!");
                    loadEvaluationEditorData();
                } else {
                    alert("Erro ao salvar avaliação: " + data.error);
                }
            })
            .catch(err => alert("Erro de conexão ao salvar avaliação: " + err));
        });

        // Duplicar Avaliação
        document.getElementById('btn-duplicate-evaluation').addEventListener('click', () => {
            const sourceKey = evSelect.value;
            const targetTitle = document.getElementById('duplicate-target-title').value.trim();
            const targetKey = document.getElementById('duplicate-target-key').value.trim();

            if (!sourceKey || !targetTitle || !targetKey) {
                alert("Preencha a chave e o título da nova prova!");
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(targetKey)) {
                alert("A chave da prova deve conter apenas letras, números e underline (Ex: Avaliacao_FECOP_2_Extra)");
                return;
            }

            fetch('/api/admin/evaluation/duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ sourceKey, targetKey, targetTitle })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('duplicate-target-title').value = '';
                    document.getElementById('duplicate-target-key').value = '';
                    alert("Prova duplicada com sucesso!");
                    
                    // Recarrega a estrutura do curso para carregar novas chaves criadas
                    loadEditorCourseStructure();
                } else {
                    alert("Erro ao duplicar: " + data.error);
                }
            })
            .catch(err => alert("Erro ao duplicar prova: " + err));
        });

        // --- CURSOS & BRANDING ---

        function loadBrandingAndCourses() {
            // Fetch Branding
            fetch('/api/branding')
                .then(res => res.json())
                .then(branding => {
                    document.getElementById('branding-name').value = branding.institutionName || '';
                    document.getElementById('branding-color').value = branding.primaryColor || '#ef4444';
                    document.getElementById('branding-color-picker').value = branding.primaryColor || '#ef4444';
                });

            // Fetch Courses
            fetch('/api/courses')
                .then(res => res.json())
                .then(courses => {
                    allCoursesCache = Array.isArray(courses) ? courses : [];

                    const container = document.getElementById('course-list-container');
                    container.innerHTML = '';
                    
                    const select = document.getElementById('create-class-course');
                    if (select) {
                        select.innerHTML = '<option value="">Selecione um curso...</option>';
                    }
                    
                    const editorSelect = document.getElementById('editor-course-select');
                    if (editorSelect) {
                        editorSelect.innerHTML = '<option value="">-- Escolha um curso --</option>';
                    }

                    const filterStudentSelect = document.getElementById('filter-students-course');
                    if (filterStudentSelect) {
                        filterStudentSelect.innerHTML = '<option value="">Todos os Cursos</option>';
                    }

                    const filterSubmissionSelect = document.getElementById('filter-submission-course');
                    if (filterSubmissionSelect) {
                        filterSubmissionSelect.innerHTML = '<option value="">Todos os Cursos</option>';
                    }

                    allCoursesCache.forEach(c => {
                        const div = document.createElement('div');
                        div.className = 'bg-black/30 border border-slate-700 p-4 rounded-xl flex flex-col gap-2 hover:border-primary transition-all';
                        div.innerHTML = `
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="text-xs text-slate-400 font-mono">${c.id}</div>
                                    <div class="text-sm font-bold text-white mt-1">${c.name}</div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="editCourse('${c.id}', '${c.name.replace(/'/g, "\\'")}')" class="text-blue-400 hover:text-blue-300 text-xs font-bold">Editar</button>
                                </div>
                            </div>
                            <div class="text-xs text-slate-500 mt-2">${c.structure ? c.structure.length : 0} Módulos</div>
                        `;
                        container.appendChild(div);

                        if (select) {
                            const option = document.createElement('option');
                            option.value = c.id;
                            option.textContent = c.name;
                            select.appendChild(option);
                        }
                        
                        if (editorSelect) {
                            const option = document.createElement('option');
                            option.value = c.id;
                            option.textContent = c.name;
                            editorSelect.appendChild(option);
                        }

                        if (filterStudentSelect) {
                            const option = document.createElement('option');
                            option.value = c.id;
                            option.textContent = c.name;
                            filterStudentSelect.appendChild(option);
                        }

                        if (filterSubmissionSelect) {
                            const option = document.createElement('option');
                            option.value = c.id;
                            option.textContent = c.name;
                            filterSubmissionSelect.appendChild(option);
                        }
                    });

                    updateIndexAdminDashboard();
                });
        }

        document.getElementById('branding-color-picker').addEventListener('input', (e) => {
            document.getElementById('branding-color').value = e.target.value.toUpperCase();
        });

        document.getElementById('btn-save-branding').addEventListener('click', () => {
            const institutionName = document.getElementById('branding-name').value.trim();
            const primaryColor = document.getElementById('branding-color').value.trim();
            
            fetch('/api/branding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ institutionName, primaryColor })
            }).then(res => res.json()).then(data => {
                if (data.success) {
                    alert('Branding atualizado com sucesso!');
                    document.documentElement.style.setProperty('--primary-color', primaryColor);
                } else {
                    alert('Erro ao salvar branding.');
                }
            });
        });

        document.getElementById('btn-show-create-course').addEventListener('click', () => {
            document.getElementById('create-course-form').classList.remove('hidden');
            document.getElementById('course-id').value = '';
            document.getElementById('course-name').value = '';
            document.getElementById('course-id').readOnly = false;
        });

        document.getElementById('btn-cancel-course').addEventListener('click', () => {
            document.getElementById('create-course-form').classList.add('hidden');
        });

        window.editCourse = function(id, name) {
            document.getElementById('create-course-form').classList.remove('hidden');
            document.getElementById('course-id').value = id;
            document.getElementById('course-name').value = name;
            document.getElementById('course-id').readOnly = true; // Não permite editar ID
        };

        document.getElementById('btn-save-course').addEventListener('click', () => {
            const id = document.getElementById('course-id').value.trim();
            const name = document.getElementById('course-name').value.trim();
            const isEdit = document.getElementById('course-id').readOnly;

            if (!id || !name) return alert('Preencha ID e Nome');

            const method = isEdit ? 'PUT' : 'POST';
            const url = isEdit ? `/api/courses/${id}` : `/api/courses`;

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': adminPassword
                },
                body: JSON.stringify({ id, name })
            }).then(res => res.json()).then(data => {
                if (data.success) {
                    alert('Curso salvo com sucesso!');
                    document.getElementById('create-course-form').classList.add('hidden');
                    loadBrandingAndCourses();
                    refreshDashboard();
                } else {
                    alert('Erro: ' + data.error);
                }
            });
        });

        // Call it when admin logs in
        const originalAdminLoginSuccess = window.onAdminLoginSuccess || function(){};
        window.onAdminLoginSuccess = function() {
            originalAdminLoginSuccess();
            loadBrandingAndCourses();
        };        // ====================================================
        // ATTENDANCE MANAGEMENT (DIÁRIO DE CLASSE)
        // ====================================================
        const attendanceClassSelect = document.getElementById('attendance-class-select');
        const attendanceWorkspace = document.getElementById('attendance-workspace');
        const attendanceEmptyState = document.getElementById('attendance-empty-state');
        let currentLessonId = null;

        function refreshAttendanceTab() {
            if (!allClassesCache || allClassesCache.length === 0) return;
            
            const currentVal = attendanceClassSelect.value;
            let optionsHtml = '<option value="">Selecione uma Turma...</option>';
            allClassesCache.forEach(cls => {
                optionsHtml += `<option value="${cls.name}">${cls.name} (${cls.period})</option>`;
            });
            attendanceClassSelect.innerHTML = optionsHtml;
            attendanceClassSelect.value = currentVal;

            if (currentVal) {
                currentAttendanceClass = allClassesCache.find(c => c.name === currentVal);
                attendanceWorkspace.style.display = 'flex';
                attendanceEmptyState.style.display = 'none';
                loadAttendanceLessons();
            } else {
                attendanceWorkspace.style.display = 'none';
                attendanceEmptyState.style.display = 'block';
            }
        }

        if (attendanceClassSelect) {
            attendanceClassSelect.addEventListener('change', refreshAttendanceTab);
        }

        function loadAttendanceLessons() {
            if (!currentAttendanceClass) return;
            
            document.getElementById('attendance-lessons-view').style.display = 'block';
            document.getElementById('attendance-form-view').style.display = 'none';
            
            fetch(`/api/admin/attendance/lessons?className=${currentAttendanceClass.name}&courseId=${currentAttendanceClass.courseId}&password=${adminPassword}`)
            .then(res => res.json())
            .then(lessons => {
                const grid = document.getElementById('lessons-grid');
                if (lessons.length === 0) {
                    grid.innerHTML = '<div class="col-span-full text-slate-500 py-4 italic">Nenhuma chamada registrada para esta turma.</div>';
                    return;
                }
                
                grid.innerHTML = lessons.map(lesson => {
                    const [y, m, d] = lesson.date.split('-');
                    const attendances = lesson.attendances || {};
                    let presents = 0, absences = 0;
                    Object.values(attendances).forEach(status => {
                        if (status === 'presente' || status === 'justificado' || status === 'atraso') presents++;
                        else absences++;
                    });
                    
                    return `
                        <div class="bg-black/20 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all cursor-pointer" onclick="openLesson('${lesson.id}', '${lesson.date}', '${lesson.topic}', '${encodeURIComponent(JSON.stringify(lesson.attendances))}')">
                            <div class="text-sm font-mono text-slate-400 mb-1">${d}/${m}/${y}</div>
                            <div class="font-bold text-white mb-2 truncate" title="${lesson.topic || 'Sem Assunto'}">${lesson.topic || 'Aula sem assunto'}</div>
                            <div class="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
                                <span class="bg-green-500/10 text-green-400 px-2 py-1 rounded">Válidas: ${presents}</span>
                                <span class="bg-red-500/10 text-red-400 px-2 py-1 rounded">Faltas: ${absences}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            });
        }

        document.getElementById('btn-new-lesson').addEventListener('click', () => {
            currentLessonId = null;
            document.getElementById('lesson-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('lesson-topic').value = '';
            renderRollcallTable({});
            
            document.getElementById('attendance-lessons-view').style.display = 'none';
            document.getElementById('attendance-form-view').style.display = 'block';
        });

        document.getElementById('btn-cancel-lesson').addEventListener('click', () => {
            loadAttendanceLessons();
        });

        window.openLesson = function(id, date, topic, encodedAttendances) {
            currentLessonId = id;
            document.getElementById('lesson-date').value = date;
            document.getElementById('lesson-topic').value = topic;
            
            let att = {};
            try { att = JSON.parse(decodeURIComponent(encodedAttendances)); } catch(e){}
            renderRollcallTable(att);
            
            document.getElementById('attendance-lessons-view').style.display = 'none';
            document.getElementById('attendance-form-view').style.display = 'block';
        };

        function renderRollcallTable(attendances) {
            const tbody = document.getElementById('rollcall-table-body');
            const studentsInClass = allStudentsCache.filter(s => s.studentClass === currentAttendanceClass.name);
            
            if (studentsInClass.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" class="text-center py-4 text-slate-500 text-sm">Nenhum aluno matriculado.</td></tr>';
                return;
            }
            
            studentsInClass.sort((a, b) => a.name.localeCompare(b.name));
            
            tbody.innerHTML = studentsInClass.map(s => {
                const status = attendances[s.email] || 'presente'; // default is presente
                return `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="p-4 align-middle">
                            <strong class="text-white">${s.name}</strong><br>
                            <span class="text-xs text-slate-400">${s.email}</span>
                        </td>
                        <td class="p-4 align-middle text-center">
                            <select class="rollcall-select bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none w-full" data-email="${s.email}">
                                <option value="presente" ${status === 'presente' ? 'selected' : ''}>Presente</option>
                                <option value="falta" ${status === 'falta' ? 'selected' : ''}>Falta</option>
                                <option value="justificado" ${status === 'justificado' ? 'selected' : ''}>Falta Justificada</option>
                                <option value="atraso" ${status === 'atraso' ? 'selected' : ''}>Atraso</option>
                            </select>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Apply colors based on selection
            tbody.querySelectorAll('.rollcall-select').forEach(sel => {
                updateRollcallSelectColor(sel);
                sel.addEventListener('change', (e) => updateRollcallSelectColor(e.target));
            });
        }
        
        function updateRollcallSelectColor(selectEl) {
            selectEl.classList.remove('text-green-400', 'text-red-400', 'text-yellow-400', 'text-blue-400');
            if (selectEl.value === 'presente') selectEl.classList.add('text-green-400');
            else if (selectEl.value === 'falta') selectEl.classList.add('text-red-400');
            else if (selectEl.value === 'justificado') selectEl.classList.add('text-yellow-400');
            else if (selectEl.value === 'atraso') selectEl.classList.add('text-blue-400');
        }

        document.getElementById('btn-save-lesson').addEventListener('click', () => {
            const date = document.getElementById('lesson-date').value;
            const topic = document.getElementById('lesson-topic').value;
            
            if (!date) {
                alert('A data da aula é obrigatória!');
                return;
            }
            
            const attendances = {};
            document.querySelectorAll('.rollcall-select').forEach(sel => {
                attendances[sel.getAttribute('data-email')] = sel.value;
            });
            
            fetch('/api/admin/attendance/lesson/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': adminPassword },
                body: JSON.stringify({
                    id: currentLessonId,
                    className: currentAttendanceClass.name,
                    courseId: currentAttendanceClass.courseId,
                    date,
                    topic,
                    attendances
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    loadAttendanceLessons();
                } else {
                    alert('Erro ao salvar: ' + data.error);
                }
            })
            .catch(e => alert('Erro: ' + e));
        });

        // Hook refreshAttendanceTab into refreshDashboard
        const originalRefresh = window.refreshDashboard;
        window.refreshDashboard = function() {
            if (originalRefresh) originalRefresh();
            const attendanceTabBtn = document.querySelector('.tab-btn[data-tab="tab-attendance"]');
            if (attendanceTabBtn && attendanceTabBtn.classList.contains('active')) {
                refreshAttendanceTab();
            }
        };

    
