# Cookbook 02 — Data-Driven Video with inputProps

**What you'll build:** A reusable video template that accepts dynamic data — render the same composition with different names, numbers, or colors without touching the code. Perfect for personalized sales recaps, weekly reports, or social media cards.

**Time:** ~8 minutes  
**Tools used:** `init_remotion_project`, `query_remotion_docs`, `update_composition`, `render_still`, `render_video`

### 🎥 Watch the full walkthrough

https://github.com/Vidhanvyrs/remotion-mcp/raw/master/examples/cookbook102.mp4

**The key concept:** `inputProps` lets you pass a JSON object into any composition at render time. Your React component receives them as props — so one template = infinite variations.

---

## Step 1 — Set up the project

> 💬 **Prompt:**
> ```
> Create a new Remotion project at ~/sales-recap
> ```

> 🔧 **Tool called:** `init_remotion_project`

---

## Step 2 — Look up the inputProps API (optional but smart)

This step shows how to use `query_remotion_docs` to ground the AI in the actual Remotion API before generating code.

> 💬 **Prompt:**
> ```
> Before we build the component, look up how defaultProps and inputProps 
> work in Remotion so we use the correct TypeScript pattern.
> ```

> 🔧 **Tool called:** `query_remotion_docs({ query: "defaultProps inputProps composition TypeScript" })`

> ✅ **Result:** The AI returns the exact Remotion docs on how `defaultProps` and `inputProps` interact — ensuring the generated code uses the correct pattern, not hallucinated API shapes.

---

## Step 3 — Build the data-driven component

> 💬 **Prompt:**
> ```
> Update MyComposition.tsx in ~/sales-recap/src to be a "Sales Recap" card 
> that accepts these typed inputProps:
> - name: string (sales rep's name)
> - deals: number (deals closed this month)
> - revenue: string (formatted revenue, e.g. "$42,000")
> - highlight: string (one achievement sentence)
>
> The card should:
> - Dark background (#111827)
> - Show the name large at the top with a spring animation
> - Show deals and revenue as big stats side-by-side, fading in at frame 15
> - Show the highlight sentence at the bottom, fading in at frame 30
> - Use defaultProps with placeholder values for development
> ```

> 🔧 **Tools called:** `get_composition_code` → `update_composition`

> ✅ **Result:** `MyComposition.tsx` is rewritten with full TypeScript props, spring animations, and correct `defaultProps`.

Then register it with the right dimensions for a social card:

> 💬 **Prompt:**
> ```
> Update Root.tsx in ~/sales-recap/src to register the composition as 
> "SalesRecap" with width=1200, height=675, fps=30, durationInFrames=90, 
> and set defaultProps to match the component's prop types.
> ```

> 🔧 **Tools called:** `get_composition_code` → `update_composition`

---

## Step 4 — Preview with the default props

> 💬 **Prompt:**
> ```
> Render frame 45 of the SalesRecap composition from ~/sales-recap 
> to ~/Desktop/recap-preview.png
> ```

> 🔧 **Tool called:** `render_still`

Check the layout. Adjust if needed.

---

## Step 5 — Render with real data (the power move)

Now render the **same template** with three different reps' data — no code changes.

**Rep 1:**
> 💬 **Prompt:**
> ```
> Render the SalesRecap composition from ~/sales-recap as an MP4 
> with these inputProps:
> {"name": "Sarah Chen", "deals": 14, "revenue": "$128,500", "highlight": "Top performer in Q2 — exceeded target by 34%"}
> Save to ~/Desktop/sarah-recap.mp4
> ```

> 🔧 **Tool called:** `render_video({ inputProps: "{\"name\": \"Sarah Chen\", ... }" })`

> ✅ **Result:** Job ID returned immediately. Poll with `get_render_status`.

**Rep 2 (while Rep 1 is still rendering):**
> 💬 **Prompt:**
> ```
> Also render it with:
> {"name": "Marcus Johnson", "deals": 9, "revenue": "$87,200", "highlight": "Closed the Acme Enterprise deal after 6 months"}
> Save to ~/Desktop/marcus-recap.mp4
> ```

> ✅ **Result:** Second job ID. Both renders run concurrently.

**Rep 3:**
> 💬 **Prompt:**
> ```
> And one more:
> {"name": "Priya Sharma", "deals": 11, "revenue": "$103,750", "highlight": "Highest avg deal size on the team — $9,430 per deal"}
> Save to ~/Desktop/priya-recap.mp4
> ```

---

## Step 6 — Check all three renders

> 💬 **Prompt:**
> ```
> Check the status of all three render jobs
> ```

The AI polls all three job IDs and reports progress. When all are done, you have three personalized videos from one template.

---

## What You Just Did

```
One template  +  Three inputProps objects  =  Three personalized videos
```

No video editor touched. No code duplicated. The same composition rendered with:
- Different names
- Different numbers  
- Different achievement sentences

This pattern scales to **any data-driven video** use case:
- Weekly team performance recaps
- Personalized customer onboarding videos
- Social proof cards ("X companies use...")
- Real-time data dashboards exported as video

---

## Taking It Further

### Render from a JSON array (advanced)

If you have a list of people, you can ask the AI to batch-render all of them:

> 💬 **Prompt:**
> ```
> I have this JSON array of sales reps. Render a SalesRecap video for 
> each one and save them to ~/Desktop/recaps/:
>
> [
>   {"name": "Alice", "deals": 8, "revenue": "$72,000", "highlight": "..."},
>   {"name": "Bob", "deals": 12, "revenue": "$96,500", "highlight": "..."},
>   {"name": "Carol", "deals": 15, "revenue": "$134,000", "highlight": "..."}
> ]
> ```

The AI will kick off three `render_video` calls in sequence and return three job IDs.

### Render a GIF version for email/Slack

> 💬 **Prompt:**
> ```
> Render the SalesRecap composition as a GIF (first 60 frames) with 
> Sarah's data for use in a Slack message
> ```

> 🔧 **Tool called:** `render_gif`
