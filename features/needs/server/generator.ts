import { CompanyContext, Need, NeedCategory, NeedPriority } from '../types/need';
import { getTrendById } from '@/features/trends/services/trend-service';
import { generateCompletion } from '@/lib/ai/openai';

/**
 * Generate personalized business needs from a trend and company context
 */
export async function generateNeedsFromTrend(
  trendId: string,
  companyContext: CompanyContext,
  maxNeeds: number = 5
): Promise<Need[]> {
  // Get the trend dynamically
  const trend = await getTrendById(trendId);
  if (!trend) {
    throw new Error(`Trend not found: ${trendId}`);
  }

  // Create AI prompt for need generation
  const prompt = createNeedGenerationPrompt(trend, companyContext, maxNeeds);
  
  try {
    const completion = await generateCompletion(prompt);
    const needs = parseNeedsFromCompletion(completion, trendId, companyContext.id!);
    
    // Ensure we have at least one need
    if (needs.length === 0) {
      console.warn('AI generated zero needs, falling back to dynamic generation');
      return await generateDynamicFallbackNeeds(trend, companyContext, maxNeeds);
    }
    
    return needs;
  } catch (error) {
    console.error('AI need generation failed:', error);
    // Fallback to dynamic generation instead of templates
    console.log('Using dynamic fallback need generation');
    return await generateDynamicFallbackNeeds(trend, companyContext, maxNeeds);
  }
}

/**
 * Create AI prompt for generating business needs
 */
function createNeedGenerationPrompt(trend: any, companyContext: CompanyContext, maxNeeds: number): string {
  return `You are an AI business consultant. Generate ${maxNeeds} specific, actionable business needs for this company based on the given AI trend.

TREND INFORMATION:
Title: ${trend.title}
Category: ${trend.category}
Summary: ${trend.summary}
Impact Score: ${trend.impact_score}/10

COMPANY CONTEXT:
Name: ${companyContext.name}
Industry: ${companyContext.industry}
Size: ${companyContext.size}
Tech Maturity: ${companyContext.techMaturity}
Current Challenges: ${companyContext.currentChallenges?.join(', ')}
Primary Goals: ${companyContext.primaryGoals?.join(', ')}

Generate ${maxNeeds} specific business needs that:
1. Directly relate to the AI trend
2. Are relevant to the company's industry and size
3. Address their current challenges and goals
4. Are actionable and measurable

For each need, provide:
- title: Clear, specific need statement
- description: Detailed explanation (2-3 sentences)
- category: One of [automation, data_insights, customer_experience, operational_efficiency, competitive_advantage, risk_management, cost_reduction, innovation]
- priority: One of [low, medium, high, critical]
- impactScore: 1-10 (business impact)
- effortScore: 1-10 (implementation effort)
- urgencyScore: 1-10 (time sensitivity)
- stakeholders: List of affected teams/roles
- businessValue: Expected business value (1 sentence)
- risks: 2-3 potential risks if not addressed
- successMetrics: 2-3 measurable outcomes

IMPORTANT: You must respond with valid JSON only. No explanations, no markdown, just the JSON array.

Return as JSON object with "needs" array property:
{
  "needs": [
    {
      "title": "string",
      "description": "string", 
      "category": "category_value",
      "priority": "priority_value",
      "impactScore": 5,
      "effortScore": 5,
      "urgencyScore": 5,
      "stakeholders": ["role1", "role2"],
      "businessValue": "string",
      "risks": ["risk1", "risk2"],
      "successMetrics": ["metric1", "metric2"]
    }
  ]
}`;
}

/**
 * Parse AI-generated needs from completion response
 */
