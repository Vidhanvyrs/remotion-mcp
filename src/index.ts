import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import cors from "cors";
import { autoRegisterTools } from "./utils/autoRegister.js";

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
async function createServer(): Promise<McpServer> {
    const server = new McpServer({
        name: "remotion-mcp",
        version: "1.0.0",
    });

    // Auto-discover and register all tools in src/tools/
    await autoRegisterTools(server);
    return server;
}

// ── Main ─────────────────────────────────────────────────────────
async function main(): Promise<void> {
    const mode = process.env.MCP_MODE ?? "stdio"; // "stdio" | "http"

    if (mode === "http") {
        // HTTP mode — useful for remote/cloud deploy
        const app = express();
        app.use(cors());
        app.use(express.json());

        // ── Health check (for Railway/Fly.io/Docker HEALTHCHECK) ──
        app.get("/health", (_req: Request, res: Response) => {
            res.json({ status: "ok", server: "remotion-mcp", mode: "http" });
        });

        // ── MCP endpoint ──────────────────────────────────────────
        app.post("/mcp", async (req: Request, res: Response) => {
            const server = await createServer();
            const transport = new StreamableHTTPServerTransport();
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });

        const port = process.env.PORT ?? 3000;
        app.listen(port, () => {
            console.error(`Remotion MCP running on http://localhost:${port}/mcp`);
            console.error(`Health check: http://localhost:${port}/health`);
        });
    } else {
        // Stdio mode — default, works with Claude Desktop & Claude Code
        const server = await createServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Remotion MCP server running via stdio");
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});