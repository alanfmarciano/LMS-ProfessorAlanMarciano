const fs = require('fs');
const path = require('path');

// Extract parser from server.js
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

    return { questions, gabarito };
}

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath);

console.log("=== DIAGNÓSTICO DOS ARQUIVOS DE CONTEÚDO ===");

files.forEach(file => {
    if (!file.endsWith('.md')) return;
    if (['implementation_plan.md', 'task.md', 'walkthrough.md', 'manual_novas_unidades.md', 'readme.md'].includes(file.toLowerCase())) return;

    const content = fs.readFileSync(path.join(directoryPath, file), 'utf8');
    const lines = content.split('\n');

    if (file.startsWith('Apostila_')) {
        console.log(`📘 ${file}: ${lines.length} linhas (Capítulos: ${lines.filter(l => l.startsWith('## 📜 CAPÍTULO') || l.startsWith('## 📝 CAPÍTULO')).length})`);
    } else if (file.startsWith('Avaliacao_')) {
        const parsed = parseEvaluationMarkdown(content);
        const qCount = parsed ? parsed.questions.length : 0;
        const gCount = parsed ? Object.keys(parsed.gabarito).length : 0;
        const hasRubric = content.includes('## Parte 2');
        console.log(`🎯 ${file}: ${qCount} questões (Gabarito: ${gCount} itens, Rúbrica: ${hasRubric ? 'Sim' : 'Não'})`);
        
        // Verificar se há questões sem gabarito correspondente
        if (parsed) {
            const missingGabarito = parsed.questions.filter(q => !q.correctAnswer);
            if (missingGabarito.length > 0) {
                console.log(`   ⚠️ ALERTA: Questões sem gabarito: ${missingGabarito.map(q => q.originalNumber).join(', ')}`);
            }
        }
    }
});
