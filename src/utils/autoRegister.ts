import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Automatically discovers and registers all tools in the `tools/` directory.
 *
 * Convention: each tool file must export exactly one function whose name
 * starts with `register` (e.g. `registerRenderVideo`). The auto-loader
 * will call it with the McpServer instance.
 *
 * This means contributors can drop a new `.ts`/`.js` file into `src/tools/`
 * and it is picked up automatically — no manual wiring in `index.ts` needed.
 */
export async function autoRegisterTools(server: McpServer): Promise<void> {
    const toolsDir = path.join(__dirname, "..", "tools");

    let entries: string[];
    try {
        entries = await fs.readdir(toolsDir);
    } catch {
        throw new Error(`Could not read tools directory at ${toolsDir}`);
    }

    // Accept both .ts (tsx dev mode) and .js (compiled), skip .d.ts
    const toolFiles = entries
        .filter((f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts"))
        .sort(); // deterministic registration order

    const registered: string[] = [];

    for (const file of toolFiles) {
        const filePath = path.join(toolsDir, file);
        const mod = await import(`file://${filePath}`);

        // Find the single `register*` function exported by this file
        let found = false;
        for (const [exportName, exportVal] of Object.entries(mod)) {
            if (exportName.startsWith("register") && typeof exportVal === "function") {
                (exportVal as (s: McpServer) => void)(server);
                registered.push(`${file}#${exportName}`);
                found = true;
                break;
            }
        }

        if (!found) {
            console.error(`[autoRegister] Warning: ${file} has no export starting with 'register'. Skipping.`);
        }
    }

    console.error(`[autoRegister] Registered ${registered.length} tools: ${registered.join(", ")}`);
}
