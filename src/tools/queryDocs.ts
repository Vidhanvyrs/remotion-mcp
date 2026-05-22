import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Lazy singleton — we only spawn the docs process on first use, then reuse it.
// This avoids the ~2s npx cold-start on every query.
let docsClient: Client | null = null;
let docsClientConnecting: Promise<Client | null> | null = null;

async function getDocsClient(): Promise<Client | null> {
    if (docsClient) return docsClient;

    // Avoid concurrent connection races
    if (docsClientConnecting) return docsClientConnecting;

    docsClientConnecting = (async () => {
        try {
            const transport = new StdioClientTransport({
                command: "npx",
                args: ["@remotion/mcp@latest"],
                stderr: "pipe",
            });

            const client = new Client({
                name: "remotion-mcp-docs-proxy",
                version: "1.0.0",
            });

            await client.connect(transport);
            docsClient = client;
            console.error("[queryDocs] Connected to @remotion/mcp docs server");
            return client;
        } catch (err) {
            console.error("[queryDocs] Failed to connect to @remotion/mcp:", err instanceof Error ? err.message : String(err));
            docsClientConnecting = null; // allow retry on next call
            return null;
        }
    })();

    return docsClientConnecting;
}

export function registerQueryDocs(server: McpServer): void {
    server.tool(
        "query_remotion_docs",
        [
            "Query the official Remotion documentation before generating or editing compositions.",
            "Use this when you need accurate API signatures, prop types, or usage patterns — for example:",
            "  - Before scaffolding code: 'what props does <Composition /> accept?'",
            "  - Before rendering: 'what are the valid codec values for renderMedia?'",
            "  - When a render fails: 'what does this Remotion error mean?'",
            "This tool proxies to the official @remotion/mcp documentation server.",
            "It degrades gracefully if the docs server is unavailable.",
        ].join(" "),
        {
            query: z.string().describe(
                "Natural language question about the Remotion API, e.g. 'interpolate function signature', " +
                "'renderMedia options for GIF output', '<Sequence> props'"
            ),
        },
        async ({ query }) => {
            const client = await getDocsClient();

            if (!client) {
                return {
                    content: [
                        {
                            type: "text",
                            text: [
                                "⚠️ The Remotion documentation server (@remotion/mcp) is currently unavailable.",
                                "This is a soft dependency — your tools will still work, but without live doc grounding.",
                                "",
                                "To enable it, ensure `npx @remotion/mcp@latest` can run on this machine.",
                                "The official Remotion docs are also available at https://www.remotion.dev/docs",
                            ].join("\n"),
                        },
                    ],
                };
            }

            try {
                // Discover the tool name the docs server exposes (it may vary by version)
                const { tools } = await client.listTools();

                if (tools.length === 0) {
                    return {
                        content: [{ type: "text", text: "The Remotion docs server is connected but exposes no tools." }],
                    };
                }

                // Use the first tool (typically the only one — the docs search tool)
                const docsTool = tools[0];

                // Call it with the user's query. Try common argument key names.
                const args: Record<string, string> = {};
                const firstParam = Object.keys(docsTool.inputSchema?.properties ?? {})[0] ?? "query";
                args[firstParam] = query;

                const result = await client.callTool({
                    name: docsTool.name,
                    arguments: args,
                });

                const content = result.content as Array<{ type: string; text?: string }>;
                const text = content.map((c) => c.text ?? "").join("\n").trim();

                return {
                    content: [
                        {
                            type: "text",
                            text: text || "No documentation found for that query.",
                        },
                    ],
                };
            } catch (err) {
                // The docs server errored — reset so we retry connection next time
                docsClient = null;
                docsClientConnecting = null;

                const message = err instanceof Error ? err.message : String(err);
                console.error("[queryDocs] Error calling docs server:", message);

                return {
                    content: [
                        {
                            type: "text",
                            text: [
                                `⚠️ Documentation query failed: ${message}`,
                                "",
                                "Falling back to training knowledge. You can also check:",
                                "https://www.remotion.dev/docs",
                            ].join("\n"),
                        },
                    ],
                };
            }
        }
    );
}
