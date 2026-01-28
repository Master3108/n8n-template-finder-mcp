// MCP Server with SSE Transport for n8n
// Version: 1.0.0
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Cargar datos
let workflowsIndex = [];
let agencyMission = {};

async function loadData() {
    try {
        const indexPath = path.join(__dirname, 'data', 'workflows-index.json');
        const agencyPath = path.join(__dirname, 'agency-mission.json');

        const indexData = await fs.readFile(indexPath, 'utf-8');
        workflowsIndex = JSON.parse(indexData);

        const agencyData = await fs.readFile(agencyPath, 'utf-8');
        agencyMission = JSON.parse(agencyData);

        console.log(`✅ Loaded ${workflowsIndex.length} workflows`);
        console.log(`✅ Loaded agency mission data`);
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// Función para buscar workflows
function searchWorkflows(query, limit = 10) {
    const lowerQuery = query.toLowerCase();

    const results = workflowsIndex
        .filter(workflow => {
            const nameMatch = workflow.name?.toLowerCase().includes(lowerQuery);
            const descMatch = workflow.description?.toLowerCase().includes(lowerQuery);
            const tagsMatch = workflow.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

            return nameMatch || descMatch || tagsMatch;
        })
        .slice(0, limit);

    return results;
}

// Crear servidor MCP
const mcpServer = new Server(
    {
        name: 'n8n-template-finder',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// Registrar herramientas MCP
mcpServer.setRequestHandler('tools/list', async () => {
    return {
        tools: [
            {
                name: 'search_n8n_templates',
                description: 'Busca plantillas de n8n por nombre, descripción o tags',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Término de búsqueda',
                        },
                        limit: {
                            type: 'number',
                            description: 'Número máximo de resultados (default: 10)',
                            default: 10,
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_agency_info',
                description: 'Obtiene información sobre la misión y productos de la agencia',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    };
});

// Handler para ejecutar herramientas
mcpServer.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'search_n8n_templates') {
        const { query, limit = 10 } = args;
        const results = searchWorkflows(query, limit);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }

    if (name === 'get_agency_info') {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(agencyMission, null, 2),
                },
            ],
        };
    }

    throw new Error(`Unknown tool: ${name}`);
});

// Registrar recursos MCP
mcpServer.setRequestHandler('resources/list', async () => {
    return {
        resources: [
            {
                uri: 'workflow://templates/all',
                name: 'All N8N Templates',
                description: `Lista completa de ${workflowsIndex.length} plantillas de n8n`,
                mimeType: 'application/json',
            },
            {
                uri: 'agency://mission',
                name: 'Agency Mission',
                description: 'Misión y productos de la agencia',
                mimeType: 'application/json',
            },
        ],
    };
});

// Handler para leer recursos
mcpServer.setRequestHandler('resources/read', async (request) => {
    const { uri } = request.params;

    if (uri === 'workflow://templates/all') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(workflowsIndex, null, 2),
                },
            ],
        };
    }

    if (uri === 'agency://mission') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(agencyMission, null, 2),
                },
            ],
        };
    }

    throw new Error(`Unknown resource: ${uri}`);
});

// Endpoint SSE para n8n
app.get('/sse', async (req, res) => {
    console.log('📡 Nueva conexión SSE desde:', req.ip);

    const transport = new SSEServerTransport('/message', res);
    await mcpServer.connect(transport);

    res.on('close', () => {
        console.log('❌ Conexión SSE cerrada');
    });
});

// Endpoint POST para mensajes (usado por el SSE transport)
app.post('/message', async (req, res) => {
    console.log('📨 Mensaje recibido:', req.body);
    // El transporte SSE maneja esto automáticamente
    res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'MCP Server for n8n',
        version: '1.0.0',
        workflows: workflowsIndex.length,
        timestamp: new Date().toISOString(),
    });
});

// Endpoint de búsqueda directo (alternativa REST)
app.get('/search', (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = searchWorkflows(q, parseInt(limit));
    res.json({
        query: q,
        count: results.length,
        results,
    });
});

// Iniciar servidor
async function start() {
    await loadData();

    app.listen(PORT, () => {
        console.log('🚀 MCP Server (SSE) corriendo en:');
        console.log(`   http://localhost:${PORT}`);
        console.log('');
        console.log('📡 Endpoints disponibles:');
        console.log(`   SSE:    GET  http://localhost:${PORT}/sse`);
        console.log(`   Health: GET  http://localhost:${PORT}/health`);
        console.log(`   Search: GET  http://localhost:${PORT}/search?q=telegram`);
        console.log('');
        console.log('✨ Listo para conectar con n8n!');
    });
}

start().catch(console.error);
