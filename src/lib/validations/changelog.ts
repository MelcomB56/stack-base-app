import { z } from "zod";

export const createChangelogEntrySchema = z.object({
  type: z.enum(["ADDED", "CHANGED", "FIXED", "REMOVED", "SECURITY", "DEPRECATED"]),
  description: z.string().min(1).max(2000),
  entryDate: z.string().date().optional(),
  releaseId: z.string().uuid().optional(),
});

export const updateChangelogEntrySchema = createChangelogEntrySchema.partial();
