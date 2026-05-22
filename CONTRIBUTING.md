# Contributing to remotion-mcp

Thank you for your interest in contributing! This guide gets you from zero to a working PR in minutes.

---

## Project Overview

`remotion-mcp` is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI assistants create, edit, and render [Remotion](https://remotion.dev) video compositions.

```
src/
├── index.ts              # Entry point (stdio + HTTP modes)
├── tools/                # ← Each file here is one MCP tool
│   ├── renderVideo.ts
│   ├── renderStill.ts
│   └── ...
└── utils/
    ├── autoRegister.ts   # Auto-discovers and loads all tools/
    ├── browser.ts        # Chrome detection (env var → system path)
    ├── bundle.ts         # Webpack bundling with cache
    ├── errors.ts         # Structured error formatting
    └── jobStore.ts       # In-memory async render job state
tests/
└── smoke.ts              # Integration test suite (run with: npm test)
```

---

## Adding a New Tool

This is the most common contribution. The project uses **automatic tool discovery** — you only need to touch one file.

### 1. Create `src/tools/yourToolName.ts`

Every tool exports exactly one function whose name starts with `register`. The auto-loader finds and calls it.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatError } from "../utils/errors.js";

export function registerYourTool(server: McpServer): void {
    server.tool(
        "your_tool_name",                          // snake_case name (what AI calls)
        "What this tool does — be descriptive",    // shown to the AI as context
        {
            // Input schema — use Zod, add .describe() to every field
            requiredParam: z.string().describe("What this is"),
            optionalParam: z.number().optional().describe("Optional thing"),
        },
        async ({ requiredParam, optionalParam }) => {
            try {
                // your logic here
                return {
                    content: [{ type: "text", text: "Success!" }],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: formatError(error) }],
                    isError: true,
                };
            }
        }
    );
}
```

That's it. **No changes to `index.ts`**. The auto-loader scans `tools/` on startup.

### 2. Add a test in `tests/smoke.ts`

Every PR should include at least one smoke test for the new tool (happy path + one error path).

### 3. Build and run the tests

```bash
npm run build
npm test
```

---

## Tool Categories & Shared Utilities

| If your tool... | Use |
|---|---|
| Renders video/still/GIF | `getBundleUrl()` + `getBrowserExecutablePath()` from utils |
| Modifies source files | `clearBundleCache()` after any write |
| Can fail | `formatError(error)` — gives structured JSON with suggested fix |
| Starts a long render | `createJob()` + `updateJob()` from `jobStore.ts` — return jobId immediately |

### Chrome detection

`getBrowserExecutablePath()` checks in this order:
1. `CHROME_EXECUTABLE` env var (Docker/CI-friendly)
2. Well-known system paths (Linux + macOS)
3. Returns `undefined` (Remotion may fall back to its own bundled headless shell)

---

## Development Setup

```bash
git clone https://github.com/your-org/remotion-mcp
cd remotion-mcp
npm install

# Run in development (tsx, no build needed)
npm run dev

# Inspect tools interactively
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# Run tests
npm test

# Build
npm run build
```

---

## PR Checklist

- [ ] New tool file in `src/tools/` with a `register*` export
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm test` passes
- [ ] Tool has `.describe()` on every Zod field
- [ ] Tool uses `formatError()` in the catch block
- [ ] `CLAUDE.md` updated if the tool needs new guidelines (e.g. new shared utility)

---

## Code Style

- **Never** use `console.log` — use `console.error` (stays off the stdio JSON stream)
- Use `path.resolve()` for any user-provided file paths
- Use the `.js` extension in all relative imports (ESM requirement, even for `.ts` source)
- Return `isError: true` in the response object for error cases — don't throw from the handler
