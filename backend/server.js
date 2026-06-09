const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve os arquivos de uploads de forma estatica
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// Rota dinamica para servir data.js com conteudo atualizado em tempo real
app.get('/data.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    const dataObj = {};
    
    try {
        const files = fs.readdirSync(path.join(__dirname, '../content'));
        const ignoredFiles = [
            'implementation_plan.md',
            'task.md',
            'walkthrough.md',
            'manual_novas_unidades.md',
            'readme.md'
        ];
        files.forEach((file) => {
            if (file.endsWith('.md') && !ignoredFiles.includes(file.toLowerCase())) {
                const filePath = path.join(__dirname, '../content', file);
                const content = fs.readFileSync(filePath, 'utf8');
                dataObj[file.replace('.md', '')] = content;
            }
        });
    } catch (e) {
        console.error("Erro ao gerar data.js dinamico:", e);
    }

    if (db.memory && db.memory.evaluations) {
        for (const evalKey in db.memory.evaluations) {
            dataObj[evalKey] = db.memory.evaluations[evalKey];
        }
    }

    dataObj["courseStructure"] = db.memory.courseStructure || [];

    const fileContent = `const courseData = ${JSON.stringify(dataObj, null, 2)};`;
    res.send(fileContent);
});

// Serve os arquivos estáticos do portal (HTML, CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, '../frontend')));

// Caminhos dos arquivos de banco de dados locais
const DB_STUDENTS_FILE = path.join(__dirname, '../data/db_students.json');
const DB_SUBMISSIONS_FILE = path.join(__dirname, '../data/db_submissions.json');
const CONFIG_FILE = path.join(__dirname, '../data/config.json');
const DB_CLASSES_FILE = path.join(__dirname, '../data/db_classes.json');
const DB_ADMINS_FILE = path.join(__dirname, '../data/db_admins.json');

// Armazena todos os IPs da rede local
let localIpAddresses = [];
function detectIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        let iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                localIpAddresses.push({ name: devName, address: alias.address });
            }
        }
    }
    if (localIpAddresses.length === 0) {
        localIpAddresses.push({ name: 'localhost', address: 'localhost' });
    }
}
detectIP();

// Função para ler dados JSON de forma segura via Memory DB
function readJSON(file) {
    if (file.includes('db_students.json')) return db.memory.students;
    if (file.includes('db_classes.json')) return db.memory.classes;
    if (file.includes('db_submissions.json')) return db.memory.submissions;
    if (file.includes('config.json')) return db.memory.config;
    if (file.includes('db_admins.json')) return db.memory.admins;
    return [];
}

// Função para escrever dados JSON via Memory DB
function writeJSON(file, data) {
    if (file.includes('db_students.json')) db.memory.students = data;
    else if (file.includes('db_classes.json')) db.memory.classes = data;
    else if (file.includes('db_submissions.json')) db.memory.submissions = data;
    else if (file.includes('config.json')) db.memory.config = data;
    else if (file.includes('db_admins.json')) db.memory.admins = data;
    db.save();
}

// Parser de Markdown de Avaliações (idêntico ao do frontend para correções no backend)
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

// ----------------------------------------------------
// ROTAS DE REDE E PRESENÇA
// ----------------------------------------------------

// Ping do Aluno para manter a sessão online
app.get('/api/ping', (req, res) => {
    const email = req.query.email;
    if (email) {
        db.memory.sessions[email.toLowerCase()] = Date.now();
    }
    res.json({ success: true });
});

// Beacon de saída do aluno
app.post('/api/student/leave', express.text({type: 'text/plain'}), (req, res) => {
    try {
        const email = req.body;
        if (email) {
            delete db.memory.sessions[email.toLowerCase()];
        }
    } catch(e) {}
    res.json({ success: true });
});

// Retorna os IPs da rede local
app.get('/api/admin/network-info', (req, res) => {
    res.json(localIpAddresses);
});

// ----------------------------------------------------
// ROTAS DE API DO ALUNO
// ----------------------------------------------------

// Retorna a lista de turmas liberadas para cadastro de aluno
app.get('/api/classes', (req, res) => {
    const classes = readJSON(DB_CLASSES_FILE);
    const activeClasses = classes.filter(c => c.registrationEnabled).map(c => c.name);
    res.json(activeClasses);
});

// Retorna o status da prova ativa e itens liberados (específicos por turma)
app.get('/api/status', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const studentClass = req.query.studentClass;
    if (!studentClass) {
        return res.json({ 
            activeExamKey: null,
            activeExamQuestionCount: 0,
            releasedItems: {}
        });
    }

    const classes = readJSON(DB_CLASSES_FILE);
    const cls = classes.find(c => c.name === studentClass);
    if (!cls) {
        return res.json({ 
            activeExamKey: null,
            activeExamQuestionCount: 0,
            releasedItems: {}
        });
    }

    res.json({ 
        examConfigs: cls.examConfigs || {},
        releasedItems: getReleasedItemsForClass(cls)
    });
});

// Cadastro de Aluno
app.post('/api/student/register', (req, res) => {
    const { name, email, password, studentClass } = req.body;
    if (!name || !email || !password || !studentClass) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const classes = readJSON(DB_CLASSES_FILE);
    const matchedClass = classes.find(c => c.name === studentClass && c.registrationEnabled);
    if (!matchedClass) {
        return res.status(400).json({ error: 'A turma selecionada não existe ou não está liberada para cadastro.' });
    }

    const period = matchedClass.period || 'Tarde';

    const students = readJSON(DB_STUDENTS_FILE);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = students.find(s => s.email && s.email.toLowerCase() === normalizedEmail);

    if (existing) {
        return res.status(400).json({ error: 'E-mail de estudante já cadastrado.' });
    }

    const studentObj = {
        name: name.trim(),
        email: normalizedEmail,
        password: password.trim(),
        studentClass,
        period,
        loginTime: null,
        recoveryRequested: false
    };
    students.push(studentObj);
    writeJSON(DB_STUDENTS_FILE, students);

    res.json({ success: true });
});

// Login do aluno
app.post('/api/student/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const students = readJSON(DB_STUDENTS_FILE);
    const normalizedEmail = email.trim().toLowerCase();
    const student = students.find(s => s.email && s.email.toLowerCase() === normalizedEmail && s.password === password.trim());

    if (!student) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    student.loginTime = new Date().toISOString();
    writeJSON(DB_STUDENTS_FILE, students);

    // Retorna dados do estudante sem expor o campo de senha
    const { password: _, ...safeStudent } = student;
    res.json({ success: true, student: safeStudent });
});

