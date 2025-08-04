import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
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
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from AI');

    return content;
  } catch (error) {
    console.error('Error generating AI completion:', error);
    throw new Error('AI generation failed');
  }
}

export async function analyzeTrend(
  title: string,
  summary: string,
  category: string
): Promise<TrendAnalysis> {
  try {
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
  } catch (error) {
    console.error('Error analyzing trend:', error);
    // Return fallback analysis
    return {
      businessImplications: 'Analysis temporarily unavailable. This trend may impact your organization.',
      technicalRequirements: 'Technical assessment pending.',
      implementationTimeline: '3-6 months',
      riskFactors: ['Analysis uncertainty', 'Resource requirements unclear'],
      impactScore: 5,
    };
  }
}