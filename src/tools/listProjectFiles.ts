import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { formatError } from "../utils/errors.js";

const IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    ".cache",
    "dist",
    "out",
    ".next",
    "build",
]);

async function scanDir(dirPath: string, prefix: string = ""): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const lines: string[] = [];

    // Sort: directories first, then files, both alphabetical
    const sorted = entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            lines.push(`${relativePath}/`);
            const children = await scanDir(path.join(dirPath, entry.name), relativePath);
            lines.push(...children);
        } else {
            lines.push(`${relativePath}`);
        }
    }

    return lines;
}

export function registerListProjectFiles(server: McpServer): void {
    server.tool(
        "list_project_files",
        "List the file tree of a Remotion project, ignoring node_modules and build artifacts",
        {
            projectPath: z.string().describe("Absolute path to the Remotion project root directory"),
        },
        async ({ projectPath }) => {
            try {
                const resolved = path.resolve(projectPath);
                const stat = await fs.stat(resolved);
                if (!stat.isDirectory()) {
                    return {
                        content: [{ type: "text", text: `Error: '${resolved}' is not a directory.` }],
                        isError: true,
                    };
                }

                const tree = await scanDir(resolved);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Project file tree for: ${resolved}\n\n${tree.join("\n")}`,
                        },
                    ],
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
