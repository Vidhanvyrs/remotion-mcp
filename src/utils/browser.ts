import fs from "node:fs/promises";

let cachedPath: string | null = null;

/**
 * Detects if a local system Chrome/Chromium installation exists
 * to avoid downloading chrome-headless-shell over the network.
 */
export async function getBrowserExecutablePath(): Promise<string | undefined> {
    if (cachedPath) return cachedPath;

    const potentialPaths = [
        "/usr/bin/google-chrome",
        "/opt/google/chrome/chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ];

    for (const p of potentialPaths) {
        try {
            const stats = await fs.stat(p);
            if (stats.isFile()) {
                cachedPath = p;
                return p;
            }
        } catch {
            // Keep searching
        }
    }

    return undefined;
}
