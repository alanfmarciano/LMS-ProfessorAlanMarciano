const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos do portal (HTML, CSS, JS, Imagens)
app.use(express.static(__dirname));

// Caminhos dos arquivos de banco de dados locais
const DB_STUDENTS_FILE = path.join(__dirname, 'db_students.json');
const DB_SUBMISSIONS_FILE = path.join(__dirname, 'db_submissions.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const DB_CLASSES_FILE = path.join(__dirname, 'db_classes.json');
const DB_ADMINS_FILE = path.join(__dirname, 'db_admins.json');

// Armazena o IP da rede local
let localIpAddress = 'localhost';
function detectIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        let iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            let alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                localIpAddress = alias.address;
                return;
            }
        }
    }
}
detectIP();

// Inicializa os arquivos se não existirem
function initDB() {
    if (!fs.existsSync(DB_STUDENTS_FILE)) {
        fs.writeFileSync(DB_STUDENTS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(DB_SUBMISSIONS_FILE)) {
        fs.writeFileSync(DB_SUBMISSIONS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(DB_ADMINS_FILE)) {
        const defaultAdmins = [
            {
                name: 'Administrador Geral',
                email: 'admin@senai.br',
                password: 'admin'
            }
        ];
        fs.writeFileSync(DB_ADMINS_FILE, JSON.stringify(defaultAdmins, null, 2), 'utf8');
    }
    if (!fs.existsSync(DB_CLASSES_FILE)) {
        const defaultReleasedItems = {};
        const modules = ['FUTEC', 'FECOP', 'IRCOM'];
        modules.forEach(m => {
            for (let i = 1; i <= 5; i++) {
                defaultReleasedItems[`Apostila_${m}_${i}`] = true;
                defaultReleasedItems[`Avaliacao_${m}_${i}`] = false;
            }
        });

        const defaultClasses = [
            { 
                name: '1DES', 
                period: 'Manhã',
                registrationEnabled: true,
                activeExamKey: null,
                activeExamQuestionCount: 20,
                releasedItems: { ...defaultReleasedItems }
            },
            { 
                name: '2DES', 
                period: 'Tarde',
                registrationEnabled: true,
                activeExamKey: null,
                activeExamQuestionCount: 20,
                releasedItems: { ...defaultReleasedItems }
            }
        ];
        fs.writeFileSync(DB_CLASSES_FILE, JSON.stringify(defaultClasses, null, 2), 'utf8');
    }

    // Garantir migração de período se o arquivo já existir
    if (fs.existsSync(DB_CLASSES_FILE)) {
        try {
            const classes = JSON.parse(fs.readFileSync(DB_CLASSES_FILE, 'utf8'));
            let updated = false;
            classes.forEach(c => {
                if (!c.period) {
                    c.period = c.name.includes('1') ? 'Manhã' : 'Tarde';
                    updated = true;
                }
            });
            if (updated) {
                fs.writeFileSync(DB_CLASSES_FILE, JSON.stringify(classes, null, 2), 'utf8');
            }
        } catch (e) {
            console.error("Erro ao migrar db_classes.json:", e);
        }
    }
    
    // Configurações padrão de liberação de itens
    const defaultReleasedItems = {};
    const modules = ['FUTEC', 'FECOP', 'IRCOM'];
    modules.forEach(m => {
        for (let i = 1; i <= 5; i++) {
            defaultReleasedItems[`Apostila_${m}_${i}`] = true;   // Liberadas por padrão
            defaultReleasedItems[`Avaliacao_${m}_${i}`] = false; // Trancadas por padrão
        }
    });

    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            adminPassword: 'admin', // Senha padrão para o instrutor
            activeExamKey: null,    // Nenhuma prova liberada por padrão
            releasedItems: defaultReleasedItems
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf8');
    } else {
        // Se já existe, garante que releasedItems está presente
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (!config.releasedItems) {
                config.releasedItems = defaultReleasedItems;
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
            }
        } catch (e) {
            console.error("Erro ao migrar config.json:", e);
        }
    }
}
initDB();

