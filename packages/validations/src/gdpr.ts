import { z } from 'zod';

export const gdprRequestExportInputSchema = z.object({
  targetUserId: z.string().optional(), // Optional: defaults to self
  scopeOrgId: z.string().optional(), // For admin-on-behalf within an org
});

export const gdprRequestErasureInputSchema = z.object({
  targetUserId: z.string().optional(), // Optional: defaults to self
  scopeOrgId: z.string().optional(), // For admin-on-behalf within an org
  mode: z.enum(['ANONYMIZE', 'DELETE']).default('ANONYMIZE'),
});

export const gdprGetRequestStatusInputSchema = z.object({
  requestId: z.string(),
});

export const gdprDownloadExportInputSchema = z.object({
  requestId: z.string(),
});

export type GdprRequestExportInput = z.infer<typeof gdprRequestExportInputSchema>;
export type GdprRequestErasureInput = z.infer<typeof gdprRequestErasureInputSchema>;
export type GdprGetRequestStatusInput = z.infer<typeof gdprGetRequestStatusInputSchema>;
export type GdprDownloadExportInput = z.infer<typeof gdprDownloadExportInputSchema>;
