import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '@/server/trpc';
import { TrendCategorySchema } from '../types/trend';
import { generateDynamicTrends, getDynamicTrendById } from './trend-generator';
import { analyzeTrend } from '@/lib/ai/openai';
import { events, EVENTS } from '@/lib/events';

export const trendsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: TrendCategorySchema.optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        // Generate fresh, dynamic trends using AI
        const trends = await generateDynamicTrends(input.category, input.limit);
        return trends;
      } catch (error) {
        console.error('Failed to generate dynamic trends:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trends',
        });
      }
    }),

  analyze: publicProcedure
    .input(
      z.object({
        trendId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get the trend dynamically
        const trend = await getDynamicTrendById(input.trendId);
        
        if (!trend) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trend not found',
          });
        }

        // Analyze with AI
        const analysis = await analyzeTrend(
          trend.title,
          trend.summary,
          trend.category
        );

        // Emit event
        events.emitEvent(EVENTS.TREND_ANALYZED, {
          trendId: input.trendId,
          analysis,
        });

        return analysis;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze trend',
        });
      }
    }),

  export: publicProcedure
    .input(
      z.object({
        format: z.enum(['pdf', 'slack']),
        trendIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // For MVP, just return success
        events.emitEvent(EVENTS.TREND_EXPORTED, {
          format: input.format,
          trendIds: input.trendIds,
        });

        return {
          success: true,
          message: `Exported ${input.trendIds.length} trends to ${input.format}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export trends',
        });
      }
    }),
});