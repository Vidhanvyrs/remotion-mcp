import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getBundleUrl } from "../utils/bundle.js";
import { getBrowserExecutablePath } from "../utils/browser.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

export function registerRenderVideo(server: McpServer): void {
    server.tool(
        "render_video",
        "Render a Remotion composition as a video",
        {
            serveUrl: z.string().describe("Path to the Remotion project (e.g., ./src/index.ts)"),
            compositionId: z.string().describe("The ID of the composition to render"),
            inputProps: z.string().optional().describe("JSON string of input props"),
            outName: z.string().optional().describe("Output file name or absolute path (default: out.mp4)"),
        },
        async ({ serveUrl, compositionId, inputProps, outName }) => {
            try {
                // TODO: make async with job queue for long renders instead of blocking
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
                    : path.join(os.tmpdir(), outName || `out-${Date.now()}.mp4`);

                // Automatically resolve directory paths and missing extensions
                try {
                    const stats = await fs.stat(outPath);
                    if (stats.isDirectory()) {
                        outPath = path.join(outPath, "out.mp4");
                    }
                } catch {
                    const ext = path.extname(outPath).toLowerCase();
                    if (![".mp4", ".mkv", ".mov"].includes(ext)) {
                        if (outPath.endsWith("/")) {
                            outPath = path.join(outPath, "out.mp4");
                        } else {
                            outPath = outPath + ".mp4";
                        }
                    }
                }

                await renderMedia({
                    composition,
                    serveUrl: bundledUrl,
                    codec: "h264",
                    outputLocation: outPath,
                    inputProps: parsedProps,
                    browserExecutable,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully rendered video to: ${outPath}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error rendering video: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
