import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import cors from "cors";

import { registerListCompositions } from "./tools/listCompositions.js";
import { registerRenderVideo } from "./tools/renderVideo.js";
import { registerRenderStill } from "./tools/renderStill.js";
import { registerCreateComposition } from "./tools/createComposition.js";
import { registerInitProject } from "./tools/initProject.js";
import { registerUpdateComposition } from "./tools/updateComposition.js";
import { registerGetCompositionCode } from "./tools/getCompositionCode.js";
import { registerRenderGif } from "./tools/renderGif.js";
import { registerListProjectFiles } from "./tools/listProjectFiles.js";
import { registerAddComponent } from "./tools/addComponent.js";
import { registerGetRenderStatus } from "./tools/getRenderStatus.js";

// Intercept and redirect all non-JSON stdout writes to stderr.
// This prevents external libraries (like Remotion, Webpack, or Chromium) 
// from printing logs/progress to stdout and corrupting the MCP Stdio transport.
const originalStdoutWrite = process.stdout.write;
process.stdout.write = function (chunk: any, encoding?: any, callback?: any): boolean {
    const str = typeof chunk === "string" ? chunk : chunk.toString();
    if (str.trim().startsWith("{")) {
        return originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
    }
    return process.stderr.write(chunk, encoding, callback);
} as any;

// ── Server factory ────────────────────────────────────────────────
function createServer(): McpServer {
    const server = new McpServer({
        name: "remotion-mcp",
        version: "1.0.0",
    });

    registerTools(server);
    return server;
}

// ── Register all Remotion tools ───────────────────────────────────
function registerTools(server: McpServer): void {
    registerListCompositions(server);
    registerRenderVideo(server);
    registerRenderStill(server);
    registerCreateComposition(server);
    registerInitProject(server);
    registerUpdateComposition(server);
    registerGetCompositionCode(server);
    registerRenderGif(server);
    registerListProjectFiles(server);
    registerAddComponent(server);
    registerGetRenderStatus(server);
}

// ── Main: stdio (for Claude Desktop / Claude Code) ────────────────
async function main(): Promise<void> {
    const mode = process.env.MCP_MODE ?? "stdio"; // "stdio" | "http"

    if (mode === "http") {
        // HTTP mode — useful for remote/cloud deploy
        const app = express();
        app.use(cors());
        app.use(express.json());

        app.post("/mcp", async (req: Request, res: Response) => {
            const server = createServer();
            const transport = new StreamableHTTPServerTransport();
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });

        const port = process.env.PORT ?? 3000;
        app.listen(port, () => {
            console.error(`Remotion MCP running on http://localhost:${port}/mcp`);
        });
    } else {
        // Stdio mode — default, works with Claude Desktop & Claude Code
        const server = createServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Remotion MCP server running via stdio");
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});