// Solicitação de recuperação de senha pelo aluno
app.post('/api/student/recover', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    const students = readJSON(DB_STUDENTS_FILE);
    const normalizedEmail = email.trim().toLowerCase();
    const student = students.find(s => s.email && s.email.toLowerCase() === normalizedEmail);

    if (!student) {
        return res.status(444).json({ error: 'E-mail não cadastrado.' });
    }

    student.recoveryRequested = true;
    writeJSON(DB_STUDENTS_FILE, students);

    res.json({ success: true, message: 'Solicitação de recuperação enviada ao instrutor.' });
});

// Helper para obter itens liberados de forma dinamica, incluindo novos modulos/unidades
function getReleasedItemsForClass(cls) {
    const released = cls.releasedItems || {};
    const courseStructure = db.memory.courseStructure || [];
    courseStructure.forEach(mod => {
        mod.units.forEach(u => {
            if (u.apostilaKey && released[u.apostilaKey] === undefined) {
                released[u.apostilaKey] = true;
            }
            if (u.avaliacaoKey && released[u.avaliacaoKey] === undefined) {
                released[u.avaliacaoKey] = false;
            }
        });
    });
    return released;
}

// Envio de prova pelo aluno (com correção blindada no servidor)
app.post('/api/student/submit', (req, res) => {
    const { student, examKey, answers } = req.body; // answers = { originalNumber: 'A', ... }
    if (!student || !examKey || !answers) {
        return res.status(400).json({ error: 'Dados inválidos ou incompletos.' });
    }

    // Verifica se a prova enviada está de fato liberada para a turma do estudante
    const studentClass = student.studentClass;
    if (!studentClass) {
        return res.status(400).json({ error: 'Turma do estudante não informada.' });
    }

    const classes = readJSON(DB_CLASSES_FILE);
    const cls = classes.find(c => c.name === studentClass);
    if (!cls) {
        return res.status(403).json({ error: 'Turma do estudante não encontrada.' });
    }
    
    const releasedItems = getReleasedItemsForClass(cls);
    if (!releasedItems[examKey]) {
        return res.status(403).json({ error: 'Esta prova não está liberada para a sua turma.' });
    }

    // Tenta obter questoes estruturadas do banco de dados primeiro
    let questions;
    const evaluation = db.memory.evaluations[examKey];
    if (evaluation) {
        questions = evaluation.questions;
    } else {
        // Fallback: Localiza e lê o arquivo da prova antigo .md
        const filePath = path.join(__dirname, '../content', `${examKey}.md`);
        if (fs.existsSync(filePath)) {
            const mdContent = fs.readFileSync(filePath, 'utf8');
            const parsedObj = parseEvaluationMarkdown(mdContent, examKey);
            questions = parsedObj ? parsedObj.questions : [];
        }
    }
    
    if (!questions || questions.length === 0) {
        return res.status(500).json({ error: 'Falha ao processar avaliação no servidor.' });
    }

    // Correção das respostas no servidor
    let correctCount = 0;
    const totalCount = questions.length;
    const gradedAnswers = [];

    questions.forEach(q => {
        const studentChoice = answers[q.originalNumber];
        const isCorrect = studentChoice === q.correctAnswer;
        if (isCorrect) {
            correctCount++;
        }
        gradedAnswers.push({
            questionNumber: q.originalNumber,
            studentChoice: studentChoice || null,
            correctAnswer: q.correctAnswer,
            isCorrect
        });
    });

    const score = Math.round((correctCount / totalCount) * 100);

    // Salva a submissão no banco de dados
    const submissions = readJSON(DB_SUBMISSIONS_FILE);
    
    // Remove submissões anteriores do mesmo aluno (por e-mail) para a mesma prova
    const studentEmail = (student.email || "").toLowerCase();
    const filteredSubmissions = submissions.filter(s => 
        !(s.student.email && s.student.email.toLowerCase() === studentEmail && s.examKey === examKey)
    );

    const submissionObj = {
        student,
        examKey,
        score,
        correctCount,
        totalCount,
        gradedAnswers,
        timestamp: new Date().toISOString()
    };
    
    filteredSubmissions.push(submissionObj);
    writeJSON(DB_SUBMISSIONS_FILE, filteredSubmissions);

    res.json({
        success: true,
        score,
        correctCount,
        totalCount
    });
});

// Obter histórico de submissões de um aluno
app.post('/api/student/my-submissions', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'E-mail não informado.' });
    }

    const submissions = readJSON(DB_SUBMISSIONS_FILE);
    const normalizedEmail = email.trim().toLowerCase();
    
    const mySubmissions = submissions.filter(s => s.student && s.student.email && s.student.email.toLowerCase() === normalizedEmail);
    
    res.json({ success: true, submissions: mySubmissions });
});

// Obter progresso do aluno (GET)
app.get('/api/student/progress', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email não informado.' });
    
    const completedUnits = db.memory.progress[email.toLowerCase()] || {};
    res.json({ success: true, completedUnits });
});

// Atualizar progresso do aluno (POST)
app.post('/api/student/progress', (req, res) => {
    const { email, completedUnits } = req.body;
    if (!email || !completedUnits) return res.status(400).json({ error: 'Dados incompletos.' });

    db.memory.progress[email.toLowerCase()] = completedUnits;
    db.save();
    res.json({ success: true });
});

// ----------------------------------------------------
// ROTAS DE API DO INSTRUTOR (ADMINISTRADOR)
// ----------------------------------------------------

// Função auxiliar para validar acesso de administrador
function validateAdmin(req, res, callback) {
    const authHeader = req.headers.authorization || (req.body && req.body.password) || req.query.password;
    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso não autorizado.' });
    }
    
    let email, password;
    if (authHeader.includes(':')) {
        const parts = authHeader.split(':');
        email = parts[0].trim().toLowerCase();
        password = parts.slice(1).join(':').trim();
    } else {
        // Compatibilidade legada: assume admin@senai.br se for apenas senha
        email = 'admin@senai.br';
        password = authHeader.trim();
    }
    
    const admins = readJSON(DB_ADMINS_FILE);
    const matchedAdmin = admins.find(a => a.email && a.email.toLowerCase() === email && a.password === password);
    
    if (matchedAdmin) {
        const config = readJSON(CONFIG_FILE);
        callback(config, matchedAdmin);
    } else {
        res.status(401).json({ error: 'Acesso não autorizado. E-mail ou senha incorretos.' });
    }
}

// Retorna as configurações do servidor (com senha sanitizada)
app.post('/api/admin/config', (req, res) => {
    validateAdmin(req, res, (config) => {
        const { studentClass } = req.body;
        const preferredIp = localIpAddresses.find(ip => !ip.name.toLowerCase().includes('virtualbox') && !ip.address.startsWith('192.168.56.')) || localIpAddresses[0] || { address: 'localhost' };
        let responseData = {
            activeExamKey: config.activeExamKey,
            releasedItems: config.releasedItems || {},
            serverUrl: `http://${preferredIp.address}:${PORT}`
        };
        
        if (studentClass) {
            const classes = readJSON(DB_CLASSES_FILE);
            const cls = classes.find(c => c.name === studentClass);
            if (cls) {
                responseData.activeExamKey = cls.activeExamKey;
                responseData.activeExamQuestionCount = cls.activeExamQuestionCount || 20;
                responseData.releasedItems = getReleasedItemsForClass(cls);
            }
        }
        res.json(responseData);
    });
});

