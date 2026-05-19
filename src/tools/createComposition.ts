import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

export function registerCreateComposition(server: McpServer): void {
    server.tool(
        "create_composition_scaffold",
        "Create a scaffolding for a new Remotion composition in the current workspace",
        {
            directory: z.string().describe("Directory to create the composition files in"),
            compositionName: z.string().describe("Name of the new composition component"),
        },
        async ({ directory, compositionName }) => {
            try {
                await fs.mkdir(directory, { recursive: true });

                const compCode = `import { AbsoluteFill } from "remotion";
// import React from "react"; // Uncomment if your tsconfig does not have jsx: "react-jsx"

export const ${compositionName} = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "white", justifyContent: "center", alignItems: "center" }}>
      <h1>Hello from ${compositionName}</h1>
    </AbsoluteFill>
  );
};
`;
                await fs.writeFile(path.join(directory, `${compositionName}.tsx`), compCode);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully created composition scaffold in ${directory}/${compositionName}.tsx`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error creating composition: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
