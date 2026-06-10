const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Caminhos dos arquivos de banco de dados locais legados
const DB_STUDENTS_FILE = path.join(__dirname, '../data/db_students.json');
const DB_CLASSES_FILE = path.join(__dirname, '../data/db_classes.json');
const DB_SUBMISSIONS_FILE = path.join(__dirname, '../data/db_submissions.json');
const DB_NOTES_FILE = path.join(__dirname, '../data/db_notes.json');
const DB_ANNOTATIONS_FILE = path.join(__dirname, '../data/db_annotations.json');
const DB_FORUM_FILE = path.join(__dirname, '../data/db_forum.json');
const CONFIG_FILE = path.join(__dirname, '../data/config.json');
const DB_COURSE_STRUCTURE_FILE = path.join(__dirname, '../data/db_course_structure.json');
const DB_EVALUATIONS_FILE = path.join(__dirname, '../data/db_evaluations.json');
const DB_PROGRESS_FILE = path.join(__dirname, '../data/db_progress.json');
const DB_UPLOADS_FILE = path.join(__dirname, '../data/db_uploads.json');
const DB_ADMINS_FILE = path.join(__dirname, '../data/db_admins.json');

// Conexão com SQLite
const dbPath = path.join(__dirname, '../data/database.db');
const sqliteDb = new sqlite3.Database(dbPath);

let memoryDB = {
    students: [],
    classes: [],
    courses: [], // Novo: multi-cursos
    branding: {}, // Novo: white-label
    submissions: [],
    notes: {},
    annotations: {},
    forum: [],
    config: { releasedItems: {} },
    courseStructure: [], // Em breve obsoleto, migrado para courses
    evaluations: {},
    progress: {},
    uploads: {},
    admins: [],
    sessions: {} // Alunos online { "email": last_ping_timestamp }
};

let writeQueue = false;

// Parser legado de Markdown para Avaliações (usado na migração)
function parseEvaluationMarkdown(markdownText, examKey) {
    if (!markdownText) return null;

    const titleMatch = markdownText.match(/^#\s+(.+)$/m);
    const themeMatch = markdownText.match(/\*\*Tema:\*\*\s*(.+)/);
    const title = titleMatch ? titleMatch[1].replace(/📝\s*/, '').trim() : 'Avaliação';
    const theme = themeMatch ? themeMatch[1].trim() : '';

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
                weight: 1.0,
                alternatives: alternatives,
                correctAnswer: gabarito[qNumber] || ""
            });
        }
    }

    return {
        key: examKey,
        title,
        theme,
        rubric: rubricMarkdown,
        questions
    };
}

