import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { formatError } from "../utils/errors.js";
import { clearBundleCache } from "../utils/bundle.js";

export function registerAddComponent(server: McpServer): void {
    server.tool(
        "add_component",
        "Scaffold a new React component file inside an existing Remotion project with a sensible template",
        {
            projectPath: z.string().describe("Absolute path to the Remotion project root directory"),
            componentName: z.string().describe("PascalCase name for the new component (e.g., 'TitleScene', 'LogoReveal')"),
            subfolder: z.string().optional().describe("Optional subfolder inside src/ (e.g., 'components' or 'scenes'). Defaults to 'components'"),
            template: z.enum(["basic", "animated", "sequence"]).optional().describe("Template style: 'basic' (static), 'animated' (spring animation), or 'sequence' (multi-step). Defaults to 'animated'"),
        },
        async ({ projectPath, componentName, subfolder, template }) => {
            try {
                const resolved = path.resolve(projectPath);
                const folder = subfolder || "components";
                const templateStyle = template || "animated";
                const targetDir = path.join(resolved, "src", folder);

                await fs.mkdir(targetDir, { recursive: true });

                const code = generateTemplate(componentName, templateStyle);
                const filePath = path.join(targetDir, `${componentName}.tsx`);

                // Check if file already exists
                try {
                    await fs.access(filePath);
                    return {
                        content: [{ type: "text", text: `Error: File already exists at ${filePath}. Use update_composition to modify it instead.` }],
                        isError: true,
                    };
                } catch {
                    // File doesn't exist — good, proceed
                }

                await fs.writeFile(filePath, code);
                clearBundleCache();

                return {
                    content: [
                        {
                            type: "text",
                            text: `Successfully created component at: ${filePath}\n\nTemplate: ${templateStyle}\n\nTo use this in your video, import it in Root.tsx and register it as a <Composition />.`,
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

function generateTemplate(name: string, style: "basic" | "animated" | "sequence"): string {
    switch (style) {
        case "basic":
            return `import { AbsoluteFill } from "remotion";

export const ${name}: React.FC<{ text?: string }> = ({ text = "Hello" }) => {
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
      <h1 style={{ fontSize: "72px", fontWeight: "bold" }}>{text}</h1>
    </AbsoluteFill>
  );
};
`;
        case "animated":
            return `import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const ${name}: React.FC<{ text?: string }> = ({ text = "Hello" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const opacity = spring({
    frame,
    fps,
    config: { damping: 20 },
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
      <div
        style={{
          transform: \`scale(\${scale})\`,
          opacity,
          fontSize: "72px",
          fontWeight: "bold",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
`;
        case "sequence":
            return `import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 20 } });
  return <div style={{ opacity }}>{children}</div>;
};

export const ${name}: React.FC<{ title?: string; subtitle?: string }> = ({
  title = "Title",
  subtitle = "Subtitle",
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <Sequence from={0} durationInFrames={60}>
        <FadeIn>
          <h1 style={{ fontSize: "80px", fontWeight: "bold" }}>{title}</h1>
        </FadeIn>
      </Sequence>
      <Sequence from={30} durationInFrames={60}>
        <FadeIn>
          <h2 style={{ fontSize: "40px", opacity: 0.7 }}>{subtitle}</h2>
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
`;
    }
}