// Listar contas administrativas
app.get('/api/admin/accounts', (req, res) => {
    validateAdmin(req, res, () => {
        const admins = readJSON(DB_ADMINS_FILE);
        // Não retorna senhas por segurança
        const safeAdmins = admins.map(a => ({ name: a.name, email: a.email }));
        res.json(safeAdmins);
    });
});

// Criar conta administrativa
app.post('/api/admin/accounts/create', (req, res) => {
    validateAdmin(req, res, () => {
        const { name, email, password } = req.body;
        if (!name || !email || !password || name.trim() === '' || email.trim() === '' || password.trim() === '') {
            return res.status(400).json({ error: 'Dados incompletos ou inválidos.' });
        }

        const admins = readJSON(DB_ADMINS_FILE);
        const normalizedEmail = email.trim().toLowerCase();
        const exists = admins.some(a => a.email && a.email.toLowerCase() === normalizedEmail);

        if (exists) {
            return res.status(400).json({ error: 'E-mail administrativo já cadastrado.' });
        }

        admins.push({
            name: name.trim(),
            email: normalizedEmail,
            password: password.trim()
        });

        writeJSON(DB_ADMINS_FILE, admins);
        res.json({ success: true });
    });
});

// Excluir conta administrativa
app.post('/api/admin/accounts/delete', (req, res) => {
    validateAdmin(req, res, (config, currentAdmin) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'E-mail não informado.' });
        }

        const targetEmail = email.trim().toLowerCase();
        
        // Trava 1: Não pode deletar a si mesmo
        if (currentAdmin.email.toLowerCase() === targetEmail) {
            return res.status(400).json({ error: 'Você não pode excluir a sua própria conta conectada.' });
        }

        const admins = readJSON(DB_ADMINS_FILE);
        
        // Trava 2: Não pode deletar o último administrador
        if (admins.length <= 1) {
            return res.status(400).json({ error: 'Não é possível excluir o único administrador cadastrado.' });
        }

        const filtered = admins.filter(a => !a.email || a.email.toLowerCase() !== targetEmail);

        if (admins.length === filtered.length) {
            return res.status(404).json({ error: 'Administrador não encontrado.' });
        }

        writeJSON(DB_ADMINS_FILE, filtered);
        res.json({ success: true, message: 'Administrador removido com sucesso!' });
    });
});

// Reiniciar o servidor Express
app.post('/api/admin/server/restart', (req, res) => {
    validateAdmin(req, res, () => {
        res.json({ success: true, message: 'Servidor reiniciando...' });
        
        console.log('Solicitação de reinicialização recebida. Fechando servidor...');
        
        // Tenta fechar o servidor de forma limpa para liberar a porta 3000
        serverInstance.close(() => {
            console.log('Porta liberada. Iniciando novo processo do servidor...');
            const { spawn } = require('child_process');
            const child = spawn(process.argv[0], process.argv.slice(1), {
                detached: true,
                stdio: 'ignore',
                cwd: process.cwd()
            });
            child.unref();
            process.exit(0);
        });

        // Fallback forzado após 2 segundos se houver conexões persistentes abertas
        setTimeout(() => {
            console.log('Forçando reinicialização do servidor...');
            const { spawn } = require('child_process');
            const child = spawn(process.argv[0], process.argv.slice(1), {
                detached: true,
                stdio: 'ignore',
                cwd: process.cwd()
            });
            child.unref();
            process.exit(0);
        }, 2000);
    });
});

// Salvar configurações específicas de uma prova por turma
app.post('/api/admin/exam-config', (req, res) => {
    validateAdmin(req, res, (config) => {
        const { studentClass, examKey, questionCount, excludedQuestions } = req.body;
        if (!studentClass || !examKey) {
            return res.status(400).json({ error: 'Turma ou chave da prova não informada.' });
        }
        
        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === studentClass);
        if (!cls) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        if (!cls.examConfigs) {
            cls.examConfigs = {};
        }

        cls.examConfigs[examKey] = {
            questionCount: parseInt(questionCount) || 20,
            excludedQuestions: Array.isArray(excludedQuestions) ? excludedQuestions : []
        };

        writeJSON(DB_CLASSES_FILE, classes);
        res.json({ success: true, examConfigs: cls.examConfigs });
    });
});

// Liberar/Bloquear Apostilas ou Avaliações individuais por turma
app.post('/api/admin/release-item', (req, res) => {
    validateAdmin(req, res, (config) => {
        const { studentClass, itemKey, released } = req.body;
        if (!studentClass) {
            return res.status(400).json({ error: 'Turma não informada.' });
        }
        if (!itemKey) {
            return res.status(400).json({ error: 'Chave do item não informada.' });
        }

        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === studentClass);
        if (!cls) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        if (!cls.releasedItems) {
            cls.releasedItems = {};
        }
        cls.releasedItems[itemKey] = !!released;
        
        writeJSON(DB_CLASSES_FILE, classes);
        res.json({ success: true, releasedItems: cls.releasedItems });
    });
});

// Registrar uma prova gerada no histórico (para rastreamento de questões usadas)
app.post('/api/admin/exam-history/add', (req, res) => {
    validateAdmin(req, res, () => {
        const { studentClass, examKey, type, label, questionNumbers } = req.body;
        if (!studentClass || !examKey || !questionNumbers || !Array.isArray(questionNumbers) || questionNumbers.length === 0) {
            return res.status(400).json({ error: 'Dados incompletos para registrar histórico.' });
        }

        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === studentClass);
        if (!cls) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        if (!cls.examHistory) {
            cls.examHistory = {};
        }
        if (!cls.examHistory[examKey]) {
            cls.examHistory[examKey] = [];
        }

        const entry = {
            id: 'eh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: type || 'online', // 'online' or 'impressa'
            label: label || null,
            questionNumbers: questionNumbers.map(Number),
            createdAt: new Date().toISOString()
        };

        cls.examHistory[examKey].push(entry);
        writeJSON(DB_CLASSES_FILE, classes);

        res.json({ success: true, entry });
    });
});

// Obter histórico de provas geradas para uma turma e avaliação
app.get('/api/admin/exam-history', (req, res) => {
    validateAdmin(req, res, () => {
        const { studentClass, examKey } = req.query;
        if (!studentClass || !examKey) {
            return res.status(400).json({ error: 'Turma ou avaliação não informada.' });
        }

        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === studentClass);
        if (!cls) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        const history = (cls.examHistory && cls.examHistory[examKey]) || [];
        res.json({ success: true, history });
    });
});

