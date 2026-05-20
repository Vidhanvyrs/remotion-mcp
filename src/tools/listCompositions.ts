import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getCompositions } from "@remotion/renderer";
import { getBundleUrl } from "../utils/bundle.js";
import { getBrowserExecutablePath } from "../utils/browser.js";
import { formatError } from "../utils/errors.js";

export function registerListCompositions(server: McpServer): void {
    server.tool(
        "list_compositions",
        "List all compositions in a Remotion project",
        {
            serveUrl: z.string().describe("Path to the Remotion project entry point (e.g. ./src/index.ts) or Webpack bundle URL"),
        },
        async ({ serveUrl }) => {
            try {
                const bundledUrl = await getBundleUrl(serveUrl);
                const browserExecutable = await getBrowserExecutablePath();

                const comps = await getCompositions(bundledUrl, {
                    browserExecutable,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(comps, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: formatError(error),
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}
