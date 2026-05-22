/**
 * Smoke tests for remotion-mcp tools.
 *
 * Uses the MCP SDK's InMemoryTransport to wire a real McpServer to a real
 * Client in-process — no HTTP, no spawned child process, no network.
 *
 * Run with:  npm test  (or npx tsx tests/smoke.ts)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { autoRegisterTools } from "../src/utils/autoRegister.js";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

// ─── Helpers ────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ ${name}`);
        console.error(`     ${err instanceof Error ? err.message : String(err)}`);
        failed++;
    }
}

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertShape(obj: unknown, fields: string[]): void {
    if (typeof obj !== "object" || obj === null) {
        throw new Error(`Expected object, got ${typeof obj}`);
    }
    for (const field of fields) {
        if (!(field in obj)) throw new Error(`Missing field: ${field}`);
    }
}

// ─── Setup: boot a real server + client in-process ─────────────────────────

async function createTestClient(): Promise<Client> {
    const server = new McpServer({ name: "remotion-mcp-test", version: "1.0.0" });
    await autoRegisterTools(server);

    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    const client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
    return client;
}

// ─── Utility: call a tool and parse the text response as JSON ───────────────

async function callTool(
    client: Client,
    toolName: string,
    args: Record<string, unknown>
): Promise<{ raw: string; json?: unknown; isError: boolean }> {
    const result = await client.callTool({ name: toolName, arguments: args });
    const content = result.content as Array<{ type: string; text: string }>;
    const raw = content[0]?.text ?? "";
    let json: unknown;
    try { json = JSON.parse(raw); } catch { /* not JSON */ }
    return { raw, json, isError: !!result.isError };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

async function runTests(): Promise<void> {
    console.log("\n🧪 remotion-mcp smoke tests\n");

    const client = await createTestClient();

    // 1. list_tools — verify all expected tools are registered
    await test("list_tools returns all 12 expected tools", async () => {
        const { tools } = await client.listTools();
        const names = tools.map((t) => t.name);
        const expected = [
            "add_component",
            "create_composition_scaffold",
            "get_composition_code",
            "get_render_status",
            "init_remotion_project",
            "list_compositions",
            "list_project_files",
            "render_gif",
            "render_still",
            "render_video",
            "update_composition",
            "query_remotion_docs",
        ];
        for (const name of expected) {
            assert(names.includes(name), `Tool '${name}' not registered. Got: ${names.join(", ")}`);
        }
    });

    // 2. list_project_files — happy path
    const projectPath = path.resolve(__dirname, "..");
    await test("list_project_files returns a file tree", async () => {
        const { raw, isError } = await callTool(client, "list_project_files", { projectPath });
        assert(!isError, `Expected success, got error: ${raw}`);
        assert(raw.includes("src/"), "File tree should include src/");
        assert(raw.includes("package.json"), "File tree should include package.json");
    });

    // 3. list_project_files — bad path
    await test("list_project_files returns error for non-existent path", async () => {
        const { isError } = await callTool(client, "list_project_files", {
            projectPath: "/nonexistent/path/xyz",
        });
        assert(isError, "Should return isError: true for invalid path");
    });

    // 4. get_composition_code — read a real file
    await test("get_composition_code reads a real file", async () => {
        const filePath = path.resolve(__dirname, "../src/index.ts");
        const { raw, isError } = await callTool(client, "get_composition_code", { filePath });
        assert(!isError, `Expected success: ${raw}`);
        assert(raw.includes("McpServer"), "Should contain McpServer reference");
    });

    // 5. get_composition_code — missing file
    await test("get_composition_code errors on missing file", async () => {
        const { isError } = await callTool(client, "get_composition_code", {
            filePath: "/does/not/exist.tsx",
        });
        assert(isError, "Should return error for missing file");
    });

    // 6. update_composition — write + read back
    await test("update_composition writes file content", async () => {
        const filePath = path.join(os.tmpdir(), `smoke-test-${Date.now()}.tsx`);
        const content = `export const Test = () => <div>Hello</div>;`;
        const { isError, raw } = await callTool(client, "update_composition", {
            filePath,
            newContent: content,
        });
        assert(!isError, `update_composition failed: ${raw}`);

        // Read it back
        const { raw: readBack, isError: readErr } = await callTool(client, "get_composition_code", {
            filePath,
        });
        assert(!readErr, `Failed to read back written file: ${readBack}`);
        assert(readBack === content, `Content mismatch. Got: ${readBack}`);
    });

    // 7. add_component — creates a file in a temp dir
    await test("add_component scaffolds a new component file", async () => {
        const projectPath = path.join(os.tmpdir(), `smoke-project-${Date.now()}`);
        // Create a minimal project structure
        const { raw, isError } = await callTool(client, "add_component", {
            projectPath,
            componentName: "TestScene",
            subfolder: "scenes",
            template: "basic",
        });
        assert(!isError, `add_component failed: ${raw}`);
        assert(raw.includes("TestScene.tsx"), "Response should mention the created file");
    });

    // 8. get_render_status — unknown job ID
    await test("get_render_status returns error for unknown jobId", async () => {
        const { isError, json } = await callTool(client, "get_render_status", {
            jobId: "00000000-0000-0000-0000-000000000000",
        });
        assert(isError, "Should return isError for unknown job");
        assert(typeof json === "object" && json !== null, "Should return JSON error");
    });

    // 9. render_video — returns a jobId immediately (async smoke test)
    await test("render_video returns a jobId immediately without blocking", async () => {
        const { raw, isError, json } = await callTool(client, "render_video", {
            serveUrl: "/nonexistent/project", // will fail in background
            compositionId: "Test",
        });
        // Should NOT be isError — it returns the job immediately
        assert(!isError, `render_video should return jobId, not error. Got: ${raw}`);
        assertShape(json, ["jobId", "status"]);
        const j = json as Record<string, unknown>;
        assert(typeof j.jobId === "string" && j.jobId.length > 0, "jobId should be a non-empty string");
        assert(j.status === "pending", `Initial status should be 'pending', got: ${j.status}`);
    });

    // 10. query_remotion_docs — must degrade gracefully even without the docs server running
    await test("query_remotion_docs degrades gracefully when docs server is unavailable", async () => {
        const { raw, isError } = await callTool(client, "query_remotion_docs", {
            query: "interpolate function signature",
        });
        // This tool must NEVER return isError — it degrades with a helpful message instead
        assert(!isError, `query_remotion_docs should not return isError, got: ${raw}`);
        assert(raw.length > 0, "Should return some text (either docs or degradation message)");
    });

    await client.close();

    // ─── Summary ─────────────────────────────────────────────────────────
    console.log(`\n${"─".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
    console.error("Test runner crashed:", err);
    process.exit(1);
});
