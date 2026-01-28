// MCP Server with SSE Transport for n8n
// Version: 1.0.2 (Fix SSE Message Handling)
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Almacenar el transporte de forma global para acceder desde el POST
let sseTransport;

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(express.json());

// Cargar datos
let workflowsIndex = [];
let agencyMission = {};

async function loadData() {
    try {
        const indexPath = path.join(__dirname, 'data', 'workflows-index.json');
        const agencyPath = path.join(__dirname, 'data', 'agency-mission.json');

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
    return workflowsIndex
        .filter(workflow => {
            const nameMatch = workflow.name?.toLowerCase().includes(lowerQuery);
            const descMatch = workflow.description?.toLowerCase().includes(lowerQuery);
            const tagsMatch = workflow.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
            return nameMatch || descMatch || tagsMatch;
        })
        .slice(0, limit);
}

// Crear servidor MCP
const mcpServer = new Server(
    { name: 'n8n-template-finder', version: '1.0.2' },
    { capabilities: { tools: {}, resources: {} } }
);

// --- HANDLERS ---

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'search_n8n_templates',
            description: 'Busca plantillas de n8n por nombre, descripción o tags',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Término de búsqueda' },
                    limit: { type: 'number', description: 'Máximo de resultados', default: 10 },
                },
                required: ['query'],
            },
        },
        {
            name: 'get_agency_info',
            description: 'Obtiene información sobre la misión de la agencia',
            inputSchema: { type: 'object', properties: {} },
        },
    ],
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'search_n8n_templates') {
        const results = searchWorkflows(args.query, args.limit || 10);
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }

    if (name === 'get_agency_info') {
        return { content: [{ type: 'text', text: JSON.stringify(agencyMission, null, 2) }] };
    }

    throw new Error(`Tool unknown: ${name}`);
});

mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
        { uri: 'workflow://templates/all', name: 'All N8N Templates', mimeType: 'application/json' },
        { uri: 'agency://mission', name: 'Agency Mission', mimeType: 'application/json' },
    ],
}));

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === 'workflow://templates/all') {
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(workflowsIndex, null, 2) }] };
    }
    if (uri === 'agency://mission') {
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(agencyMission, null, 2) }] };
    }
    throw new Error(`Resource unknown: ${uri}`);
});

// --- ENDPOINTS PARA n8n ---

app.get('/sse', async (req, res) => {
    console.log('📡 Nueva conexión SSE desde n8n');

    // IMPORTANTE: Cabeceras para evitar buffering y mantener conexión viva
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desactivar proxy buffering

    sseTransport = new SSEServerTransport('/message', res);
    await mcpServer.connect(sseTransport);

    // Limpiar transporte al cerrar
    req.on('close', () => {
        console.log('🔌 Conexión SSE cerrada');
        sseTransport = null;
    });
});

app.post('/message', async (req, res) => {
    if (sseTransport) {
        console.log('📥 Recibido mensaje desde n8n');
        await sseTransport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No active SSE connection');
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', workflows: workflowsIndex.length });
});

async function start() {
    await loadData();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 MCP Server (SSE) listo en puerto ${PORT}`);
    });
}

start().catch(console.error);
