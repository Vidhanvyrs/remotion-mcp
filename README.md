What the v1 (easily deployable) MCP server should do
For a solid first stage, I'd scope it to 5 core tools:
1. create_composition
Scaffolds a new Remotion composition file from a template (e.g. a title card, text animation, slideshow). Takes parameters like name, durationInFrames, fps, width, height.
2. list_compositions
Calls getCompositions() from @remotion/renderer on a given project path — returns all registered compositions with their metadata.
3. render_video
The main one. Takes compositionId, outputPath, optional inputProps (JSON), and triggers bundle() + renderMedia() under the hood. Returns the output file path when done.
4. render_still
Same idea but renders a single frame as PNG/JPEG — great for previewing without a full render.
5. get_render_status (if you want async)
Since renders can take time, optionally queue renders and poll status. For v1 you can keep it synchronous and skip this.

TypeScript + Node.js
@modelcontextprotocol/sdk   ← official MCP SDK
@remotion/renderer           ← for bundle/render APIs
@remotion/bundler            ← for webpack bundling