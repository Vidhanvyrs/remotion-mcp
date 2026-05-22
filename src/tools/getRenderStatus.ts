import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getJob } from "../utils/jobStore.js";

export function registerGetRenderStatus(server: McpServer): void {
    server.tool(
        "get_render_status",
        "Poll the status and progress of an async render job started by render_video. Returns status (pending/rendering/done/error), progress percentage, and output path when done.",
        {
            jobId: z.string().describe("The job ID returned by render_video when async rendering was started"),
        },
        async ({ jobId }) => {
            const job = getJob(jobId);

            if (!job) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    status: "error",
                                    error: {
                                        type: "ValidationError",
                                        message: `No render job found with ID: ${jobId}`,
                                        suggestedFix:
                                            "Ensure you are using the exact jobId returned by render_video. Job state is in-memory and is lost if the MCP server restarts.",
                                    },
                                },
                                null,
                                2
                            ),
                        },
                    ],
                    isError: true,
                };
            }

            const result: Record<string, unknown> = {
                jobId: job.id,
                status: job.status,
                progress: job.progress,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            };

            if (job.outputPath) result.outputPath = job.outputPath;
            if (job.error) result.error = job.error;

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
    );
}
