import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export function registerInitProject(server: McpServer): void {
    server.tool(
        "init_remotion_project",
        "Initialize a minimal, ready-to-run Remotion project at a specified directory",
        {
            directory: z.string().describe("Target directory path to initialize the Remotion project in"),
        },
        async ({ directory }) => {
            try {
                const targetDir = path.resolve(directory);
                await fs.mkdir(targetDir, { recursive: true });

                const packageJson = {
                    name: path.basename(targetDir) || "remotion-project",
                    version: "1.0.0",
                    private: true,
                    type: "module",
                    dependencies: {
                        "react": "^18.3.1",
                        "react-dom": "^18.3.1",
                        "remotion": "4.0.462"
                    },
                    devDependencies: {
                        "@types/react": "^18.3.12",
                        "@types/react-dom": "^18.3.1",
                        "typescript": "^5.0.0"
                    }
                };

                const tsconfigJson = {
                    compilerOptions: {
                        target: "ES2022",
                        module: "NodeNext",
                        moduleResolution: "NodeNext",
                        jsx: "react-jsx",
                        esModuleInterop: true,
                        strict: true,
                        skipLibCheck: true
                    },
                    include: ["src/**/*"]
                };

                const indexTs = `import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);
`;

                const rootTxs = `import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const Root = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Welcome to Remotion",
        }}
      />
    </>
  );
};
`;

                const myCompositionTxs = `import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const MyComposition = ({ title }: { title: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 12,
    },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ transform: \`scale(\${scale})\`, fontSize: "80px", fontWeight: "bold" }}>
        {title}
      </div>
    </AbsoluteFill>
  );
};
`;

                // Write files
                await fs.writeFile(path.join(targetDir, "package.json"), JSON.stringify(packageJson, null, 2));
                await fs.writeFile(path.join(targetDir, "tsconfig.json"), JSON.stringify(tsconfigJson, null, 2));

                const srcDir = path.join(targetDir, "src");
                await fs.mkdir(srcDir, { recursive: true });

                await fs.writeFile(path.join(srcDir, "index.ts"), indexTs);
                await fs.writeFile(path.join(srcDir, "Root.tsx"), rootTxs);
                await fs.writeFile(path.join(srcDir, "MyComposition.tsx"), myCompositionTxs);

                // Run npm install in target directory
                await execAsync("npm install", { cwd: targetDir });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully initialized Remotion project in ${targetDir} and completed npm install!`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error initializing Remotion project: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true,
                };
            }
        }
    );
}