// Excluir uma entrada do histórico de provas geradas
app.post('/api/admin/exam-history/delete', (req, res) => {
    validateAdmin(req, res, () => {
        const { studentClass, examKey, entryId } = req.body;
        if (!studentClass || !examKey || !entryId) {
            return res.status(400).json({ error: 'Dados insuficientes para exclusão.' });
        }

        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === studentClass);
        if (!cls || !cls.examHistory || !cls.examHistory[examKey]) {
            return res.status(404).json({ error: 'Histórico não encontrado.' });
        }

        const before = cls.examHistory[examKey].length;
        cls.examHistory[examKey] = cls.examHistory[examKey].filter(e => e.id !== entryId);

        if (cls.examHistory[examKey].length === before) {
            return res.status(404).json({ error: 'Entrada não encontrada no histórico.' });
        }

        writeJSON(DB_CLASSES_FILE, classes);
        res.json({ success: true });
    });
});

// Redefinir senha do aluno
app.post('/api/admin/reset-password', (req, res) => {
    validateAdmin(req, res, () => {
        const { email, newPassword } = req.body;
        if (!email || !newPassword || newPassword.trim() === '') {
            return res.status(400).json({ error: 'E-mail ou nova senha inválidos.' });
        }

        const students = readJSON(DB_STUDENTS_FILE);
        const student = students.find(s => s.email && s.email.toLowerCase() === email.trim().toLowerCase());

        if (!student) {
            return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        student.password = newPassword.trim();
        student.recoveryRequested = false; // Limpa a solicitação de redefinição
        writeJSON(DB_STUDENTS_FILE, students);

        res.json({ success: true, message: 'Senha redefinida com sucesso!' });
    });
});

// Alterar senha do instrutor
app.post('/api/admin/change-password', (req, res) => {
    validateAdmin(req, res, (config) => {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.trim() === '') {
            return res.status(400).json({ error: 'Senha inválida.' });
        }
        config.adminPassword = newPassword.trim();
        writeJSON(CONFIG_FILE, config);
        res.json({ success: true, message: 'Senha atualizada com sucesso!' });
    });
});

// Obter submissões de provas
app.get('/api/admin/submissions', (req, res) => {
    validateAdmin(req, res, () => {
        const submissions = readJSON(DB_SUBMISSIONS_FILE);
        res.json(submissions);
    });
});

// Excluir registro de submissão
app.post('/api/admin/submissions/delete', (req, res) => {
    validateAdmin(req, res, () => {
        const { studentEmail, examKey } = req.body;
        if (!studentEmail || !examKey) {
            return res.status(400).json({ error: 'Dados insuficientes para exclusão.' });
        }

        const submissions = readJSON(DB_SUBMISSIONS_FILE);
        const normalizedEmail = studentEmail.trim().toLowerCase();
        
        const filteredSubmissions = submissions.filter(s => 
            !(s.student && s.student.email && s.student.email.toLowerCase() === normalizedEmail && s.examKey === examKey)
        );

        writeJSON(DB_SUBMISSIONS_FILE, filteredSubmissions);
        res.json({ success: true, message: 'Registro de prova excluído com sucesso!' });
    });
});

// Obter alunos cadastrados e online
app.get('/api/admin/students', (req, res) => {
    validateAdmin(req, res, () => {
        const students = readJSON(DB_STUDENTS_FILE);
        const now = Date.now();
        const enrichedStudents = students.map(s => {
            const lastPing = db.memory.sessions[s.email];
            const isOnline = !!(lastPing && (now - lastPing < 10000));
            return { ...s, isOnline };
        });
        res.json(enrichedStudents);
    });
});

// Criação manual de aluno pelo instrutor
app.post('/api/admin/student/create', (req, res) => {
    validateAdmin(req, res, () => {
        const { name, email, studentPassword, studentClass } = req.body;
        if (!name || !email || !studentPassword || !studentClass) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        const classes = readJSON(DB_CLASSES_FILE);
        const matchedClass = classes.find(c => c.name === studentClass);
        if (!matchedClass) {
            return res.status(400).json({ error: 'A turma especificada não está pré-cadastrada no sistema.' });
        }

        const period = matchedClass.period || 'Tarde';

        const students = readJSON(DB_STUDENTS_FILE);
        const normalizedEmail = email.trim().toLowerCase();
        const exists = students.find(s => s.email && s.email.toLowerCase() === normalizedEmail);

        if (exists) {
            return res.status(400).json({ error: 'E-mail de estudante já cadastrado.' });
        }

        students.push({
            name: name.trim(),
            email: normalizedEmail,
            password: studentPassword.trim(),
            studentClass,
            period,
            loginTime: null,
            recoveryRequested: false
        });
        writeJSON(DB_STUDENTS_FILE, students);
        res.json({ success: true });
    });
});

// Atualização de cadastro de aluno pelo instrutor
app.post('/api/admin/student/update', (req, res) => {
    validateAdmin(req, res, () => {
        const { originalEmail, name, email, password, studentClass, period } = req.body;
        if (!originalEmail || !name || !email || !password || !studentClass || !period) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        const students = readJSON(DB_STUDENTS_FILE);
        const studentIndex = students.findIndex(s => s.email && s.email.toLowerCase() === originalEmail.trim().toLowerCase());
        
        if (studentIndex === -1) {
            return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        const newEmailNormalized = email.trim().toLowerCase();
        if (newEmailNormalized !== originalEmail.trim().toLowerCase()) {
            const emailExists = students.some((s, idx) => idx !== studentIndex && s.email && s.email.toLowerCase() === newEmailNormalized);
            if (emailExists) {
                return res.status(400).json({ error: 'O novo e-mail já está sendo utilizado por outro estudante.' });
            }
        }

        students[studentIndex] = {
            ...students[studentIndex],
            name: name.trim(),
            email: newEmailNormalized,
            password: password.trim(),
            studentClass,
            period
        };

        writeJSON(DB_STUDENTS_FILE, students);
        
        // Cascata nas submissões de notas antigas
        const submissions = readJSON(DB_SUBMISSIONS_FILE);
        let submissionsUpdated = false;
        submissions.forEach(sub => {
            if (sub.student && sub.student.email && sub.student.email.toLowerCase() === originalEmail.trim().toLowerCase()) {
                sub.student.email = newEmailNormalized;
                sub.student.name = name.trim();
                sub.student.studentClass = studentClass;
                sub.student.period = period;
                submissionsUpdated = true;
            }
        });
        if (submissionsUpdated) {
            writeJSON(DB_SUBMISSIONS_FILE, submissions);
        }

        res.json({ success: true });
    });
});

// Excluir conta de aluno
app.post('/api/admin/delete-student', (req, res) => {
    validateAdmin(req, res, () => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'E-mail não informado.' });
        }

        const students = readJSON(DB_STUDENTS_FILE);
        const filtered = students.filter(s => !s.email || s.email.toLowerCase() !== email.trim().toLowerCase());

        if (students.length === filtered.length) {
            return res.status(404).json({ error: 'Estudante não encontrado.' });
        }

        writeJSON(DB_STUDENTS_FILE, filtered);
        res.json({ success: true, message: 'Estudante removido com sucesso!' });
    });
});

