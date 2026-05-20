import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

export function registerGetCompositionCode(server: McpServer): void {
    server.tool(
        "get_composition_code",
        "Read and return the source code of any file in a Remotion project.",
        {
            filePath: z.string().describe("Absolute or relative path to the React component/composition file to read"),
        },
        async ({ filePath }) => {
            try {
                const resolvedPath = path.resolve(filePath);

                // Check if file exists and get stats
                try {
                    const stats = await fs.stat(resolvedPath);
                    if (!stats.isFile()) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Path exists but is not a file: ${resolvedPath}`,
                                },
                            ],
                            isError: true,
                        };
                    }
                } catch {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `File not found at path: ${resolvedPath}`,
                            },
                        ],
                        isError: true,
                    };
                }

                // Read the file contents
                const code = await fs.readFile(resolvedPath, "utf-8");

                return {
                    content: [
                        {
                            type: "text",
                            text: code,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error reading composition: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}
