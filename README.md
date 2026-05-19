# Step-by-Step Walkthrough: Working with Remotion MCP

This guide walks you through the complete lifecycle of creating, inspecting, and rendering video animations programmatically using the **Remotion MCP Server**.

---

## Step 1: Start the MCP Server

To test the server locally with a visual user interface, start it using the **MCP Inspector**:

```bash
# From the /home/batman/MCPs/remotion-mcp directory
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

This will spin up a local web server and open a browser window at `http://localhost:6274` containing the interactive **MCP Inspector UI**.

---

## Step 2: Initialize a New Remotion Project

Before rendering anything, you need a Remotion project with valid React template assets.

1. In the Inspector UI, select the **`init_remotion_project`** tool.
2. Provide the absolute folder path where you want the new project to be created:
   * **`directory`**: `/home/batman/MCPs/remotion-mcp/my-video`
3. Click **"Call Tool"**.

### What happens under the hood:
* The server creates the folder if it doesn't exist.
* It scaffolds a lightweight, clean, and blazing-fast React-Remotion setup containing:
  * `src/index.ts` (the entry point)
  * `src/Root.tsx` (the composition registering root)
  * `src/MyComposition.tsx` (the React code containing your custom animation)
* It automatically installs the required dependencies (`remotion` and `@remotion/renderer`).

---

## Step 3: List Availables Compositions

Once the project is initialized, you can query it to discover what animations/compositions are registered and ready to render.

1. Select the **`list_compositions`** tool.
2. Provide the entry point path to your project:
   * **`serveUrl`**: `/home/batman/MCPs/remotion-mcp/my-video/src/index.ts`
3. Click **"Call Tool"**.

### Expected Result:
You will get a JSON output listing the available compositions, including details such as their `id` (e.g., `"HelloWorld"`), `width`, `height`, `fps`, and `durationInFrames`.

```json
[
  {
    "id": "HelloWorld",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 120
  }
]
```

---

## Step 4: Render a Still Image (Preview)

Before rendering an entire video, it is best practice to render a single frame as a quick preview to check the visual composition.

1. Select the **`render_still`** tool.
2. Enter the following parameters:
   * **`serveUrl`**: `/home/batman/MCPs/remotion-mcp/my-video/src/index.ts`
   * **`compositionId`**: `HelloWorld`
   * **`frame`**: `30` *(Important: At frame `0`, items are scaled to 0% opacity. Use frame `30` to see the full spring animation layout!)*
   * **`outName`**: `/home/batman/MCPs/remotion-mcp/my-video` *(The server automatically auto-resolves this folder path to `/home/batman/MCPs/remotion-mcp/my-video/out.png`)*
3. Click **"Call Tool"**.

### Expected Result:
The tool will immediately run, compile Webpack programmatically, launch your local Google Chrome system browser, render Frame 30, and return:
```text
Successfully rendered still frame 30 to: /home/batman/MCPs/remotion-mcp/my-video/out.png
```

Open this image on your machine to preview your text and logo aligned beautifully.

---

## Step 5: Render the Full MP4 Video

Once you are satisfied with the layout preview, you are ready to render the final animation as a high-quality H.264 video.

1. Select the **`render_video`** tool.
2. Enter the following parameters:
   * **`serveUrl`**: `/home/batman/MCPs/remotion-mcp/my-video/src/index.ts`
   * **`compositionId`**: `HelloWorld`
   * **`outName`**: `/home/batman/MCPs/remotion-mcp/my-video` *(The server will auto-resolve this folder path to `/home/batman/MCPs/remotion-mcp/my-video/out.mp4`)*
3. Click **"Call Tool"**.

### Expected Result:
The server compiles your React code, launches the headless browser to capture all 120 frames, stitches them using FFmpeg, and outputs:
```text
Successfully rendered video to: /home/batman/MCPs/remotion-mcp/my-video/out.mp4
```

---

## Step 6: Customize & Edit

1. Open `/home/batman/MCPs/remotion-mcp/my-video/src/MyComposition.tsx` in your editor.
2. Change the styling, add colors, or update text.
3. Call **`render_video`** again in the Inspector to output your brand-new customized video instantly!