// Obter lista completa de turmas cadastradas (administrador)
app.get('/api/admin/classes', (req, res) => {
    validateAdmin(req, res, () => {
        const classes = readJSON(DB_CLASSES_FILE);
        res.json(classes);
    });
});

// Cadastrar nova turma (administrador)
app.post('/api/admin/class/create', (req, res) => {
    validateAdmin(req, res, () => {
        const { name, period } = req.body;
        if (!name || !period || name.trim() === '') {
            return res.status(400).json({ error: 'Nome ou período da turma inválido.' });
        }
        const className = name.trim().toUpperCase();
        const classes = readJSON(DB_CLASSES_FILE);
        const exists = classes.find(c => c.name === className);
        if (exists) {
            return res.status(400).json({ error: 'Esta turma já está cadastrada.' });
        }
        
        const defaultReleasedItems = {};
        const modules = ['FUTEC', 'FECOP', 'IRCOM'];
        modules.forEach(m => {
            for (let i = 1; i <= 5; i++) {
                defaultReleasedItems[`Apostila_${m}_${i}`] = true;
                defaultReleasedItems[`Avaliacao_${m}_${i}`] = false;
            }
        });

        classes.push({
            name: className,
            period: period,
            registrationEnabled: true,
            examConfigs: {},
            releasedItems: defaultReleasedItems
        });

        writeJSON(DB_CLASSES_FILE, classes);
        res.json({ success: true });
    });
});

// Ativar/Desativar liberação de cadastro para turma (administrador)
app.post('/api/admin/class/toggle-registration', (req, res) => {
    validateAdmin(req, res, () => {
        const { name, registrationEnabled } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nome da turma não informado.' });
        }
        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === name);
        if (!cls) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }
        cls.registrationEnabled = !!registrationEnabled;
        writeJSON(DB_CLASSES_FILE, classes);
        res.json({ success: true, classes });
    });
});

// Excluir turma (administrador)
app.post('/api/admin/class/delete', (req, res) => {
    validateAdmin(req, res, () => {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Nome da turma não informado.' });
        }
        const classes = readJSON(DB_CLASSES_FILE);
        const filtered = classes.filter(c => c.name !== name);
        writeJSON(DB_CLASSES_FILE, filtered);
        res.json({ success: true });
    });
});

// Reseta o estado do LMS local (limpa alunos e submissões da aula anterior)
app.post('/api/admin/reset', (req, res) => {
    validateAdmin(req, res, (config) => {
        writeJSON(DB_STUDENTS_FILE, []);
        writeJSON(DB_SUBMISSIONS_FILE, []);
        
        config.activeExamKey = null;
        const defaultReleasedItems = {};
        const modules = ['FUTEC', 'FECOP', 'IRCOM'];
        modules.forEach(m => {
            for (let i = 1; i <= 5; i++) {
                defaultReleasedItems[`Apostila_${m}_${i}`] = true;
                defaultReleasedItems[`Avaliacao_${m}_${i}`] = false;
            }
        });
        config.releasedItems = defaultReleasedItems;
        writeJSON(CONFIG_FILE, config);

        const classes = readJSON(DB_CLASSES_FILE);
        classes.forEach(cls => {
            cls.examConfigs = {};
            cls.releasedItems = { ...defaultReleasedItems };
        });
        writeJSON(DB_CLASSES_FILE, classes);

        res.json({ success: true, message: 'Sala de aula e configurações de todas as turmas resetadas com sucesso!' });
    });
});

// ==========================================
// NOTAS (MEU CADERNO)
// ==========================================
app.post('/api/student/notes/save', (req, res) => {
    const { email, moduleKey, note } = req.body;
    if (!email || !moduleKey) return res.status(400).json({ error: 'Dados insuficientes' });
    
    if (!db.memory.notes[email]) {
        db.memory.notes[email] = {};
    }
    db.memory.notes[email][moduleKey] = note;
    db.save();
    res.json({ success: true });
});

app.post('/api/student/notes/get', (req, res) => {
    const { email, moduleKey } = req.body;
    if (!email || !moduleKey) return res.status(400).json({ error: 'Dados insuficientes' });
    
    const notesMap = db.memory.notes[email] || {};
    res.json({ success: true, note: notesMap[moduleKey] || "" });
});

// ==========================================
// ANOTAÇÕES E DESTAQUES POR PARÁGRAFO
// ==========================================
app.post('/api/student/annotation', (req, res) => {
    const { email, key, paragraphId, highlightedText, note } = req.body;
    if (!email || !key || !paragraphId) {
        return res.status(400).json({ error: 'Dados insuficientes' });
    }
    
    const lowerEmail = email.toLowerCase();
    if (!db.memory.annotations[lowerEmail]) {
        db.memory.annotations[lowerEmail] = {};
    }
    if (!db.memory.annotations[lowerEmail][key]) {
        db.memory.annotations[lowerEmail][key] = {};
    }
    
    if (note === null && highlightedText === null) {
        delete db.memory.annotations[lowerEmail][key][paragraphId];
        if (Object.keys(db.memory.annotations[lowerEmail][key]).length === 0) {
            delete db.memory.annotations[lowerEmail][key];
        }
    } else {
        db.memory.annotations[lowerEmail][key][paragraphId] = {
            highlightedText,
            note,
            timestamp: new Date().toISOString()
        };
    }
    
    db.save();
    res.json({ success: true });
});

app.get('/api/student/annotations', (req, res) => {
    const { email, key } = req.query;
    if (!email || !key) {
        return res.status(400).json({ error: 'Dados insuficientes' });
    }
    
    const lowerEmail = email.toLowerCase();
    const studentAnns = db.memory.annotations[lowerEmail] || {};
    res.json({ success: true, annotations: studentAnns[key] || {} });
});

// ==========================================
// FÓRUM / DÚVIDAS INTEGRADO
// ==========================================
app.get('/api/forum', (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Falta a chave do material' });
    
    const comments = db.memory.forum.filter(c => c.key === key);
    res.json({ success: true, comments });
});

