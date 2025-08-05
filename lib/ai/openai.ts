import OpenAI from 'openai';
import { z } from 'zod';
import { serverConfig } from '@/lib/config/server';
import { withRetry } from '@/lib/utils/retry';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const TrendAnalysisSchema = z.object({
  businessImplications: z.string(),
  technicalRequirements: z.string(),
  implementationTimeline: z.string(),
  riskFactors: z.array(z.string()),
  impactScore: z.number().min(1).max(10),
});

export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;

export async function generateCompletion(prompt: string): Promise<string> {
  try {
    return await withRetry(async () => {
      const response = await openai.chat.completions.create({
        model: serverConfig.ai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI business consultant helping enterprises identify and prioritize business needs. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: serverConfig.ai.temperature,
        max_tokens: serverConfig.ai.max_tokens,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      return content;
    }, {
      onRetry: (attempt, error) => {
        console.log(`Retrying OpenAI request (attempt ${attempt}):`, error.message);
      }
    });
  } catch (error) {
    console.error('Error generating AI completion:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error(serverConfig.errors.messages.api_key_missing);
      } else if (error.message.includes('rate limit')) {
        throw new Error(serverConfig.errors.messages.rate_limit);
      } else if (error.message.includes('network')) {
        throw new Error(serverConfig.errors.messages.network_error);
      }
    }
    
    throw new Error(serverConfig.errors.messages.generation_failed);
  }
}

export async function analyzeTrend(
  title: string,
  summary: string,
  category: string
): Promise<TrendAnalysis> {
  try {
    return await withRetry(async () => {
      const prompt = `Analyze this ${category} trend for enterprise impact:

Title: ${title}
Summary: ${summary}

Provide analysis with:
- Business implications (2-3 sentences)
- Technical requirements (2-3 bullet points)
- Implementation timeline (rough estimate)
- Risk factors (2-3 key risks)
- Impact score (1-10, where 10 is highest impact)

Keep response concise and actionable.`;

      const response = await openai.chat.completions.create({
        model: serverConfig.ai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI engineering advisor helping enterprises understand and adopt AI trends.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: serverConfig.ai.temperature,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      const parsed = JSON.parse(content);
      return TrendAnalysisSchema.parse(parsed);
    }, {
      onRetry: (attempt, error) => {
        console.log(`Retrying trend analysis (attempt ${attempt}):`, error.message);
      }
    });
  } catch (error) {
    console.error('Error analyzing trend:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error(serverConfig.errors.messages.api_key_missing);
      } else if (error.message.includes('rate limit')) {
        throw new Error(serverConfig.errors.messages.rate_limit);
      } else if (error.message.includes('network')) {
        throw new Error(serverConfig.errors.messages.network_error);
      }
    }
    
    throw new Error(serverConfig.errors.messages.generation_failed);
  }
}