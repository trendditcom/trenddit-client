import OpenAI from 'openai';
import { z } from 'zod';
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
        model: 'gpt-4o',
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
        temperature: 0.7,
        max_tokens: 3000,
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
        throw new Error('OpenAI API key is not configured. Please contact support.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('You\'ve reached the rate limit. Please try again in a few minutes.');
      } else if (error.message.includes('network')) {
        throw new Error('Unable to connect to the AI service. Please check your internet connection.');
      }
    }
    
    throw new Error('Failed to generate content. Please try again or contact support if the issue persists.');
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
        model: 'gpt-4o',
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
        temperature: 0.7,
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
        throw new Error('OpenAI API key is not configured. Please contact support.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('You\'ve reached the rate limit. Please try again in a few minutes.');
      } else if (error.message.includes('network')) {
        throw new Error('Unable to connect to the AI service. Please check your internet connection.');
      }
    }
    
    throw new Error('Failed to generate content. Please try again or contact support if the issue persists.');
  }
}