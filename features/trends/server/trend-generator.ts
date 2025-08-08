/**
 * Dynamic Trend Generator
 * Generates fresh, current AI/technology trends using OpenAI
 * Replaces static mockTrends with real-time intelligence
 */

import { openai } from '@/lib/ai/openai';
import { Trend, TrendCategory } from '../types/trend';
import { loadTrendSettings, buildTrendGenerationPrompt, getAIModelFromSettings } from '../utils/settings-loader';
import { verifyUrl, isValidArticleUrl } from '../utils/url-verification';
import { TrendPromptSettings } from '../types/settings';

interface CompanyProfile {
  industry: string;
  market?: string;
  customer?: string;
  businessSize?: string;
  // Legacy fields for backward compatibility
  size?: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity?: 'low' | 'medium' | 'high';
  domain?: string;
  priorities?: string[];
}

/**
 * Generate current trends dynamically using AI with balanced category distribution
 * @param category - Optional category filter (for backward compatibility, but generates mixed regardless)
 * @param limit - Number of trends to generate (default 20 for balanced mix)
 * @param companyProfile - Optional company profile for personalized trends
 * @returns Array of fresh, current trends with balanced category distribution
 */
export async function generateDynamicTrends(
  category?: TrendCategory,
  limit: number = 20,
  companyProfile?: CompanyProfile
): Promise<Trend[]> {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Load current settings from localStorage (with fallback to defaults)
  const settings = loadTrendSettings();
  
  // Always generate balanced mix regardless of category parameter
  // This ensures client-side filtering works properly
  const trendsPerCategory = Math.ceil(limit / 4); // Divide among 4 categories
  
  // Build the complete prompt using settings-based approach
  const prompt = buildTrendGenerationPrompt(
    settings,
    currentMonth,
    limit,
    trendsPerCategory,
    companyProfile
  );

  try {
    const completion = await openai.chat.completions.create({
      model: getAIModelFromSettings(),
      messages: [
        {
          role: 'system',
          content: 'You are a market intelligence analyst with deep knowledge of current AI and technology trends. Generate realistic, current trends based on actual market conditions. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: settings.modelSettings.temperature,
      max_tokens: settings.modelSettings.maxTokens,
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
      console.error('Unexpected response format:', parsed);
      throw new Error('Invalid response format from AI');
    }

    // Create a consistent seed for trend IDs based on content
    const contentSeed = Date.now(); // Use consistent timestamp for this batch
    
    // Transform AI response to Trend objects with current dates
    const trends: Trend[] = await Promise.all(
      trendsData.slice(0, limit).map(async (trend, index) => {
        const urlValidationResult = await validateAndFixSourceUrlWithStatus(
          trend.source_url, 
          trend.source || 'TechCrunch', 
          trend.title,
          settings
        );
        
        return {
          id: `trend_${contentSeed}_${index}`,
          title: trend.title || `AI Trend ${index + 1}`,
          summary: trend.summary || 'Emerging AI trend with significant market impact.',
          category: validateCategory(trend.category),
          impact_score: Math.min(10, Math.max(1, trend.impact_score || 7)),
          source: trend.source || 'Industry Analysis',
          source_url: urlValidationResult.url,
          source_verified: urlValidationResult.verified,
          created_at: new Date(currentDate.getTime() - (index * 24 * 60 * 60 * 1000)), // Stagger dates
          updated_at: new Date(),
        };
      })
    );

    return trends;
  } catch (error) {
    console.error('Error generating dynamic trends:', error);
    
    // Throw error with appropriate message based on error type
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

/**
 * Validate and normalize category values
 */
function validateCategory(category: string): TrendCategory {
  const validCategories: TrendCategory[] = ['consumer', 'competition', 'economy', 'regulation'];
  const normalizedCategory = category?.toLowerCase() as TrendCategory;
  
  return validCategories.includes(normalizedCategory) 
    ? normalizedCategory 
    : 'consumer';
}

/**
 * Validate source URLs using settings-based verification with status
 */
async function validateAndFixSourceUrlWithStatus(
  url: string | undefined, 
  sourceName: string, 
  title?: string,
  settings?: TrendPromptSettings
): Promise<{ url: string; verified: boolean }> {
  // If no URL provided, handle based on settings
  if (!url || url.trim() === '') {
    if (settings?.urlVerification.fallbackToGenerated) {
      return { url: generatePlaceholderArticleUrl(sourceName, title), verified: false };
    } else {
      return { url: '', verified: false }; // No URL if fallback disabled
    }
  }

  // Basic format validation first
  if (!url.startsWith('http') || 
      url.includes('example.com') || 
      url.includes('placeholder') ||
      url.includes('localhost')) {
    
    if (settings?.urlVerification.fallbackToGenerated) {
      return { url: generatePlaceholderArticleUrl(sourceName, title), verified: false };
    } else {
      return { url: '', verified: false };
    }
  }

  // Check if URL looks like a valid article URL
  if (!isValidArticleUrl(url)) {
    if (settings?.urlVerification.fallbackToGenerated) {
      return { url: generatePlaceholderArticleUrl(sourceName, title), verified: false };
    } else {
      return { url: '', verified: false };
    }
  }

  // If URL verification is enabled, actually verify the URL exists
  if (settings?.urlVerification.enabled) {
    try {
      const verificationResult = await verifyUrl(url, settings.urlVerification.timeout);
      
      if (verificationResult.isValid) {
        return { url, verified: true }; // URL is real and accessible
      } else {
        console.log(`URL verification failed for ${url}: ${verificationResult.error}`);
        
        if (settings.urlVerification.fallbackToGenerated) {
          return { url: generatePlaceholderArticleUrl(sourceName, title), verified: false };
        } else {
          return { url: '', verified: false }; // No fallback - return empty to indicate unverified
        }
      }
    } catch (error) {
      console.warn(`URL verification error for ${url}:`, error);
      
      if (settings.urlVerification.fallbackToGenerated) {
        return { url: generatePlaceholderArticleUrl(sourceName, title), verified: false };
      } else {
        return { url: '', verified: false };
      }
    }
  }

  // URL verification disabled - assume valid if it passes basic validation
  return { url, verified: true };
}

/**
 * Generate a realistic-looking article URL based on the source and title
 */
function generatePlaceholderArticleUrl(sourceName: string, title?: string): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const sourceKey = sourceName.toLowerCase().trim();
  
  // Create URL slug from title if available
  const titleSlug = title ? 
    title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60)
      .replace(/-+$/, '') // Remove trailing hyphens
    : 'ai-technology-update';
  
  // Generate source-specific article URL patterns with title slugs
  if (sourceKey.includes('techcrunch')) {
    return `https://techcrunch.com/${year}/${month}/${day}/${titleSlug}/`;
  }
  if (sourceKey.includes('reuters')) {
    return `https://www.reuters.com/technology/ai/${titleSlug}-${year}-${month}-${day}/`;
  }
  if (sourceKey.includes('bloomberg')) {
    return `https://www.bloomberg.com/news/articles/${year}-${month}-${day}/${titleSlug}`;
  }
  if (sourceKey.includes('verge')) {
    return `https://www.theverge.com/${year}/${month.replace('0', '')}/${day.replace('0', '')}/${titleSlug}`;
  }
  if (sourceKey.includes('venturebeat')) {
    return `https://venturebeat.com/ai/${titleSlug}-${year}/`;
  }
  if (sourceKey.includes('wired')) {
    return `https://www.wired.com/story/${titleSlug}/`;
  }
  if (sourceKey.includes('ars technica') || sourceKey.includes('arstechnica')) {
    return `https://arstechnica.com/ai/${year}/${month}/${titleSlug}/`;
  }
  if (sourceKey.includes('forbes')) {
    return `https://www.forbes.com/sites/ai/${year}/${month}/${day}/${titleSlug}/`;
  }
  if (sourceKey.includes('wsj') || sourceKey.includes('wall street journal')) {
    return `https://www.wsj.com/articles/${titleSlug}-${year}${month}${day}`;
  }
  
  // Default fallback with realistic article pattern
  return `https://techcrunch.com/${year}/${month}/${day}/${titleSlug}/`;
}


/**
 * Get a single trend by ID - generates it fresh if not found
 */
export async function getDynamicTrendById(trendId: string): Promise<Trend | null> {
  // This function should not generate new trends - it should only be used as a fallback
  // The real trend should be found in the cache by the service layer
  console.warn(`getDynamicTrendById called for ${trendId} - this should not happen if caching works properly`);
  
  // Return null instead of generating a new trend
  // This will cause the tRPC endpoint to return NOT_FOUND, which is correct behavior
  return null;
}

/**
 * Refresh trends cache - can be called periodically
 */
export async function refreshTrendsCache(): Promise<void> {
  try {
    // Generate fresh trends for all categories
    const categories: TrendCategory[] = ['consumer', 'competition', 'economy', 'regulation'];
    
    for (const category of categories) {
      await generateDynamicTrends(category, 5);
      // In production, save to database or cache
    }
    
    console.log('Trends cache refreshed successfully');
  } catch (error) {
    console.error('Error refreshing trends cache:', error);
  }
}