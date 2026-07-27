import { z } from "zod";

export const createTechnologySchema = z.object({
  name: z.string().min(1).max(100),
  category: z
    .enum([
      "FRONTEND",
      "BACKEND",
      "DATABASE",
      "INFRASTRUCTURE",
      "TOOL",
      "LANGUAGE",
      "OTHER",
    ])
    .default("OTHER"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export const updateTechnologySchema = createTechnologySchema.partial();

export const createStackSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  technologyIds: z.array(z.string().uuid()).min(1, "Mind. 1 Technologie"),
});

export const updateStackSchema = createStackSchema.partial();
