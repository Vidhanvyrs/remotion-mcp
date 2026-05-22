import crypto from "node:crypto";

export type JobStatus = "pending" | "rendering" | "done" | "error";

export interface RenderJob {
    id: string;
    status: JobStatus;
    /** 0–100 */
    progress: number;
    outputPath?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

const jobs = new Map<string, RenderJob>();

export function createJob(): RenderJob {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const job: RenderJob = {
        id,
        status: "pending",
        progress: 0,
        createdAt: now,
        updatedAt: now,
    };
    jobs.set(id, job);
    return job;
}

export function updateJob(id: string, patch: Partial<Omit<RenderJob, "id" | "createdAt">>): void {
    const job = jobs.get(id);
    if (!job) return;
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
}

export function getJob(id: string): RenderJob | undefined {
    return jobs.get(id);
}

/** Prune jobs older than `maxAgeMs` (default 2 hours) to avoid unbounded memory growth. */
export function pruneOldJobs(maxAgeMs = 2 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, job] of jobs) {
        if (new Date(job.createdAt).getTime() < cutoff) {
            jobs.delete(id);
        }
    }
}
