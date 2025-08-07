import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '@/server/trpc';
import { TrendCategorySchema } from '../types/trend';
import { generateDynamicTrends, getDynamicTrendById } from './trend-generator';
import { getTrends, getTrendById } from '../services/trend-service';
import { events, EVENTS } from '@/lib/events';

export const trendsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        // Remove category parameter - always return mixed dataset for client-side filtering
        limit: z.number().min(1).max(100).default(20),
        // Optional refresh parameter to force fresh generation
        refresh: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        // Use the caching service for trends - it will cache in memory and localStorage
        // If refresh is requested, we bypass cache and generate fresh
        if (input.refresh) {
          const { clearTrendsCache } = await import('../services/trend-service');
          clearTrendsCache();
        }
        
        // Get trends through the caching service
        const trends = await getTrends(undefined, input.limit);
        
        // For client-side caching, we'll include cache metadata
        return trends;
      } catch (error) {
        console.error('Failed to fetch trends:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trends',
        });
      }
    }),

  getById: publicProcedure
    .input(
      z.object({
        trendId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Use the caching service first
        const trend = await getTrendById(input.trendId);
        
        if (!trend) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trend not found',
          });
        }

        return trend;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trend',
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

  regenerateForProfile: publicProcedure
    .input(
      z.object({
        personalizationProfile: z.object({
          industry: z.string(),
          market: z.string(),
          customer: z.string(),
          businessSize: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const profile = input.personalizationProfile;
        
        // Generate personalized trends based on personalization profile
        const trends = await generateDynamicTrends(
          undefined, // No category filter - generate mixed trends
          20,
          {
            industry: profile.industry,
            market: profile.market,
            customer: profile.customer,
            businessSize: profile.businessSize,
          }
        );

        // Update cache with new personalized trends
        const { updateTrendsCache } = await import('../services/trend-service');
        updateTrendsCache(trends);

        // Emit event for regeneration
        events.emitEvent('trend.regenerated', {
          personalizationProfile: profile,
          trendsCount: trends.length,
        });

        return {
          success: true,
          message: `Generated ${trends.length} personalized trends`,
          trends,
        };
      } catch (error) {
        console.error('Failed to regenerate trends for profile:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to regenerate trends',
        });
      }
    }),
});