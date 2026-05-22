# Deployment Guide

Two deployment paths are supported: **local via npx** (recommended for most users) and **cloud/shared instance via Docker + Railway**.

---

## Path 1 — Local (npx)

This is how most users consume `remotion-mcp`. It runs on the user's machine using their local Chrome installation.

### Prerequisites

- **Node.js ≥ 18**
- **Google Chrome** installed (the server needs it to render)

### Usage

```bash
npx remotion-mcp
```

Or pin a version:
```bash
npx remotion-mcp@1.0.0
```

### Configure in Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json` (Linux/macOS):

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

### Configure in Cursor / Windsurf / VS Code

Add to your MCP settings:

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

### Chrome Not Found?

If the server can't find Chrome, set the `CHROME_EXECUTABLE` environment variable:

```bash
CHROME_EXECUTABLE=/usr/bin/chromium npx remotion-mcp
```

Or in your MCP config:

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

## Path 2 — Cloud / Shared Instance (Docker + Railway)

For teams who want a hosted endpoint, or for you to run a demo instance.

### Build and run locally with Docker

```bash
# Build the image (includes Chrome — ~1.5GB, takes a few minutes the first time)
docker build -t remotion-mcp .

# Run in HTTP mode
docker run -p 3000:3000 -v /tmp/renders:/renders remotion-mcp

# Test the health endpoint
curl http://localhost:3000/health
# → {"status":"ok","server":"remotion-mcp","mode":"http"}
```

### Deploy to Railway

1. Push your repo to GitHub
2. Create a new Railway project → **Deploy from GitHub**
3. Railway auto-detects the `Dockerfile` and builds it
4. Set environment variables in Railway dashboard:
   - `MCP_MODE=http`
   - `PORT=3000` (Railway usually sets this automatically)
5. Your endpoint will be: `https://your-app.up.railway.app/mcp`

#### Configure in Claude Desktop (cloud mode)

```json
{
  "mcpServers": {
    "remotion": {
      "url": "https://your-app.up.railway.app/mcp"
    }
  }
}
```

### Deploy to Fly.io

```bash
fly launch --name remotion-mcp --dockerfile Dockerfile
fly secrets set MCP_MODE=http
fly deploy
```

### Deploy to Render.com

1. New Web Service → connect GitHub repo
2. Environment: Docker
3. Set `MCP_MODE=http`, `PORT=10000` (Render's default)
4. Add a persistent disk at `/renders` for render output

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `MCP_MODE` | `stdio` | `stdio` (local) or `http` (cloud) |
| `PORT` | `3000` | HTTP server port |
| `CHROME_EXECUTABLE` | auto-detected | Path to Chrome binary (critical for Docker) |
| `RENDER_OUTPUT_DIR` | system tmpdir | Where rendered files are saved |

---

## Production Checklist

- [ ] Health check passes: `GET /health` returns `{"status":"ok"}`
- [ ] `CHROME_EXECUTABLE` is set and points to a valid Chrome binary
- [ ] A volume is mounted at `$RENDER_OUTPUT_DIR` for render output persistence
- [ ] Rate limiting added before going public (renders are CPU-intensive)
- [ ] `RENDER_OUTPUT_DIR` is cleaned up periodically (renders accumulate)
