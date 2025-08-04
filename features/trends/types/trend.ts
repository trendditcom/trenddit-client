import { z } from 'zod';

export const TrendCategorySchema = z.enum(['consumer', 'competition', 'economy', 'regulation']);
export type TrendCategory = z.infer<typeof TrendCategorySchema>;

export const TrendSchema = z.object({
  id: z.string(),
  category: TrendCategorySchema,
  title: z.string(),
  summary: z.string(),
  impact_score: z.number().min(1).max(10),
  source: z.string(),
  source_url: z.string().optional(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
});

export type Trend = z.infer<typeof TrendSchema>;

export const TrendAnalysisSchema = z.object({
  businessImplications: z.string(),
  technicalRequirements: z.string(),
  implementationTimeline: z.string(),
  riskFactors: z.array(z.string()),
  impactScore: z.number().min(1).max(10),
});

export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;