import { bundle } from "@remotion/bundler";
import fs from "node:fs/promises";
import path from "node:path";

const bundleCache = new Map<string, string>();

export async function getBundleUrl(serveUrl: string): Promise<string> {
    if (serveUrl.startsWith("http")) {
        return serveUrl;
    }

    // Auto-resolve directory to standard Remotion entry point
    try {
        const stats = await fs.stat(serveUrl);
        if (stats.isDirectory()) {
            const potentialEntries = [
                "src/index.ts",
                "src/index.tsx",
                "src/entry.tsx",
                "index.ts",
                "index.tsx",
            ];
            for (const entry of potentialEntries) {
                const fullPath = path.join(serveUrl, entry);
                try {
                    const fileStats = await fs.stat(fullPath);
                    if (fileStats.isFile()) {
                        serveUrl = fullPath;
                        break;
                    }
                } catch {
                    // Try next potential entry
                }
            }
        }
    } catch {
        // Fall back to original serveUrl if path stat fails
    }
    
    if (bundleCache.has(serveUrl)) {
        return bundleCache.get(serveUrl)!;
    }
    
    const bundledUrl = await bundle({ entryPoint: serveUrl });
    bundleCache.set(serveUrl, bundledUrl);
    return bundledUrl;
}
