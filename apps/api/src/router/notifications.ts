import { createChildLogger } from '@serp/core';
import { z } from 'zod';

import { publicProcedure, router } from './base';

export const notificationsRouter = router({
  /**
   * Mailjet webhook endpoint for bounce/complaint handling
   * POST /trpc/notifications.mailjetWebhook
   */
  mailjetWebhook: publicProcedure
    .input(
      z.object({
        event: z.enum(['bounce', 'spam', 'blocked', 'unsub', 'open', 'click']),
        email: z.string().email(),
        time: z.number(),
        MessageID: z.number().optional(),
        CustomID: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate webhook signature if Mailjet provides it
      // For now, we'll trust the webhook (in production, add signature validation)

      const logger = ctx.logger || createChildLogger({ component: 'mailjet-webhook' });
      
      logger.info(
        {
          event: input.event,
          email: input.email,
          messageId: input.MessageID,
          customId: input.CustomID,
        },
        'Received Mailjet webhook'
      );

      // Handle different event types
      if (input.event === 'bounce' || input.event === 'blocked') {
        // Mark email as invalid/hard bounce
        // TODO: Update user's email status or notification delivery status
        logger.warn({ email: input.email }, 'Email bounced or blocked');
      } else if (input.event === 'spam') {
        // User marked as spam
        logger.warn({ email: input.email }, 'Email marked as spam');
      } else if (input.event === 'unsub') {
        // User unsubscribed
        logger.info({ email: input.email }, 'User unsubscribed');
        // TODO: Update notification preferences
      }

      return { success: true };
    }),
});