app.post('/api/forum/comment', (req, res) => {
    const { key, studentName, studentEmail, text } = req.body;
    if (!key || !studentName || !studentEmail || !text || text.trim() === '') {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    const newComment = {
        id: 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        key,
        studentName,
        studentEmail: studentEmail.toLowerCase(),
        text: text.trim(),
        timestamp: new Date().toISOString(),
        replies: []
    };
    
    db.memory.forum.push(newComment);
    db.save();
    res.json({ success: true, comment: newComment });
});

app.post('/api/forum/reply', (req, res) => {
    const { commentId, authorName, authorRole, authorEmail, text } = req.body;
    if (!commentId || !authorName || !authorRole || !text || text.trim() === '') {
        return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    const comment = db.memory.forum.find(c => c.id === commentId);
    if (!comment) {
        return res.status(404).json({ error: 'Comentário original não encontrado' });
    }
    
    let resolvedEmail = authorEmail ? authorEmail.trim().toLowerCase() : '';
    if (!resolvedEmail && authorRole === 'Instrutor') {
        resolvedEmail = 'admin@senai.br';
    }
    
    const newReply = {
        id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        authorName,
        authorRole,
        authorEmail: resolvedEmail,
        text: text.trim(),
        timestamp: new Date().toISOString()
    };
    
    comment.replies.push(newReply);
    db.save();
    res.json({ success: true, reply: newReply });
});

app.post('/api/forum/comment/edit', (req, res) => {
    const { commentId, email, text } = req.body;
    if (!commentId || !text || text.trim() === '') {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    let isAdmin = false;
    const authHeader = req.headers.authorization || req.body.password || req.query.password;
    if (authHeader) {
        let adminEmail = 'admin@senai.br';
        let adminPass = authHeader.trim();
        if (authHeader.includes(':')) {
            const parts = authHeader.split(':');
            adminEmail = parts[0].trim().toLowerCase();
            adminPass = parts.slice(1).join(':').trim();
        }
        const admins = readJSON(DB_ADMINS_FILE);
        if (admins.find(a => a.email && a.email.toLowerCase() === adminEmail && a.password === adminPass)) {
            isAdmin = true;
        }
    }

    const comment = db.memory.forum.find(c => c.id === commentId);
    if (!comment) {
        return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    if (!isAdmin && (!email || comment.studentEmail.toLowerCase() !== email.trim().toLowerCase())) {
        return res.status(403).json({ error: 'Não autorizado a editar este comentário.' });
    }

    comment.text = text.trim();
    db.save();
    res.json({ success: true, comment });
});

app.post('/api/forum/comment/delete', (req, res) => {
    const { commentId, email } = req.body;
    if (!commentId) {
        return res.status(400).json({ error: 'Falta o ID do comentário.' });
    }

    let isAdmin = false;
    const authHeader = req.headers.authorization || req.body.password || req.query.password;
    if (authHeader) {
        let adminEmail = 'admin@senai.br';
        let adminPass = authHeader.trim();
        if (authHeader.includes(':')) {
            const parts = authHeader.split(':');
            adminEmail = parts[0].trim().toLowerCase();
            adminPass = parts.slice(1).join(':').trim();
        }
        const admins = readJSON(DB_ADMINS_FILE);
        if (admins.find(a => a.email && a.email.toLowerCase() === adminEmail && a.password === adminPass)) {
            isAdmin = true;
        }
    }

    const commentIndex = db.memory.forum.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    const comment = db.memory.forum[commentIndex];

    if (!isAdmin && (!email || comment.studentEmail.toLowerCase() !== email.trim().toLowerCase())) {
        return res.status(403).json({ error: 'Não autorizado a excluir este comentário.' });
    }

    db.memory.forum.splice(commentIndex, 1);
    db.save();
    res.json({ success: true });
});

app.post('/api/forum/reply/edit', (req, res) => {
    const { commentId, replyId, email, text } = req.body;
    if (!commentId || !replyId || !text || text.trim() === '') {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    let isAdmin = false;
    const authHeader = req.headers.authorization || req.body.password || req.query.password;
    if (authHeader) {
        let adminEmail = 'admin@senai.br';
        let adminPass = authHeader.trim();
        if (authHeader.includes(':')) {
            const parts = authHeader.split(':');
            adminEmail = parts[0].trim().toLowerCase();
            adminPass = parts.slice(1).join(':').trim();
        }
        const admins = readJSON(DB_ADMINS_FILE);
        if (admins.find(a => a.email && a.email.toLowerCase() === adminEmail && a.password === adminPass)) {
            isAdmin = true;
        }
    }

    const comment = db.memory.forum.find(c => c.id === commentId);
    if (!comment) {
        return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    const reply = comment.replies.find(r => r.id === replyId);
    if (!reply) {
        return res.status(404).json({ error: 'Resposta não encontrada.' });
    }

    const isCreator = email && reply.authorEmail && reply.authorEmail.toLowerCase() === email.trim().toLowerCase();
    if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'Não autorizado a editar esta resposta.' });
    }

    reply.text = text.trim();
    db.save();
    res.json({ success: true, reply });
});

app.post('/api/forum/reply/delete', (req, res) => {
    const { commentId, replyId, email } = req.body;
    if (!commentId || !replyId) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    let isAdmin = false;
    const authHeader = req.headers.authorization || req.body.password || req.query.password;
    if (authHeader) {
        let adminEmail = 'admin@senai.br';
        let adminPass = authHeader.trim();
        if (authHeader.includes(':')) {
            const parts = authHeader.split(':');
            adminEmail = parts[0].trim().toLowerCase();
            adminPass = parts.slice(1).join(':').trim();
        }
        const admins = readJSON(DB_ADMINS_FILE);
        if (admins.find(a => a.email && a.email.toLowerCase() === adminEmail && a.password === adminPass)) {
            isAdmin = true;
        }
    }

    const comment = db.memory.forum.find(c => c.id === commentId);
    if (!comment) {
        return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    const replyIndex = comment.replies.findIndex(r => r.id === replyId);
    if (replyIndex === -1) {
        return res.status(404).json({ error: 'Resposta não encontrada.' });
    }

    const reply = comment.replies[replyIndex];
    const isCreator = email && reply.authorEmail && reply.authorEmail.toLowerCase() === email.trim().toLowerCase();

    if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'Não autorizado a excluir esta resposta.' });
    }

    comment.replies.splice(replyIndex, 1);
    db.save();
    res.json({ success: true });
});

app.post('/api/admin/forum/all', (req, res) => {
    validateAdmin(req, res, () => {
        res.json({ success: true, comments: db.memory.forum || [] });
    });
});

// ----------------------------------------------------
// DYNAMIC COURSE STRUCTURE AND FILES
// ----------------------------------------------------

// Obter a estrutura dinâmica do curso (módulos e unidades)
app.get('/api/course-structure', (req, res) => {
    res.json(db.memory.courseStructure || []);
});

// Salvar a estrutura do curso (usado para CRUD e drag-and-drop de reordenamento)
app.post('/api/admin/course/structure', (req, res) => {
    validateAdmin(req, res, () => {
        const { structure } = req.body;
        if (!Array.isArray(structure)) {
            return res.status(400).json({ error: 'Formato inválido. Esperado array de módulos.' });
        }
        db.memory.courseStructure = structure;
        db.save();
        res.json({ success: true, structure });
    });
});

// ----------------------------------------------------
// EDITORES DE CONTEÚDO (APOSTILAS E AVALIAÇÕES)
// ----------------------------------------------------

// Salvar conteúdo da apostila (.md)
app.put('/api/admin/material/:key', (req, res) => {
    validateAdmin(req, res, () => {
        const { key } = req.params;
        const { markdownText } = req.body;
        if (markdownText === undefined) {
            return res.status(400).json({ error: 'Conteúdo vazio.' });
        }

        // Valida se o nome do arquivo é seguro
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            return res.status(400).json({ error: 'Chave de material inválida.' });
        }

        const filePath = path.join(__dirname, `${key}.md`);
        
        try {
            // Backup antes de salvar
            if (fs.existsSync(filePath)) {
                const oldContent = fs.readFileSync(filePath, 'utf8');
                makeBackup(key, oldContent, false);
            }
            
            fs.writeFileSync(filePath, markdownText, 'utf8');
            res.json({ success: true });
        } catch (e) {
            console.error("Erro ao salvar material:", e);
            res.status(500).json({ error: 'Falha ao gravar arquivo no disco.' });
        }
    });
});

