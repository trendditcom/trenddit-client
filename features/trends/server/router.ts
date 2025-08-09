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
        let trend = await getTrendById(input.trendId);
        
        // If not found in cache, try generating fresh trends and search again
        if (!trend) {
          try {
            // Generate fresh trends to ensure we have the latest set
            const freshTrends = await generateDynamicTrends(undefined, 20);
            
            // Update cache with fresh trends
            const { updateTrendsCache } = await import('../services/trend-service');
            updateTrendsCache(freshTrends);
            
            // Try finding the trend again
            trend = freshTrends.find(t => t.id === input.trendId) || null;
          } catch (generationError) {
            console.warn('Failed to generate fresh trends for trend lookup:', generationError);
          }
        }
        
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

  testGeneration: publicProcedure
    .input(
      z.object({
        settings: z.object({
          userPrompt: z.object({
            trendFocus: z.string(),
            industryContext: z.string(),
            timeframeContext: z.string(),
            sourcePreferences: z.string(),
          }),
          systemPrompt: z.object({
            responseFormat: z.string(),
            validationRules: z.string(),
            categoryRequirements: z.string(),
            urlValidationRules: z.string(),
          }),
          modelSettings: z.object({
            temperature: z.number(),
            maxTokens: z.number(),
          }),
          urlVerification: z.object({
            enabled: z.boolean(),
            timeout: z.number(),
            fallbackToGenerated: z.boolean(),
          }),
        }),
        trendCount: z.number().min(5).max(20),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { openai } = await import('@/lib/ai/openai');
        const { buildTrendGenerationPrompt } = await import('../utils/settings-loader');
        const { serverConfig } = await import('@/lib/config/server');
        
        // Build prompts using the provided settings
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const systemMessage = serverConfig.ai.systemPrompt;
        
        const trendsPerCategory = Math.ceil(input.trendCount / 4); // Distribute evenly across 4 categories
        
        const userPrompt = buildTrendGenerationPrompt(
          input.settings,
          currentMonth,
          input.trendCount,
          trendsPerCategory,
          undefined // no company profile for test
        );

        // Call OpenAI with the custom settings
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: input.settings.modelSettings.temperature,
          max_tokens: input.settings.modelSettings.maxTokens,
          response_format: { type: 'json_object' }
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response from OpenAI');
        }

        // Parse the response - handle both array and object with array property
        let trendsData: any[];
        const parsed = JSON.parse(response);
        
        if (Array.isArray(parsed)) {
          trendsData = parsed;
        } else if (parsed.trends && Array.isArray(parsed.trends)) {
          trendsData = parsed.trends;
        } else {
          throw new Error('Invalid response format from AI');
        }

        // Transform to proper trend objects (simplified version for testing)
        const trends = trendsData.slice(0, input.trendCount).map((trend, index) => ({
          id: `test_trend_${Date.now()}_${index}`,
          title: trend.title || `AI Trend ${index + 1}`,
          summary: trend.summary || 'Emerging AI trend with significant market impact.',
          category: trend.category || 'consumer',
          impact_score: Math.min(10, Math.max(1, trend.impact_score || 7)),
          source: trend.source || 'Industry Analysis',
          source_url: trend.source_url || undefined,
          created_at: new Date(currentDate.getTime() - (index * 24 * 60 * 60 * 1000)),
          updated_at: new Date(),
        }));

        return {
          success: true,
          trends,
          message: `Generated ${trends.length} test trends successfully`,
        };
      } catch (error) {
        console.error('Test generation failed:', error);
        
        let errorMessage = 'Failed to generate test trends';
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage = 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.';
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.message.includes('JSON')) {
            errorMessage = 'AI returned invalid JSON. Try adjusting your prompt settings and try again.';
          }
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        });
      }
    }),
});