// Criação de Tabelas se não existirem
function createTables() {
    return new Promise((resolve, reject) => {
        sqliteDb.serialize(() => {
            sqliteDb.run("CREATE TABLE IF NOT EXISTS students (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS classes (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS courses (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS branding (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS submissions (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS notes (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS annotations (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS forum (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS course_structure (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS evaluations (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS progress (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS uploads (key TEXT PRIMARY KEY, value TEXT)");
            sqliteDb.run("CREATE TABLE IF NOT EXISTS admins (key TEXT PRIMARY KEY, value TEXT)", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Helper para migrar arquivo JSON legado para tabela SQLite
function migrateJsonToTable(filePath, tableName, keyField, isArray = true) {
    return new Promise((resolve) => {
        if (!fs.existsSync(filePath)) {
            return resolve();
        }
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            
            sqliteDb.serialize(() => {
                sqliteDb.run("BEGIN TRANSACTION");
                
                if (isArray) {
                    const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${tableName} (key, value) VALUES (?, ?)`);
                    if (Array.isArray(data)) {
                        data.forEach(item => {
                            const keyVal = item[keyField];
                            if (keyVal) stmt.run(keyVal.toLowerCase ? keyVal.toLowerCase() : keyVal, JSON.stringify(item));
                        });
                    }
                    stmt.finalize();
                } else {
                    const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${tableName} (key, value) VALUES (?, ?)`);
                    for (const key in data) {
                        stmt.run(key.toLowerCase ? key.toLowerCase() : key, JSON.stringify(data[key]));
                    }
                    stmt.finalize();
                }
                
                sqliteDb.run("COMMIT", (err) => {
                    if (err) {
                        console.error(`Erro ao comitar migração de ${tableName}:`, err);
                    } else {
                        console.log(`Migrado ${path.basename(filePath)} para SQLite com sucesso.`);
                        try { fs.renameSync(filePath, filePath + '.migrated'); } catch(e){}
                    }
                    resolve();
                });
            });
        } catch (e) {
            console.error(`Erro ao migrar arquivo ${filePath}:`, e);
            resolve();
        }
    });
}

// Carregar dados de tabela SQLite para memória
function loadTable(tableName, isArray = true) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT key, value FROM ${tableName}`, (err, rows) => {
            if (err) return reject(err);
            
            if (isArray) {
                const arr = [];
                rows.forEach(r => {
                    try { arr.push(JSON.parse(r.value)); } catch(e){}
                });
                resolve(arr);
            } else {
                const obj = {};
                rows.forEach(r => {
                    try { obj[r.key] = JSON.parse(r.value); } catch(e){}
                });
                resolve(obj);
            }
        });
    });
}

// Inicializa Defaults se o banco de dados estiver vazio
function populateDefaultsIfEmpty() {
    if (memoryDB.admins.length === 0) {
        memoryDB.admins = [{
            name: 'Administrador Geral',
            email: 'admin@senai.br',
            password: 'admin'
        }];
    }
    
    if (memoryDB.classes.length === 0) {
        const defaultReleasedItems = {};
        const modules = ['FUTEC', 'FECOP', 'IRCOM'];
        modules.forEach(m => {
            for (let i = 1; i <= 5; i++) {
                defaultReleasedItems[`Apostila_${m}_${i}`] = true;
                defaultReleasedItems[`Avaliacao_${m}_${i}`] = false;
            }
        });
        memoryDB.classes = [
            { 
                name: '1DES', 
                period: 'Manhã',
                courseId: 'curso_legacy_01',
                registrationEnabled: true,
                activeExamKey: null,
                activeExamQuestionCount: 20,
                releasedItems: { ...defaultReleasedItems }
            },
            { 
                name: '2DES', 
                period: 'Tarde',
                courseId: 'curso_legacy_01',
                registrationEnabled: true,
                activeExamKey: null,
                activeExamQuestionCount: 20,
                releasedItems: { ...defaultReleasedItems }
            }
        ];
    }

    if (Object.keys(memoryDB.branding).length === 0) {
        memoryDB.branding = {
            id: 'default',
            institutionName: 'SENAI 4.0',
            primaryColor: '#ef4444',
            logoUrl: ''
        };
    }

    if (memoryDB.courses.length === 0) {
        // Migration will populate structure if it comes from legacy courseStructure
        memoryDB.courses = [
            {
                id: 'curso_legacy_01',
                name: 'Curso Técnico em TI (Legado)',
                description: 'Curso original contendo os módulos FUTEC, FECOP e IRCOM.',
                structure: memoryDB.courseStructure && memoryDB.courseStructure.length > 0 ? [...memoryDB.courseStructure] : [
                    {
                        id: 'FUTEC',
                        name: 'FUTEC — Fund. de TI (80h)',
                        units: [
                            { id: "1", name: "Sistemas Operacionais + Dispositivos", apostilaKey: "Apostila_FUTEC_1", avaliacaoKey: "Avaliacao_FUTEC_1", files: [] },
                            { id: "2", name: "Indústria 4.0 + Internet", apostilaKey: "Apostila_FUTEC_2", avaliacaoKey: "Avaliacao_FUTEC_2", files: [] },
                            { id: "3", name: "Hardware + BIOS/UEFI + Periféricos", apostilaKey: "Apostila_FUTEC_3", avaliacaoKey: "Avaliacao_FUTEC_3", files: [] },
                            { id: "4", name: "Instalação de Windows Server + KMS", apostilaKey: "Apostila_FUTEC_4", avaliacaoKey: "Avaliacao_FUTEC_4", files: [] },
                            { id: "5", name: "CLI de Linux + Permissões + FHS", apostilaKey: "Apostila_FUTEC_5", avaliacaoKey: "Avaliacao_FUTEC_5", files: [] }
                        ]
                    },
                    {
                        id: 'FECOP',
                        name: 'FECOP — Colab. e Prod. (120h)',
                        units: [
                            { id: "1", name: "Produtividade + Office 365", apostilaKey: "Apostila_FECOP_1", avaliacaoKey: "Avaliacao_FECOP_1", files: [] },
                            { id: "2", name: "Active Directory + LDAP + Grupos/GPO", apostilaKey: "Apostila_FECOP_2", avaliacaoKey: "Avaliacao_FECOP_2", files: [] },
                            { id: "3", name: "Serviços em Nuvem + AWS/Azure", apostilaKey: "Apostila_FECOP_3", avaliacaoKey: "Avaliacao_FECOP_3", files: [] },
                            { id: "4", name: "Políticas Corporativas + Auditoria/Logs", apostilaKey: "Apostila_FECOP_4", avaliacaoKey: "Avaliacao_FECOP_4", files: [] },
                            { id: "5", name: "Trabalho Remoto + VPN + Segurança", apostilaKey: "Apostila_FECOP_5", avaliacaoKey: "Avaliacao_FECOP_5", files: [] }
                        ]
                    },
                    {
                        id: 'IRCOM',
                        name: 'IRCOM — Inst. Rec. Comp. (120h)',
                        units: [
                            { id: "1", name: "Planejamento de Instalação + Requisitos", apostilaKey: "Apostila_IRCOM_1", avaliacaoKey: "Avaliacao_IRCOM_1", files: [] },
                            { id: "2", name: "CLP (PLC) + Redes Industriais", apostilaKey: "Apostila_IRCOM_2", avaliacaoKey: "Avaliacao_IRCOM_2", files: [] },
                            { id: "3", name: "Protocolos Industriais + Modbus/OPC-UA", apostilaKey: "Apostila_IRCOM_3", avaliacaoKey: "Avaliacao_IRCOM_3", files: [] },
                            { id: "4", name: "Comissionamento de Sistemas + Testes", apostilaKey: "Apostila_IRCOM_4", avaliacaoKey: "Avaliacao_IRCOM_4", files: [] },
                            { id: "5", name: "Manutenção Preventiva e Corretiva", apostilaKey: "Apostila_IRCOM_5", avaliacaoKey: "Avaliacao_IRCOM_5", files: [] }
                        ]
                    }
                ]
            }
        ];
    }

    if (!memoryDB.config || !memoryDB.config.releasedItems) {
        const defaultReleasedItems = {};
        const modules = ['FUTEC', 'FECOP', 'IRCOM'];
        modules.forEach(m => {
            for (let i = 1; i <= 5; i++) {
                defaultReleasedItems[`Apostila_${m}_${i}`] = true;
                defaultReleasedItems[`Avaliacao_${m}_${i}`] = false;
            }
        });
        memoryDB.config = {
            adminPassword: 'admin',
            activeExamKey: null,
            releasedItems: defaultReleasedItems
        };
    }
}

// Inicialização Assíncrona do Banco
async function init() {
    await createTables();

    // 1. Executa migrações de arquivos JSON legados se houverem
    await migrateJsonToTable(DB_STUDENTS_FILE, 'students', 'email', true);
    await migrateJsonToTable(DB_CLASSES_FILE, 'classes', 'name', true);
    await migrateJsonToTable(DB_SUBMISSIONS_FILE, 'submissions', 'id', true);
    await migrateJsonToTable(DB_ADMINS_FILE, 'admins', 'email', true);
    await migrateJsonToTable(DB_FORUM_FILE, 'forum', 'id', true);
    
    await migrateJsonToTable(DB_NOTES_FILE, 'notes', '', false);
    await migrateJsonToTable(DB_ANNOTATIONS_FILE, 'annotations', '', false);
    await migrateJsonToTable(DB_EVALUATIONS_FILE, 'evaluations', '', false);
    await migrateJsonToTable(DB_PROGRESS_FILE, 'progress', '', false);
    await migrateJsonToTable(DB_UPLOADS_FILE, 'uploads', '', false);

    // Migração de config e course structure legados (singletons)
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
            sqliteDb.run("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", 'app_config', raw);
            fs.renameSync(CONFIG_FILE, CONFIG_FILE + '.migrated');
        } catch(e){}
    }
    if (fs.existsSync(DB_COURSE_STRUCTURE_FILE)) {
        try {
            const raw = fs.readFileSync(DB_COURSE_STRUCTURE_FILE, 'utf8');
            sqliteDb.run("INSERT OR REPLACE INTO course_structure (key, value) VALUES (?, ?)", 'structure', raw);
            fs.renameSync(DB_COURSE_STRUCTURE_FILE, DB_COURSE_STRUCTURE_FILE + '.migrated');
        } catch(e){}
    }

    memoryDB.students = await loadTable('students', true);
    
    // Migração de studentClass para classes array
    memoryDB.students.forEach(student => {
        if (!student.classes) {
            student.classes = [];
            if (student.studentClass) {
                student.classes.push(student.studentClass);
            }
        }
    });
    memoryDB.classes = await loadTable('classes', true);
    memoryDB.courses = await loadTable('courses', true);
    memoryDB.submissions = await loadTable('submissions', true);
    memoryDB.forum = await loadTable('forum', true);
    memoryDB.admins = await loadTable('admins', true);

    memoryDB.notes = await loadTable('notes', false);
    memoryDB.annotations = await loadTable('annotations', false);
    memoryDB.evaluations = await loadTable('evaluations', false);
    memoryDB.progress = await loadTable('progress', false);
    memoryDB.uploads = await loadTable('uploads', false);

    // Carrega Singletons
    const loadedConfig = await loadTable('config', false);
    memoryDB.config = loadedConfig['app_config'] || { releasedItems: {} };

    const loadedBranding = await loadTable('branding', false);
    if (loadedBranding['default']) {
        memoryDB.branding = loadedBranding['default'];
    }

    const loadedStructure = await loadTable('course_structure', false);
    memoryDB.courseStructure = loadedStructure['structure'] || [];

    // 3. Garante defaults se tabelas estruturais estiverem vazias
    populateDefaultsIfEmpty();

    // 4. Migração das avaliações do disco se não houver nenhuma cadastrada no DB
    if (Object.keys(memoryDB.evaluations).length === 0) {
        console.log("Migrando avaliações em Markdown da pasta para o SQLite...");
        const evaluations = {};
        const modulesList = ['FUTEC', 'FECOP', 'IRCOM'];
        modulesList.forEach(m => {
            for (let i = 1; i <= 5; i++) {
                const examKey = `Avaliacao_${m}_${i}`;
                const mdPath = path.join(__dirname, '../content', `${examKey}.md`);
                if (fs.existsSync(mdPath)) {
                    try {
                        const mdContent = fs.readFileSync(mdPath, 'utf8');
                        const parsed = parseEvaluationMarkdown(mdContent, examKey);
                        if (parsed) {
                            evaluations[examKey] = parsed;
                        }
                    } catch (err) {
                        console.error(`Erro ao migrar ${examKey}:`, err);
                    }
                }
            }
        });
        memoryDB.evaluations = evaluations;
        
        // Salva imediatamente no SQLite
        sqliteDb.serialize(() => {
            sqliteDb.run("BEGIN TRANSACTION");
            const stmt = sqliteDb.prepare("INSERT OR REPLACE INTO evaluations (key, value) VALUES (?, ?)");
            for (const key in evaluations) {
                stmt.run(key, JSON.stringify(evaluations[key]));
            }
            stmt.finalize();
            sqliteDb.run("COMMIT");
        });
    }

    console.log("💾 Banco de dados SQLite inicializado e carregado na memória.");
}

// Sincroniza dados da memória de volta para o SQLite (Atomic Transactions)
function saveToDisk() {
    if (writeQueue) return;
    writeQueue = true;
    
    setTimeout(() => {
        sqliteDb.serialize(() => {
            sqliteDb.run("BEGIN TRANSACTION");
            
            const syncArrayTable = (tableName, arr, keyField) => {
                sqliteDb.run(`DELETE FROM ${tableName}`);
                const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${tableName} (key, value) VALUES (?, ?)`);
                arr.forEach(item => {
                    const keyVal = item[keyField];
                    if (keyVal) {
                        stmt.run(keyVal, JSON.stringify(item));
                    }
                });
                stmt.finalize();
            };

            const syncObjectTable = (tableName, obj) => {
                sqliteDb.run(`DELETE FROM ${tableName}`);
                const stmt = sqliteDb.prepare(`INSERT OR REPLACE INTO ${tableName} (key, value) VALUES (?, ?)`);
                for (const key in obj) {
                    stmt.run(key, JSON.stringify(obj[key]));
                }
                stmt.finalize();
            };

            try {
                syncArrayTable('students', memoryDB.students, 'email');
                syncArrayTable('classes', memoryDB.classes, 'name');
                syncArrayTable('courses', memoryDB.courses, 'id');
                syncArrayTable('submissions', memoryDB.submissions, 'id');
                syncArrayTable('forum', memoryDB.forum, 'id');
                syncArrayTable('admins', memoryDB.admins, 'email');

                syncObjectTable('notes', memoryDB.notes);
                syncObjectTable('annotations', memoryDB.annotations);
                syncObjectTable('evaluations', memoryDB.evaluations);
                syncObjectTable('progress', memoryDB.progress);
                syncObjectTable('uploads', memoryDB.uploads);

                sqliteDb.run("DELETE FROM config");
                sqliteDb.run("INSERT INTO config (key, value) VALUES (?, ?)", 'app_config', JSON.stringify(memoryDB.config));

                sqliteDb.run("DELETE FROM branding");
                sqliteDb.run("INSERT INTO branding (key, value) VALUES (?, ?)", 'default', JSON.stringify(memoryDB.branding));

                sqliteDb.run("DELETE FROM course_structure");
                sqliteDb.run("INSERT INTO course_structure (key, value) VALUES (?, ?)", 'structure', JSON.stringify(memoryDB.courseStructure));
                
                sqliteDb.run("COMMIT", (err) => {
                    if (err) {
                        console.error("Erro ao comitar alterações no SQLite:", err);
                    }
                    writeQueue = false;
                });
            } catch (err) {
                console.error("Falha ao salvar dados no SQLite:", err);
                sqliteDb.run("ROLLBACK");
                writeQueue = false;
            }
        });
    }, 250);
}

module.exports = {
    init,
    get memory() { return memoryDB; },
    save: saveToDisk
};
