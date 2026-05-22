# Cookbook 03 — Edit & Iterate Loop with AI

**What you'll build:** A polished, multi-scene explainer using the full read → edit → preview → repeat cycle. This cookbook focuses on the *workflow*, not just a single render — showing how to use your AI as a proper creative collaborator on an existing project.

**Time:** ~5 minutes  
**Tools used:** `list_project_files`, `get_composition_code`, `update_composition`, `render_still`, `render_video`

**When to use this:** You already have a Remotion project (from a previous session, or one you cloned). You want to make changes and see them quickly without touching the code directly.

---

## The Loop Pattern

This is the core pattern you'll use for any iterative design work:

```
get_composition_code  →  understand what's there
update_composition    →  make the change
render_still          →  preview frame to verify
repeat until happy
render_video          →  final output
```

---

## Starting Point

This cookbook assumes you already have a Remotion project. If you don't, use [Cookbook 01](../01-youtube-intro/) to create one first, then come back.

We'll use `~/youtube-intro` from Cookbook 01 as the example.

---

## Step 1 — Explore what exists

Before changing anything, let the AI understand the codebase.

> 💬 **Prompt:**
> ```
> Show me all the files in ~/youtube-intro
> ```

> 🔧 **Tool called:** `list_project_files`

> 💬 **Prompt:**
> ```
> Read ChannelIntro.tsx from ~/youtube-intro/src/components
> ```

> 🔧 **Tool called:** `get_composition_code`

> ✅ **Result:** Full source code returned in the chat. The AI can now reason about what's there.

---

## Step 2 — Make a targeted change

Ask for a specific, isolated change. Be precise — the AI edits exactly what you describe.

> 💬 **Prompt:**
> ```
> In ChannelIntro.tsx, change the spring animation on the title so it 
> has more bounce — use damping: 6 and stiffness: 120. Keep everything 
> else exactly the same.
> ```

> 🔧 **Tools called:** `get_composition_code` → `update_composition`

> ✅ **Result:**
> ```
> Successfully updated composition code in: .../ChannelIntro.tsx
> Bundle cache has been invalidated.
> ```

The cache invalidation is automatic — your next render will use the new code.

---

## Step 3 — Preview the change immediately

Don't render the full video — just check the frame where the animation lands.

> 💬 **Prompt:**
> ```
> Render frame 20 of the Intro composition from ~/youtube-intro 
> to ~/Desktop/check.png
> ```

> 🔧 **Tool called:** `render_still({ frame: 20 })`

Open the PNG and evaluate. If it looks right, move on. If not:

> 💬 **Prompt:**
> ```
> The bounce is too extreme. Bring damping back to 9 and reduce 
> stiffness to 80.
> ```

Repeat the preview. This loop is intentionally fast — a still renders in ~10 seconds.

---

## Step 4 — Add a new element

> 💬 **Prompt:**
> ```
> Read Root.tsx from ~/youtube-intro/src. Then update ChannelIntro.tsx 
> to add a thin horizontal line that draws across the screen from left 
> to right between the title and tagline, animating over frames 20–40 
> using interpolate.
> ```

> 🔧 **Tools called:** `get_composition_code` (Root.tsx) → `get_composition_code` (ChannelIntro.tsx) → `update_composition`

> 💬 **Prompt:**
> ```
> Preview frame 35 to check the line animation
> ```

---

## Step 5 — Check the full timeline at multiple frames

When you're happy with individual elements, spot-check the whole composition at key moments:

> 💬 **Prompt:**
> ```
> Render stills at frames 5, 30, 60, and 90 from the Intro composition 
> and save them to ~/Desktop/ as frame-05.png, frame-30.png, 
> frame-60.png, frame-90.png
> ```

The AI will make four sequential `render_still` calls. You get a rough storyboard of the whole composition.

---

## Step 6 — Final render

Once you're satisfied with the stills:

> 💬 **Prompt:**
> ```
> Render the full Intro composition from ~/youtube-intro as an MP4 
> to ~/Desktop/final-intro.mp4
> ```

> 🔧 **Tool called:** `render_video`

> ✅ **Result:** Job ID returned. Poll with `get_render_status`.

---

## Power Tip: Working on Multiple Compositions

If your project has multiple compositions (e.g. an intro AND an outro):

> 💬 **Prompt:**
> ```
> List all the compositions registered in ~/youtube-intro
> ```

> 🔧 **Tool called:** `list_compositions`

> ✅ **Result:**
> ```json
> [
>   { "id": "Intro", "width": 1920, "height": 1080, "fps": 30, "durationInFrames": 150 },
>   { "id": "Outro", "width": 1920, "height": 1080, "fps": 30, "durationInFrames": 90 }
> ]
> ```

Then target each by `compositionId` in your renders.

---

## Power Tip: Self-Healing with Docs

If a render fails, don't just retry blindly — ask the AI to look up why:

> 💬 **Prompt:**
> ```
> The render failed with this error: [paste error]. 
> Look up this error in the Remotion docs and fix it.
> ```

> 🔧 **Tools called:** `query_remotion_docs` → `update_composition` → `render_still`

The AI queries the official docs, identifies the issue, patches the file, and previews the fix — all in one turn.

---

## The Full Iteration Workflow at a Glance

```
Round 1: Read files → understand current state
Round 2: Make change → preview still → evaluate
Round 3: Adjust → preview again (fast, ~10s per round)
Round N: Happy with stills → render full video
```

Each round of "change + preview" takes about 30 seconds. You can iterate on a composition 10+ times in 5 minutes — faster than editing code manually and refreshing the Remotion Studio.

---

## Common Iteration Prompts

```
"Make the text bigger and centered"
"Add a subtle drop shadow to the title"
"Speed up the entrance animation by 30%"
"Change the background from solid dark to a noise texture overlay"
"Make everything 20% brighter — it looks too dark on my preview"
"Add a 1-second hold at the end before the composition ends"
```
