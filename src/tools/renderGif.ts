import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getBundleUrl } from "../utils/bundle.js";
import { getBrowserExecutablePath } from "../utils/browser.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { formatError } from "../utils/errors.js";

export function registerRenderGif(server: McpServer): void {
    server.tool(
        "render_gif",
        "Render a Remotion composition as an animated GIF",
        {
            serveUrl: z.string().describe("Path to the Remotion project (e.g., ./src/index.ts)"),
            compositionId: z.string().describe("The ID of the composition to render"),
            inputProps: z.string().optional().describe("JSON string of input props"),
            outName: z.string().optional().describe("Output file name or absolute path (default: out.gif)"),
        },
        async ({ serveUrl, compositionId, inputProps, outName }) => {
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
                    : path.join(os.tmpdir(), outName || `out-${Date.now()}.gif`);

                // Automatically resolve directory paths and missing extensions
                try {
                    const stats = await fs.stat(outPath);
                    if (stats.isDirectory()) {
                        outPath = path.join(outPath, "out.gif");
                    }
                } catch {
                    const ext = path.extname(outPath).toLowerCase();
                    if (ext !== ".gif") {
                        if (outPath.endsWith("/")) {
                            outPath = path.join(outPath, "out.gif");
                        } else {
                            outPath = outPath + ".gif";
                        }
                    }
                }

                await renderMedia({
                    composition,
                    serveUrl: bundledUrl,
                    codec: "gif",
                    outputLocation: outPath,
                    inputProps: parsedProps,
                    browserExecutable,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully rendered GIF to: ${outPath}`,
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
