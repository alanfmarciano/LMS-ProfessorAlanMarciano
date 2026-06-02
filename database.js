const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const DB_STUDENTS_FILE = path.join(__dirname, 'db_students.json');
const DB_CLASSES_FILE = path.join(__dirname, 'db_classes.json');
const DB_SUBMISSIONS_FILE = path.join(__dirname, 'db_submissions.json');
const DB_NOTES_FILE = path.join(__dirname, 'db_notes.json');
const DB_ANNOTATIONS_FILE = path.join(__dirname, 'db_annotations.json');
const DB_FORUM_FILE = path.join(__dirname, 'db_forum.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

let memoryDB = {
    students: [],
    classes: [],
    submissions: [],
    notes: {},
    annotations: {},
    forum: [],
    config: { releasedItems: {} },
    sessions: {} // Alunos online { "email": last_ping_timestamp }
};

let writeQueue = false;

function initDB() {
    try { if (fs.existsSync(DB_STUDENTS_FILE)) memoryDB.students = JSON.parse(fs.readFileSync(DB_STUDENTS_FILE, 'utf8')); } catch(e) {}
    try { if (fs.existsSync(DB_CLASSES_FILE)) memoryDB.classes = JSON.parse(fs.readFileSync(DB_CLASSES_FILE, 'utf8')); } catch(e) {}
    try { if (fs.existsSync(DB_SUBMISSIONS_FILE)) memoryDB.submissions = JSON.parse(fs.readFileSync(DB_SUBMISSIONS_FILE, 'utf8')); } catch(e) {}
    try { if (fs.existsSync(DB_NOTES_FILE)) memoryDB.notes = JSON.parse(fs.readFileSync(DB_NOTES_FILE, 'utf8')); } catch(e) {}
    try { if (fs.existsSync(DB_ANNOTATIONS_FILE)) memoryDB.annotations = JSON.parse(fs.readFileSync(DB_ANNOTATIONS_FILE, 'utf8')); } catch(e) {}
    try { if (fs.existsSync(DB_FORUM_FILE)) memoryDB.forum = JSON.parse(fs.readFileSync(DB_FORUM_FILE, 'utf8')); } catch(e) {}
    try { if (fs.existsSync(CONFIG_FILE)) memoryDB.config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch(e) {}
}

function saveToDisk() {
    if (writeQueue) return;
    writeQueue = true;
    setTimeout(() => {
        try {
            fs.writeFileSync(DB_STUDENTS_FILE, JSON.stringify(memoryDB.students, null, 2));
            fs.writeFileSync(DB_CLASSES_FILE, JSON.stringify(memoryDB.classes, null, 2));
            fs.writeFileSync(DB_SUBMISSIONS_FILE, JSON.stringify(memoryDB.submissions, null, 2));
            fs.writeFileSync(DB_NOTES_FILE, JSON.stringify(memoryDB.notes, null, 2));
            fs.writeFileSync(DB_ANNOTATIONS_FILE, JSON.stringify(memoryDB.annotations, null, 2));
            fs.writeFileSync(DB_FORUM_FILE, JSON.stringify(memoryDB.forum, null, 2));
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(memoryDB.config, null, 2));
        } catch (e) {
            console.error("Erro ao salvar BD no disco", e);
        } finally {
            writeQueue = false;
        }
    }, 250);
}

initDB();

module.exports = {
    get memory() { return memoryDB; },
    save: saveToDisk
};
