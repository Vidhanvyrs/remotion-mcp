import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getBundleUrl } from "../utils/bundle.js";
import { getBrowserExecutablePath } from "../utils/browser.js";
import { createJob, updateJob } from "../utils/jobStore.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { formatError } from "../utils/errors.js";

export function registerRenderVideo(server: McpServer): void {
    server.tool(
        "render_video",
        "Render a Remotion composition as a video. Returns a jobId immediately — use get_render_status(jobId) to poll progress and get the output path when done.",
        {
            serveUrl: z.string().describe("Path to the Remotion project (e.g., ./src/index.ts)"),
            compositionId: z.string().describe("The ID of the composition to render"),
            inputProps: z.string().optional().describe("JSON string of input props to pass to the composition (e.g. '{\"title\":\"Hello\"}')"),
            outName: z.string().optional().describe("Output file name or absolute path (default: out-<timestamp>.mp4 in system temp dir)"),
        },
        async ({ serveUrl, compositionId, inputProps, outName }) => {
            // Create the job record immediately and return its ID
            const job = createJob();

            // Fire-and-forget: do NOT await this promise
            (async () => {
                try {
                    updateJob(job.id, { status: "rendering", progress: 0 });

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
                        : path.join(os.tmpdir(), outName || `out-${job.id}.mp4`);

                    // Automatically resolve directory paths and missing extensions
                    try {
                        const stats = await fs.stat(outPath);
                        if (stats.isDirectory()) {
                            outPath = path.join(outPath, `out-${job.id}.mp4`);
                        }
                    } catch {
                        const ext = path.extname(outPath).toLowerCase();
                        if (![".mp4", ".mkv", ".mov"].includes(ext)) {
                            outPath = outPath.endsWith("/")
                                ? path.join(outPath, `out-${job.id}.mp4`)
                                : outPath + ".mp4";
                        }
                    }

                    await renderMedia({
                        composition,
                        serveUrl: bundledUrl,
                        codec: "h264",
                        outputLocation: outPath,
                        inputProps: parsedProps,
                        browserExecutable,
                        onProgress: ({ progress }) => {
                            // progress is a 0–1 float from Remotion
                            updateJob(job.id, { progress: Math.round(progress * 100) });
                        },
                    });

                    updateJob(job.id, { status: "done", progress: 100, outputPath: outPath });
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    updateJob(job.id, { status: "error", error: message });
                    console.error(`[render_video] Job ${job.id} failed:`, message);
                }
            })();

            // Return the jobId immediately — don't block
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                jobId: job.id,
                                status: "pending",
                                message: "Render job started. Use get_render_status with this jobId to poll progress.",
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }
    );
}
