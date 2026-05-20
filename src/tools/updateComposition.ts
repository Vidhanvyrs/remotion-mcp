import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { clearBundleCache } from "../utils/bundle.js";

export function registerUpdateComposition(server: McpServer): void {
    server.tool(
        "update_composition",
        "Update the code content of an existing Remotion composition file. This will automatically invalidate the build/bundle cache so the updated composition is used in subsequent renders.",
        {
            filePath: z.string().describe("Absolute or relative path to the composition/component file to update (e.g. ./src/MyComposition.tsx)"),
            newContent: z.string().describe("The complete new code or content to write to the file"),
        },
        async ({ filePath, newContent }) => {
            try {
                const resolvedPath = path.resolve(filePath);
                
                // Ensure target directory exists
                const dir = path.dirname(resolvedPath);
                await fs.mkdir(dir, { recursive: true });

                // Write the new content to the file
                await fs.writeFile(resolvedPath, newContent, "utf-8");

                // Invalidate the Webpack bundling cache to ensure subsequent operations use the fresh content
                clearBundleCache();

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully updated composition code in: ${resolvedPath}. Bundle cache has been invalidated.`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error updating composition: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}
