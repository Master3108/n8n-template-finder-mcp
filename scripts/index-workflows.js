import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para procesar un workflow JSON
function processWorkflow(filePath, relativePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const workflow = JSON.parse(content);

        // Extraer información relevante
        const nodes = workflow.nodes || [];
        const nodeTypes = [...new Set(nodes.map(n => n.type))];
        const nodeNames = nodes.map(n => n.name);

        return {
            id: path.basename(filePath, '.json'),
            path: relativePath,
            name: workflow.name || path.basename(filePath, '.json'),
            description: workflow.description || '',
            category: workflow.meta?.category || 'uncategorized',
            tags: workflow.tags || [],
            status: workflow.meta?.status || 'unknown',
            priority: workflow.meta?.priority || 'medium',
            nodeCount: nodes.length,
            nodeTypes: nodeTypes,
            nodeNames: nodeNames,
            // Para búsqueda
            searchText: `${workflow.name} ${workflow.description} ${nodeTypes.join(' ')} ${(workflow.tags || []).join(' ')}`.toLowerCase()
        };
    } catch (error) {
        console.error(`Error procesando ${filePath}:`, error.message);
        return null;
    }
}

// Función recursiva para encontrar todos los JSON
function findAllWorkflows(dir, baseDir, results = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findAllWorkflows(filePath, baseDir, results);
        } else if (file.endsWith('.json')) {
            const relativePath = path.relative(baseDir, filePath);
            const workflowData = processWorkflow(filePath, relativePath);
            if (workflowData) {
                results.push(workflowData);
            }
        }
    }

    return results;
}

// Función principal
async function indexWorkflows() {
    console.log('🔍 Iniciando indexación de workflows...\n');

    const templatesDir = path.join(__dirname, '..', 'templates');
    const allWorkflows = [];

    // Procesar todas las carpetas de templates
    const templateFolders = fs.readdirSync(templatesDir);

    for (const folder of templateFolders) {
        const folderPath = path.join(templatesDir, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            console.log(`📂 Procesando: ${folder}...`);
            const workflows = findAllWorkflows(folderPath, templatesDir);
            allWorkflows.push(...workflows);
            console.log(`   ✅ Encontrados: ${workflows.length} workflows\n`);
        }
    }

    // Estadísticas
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total de workflows: ${allWorkflows.length}`);

    const categories = {};
    allWorkflows.forEach(w => {
        categories[w.category] = (categories[w.category] || 0) + 1;
    });

    console.log(`\n📑 Por categoría:`);
    Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count}`);
        });

    // Guardar índice
    const indexPath = path.join(__dirname, '..', 'src', 'data', 'workflows-index.json');
    const indexDir = path.dirname(indexPath);

    if (!fs.existsSync(indexDir)) {
        fs.mkdirSync(indexDir, { recursive: true });
    }

    fs.writeFileSync(indexPath, JSON.stringify(allWorkflows, null, 2));
    console.log(`\n💾 Índice guardado en: ${indexPath}`);

    // Crear resumen compacto
    const summaryPath = path.join(__dirname, '..', 'src', 'data', 'workflows-summary.json');
    const summary = {
        total: allWorkflows.length,
        categories: categories,
        lastUpdated: new Date().toISOString(),
        topTags: getTopTags(allWorkflows, 50)
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`💾 Resumen guardado en: ${summaryPath}\n`);

    console.log('✅ Indexación completada!\n');
}

function getTopTags(workflows, limit) {
    const tagCounts = {};
    workflows.forEach(w => {
        (w.tags || []).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
}

// Ejecutar
indexWorkflows().catch(console.error);
