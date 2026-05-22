import fs from "node:fs/promises";

let cachedPath: string | null = null;

/**
 * Resolves the Chrome/Chromium executable in priority order:
 *
 * 1. `CHROME_EXECUTABLE` environment variable (Docker/CI-friendly)
 * 2. Well-known system install paths (Linux, macOS)
 * 3. Returns `undefined` — caller should then throw a helpful error
 *
 * The resolved path is cached for the lifetime of the process.
 */
export async function getBrowserExecutablePath(): Promise<string | undefined> {
    if (cachedPath) return cachedPath;

    // ── Priority 1: explicit env var ─────────────────────────────────
    const envPath = process.env.CHROME_EXECUTABLE;
    if (envPath) {
        try {
            const stats = await fs.stat(envPath);
            if (stats.isFile()) {
                cachedPath = envPath;
                console.error(`[browser] Using Chrome from CHROME_EXECUTABLE: ${envPath}`);
                return cachedPath;
            }
        } catch {
            console.error(
                `[browser] Warning: CHROME_EXECUTABLE is set to "${envPath}" but no file exists there. ` +
                "Falling back to system detection."
            );
        }
    }

    // ── Priority 2: well-known system paths ──────────────────────────
    const potentialPaths = [
        // Linux system installs
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/opt/google/chrome/chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        // macOS
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];

    for (const p of potentialPaths) {
        try {
            const stats = await fs.stat(p);
            if (stats.isFile()) {
                cachedPath = p;
                console.error(`[browser] Using system Chrome: ${p}`);
                return cachedPath;
            }
        } catch {
            // Keep searching
        }
    }

    // ── Priority 3: not found — return undefined so callers can error ─
    return undefined;
}

/**
 * Like getBrowserExecutablePath() but throws a descriptive, actionable error
 * if Chrome is not found. Use this inside render tools.
 */
export async function requireBrowserExecutablePath(): Promise<string | undefined> {
    const p = await getBrowserExecutablePath();
    if (!p) {
        console.error(
            "[browser] Chrome not found. " +
            "Install Google Chrome or set the CHROME_EXECUTABLE environment variable to its path. " +
            "Example: CHROME_EXECUTABLE=/usr/bin/chromium npx remotion-mcp"
        );
    }
    // Still return undefined — Remotion will attempt its own fallback/download.
    // We do NOT throw here so that CI environments with Remotion's bundled
    // chrome-headless-shell can still work.
    return p;
}