// Função para ler dados JSON de forma segura
function readJSON(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Erro ao ler arquivo ${file}:`, e);
        return [];
    }
}

// Função para escrever dados JSON
function writeJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`Erro ao escrever no arquivo ${file}:`, e);
    }
}

// Parser de Markdown de Avaliações (idêntico ao do frontend para correções no backend)
function parseEvaluationMarkdown(markdownText) {
    if (!markdownText) return null;

    // Extrair gabarito do <details>
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

    // Extrair questões
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

    return questions;
}

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
        activeExamKey: cls.activeExamKey,
        activeExamQuestionCount: cls.activeExamQuestionCount || 20,
        releasedItems: cls.releasedItems || {}
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
    if (!cls || cls.activeExamKey !== examKey) {
        return res.status(403).json({ error: 'Esta prova não está ativa para a sua turma no momento.' });
    }

    // Localiza e lê o arquivo da prova
    const filePath = path.join(__dirname, `${examKey}.md`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Prova não encontrada no servidor.' });
    }

    const mdContent = fs.readFileSync(filePath, 'utf8');
    const questions = parseEvaluationMarkdown(mdContent);
    
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
        let responseData = {
            activeExamKey: config.activeExamKey,
            releasedItems: config.releasedItems || {},
            serverUrl: `http://${localIpAddress}:${PORT}`
        };
        
        if (studentClass) {
            const classes = readJSON(DB_CLASSES_FILE);
            const cls = classes.find(c => c.name === studentClass);
            if (cls) {
                responseData.activeExamKey = cls.activeExamKey;
                responseData.activeExamQuestionCount = cls.activeExamQuestionCount || 20;
                responseData.releasedItems = cls.releasedItems || {};
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

// Trancar/Liberar Prova Ativa no Simulador por turma
app.post('/api/admin/lock-exam', (req, res) => {
    validateAdmin(req, res, (config) => {
        const { studentClass, activeExamKey, activeExamQuestionCount } = req.body;
        if (!studentClass) {
            return res.status(400).json({ error: 'Turma não informada.' });
        }
        
        const classes = readJSON(DB_CLASSES_FILE);
        const cls = classes.find(c => c.name === studentClass);
        if (!cls) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        cls.activeExamKey = activeExamKey || null;
        cls.activeExamQuestionCount = parseInt(activeExamQuestionCount) || cls.activeExamQuestionCount || 20;

        writeJSON(DB_CLASSES_FILE, classes);
        res.json({ success: true, activeExamKey: cls.activeExamKey, activeExamQuestionCount: cls.activeExamQuestionCount });
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

// Obter alunos cadastrados
app.get('/api/admin/students', (req, res) => {
    validateAdmin(req, res, () => {
        const students = readJSON(DB_STUDENTS_FILE);
        res.json(students);
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
            activeExamKey: null,
            activeExamQuestionCount: 20,
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
            cls.activeExamKey = null;
            cls.activeExamQuestionCount = 20;
            cls.releasedItems = { ...defaultReleasedItems };
        });
        writeJSON(DB_CLASSES_FILE, classes);

        res.json({ success: true, message: 'Sala de aula e configurações de todas as turmas resetadas com sucesso!' });
    });
});

// Rota de fallback para servir index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia o servidor e informa o endereço IP da rede local
const serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n======================================================');
    console.log(`🚀 SERVIDOR LMS LOCAL INICIADO COM SUCESSO!`);
    console.log(`   Acesso do Aluno: http://localhost:${PORT}`);
    console.log(`   Alunos na rede devem acessar: http://${localIpAddress}:${PORT}`);
    console.log(`   Painel do Instrutor (Admin): http://localhost:${PORT}/admin.html`);
    console.log(`======================================================\n`);
});
