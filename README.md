# remotion-mcp

> MCP server that lets your AI assistant create, edit, and render [Remotion](https://remotion.dev) videos — no UI needed.

Give Claude, Cursor, or Windsurf the ability to:
- 🎬 Render MP4 videos, stills (PNG/JPEG), and animated GIFs
- Scaffold and edit React/Remotion components
- Pass dynamic `inputProps` for data-driven video generation
- Inspect project file trees and read/write composition files
- Track long renders asynchronously via job IDs

 **New here? Read the [Getting Started guide](./GETTING_STARTED.md)**  
 **Want real examples? Check out the [Cookbook →](./examples/README.md)** — step-by-step video tutorials with exact prompts

| Cookbook | What You Build |
|----------|---------------|
| [01 — YouTube Intro](./examples/01-youtube-intro/) | Animated title card MP4 in 5 prompts |
| [02 — Data-Driven Video](./examples/02-data-driven-video/) | Render one template with N different datasets |
| [03 — Edit & Iterate](./examples/03-iterate-with-ai/) | Fast read → edit → preview loop |

---


## Quick Start

### 🎥 See it in action

https://github.com/Vidhanvyrs/remotion-mcp/raw/master/examples/setupinide.mp4

### Prerequisites
- Node.js ≥ 18
- [Google Chrome](https://www.google.com/chrome/) installed on your system

### Add to Claude Desktop

Edit `~/.config/claude/claude_desktop_config.json` (Linux/macOS) or  
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "remotion": {
      "command": "npx",
      "args": ["-y", "remotion-mcp"]
    }
  }
}
```

### Add to Cursor / Windsurf / VS Code

```json
{
  "mcp": {
    "servers": {
      "remotion": {
        "command": "npx",
        "args": ["-y", "remotion-mcp"]
      }
    }
  }
}
```

Restart your editor and ask your AI to **"create a Remotion project at ~/my-video and render it"**.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `init_remotion_project` | Bootstrap a new Remotion project with React templates |
| `list_compositions` | List all registered compositions in a project |
| `list_project_files` | Return the file tree of a project (ignores `node_modules`) |
| `get_composition_code` | Read any source file in a project |
| `update_composition` | Write new content to any composition/component file |
| `add_component` | Scaffold a new component (`basic`, `animated`, or `sequence` template) |
| `create_composition_scaffold` | Create a bare-minimum composition file |
| `render_video` | Render an MP4 asynchronously — returns a `jobId` immediately |
| `render_still` | Render a single frame as PNG/JPEG/WebP |
| `render_gif` | Render an animated GIF |
| `get_render_status` | Poll the status/progress of an async render job |
| `query_remotion_docs` | Query the official Remotion documentation for accurate API signatures before generating code |

---

## Documentation Grounding

`remotion-mcp` is the only Remotion MCP that **combines live execution with official documentation grounding**.

When your AI assistant is about to scaffold a component or configure a render, it can call `query_remotion_docs` first to fetch the exact, current API signatures from the official `@remotion/mcp` docs server. This means:

- Generated component code uses **correct, up-to-date Remotion APIs** — not potentially stale training data
- Render options like `codec`, `pixelFormat`, and `crf` are **validated against real docs** before execution
- If a render fails, the AI can **look up the error** and self-correct

This is a soft dependency — if the docs server is unavailable, `query_remotion_docs` degrades gracefully with a helpful message and your other tools keep working normally.

---

## Chrome Not Detected?

Set the `CHROME_EXECUTABLE` environment variable:

```json
{
  "mcpServers": {
    "remotion": {
      "command": "npx",
      "args": ["-y", "remotion-mcp"],
      "env": {
        "CHROME_EXECUTABLE": "/usr/bin/chromium"
      }
    }
  }
}
```

---

## HTTP / Cloud Mode

Run as a shared HTTP server (for teams or hosted demos):

```bash
MCP_MODE=http PORT=3000 npx remotion-mcp
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway, Fly.io, and Docker instructions.

---

## Development

```bash
git clone https://github.com/Vidhanvyrs/remotion-mcp
cd remotion-mcp
npm install
npm run dev          # run with tsx (no build needed)
npm test             # run smoke tests
npm run build        # compile to dist/
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add new tools.

---

## License

ISC