function parseNeedsFromCompletion(completion: string, trendId: string, companyId: string): Need[] {
  try {
    // Since we're using JSON response format, the completion should be valid JSON
    const parsed = JSON.parse(completion);
    
    // Handle both array format (legacy) and object format (new)
    let parsedNeeds: any[];
    if (Array.isArray(parsed)) {
      parsedNeeds = parsed;
    } else if (parsed.needs && Array.isArray(parsed.needs)) {
      parsedNeeds = parsed.needs;
    } else {
      throw new Error('Invalid JSON structure: expected array or object with "needs" property');
    }

    return parsedNeeds.map((need: any, index: number) => ({
      id: `need_${trendId}_${Date.now()}_${index}`,
      trendId,
      companyId,
      title: need.title || `Generated Need ${index + 1}`,
      description: need.description || 'AI-generated business need',
      category: validateCategory(need.category),
      priority: validatePriority(need.priority),
      impactScore: Math.min(Math.max(need.impactScore || 5, 1), 10),
      effortScore: Math.min(Math.max(need.effortScore || 5, 1), 10),
      urgencyScore: Math.min(Math.max(need.urgencyScore || 5, 1), 10),
      stakeholders: Array.isArray(need.stakeholders) ? need.stakeholders : ['Management'],
      businessValue: need.businessValue || 'Expected to improve business operations',
      risks: Array.isArray(need.risks) ? need.risks : ['Implementation challenges'],
      successMetrics: Array.isArray(need.successMetrics) ? need.successMetrics : ['Success measurement needed'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to parse AI completion:', error);
    console.error('Raw completion content:', completion);
    throw new Error(`Failed to parse AI-generated needs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Dynamic fallback need generation when primary AI fails
 * Uses a simplified AI prompt to ensure we never return hardcoded templates
 */
async function generateDynamicFallbackNeeds(trend: any, companyContext: CompanyContext, maxNeeds: number): Promise<Need[]> {
  const currentYear = new Date().getFullYear();
  
  const fallbackPrompt = `Generate ${maxNeeds} business needs for this company based on this AI trend. Current year: ${currentYear}.

TREND: ${trend.title}
CATEGORY: ${trend.category}
SUMMARY: ${trend.summary}

COMPANY:
- Name: ${companyContext.name}
- Industry: ${companyContext.industry}
- Size: ${companyContext.size}
- Challenges: ${companyContext.currentChallenges?.join(', ') || 'Standard business challenges'}
- Goals: ${companyContext.primaryGoals?.join(', ') || 'Growth and efficiency'}

Generate practical, specific needs that this company should address given this trend.

Return as JSON:
{
  "needs": [
    {
      "title": "Specific need title",
      "description": "2-3 sentence description",
      "category": "automation|data_insights|customer_experience|operational_efficiency|competitive_advantage|risk_management|cost_reduction|innovation",
      "priority": "low|medium|high|critical",
      "impactScore": 7,
      "effortScore": 5,
      "urgencyScore": 6,
      "stakeholders": ["team1", "team2"],
      "businessValue": "Expected business value statement",
      "risks": ["risk1", "risk2"],
      "successMetrics": ["metric1", "metric2"]
    }
  ]
}`;

  try {
    const completion = await generateCompletion(fallbackPrompt);
    return parseNeedsFromCompletion(completion, trend.id, companyContext.id!);
  } catch (error) {
    console.error('Dynamic fallback needs generation failed:', error);
    
    // Absolute final fallback - generate minimal dynamic needs
    return generateMinimalDynamicNeeds(trend, companyContext, maxNeeds);
  }
}

/**
 * Generate minimal but dynamic needs as absolute last resort
 */
function generateMinimalDynamicNeeds(trend: any, companyContext: CompanyContext, maxNeeds: number): Need[] {
  const currentYear = new Date().getFullYear();
  const baseId = Date.now();
  
  const needTypes = [
    {
      category: 'automation' as NeedCategory,
      title: `Implement ${trend.title} Automation`,
      description: `Leverage the opportunities from ${trend.title} to automate key processes at ${companyContext.name}, improving efficiency and reducing manual work in ${currentYear}.`
    },
    {
      category: 'data_insights' as NeedCategory,
      title: `Develop ${trend.title} Analytics`,
      description: `Create analytics capabilities to understand the impact of ${trend.title} on ${companyContext.name}'s ${companyContext.industry} operations and make data-driven decisions.`
    },
    {
      category: 'competitive_advantage' as NeedCategory,
      title: `Leverage ${trend.title} for Competitive Edge`,
      description: `Position ${companyContext.name} ahead of competitors by strategically adopting capabilities related to ${trend.title} in the ${companyContext.industry} market.`
    }
  ];

  return needTypes.slice(0, maxNeeds).map((needType, index) => ({
    id: `dynamic_need_${baseId}_${index}`,
    trendId: trend.id,
    companyId: companyContext.id!,
    title: needType.title,
    description: needType.description,
    category: needType.category,
    priority: 'medium' as NeedPriority,
    impactScore: 7,
    effortScore: 6,
    urgencyScore: 6,
    stakeholders: ['Management', 'IT', 'Operations'],
    businessValue: `Expected to improve ${companyContext.name}'s competitive position and operational efficiency`,
    risks: ['Implementation complexity', 'Change management', 'Resource allocation'],
    successMetrics: ['Performance improvement', 'Cost reduction', 'User adoption rate'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Validate and sanitize category values
 */
function validateCategory(category: string): NeedCategory {
  const validCategories: NeedCategory[] = [
    'automation', 'data_insights', 'customer_experience', 'operational_efficiency',
    'competitive_advantage', 'risk_management', 'cost_reduction', 'innovation'
  ];
  
  return validCategories.includes(category as NeedCategory) 
    ? category as NeedCategory 
    : 'operational_efficiency';
}

/**
 * Validate and sanitize priority values
 */
function validatePriority(priority: string): NeedPriority {
  const validPriorities: NeedPriority[] = ['low', 'medium', 'high', 'critical'];
  
  return validPriorities.includes(priority as NeedPriority)
    ? priority as NeedPriority
    : 'medium';
}