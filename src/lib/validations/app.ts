import { z } from "zod";

const urlOrEmpty = z.union([z.literal(""), z.string().url()]);

export const createAppSchema = z.object({
  name: z.string().min(2).max(100),
  shortDesc: z.string().min(10).max(255),
  longDesc: z.string().optional(),
  urlProd: urlOrEmpty.optional(),
  urlStaging: urlOrEmpty.optional(),
  urlDev: urlOrEmpty.optional(),
  status: z
    .enum(["DEVELOPMENT", "TESTING", "PRODUCTION", "ARCHIVED", "MAINTENANCE"])
    .default("DEVELOPMENT"),
  repoUrl: urlOrEmpty.optional(),
  dockerImage: z.string().max(200).optional(),
  dockerHost: z.string().max(255).optional(),
  dockerContainer: z.string().max(100).optional(),
  metricsUrl: urlOrEmpty.optional(),
  agentUrl: urlOrEmpty.optional(),
  agentToken: z.string().max(200).optional(),
  apiEndpoint: urlOrEmpty.optional(),
  language: z.string().max(50).optional(),
  dbType: z.string().max(50).optional(),
  supportEmail: z.union([z.literal(""), z.string().email()]).optional(),
  contactName: z.string().max(100).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  stackIds: z.array(z.string().uuid()).optional(),
  technologyIds: z.array(z.string().uuid()).optional(),
  criticality: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  vendor: z.string().max(100).optional(),
  githubToken:        z.string().max(255).optional(),
  logoUrl:            urlOrEmpty.optional(),
  deploymentTargetId: z.string().uuid().optional().nullable(),
  runtimeType:        z.enum(["DOCKER","DOCKER_COMPOSE","KUBERNETES","SYSTEMD","PM2","BARE_PROCESS","STATIC","SERVERLESS","PAAS","IIS","OTHER"]).optional().nullable(),
  hostPort:           z.coerce.number().int().min(1).max(65535).optional().nullable(),
  containerPort:      z.coerce.number().int().min(1).max(65535).optional().nullable(),
  hostingNotes:          z.string().max(2000).optional().nullable(),
  testCoveragePercent:   z.coerce.number().int().min(0).max(100).optional().nullable(),
  securityRating:        z.coerce.number().int().min(0).max(100).optional().nullable(),
  lastDeploymentSuccess: z.enum(["true","false",""]).transform((v) => v === "true" ? true : v === "false" ? false : null).optional().nullable(),
});

export const updateAppSchema = createAppSchema.partial();

export const changeStatusSchema = z.object({
  status: z.enum([
    "DEVELOPMENT",
    "TESTING",
    "PRODUCTION",
    "ARCHIVED",
    "MAINTENANCE",
  ]),
  maintenanceNote: z.string().max(500).optional(),
  maintenanceEnd: z.string().datetime().optional().nullable(),
});

export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
