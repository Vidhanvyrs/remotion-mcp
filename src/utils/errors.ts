export interface StructuredError {
    type: "BundleError" | "RenderError" | "PathError" | "ConfigurationError" | "ValidationError" | "UnknownError";
    message: string;
    stackExcerpt?: string;
    suggestedFix: string;
}

export function formatError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    let type: StructuredError["type"] = "UnknownError";
    let suggestedFix = "Check the logs or trace the stack output to identify the issue.";
    
    // Classify error type and suggest fix
    if (message.includes("Cannot find module") || message.includes("Module not found") || message.includes("Could not resolve") || message.includes("declaration file")) {
        type = "BundleError";
        suggestedFix = "Verify that all imported modules exist and are installed in package.json. Ensure relative imports are extensionless (e.g., use './Root' instead of './Root.js' or './Root.tsx') so Webpack can resolve them.";
    } else if (message.includes("chrome") || message.includes("chromium") || message.includes("browserExecutable") || message.includes("headless") || message.includes("Puppeteer")) {
        type = "ConfigurationError";
        suggestedFix = "Make sure Google Chrome or Chromium is installed on your local operating system. The server attempts to automatically locate Chrome under standard binary paths.";
    } else if (message.includes("ENOENT") || message.includes("no such file or directory") || message.includes("directory")) {
        type = "PathError";
        suggestedFix = "Verify the provided paths are correct and that the files or directories actually exist at the specified locations.";
    } else if (message.includes("JSON") || message.includes("Unexpected token") || message.includes("props")) {
        type = "ValidationError";
        suggestedFix = "Ensure that the 'inputProps' parameter is a valid JSON string (e.g. '{\"title\": \"Hello\"}') matching the properties of the target composition component.";
    } else if (message.includes("render") || message.includes("composition") || message.includes("frame")) {
        type = "RenderError";
        suggestedFix = "Ensure that the composition ID exists, standard duration bounds are not exceeded, and that the component does not crash during rendering.";
    }

    // Excerpt stack trace (first 5 lines)
    let stackExcerpt: string | undefined;
    if (stack) {
        stackExcerpt = stack.split("\n").slice(0, 5).join("\n");
    }

    const structured: StructuredError = {
        type,
        message,
        stackExcerpt,
        suggestedFix
    };

    return JSON.stringify({ status: "error", error: structured }, null, 2);
}
