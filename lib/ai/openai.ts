import OpenAI from 'openai';
import { withRetry } from '@/lib/utils/retry';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


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

