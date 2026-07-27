import { z } from "zod";

export const createReleaseSchema = z.object({
  version: z.string().min(1).max(20),
  releaseType: z.enum(["MAJOR", "MINOR", "PATCH", "HOTFIX", "PRERELEASE"]).default("PATCH"),
  releasedAt: z.string().datetime().or(z.date()),
  description: z.string().optional(),
  isCurrent: z.boolean().default(false),
});

export const updateReleaseSchema = createReleaseSchema.partial();
