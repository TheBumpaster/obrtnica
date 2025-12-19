import { z } from 'zod';

import { config } from '../config';

/**
 * Template registry mapping notification types to Mailjet template IDs
 * Template IDs should be configured via environment variables or admin panel
 */
export const MAILJET_TEMPLATES: Record<string, string> = {
  'email_verification': config.MAILJET_TEMPLATE_EMAIL_VERIFICATION,
  'password_reset': config.MAILJET_TEMPLATE_PASSWORD_RESET,
  'magic_link': config.MAILJET_TEMPLATE_MAGIC_LINK,
  'welcome': config.MAILJET_TEMPLATE_WELCOME,
  'notification': config.MAILJET_TEMPLATE_NOTIFICATION,
} as const;

/**
 * Template variable schemas per template type
 */
export const templateVariableSchemas = {
  email_verification: z.object({
    verification_url: z.string(),
    user_name: z.string().optional(),
  }),
  password_reset: z.object({
    reset_url: z.string(),
    user_name: z.string().optional(),
  }),
  magic_link: z.object({
    magic_link_url: z.string(),
    user_name: z.string().optional(),
  }),
  welcome: z.object({
    user_name: z.string(),
    org_name: z.string(),
  }),
  notification: z.object({
    title: z.string(),
    body: z.string(),
    action_url: z.string().optional(),
  }),
} as const;

export type TemplateType = keyof typeof templateVariableSchemas;

/**
 * Get template ID for a notification type
 */
export function getTemplateId(templateType: TemplateType): string | null {
  return MAILJET_TEMPLATES[templateType] || null;
}

/**
 * Validate template variables against schema
 */
export function validateTemplateVariables(
  templateType: TemplateType,
  variables: Record<string, unknown>
): Record<string, unknown> {
  const schema = templateVariableSchemas[templateType];
  return schema.parse(variables);
}