// Criar nova apostila e unidade
app.post('/api/admin/material/create', (req, res) => {
    validateAdmin(req, res, () => {
        const { moduleId, unitName } = req.body;
        if (!moduleId || !unitName) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        const structure = db.memory.courseStructure || [];
        const targetModule = structure.find(m => m.id === moduleId);
        if (!targetModule) {
            return res.status(404).json({ error: 'Módulo não encontrado.' });
        }

        // Calcula o próximo index da unidade
        const nextId = (targetModule.units.length + 1).toString();
        const cleanModuleId = moduleId.replace(/[^a-zA-Z0-9]/g, '');
        const keyBase = `${cleanModuleId}_${nextId}`;
        const apostilaKey = `Apostila_${keyBase}`;
        const avaliacaoKey = `Avaliacao_${keyBase}`;

        // Cria arquivos em disco e no BD
        const mdPath = path.join(__dirname, `${apostilaKey}.md`);
        const defaultMd = `# 📘 ${unitName}\n\nEscreva o conteúdo da sua nova unidade aqui...\n`;
        
        try {
            fs.writeFileSync(mdPath, defaultMd, 'utf8');
            
            // Cria avaliação em branco na memória
            db.memory.evaluations[avaliacaoKey] = {
                key: avaliacaoKey,
                title: `Avaliação: ${unitName}`,
                theme: unitName,
                rubric: "## Parte 2: Boss Fight\n\nDescreva critérios de avaliação aqui...\n",
                questions: []
            };

            // Adiciona na estrutura do curso
            targetModule.units.push({
                id: nextId,
                name: unitName,
                apostilaKey,
                avaliacaoKey,
                files: []
            });

            db.save();
            res.json({ success: true, apostilaKey, avaliacaoKey, structure });
        } catch(e) {
            console.error("Erro ao criar nova apostila:", e);
            res.status(500).json({ error: 'Falha ao criar arquivos no servidor.' });
        }
    });
});

// Obter avaliação estruturada
app.get('/api/admin/evaluation/:key', (req, res) => {
    validateAdmin(req, res, () => {
        const { key } = req.params;
        let evaluation = db.memory.evaluations[key];
        
        if (!evaluation) {
            // Tenta carregar e migrar se houver arquivo .md legando em disco
            const mdPath = path.join(__dirname, `${key}.md`);
            if (fs.existsSync(mdPath)) {
                try {
                    const mdContent = fs.readFileSync(mdPath, 'utf8');
                    evaluation = parseEvaluationMarkdown(mdContent, key);
                    if (evaluation) {
                        db.memory.evaluations[key] = evaluation;
                        db.save();
                    }
                } catch(e) {}
            }
        }

        if (!evaluation) {
            return res.status(404).json({ error: 'Avaliação não encontrada.' });
        }
        res.json(evaluation);
    });
});

// Salvar avaliação estruturada
app.put('/api/admin/evaluation/:key', (req, res) => {
    validateAdmin(req, res, () => {
        const { key } = req.params;
        const evaluationData = req.body;
        if (!evaluationData || !evaluationData.title) {
            return res.status(400).json({ error: 'Dados da avaliação inválidos.' });
        }

        // Backup
        if (db.memory.evaluations[key]) {
            makeBackup(key, JSON.stringify(db.memory.evaluations[key], null, 2), true);
        }

        db.memory.evaluations[key] = {
            key,
            title: evaluationData.title,
            theme: evaluationData.theme || '',
            rubric: evaluationData.rubric || '',
            questions: Array.isArray(evaluationData.questions) ? evaluationData.questions : []
        };
        db.save();
        res.json({ success: true });
    });
});

// Duplicar avaliação (Prova 2 a partir da Prova 1)
app.post('/api/admin/evaluation/duplicate', (req, res) => {
    validateAdmin(req, res, () => {
        const { sourceKey, targetKey, targetTitle } = req.body;
        if (!sourceKey || !targetKey || !targetTitle) {
            return res.status(400).json({ error: 'Dados incompletos para duplicação.' });
        }

        const sourceEval = db.memory.evaluations[sourceKey];
        if (!sourceEval) {
            return res.status(404).json({ error: 'Avaliação de origem não encontrada.' });
        }

        // Deep copy questions
        const clonedQuestions = JSON.parse(JSON.stringify(sourceEval.questions));

        db.memory.evaluations[targetKey] = {
            key: targetKey,
            title: targetTitle,
            theme: sourceEval.theme,
            rubric: sourceEval.rubric,
            questions: clonedQuestions
        };

        db.save();
        res.json({ success: true, targetKey });
    });
});

// ----------------------------------------------------
// UPLOADS DE MATERIAIS
// ----------------------------------------------------

const multer = require('multer');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

function getFilesForApostila(key) {
    const structure = db.memory.courseStructure || [];
    let files = [];
    structure.forEach(mod => {
        mod.units.forEach(u => {
            if (u.apostilaKey === key) {
                files = u.files || [];
            }
        });
    });
    return files;
}

