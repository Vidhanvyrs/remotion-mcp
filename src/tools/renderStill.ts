import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderStill, selectComposition } from "@remotion/renderer";
import { getBundleUrl } from "../utils/bundle.js";
import { getBrowserExecutablePath } from "../utils/browser.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

export function registerRenderStill(server: McpServer): void {
    server.tool(
        "render_still",
        "Render a Remotion composition as a still image",
        {
            serveUrl: z.string().describe("Path to the Remotion project (e.g., ./src/index.ts)"),
            compositionId: z.string().describe("The ID of the composition to render"),
            frame: z.number().optional().describe("The frame number to render (default: 0)"),
            inputProps: z.string().optional().describe("JSON string of input props"),
            outName: z.string().optional().describe("Output file name or absolute path (default: out.png)"),
        },
        async ({ serveUrl, compositionId, frame, inputProps, outName }) => {
            try {
                const bundledUrl = await getBundleUrl(serveUrl);
                const parsedProps = inputProps ? JSON.parse(inputProps) : {};
                const browserExecutable = await getBrowserExecutablePath();

                const composition = await selectComposition({
                    serveUrl: bundledUrl,
                    id: compositionId,
                    inputProps: parsedProps,
                    browserExecutable,
                });

                let outPath = outName && path.isAbsolute(outName)
                    ? outName
                    : path.join(os.tmpdir(), outName || `out-${Date.now()}.png`);

                // Automatically resolve directory paths and missing extensions
                try {
                    const stats = await fs.stat(outPath);
                    if (stats.isDirectory()) {
                        outPath = path.join(outPath, "out.png");
                    }
                } catch {
                    const ext = path.extname(outPath).toLowerCase();
                    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
                        if (outPath.endsWith("/")) {
                            outPath = path.join(outPath, "out.png");
                        } else {
                            outPath = outPath + ".png";
                        }
                    }
                }

                await renderStill({
                    composition,
                    serveUrl: bundledUrl,
                    output: outPath,
                    inputProps: parsedProps,
                    frame: frame ?? 0,
                    browserExecutable,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully rendered still image to: ${outPath}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error rendering still: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
