import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ungültige Hex-Farbe"),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();
