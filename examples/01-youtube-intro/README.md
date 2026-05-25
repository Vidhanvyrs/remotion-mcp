# Cookbook 01 — YouTube Channel Intro in 5 Prompts

**What you'll build:** A polished animated title card — the kind used as a YouTube channel intro or video opener. Text springs in, a subtitle fades up, and the whole thing exports as an MP4.

**Time:** ~5 minutes of prompting, ~3 minutes of rendering  
**Tools used:** `init_remotion_project`, `list_project_files`, `add_component`, `render_still`, `render_video`

### 🎥 Watch the full walkthrough

<video src="../cookbook101.mp4" controls width="100%" alt="Cookbook 01 — YouTube Channel Intro walkthrough"></video>

---

## Step 1 — Scaffold the project

> 💬 **Prompt:**
> ```
> Create a new Remotion project at ~/youtube-intro
> ```

> 🔧 **Tool called:** `init_remotion_project({ directory: "~/youtube-intro" })`

> ✅ **Result:**
> ```
> Successfully initialized Remotion project in /home/you/youtube-intro
> and completed npm install!
> ```

This creates the full project structure with `src/index.ts`, `Root.tsx`, and a starter `MyComposition.tsx`.

---

## Step 2 — Check what was created

> 💬 **Prompt:**
> ```
> Show me the file tree of ~/youtube-intro
> ```

> 🔧 **Tool called:** `list_project_files({ projectPath: "~/youtube-intro" })`

> ✅ **Result:**
> ```
> src/
>   index.ts
>   Root.tsx
>   MyComposition.tsx
> package.json
> tsconfig.json
> ```

---

## Step 3 — Add the intro component

> 💬 **Prompt:**
> ```
> Add a new component called "ChannelIntro" to ~/youtube-intro using the 
> sequence template. It should show my channel name "Dev with Vidhan" as 
> a large title that springs in from the left, then a tagline "Building 
> stuff with AI" that fades in below it after half a second.
> ```

> 🔧 **Tool called:** `add_component({ projectPath: "~/youtube-intro", componentName: "ChannelIntro", subfolder: "components", template: "sequence" })`

> ✅ **Result:**
> ```
> Successfully created component at:
> /home/you/youtube-intro/src/components/ChannelIntro.tsx
>
> Template: sequence
>
> To use this in your video, import it in Root.tsx and register 
> it as a <Composition />.
> ```

Now register it:

> 💬 **Prompt:**
> ```
> Read Root.tsx from ~/youtube-intro/src and update it to register 
> ChannelIntro as a composition with id="Intro", 5 seconds duration, 
> 30fps, 1920×1080.
> ```

> 🔧 **Tools called:** `get_composition_code` → `update_composition`

> ✅ **Result:** Root.tsx updated, cache cleared.

---

## Step 4 — Preview a frame before committing to full render

Rendering a full video takes time. Always preview a still first.

> 💬 **Prompt:**
> ```
> Render frame 45 of the Intro composition from ~/youtube-intro 
> as a PNG and save it to ~/Desktop/intro-preview.png
> ```

> 🔧 **Tool called:** `render_still({ serveUrl: "~/youtube-intro", compositionId: "Intro", frame: 45, outName: "~/Desktop/intro-preview.png" })`

> ✅ **Result:**
> ```
> Successfully rendered still image to: /home/you/Desktop/intro-preview.png
> ```

Open the file and check the layout. If you want to tweak anything — font size, colors, timing — do it now before the full render:

> 💬 **Prompt (if you want changes):**
> ```
> Read ChannelIntro.tsx from ~/youtube-intro/src/components and update it 
> so the title is white and larger (90px), background is a dark navy (#0a0f1e), 
> and the tagline uses a slightly transparent white (rgba(255,255,255,0.7)).
> Then preview frame 45 again.
> ```

---

## Step 5 — Render the final video

> 💬 **Prompt:**
> ```
> Render the Intro composition from ~/youtube-intro as an MP4 
> and save it to ~/Desktop/channel-intro.mp4
> ```

> 🔧 **Tool called:** `render_video({ serveUrl: "~/youtube-intro", compositionId: "Intro", outName: "~/Desktop/channel-intro.mp4" })`

> ✅ **Result (immediate — async):**
> ```json
> {
>   "jobId": "f3a2b1c4-...",
>   "status": "pending",
>   "message": "Render job started. Use get_render_status to poll progress."
> }
> ```

Poll the progress:

> 💬 **Prompt:**
> ```
> Check the status of that render job
> ```

> 🔧 **Tool called:** `get_render_status({ jobId: "f3a2b1c4-..." })`

> ✅ **Result (while rendering):**
> ```json
> { "status": "rendering", "progress": 62 }
> ```

> ✅ **Result (when done):**
> ```json
> {
>   "status": "done",
>   "progress": 100,
>   "outputPath": "/home/you/Desktop/channel-intro.mp4"
> }
> ```

Open the file:
```bash
xdg-open ~/Desktop/channel-intro.mp4   # Linux
open ~/Desktop/channel-intro.mp4        # macOS
```

---

## What You Just Did

```
init_remotion_project  →  Scaffolded a full React/Remotion project
list_project_files     →  Confirmed the structure
add_component          →  Generated a typed, animated component
update_composition     →  Wired it into Root.tsx
render_still           →  Previewed a frame before full render
render_video           →  Kicked off async MP4 render
get_render_status      →  Polled until done
```

**Total: 5 prompts → 1 polished MP4.**

---

## Variations to Try

```
"Make the background an animated gradient that shifts from navy to purple"
"Add a logo placeholder in the top-left corner"
"Render it as a GIF instead for Discord/Twitter use"
"Render with inputProps {"channel": "My New Channel"} so I can reuse the template"
```