app.post('/api/admin/upload', (req, res) => {
    validateAdmin(req, res, () => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao fazer upload do arquivo: ' + err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            }
            
            const { apostilaKey } = req.body;
            const originalname = req.file.originalname;
            const filename = req.file.filename;
            const relativePath = '/uploads/' + filename;
            const ext = path.extname(originalname).toLowerCase();
            let fileType = 'other';
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
                fileType = 'image';
            } else if (ext === '.pdf') {
                fileType = 'pdf';
            }
            
            const structure = db.memory.courseStructure || [];
            let linked = false;
            structure.forEach(mod => {
                mod.units.forEach(u => {
                    if (u.apostilaKey === apostilaKey) {
                        if (!u.files) u.files = [];
                        u.files.push({
                            id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            name: originalname,
                            path: relativePath,
                            type: fileType,
                            timestamp: new Date().toISOString()
                        });
                        linked = true;
                    }
                });
            });
            
            if (linked) {
                db.save();
                res.json({ success: true, files: getFilesForApostila(apostilaKey) });
            } else {
                res.status(404).json({ error: 'Apostila não encontrada.' });
            }
        });
    });
});

app.post('/api/admin/upload-image', (req, res) => {
    validateAdmin(req, res, () => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao fazer upload da imagem: ' + err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
            }
            const filename = req.file.filename;
            const relativePath = '/uploads/' + filename;
            
            // EasyMDE expects JSON with a specific structure or we can just return our standard format
            res.json({ success: true, url: relativePath });
        });
    });
});

app.post('/api/admin/material/link', (req, res) => {
    validateAdmin(req, res, () => {
        const { apostilaKey, name, url } = req.body;
        if (!apostilaKey || !name || !url) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }
        
        const structure = db.memory.courseStructure || [];
        let linked = false;
        structure.forEach(mod => {
            mod.units.forEach(u => {
                if (u.apostilaKey === apostilaKey) {
                    if (!u.files) u.files = [];
                    u.files.push({
                        id: 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name,
                        path: url,
                        type: 'link',
                        timestamp: new Date().toISOString()
                    });
                    linked = true;
                }
            });
        });
        
        if (linked) {
            db.save();
            res.json({ success: true, files: getFilesForApostila(apostilaKey) });
        } else {
            res.status(404).json({ error: 'Apostila não encontrada.' });
        }
    });
});

app.post('/api/admin/material/delete-file', (req, res) => {
    validateAdmin(req, res, () => {
        const { apostilaKey, fileId } = req.body;
        if (!apostilaKey || !fileId) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }
        
        const structure = db.memory.courseStructure || [];
        let removed = false;
        structure.forEach(mod => {
            mod.units.forEach(u => {
                if (u.apostilaKey === apostilaKey && u.files) {
                    const beforeLength = u.files.length;
                    u.files = u.files.filter(f => f.id !== fileId);
                    if (u.files.length < beforeLength) {
                        removed = true;
                    }
                }
            });
        });
        
        if (removed) {
            db.save();
            res.json({ success: true, files: getFilesForApostila(apostilaKey) });
        } else {
            res.status(404).json({ error: 'Recurso não encontrado.' });
        }
    });
});

// ----------------------------------------------------
// HISTÓRICO E PROGRESSO DO ESTUDANTE
// ----------------------------------------------------

// Obter progresso de leitura do aluno
app.get('/api/student/progress', (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: 'E-mail não informado.' });
    }
    const lowerEmail = email.toLowerCase();
    res.json({ success: true, completedUnits: db.memory.progress[lowerEmail] || {} });
});

// Salvar progresso de leitura do aluno
app.post('/api/student/progress', (req, res) => {
    const { email, completedUnits } = req.body;
    if (!email || !completedUnits) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }
    const lowerEmail = email.toLowerCase();
    db.memory.progress[lowerEmail] = completedUnits;
    db.save();
    res.json({ success: true });
});

// Função de backup automático
function makeBackup(key, content, isJson = false) {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = isJson ? '.json' : '.md';
    const backupPath = path.join(backupDir, `${key}_${timestamp}${ext}.bak`);
    fs.writeFileSync(backupPath, content, 'utf8');
}

// ==========================================
// SESSIONS E PING APRIMORADO
// ==========================================
app.get('/api/ping', (req, res) => {
    const email = req.query.email;
    if (email) {
        db.memory.sessions[email] = Date.now();
    }
    res.send('pong');
});

// Remove sessões ociosas há mais de 10 segundos
setInterval(() => {
    const now = Date.now();
    for (const email in db.memory.sessions) {
        if (now - db.memory.sessions[email] > 10000) {
            delete db.memory.sessions[email];
        }
    }
}, 5000);

// Endpoint explícito de saída (sendBeacon)
app.post('/api/student/leave', (req, res) => {
    const { email } = req.body;
    if (email && db.memory.sessions[email]) {
        delete db.memory.sessions[email];
    }
    res.send('ok');
});

// Rota de fallback para servir index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

let serverInstance;

db.init().then(() => {
    // Garante IDs e e-mails de autor consistentes no fórum (migração automática)
    if (db.memory && db.memory.forum) {
        let migrated = false;
        db.memory.forum.forEach(comment => {
            if (!comment.id) {
                comment.id = 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                migrated = true;
            }
            if (comment.replies) {
                comment.replies.forEach((reply, idx) => {
                    if (!reply.id) {
                        reply.id = 'reply_' + (Date.now() + idx) + '_' + Math.random().toString(36).substr(2, 5);
                        migrated = true;
                    }
                    if (!reply.authorEmail) {
                        reply.authorEmail = reply.authorRole === 'Instrutor' ? 'admin@senai.br' : (comment.studentEmail || '');
                        migrated = true;
                    }
                });
            }
        });
        if (migrated) {
            db.save();
        }
    }

    // Inicia o servidor e informa o endereço IP da rede local
    serverInstance = app.listen(PORT, '0.0.0.0', () => {
        console.log(`===========================================`);
        console.log(`🟢 Servidor LMS iniciado com sucesso!`);
        console.log(` Porta local: ${PORT}`);
        console.log(`===========================================`);
        console.log(`Para acessar deste computador:`);
        console.log(` -> http://localhost:${PORT}`);
        console.log(`\nPara os alunos acessarem pelo celular ou outros PCs na mesma rede WiFi:`);
        
        localIpAddresses.forEach(ip => {
            // Highlight commonly used WiFi/Ethernet IPs instead of VirtualBox ones
            const isVBox = ip.name.toLowerCase().includes('virtualbox') || ip.address.startsWith('192.168.56.');
            if (isVBox) {
                console.log(` -> http://${ip.address}:${PORT}  (⚠️ Ignorar: Rede VirtualBox)`);
            } else {
                console.log(` -> http://${ip.address}:${PORT}  (✅ Recomendado: ${ip.name})`);
            }
        });

        console.log(`===========================================`);
        console.log(`⚠️ IMPORTANTE: Lembre-se de liberar a porta ${PORT} no Firewall do Windows, se necessário!`);
    });
}).catch(err => {
    console.error("Falha ao inicializar o banco de dados SQLite:", err);
    process.exit(1);
});
