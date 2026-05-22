# Getting Started with remotion-mcp

**remotion-mcp** lets your AI assistant (Claude, Cursor, Windsurf, etc.) create and render videos using [Remotion](https://remotion.dev) — directly from conversation, no video editing experience needed.

---

## Step 1 — Prerequisites

Before anything, make sure you have:

- **Node.js 18 or later** — check with `node --version`
- **Google Chrome** installed on your system (the server uses it to render frames)
- An AI editor: Claude Desktop, Cursor, Windsurf, or VS Code with MCP support

That's it. You do **not** need to install or clone anything manually — `npx` handles it.

---

## Step 2 — Connect it to your AI editor

Pick your editor below and add the config. You only do this once.

### Claude Desktop

Open (or create) the config file:
- **Linux/macOS:** `~/.config/claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this:

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

Restart Claude Desktop. You should see a 🔌 icon or "remotion" listed in your connected tools.

---

### Cursor

1. Open **Cursor Settings** → search for **MCP**
2. Click **Add MCP Server** and paste:

```json
{
  "remotion": {
    "command": "npx",
    "args": ["-y", "remotion-mcp"]
  }
}
```

3. Save and restart Cursor.

---

### Windsurf

Open `~/.windsurf/mcp_config.json` (create it if it doesn't exist) and add:

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

---

### VS Code (with MCP extension)

Add to your `settings.json`:

```json
{
  "mcp.servers": {
    "remotion": {
      "command": "npx",
      "args": ["-y", "remotion-mcp"]
    }
  }
}
```

---

## Step 3 — Verify it's working

The first time you use it, `npx` will download the package (~15 seconds). After that it's cached and starts instantly.

To confirm it's connected, ask your AI:

> **"List the tools available from remotion-mcp"**

You should see tools like `init_remotion_project`, `render_video`, `add_component`, etc. listed in the response.

---

## Step 4 — Make your first video

Now just talk to your AI naturally. Here are real prompts you can copy and use.

---

### 🎬 Workflow 1: Create a project and render a video

```
Create a new Remotion project at ~/my-first-video, then render the HelloWorld 
composition as an MP4 and tell me where the file was saved.
```

The AI will:
1. Call `init_remotion_project` to scaffold the project
2. Call `render_video` to start an async render
3. Return a `jobId` you can poll

Then check render progress:
```
Check the status of render job <jobId from above>
```

---

### 🖼️ Workflow 2: Preview a still image first

Rendering a full video takes time. Preview a frame first:

```
Render frame 30 of the HelloWorld composition from ~/my-first-video as a PNG 
and save it to my Desktop.
```

---

### ✏️ Workflow 3: Customize the composition

```
Read the MyComposition.tsx file in ~/my-first-video/src and update it so the 
text says "Hello from AI" and the background is a dark purple gradient instead 
of the solid dark color.
```

The AI will:
1. Call `get_composition_code` to read the current file
2. Call `update_composition` to write the modified version
3. The bundle cache is automatically cleared so the next render picks it up

Then render again to see your changes:
```
Render a still of the HelloWorld composition at frame 30 from ~/my-first-video
```

---

### 🧩 Workflow 4: Add a new scene

```
Add a new animated scene called "TitleCard" to my Remotion project at 
~/my-first-video. It should show a big white title that springs in from below, 
then a smaller subtitle that fades in after half a second.
```

The AI will scaffold the component with `add_component` and give you the code.

```
Now register TitleCard as a new composition in Root.tsx with 5 seconds duration 
at 30fps.
```

---

### 📊 Workflow 5: Data-driven video (inputProps)

This is one of the most powerful features — render the same template with different data:

```
Render the HelloWorld composition from ~/my-first-video but pass these 
inputProps: {"title": "Welcome to My Channel"} — save the output to ~/Desktop/welcome.mp4
```

```
Now render it again with {"title": "Episode 2: Deep Dive"} and save to 
~/Desktop/episode2.mp4
```

---

### 📁 Workflow 6: Explore an existing project

If you have an existing Remotion project you want the AI to work with:

```
Show me all the files in ~/my-existing-remotion-project
```

```
List all the compositions in ~/my-existing-remotion-project
```

```
Read the Root.tsx file from ~/my-existing-remotion-project/src
```

---

### 📚 Workflow 7: Look up Remotion APIs

The server connects to the official Remotion documentation:

```
Look up the interpolate function in the Remotion docs — I want to know 
the correct arguments and what it returns.
```

```
Query the Remotion docs for how to use <Sequence> with offset timing.
```

---

## Troubleshooting

### Chrome not found

If you see an error mentioning Chrome or Chromium, find your Chrome path:

```bash
# Linux
which google-chrome chromium chromium-browser

# macOS
ls /Applications/ | grep -i chrome
```

Then add it to your MCP config:

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

### Render seems stuck

Renders are async — the AI returns a `jobId` immediately and rendering happens in the background. Ask your AI to check status:

```
Check the status of render job <your-jobId>
```

A 2-minute 1080p video typically takes 3–8 minutes depending on your machine.

---

### npx is slow the first time

The first `npx remotion-mcp` downloads the package. Subsequent starts are instant because it's cached locally. If you want to avoid the delay, install it globally:

```bash
npm install -g remotion-mcp
```

Then change your config to:

```json
{
  "command": "remotion-mcp",
  "args": []
}
```

---

### Composition not found after editing

The server caches Webpack bundles for speed. If you edit files outside the AI (e.g., manually in your editor) and the AI's render doesn't pick up the changes, ask:

```
Re-read and re-bundle the project at ~/my-first-video, then render the 
HelloWorld composition
```

The `update_composition` tool always clears the cache automatically — this only applies if you edit files manually.

---

## What's next?

- 🚀 Try rendering a GIF: *"Render the HelloWorld composition as an animated GIF"*
- 🎨 Explore templates: ask the AI to scaffold a `sequence` or `basic` template component
- 🐳 Self-host it: see [DEPLOYMENT.md](./DEPLOYMENT.md) for running a shared HTTP instance on Railway or Fly.io
- 🤝 Contribute a new tool: see [CONTRIBUTING.md](./CONTRIBUTING.md)
