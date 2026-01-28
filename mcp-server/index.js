import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";

const INDEX_PATH = "c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\n8n-template-finder\\src\\data\\workflows-index.json";
const TEMPLATES_BASE_PATH = "c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\n8n-template-finder\\templates";
const MISSION_PATH = "c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\n8n-template-finder\\mcp-server\\agency-mission.json";

const server = new Server(
    {
        name: "n8n-agency-expert",
        version: "1.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

let workflowsIndex = [];
let agencyMission = null;

function loadData() {
    try {
        const indexData = fs.readFileSync(INDEX_PATH, "utf8");
        workflowsIndex = JSON.parse(indexData);

        const missionData = fs.readFileSync(MISSION_PATH, "utf8");
        agencyMission = JSON.parse(missionData);

        console.error(`Expert Mode: Loaded ${workflowsIndex.length} workflows and Agency Mission.`);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_agency_mission",
                description: "Get the strategic plan, vision, mission and the 10 MVP products of the IA agency",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "search_n8n_templates",
                description: "Search for n8n workflow templates. Prioritizes those aligned with the agency's 10 MVP products.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search term (e.g., 'leads', 'citas', 'whatsapp')",
                        },
                        limit: {
                            type: "number",
                            description: "Max results",
                        }
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_n8n_template_content",
                description: "Get the full JSON content of a specific n8n template",
                inputSchema: {
                    type: "object",
                    properties: {
                        templatePath: {
                            type: "string",
                            description: "The relative path from the index",
                        },
                    },
                    required: ["templatePath"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "get_agency_mission") {
        return {
            content: [{ type: "text", text: JSON.stringify(agencyMission, null, 2) }],
        };
    }

    if (name === "search_n8n_templates") {
        const query = args.query.toLowerCase();
        const limit = args.limit || 10;

        const results = workflowsIndex
            .map(w => {
                // Check if this workflow is one of our strategic references
                const isStrategic = agencyMission.strategic_products.some(p =>
                    w.path.includes(p.template_reference.replace(/\//g, '\\')) ||
                    p.template_reference.replace(/\//g, '\\').includes(w.path)
                );
                return { ...w, isStrategic };
            })
            .filter((w) => {
                const nameMatch = w.name?.toLowerCase().includes(query);
                const descMatch = w.description?.toLowerCase().includes(query);
                const nodesMatch = w.nodeTypes?.some(n => n.toLowerCase().includes(query));
                return nameMatch || descMatch || nodesMatch || w.isStrategic && w.name.toLowerCase().includes(query);
            })
            .sort((a, b) => (b.isStrategic ? 1 : 0) - (a.isStrategic ? 1 : 0))
            .slice(0, limit)
            .map((w) => ({
                name: w.name + (w.isStrategic ? " ⭐ [PRODUCTO ESTRATÉGICO]" : ""),
                path: w.path,
                nodeCount: w.nodeCount,
                strategicAsset: w.isStrategic
            }));

        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    }

    if (name === "get_n8n_template_content") {
        const fullPath = path.join(TEMPLATES_BASE_PATH, args.templatePath);
        try {
            const content = fs.readFileSync(fullPath, "utf8");
            return { content: [{ type: "text", text: content }] };
        } catch (error) {
            return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
        }
    }

    throw new Error(`Tool not found: ${name}`);
});

async function main() {
    loadData();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
